import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../lib/auth';

export function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = (e: FormEvent): void => {
    e.preventDefault();
    login(email);
    navigate('/app');
  };

  return (
    <AuthLayout>
      <h1>Create your account</h1>
      <p className="sub">Start monitoring your endpoints in minutes.</p>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="email">Work email</label>
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
            placeholder="At least 8 characters"
            minLength={8}
            required
          />
          <span className="hint">Demo mode — no account is actually created.</span>
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          <UserPlus size={16} />
          Create account
        </button>
      </form>
      <div className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </div>
    </AuthLayout>
  );
}
