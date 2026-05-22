import { describe, expect, setupAgent, test } from './test-utils.js';

describe('dashboard APIs', () => {
  test('summarizes predicted and actual costs by currency', async () => {
    const { agent } = await setupAgent();

    await agent.post('/api/vps').send({
      name: 'Tokyo VPS',
      provider: 'Vultr',
      amountMinorUnits: 600,
      currency: 'USD',
      billingCycle: 'monthly',
      nextDueDate: '2026-05-29',
      status: 'active'
    });

    await agent.post('/api/domains').send({
      domainName: 'moneypulse.dev',
      registrar: 'Cloudflare',
      amountMinorUnits: 1200,
      currency: 'USD',
      billingCycle: 'annual',
      expireDate: '2026-06-02',
      status: 'active'
    });

    await agent.post('/api/subscriptions').send({
      name: 'iCloud',
      provider: 'Apple',
      amountMinorUnits: 210,
      currency: 'CNY',
      billingCycle: 'monthly',
      nextDueDate: '2026-06-05',
      status: 'active'
    });

    await agent.post('/api/expenses').send({
      assetType: 'vps',
      assetId: 1,
      amountMinorUnits: 600,
      currency: 'USD',
      paidAt: '2026-05-10',
      category: 'monthly'
    });

    const summary = await agent.get('/api/dashboard/summary?year=2026');
    expect(summary.status).toBe(200);
    expect(summary.body.predictedMonthly).toEqual({
      CNY: 210,
      USD: 700
    });
    expect(summary.body.predictedYearly).toEqual({
      CNY: 2520,
      USD: 8400
    });
    expect(summary.body.actualYearly).toEqual({
      USD: 600
    });
    expect(summary.body.assetCounts).toMatchObject({
      vps: 1,
      domains: 1,
      subscriptions: 1
    });
  });

  test('returns due items across all asset types', async () => {
    const { agent } = await setupAgent();

    await agent.post('/api/phones').send({
      cardNumber: '+8613800000000',
      carrier: 'China Mobile',
      planName: 'Basic',
      amountMinorUnits: 1900,
      currency: 'CNY',
      billingCycle: 'monthly',
      nextDueDate: '2026-05-25',
      status: 'active'
    });

    const response = await agent.get('/api/dashboard/expiring?days=7');
    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([
      expect.objectContaining({
        assetType: 'phone',
        name: '+8613800000000',
        dueDate: '2026-05-25',
        daysLeft: 3
      })
    ]);
  });
});
