import { supabase } from './supabase';

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  return supabase;
}
export async function getCurrentProfile() {
  const client = requireClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) return null;
  const { data, error } = await client.from('profiles').select('id, display_name, role, phone').eq('id', user.id).single();
  if (error) throw error;
  return { ...data, email: user.email };
}
export async function getAssignedWorkers() {
  const { data, error } = await requireClient().from('workers')
    .select('id, worker_code, full_name, worker_type, site_id, is_active, sites(name)')
    .eq('is_active', true).order('full_name');
  if (error) throw error;
  return data ?? [];
}
export async function getRecentReadings(workerIds, limit = 100) {
  if (!workerIds?.length) return [];
  const { data, error } = await requireClient().from('sensor_readings')
    .select('id, worker_id, device_id, ambient_temp_c, relative_humidity, battery_percent, recorded_at')
    .in('worker_id', workerIds).order('recorded_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}
export async function getRecentAlerts(workerIds, limit = 100) {
  if (!workerIds?.length) return [];
  const { data, error } = await requireClient().from('alerts')
    .select('id, worker_id, device_id, alert_type, severity, title, message, details, status, created_at, acknowledged_at')
    .in('worker_id', workerIds).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}
export async function acknowledgeAlert(alertId, profileId) {
  const { data, error } = await requireClient().from('alerts')
    .update({ status: 'acknowledged', acknowledged_by: profileId, acknowledged_at: new Date().toISOString() })
    .eq('id', alertId).eq('status', 'open').select('id, status').single();
  if (error) throw error;
  return data;
}
export function subscribeToWorkerCare(onChange) {
  const client = requireClient();
  const channel = client.channel('workercare-live-updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sensor_readings' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, onChange)
    .subscribe();
  return () => { client.removeChannel(channel); };
}
