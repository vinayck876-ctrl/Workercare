
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, Bell, CheckCircle2, Clock3,
  HardHat, LogOut, Radio, ShieldCheck, Thermometer, Users, Wifi, WifiOff
} from 'lucide-react';

import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';

import { supabase } from './lib/supabase';
import './supabase.css';

function formatTime(value) {
  if (!value) return 'No reading yet';

  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function titleCase(value = '') {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) =>
    letter.toUpperCase()
  );
}

export default function SupabaseApp() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [workers, setWorkers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [readings, setReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // LOAD DASHBOARD DATA
  const loadDashboard = useCallback(async () => {
    if (!session?.user) return;

    setError('');

    const [profileResult, workerResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, display_name, role')
        .eq('id', session.user.id)
        .single(),

      supabase
        .from('workers')
        .select('id, worker_code, full_name, worker_type, site_id, is_active, sites(name)')
        .eq('is_active', true)
        .order('full_name')
    ]);

    if (profileResult.error) throw profileResult.error;
    if (workerResult.error) throw workerResult.error;

    setProfile(profileResult.data);

    const assigned = workerResult.data || [];
    setWorkers(assigned);

    const ids = assigned.map((worker) => worker.id);

    if (!ids.length) {
      setDevices([]);
      setReadings([]);
      setAlerts([]);
      return;
    }

    const [deviceResult, readingResult, alertResult] = await Promise.all([
      supabase
        .from('devices')
        .select('id, worker_id, device_code, label, is_enabled, battery_percent, last_seen_at')
        .in('worker_id', ids),

      supabase
        .from('sensor_readings')
        .select('id, worker_id, ambient_temp_c, relative_humidity, battery_percent, recorded_at')
        .in('worker_id', ids)
        .order('recorded_at', { ascending: false })
        .limit(200),

      supabase
        .from('alerts')
        .select('id, worker_id, alert_type, severity, title, message, status, created_at, acknowledged_at')
        .in('worker_id', ids)
        .order('created_at', { ascending: false })
        .limit(100)
    ]);

    if (deviceResult.error) throw deviceResult.error;
    if (readingResult.error) throw readingResult.error;
    if (alertResult.error) throw alertResult.error;

    setDevices(deviceResult.data || []);
    setReadings(readingResult.data || []);
    setAlerts(alertResult.data || []);

  }, [session]);

  // AUTHENTICATION
  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;

      if (sessionError) {
        setError(sessionError.message);
      }

      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setProfile(null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // LIVE DATABASE UPDATES
  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      setWorkers([]);
      setDevices([]);
      setReadings([]);
      setAlerts([]);
      setLoading(false);

      return undefined;
    }

    let active = true;

    setLoading(true);

    const refresh = async () => {
      try {
        await loadDashboard();
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Could not load WorkerCare data.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    refresh();

    const channel = supabase
      .channel('workercare-dashboard-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sensor_readings' },
        refresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        refresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devices' },
        refresh
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };

  }, [session, loadDashboard]);

  // LATEST READING FOR EACH WORKER
  const latestByWorker = useMemo(() => {
    const result = new Map();

    for (const reading of readings) {
      if (!result.has(reading.worker_id)) {
        result.set(reading.worker_id, reading);
      }
    }

    return result;
  }, [readings]);

  // DEVICE INFORMATION
  const deviceByWorker = useMemo(() => {
    const result = new Map();

    for (const device of devices) {
      const current = result.get(device.worker_id);

      if (
        !current ||
        new Date(device.last_seen_at || 0) >
        new Date(current.last_seen_at || 0)
      ) {
        result.set(device.worker_id, device);
      }
    }

    return result;
  }, [devices]);

  // DASHBOARD STATISTICS
  const openAlerts = alerts.filter(
    (alert) => alert.status === 'open'
  );

  const onlineDevices = devices.filter((device) =>
    device.is_enabled &&
    device.last_seen_at &&
    Date.now() - new Date(device.last_seen_at).getTime() < 120000
  ).length;

  // TEMPERATURE CHART
  const chartData = [...readings]
    .filter((reading) => reading.ambient_temp_c !== null)
    .slice(0, 24)
    .reverse()
    .map((reading) => ({
      time: new Date(reading.recorded_at).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      temp: Number(reading.ambient_temp_c)
    }));

  // SIGN IN
  async function signIn(event) {
    event.preventDefault();

    setBusy(true);
    setError('');

    const { error: signInError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

    setBusy(false);

    if (signInError) {
      setError(signInError.message);
    }
  }

  // SIGN OUT
  async function signOut() {
    await supabase.auth.signOut();

    setSession(null);
    setProfile(null);
  }

  // ACKNOWLEDGE ALERT
  async function acknowledge(alertId) {
    if (!profile) return;

    setBusy(true);
    setError('');

    const { error: updateError } = await supabase
      .from('alerts')
      .update({
        status: 'acknowledged',
        acknowledged_by: profile.id,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .eq('status', 'open');

    setBusy(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setNotice('Alert acknowledged.');
      await loadDashboard();
    }
  }

  // LOADING SCREEN
  if (loading && !session) {
    return (
      <main className="sc-page">
        <div className="sc-card sc-loading">
          Loading WorkerCare…
        </div>
      </main>
    );
  }

  // LOGIN PAGE
  if (!session) {
    return (
      <main className="sc-page">
        <section className="sc-login">

          <div className="sc-logo">
            <HardHat size={28} />
          </div>

          <h1>
            Worker<span>Care</span>
          </h1>

          <p>
            Sign in to your connected safety workspace
          </p>

          <form onSubmit={signIn}>

            <label>
              Email address

              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@example.com"
              />
            </label>

            <label>
              Password

              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="Your password"
              />
            </label>

            {error && (
              <div className="sc-error" role="alert">
                {error}
              </div>
            )}

            <button className="sc-primary" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in securely'}
            </button>

          </form>

          <small>
            Accounts are provisioned by the WorkerCare administrator.
          </small>

        </section>
      </main>
    );
  }

  const canAcknowledge = [
    'supervisor',
    'safety_officer',
    'admin'
  ].includes(profile?.role);

  // MAIN DASHBOARD
  return (
    <main className="sc-app">

      {/* HEADER */}
      <header className="sc-topbar">

        <div className="sc-brand">
          <span className="sc-brand-icon">
            <ShieldCheck size={22} />
          </span>

          <div>
            <strong>WorkerCare</strong>
            <small>CONNECTED SAFETY WORKSPACE</small>
          </div>
        </div>

        <div className="sc-user">
          <span>
            {profile?.display_name || session.user.email}
          </span>

          <small>
            {titleCase(profile?.role || 'loading')}
          </small>

          <button onClick={signOut} aria-label="Sign out">
            <LogOut size={17} />
            Sign out
          </button>
        </div>

      </header>

      <section className="sc-content">

        {/* PAGE HEADING */}
        <div className="sc-heading">

          <div>
            <span className="sc-eyebrow">
              LIVE OPERATIONS
            </span>

            <h2>Safety overview</h2>

            <p>
              Sensor readings and alerts from your authorized WorkerCare devices.
            </p>
          </div>

          <span className="sc-live">
            <i />
            Supabase connected
          </span>

        </div>

        {error && (
          <div className="sc-error sc-banner">
            {error}
          </div>
        )}

        {notice && (
          <div className="sc-notice" role="status">
            {notice}
            <button onClick={() => setNotice('')}>
              Dismiss
            </button>
          </div>
        )}

        {/* STATISTICS */}
        <div className="sc-stats">

          <article>
            <Users />
            <span>Assigned workers</span>
            <strong>{workers.length}</strong>
          </article>

          <article>
            <Radio />
            <span>Devices online</span>
            <strong>
              {onlineDevices} / {devices.length}
            </strong>
          </article>

          <article>
            <AlertTriangle />
            <span>Open alerts</span>
            <strong>{openAlerts.length}</strong>
          </article>

          <article>
            <Activity />
            <span>Sensor readings</span>
            <strong>{readings.length}</strong>
          </article>

        </div>

        {/* CHART AND ALERTS */}
        <div className="sc-grid">

          {/* TEMPERATURE CHART */}
          <section className="sc-panel sc-chart">

            <div className="sc-panel-head">
              <div>
                <h3>Ambient temperature</h3>
                <p>
                  Latest readings received from your devices
                </p>
              </div>

              <Thermometer />
            </div>

            {chartData.length ? (

              <div className="sc-chart-area">

                <ResponsiveContainer width="100%" height="100%">

                  <AreaChart data={chartData}>

                    <defs>
                      <linearGradient
                        id="scTempFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#d78b43"
                          stopOpacity={0.25}
                        />

                        <stop
                          offset="95%"
                          stopColor="#d78b43"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      stroke="#edf0f4"
                      strokeDasharray="3 5"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11, fill: '#7b8796' }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      tick={{ fontSize: 11, fill: '#7b8796' }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      formatter={(value) => [
                        value + ' °C',
                        'Ambient temperature'
                      ]}
                    />

                    <Area
                      dataKey="temp"
                      type="monotone"
                      stroke="#d78b43"
                      fill="url(#scTempFill)"
                      strokeWidth={2}
                    />

                  </AreaChart>

                </ResponsiveContainer>

              </div>

            ) : (

              <div className="sc-empty">
                <Thermometer />
                <strong>No sensor readings yet</strong>
                <span>
                  Connect and provision an ESP32 device to populate this chart.
                </span>
              </div>

            )}

          </section>

          {/* RECENT ALERTS */}
          <section className="sc-panel">

            <div className="sc-panel-head">
              <div>
                <h3>Recent alerts</h3>
                <p>Events stored in Supabase</p>
              </div>

              <Bell />
            </div>

            {alerts.length ? (

              <div className="sc-alert-list">

                {alerts.slice(0, 8).map((alert) => {

                  const worker = workers.find(
                    (item) => item.id === alert.worker_id
                  );

                  return (

                    <article
                      key={alert.id}
                      className="sc-alert"
                    >

                      <span
                        className={'sc-alert-icon ' + alert.severity}
                      >
                        <AlertTriangle size={17} />
                      </span>

                      <div>

                        <strong>{alert.title}</strong>

                        <p>
                          {worker?.full_name || 'Assigned worker'}
                          {' · '}
                          {alert.message || titleCase(alert.alert_type)}
                        </p>

                        <small>
                          <Clock3 size={12} />
                          {formatTime(alert.created_at)}
                        </small>

                      </div>

                      <div className="sc-alert-action">

                        <span
                          className={'sc-status ' + alert.status}
                        >
                          {titleCase(alert.status)}
                        </span>

                        {alert.status === 'open' && canAcknowledge && (

                          <button
                            disabled={busy}
                            onClick={() => acknowledge(alert.id)}
                          >
                            Acknowledge
                          </button>

                        )}

                      </div>

                    </article>

                  );
                })}

              </div>

            ) : (

              <div className="sc-empty">
                <CheckCircle2 />
                <strong>No alerts recorded</strong>
                <span>
                  New SOS and threshold alerts will appear here.
                </span>
              </div>

            )}

          </section>

        </div>

        {/* ASSIGNED WORKERS */}
        <section className="sc-panel sc-workers">

          <div className="sc-panel-head">

            <div>
              <h3>Assigned workers</h3>
              <p>
                Visible records are restricted by Supabase row-level security
              </p>
            </div>

            <Users />

          </div>

          {workers.length ? (

            <div className="sc-worker-grid">

              {workers.map((worker) => {

                const reading = latestByWorker.get(worker.id);
                const device = deviceByWorker.get(worker.id);

                const workerAlerts = alerts.filter(
                  (alert) =>
                    alert.worker_id === worker.id &&
                    alert.status === 'open'
                );

                const online =
                  device?.is_enabled &&
                  device.last_seen_at &&
                  Date.now() - new Date(device.last_seen_at).getTime() < 120000;

                return (

                  <article
                    className="sc-worker"
                    key={worker.id}
                  >

                    <div className="sc-worker-top">

                      <span className="sc-worker-avatar">
                        {worker.full_name
                          .split(' ')
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </span>

                      <span
                        className={
                          'sc-status ' +
                          (workerAlerts.length ? 'open' : 'safe')
                        }
                      >
                        {workerAlerts.length
                          ? workerAlerts.length + ' open alert(s)'
                          : 'No open alerts'}
                      </span>

                    </div>

                    <strong>{worker.full_name}</strong>

                    <small>
                      {worker.worker_code}
                      {' · '}
                      {titleCase(worker.worker_type)}
                    </small>

                    <div className="sc-reading-row">

                      <span>
                        <Thermometer size={15} />
                        {reading?.ambient_temp_c ?? '—'} °C
                      </span>

                      <span>
                        <Activity size={15} />
                        {reading?.relative_humidity ?? '—'} % RH
                      </span>

                    </div>

                    <div className="sc-device-row">

                      <span
                        className={online ? 'sc-online' : 'sc-offline'}
                      >
                        {online
                          ? <Wifi size={14} />
                          : <WifiOff size={14} />}

                        {online ? 'Online' : 'No recent connection'}
                      </span>

                      <span>
                        {device?.battery_percent ??
                          reading?.battery_percent ??
                          '—'}% battery
                      </span>

                    </div>

                    <small className="sc-last-seen">
                      Last device contact:
                      {' '}
                      {formatTime(device?.last_seen_at)}
                    </small>

                  </article>

                );
              })}

            </div>

          ) : (

            <div className="sc-empty">
              <Users />
              <strong>No workers assigned to this account</strong>
              <span>
                Ask the WorkerCare administrator to create worker records and assign access.
              </span>
            </div>

          )}

        </section>

      </section>

    </main>
  );
}
