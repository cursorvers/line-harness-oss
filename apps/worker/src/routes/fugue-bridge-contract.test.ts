import { Hono } from 'hono';
import type { Env } from '../index.js';

const dbMocks = vi.hoisted(() => ({
  getLineAccounts: vi.fn(),
}));

const sdkMocks = vi.hoisted(() => ({
  verifySignature: vi.fn(),
}));

vi.mock('@line-crm/db', () => dbMocks);
vi.mock('@line-crm/line-sdk', () => sdkMocks);

import { authMiddleware } from '../middleware/auth.js';
import { fugueBridge } from './fugue-bridge.js';

function makeDb(): D1Database {
  return {
    prepare: vi.fn(() => ({
      bind: vi.fn(() => ({
        run: vi.fn().mockResolvedValue({}),
      })),
    })),
  } as unknown as D1Database;
}

function makeEnv(overrides: Partial<Env['Bindings']> = {}): Env['Bindings'] {
  return {
    DB: makeDb(),
    LINE_CHANNEL_SECRET: 'secret',
    LINE_CHANNEL_ACCESS_TOKEN: 'token',
    API_KEY: 'api-key',
    LIFF_URL: 'https://liff.line.me/example',
    LINE_CHANNEL_ID: 'line-channel-id',
    LINE_LOGIN_CHANNEL_ID: 'login-channel-id',
    LINE_LOGIN_CHANNEL_SECRET: 'login-channel-secret',
    WORKER_URL: 'https://line-crm-worker.line-crm-api.workers.dev',
    ...overrides,
  } as Env['Bindings'];
}

describe('fugue bridge contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getLineAccounts.mockResolvedValue([]);
  });

  it('bypasses bearer auth for /webhooks/line/fugue-bridge', async () => {
    const app = new Hono<Env>();
    app.use('*', authMiddleware);
    app.post('/webhooks/line/fugue-bridge', (c) => c.json({ ok: true }));

    const res = await app.request(
      'http://localhost/webhooks/line/fugue-bridge',
      { method: 'POST' },
      makeEnv(),
    );

    expect(res.status).toBe(200);
  });

  it('returns 200 when LINE signature is invalid', async () => {
    sdkMocks.verifySignature.mockResolvedValue(false);

    const app = new Hono<Env>();
    app.route('/', fugueBridge);

    const res = await app.request(
      'http://localhost/webhooks/line/fugue-bridge',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Line-Signature': 'bad' },
        body: JSON.stringify({
          destination: 'channel',
          events: [{ type: 'follow', source: { type: 'user', userId: 'u123' } }],
        }),
      },
      makeEnv(),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('requires X-Fugue-Bridge-Token when configured', async () => {
    const app = new Hono<Env>();
    app.route('/', fugueBridge);

    const res = await app.request(
      'http://localhost/webhooks/line/fugue-bridge',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: 'channel', events: [] }),
      },
      makeEnv({ FUGUE_BRIDGE_TOKEN: 'bridge-secret' }),
    );

    expect(res.status).toBe(401);
    expect(sdkMocks.verifySignature).not.toHaveBeenCalled();
  });

  it('returns 200 and performs no insert for non-follow events', async () => {
    sdkMocks.verifySignature.mockResolvedValue(true);
    const env = makeEnv();
    const app = new Hono<Env>();
    app.route('/', fugueBridge);

    const res = await app.request(
      'http://localhost/webhooks/line/fugue-bridge',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Line-Signature': 'good' },
        body: JSON.stringify({
          destination: 'channel',
          events: [{ type: 'message', source: { type: 'user', userId: 'u123' } }],
        }),
      },
      env,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
    expect((env.DB.prepare as unknown as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });
});
