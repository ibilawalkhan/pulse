import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { apiErrorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';

export function Register() {
  const { register, status } = useAuth();
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
      await register(email, password);
      navigate('/app');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create account'));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h1>Create your account</h1>
      <p className="sub">Start monitoring your endpoints in minutes.</p>
      {error && (
        <div className="banner banner-danger" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
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
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={submitting}
        >
          <UserPlus size={16} />
          {submitting ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <div className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </div>
    </AuthLayout>
  );
}
