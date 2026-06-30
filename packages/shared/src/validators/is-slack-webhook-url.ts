/**
 * Whether a string is a Slack incoming-webhook URL. Restricted to
 * https://hooks.slack.com/... — both for correctness and because the worker
 * POSTs to this URL, so we don't want it pointed at arbitrary hosts.
 */
export function isSlackWebhookUrl(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === 'https:' && url.hostname.toLowerCase() === 'hooks.slack.com';
}
