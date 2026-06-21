# Reservations (OpenTable) — how to connect

EBE can make restaurant reservations. Booking a table is a real commitment, so it always goes
through the **confirm-first approval gate**: EBE lines up the reservation → you approve → it opens
the booking to confirm.

## The reality of OpenTable
OpenTable has **no open public booking API**. Access is partner-gated:
- Apply at **opentable.com/restaurant-solutions/api-partners** (≈3–4 week approval; a sandbox is available).
- Even approved partners **can't fully complete a booking server-side** — the diner finishes on
  OpenTable's interface. Partners get **availability + booking links**.

So EBE is built provider-pluggable:

| Mode | Needs | What happens |
|---|---|---|
| **Auto-book by email (hands-off)** | restaurant's email + `RESEND_API_KEY` + `EBE_FROM_EMAIL` | After your approval, EBE **emails the reservation request straight to the restaurant** and tells you when they confirm. No tapping. The legit way to "just book it" without an OpenTable partnership. |
| **Link (default, no key)** | nothing | EBE creates a one-tap OpenTable link prefilled with restaurant/date/time/party. You approve → it opens → you confirm. |
| **Partner API (later)** | `OPENTABLE_API_TOKEN` (after approval) | Live availability + booking links via your approved app + a restaurant `rid`. |
| **Other providers** | add a provider | Resy / Google "Reserve with Google" drop in the same way. |

> Why not fully automatic via OpenTable with no key? OpenTable offers **no public endpoint to
> submit a reservation**, and scripting their site violates their terms (and gets blocked). The
> legitimate hands-off path is **EBE contacting the restaurant directly** (email above), or an
> OpenTable partnership.

## Use it
Say or type a natural request:
- *"Book a table at Carbone for 2 tomorrow at 7:30pm"*
- *"Reserve Nobu for 4 on Friday"*

EBE parses it, queues the reservation (Approvals tab), and gives a confirm link. Or call the API:

```bash
curl -X POST localhost:8080/api/orb/reserve -H 'content-type: application/json' -d '{
  "userId":"you@email.com","restaurant":"Carbone","date":"2026-06-25","time":"19:30","partySize":2,"city":"New York"
}'
```

Response includes the queued `action` (status `pending`, `requiresApproval: true`) and a prefilled
`link`. Approve it in the panel → `POST /api/orb/actions/:id/execute` runs the `reservations`
connector, which returns the booking link (or, once your partner token is set, the partner booking).

## To enable in-app OpenTable booking
1. Apply: opentable.com/restaurant-solutions/api-partners → get partner credentials.
2. Put `OPENTABLE_API_TOKEN` (and `OPENTABLE_PARTNER_ID`) in `apps/api/.env`.
3. Wire the availability/booking call in `services/reservations.ts` (`bookReservation`) using your
   approved endpoint + the restaurant `rid`. The confirm-first gate and the connector are already in place.

Code: `services/reservations.ts`, `connectors/reservations.ts`, route `POST /api/orb/reserve`.
