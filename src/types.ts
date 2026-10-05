export type ClientEntry = { id: string; name: string; mobile: string; service: string; stylist: string; availableFrom: string; availableTo: string; joinedAt: string; failDelivery?: boolean };
export type OpeningInput = { service: string; stylist: string; startsAt: string; durationMinutes: number; offerSeconds: number; clients: ClientEntry[] };
export type Offer = { id: string; client: ClientEntry; outcome: 'sending'|'waiting'|'declined'|'expired'|'accepted'|'delivery_failed'|'skipped'|'closed'; deadline?: number; attempts: number };
export type SalonStatus = { id: string; opening: OpeningInput; phase: 'sending'|'waiting'|'attention'|'filled'|'cancelled'|'unfilled'; offers: Offer[]; eligible: ClientEntry[]; currentOfferId?: string; reservedFor?: string; message: string; events: {at:number;message:string}[] };
export type Reply = {offerId:string; action:'accept'|'decline'};
export type ReplyResult = {accepted:boolean; message:string};
