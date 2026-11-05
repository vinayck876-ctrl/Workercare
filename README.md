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
| ESP32 DevKit V1 (ESP-WROOM-32) | Main controller | Planned replacement for unstable ESP32-C3 board |
| DHT22 | Ambient temperature and humidity | Available |
| MPU6050 / GY-521 | Motion and experimental fall detection | Available; header soldered |
| Push button | SOS input | Available |
| Coin vibration motor | Haptic reminders | Available |
| DRV8833 | Motor driver | To be purchased |
| Active buzzer (3.3 V compatible) | Audible alert | To be purchased |
| LEDs and resistors | Status indication | Available |

## Firmware status

Stage 1 is a basic ESP32 DevKit firmware test for the DHT22, SOS button, and status LED. Motor control, buzzer control, MPU6050 processing, and remote notifications will be added in later stages after the exact wiring is tested.

## Safety and limitations

WorkerCare is an educational prototype, not a certified medical or emergency-response device. The DHT22 measures **ambient air temperature and relative humidity**; it does not measure body temperature, hydration, or a worker's medical condition. A local SOS indication does not contact emergency services unless a separate communication system is added and tested.

## Getting started

1. Install Arduino IDE.
2. In Boards Manager, install **esp32 by Espressif Systems**.
3. Install **DHT sensor library by Adafruit** and **Adafruit Unified Sensor** from Library Manager.
4. Open `firmware/worker_care_stage1/worker_care_stage1.ino`.
5. Select **ESP32 Dev Module** for a standard ESP32 DevKit V1.
6. Confirm the pin definitions at the top of the sketch match your board and wiring before uploading.

See [wiring notes](docs/WIRING.md) and [build stages](docs/ROADMAP.md).
