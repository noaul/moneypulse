import type { Router } from 'express';
import { z } from 'zod';
import type { AppContext } from './types.js';
import { asyncHandler, parseBody } from './http.js';

export interface Settings {
  reminderDays: number[];
  reminderEnabled: boolean;
  defaultCurrency: 'CNY' | 'USD' | 'GBP' | 'EUR';
  timezone: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFrom: string;
  smtpTo: string;
}

const settingsSchema = z.object({
  reminderDays: z.array(z.number().int().min(0).max(365)).optional(),
  reminderEnabled: z.boolean().optional(),
  defaultCurrency: z.enum(['CNY', 'USD', 'GBP', 'EUR']).optional(),
  timezone: z.string().trim().min(1).optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().optional(),
  smtpFrom: z.string().optional(),
  smtpTo: z.string().optional()
});

export function registerSettingsRoutes(router: Router, context: AppContext): void {
  router.get('/settings', (_req, res) => {
    res.json({ settings: getSettings(context) });
  });

  router.put(
    '/settings',
    asyncHandler(async (req, res) => {
      const body = parseBody(settingsSchema, req.body);
      for (const [key, value] of Object.entries(body)) {
        context.db.run(
          `INSERT INTO settings (key, value) VALUES (?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
          [key, JSON.stringify(value)]
        );
      }
      res.json({ settings: getSettings(context) });
    })
  );

  router.post(
    '/settings/test-email',
    asyncHandler(async (_req, res) => {
      const settings = getSettings(context);
      await context.mailer.send({
        to: settings.smtpTo,
        from: settings.smtpFrom,
        subject: 'MoneyPulse test email',
        text: 'MoneyPulse email delivery is configured.'
      });
      res.status(204).end();
    })
  );
}

export function getSettings(context: AppContext): Settings {
  const rows = context.db.all<{ key: string; value: string }>('SELECT key, value FROM settings');
  const settings = Object.fromEntries(
    rows.map((row) => {
      try {
        return [row.key, JSON.parse(row.value)];
      } catch {
        return [row.key, row.value];
      }
    })
  ) as Partial<Settings>;

  return {
    reminderDays: settings.reminderDays ?? [30, 14, 7, 3, 1, 0],
    reminderEnabled: settings.reminderEnabled ?? true,
    defaultCurrency: settings.defaultCurrency ?? 'CNY',
    timezone: settings.timezone ?? 'Asia/Shanghai',
    smtpHost: settings.smtpHost ?? '',
    smtpPort: Number(settings.smtpPort ?? 587),
    smtpUser: settings.smtpUser ?? '',
    smtpFrom: settings.smtpFrom ?? '',
    smtpTo: settings.smtpTo ?? ''
  };
}
