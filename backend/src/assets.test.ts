import { describe, expect, setupAgent, test } from './test-utils.js';

describe('asset APIs', () => {
  test('creates, lists, updates, and archives subscriptions', async () => {
    const { agent } = await setupAgent();

    const created = await agent.post('/api/subscriptions').send({
      name: 'ChatGPT',
      provider: 'OpenAI',
      account: 'owner@example.com',
      category: 'AI',
      amountMinorUnits: 2000,
      currency: 'USD',
      billingCycle: 'monthly',
      nextDueDate: '2026-06-01',
      autoRenew: true,
      paymentMethod: 'Visa',
      status: 'active',
      tags: ['ai', 'work'],
      renewalUrl: 'https://chatgpt.com',
      notes: 'Primary AI subscription'
    });

    expect(created.status).toBe(201);
    expect(created.body.item).toMatchObject({
      id: 1,
      name: 'ChatGPT',
      currency: 'USD',
      amountMinorUnits: 2000,
      tags: ['ai', 'work']
    });

    const list = await agent.get('/api/subscriptions?status=active&q=chat');
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(1);

    const updated = await agent.put('/api/subscriptions/1').send({
      amountMinorUnits: 2200,
      notes: 'Updated price'
    });
    expect(updated.body.item.amountMinorUnits).toBe(2200);

    await agent.delete('/api/subscriptions/1').expect(204);

    const archivedList = await agent.get('/api/subscriptions?status=archived');
    expect(archivedList.body.items[0].status).toBe('archived');
    expect(archivedList.body.items[0].archivedAt).toMatch(/^2026-05-22/);
  });

  test('validates currency and money fields', async () => {
    const { agent } = await setupAgent();

    const response = await agent.post('/api/domains').send({
      domainName: 'example.com',
      registrar: 'Cloudflare',
      amountMinorUnits: 12.5,
      currency: 'JPY',
      billingCycle: 'annual',
      expireDate: '2026-06-01',
      status: 'active'
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('lists dated assets before undated assets by nearest due date', async () => {
    const { agent } = await setupAgent();

    await agent.post('/api/subscriptions').send({
      name: 'No Due Date',
      provider: 'Manual',
      amountMinorUnits: 1000,
      currency: 'USD',
      billingCycle: 'monthly',
      nextDueDate: null,
      status: 'active'
    });

    await agent.post('/api/subscriptions').send({
      name: 'Later Renewal',
      provider: 'Manual',
      amountMinorUnits: 1000,
      currency: 'USD',
      billingCycle: 'monthly',
      nextDueDate: '2026-06-15',
      status: 'active'
    });

    await agent.post('/api/subscriptions').send({
      name: 'Soon Renewal',
      provider: 'Manual',
      amountMinorUnits: 1000,
      currency: 'USD',
      billingCycle: 'monthly',
      nextDueDate: '2026-05-30',
      status: 'active'
    });

    const list = await agent.get('/api/subscriptions');

    expect(list.status).toBe(200);
    expect(list.body.items.map((item: { name: string }) => item.name)).toEqual([
      'Soon Renewal',
      'Later Renewal',
      'No Due Date'
    ]);
  });
});
