import { LogIn } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { apiErrorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';

export function Login() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to="/app" replace />;
  }

  const onSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid email or password'));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h1>Welcome back</h1>
      <p className="sub">Sign in to your Pulse dashboard.</p>
      {error && (
        <div className="banner banner-danger" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
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
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={submitting}
        >
          <LogIn size={16} />
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div className="auth-switch">
        Don&apos;t have an account? <Link to="/register">Create one</Link>
      </div>
    </AuthLayout>
  );
}
