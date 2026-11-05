# WorkerCare Web Software

## Current implementation

The web dashboard is a React + Vite single-page application. It includes:
- Professional responsive sign-in screen with five built-in demo accounts.
- Session-only login and sign-out (no database).
- Overview cards, environmental chart, site readings and worker directory.
- Live monitoring page with sample environmental values.
- Alerts page with local acknowledge actions and simulated SOS test.
- Device inventory with sample battery values.
- Responsive desktop and mobile navigation.

## Demo login accounts

| Role | Username | Password |
|---|---|---|
| Administrator | `admin` | `admin123` |
| North Site Supervisor | `supervisor1` | `site123` |
| Market Site Supervisor | `supervisor2` | `site123` |
| Safety Officer | `safety` | `safety123` |
| Demo Viewer | `demo` | `demo123` |

Click an account on the login screen to autofill its username and password.

## No database

The five accounts are hardcoded in `src/Login.jsx`. A successful login is kept in browser `sessionStorage` and cleared on sign-out or when the browser session ends. No database or backend is used.

**Security limitation:** this is not real authentication. The credentials are visible in the frontend bundle and can be bypassed by a technically capable user. Use only for a classroom/demo prototype; do not store personal, worker, health, or other sensitive information.

## Demo data limitations

Worker profiles, device status, battery values, sensor readings, and alerts are illustrative local data. They are not received from the ESP32. The SOS test only adds a browser-side demo alert and does not contact anyone or emergency services.

## Run locally

Requirements: Node.js 18 or newer.

```bash
npm install
npm run dev
```

## Vercel deployment

Connect the GitHub repository `vinayck876-ctrl/Workercare` to a Vercel project.

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

The repository includes `vercel.json` for SPA routing. New commits to the connected production branch (normally `main`) should trigger a deployment if Vercel Git integration is enabled.
