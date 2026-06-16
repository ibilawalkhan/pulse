import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CheckPoint, UptimeWindow } from '../lib/types';

interface Props {
  series: CheckPoint[];
  window: UptimeWindow;
  color?: string;
  height?: number;
}

interface TooltipPayload {
  active?: boolean;
  payload?: Array<{ payload: CheckPoint }>;
}

function ChartTooltip({ active, payload, window }: TooltipPayload & { window: UptimeWindow }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  const date = new Date(point.t);
  const label =
    window === '24h'
      ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  return (
    <div className="tooltip-card">
      <div className="t">{label}</div>
      {point.up ? (
        <div>
          <strong>{point.responseMs} ms</strong> response
        </div>
      ) : (
        <div style={{ color: 'var(--down)', fontWeight: 600 }}>Outage — no response</div>
      )}
    </div>
  );
}

export function ResponseTimeChart({ series, window, color = '#6366f1', height = 280 }: Props) {
  const tickFmt = (t: string): string => {
    const d = new Date(t);
    return window === '24h'
      ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="chart-wrap" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="rtFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="t"
            tickFormatter={tickFmt}
            tick={{ fontSize: 11, fill: 'var(--text-faint)' }}
            axisLine={false}
            tickLine={false}
            minTickGap={36}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-faint)' }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v: number) => `${v}ms`}
          />
          <Tooltip
            content={(props) => <ChartTooltip {...(props as TooltipPayload)} window={window} />}
            cursor={{ stroke: 'var(--surface-border)' }}
          />
          <Area
            type="monotone"
            dataKey="responseMs"
            stroke={color}
            strokeWidth={2}
            fill="url(#rtFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
