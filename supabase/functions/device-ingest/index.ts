import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-device-code, x-device-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const deviceCode = request.headers.get("x-device-code")?.trim();
  const deviceToken = request.headers.get("x-device-token");
  if (!deviceCode || !deviceToken || deviceToken.length < 24) return json({ error: "Missing or invalid device credentials" }, 401);

  let payload: Record<string, unknown>;
  try { payload = await request.json(); } catch { return json({ error: "Request body must be valid JSON" }, 400); }

  const temp = payload.ambient_temp_c;
  const humidity = payload.relative_humidity;
  const battery = payload.battery_percent;
  const sos = payload.sos === true;
  const fall = payload.fall_detected === true;
  if (temp !== null && temp !== undefined && (typeof temp !== "number" || temp < -20 || temp > 85)) return json({ error: "ambient_temp_c out of range" }, 400);
  if (humidity !== null && humidity !== undefined && (typeof humidity !== "number" || humidity < 0 || humidity > 100)) return json({ error: "relative_humidity out of range" }, 400);
  if (battery !== null && battery !== undefined && (typeof battery !== "number" || battery < 0 || battery > 100)) return json({ error: "battery_percent out of range" }, 400);
  if (temp === undefined && humidity === undefined && battery === undefined && !sos && !fall) return json({ error: "No telemetry or event supplied" }, 400);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json({ error: "Device ingestion is not configured" }, 503);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: verified, error: verifyError } = await admin.rpc("verify_device_token", {
    p_device_code: deviceCode, p_token_sha256: await sha256Hex(deviceToken),
  });
  if (verifyError || !verified?.length) return json({ error: "Device authentication failed" }, 401);

  const device = verified[0] as { device_id: string; worker_id: string };
  const recordedAt = new Date().toISOString();
  if (temp !== undefined || humidity !== undefined || battery !== undefined) {
    const { error } = await admin.from("sensor_readings").insert({
      device_id: device.device_id, worker_id: device.worker_id,
      ambient_temp_c: temp ?? null, relative_humidity: humidity ?? null,
      battery_percent: battery ?? null, recorded_at: recordedAt,
    });
    if (error) return json({ error: "Could not store sensor reading" }, 500);
  }
  const deviceUpdate: Record<string, unknown> = { last_seen_at: recordedAt };
  if (typeof battery === "number") deviceUpdate.battery_percent = battery;
  const { error: updateError } = await admin.from("devices").update(deviceUpdate).eq("id", device.device_id);
  if (updateError) return json({ error: "Could not update device status" }, 500);

  const events: Array<Record<string, unknown>> = [];
  if (sos) events.push({
    worker_id: device.worker_id, device_id: device.device_id, alert_type: "sos",
    severity: "critical", title: "SOS button pressed",
    message: "The wearable sent an SOS event. Contact the worker and follow the site's emergency procedure.",
    details: { source: "esp32", recorded_at: recordedAt },
  });
  if (fall) events.push({
    worker_id: device.worker_id, device_id: device.device_id, alert_type: "fall",
    severity: "high", title: "Possible fall detected",
    message: "Verify the worker's condition. This experimental detector can produce false alerts.",
    details: { source: "mpu6050_experimental", recorded_at: recordedAt },
  });
  if (typeof temp === "number" && temp >= 35) events.push({
    worker_id: device.worker_id, device_id: device.device_id, alert_type: "heat",
    severity: "warning", title: "Elevated ambient temperature",
    message: "Ambient temperature reached the prototype threshold; this is not a body-temperature or medical measurement.",
    details: { ambient_temp_c: temp, relative_humidity: humidity ?? null },
  });
  if (typeof humidity === "number" && humidity >= 70) events.push({
    worker_id: device.worker_id, device_id: device.device_id, alert_type: "humidity",
    severity: "warning", title: "High relative humidity",
    message: "Relative humidity reached the prototype threshold.",
    details: { relative_humidity: humidity, ambient_temp_c: temp ?? null },
  });
  if (events.length) {
    const { error } = await admin.from("alerts").insert(events);
    if (error) return json({ error: "Telemetry stored, but alert creation failed" }, 500);
  }
  return json({ accepted: true, alerts_created: events.length, recorded_at: recordedAt });
});
