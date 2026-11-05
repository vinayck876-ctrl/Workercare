import React, { useState } from 'react';
import { UserRound, LockKeyhole, Eye, EyeOff, ArrowRight, HardHat, ShieldCheck, Activity } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin123', name: 'WorkerCare Admin', role: 'Administrator' },
  { username: 'supervisor1', password: 'site123', name: 'North Site Supervisor', role: 'Site Supervisor' },
  { username: 'supervisor2', password: 'site123', name: 'Market Site Supervisor', role: 'Site Supervisor' },
  { username: 'safety', password: 'safety123', name: 'Safety Officer', role: 'Safety Officer' },
  { username: 'demo', password: 'demo123', name: 'Project Evaluator', role: 'Demo Viewer' },
];

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  function submit(event) {
    event.preventDefault();
    const account = DEMO_ACCOUNTS.find(item => item.username === username.trim().toLowerCase() && item.password === password);
    if (!account) { setError('Incorrect username or password'); return; }
    onLogin({ name: account.name, role: account.role, username: account.username, remember });
  }
  return <main className="wc-login-page">
    <section className="wc-visual-panel" aria-hidden="true">
      <div className="wc-orbit wc-orbit-one"/><div className="wc-orbit wc-orbit-two"/>
      <div className="wc-brand"><span className="wc-brand-icon"><Activity size={25}/></span><span>WorkerCare</span></div>
      <div className="wc-worker-art">
        <div className="wc-worker-glow"/>
        <div className="wc-hardhat-large"><HardHat size={104} strokeWidth={1.35}/></div>
        <div className="wc-worker-body"><div className="wc-worker-head"/><div className="wc-worker-vest"><span/><span/></div><div className="wc-worker-arm wc-worker-arm-left"/><div className="wc-worker-arm wc-worker-arm-right"/></div>
        <div className="wc-safety-chip"><ShieldCheck size={18}/><span>WORKER SAFETY</span></div>
      </div>
      <div className="wc-visual-caption">Protecting the people<br/>who keep us moving.</div>
      <div className="wc-visual-footer"><span>WORKERCARE</span><span>SAFETY MONITORING</span></div>
    </section>
    <section className="wc-form-panel">
      <div className="wc-form-card">
        <div className="wc-card-hardhat"><HardHat size={42} strokeWidth={1.6}/></div>
        <div className="wc-card-brand"><span>Worker</span><strong>Care</strong></div>
        <p className="wc-card-subtitle">Login to continue</p>
        <form className="wc-login-form" onSubmit={submit}>
          <label className="wc-field"><UserRound size={20}/><input aria-label="Username" autoComplete="username" value={username} onChange={e => {setUsername(e.target.value);setError('');}} placeholder="Username / Email" required /></label>
          <label className="wc-field"><LockKeyhole size={20}/><input aria-label="Password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => {setPassword(e.target.value);setError('');}} placeholder="Password" required/><button className="wc-password-toggle" type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</button></label>
          <div className="wc-form-options"><label className="wc-remember"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/><span>Remember me</span></label><span className="wc-secure-note"><ShieldCheck size={14}/> Secure access</span></div>
          {error && <div className="wc-login-error" role="alert">{error}</div>}
          <button className="wc-login-button" type="submit">Login <ArrowRight size={20}/></button>
        </form>
        <div className="wc-card-foot"><span className="wc-status-dot"/> WorkerCare safety portal</div>
      </div>
    </section>
  </main>;
}
