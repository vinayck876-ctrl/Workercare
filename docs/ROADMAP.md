# WorkerCare Development Roadmap

## Stage 1 - Basic board and sensor test
- [x] Create initial firmware structure
- [ ] Confirm ESP32 DevKit USB connection
- [ ] Read DHT22 ambient temperature and humidity
- [ ] Test local SOS button
- [ ] Test status LED

## Stage 2 - Motion sensing
- [ ] Connect MPU6050 / GY-521
- [ ] Read accelerometer and gyroscope values
- [ ] Log and inspect motion data
- [ ] Develop and test a cautious experimental fall-detection rule

## Stage 3 - Local alerts
- [ ] Add DRV8833 motor driver
- [ ] Add vibration reminder patterns
- [ ] Add active buzzer through a suitable driver if required
- [ ] Test SOS and warning alert patterns

## Stage 4 - Wearable integration
- [ ] Make a secure enclosure and strain-relieved wiring
- [ ] Evaluate battery and charging requirements
- [ ] Test runtime, heat, and water resistance safely
- [ ] Document limitations and test results

## Stage 5 - Optional connectivity
- [ ] Decide whether phone-based or Wi-Fi/cellular communication is appropriate
- [ ] Add recipient configuration and consent
- [ ] Test delivery and failure handling before relying on alerts

## Validation notes

- DHT22 provides ambient temperature and relative humidity only.
- Fall detection is experimental and needs real-world validation; false positives and missed events are possible.
- A prototype alert is not a substitute for workplace safety procedures or emergency services.
