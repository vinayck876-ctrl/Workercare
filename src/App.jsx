import React, { useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Bell, Check,
  CheckCircle2, ChevronDown, Clock3, CloudSun, HardHat, LayoutDashboard,
  LifeBuoy, MapPin, Menu, MoreHorizontal, Radio, Search, Settings,
  ShieldCheck, Thermometer, Users, Wifi, X, Zap, BatteryMedium
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { initialAlerts, initialWorkers, temperatureData } from './data/demo';
import Login from './Login.jsx';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Workers', icon: Users },
  { label: 'Live monitoring', icon: Activity },
  { label: 'Alerts & incidents', icon: Bell, count: 2 },
  { label: 'Device management', icon: Radio },
];

function StatCard({ title, value, unit, note, icon: Icon, tone, trend }) {
  return <article className="stat-card">
    <div className="stat-top"><span>{title}</span><span className={`stat-icon ${tone}`}><Icon size={18}/></span></div>
    <div className="stat-value">{value}<small>{unit}</small></div>
    <div className="stat-note">{trend && <span className={trend === 'up' ? 'trend-up' : 'trend-down'}>{trend === 'up' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {note}</span>}{!trend && <span>{note}</span>}</div>
  </article>;
}

function StatusPill({ status }) {
  const cls = status.toLowerCase();
  return <span className={`status-pill ${cls}`}><i/>{status}</span>;
}

function App() {
  const [active, setActive] = useState('Overview');
  const [workers, setWorkers] = useState(initialWorkers);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [search, setSearch] = useState('');
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [toast, setToast] = useState('');
  const [range, setRange] = useState('Today');
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('workercare-user') || 'null'); }
    catch { return null; }
  });

  const visibleWorkerIds = currentUser?.role === 'Supervisor'
    ? currentUser.linkedWorkerIds
    : currentUser?.role === 'Family Member'
      ? currentUser.linkedWorkerIds
      : currentUser?.workerId ? [currentUser.workerId] : [];
  const visibleWorkers = workers.filter(w => visibleWorkerIds.includes(w.id));
  const filteredWorkers = useMemo(() => visibleWorkers.filter(w =>
    [w.name, w.id, w.role, w.site].join(' ').toLowerCase().includes(search.toLowerCase())
  ), [workers, search, currentUser]);
  const visibleAlerts = alerts.filter(a => visibleWorkerIds.includes(a.workerId));
  const openAlerts = visibleAlerts.filter(a => a.state === 'Open').length;
  const safeWorkers = visibleWorkers.filter(w => w.status === 'Safe').length;

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  }

  function simulateSOS() {
    const id = Date.now();
    const workerId = currentUser?.workerId || visibleWorkerIds[0];
    const worker = workers.find(w => w.id === workerId);
    setAlerts(prev => [{ id, workerId, type: 'danger', title: 'SOS test alert triggered', detail: `${worker?.name || 'Linked worker'} · Dashboard simulation`, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), state: 'Open' }, ...prev]);
    notify('Demo SOS alert added. No emergency service was contacted.');
    setActive('Alerts & incidents');
  }

  function acknowledge(id) {
    setAlerts(prev => prev.map(a => a.id === id ? {...a, state:'Acknowledged'} : a));
    notify('Alert acknowledged.');
  }

  function handleLogin(user) {
    sessionStorage.setItem('workercare-user', JSON.stringify(user));
    setCurrentUser(user);
  }

  function handleLogout() {
    sessionStorage.removeItem('workercare-user');
    setCurrentUser(null);
    setActive('Overview');
  }

  if (!currentUser) return <Login onLogin={handleLogin} />;

  const pageTitle = active === 'Overview' ? 'Overview' : active;
  return <div className="app-shell">
    <aside className={`sidebar ${showMobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand">
        <div className="brand-mark"><ShieldCheck size={22}/></div>
        <div><strong>worker<span>care</span></strong><small>WORKFORCE SAFETY</small></div>
        <button className="mobile-close icon-button" onClick={() => setShowMobileNav(false)} aria-label="Close menu"><X size={18}/></button>
      </div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav">
        {navItems.map(({label, icon: Icon, count}) => <button key={label} className={active === label ? 'nav-item active' : 'nav-item'} onClick={() => {setActive(label); setShowMobileNav(false);}}>
          <Icon size={18}/><span>{label}</span>{count && <b>{count}</b>}
        </button>)}
      </nav>
      <div className="workspace-label tools-label">PREFERENCES</div>
      <button className="nav-item" onClick={() => notify('Settings are coming in the next build.')}><Settings size={18}/><span>Settings</span></button>
      <div className="sidebar-bottom">
        <div className="help-card"><div className="help-icon"><LifeBuoy size={18}/></div><strong>Need a hand?</strong><p>Find setup guidance and product support.</p><button onClick={() => notify('Support documentation will be added soon.')}>View help <span>↗</span></button></div>
        <div className="profile-row"><div className="profile-avatar">{currentUser.name.split(' ').map(part => part[0]).slice(0,2).join('').toUpperCase()}</div><div className="profile-copy"><strong>{currentUser.name}</strong><small>{currentUser.role}</small></div><button className="logout-button" onClick={handleLogout} title="Sign out">Sign out</button></div>
      </div>
    </aside>

    {showMobileNav && <button className="mobile-scrim" onClick={() => setShowMobileNav(false)} aria-label="Close navigation"/>}
    <main className="main-content">
      <header className="topbar">
        <div className="topbar-left"><button className="mobile-menu icon-button" onClick={() => setShowMobileNav(true)} aria-label="Open menu"><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{pageTitle}</strong></div></div>
        <div className="topbar-right"><span className="demo-badge"><i/> DEMO ENVIRONMENT</span><button className="icon-button notification-button" onClick={() => setActive('Alerts & incidents')} aria-label="View alerts"><Bell size={19}/><i/></button><div className="top-avatar" title={currentUser.name}>{currentUser.name.split(' ').map(part => part[0]).slice(0,2).join('').toUpperCase()}</div></div>
      </header>

      <div className="page-wrap">
        <section className="page-heading">
          <div><div className="eyebrow">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()} <span>•</span> LIVE OPERATIONS</div><h1>{pageTitle}</h1><p>Monitor safety information for your linked people.</p></div>
          <div className="heading-actions"><button className="button button-secondary" onClick={() => notify('Report export will be available when live data is connected.')}>Export report</button><button className="button button-primary" onClick={simulateSOS}><Zap size={16}/> Test SOS alert</button></div>
        </section>

        {active === 'Overview' && <>
          <section className="stat-grid">
            <StatCard title="Workers monitored" value={visibleWorkers.length} unit=" workers" note="Your linked assignments" icon={Users} tone="blue"/>
            <StatCard title="Workers safe" value={safeWorkers} unit={` / ${visibleWorkers.length}`} note="Currently in safe status" icon={ShieldCheck} tone="green" trend="up"/>
            <StatCard title="Active alerts" value={openAlerts} unit=" alerts" note="Requires attention" icon={AlertTriangle} tone="orange"/>
            <StatCard title="Devices online" value="12" unit=" / 14" note="2 devices need a check" icon={Radio} tone="purple"/>
          </section>

          <section className="content-grid">
            <article className="panel chart-panel">
              <div className="panel-heading"><div><h2>Environmental overview</h2><p>Ambient temperature across monitored sites</p></div><select value={range} onChange={e => setRange(e.target.value)} aria-label="Chart time range"><option>Today</option><option>Last 7 days</option></select></div>
              <div className="chart-legend"><span><i className="legend-temp"/> Temperature <b>°C</b></span><span className="chart-context"><CloudSun size={15}/> Heat conditions elevated</span></div>
              <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={temperatureData} margin={{top:12,right:8,left:-18,bottom:0}}><defs><linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e89b52" stopOpacity={0.22}/><stop offset="95%" stopColor="#e89b52" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid stroke="#edf0f4" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill:'#8792a2',fontSize:11}} dy={10}/><YAxis domain={[20,40]} axisLine={false} tickLine={false} tick={{fill:'#8792a2',fontSize:11}}/><Tooltip contentStyle={{border:'1px solid #e8ecf1',borderRadius:10,fontSize:12}} formatter={(v) => [`${v} °C`, 'Temperature']}/><Area type="monotone" dataKey="temp" stroke="#dc9148" strokeWidth={2.5} fill="url(#tempFill)" activeDot={{r:5,strokeWidth:0}}/></AreaChart></ResponsiveContainer></div>
              <div className="chart-foot"><span><i className="dot-orange"/> Peak reading: <strong>37°C</strong></span><span>Sample dashboard data</span></div>
            </article>

            <article className="panel conditions-panel">
              <div className="panel-heading"><div><h2>Site conditions</h2><p>Latest environmental readings</p></div><button className="icon-button subtle-button" onClick={() => notify('Site readings are sample data.')}><MoreHorizontal size={19}/></button></div>
              <div className="condition-card"><div className="condition-top"><span className="site-icon"><MapPin size={16}/></span><span className="condition-site">North Site</span><StatusPill status="Warning"/></div><div className="condition-reading"><div><Thermometer size={17}/><strong>36.4°</strong><small>C</small></div><div><CloudSun size={17}/><strong>68</strong><small>% RH</small></div></div><div className="condition-foot">Heat exposure risk is elevated</div></div>
              <div className="condition-card"><div className="condition-top"><span className="site-icon purple-site"><MapPin size={16}/></span><span className="condition-site">Market Road</span><StatusPill status="Safe"/></div><div className="condition-reading"><div><Thermometer size={17}/><strong>31.2°</strong><small>C</small></div><div><CloudSun size={17}/><strong>59</strong><small>% RH</small></div></div><div className="condition-foot">Conditions within demo thresholds</div></div>
              <div className="panel-link" onClick={() => setActive('Live monitoring')}>View site monitoring <span>→</span></div>
            </article>
          </section>

          <section className="lower-grid">
            <article className="panel workers-panel">
              <div className="panel-heading"><div><h2>Worker status</h2><p>People wearing active WorkerCare devices</p></div><button className="text-button" onClick={() => setActive('Workers')}>View all <span>→</span></button></div>
              <div className="table-tools"><div className="search-box"><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search workers..." /></div><span className="table-count">{filteredWorkers.length} workers</span></div>
              <div className="table-scroll"><table><thead><tr><th>WORKER</th><th>WORK SITE</th><th>STATUS</th><th>BATTERY</th><th>LAST UPDATE</th></tr></thead><tbody>{filteredWorkers.map(w => <tr key={w.id}><td><div className="worker-cell"><div className={`worker-avatar ${w.color}`}>{w.initials}</div><div><strong>{w.name}</strong><small>{w.id}</small></div></div></td><td>{w.site}</td><td><StatusPill status={w.status}/></td><td><div className="battery-cell"><BatteryMedium size={15}/>{w.battery}%</div></td><td className="muted-cell">{w.lastSeen}</td></tr>)}</tbody></table></div>
            </article>
            <article className="panel alerts-panel">
              <div className="panel-heading"><div><h2>Recent alerts</h2><p>Latest safety events</p></div><button className="text-button" onClick={() => setActive('Alerts & incidents')}>View all <span>→</span></button></div>
              <div className="alert-list">{visibleAlerts.slice(0,3).map(a => <div className="alert-item" key={a.id}><div className={`alert-symbol ${a.type}`}>{a.type === 'success' ? <CheckCircle2 size={17}/> : a.type === 'danger' ? <LifeBuoy size={17}/> : <AlertTriangle size={17}/>}</div><div className="alert-copy"><strong>{a.title}</strong><small>{a.detail}</small><span><Clock3 size={12}/>{a.time}</span></div><StatusPill status={a.state}/></div>)}</div>
            </article>
          </section>
        </>}

        {active === 'Workers' && <section className="panel full-panel"><div className="panel-heading"><div><h2>Worker directory</h2><p>Manage and review monitored workers</p></div><div className="search-box"><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search workers..."/></div></div><div className="table-scroll"><table><thead><tr><th>WORKER</th><th>ROLE</th><th>WORK SITE</th><th>STATUS</th><th>BATTERY</th><th>LAST UPDATE</th></tr></thead><tbody>{filteredWorkers.map(w=><tr key={w.id}><td><div className="worker-cell"><div className={`worker-avatar ${w.color}`}>{w.initials}</div><div><strong>{w.name}</strong><small>{w.id}</small></div></div></td><td>{w.role}</td><td>{w.site}</td><td><StatusPill status={w.status}/></td><td>{w.battery}%</td><td>{w.lastSeen}</td></tr>)}</tbody></table></div></section>}

        {active === 'Live monitoring' && <section className="monitor-grid"><article className="panel monitor-card"><div className="panel-heading"><div><h2><MapPin size={17}/> North Site</h2><p>Environmental sensor · Demo readings</p></div><StatusPill status="Warning"/></div><div className="monitor-metrics"><div><Thermometer/><strong>36.4°C</strong><span>Ambient temperature</span></div><div><CloudSun/><strong>68%</strong><span>Relative humidity</span></div><div><Users/><strong>2</strong><span>Workers assigned</span></div></div><div className="notice-box warning-notice"><AlertTriangle size={18}/><div><strong>Elevated environmental readings</strong><p>Consider shade, rest breaks and hydration according to workplace safety guidance.</p></div></div></article><article className="panel monitor-card"><div className="panel-heading"><div><h2><MapPin size={17}/> Market Road</h2><p>Environmental sensor · Demo readings</p></div><StatusPill status="Safe"/></div><div className="monitor-metrics"><div><Thermometer/><strong>31.2°C</strong><span>Ambient temperature</span></div><div><CloudSun/><strong>59%</strong><span>Relative humidity</span></div><div><Users/><strong>2</strong><span>Workers assigned</span></div></div><div className="notice-box safe-notice"><CheckCircle2 size={18}/><div><strong>No active environmental warning</strong><p>Continue routine monitoring and scheduled breaks.</p></div></div></article><div className="demo-note"><Wifi size={16}/> Live hardware connection is not configured yet. Values shown here are illustrative demo data.</div></section>}

        {active === 'Alerts & incidents' && <section className="panel full-panel"><div className="panel-heading"><div><h2>Alerts & incidents</h2><p>Review safety events and acknowledge follow-up</p></div><StatusPill status={`${openAlerts} Open`}/></div><div className="incident-list">{visibleAlerts.map(a=><div className="incident-row" key={a.id}><div className={`alert-symbol ${a.type}`}>{a.type === 'success' ? <CheckCircle2/> : a.type === 'danger' ? <LifeBuoy/> : <AlertTriangle/>}</div><div className="incident-main"><strong>{a.title}</strong><p>{a.detail}</p><small>{a.time}</small></div><div className="incident-action"><StatusPill status={a.state}/>{a.state === 'Open' && <button className="button button-secondary small-button" onClick={()=>acknowledge(a.id)}><Check size={14}/> Acknowledge</button>}</div></div>)}</div><p className="demo-disclaimer">Demo alerts are local to this browser session. They are not sent to workers, contacts or emergency services.</p></section>}

        {active === 'Device management' && <section className="panel full-panel"><div className="panel-heading"><div><h2>Device management</h2><p>Connectivity and battery overview</p></div><span className="demo-badge"><i/> SAMPLE INVENTORY</span></div><div className="device-grid">{workers.map(w=><div className="device-card" key={w.id}><div className="device-top"><span className="device-icon"><Radio size={19}/></span><StatusPill status="Online"/></div><strong>{w.id}</strong><span>{w.name}</span><div className="device-battery"><div><BatteryMedium size={15}/> Battery level</div><b>{w.battery}%</b></div><div className="battery-track"><i style={{width:w.battery+'%'}}/></div><small>Last seen {w.lastSeen}</small></div>)}</div></section>}

        <footer className="footer"><span>© 2026 WorkerCare · Prototype dashboard</span><span><i/> Demo data · Not connected to wearable hardware</span></footer>
      </div>
    </main>
    {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}<button onClick={()=>setToast('')} aria-label="Dismiss"><X size={15}/></button></div>}
  </div>;
}

export default App;