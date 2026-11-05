/*
  WorkerCare - Stage 1
  Target: standard ESP32 DevKit V1 (ESP-WROOM-32)

  Features:
  - DHT22 ambient temperature/humidity reading
  - SOS push button (INPUT_PULLUP; pressed = LOW)
  - Status LED

  IMPORTANT:
  Verify these GPIO numbers against your exact DevKit and wiring.
  DHT22 readings are environmental values, not body temperature.
*/

#include <Arduino.h>
#include <DHT.h>

// ----- Pin configuration: change to match your wiring -----
constexpr uint8_t DHT_PIN = 4;
constexpr uint8_t DHT_TYPE = DHT22;
constexpr uint8_t SOS_BUTTON_PIN = 18;
constexpr uint8_t STATUS_LED_PIN = 2;

// ----- Environment alert thresholds (prototype defaults) -----
constexpr float HOT_AIR_TEMP_C = 35.0;
constexpr float HIGH_HUMIDITY_PERCENT = 70.0;
constexpr unsigned long SENSOR_INTERVAL_MS = 2500;

DHT dht(DHT_PIN, DHT_TYPE);

unsigned long lastSensorRead = 0;
bool lastSosState = false;

void printEnvironment(float temperature, float humidity) {
  Serial.println("\n--- WorkerCare Environment ---");

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT22 read failed. Check power, ground, data pin and sensor.");
    return;
  }

  Serial.print("Ambient temperature: ");
  Serial.print(temperature, 1);
  Serial.println(" °C");

  Serial.print("Relative humidity: ");
  Serial.print(humidity, 1);
  Serial.println(" %");

  if (temperature >= HOT_AIR_TEMP_C ||
      humidity >= HIGH_HUMIDITY_PERCENT) {
    Serial.println("NOTICE: Environmental conditions are elevated.");
    Serial.println("Take a rest in a cooler/shaded place and follow workplace safety guidance.");
  } else {
    Serial.println("Environmental readings are below prototype alert thresholds.");
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(SOS_BUTTON_PIN, INPUT_PULLUP);
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW);

  dht.begin();

  Serial.println("\nWorkerCare Stage 1 started");
  Serial.println("Hold the SOS button to test the local alert.");
}

void loop() {
  const bool sosPressed = (digitalRead(SOS_BUTTON_PIN) == LOW);

  if (sosPressed && !lastSosState) {
    Serial.println("\n!!! SOS BUTTON PRESSED !!!");
    Serial.println("Local prototype alert only; no message is sent remotely.");
    digitalWrite(STATUS_LED_PIN, HIGH);
  } else if (!sosPressed && lastSosState) {
    Serial.println("SOS button released.");
    digitalWrite(STATUS_LED_PIN, LOW);
  }

  lastSosState = sosPressed;

  const unsigned long now = millis();
  if (now - lastSensorRead >= SENSOR_INTERVAL_MS) {
    lastSensorRead = now;
    const float humidity = dht.readHumidity();
    const float temperature = dht.readTemperature();
    printEnvironment(temperature, humidity);
  }

  delay(20);
}
