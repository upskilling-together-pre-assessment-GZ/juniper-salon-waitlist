# Juniper Salon — Upskilling Together Post-Assessment

A warm front-desk dashboard and mobile invitation page for Lena and Carla. The prototype replaces spreadsheet follow-ups with exclusive waitlist offers coordinated by **Temporal**. Built from the supplied starter by cloning and pushing to a new public repository; this repository is not a fork.

## Run locally with one command

Requirements: **Node.js 20+** and **Docker Desktop installed and running**. From the repository root:

```bash
npm ci && npm run dev
```

The command installs locked dependencies and starts the local Temporal server, Worker, and API.

- Salon dashboard: http://localhost:3000
- Temporal Web UI: http://localhost:8233
- Stop application processes: Ctrl+C. Stop the Temporal container: `npm run stop`.
- Temporal data is persisted in a Docker volume. Restarting does not reset invitations.

**Do not deploy publicly.** This is a local assessment prototype with simulated data, no authentication, and no real SMS or Square integration.

## Try the prototype

1. Leave Haircut / Carla selected, choose a future appointment, and use the **15-second quick demo** window to observe expiry without waiting 15 minutes. The regular window is **15 minutes**.
2. Start invitations. Maya, Eli, then Sofia match the default opening; Nora is excluded because her service and stylist differ. Matching checks the full appointment fits within availability, honors required stylist preferences, and sorts by waitlist join time.
3. Open the client invitation in a separate tab. Accept or decline. Acceptance reserves the opening automatically; decline or timeout advances to the next eligible client. Reopen an old invitation to see that it cannot accept after expiry, staff closure, or reservation.
4. Check **Simulate first invitation delivery failure** on a new opening (use a different start time). The workflow pauses for **Retry delivery**, **Skip this client**, or **Cancel opening**. Retry succeeds on the second simulated attempt. It never silently skips on a sending failure.
5. **Mark filled by phone** closes outstanding offers; **Cancel opening** stops all offers. When the queue runs out or the appointment starts, the opening is unfilled.
6. Add a client to the waitlist to try other services and availability. The demo roster is saved in this browser and copied into each opening when started. Existing opening queues do not change when the roster is changed.

Staff see current offers, declined/expired/failed outcomes, remaining eligible clients, and an activity history. Both staff and invitation screens adapt to mobile. Later appointments are handled separately by staff in Square.

## What Lena confirmed

- Lena and Carla currently use Google Sheets and the salon phone; missed follow-ups leave chairs empty.
- Match service, availability, required stylist, then earliest waitlist entry.
- One exclusive offer at a time; 15 minutes for same-day replies.
- Client sees service, stylist, time, duration and expiry with accept/decline buttons.
- Acceptance reserves immediately. Late and duplicate replies must not double-book.
- Staff can cancel or mark filled, and delivery failures require deliberate intervention.
- Main goal: reliable progression without double-booking, with less repeated texting.
- A warm, calm phone experience matters alongside the front-desk computer view.

## Temporal implementation

`salonWorkflow` holds each opening's authoritative state. Activity `sendOffer` simulates delivery with a single attempt so errors pause for staff. Durable `condition` timers advance after expiry. Queries supply the dashboard; validated synchronous Workflow Updates serialize client responses and staff commands, checking offer identity, current state, and deadline before reservation. Workflow results preserve final state. The same stylist/start-time opening cannot be created twice, including through duplicate requests.

The Workflow persists through Worker restarts; the original deadline is preserved. Recoverable worker downtime resumes rather than treating it as a delivery failure. Actual activity errors pause for staff.

## Validation

Start the app first, then:

```bash
npm run typecheck
npm test
```

Seven tests run against the local Temporal server on unique test task queues. They cover competing acceptance, declined/late replies, durable expiry and exhaustion, delivery failure and retry, deliberate skip/manual closure, Worker restart recovery, and HTTP input/duplicate-creation protection. Workflow-only tests do not appear in the salon dashboard; the HTTP duplicate-creation test leaves one cancelled test opening visible.

Screenshots in `evidence/` include the actual Temporal Web UI and desktop/mobile prototype views. The customer presentation is added in the presentation step.

## Scope and practical next step

**Simulated:** text delivery and delivery failure; fictional client data; automatic reservation is recorded in Temporal only.

**Excluded:** real SMS, Square/Google Sheets connections, staff login, consent management, production client-link authorization, and full calendar conflict detection across differently timed overlapping appointments. The prototype prevents multiple reservations within each opening and duplicate creation for the same stylist/start time. It does not replace Square as a scheduling system. No messages are actually sent and no Square bookings are changed.

Next: a staff-supervised pilot with one stylist, verified client consent, a real SMS provider, secure invitation links, and a reliable Square availability check before confirming bookings. Track offer-to-reservation time, staff interventions and booking conflicts; broaden only after the flow is reliable.
