# Local execution evidence

- `temporal-web-ui.jpg`: actual completed `salonWorkflow`, Task Queue `juniper-salon`, 31 history events. The demonstrated flow sent Maya an exclusive offer, recorded her decline, then reserved the opening for Eli after his acceptance.
- `temporal-history.jpg`: actual event history, including delivery activities, durable timers and Workflow Updates.
- `staff-dashboard.jpg`: current invitation, remaining eligible clients and staff closure controls.
- `staff-attention.jpg`: simulated delivery failure paused for deliberate staff action.
- `client-mobile.jpg`: responsive client offer at a 390-pixel viewport, with service, stylist, time, expiry and accept/decline buttons.

Captured locally on 2026-10-05. All salon/client data and text delivery are simulated. Temporal executions, timers, Updates and activity failures are real.

Validation: TypeScript passed; 7 integration tests passed (0 failures). Tests cover competing replies, stale offers, expiry, queue exhaustion, failure/retry/skip, staff closure, Worker restart recovery, invalid inputs and duplicate opening creation.
