// Simulation only: no SMS provider is contacted. An offer link is shown in the dashboard.
export async function sendOffer(input: {name:string; fail:boolean; attempt:number}): Promise<void> {
  if (input.fail && input.attempt === 1) throw new Error('Simulated delivery failure. Staff intervention required.');
}
