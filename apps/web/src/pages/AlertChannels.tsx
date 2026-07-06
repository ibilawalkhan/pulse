import { Bell, Mail, Plus, Slack, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../components/Modal';
import { EmptyState, ErrorState, Loading } from '../components/ui';
import { api, apiErrorMessage } from '../lib/api';
import { useApi } from '../lib/useApi';
import type { AlertChannel, AlertChannelType } from '../lib/types';

export function AlertChannels() {
  const { data, loading, error, reload } = useApi(() => api.alertChannels.list(), []);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<AlertChannelType>('EMAIL');
  const [destination, setDestination] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const channels: AlertChannel[] = data ?? [];

  const remove = async (id: string): Promise<void> => {
    await api.alertChannels.remove(id);
    reload();
  };

  const add = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      await api.alertChannels.create({ type, destination });
      setDestination('');
      setType('EMAIL');
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not add channel'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Alert channels</h1>
          <p>Where Pulse sends DOWN and RECOVERY notifications.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} />
          Add channel
        </button>
      </div>

      <div className="card">
        {loading ? (
          <Loading label="Loading channels…" />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : channels.length === 0 ? (
          <EmptyState
            icon={<Bell size={22} />}
            title="No alert channels yet"
            text="Add an email address or Slack webhook so you're notified the moment a monitor goes down."
            action={
              <button className="btn btn-primary" onClick={() => setOpen(true)}>
                <Plus size={16} />
                Add channel
              </button>
            }
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Destination</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <span
                        className="stat-icon"
                        style={{
                          margin: 0,
                          width: 34,
                          height: 34,
                          background: c.type === 'EMAIL' ? 'var(--brand-soft)' : 'var(--up-soft)',
                          color: c.type === 'EMAIL' ? 'var(--brand)' : 'var(--up)',
                        }}
                      >
                        {c.type === 'EMAIL' ? <Mail size={16} /> : <Slack size={16} />}
                      </span>
                      <span className="cell-strong">
                        {c.type === 'EMAIL' ? 'Email' : 'Slack webhook'}
                      </span>
                    </div>
                  </td>
                  <td
                    className="mono muted"
                    style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {c.destination}
                  </td>
                  <td>
                    <span className={`pill ${c.enabled ? 'pill-up' : 'pill-pending'}`}>
                      <span className="dot" /> {c.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ width: 48 }}>
                    <button
                      className="btn-icon"
                      style={{ color: 'var(--down)' }}
                      onClick={() => remove(c.id)}
                      aria-label="Delete channel"
                    >
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={open}
        title="Add alert channel"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" form="add-channel" type="submit" disabled={saving}>
              <Plus size={16} />
              {saving ? 'Adding…' : 'Add channel'}
            </button>
          </>
        }
      >
        <form id="add-channel" onSubmit={add}>
          {formError && (
            <div className="banner banner-danger" style={{ marginBottom: 14 }}>
              {formError}
            </div>
          )}
          <div className="field">
            <label htmlFor="c-type">Channel type</label>
            <select
              id="c-type"
              className="select"
              value={type}
              onChange={(e) => setType(e.target.value as AlertChannelType)}
            >
              <option value="EMAIL">Email</option>
              <option value="SLACK_WEBHOOK">Slack webhook</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="c-dest">{type === 'EMAIL' ? 'Email address' : 'Webhook URL'}</label>
            <input
              id="c-dest"
              className={type === 'EMAIL' ? 'input' : 'input mono'}
              type={type === 'EMAIL' ? 'email' : 'url'}
              placeholder={
                type === 'EMAIL' ? 'oncall@company.com' : 'https://hooks.slack.com/services/…'
              }
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
