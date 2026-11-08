# WorkerCare Web Software

## Current implementation

The web dashboard is a React + Vite single-page application. It includes:
- A three-choice demo login: Supervisor, Family member and Worker.
- Six built-in demo profiles mapped to those three account types.
- Session-only login and sign-out (no database).
- Overview cards, environmental chart, site readings and worker directory.
- Live monitoring page with sample environmental values.
- Alerts page with local acknowledge actions and simulated SOS test.
- Device inventory with sample battery values.
- Responsive desktop and mobile navigation.

## Demo login accounts

Choose the matching account type on the login screen.

| Account type | Username | Password | Description |
|---|---|---|---|
| Supervisor | supervisor | super123 | Manages the North Site demo workers |
| Family | family1 | family123 | Views the linked street vendor demo profile |
| Family | family2 | family456 | Alternate family demo account |
| Worker | vendor | vendor123 | Street vendor demo profile |
| Worker | worker1 | worker123 | Construction worker demo profile |
| Worker | worker2 | worker456 | Construction worker demo profile |

## Authentication and security limitations

The six demo accounts are hardcoded in src/Login.jsx. A successful login is kept in browser sessionStorage and cleared on sign-out or when the browser session ends. No database or backend is used.

This is not real authentication. The credentials are visible in the frontend bundle and role selection can be bypassed. Use only for a classroom/demo prototype; do not store personal, worker, health, family or location data. Production use requires server-side authentication, server-enforced role permissions, secure password hashing, and a database.

## Role behavior in the current demo

- Supervisor: sees the two sample workers assigned to the North Site.
- Family member: sees the linked street vendor sample profile.
- Worker: sees their own sample worker profile. The Worker role covers both street vendors and construction workers.

These are demonstration relationships, not editable or persisted assignments.

## Demo data limitations

Worker profiles, device status, battery values, sensor readings and alerts are illustrative local data. They are not received from the ESP32. The SOS test only adds a browser-side demo alert and does not contact anyone or emergency services. Geolocation, worker history, real notifications and device connectivity are not implemented yet.

## Run locally

Requirements: Node.js 18 or newer.

    npm install
    npm run dev

## Vercel deployment

Connect repository vinayck876-ctrl/Workercare to a Vercel project.

- Framework preset: Vite
- Build command: npm run build
- Output directory: dist
- Install command: npm install

The repository includes vercel.json for SPA routing. A commit merged to the connected production branch (normally main) should trigger a deployment if Vercel Git integration is enabled.
