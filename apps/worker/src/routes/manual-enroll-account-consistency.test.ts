import { Hono } from 'hono';
import type { Env } from '../index.js';

const dbMocks = vi.hoisted(() => ({
  // scenarios route imports
  getScenarios: vi.fn(),
  getScenarioById: vi.fn(),
  createScenario: vi.fn(),
  updateScenario: vi.fn(),
  deleteScenario: vi.fn(),
  createScenarioStep: vi.fn(),
  updateScenarioStep: vi.fn(),
  deleteScenarioStep: vi.fn(),
  enrollFriendInScenario: vi.fn(),
  getFriendById: vi.fn(),
  // reminders route imports
  getReminders: vi.fn(),
  getReminderById: vi.fn(),
  createReminder: vi.fn(),
  updateReminder: vi.fn(),
  deleteReminder: vi.fn(),
  getReminderSteps: vi.fn(),
  createReminderStep: vi.fn(),
  deleteReminderStep: vi.fn(),
  enrollFriendInReminder: vi.fn(),
  getFriendReminders: vi.fn(),
  cancelFriendReminder: vi.fn(),
}));

vi.mock('@line-crm/db', () => dbMocks);

import { scenarios } from './scenarios.js';
import { reminders } from './reminders.js';

function makeEnv(): Env['Bindings'] {
  return { DB: {} as D1Database } as Env['Bindings'];
}

describe('manual enroll account consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects scenario manual enroll when friend/scenario accounts mismatch', async () => {
    dbMocks.getScenarioById.mockResolvedValue({
      id: 'scenario-1',
      line_account_id: 'acc-a',
      steps: [],
    });
    dbMocks.getFriendById.mockResolvedValue({
      id: 'friend-1',
      line_account_id: 'acc-b',
    });

    const app = new Hono<Env>();
    app.route('/', scenarios);

    const res = await app.request(
      'http://localhost/api/scenarios/scenario-1/enroll/friend-1',
      { method: 'POST' },
      makeEnv(),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('different LINE accounts');
    expect(dbMocks.enrollFriendInScenario).not.toHaveBeenCalled();
  });

  it('allows scenario manual enroll when either account is unset', async () => {
    dbMocks.getScenarioById.mockResolvedValue({
      id: 'scenario-1',
      line_account_id: null,
      steps: [],
    });
    dbMocks.getFriendById.mockResolvedValue({
      id: 'friend-1',
      line_account_id: 'acc-b',
    });
    dbMocks.enrollFriendInScenario.mockResolvedValue({
      id: 'enroll-1',
      friend_id: 'friend-1',
      scenario_id: 'scenario-1',
      current_step_order: 0,
      status: 'active',
      started_at: '2026-04-02T00:00:00+09:00',
      next_delivery_at: null,
      updated_at: '2026-04-02T00:00:00+09:00',
    });

    const app = new Hono<Env>();
    app.route('/', scenarios);

    const res = await app.request(
      'http://localhost/api/scenarios/scenario-1/enroll/friend-1',
      { method: 'POST' },
      makeEnv(),
    );

    expect(res.status).toBe(201);
    expect(dbMocks.enrollFriendInScenario).toHaveBeenCalledWith(
      expect.anything(),
      'friend-1',
      'scenario-1',
    );
  });

  it('rejects reminder manual enroll when friend/reminder accounts mismatch', async () => {
    dbMocks.getReminderById.mockResolvedValue({
      id: 'reminder-1',
      line_account_id: 'acc-a',
    });
    dbMocks.getFriendById.mockResolvedValue({
      id: 'friend-1',
      line_account_id: 'acc-b',
    });

    const app = new Hono<Env>();
    app.route('/', reminders);

    const res = await app.request(
      'http://localhost/api/reminders/reminder-1/enroll/friend-1',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDate: '2026-04-10' }),
      },
      makeEnv(),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('different LINE accounts');
    expect(dbMocks.enrollFriendInReminder).not.toHaveBeenCalled();
  });

  it('allows reminder manual enroll when either account is unset', async () => {
    dbMocks.getReminderById.mockResolvedValue({
      id: 'reminder-1',
      line_account_id: null,
    });
    dbMocks.getFriendById.mockResolvedValue({
      id: 'friend-1',
      line_account_id: 'acc-b',
    });
    dbMocks.enrollFriendInReminder.mockResolvedValue({
      id: 'friend-reminder-1',
      friend_id: 'friend-1',
      reminder_id: 'reminder-1',
      target_date: '2026-04-10',
      status: 'active',
    });

    const app = new Hono<Env>();
    app.route('/', reminders);

    const res = await app.request(
      'http://localhost/api/reminders/reminder-1/enroll/friend-1',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDate: '2026-04-10' }),
      },
      makeEnv(),
    );

    expect(res.status).toBe(201);
    expect(dbMocks.enrollFriendInReminder).toHaveBeenCalledWith(
      expect.anything(),
      { friendId: 'friend-1', reminderId: 'reminder-1', targetDate: '2026-04-10' },
    );
  });
});
