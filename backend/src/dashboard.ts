import type { Router } from 'express';
import { assetConfigs, getDueDate, normalizeBillingCycle, normalizeCurrency } from './assets.js';
import type { AppContext, AssetType, Currency } from './types.js';
import {
  addCurrencyTotal,
  daysBetween,
  predictedMonthly,
  predictedYearly,
  toIsoDate
} from './utils.js';

export interface DueItem {
  assetType: AssetType;
  assetId: number;
  name: string;
  dueDate: string;
  daysLeft: number;
  amountMinorUnits: number;
  currency: Currency;
  billingCycle: string;
  autoRenew: boolean;
  renewalUrl: string | null;
  status: string;
}

export function registerDashboardRoutes(router: Router, context: AppContext): void {
  router.get('/dashboard/summary', (req, res) => {
    const year = typeof req.query.year === 'string' ? Number(req.query.year) : context.now().getUTCFullYear();
    res.json(getDashboardSummary(context, Number.isFinite(year) ? year : context.now().getUTCFullYear()));
  });

  router.get('/dashboard/expiring', (req, res) => {
    const days = typeof req.query.days === 'string' ? Number(req.query.days) : 30;
    res.json({ items: collectDueItems(context, Number.isFinite(days) ? days : 30) });
  });
}

export function getDashboardSummary(context: AppContext, year: number) {
  const predictedMonthlyTotals: Partial<Record<Currency, number>> = {};
  const predictedYearlyTotals: Partial<Record<Currency, number>> = {};
  const assetCounts: Record<string, number> = {
    phones: 0,
    vps: 0,
    domains: 0,
    subscriptions: 0
  };

  for (const config of assetConfigs) {
    const rows = context.db.all<Record<string, unknown>>(
      `SELECT * FROM ${config.table} WHERE archived_at IS NULL AND status = 'active'`
    );
    assetCounts[config.route] = rows.length;

    for (const row of rows) {
      const amount = Number(row.amount_minor_units ?? 0);
      const currency = normalizeCurrency(row.currency);
      const cycle = normalizeBillingCycle(row.billing_cycle);
      addCurrencyTotal(predictedMonthlyTotals, currency, predictedMonthly(amount, cycle));
      addCurrencyTotal(predictedYearlyTotals, currency, predictedYearly(amount, cycle));
    }
  }

  const actualYearly: Partial<Record<Currency, number>> = {};
  const expenses = context.db.all<{ currency: Currency; total: number }>(
    `SELECT currency, SUM(amount_minor_units) as total
     FROM expenses
     WHERE paid_at >= ? AND paid_at <= ?
     GROUP BY currency`,
    [`${year}-01-01`, `${year}-12-31`]
  );
  for (const row of expenses) {
    addCurrencyTotal(actualYearly, normalizeCurrency(row.currency), Number(row.total ?? 0));
  }

  return {
    predictedMonthly: predictedMonthlyTotals,
    predictedYearly: predictedYearlyTotals,
    actualYearly,
    assetCounts,
    expiringCount: collectDueItems(context, 30).length
  };
}

export function collectDueItems(context: AppContext, withinDays: number): DueItem[] {
  const today = toIsoDate(context.now());
  const items: DueItem[] = [];

  for (const config of assetConfigs) {
    const rows = context.db.all<Record<string, unknown>>(
      `SELECT * FROM ${config.table} WHERE archived_at IS NULL AND status IN ('active', 'paused', 'expired')`
    );
    for (const row of rows) {
      const dueDate = getDueDate(row, config.dueFields);
      if (!dueDate) continue;
      const daysLeft = daysBetween(today, dueDate);
      if (daysLeft > withinDays) continue;

      items.push({
        assetType: config.type,
        assetId: Number(row.id),
        name: String(row[config.displayField] ?? ''),
        dueDate,
        daysLeft,
        amountMinorUnits: Number(row.amount_minor_units ?? 0),
        currency: normalizeCurrency(row.currency),
        billingCycle: String(row.billing_cycle ?? ''),
        autoRenew: Boolean(row.auto_renew),
        renewalUrl: typeof row.renewal_url === 'string' ? row.renewal_url : null,
        status: String(row.status ?? '')
      });
    }
  }

  return items.sort((a, b) => a.daysLeft - b.daysLeft || a.name.localeCompare(b.name));
}
