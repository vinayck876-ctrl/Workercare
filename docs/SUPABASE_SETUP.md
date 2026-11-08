# WorkerCare Supabase setup

The selected stack is **React + Vite + Supabase (PostgreSQL, Auth and Realtime)**. Flask and MySQL are not used.

## 1. Create a Supabase project
1. Create a project in the Supabase dashboard and save the database password securely.
2. Open Project Settings → API and copy the Project URL and publishable/anon key.
3. Never put the service-role key in browser code, firmware, GitHub or a VITE_ variable.

## 2. Apply the database migration
For a new project, open SQL Editor → New query, paste supabase/migrations/202611080001_worker_care_schema.sql and run it once.

CLI alternative:
~~~bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
~~~

## 3. Configure the frontend
Create .env.local in the repository root (ignored by Git):
~~~env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
~~~
Then run:
~~~bash
npm install
npm run dev
~~~
The publishable/anon key is intended for browser use; RLS protects the rows. Never use the service-role key in frontend code.

## 4. Authentication and roles
Enable Email under Authentication → Providers. Configure email confirmation and trusted SMTP before production use. New users receive the least-privileged worker role. A trusted administrator must provision supervisor/family roles and assignments; public sign-up must not let a user choose a privileged role.

Example staff provisioning after verifying the account:
~~~sql
update public.profiles set role = 'supervisor'
where id = (select id from auth.users where email = 'supervisor@example.com');
~~~
Create sites and workers from SQL Editor or a future admin-only screen. Link a worker login through workers.auth_user_id. Add family/supervisor assignments only after verifying the relationship and consent.

## 5. Deploy the device Edge Function
Set project secrets:
~~~bash
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
supabase functions deploy device-ingest --no-verify-jwt
~~~
The function uses per-device tokens, not user JWTs. The service-role key stays inside Supabase Edge Function secrets.

## 6. Provision a device
Generate a token and SHA-256 hash locally:
~~~bash
node scripts/hash-device-token.mjs
~~~
Create the device and note its returned UUID:
~~~sql
insert into public.devices (device_code, worker_id, label)
values ('WC-ESP32-001', 'YOUR_WORKER_UUID', 'WorkerCare wearable')
returning id;
~~~
Store the hash, not the token, in the private credential table:
~~~sql
insert into private.device_credentials (device_id, token_sha256)
values ('YOUR_DEVICE_UUID', 'PASTE_SHA256_HASH_HERE');
~~~
Put the original token only in the local firmware config. Never commit it.

## 7. Security checklist
- Test supervisor, family and worker accounts separately.
- Verify each account can see only its assigned workers and related records.
- Keep the service-role key server-side.
- Configure backups, retention, rate limits and monitoring.
- Obtain worker consent and document who responds to alerts.

## Current implementation boundary
This repository now contains the schema/RLS migration, device Edge Function, browser data helpers and ESP32 connectivity firmware groundwork. The existing dashboard still uses demo data until the UI is integrated and tested against a configured Supabase project. A database alert does not prove that a person received or acted on an SOS.
