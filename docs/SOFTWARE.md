# WorkerCare Web Software

## Current implementation

The web dashboard is a React + Vite single-page application. It includes:
- Overview cards for monitored workers, safe workers, open alerts, and device inventory.
- Environmental overview chart and sample site readings.
- Worker directory with search.
- Live monitoring page with sample environmental values.
- Alerts page with local acknowledge actions and a simulated SOS test.
- Device inventory with sample battery values.
- Responsive desktop and mobile navigation.

## Important: demo mode

All dashboard worker, device, sensor, and alert values are local illustrative data. They are not coming from the ESP32 and do not represent real workers. The SOS test only adds a browser-side demo alert. It does not send messages or contact emergency services.

## Run locally

Requirements: Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Vercel deployment

Import `vinayck876-ctrl/Workercare` into Vercel, or ensure the existing Vercel project is linked to this repository.

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

The included `vercel.json` rewrites application routes to the Vite entry point.

## Next integration stage

Before showing live device data, add a backend endpoint and persistent database. The ESP32 should send authenticated readings over HTTPS or MQTT through a suitable broker/API. Do not place database service-role keys or device secrets in frontend code. Configure secrets as Vercel environment variables and validate device identity and payloads on the server.

Potential next steps:
1. Define the worker/device data model.
2. Add Supabase project and schema, or another backend.
3. Add authenticated API ingestion for ESP32 readings.
4. Replace demo data with database subscriptions/polling.
5. Add real notification delivery and test it safely.
