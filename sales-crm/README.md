# SalesOS CRM starter

A polished React/Vite frontend prototype for a lead-management CRM.

## Run
npm install
npm run dev

## Included
- Enrollment-aware fresh-lead filtering
- Sales queue
- Lead search and status filters
- Lead profile drawer
- Power-dialer workflow simulation
- Manual call outcomes
- Responsive admin UI

## Production next step
Replace the in-memory arrays with Supabase tables and replace startDial() with a telephony-provider backend endpoint. The backend should receive provider webhooks and write call events/idempotency keys to the database.
