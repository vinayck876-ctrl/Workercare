#pragma once
// Copy to config.h and fill in locally. Never commit real credentials.
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#define DEVICE_CODE "WC-ESP32-001"
#define DEVICE_TOKEN "PASTE_UNIQUE_DEVICE_TOKEN_HERE"
#define DEVICE_INGEST_URL "https://YOUR_PROJECT_REF.supabase.co/functions/v1/device-ingest"

// Paste the trusted root CA certificate for the Supabase endpoint.
// Do not use WiFiClientSecure::setInsecure() for deployed devices.
static const char *SUPABASE_ROOT_CA = R"EOF(
PASTE_TRUSTED_ROOT_CA_CERTIFICATE_HERE
)EOF";
