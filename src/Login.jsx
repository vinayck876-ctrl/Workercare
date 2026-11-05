import React, { useState } from 'react';

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
  return <main className="login-artboard">
    <form className="login-hotspots" onSubmit={submit} aria-label="WorkerCare login">
      <input className="art-username" aria-label="Username" autoComplete="username" value={username} onChange={e => { setUsername(e.target.value); setError(''); }} placeholder=" " required />
      <input className="art-password" aria-label="Password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder=" " required />
      <button className="art-eye" type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(v => !v)} />
      <input className="art-remember" type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} aria-label="Remember me" />
      <button className="art-submit" type="submit" aria-label="Login" />
      {error && <div className="art-error" role="alert">{error}</div>}
    </form>
  </main>;
}
