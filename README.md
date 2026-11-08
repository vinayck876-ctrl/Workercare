# WorkerCare

An affordable wearable safety prototype designed to help outdoor and informal workers respond to environmental heat risk and request assistance.

## Selected architecture

- **Frontend:** React + Vite (existing responsive dashboard)
- **Backend:** Supabase PostgreSQL, Authentication, Row Level Security and Realtime
- **Device ingestion:** Supabase Edge Function authenticated with a unique per-device token
- **Wearable:** ESP32 DevKit V1 (ESP-WROOM-32), DHT22, MPU6050 and SOS pushbutton

Flask and MySQL are not part of the selected architecture.

## Hardware plan

| Part | Purpose | Status |
|---|---|---|
| ESP32 DevKit V1 | Main controller | Selected |
| DHT22 | Ambient temperature and relative humidity | Available |
| MPU6050 / GY-521 | Experimental motion/fall heuristic | Available |
| SOS pushbutton | Worker-initiated emergency alert | Available |
| Coin vibration motor + driver | Haptic reminders | Driver/wiring pending |
| Active buzzer | Local audible alert | Wiring pending |
| Battery and enclosure | Portable wearable | To be finalized |

Current pin plan: DHT22 data GPIO 4; MPU6050 SDA/SCL GPIO 21/22; SOS GPIO 13; status LED GPIO 2. Confirm wiring against the exact board before powering it.

## Repository implementation status

- Supabase schema and row-level security migration: added
- Device token verification and telemetry Edge Function: added
- React Supabase client and data-access helpers: added
- ESP32 HTTPS telemetry firmware groundwork: added
- Existing dashboard conversion from demo data to Supabase: not yet completed
- Supabase project provisioning and live end-to-end test: not yet completed

See [Supabase setup](docs/SUPABASE_SETUP.md), [device setup](docs/DEVICE_SETUP.md), [software notes](docs/SOFTWARE.md), [wiring](docs/WIRING.md), and [roadmap](docs/ROADMAP.md).

## Run the web application

Requirements: Node.js 18 or newer.

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` after creating the Supabase project. Do not put the service-role key in any frontend variable.

For Vercel, use the Vite preset, build command `npm run build`, and output directory `dist`. Add the same two public Supabase environment variables in Vercel project settings.

## Safety and limitations

WorkerCare is an educational prototype, not a certified medical or emergency-response device. DHT22 measures **ambient air temperature and relative humidity**; it does not measure body temperature, hydration, or medical condition. MPU6050 fall detection is experimental and may produce false positives or miss a fall.

An SOS event is stored as an alert in Supabase. This implementation does not automatically call, SMS, contact emergency services or guarantee that a human receives/responds to an alert. Configure and test real notification/escalation channels before relying on the system.