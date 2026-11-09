
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <DHT.h>
#include <math.h>
#include <time.h>
#include "config.h"

// ---------- PIN CONFIGURATION ----------
#define DHT_PIN 4
#define DHT_TYPE DHT22

#define MPU_SDA 21
#define MPU_SCL 22
#define MPU_ADDR 0x68

#define SOS_PIN 13
#define LED_PIN 2

// ---------- TIMING ----------
#define SENSOR_INTERVAL 10000
#define WIFI_TIMEOUT 20000
#define WIFI_RETRY_INTERVAL 5000
#define MOTION_INTERVAL 50
#define FALL_COOLDOWN 30000

// ---------- FALL DETECTION ----------
#define FREEFALL_THRESHOLD 0.5
#define IMPACT_THRESHOLD 2.5
#define FALL_WINDOW 1200

DHT dht(DHT_PIN, DHT_TYPE);

WiFiClientSecure secureClient;

// ---------- SENSOR VARIABLES ----------
float temperature = 0;
float humidity = 0;

float ax = 0;
float ay = 0;
float az = 0;

bool sensorDataValid = false;
bool mpuReady = false;

// ---------- ALERT VARIABLES ----------
bool sosPending = false;
bool fallPending = false;

bool previousSOSState = HIGH;

unsigned long freefallTime = 0;
unsigned long lastFallTime = 0;

// ---------- TIMERS ----------
unsigned long lastSensorTime = 0;
unsigned long lastMotionTime = 0;
unsigned long lastUploadTime = 0;

// ---------- WIFI STATE ----------
bool wifiAttemptActive = false;
bool wifiConnectedPreviously = false;
bool timeSyncStarted = false;

unsigned long wifiAttemptStart = 0;
unsigned long nextWifiAttempt = 0;

// ---------- MPU FUNCTIONS ----------

bool writeMPURegister(uint8_t reg, uint8_t value) {
    Wire.beginTransmission(MPU_ADDR);
    Wire.write(reg);
    Wire.write(value);
    return Wire.endTransmission() == 0;
}

bool readMPURegisters(uint8_t reg, uint8_t *data, uint8_t length) {
    Wire.beginTransmission(MPU_ADDR);
    Wire.write(reg);

    if (Wire.endTransmission(false) != 0) {
        return false;
    }

    uint8_t received =
        Wire.requestFrom(MPU_ADDR, length, true);

    if (received != length) {
        return false;
    }

    for (uint8_t i = 0; i < length; i++) {
        data[i] = Wire.read();
    }

    return true;
}

bool initializeMPU() {
    uint8_t identity = 0;

    if (!readMPURegisters(0x75, &identity, 1)) {
        Serial.println("MPU communication failed.");
        return false;
    }

    Serial.print("MPU WHO_AM_I: 0x");
    Serial.println(identity, HEX);

    if (identity != 0x68 && identity != 0x70) {
        Serial.println("Unknown MPU identity.");
        return false;
    }

    // Wake up MPU
    if (!writeMPURegister(0x6B, 0x00)) {
        return false;
    }

    delay(100);

    // Accelerometer range: +/- 2g
    writeMPURegister(0x1C, 0x00);

    Serial.println("MPU initialized using direct I2C.");

    return true;
}

bool readAcceleration() {
    uint8_t data[6];

    if (!readMPURegisters(0x3B, data, 6)) {
        return false;
    }

    int16_t rawX = (int16_t)((data[0] << 8) | data[1]);
    int16_t rawY = (int16_t)((data[2] << 8) | data[3]);
    int16_t rawZ = (int16_t)((data[4] << 8) | data[5]);

    // Convert raw readings to m/s^2
    ax = (rawX / 16384.0) * 9.80665;
    ay = (rawY / 16384.0) * 9.80665;
    az = (rawZ / 16384.0) * 9.80665;

    return true;
}

// ---------- FALL DETECTION ----------

void sampleMotion() {
    if (!mpuReady || !readAcceleration()) {
        return;
    }

    float totalAcceleration =
        sqrt(ax * ax + ay * ay + az * az);

    float accelerationG = totalAcceleration / 9.80665;

    unsigned long now = millis();

    if (now - lastFallTime < FALL_COOLDOWN) {
        return;
    }

    // Detect possible freefall
    if (accelerationG < FREEFALL_THRESHOLD) {
        freefallTime = now;
    }

    // Detect impact after possible freefall
    if (freefallTime != 0 &&
        now - freefallTime <= FALL_WINDOW &&
        accelerationG > IMPACT_THRESHOLD) {

        fallPending = true;
        lastFallTime = now;
        freefallTime = 0;

        Serial.println("WARNING: POSSIBLE FALL DETECTED!");
    }

    if (freefallTime != 0 &&
        now - freefallTime > FALL_WINDOW) {
        freefallTime = 0;
    }
}

// ---------- SOS BUTTON ----------

void checkSOS() {
    bool currentState = digitalRead(SOS_PIN);

    if (previousSOSState == HIGH &&
        currentState == LOW) {

        sosPending = true;

        Serial.println("SOS BUTTON PRESSED!");
    }

    previousSOSState = currentState;
}

// ---------- WIFI CONNECTION ----------

void maintainWiFi() {
    unsigned long now = millis();

    if (WiFi.status() == WL_CONNECTED) {

        if (!wifiConnectedPreviously) {
            Serial.println();
            Serial.println("WiFi connected!");

            Serial.print("IP Address: ");
            Serial.println(WiFi.localIP());

            wifiConnectedPreviously = true;
            wifiAttemptActive = false;

            digitalWrite(LED_PIN, HIGH);

            // Start secure time synchronization
            if (!timeSyncStarted) {
                configTime(
                    0,
                    0,
                    "pool.ntp.org",
                    "time.nist.gov"
                );

                timeSyncStarted = true;
                Serial.println("Synchronizing system time...");
            }
        }

        return;
    }

    if (wifiConnectedPreviously) {
        Serial.println("WiFi connection lost.");

        wifiConnectedPreviously = false;
        timeSyncStarted = false;

        digitalWrite(LED_PIN, LOW);
    }

    // Do not call WiFi.begin while connecting
    if (wifiAttemptActive) {

        if (now - wifiAttemptStart < WIFI_TIMEOUT) {
            return;
        }

        Serial.println("WiFi connection timed out.");

        WiFi.disconnect(false, false);

        wifiAttemptActive = false;
        nextWifiAttempt = now + WIFI_RETRY_INTERVAL;

        return;
    }

    // Wait before retrying
    if (now < nextWifiAttempt) {
        return;
    }

    Serial.println("Connecting to phone hotspot...");

    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(true);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    wifiAttemptActive = true;
    wifiAttemptStart = now;
}

// ---------- TIME CHECK ----------

bool systemTimeReady() {
    time_t currentTime = time(nullptr);

    // Require a valid synchronized clock
    return currentTime > 1700000000;
}

// ---------- SENSOR READING ----------

void readSensors() {
    float newTemperature = dht.readTemperature();
    float newHumidity = dht.readHumidity();

    if (!isnan(newTemperature) && !isnan(newHumidity)) {
        temperature = newTemperature;
        humidity = newHumidity;
        sensorDataValid = true;

        Serial.print("Temperature: ");
        Serial.print(temperature);
        Serial.print(" C | Humidity: ");
        Serial.print(humidity);
        Serial.println(" %");
    } else {
        Serial.println("DHT22 reading failed.");
    }

    if (mpuReady && readAcceleration()) {
        Serial.print("Acceleration X: ");
        Serial.print(ax);
        Serial.print(" | Y: ");
        Serial.print(ay);
        Serial.print(" | Z: ");
        Serial.println(az);
    }
}

// ---------- SUPABASE TELEMETRY ----------

void sendTelemetry() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi not connected. Telemetry pending.");
        return;
    }

    if (!systemTimeReady()) {
        Serial.println("Waiting for secure time synchronization.");
        return;
    }

    if (!sensorDataValid && !sosPending && !fallPending) {
        Serial.println("No valid sensor data available.");
        return;
    }

    char payload[256];

    snprintf(
        payload,
        sizeof(payload),
        "{\"ambient_temp_c\":%.2f,"
        "\"relative_humidity\":%.2f,"
        "\"sos\":%s,"
        "\"fall_detected\":%s}",
        temperature,
        humidity,
        sosPending ? "true" : "false",
        fallPending ? "true" : "false"
    );

    secureClient.setCACert(SUPABASE_ROOT_CA);

    HTTPClient http;

    if (!http.begin(secureClient, DEVICE_INGEST_URL)) {
        Serial.println("HTTPS connection initialization failed.");
        return;
    }

    http.setTimeout(10000);

    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-device-code", DEVICE_CODE);
    http.addHeader("x-device-token", DEVICE_TOKEN);

    Serial.println("Sending data to Supabase...");

    int responseCode = http.POST(payload);

    if (responseCode > 0) {
        Serial.print("Supabase HTTP response: ");
        Serial.println(responseCode);

        String response = http.getString();
        Serial.println(response);

        if (responseCode >= 200 && responseCode < 300) {
            Serial.println("Telemetry uploaded successfully.");

            // Clear alerts only after successful upload
            sosPending = false;
            fallPending = false;
        }
    } else {
        Serial.print("HTTPS upload failed: ");
        Serial.println(http.errorToString(responseCode));
    }

    http.end();
}

// ---------- SETUP ----------

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("===== WORKERCARE STARTING =====");

    pinMode(SOS_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);

    digitalWrite(LED_PIN, LOW);

    dht.begin();

    Wire.begin(MPU_SDA, MPU_SCL);
    Wire.setClock(100000);

    mpuReady = initializeMPU();

    if (!mpuReady) {
        Serial.println("MPU unavailable. Fall detection disabled.");
    }

    Serial.println("WorkerCare firmware initialized.");

    // Start the first WiFi connection attempt
    maintainWiFi();
}

// ---------- MAIN LOOP ----------

void loop() {
    unsigned long now = millis();

    // Manage WiFi without repeated begin calls
    maintainWiFi();

    // Read motion at regular intervals
    if (now - lastMotionTime >= MOTION_INTERVAL) {
        lastMotionTime = now;

        sampleMotion();
    }

    // Check SOS button
    checkSOS();

    // Read environmental sensors
    if (now - lastSensorTime >= SENSOR_INTERVAL) {
        lastSensorTime = now;

        readSensors();
    }

    // Upload telemetry every 10 seconds
    if (now - lastUploadTime >= SENSOR_INTERVAL) {
        lastUploadTime = now;

        sendTelemetry();
    }

    delay(5);
}
