import { LogIn } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../lib/auth';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('kbilawal84437@gmail.com');
  const [password, setPassword] = useState('demo-password');

  const onSubmit = (e: FormEvent): void => {
    e.preventDefault();
    login(email);
    navigate('/app');
  };

  return (
    <AuthLayout>
      <h1>Welcome back</h1>
      <p className="sub">Sign in to your Pulse dashboard.</p>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <span className="hint">Demo mode — any credentials sign you in.</span>
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          <LogIn size={16} />
          Sign in
        </button>
      </form>
      <div className="auth-switch">
        Don&apos;t have an account? <Link to="/register">Create one</Link>
      </div>
    </AuthLayout>
  );
}
