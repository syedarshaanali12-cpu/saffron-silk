# SalesOS CRM

React/Vite CRM connected to Supabase. The UI is no longer backed by demo arrays: authenticated sessions load persisted leads, follow-ups, call logs and profiles.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, copy the example with `Copy-Item .env.example .env.local`.

## Supabase setup

Project: `setryfvduwqsllsmauyi` (region `ap-south-1`).

Set these environment variables in `.env.local` and in Netlify's environment-variable settings:

- `VITE_SUPABASE_URL` — the project's API URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — the publishable key (safe for a browser when RLS is enabled)

Never place a service-role/secret key in frontend code.

The database schema, RLS policies and signup profile trigger have already been created. The first account registered becomes the admin; subsequent accounts default to sales. Create the admin account first. After that, turn off public sign-ups in Supabase Auth settings and invite/create sales accounts intentionally.

## Import format

Export Google Sheets/Excel as CSV. Column names are flexible, but include a name and a phone/mobile number.

Lead columns: `name` / `full_name`, `phone` / `mobile`, optionally `course`, `email`, `source`.

Enrollment columns: `name` / `full_name`, `phone` / `mobile`, optionally `course`, `academic_year`.

Phone numbers are normalized to their last 10 digits. Lead imports skip numbers already in the enrollment table and numbers already present as leads. Import the yearly enrollment master first, then import leads. An enrollment import also marks matching existing leads as enrolled.

## Current working features

- Supabase email/password authentication
- Persistent lead listing, search and status updates
- Role-aware admin vs assigned-salesperson views
- CSV import for enrolled students and leads
- Duplicate and enrolled-number exclusion during lead import
- Persistent call outcome logs (manual disposition, no actual call placed)
- Follow-up scheduling and completion
- Admin lead assignment

## Not yet connected

**Telephony:** call buttons currently log a manually selected outcome; they do not initiate a phone call. A telephony provider account (for example Exotel or Knowlarity), account credentials, a server-side call-initiation endpoint, and signed/status-verified webhooks are needed for real power dialing. Keep provider secrets only in server-side environment variables. Also configure local calling/recording consent and DND/compliance rules before launch.

**Google Sheets:** import is via CSV export/upload, not a live Google Sheets API sync yet.

## Netlify deployment

Connect the GitHub repo `syedarshaanali12-cpu/saffron-silk`, branch `sales-crm`, base directory `sales-crm`, build command `npm run build`, publish directory `dist`. Set the two `VITE_SUPABASE_*` environment variables in Netlify and trigger a deploy. The CRM is isolated in a branch/subdirectory; the repository's `main` branch was not changed.
