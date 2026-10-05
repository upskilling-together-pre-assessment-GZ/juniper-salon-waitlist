import { condition, defineQuery, defineUpdate, setHandler, proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';
import type {OpeningInput, SalonStatus, Reply, ReplyResult, Offer} from './types';
const {sendOffer} = proxyActivities<typeof activities>({startToCloseTimeout:'10 seconds',retry:{maximumAttempts:1}});
export const getStatus = defineQuery<SalonStatus>('getStatus');
export const respond = defineUpdate<ReplyResult,[Reply]>('respond');
export const staffAction = defineUpdate<ReplyResult,[string]>('staffAction');
export async function salonWorkflow(id:string, opening:OpeningInput):Promise<SalonStatus> {
 const start = new Date(opening.startsAt).getTime();
 const end = start + opening.durationMinutes*60000;
 const eligible = opening.clients.filter(c=>c.service===opening.service && (c.stylist==='Any'||c.stylist===opening.stylist) && new Date(c.availableFrom).getTime()<=start && new Date(c.availableTo).getTime()>=end).sort((a,b)=>a.joinedAt.localeCompare(b.joinedAt));
 const s:SalonStatus={id,opening,phase:'sending',offers:[],eligible:[...eligible],message:'Preparing the first invitation.',events:[]};
 let decision:string|undefined;
 const log=(message:string)=>{s.message=message;s.events.push({at:Date.now(),message});};
 const terminal=()=>['filled','cancelled','unfilled'].includes(s.phase);
 setHandler(getStatus,()=>s);
 setHandler(respond,(reply)=>{
  const o=s.offers.find(o=>o.id===reply.offerId);
  if(terminal()||s.phase!=='waiting'||!o||o.id!==s.currentOfferId||o.outcome!=='waiting'||!o.deadline||Date.now()>=o.deadline) return {accepted:false,message:'This offer is no longer available. Your original appointment has not changed.'};
  o.outcome=reply.action==='accept'?'accepted':'declined';
  if(reply.action==='accept'){s.phase='filled';s.reservedFor=o.client.name;log(`${o.client.name} reserved this opening. Update their later appointment separately in Square.`);} else log(`${o.client.name} declined. Moving to the next eligible client.`);
  return {accepted:true,message:reply.action==='accept'?'Your earlier appointment is reserved. The salon will handle your existing booking separately.':'Thank you for letting us know. Your existing appointment has not changed.'};
 });
 setHandler(staffAction,(action)=>{
  if(terminal())return {accepted:false,message:'This opening is already closed.'};
  if(action==='cancel'||action==='fill'){
   s.phase=action==='cancel'?'cancelled':'filled';if(action==='fill')s.reservedFor='Booked by staff';
   const o=s.offers.find(o=>o.id===s.currentOfferId);if(o&&o.outcome!=='accepted')o.outcome='closed';
   log(action==='cancel'?'Opening cancelled by staff. All offers are closed.':'Filled by staff. All outstanding offers are closed.');return {accepted:true,message:s.message};
  }
  if(s.phase!=='attention'||!['retry','skip'].includes(action)||decision)return {accepted:false,message:'This action is not available now.'};
  decision=action;log(action==='retry'?'Staff chose to retry delivery.':'Staff chose to skip this client.');return {accepted:true,message:s.message};
 });
 for(const client of eligible){
  if(terminal())break;
  if(Date.now()>=start){s.phase='unfilled';log('The appointment start time has passed. Offers stopped.');break;}
  s.eligible=s.eligible.filter(c=>c.id!==client.id);
  const offer:Offer={id:`${id}-${s.offers.length+1}`,client,outcome:'sending',attempts:0};s.offers.push(offer);s.currentOfferId=offer.id;
  let delivered=false;
  while(!delivered&&!terminal()){
   s.phase='sending';offer.outcome='sending';offer.attempts++;log(`Preparing simulated invitation for ${client.name}.`);
   try{await sendOffer({name:client.name,fail:!!client.failDelivery,attempt:offer.attempts});delivered=true;}
   catch{if(terminal())break;s.phase='attention';offer.outcome='delivery_failed';log(`Delivery to ${client.name} failed. Offers paused; retry, skip, or stop.`);decision=undefined;
    const resumed=await condition(()=>!!decision||terminal(),Math.max(1,start-Date.now()));
    if(terminal())break;if(!resumed){s.phase='unfilled';log('The appointment start time has passed. Offers stopped.');break;}
    if(decision==='skip'){offer.outcome='skipped';break;}
   }
  }
  if(terminal())break;if(!delivered)continue;
  s.phase='waiting';offer.outcome='waiting';offer.deadline=Math.min(Date.now()+opening.offerSeconds*1000,start);log(`Waiting for ${client.name}. This offer is exclusive until its deadline.`);
  await condition(()=>offer.outcome!=='waiting'||terminal(),Math.max(1,offer.deadline-Date.now()));
  if(terminal())break;
  if(offer.outcome==='waiting'){offer.outcome='expired';log(`${client.name}'s offer expired. Moving to the next eligible client.`);}
 }
 if(!terminal()){s.phase='unfilled';log('No eligible clients remain. This opening is unfilled.');}
 s.currentOfferId=undefined;
 return s;
}
