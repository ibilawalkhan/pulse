import { Activity, BellRing, LineChart, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

const FEATURES = [
  {
    icon: LineChart,
    title: 'Real-time uptime',
    text: 'Sub-minute checks with response-time history.',
  },
  { icon: BellRing, title: 'Instant alerts', text: 'Email and Slack the moment something breaks.' },
  {
    icon: ShieldCheck,
    title: 'Incident tracking',
    text: 'Every outage recorded with cause and duration.',
  },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-wrap">
      <aside className="auth-aside">
        <div className="brand">
          <span className="brand-mark">
            <Activity size={18} strokeWidth={2.5} />
          </span>
          Pulse
        </div>
        <div>
          <h2>Know the moment your services go down.</h2>
          <p>
            Pulse monitors your HTTP endpoints around the clock, detects outages, and alerts your
            team — so you hear it from us, not your customers.
          </p>
          <div style={{ marginTop: 28 }}>
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div className="auth-feature" key={title}>
                <span className="ico">
                  <Icon size={18} />
                </span>
                <div>
                  <div style={{ fontWeight: 650 }}>{title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13 }}>{text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
          © {new Date().getFullYear()} Pulse — Uptime &amp; API monitoring
        </div>
      </aside>
      <main className="auth-main">
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}
