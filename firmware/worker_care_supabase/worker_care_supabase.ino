/*
  WorkerCare connected prototype
  ESP32 DevKit V1 (ESP-WROOM-32)
  DHT22 GPIO 4 | MPU6050 SDA/SCL 21/22 | SOS GPIO 13
  HTTPS telemetry to Supabase device-ingest Edge Function.
  Fall detection is experimental, not a certified safety feature.
*/
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <DHT.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include "config.h"

constexpr uint8_t DHT_PIN = 4;
constexpr uint8_t SOS_BUTTON_PIN = 13;
constexpr uint8_t STATUS_LED_PIN = 2;
constexpr float FREEFALL_MPS2 = 4.9f;
constexpr float IMPACT_MPS2 = 24.5f;
constexpr unsigned long FALL_WINDOW_MS = 1200;
constexpr unsigned long FALL_COOLDOWN_MS = 30000;
constexpr unsigned long SENSOR_INTERVAL_MS = 10000;
constexpr unsigned long WIFI_RETRY_MS = 10000;
constexpr unsigned long EVENT_RETRY_MS = 5000;

DHT dht(DHT_PIN, DHT22);
Adafruit_MPU6050 mpu;
bool mpuReady = false, lastSos = false, sosPending = false, fallPending = false;
bool freefallSeen = false;
unsigned long freefallAt = 0, lastFallAt = 0, lastSensorAt = 0, lastWifiAt = 0, lastSendAttemptAt = 0;
float temperatureC = NAN, humidityPct = NAN;

void connectWiFi() {
  const unsigned long now = millis();
  if (WiFi.status() == WL_CONNECTED || (lastWifiAt != 0 && now - lastWifiAt < WIFI_RETRY_MS)) return;
  lastWifiAt = now;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void sampleMotion() {
  if (!mpuReady) return;
  sensors_event_t a, g, t;
  mpu.getEvent(&a, &g, &t);
  const float magnitude = sqrtf(a.acceleration.x*a.acceleration.x +
                                a.acceleration.y*a.acceleration.y +
                                a.acceleration.z*a.acceleration.z);
  const unsigned long now = millis();
  if (magnitude < FREEFALL_MPS2) { freefallSeen = true; freefallAt = now; }
  if (freefallSeen && now - freefallAt <= FALL_WINDOW_MS &&
      magnitude > IMPACT_MPS2 && now - lastFallAt > FALL_COOLDOWN_MS) {
    fallPending = true;
    lastFallAt = now;
    freefallSeen = false;
    Serial.println("Possible fall pattern detected (experimental).");
  }
  if (freefallSeen && now - freefallAt > FALL_WINDOW_MS) freefallSeen = false;
}

bool sendTelemetry(bool sos, bool fall) {
  if (WiFi.status() != WL_CONNECTED) return false;
  if (String(DEVICE_TOKEN).length() < 24 ||
      String(DEVICE_INGEST_URL).indexOf("YOUR_PROJECT_REF") >= 0 ||
      String(SUPABASE_ROOT_CA).indexOf("PASTE_TRUSTED") >= 0) {
    Serial.println("Configure token, endpoint and trusted root CA in config.h.");
    return false;
  }
  WiFiClientSecure tls;
  tls.setCACert(SUPABASE_ROOT_CA);
  HTTPClient http;
  if (!http.begin(tls, DEVICE_INGEST_URL)) return false;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-code", DEVICE_CODE);
  http.addHeader("x-device-token", DEVICE_TOKEN);
  String body = "{\"ambient_temp_c\":";
  body += isnan(temperatureC) ? "null" : String(temperatureC, 1);
  body += ",\"relative_humidity\":";
  body += isnan(humidityPct) ? "null" : String(humidityPct, 1);
  body += ",\"sos\":";
  body += sos ? "true" : "false";
  body += ",\"fall_detected\":";
  body += fall ? "true" : "false";
  body += "}";
  const int code = http.POST(body);
  if (code > 0) {
    Serial.printf("Supabase response: %d\n", code);
    Serial.println(http.getString());
  } else {
    Serial.printf("HTTPS request failed: %s\n", http.errorToString(code).c_str());
  }
  http.end();
  return code >= 200 && code < 300;
}

void setup() {
  Serial.begin(115200);
  pinMode(SOS_BUTTON_PIN, INPUT_PULLUP);
  pinMode(STATUS_LED_PIN, OUTPUT);
  dht.begin();
  Wire.begin(21, 22);
  mpuReady = mpu.begin();
  if (mpuReady) {
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  } else Serial.println("MPU6050 not detected; fall detection disabled.");
  WiFi.setAutoReconnect(true);
  connectWiFi();
  Serial.println("WorkerCare connected firmware started.");
}

void loop() {
  connectWiFi();
  sampleMotion();

  const bool pressed = digitalRead(SOS_BUTTON_PIN) == LOW;
  if (pressed && !lastSos) {
    sosPending = true;
    digitalWrite(STATUS_LED_PIN, HIGH);
    Serial.println("SOS queued for remote delivery.");
  }
  if (!pressed && lastSos) digitalWrite(STATUS_LED_PIN, LOW);
  lastSos = pressed;

  const unsigned long now = millis();
  bool newReading = false;
  if (now - lastSensorAt >= SENSOR_INTERVAL_MS) {
    lastSensorAt = now;
    humidityPct = dht.readHumidity();
    temperatureC = dht.readTemperature();
    newReading = true;
    if (isnan(temperatureC) || isnan(humidityPct)) Serial.println("DHT22 read failed.");
    else Serial.printf("Ambient %.1f C | RH %.1f %%\n", temperatureC, humidityPct);
  }

  const bool eventRetryDue = (sosPending || fallPending) && now - lastSendAttemptAt >= EVENT_RETRY_MS;
  if (newReading || eventRetryDue) {
    lastSendAttemptAt = now;
    if (sendTelemetry(sosPending, fallPending)) {
      sosPending = false;
      fallPending = false;
    }
  }
  delay(20);
}
