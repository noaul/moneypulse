import { createTestContext, describe, expect, test } from './test-utils.js';
import { createApp } from './app.js';
import request from 'supertest';

describe('auth flow', () => {
  test('initial setup creates the single user and login exposes current user through a cookie session', async () => {
    const context = await createTestContext();
    const app = createApp(context);
    const agent = request.agent(app);

    const setupStatusBefore = await agent.get('/api/auth/setup-status');
    expect(setupStatusBefore.body).toEqual({ needsSetup: true });

    const setup = await agent.post('/api/auth/setup').send({
      username: 'owner',
      password: 'correct horse battery staple',
      email: 'owner@example.com'
    });
    expect(setup.status).toBe(201);
    const cookies = setup.headers['set-cookie'];
    expect(Array.isArray(cookies) ? cookies.join(';') : String(cookies)).toContain('moneypulse_session=');

    const setupStatusAfter = await agent.get('/api/auth/setup-status');
    expect(setupStatusAfter.body).toEqual({ needsSetup: false });

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user).toMatchObject({
      username: 'owner',
      email: 'owner@example.com'
    });

    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);

    const login = await agent.post('/api/auth/login').send({
      username: 'owner',
      password: 'correct horse battery staple'
    });
    expect(login.status).toBe(200);
    expect(login.body.user.email).toBe('owner@example.com');
  });

  test('setup cannot run twice', async () => {
    const context = await createTestContext();
    const app = createApp(context);
    const agent = request.agent(app);

    await agent.post('/api/auth/setup').send({
      username: 'owner',
      password: 'correct horse battery staple',
      email: 'owner@example.com'
    });

    const secondSetup = await agent.post('/api/auth/setup').send({
      username: 'other',
      password: 'correct horse battery staple',
      email: 'other@example.com'
    });

    expect(secondSetup.status).toBe(409);
  });
});
