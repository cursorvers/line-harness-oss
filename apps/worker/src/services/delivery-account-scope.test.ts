const dbMocks = vi.hoisted(() => ({
  getBroadcastById: vi.fn(),
  getBroadcasts: vi.fn(),
  getBroadcastsByLineAccountId: vi.fn(),
  updateBroadcastStatus: vi.fn(),
  getFriendsByTag: vi.fn(),
  getFriendScenariosDueForDelivery: vi.fn(),
  getScenarioSteps: vi.fn(),
  advanceFriendScenario: vi.fn(),
  completeFriendScenario: vi.fn(),
  getDueReminderDeliveries: vi.fn(),
  markReminderStepDelivered: vi.fn(),
  completeReminderIfDone: vi.fn(),
  getFriendById: vi.fn(),
  jstNow: vi.fn(),
}));

vi.mock('@line-crm/db', () => dbMocks);

import { processScheduledBroadcasts } from './broadcast.js';
import { processStepDeliveries } from './step-delivery.js';
import { processReminderDeliveries } from './reminder-delivery.js';

describe('delivery services account scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.jstNow.mockReturnValue('2026-04-02T12:00:00+09:00');
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-04-02T03:00:00.000Z').getTime());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scopes scheduled broadcasts by lineAccountId including null scope', async () => {
    dbMocks.getBroadcastsByLineAccountId.mockResolvedValue([]);

    await processScheduledBroadcasts({} as D1Database, {} as never, null);
    expect(dbMocks.getBroadcastsByLineAccountId).toHaveBeenCalledWith(expect.anything(), null);
    expect(dbMocks.getBroadcasts).not.toHaveBeenCalled();

    await processScheduledBroadcasts({} as D1Database, {} as never, 'acc-1');
    expect(dbMocks.getBroadcastsByLineAccountId).toHaveBeenCalledWith(expect.anything(), 'acc-1');
  });

  it('passes lineAccountId to step delivery due query', async () => {
    dbMocks.getFriendScenariosDueForDelivery.mockResolvedValue([]);

    await processStepDeliveries({} as D1Database, {} as never, 'https://worker.example.com', 'acc-1');

    expect(dbMocks.getFriendScenariosDueForDelivery).toHaveBeenCalledWith(
      expect.anything(),
      '2026-04-02T12:00:00+09:00',
      'acc-1',
    );
  });

  it('passes lineAccountId to reminder delivery due query', async () => {
    dbMocks.getDueReminderDeliveries.mockResolvedValue([]);

    await processReminderDeliveries({} as D1Database, {} as never, 'acc-2');

    expect(dbMocks.getDueReminderDeliveries).toHaveBeenCalledWith(
      expect.anything(),
      '2026-04-02T12:00:00+09:00',
      'acc-2',
    );
  });
});
