# WorkerCare Web Software

## Selected architecture

The frontend is React + Vite. Supabase provides PostgreSQL, Authentication, Row Level Security and Realtime. ESP32 devices send telemetry to a Supabase Edge Function using individual device credentials.

## Current dashboard state

The existing dashboard is still a local demonstration:
- Overview cards and environmental chart use illustrative values.
- Worker directory and device inventory use local sample data.
- Alert acknowledgement and SOS test are browser-side only.
- Existing login is demo-only and is not Supabase authentication.

The Supabase client and data-access helpers have been added, but the UI must still be migrated to use Supabase Auth and live queries. Do not enter real worker or sensitive information until that work is complete and tested.

## Supabase implementation

- Database migration: `supabase/migrations/202611080001_worker_care_schema.sql`
- Device ingestion: `supabase/functions/device-ingest/index.ts`
- Browser client: `src/lib/supabase.js`
- Data access helpers: `src/lib/workerCareApi.js`

Follow [Supabase setup](SUPABASE_SETUP.md) and [device setup](DEVICE_SETUP.md).

## Local development

Requirements: Node.js 18 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set the Supabase URL and publishable/anon key in `.env.local`. Never use the service-role key in the browser.

## Deployment

For Vercel use the Vite preset, `npm run build`, and `dist`. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel project settings.

## Security notes

- New accounts receive the least-privileged worker role.
- Privileged roles and worker assignments must be provisioned by a trusted administrator.
- Row Level Security restricts access to assigned workers.
- Device secrets are stored as SHA-256 hashes in the private schema.
- The service-role key is used only by the Edge Function.
- A database alert is not proof that a person received or acted on an SOS.
