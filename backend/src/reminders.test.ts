import { describe, expect, setupAgent, test } from './test-utils.js';

describe('reminders', () => {
  test('sends one digest email for due assets and does not resend the same reminder', async () => {
    const { agent, context } = await setupAgent();

    await agent.put('/api/settings').send({
      reminderDays: [7, 3, 1, 0],
      reminderEnabled: true,
      smtpTo: 'owner@example.com',
      smtpFrom: 'moneypulse@example.com'
    });

    await agent.post('/api/domains').send({
      domainName: 'example.com',
      registrar: 'Cloudflare',
      amountMinorUnits: 1200,
      currency: 'USD',
      billingCycle: 'annual',
      expireDate: '2026-05-25',
      status: 'active',
      renewalUrl: 'https://dash.cloudflare.com'
    });

    const firstRun = await agent.post('/api/reminders/run-now');
    expect(firstRun.status).toBe(200);
    expect(firstRun.body.sent).toBe(true);
    expect(firstRun.body.items).toHaveLength(1);
    expect(context.mailer.sent).toHaveLength(1);
    expect(context.mailer.sent[0].subject).toContain('资产到期提醒');

    const secondRun = await agent.post('/api/reminders/run-now');
    expect(secondRun.status).toBe(200);
    expect(secondRun.body.sent).toBe(false);
    expect(context.mailer.sent).toHaveLength(1);

    const logs = await agent.get('/api/reminders/logs');
    expect(logs.body.items[0]).toMatchObject({
      assetType: 'domain',
      assetId: 1,
      daysBefore: 3,
      status: 'sent'
    });
  });
});
