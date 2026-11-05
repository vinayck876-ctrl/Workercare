# WorkerCare Stage 1 Wiring

These notes are for a **standard ESP32 DevKit V1 (ESP-WROOM-32)**, not the ESP32-C3 Super Mini. If your board is a different variant, confirm its pinout first.

## DHT22 module (3 pins: OUT, +, -)

| DHT22 pin | ESP32 DevKit V1 |
|---|---|
| + | 3V3 |
| OUT | GPIO 4 |
| - | GND |

Use the module's onboard pull-up if present. For a bare DHT22 sensor, a pull-up resistor between DATA and 3V3 is normally required.

## SOS push button

- Place the tactile button across the breadboard centre gap.
- Connect one side to GPIO 18.
- Connect the opposite side to GND.
- Firmware uses `INPUT_PULLUP`, so the input reads LOW when pressed.

## Status LED

- Connect GPIO 2 to a 330 Ω resistor, then to the LED anode (long leg).
- Connect the LED cathode (short leg) to GND.
- Check the onboard LED/pin arrangement for your exact board; an external LED is optional.

## Not connected in Stage 1

Leave the vibration motor, DRV8833, buzzer, and MPU6050 disconnected until the first test succeeds. Never connect a motor directly to an ESP32 GPIO.

## First test

1. Disconnect USB before changing wiring.
2. Connect only DHT22, SOS button, and optional LED.
3. Verify the pin definitions in the sketch.
4. Upload and open Serial Monitor at 115200 baud.
5. Confirm temperature/humidity readings, then press the SOS button and check the serial message/LED.

If the DHT22 read fails, check the module pin labels, ground, 3.3 V supply, and data wire.
