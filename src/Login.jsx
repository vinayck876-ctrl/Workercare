import React, { useState } from 'react';
import { UserRound, LockKeyhole, Eye, EyeOff, ArrowRight, HardHat, Users, BriefcaseBusiness } from 'lucide-react';

// Demo-only accounts. These credentials are visible in the frontend bundle.
// Replace this with server-side authentication before using real worker data.
const DEMO_ACCOUNTS = [
  { username: 'supervisor', password: 'super123', name: 'Site Supervisor', role: 'Supervisor', loginRole: 'supervisor', linkedWorkerIds: ['WK-1042', 'WK-1016'] },
  { username: 'family1', password: 'family123', name: 'Family Member 1', role: 'Family Member', loginRole: 'family', linkedWorkerIds: ['WK-1038'] },
  { username: 'family2', password: 'family456', name: 'Family Member 2', role: 'Family Member', loginRole: 'family', linkedWorkerIds: ['WK-1038'] },
  { username: 'vendor', password: 'vendor123', name: 'Meena Devi', role: 'Worker', workerType: 'Street Vendor', loginRole: 'worker', workerId: 'WK-1038' },
  { username: 'worker1', password: 'worker123', name: 'Arun Kumar', role: 'Worker', workerType: 'Construction Worker', loginRole: 'worker', workerId: 'WK-1042' },
  { username: 'worker2', password: 'worker456', name: 'Suresh Babu', role: 'Worker', workerType: 'Construction Worker', loginRole: 'worker', workerId: 'WK-1016' },
];

const ROLE_OPTIONS = [
  { value: 'supervisor', label: 'Supervisor', detail: 'Manage a construction site and its workers', Icon: HardHat },
  { value: 'family', label: 'Family member', detail: 'View safety updates for a linked worker', Icon: Users },
  { value: 'worker', label: 'Worker', detail: 'View your own safety information', Icon: BriefcaseBusiness },
];

export default function Login({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    const account = DEMO_ACCOUNTS.find(item =>
      item.loginRole === selectedRole &&
      item.username === username.trim().toLowerCase() &&
      item.password === password
    );
    if (!account) {
      setError('Those demo credentials do not match the selected account type.');
      return;
    }
    onLogin({ ...account, remember });
  }

  const selectedRoleInfo = ROLE_OPTIONS.find(role => role.value === selectedRole);

  return <main className="wc-clean-page">
    <section className="wc-clean-card" aria-label="WorkerCare sign in">
      <div className="wc-clean-logo"><HardHat size={27} strokeWidth={2.1}/></div>
      <h1>Worker<span>Care</span></h1>
      <p className="wc-clean-subtitle">Sign in to your safety portal</p>

      <form onSubmit={submit} className="wc-clean-form">
        <label className="wc-clean-role-label" htmlFor="account-role">Choose your account type</label>
        <div className="wc-clean-role-options" role="group" aria-label="Account type">
          {ROLE_OPTIONS.map(({ value, label, detail, Icon }) => (
            <button
              type="button"
              key={value}
              className={selectedRole === value ? 'wc-clean-role-option selected' : 'wc-clean-role-option'}
              onClick={() => { setSelectedRole(value); setError(''); }}
              aria-pressed={selectedRole === value}
            >
              <Icon size={20}/>
              <span><strong>{label}</strong><small>{detail}</small></span>
            </button>
          ))}
        </div>
        <input id="account-role" type="hidden" value={selectedRole} readOnly />

        <label className="wc-clean-field"><UserRound size={19}/><input aria-label="Username" autoComplete="username" value={username} onChange={e => {setUsername(e.target.value);setError('');}} placeholder="Username" required /></label>
        <label className="wc-clean-field"><LockKeyhole size={19}/><input aria-label="Password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => {setPassword(e.target.value);setError('');}} placeholder="Password" required/><button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></label>
        <div className="wc-clean-options"><label><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/> Remember me</label></div>
        {error && <div className="wc-clean-error" role="alert">{error}</div>}
        <button className="wc-clean-submit" type="submit" disabled={!selectedRole}>Login <ArrowRight size={19}/></button>
      </form>

      <div className="wc-clean-demo-note">
        <strong>{selectedRoleInfo ? selectedRoleInfo.label + ' demo sign-in' : 'Prototype sign-in'}</strong>
        <span>Use the demo credentials from the project README. This prototype login is not secure authentication.</span>
      </div>
      <div className="wc-clean-footer">WorkerCare Safety Portal · Prototype</div>
    </section>
  </main>;
}
