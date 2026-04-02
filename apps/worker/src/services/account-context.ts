export interface ScheduledAccountInput {
  id: string;
  channel_access_token: string;
  is_active: number;
}

export interface ScheduledAccountContext {
  token: string;
  lineAccountId: string | null;
}

/**
 * Build delivery contexts for scheduled jobs.
 * Always include the default env token for legacy records (lineAccountId = null),
 * then include each active DB account with its own lineAccountId.
 */
export function buildScheduledAccountContexts(
  envToken: string,
  dbAccounts: ScheduledAccountInput[],
): ScheduledAccountContext[] {
  const contexts: ScheduledAccountContext[] = [];
  const trimmedEnvToken = envToken.trim();
  if (trimmedEnvToken) {
    contexts.push({ token: trimmedEnvToken, lineAccountId: null });
  }

  for (const account of dbAccounts) {
    if (!account.is_active) continue;
    const token = account.channel_access_token.trim();
    if (!token) continue;
    contexts.push({ token, lineAccountId: account.id });
  }

  return contexts;
}

