import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { AppContext } from './types.js';
import { registerAuthRoutes, requireAuth } from './auth.js';
import { registerAssetRoutes } from './assets.js';
import { registerExpenseRoutes } from './expenses.js';
import { registerDashboardRoutes } from './dashboard.js';
import { registerSettingsRoutes } from './settings.js';
import { registerReminderRoutes } from './reminders.js';
import { errorHandler } from './http.js';

export function createApp(context: AppContext) {
  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  const api = express.Router();
  api.get('/health', (_req, res) => {
    res.json({ ok: true });
  });
  registerAuthRoutes(api, context);

  api.use(requireAuth(context));
  registerAssetRoutes(api, context);
  registerExpenseRoutes(api, context);
  registerDashboardRoutes(api, context);
  registerSettingsRoutes(api, context);
  registerReminderRoutes(api, context);
  api.get('/export/json', (_req, res) => {
    res.json({
      users: context.db.all('SELECT id, username, email, created_at, updated_at FROM users'),
      phones: context.db.all('SELECT * FROM phones'),
      vps: context.db.all('SELECT * FROM vps'),
      domains: context.db.all('SELECT * FROM domains'),
      subscriptions: context.db.all('SELECT * FROM subscriptions'),
      expenses: context.db.all('SELECT * FROM expenses'),
      settings: context.db.all('SELECT * FROM settings'),
      reminderLogs: context.db.all('SELECT * FROM reminder_logs')
    });
  });

  app.use('/api', api);
  app.use(errorHandler);
  return app;
}
