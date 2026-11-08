# WorkerCare ESP32 → Supabase setup

Target board: **ESP32 DevKit V1 (ESP-WROOM-32)**.

## Wiring
| Component | ESP32 DevKit V1 |
|---|---|
| DHT22 data | GPIO 4 |
| MPU6050 SDA | GPIO 21 |
| MPU6050 SCL | GPIO 22 |
| SOS button | GPIO 13 to GND (INPUT_PULLUP) |
| Status LED | GPIO 2 (verify onboard LED) |

Do not connect a vibration motor directly to an ESP32 GPIO. Use a suitable motor driver and verify the supply/current before connecting a motor or buzzer.

## Arduino IDE libraries
Install ESP32 by Espressif Systems, DHT sensor library by Adafruit, Adafruit Unified Sensor, Adafruit MPU6050 and Adafruit BusIO (if prompted). Select **ESP32 Dev Module**.

## Local firmware configuration
Copy firmware/worker_care_supabase/config.example.h to config.h in the same folder. Fill in Wi-Fi SSID/password, Supabase Edge Function URL, device code, unique device token and the trusted root CA certificate for the Supabase endpoint. config.h is ignored by Git. Never commit real credentials.

Firmware validates TLS certificates. Do not replace certificate validation with setInsecure(). Certificate rotation may require a firmware update.

## Telemetry protocol
POST to:
https://YOUR_PROJECT_REF.supabase.co/functions/v1/device-ingest

Headers: x-device-code, x-device-token, Content-Type: application/json.

Example body:
~~~json
{
  "ambient_temp_c": 34.8,
  "relative_humidity": 66.0,
  "sos": false,
  "fall_detected": false
}
~~~

The Edge Function authenticates the device, stores readings, updates last-seen state and creates SOS, possible-fall and environmental threshold alerts.

## Safety limits
The MPU6050 acceleration rule is experimental and can produce false positives or miss falls. Test only with safe, controlled movements. DHT22 measures ambient temperature and relative humidity only; it does not measure body temperature, hydration or medical status.

An SOS event becomes a WorkerCare database alert. This prototype does not call, SMS, contact emergency services or guarantee a human response. Notification and escalation channels must be added and tested before relying on them.
