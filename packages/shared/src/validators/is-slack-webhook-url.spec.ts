import { isSlackWebhookUrl } from './is-slack-webhook-url';

describe('isSlackWebhookUrl', () => {
  it('accepts an https hooks.slack.com URL', () => {
    expect(isSlackWebhookUrl('https://hooks.slack.com/services/T00/B00/xyz')).toBe(true);
  });

  it('rejects non-https, other hosts, and junk', () => {
    expect(isSlackWebhookUrl('http://hooks.slack.com/services/x')).toBe(false);
    expect(isSlackWebhookUrl('https://evil.com/services/x')).toBe(false);
    expect(isSlackWebhookUrl('https://hooks.slack.com.evil.com/x')).toBe(false);
    expect(isSlackWebhookUrl('not a url')).toBe(false);
    expect(isSlackWebhookUrl(undefined)).toBe(false);
  });
});
