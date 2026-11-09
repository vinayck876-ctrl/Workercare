# WorkerCare Development Roadmap

## Stage 1 - Basic board and sensor test
- [x] Create initial firmware structure
- [ ] Confirm ESP32 DevKit USB connection
- [ ] Read DHT22 ambient temperature and humidity
- [ ] Test local SOS button (GPIO 13)
- [ ] Test status LED

## Stage 2 - Motion sensing
- [x] Add MPU6050 firmware integration groundwork (I2C GPIO 21/22)
- [ ] Verify sensor readings on the actual board
- [ ] Calibrate and safely test the experimental fall heuristic
- [ ] Measure false-positive and missed-event behavior

## Stage 3 - Supabase connected prototype
- [x] Define PostgreSQL schema and row-level security
- [x] Add device-specific token verification
- [x] Add device-ingest Edge Function
- [x] Add ESP32 HTTPS telemetry firmware groundwork
- [ ] Create and configure the Supabase project
- [ ] Provision test users, workers, assignments and device credentials
- [ ] Deploy Edge Function and verify a real sensor reading reaches the database
- [ ] Connect React login and dashboards to Supabase Auth and Realtime
- [ ] Test supervisor, family and worker permissions separately

## Stage 4 - Local alerts and wearable integration
- [ ] Add DRV8833 motor driver and vibration reminders
- [ ] Add active buzzer through a suitable driver if required
- [ ] Verify local SOS behavior when Wi-Fi is unavailable
- [ ] Finalize battery, enclosure, strain relief and water resistance tests

## Stage 5 - Notification and operational readiness
- [ ] Add recipient consent and verified contact details
- [ ] Add and test notification/escalation delivery (SMS, push or another selected channel)
- [ ] Define who acknowledges an alert and expected response procedures
- [ ] Configure backups, retention, monitoring and incident review

## Validation and safety
- DHT22 measures ambient air temperature and relative humidity only.
- Fall detection is experimental; false positives and missed events are possible.
- An alert stored in Supabase is not proof that a human received or acted on it.
- WorkerCare is an educational prototype, not a certified medical or emergency-response device.
