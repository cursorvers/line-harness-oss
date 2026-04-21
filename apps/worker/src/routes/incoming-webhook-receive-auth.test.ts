import { Hono } from 'hono';
import type { Env } from '../index.js';

const dbMocks = vi.hoisted(() => ({
  getIncomingWebhookById: vi.fn(),
}));

const eventBusMocks = vi.hoisted(() => ({
  fireEvent: vi.fn(),
}));

vi.mock('@line-crm/db', () => dbMocks);
vi.mock('../services/event-bus.js', () => eventBusMocks);

import { webhooks } from './webhooks.js';

async function hmacHex(secret: string, body: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function makeEnv(overrides: Partial<Env['Bindings']> = {}): Env['Bindings'] {
  return {
    DB: {} as D1Database,
    PUBLIC_WEBHOOK_MAX_BODY_BYTES: '65536',
    ...overrides,
  } as Env['Bindings'];
}

describe('incoming webhook receive auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects requests without a valid HMAC when secret is configured', async () => {
    dbMocks.getIncomingWebhookById.mockResolvedValue({
      id: 'wh-1',
      source_type: 'custom',
      secret: 'shared-secret',
      is_active: 1,
    });

    const app = new Hono<Env>();
    app.route('/', webhooks);

    const res = await app.request(
      'http://localhost/api/webhooks/incoming/wh-1/receive',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true }),
      },
      makeEnv(),
    );

    expect(res.status).toBe(401);
    expect(eventBusMocks.fireEvent).not.toHaveBeenCalled();
  });

  it('accepts a valid HMAC when secret is configured', async () => {
    dbMocks.getIncomingWebhookById.mockResolvedValue({
      id: 'wh-1',
      source_type: 'custom',
      secret: 'shared-secret',
      is_active: 1,
    });

    const rawBody = JSON.stringify({ ok: true });
    const signature = await hmacHex('shared-secret', rawBody);

    const app = new Hono<Env>();
    app.route('/', webhooks);

    const res = await app.request(
      'http://localhost/api/webhooks/incoming/wh-1/receive',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
        },
        body: rawBody,
      },
      makeEnv(),
    );

    expect(res.status).toBe(200);
    expect(eventBusMocks.fireEvent).toHaveBeenCalledWith(
      expect.anything(),
      'incoming_webhook.custom',
      expect.objectContaining({
        eventData: expect.objectContaining({ webhookId: 'wh-1' }),
      }),
    );
  });

  it('rejects oversized requests before parsing the JSON body', async () => {
    const app = new Hono<Env>();
    app.route('/', webhooks);

    const res = await app.request(
      'http://localhost/api/webhooks/incoming/wh-1/receive',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': '70000',
        },
        body: JSON.stringify({ ok: true }),
      },
      makeEnv({ PUBLIC_WEBHOOK_MAX_BODY_BYTES: '65536' }),
    );

    expect(res.status).toBe(413);
    expect(dbMocks.getIncomingWebhookById).not.toHaveBeenCalled();
  });
});
