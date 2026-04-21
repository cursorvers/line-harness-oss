type PublicBaseUrlEnv = {
  PUBLIC_BASE_URL?: string;
  WORKER_URL?: string;
};

function normalizeBaseUrl(value: string | undefined): string | null {
  const raw = (value || '').trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export function resolvePublicBaseUrl(
  env: PublicBaseUrlEnv,
  requestUrl?: string,
): string {
  const preferred = normalizeBaseUrl(env.PUBLIC_BASE_URL);
  if (preferred) return preferred;

  const workerUrl = normalizeBaseUrl(env.WORKER_URL);
  if (workerUrl) return workerUrl;

  if (requestUrl) {
    return new URL(requestUrl).origin;
  }

  return '';
}
