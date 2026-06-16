import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: 'var(--brand)' }}>404</div>
        <h1 style={{ marginTop: 8 }}>Page not found</h1>
        <p className="muted" style={{ margin: '8px 0 20px' }}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link to="/app" className="btn btn-primary">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
