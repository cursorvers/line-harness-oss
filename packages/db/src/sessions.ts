import { isTimeBefore, jstNow, toJstString } from './utils.js';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface Session {
  id: string;
  api_key_hash: string;
  created_at: string;
  expires_at: string;
  last_active_at: string;
}

export async function createSession(
  db: D1Database,
  apiKeyHash: string,
): Promise<string> {
  const id = crypto.randomUUID();
  const now = jstNow();
  const expiresAt = toJstString(new Date(Date.now() + SESSION_TTL_MS));

  await db
    .prepare(
      `INSERT INTO sessions (id, api_key_hash, created_at, expires_at, last_active_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(id, apiKeyHash, now, expiresAt, now)
    .run();

  return id;
}

export async function getSession(
  db: D1Database,
  sessionId: string,
): Promise<Session | null> {
  const session = await db
    .prepare(`SELECT * FROM sessions WHERE id = ?`)
    .bind(sessionId)
    .first<Session>();

  if (!session) {
    return null;
  }

  if (isTimeBefore(session.expires_at, jstNow())) {
    return null;
  }

  return session;
}

export async function deleteSession(
  db: D1Database,
  sessionId: string,
): Promise<void> {
  await db.prepare(`DELETE FROM sessions WHERE id = ?`).bind(sessionId).run();
}

export async function cleanExpiredSessions(db: D1Database): Promise<void> {
  await db.prepare(`DELETE FROM sessions WHERE expires_at <= ?`).bind(jstNow()).run();
}
