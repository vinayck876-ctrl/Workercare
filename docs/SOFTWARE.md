# WorkerCare Web Software

## Selected architecture

The frontend is React + Vite. Supabase provides PostgreSQL, Authentication, Row Level Security and Realtime. ESP32 devices send telemetry to a Supabase Edge Function using individual device credentials.

## Dashboard modes

- When VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured, the app uses Supabase email/password authentication and the connected dashboard in src/SupabaseApp.jsx.
- When those variables are absent, the app shows the original local demo dashboard and its demo-only login.

The connected dashboard reads the signed-in user's profile, RLS-authorized workers, devices, sensor readings and alerts. It subscribes to Realtime changes and supports staff alert acknowledgement. It does not create a fake SOS from the browser; SOS events are sent by an authenticated wearable device.

## Supabase implementation

- Database migration: supabase/migrations/202611080001_worker_care_schema.sql
- Device ingestion: supabase/functions/device-ingest/index.ts
- Browser client: src/lib/supabase.js
- Data access helpers: src/lib/workerCareApi.js
- Connected dashboard: src/SupabaseApp.jsx

Follow [Supabase setup](SUPABASE_SETUP.md) and [device setup](DEVICE_SETUP.md).

## Local development

Requirements: Node.js 18 or newer.

~~~bash
npm install
cp .env.example .env.local
npm run dev
~~~

Set the Supabase URL and publishable/anon key in .env.local. Never use the service-role key in the browser.

## Deployment

For Vercel use the Vite preset, npm run build, and dist. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel project settings.

## Security notes

- New accounts receive the least-privileged worker role.
- Privileged roles and worker assignments must be provisioned by a trusted administrator.
- Row Level Security restricts access to assigned workers.
- Device secrets are stored as SHA-256 hashes in the private schema.
- The service-role key is used only by the Edge Function.
- A database alert is not proof that a person received or acted on an SOS.

## Validation status

Source files and configuration have been added to the feature branch. A real Supabase project has not yet been configured, the Edge Function has not been deployed, and the React build/firmware compile have not been run in this environment. Complete the setup and test steps before using real worker data.
