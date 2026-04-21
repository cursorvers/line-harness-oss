import { describe, expect, it } from 'vitest';
import { resolvePublicBaseUrl } from './public-base-url.js';

describe('resolvePublicBaseUrl', () => {
  it('prefers PUBLIC_BASE_URL over legacy WORKER_URL', () => {
    expect(
      resolvePublicBaseUrl({
        PUBLIC_BASE_URL: 'https://api.example.com/',
        WORKER_URL: 'https://legacy.example.workers.dev',
      }),
    ).toBe('https://api.example.com');
  });

  it('falls back to WORKER_URL when PUBLIC_BASE_URL is absent', () => {
    expect(
      resolvePublicBaseUrl({
        WORKER_URL: 'https://line-crm-worker.line-crm-api.workers.dev/',
      }),
    ).toBe('https://line-crm-worker.line-crm-api.workers.dev');
  });

  it('falls back to request origin when env vars are unavailable', () => {
    expect(resolvePublicBaseUrl({}, 'https://api.example.com/webhook')).toBe(
      'https://api.example.com',
    );
  });

  it('ignores malformed base URLs', () => {
    expect(
      resolvePublicBaseUrl(
        { PUBLIC_BASE_URL: 'not-a-url', WORKER_URL: 'https://fallback.example.com' },
        'https://request.example.com/path',
      ),
    ).toBe('https://fallback.example.com');
  });
});
