import { createTestContext, describe, expect, test } from './test-utils.js';

describe('database migration', () => {
  test('creates indexes for list, dashboard, and reminder queries', async () => {
    const { db } = await createTestContext();

    const indexes = db
      .all<{ name: string }>(
        `SELECT name
         FROM sqlite_master
         WHERE type = 'index' AND name LIKE 'idx_%'
         ORDER BY name`
      )
      .map((row) => row.name);

    expect(indexes).toEqual(
      expect.arrayContaining([
        'idx_domains_status_due',
        'idx_expenses_paid_currency',
        'idx_phones_status_due',
        'idx_reminder_logs_sent_at',
        'idx_subscriptions_status_due',
        'idx_vps_status_due'
      ])
    );
  });
});
