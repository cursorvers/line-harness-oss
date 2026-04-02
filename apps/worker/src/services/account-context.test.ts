import { buildScheduledAccountContexts } from './account-context.js';

describe('buildScheduledAccountContexts', () => {
  it('includes default context and active account contexts', () => {
    const contexts = buildScheduledAccountContexts('env-token', [
      { id: 'acc-1', channel_access_token: 'token-1', is_active: 1 },
      { id: 'acc-2', channel_access_token: 'token-2', is_active: 0 },
      { id: 'acc-3', channel_access_token: 'token-3', is_active: 1 },
    ]);

    expect(contexts).toEqual([
      { token: 'env-token', lineAccountId: null },
      { token: 'token-1', lineAccountId: 'acc-1' },
      { token: 'token-3', lineAccountId: 'acc-3' },
    ]);
  });

  it('keeps both contexts when env token equals an account token', () => {
    const contexts = buildScheduledAccountContexts('shared-token', [
      { id: 'acc-1', channel_access_token: 'shared-token', is_active: 1 },
    ]);

    expect(contexts).toEqual([
      { token: 'shared-token', lineAccountId: null },
      { token: 'shared-token', lineAccountId: 'acc-1' },
    ]);
  });
});
