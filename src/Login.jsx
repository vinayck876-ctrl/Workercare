import { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, LockKeyhole, UserRound, ArrowRight, HardHat, Activity } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    const account = DEMO_ACCOUNTS.find(item =>
      item.username === username.trim().toLowerCase() && item.password === password
    );
    if (!account) {
      setError('Incorrect username or password. Please try a demo account.');
      return;
    }
    onLogin({ name: account.name, role: account.role, username: account.username });
  }

  return <main className="login-screen">
    <section className="login-brand-panel">
      <div className="login-brand">
        <span className="login-brand-mark"><ShieldCheck size={25}/></span>
        <span>worker<strong>care</strong></span>
      </div>
      <div className="login-message">
        <span className="login-kicker">WORKFORCE SAFETY PLATFORM</span>
        <h1>Every worker deserves to return home <em>safe.</em></h1>
        <p>A simple safety monitoring prototype designed for the people who keep our communities moving.</p>
        <div className="login-feature-list">
          <div><span><Activity size={17}/></span><div><b>Environmental awareness</b><small>Monitor workplace heat conditions</small></div></div>
          <div><span><ShieldCheck size={17}/></span><div><b>Worker-first safety</b><small>Review alerts and worker status</small></div></div>
          <div><span><HardHat size={17}/></span><div><b>One connected workspace</b><small>Designed for site teams and safety officers</small></div></div>
        </div>
      </div>
      <div className="login-brand-footer">WORKERCARE · PROTOTYPE EDITION <span>DEMO ENVIRONMENT</span></div>
    </section>
    <section className="login-form-panel">
      <div className="login-form-wrap">
        <div className="login-mobile-brand"><span className="login-brand-mark"><ShieldCheck size={22}/></span><span>worker<strong>care</strong></span></div>
        <div className="login-heading"><span className="login-kicker">WELCOME BACK</span><h2>Sign in to your workspace</h2><p>Enter one of the prototype accounts to continue.</p></div>
        <form className="login-form" onSubmit={submit}>
          <label htmlFor="wc-username">Username</label>
          <div className="login-input"><UserRound size={17}/><input id="wc-username" autoComplete="username" value={username} onChange={e => {setUsername(e.target.value);setError('');}} placeholder="Enter username" required/></div>
          <label htmlFor="wc-password">Password</label>
          <div className="login-input"><LockKeyhole size={17}/><input id="wc-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => {setPassword(e.target.value);setError('');}} placeholder="Enter password" required/><button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>
          {error && <div className="login-error" role="alert">{error}</div>}
          <button className="login-submit" type="submit">Sign in <ArrowRight size={17}/></button>
        </form>
        <div className="demo-credentials">
          <div className="demo-credentials-heading"><span>DEMO ACCESS</span><span>5 ACCOUNTS</span></div>
          <div className="demo-account-list">
            {DEMO_ACCOUNTS.map(account => <button type="button" key={account.username} onClick={() => {setUsername(account.username);setPassword(account.password);setError('');}}>
              <span><b>{account.name}</b><small>{account.role}</small></span><code>{account.username}</code>
            </button>)}
          </div>
          <p>Select an account above to autofill its credentials. Passwords are shown in the project README for this prototype.</p>
        </div>
        <div className="login-legal">Prototype access only · No real worker or medical data is stored.</div>
      </div>
    </section>
  </main>;
}