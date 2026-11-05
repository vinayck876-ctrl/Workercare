import React, { useState } from 'react';
import { UserRound, LockKeyhole, Eye, EyeOff, ArrowRight, HardHat } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { username: 'supervisor', password: 'super123', name: 'Site Supervisor', role: 'Supervisor', linkedWorkerIds: ['WK-1042', 'WK-1016'] },
  { username: 'family1', password: 'family123', name: 'Family Member 1', role: 'Family Member', linkedWorkerIds: ['WK-1038'] },
  { username: 'family2', password: 'family456', name: 'Family Member 2', role: 'Family Member', linkedWorkerIds: ['WK-1038'] },
  { username: 'vendor', password: 'vendor123', name: 'Meena Devi', role: 'Street Vendor', workerId: 'WK-1038' },
  { username: 'worker1', password: 'worker123', name: 'Arun Kumar', role: 'Construction Worker', workerId: 'WK-1042' },
  { username: 'worker2', password: 'worker456', name: 'Suresh Babu', role: 'Construction Worker', workerId: 'WK-1016' },
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
    onLogin({ ...account, remember });
  }
  return <main className="wc-clean-page">
    <section className="wc-clean-card" aria-label="WorkerCare sign in">
      <div className="wc-clean-logo"><HardHat size={27} strokeWidth={2.1}/></div>
      <h1>Worker<span>Care</span></h1>
      <p className="wc-clean-subtitle">Sign in to continue</p>
      <form onSubmit={submit} className="wc-clean-form">
        <label className="wc-clean-field"><UserRound size={19}/><input aria-label="Username" autoComplete="username" value={username} onChange={e => {setUsername(e.target.value);setError('');}} placeholder="Username" required /></label>
        <label className="wc-clean-field"><LockKeyhole size={19}/><input aria-label="Password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => {setPassword(e.target.value);setError('');}} placeholder="Password" required/><button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></label>
        <div className="wc-clean-options"><label><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/> Remember me</label></div>
        {error && <div className="wc-clean-error" role="alert">{error}</div>}
        <button className="wc-clean-submit" type="submit">Login <ArrowRight size={19}/></button>
      </form>
      <div className="wc-clean-footer">WorkerCare Safety Portal</div>
    </section>
  </main>;
}
