# WorkerCare

An affordable wearable safety prototype designed to help outdoor and informal workers respond to environmental heat risk and request assistance.

## Prototype goals

- Monitor ambient temperature and humidity with a DHT22 sensor.
- Provide a local heat-risk reminder (environmental guidance, not a medical measurement).
- Let the wearer trigger an SOS alert with a push button.
- Experiment with fall/motion detection using an MPU6050.
- Provide local vibration and buzzer notifications.
- Operate locally without internet for the first prototype stage.

## Current hardware plan

| Part | Purpose | Status |
|---|---|---|
| ESP32 DevKit V1 (ESP-WROOM-32) | Main controller | Selected |
| DHT22 | Ambient temperature and humidity | Available |
| MPU6050 / GY-521 | Motion and experimental fall detection | Available |
| Push button | SOS input | Available |
| Coin vibration motor | Haptic reminders | Available; not connected yet |
| Active buzzer | Audible alert | Available; volume/driver testing pending |
| GPS/GNSS module | Optional location tracking | Future addition |

## Firmware status

The firmware is under development. The user's confirmed working hardware setup is DHT22 on GPIO 4, MPU6050 SDA/SCL on GPIO 21/22, SOS button on GPIO 13, and an active buzzer intended for GPIO 25. Confirm the actual wiring before uploading any sketch.

## Safety and limitations

WorkerCare is an educational prototype, not a certified medical or emergency-response device. The DHT22 measures ambient air temperature and relative humidity; it does not measure body temperature, hydration, or a worker's medical condition. MPU6050-based fall detection is experimental and can produce false positives or miss events. A local SOS indication does not contact emergency services unless a separate communication system is added and tested.

## Getting started: firmware

1. Install Arduino IDE.
2. In Boards Manager, install esp32 by Espressif Systems.
3. Install DHT sensor library by Adafruit and Adafruit Unified Sensor from Library Manager.
4. Open firmware/worker_care_stage1/worker_care_stage1.ino.
5. Select ESP32 Dev Module for a standard ESP32 DevKit V1.
6. Confirm the pin definitions match your actual board and wiring before uploading.

See docs/WIRING.md and docs/ROADMAP.md.

## Web dashboard

A responsive React + Vite dashboard is available in src/. It currently includes a role-selecting demo login and dashboard views for overview, workers, monitoring, alerts and devices.

### Run locally

Requirements: Node.js 18 or newer.

    npm install
    npm run dev

For deployment, connect this repository to Vercel with the Vite framework preset, build command npm run build, and output directory dist.

Demo mode: worker profiles, device states, readings and alerts are illustrative local data. The SOS test only creates a browser-side demo alert and does not contact anyone. Live ESP32/backend integration has not yet been implemented.

## Prototype login accounts

Choose the matching account type on the login screen, then use one of these demo accounts.

| Account type | Username | Password | Description |
|---|---|---|---|
| Supervisor | supervisor | super123 | Manages the North Site demo workers |
| Family | family1 | family123 | Views the linked street vendor demo profile |
| Family | family2 | family456 | Alternate family demo account |
| Worker | vendor | vendor123 | Street vendor demo profile |
| Worker | worker1 | worker123 | Construction worker demo profile |
| Worker | worker2 | worker456 | Construction worker demo profile |

Security warning: These credentials are hardcoded in the public frontend source and are not secure authentication. This is only for a classroom/demo prototype. Do not use real passwords or sensitive worker information. A production version needs server-side authentication, role-based authorization and a database.
