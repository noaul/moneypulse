import type { Router } from 'express';
import { expenseSchema } from './schemas.js';
import type { AppContext, DbValue } from './types.js';
import { asyncHandler, HttpError, parseBody } from './http.js';
import { toIsoDateTime } from './utils.js';

export function registerExpenseRoutes(router: Router, context: AppContext): void {
  router.get(
    '/expenses',
    asyncHandler(async (_req, res) => {
      const rows = context.db.all<Record<string, unknown>>('SELECT * FROM expenses ORDER BY paid_at DESC, id DESC');
      res.json({ items: rows.map(mapExpense) });
    })
  );

  router.post(
    '/expenses',
    asyncHandler(async (req, res) => {
      const body = parseBody(expenseSchema, req.body);
      const now = toIsoDateTime(context.now());
      const id = context.db.insert(
        `INSERT INTO expenses (
          asset_type, asset_id, amount_minor_units, currency, paid_at,
          period_start, period_end, category, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          body.assetType,
          body.assetId,
          body.amountMinorUnits,
          body.currency,
          body.paidAt,
          body.periodStart ?? null,
          body.periodEnd ?? null,
          body.category ?? 'other',
          body.notes ?? null,
          now,
          now
        ]
      );
      res.status(201).json({ item: getExpenseOrThrow(context, id) });
    })
  );

  router.put(
    '/expenses/:id',
    asyncHandler(async (req, res) => {
      getExpenseOrThrow(context, Number(req.params.id));
      const body = parseBody(expenseSchema.partial(), req.body);
      const fields = [
        ['assetType', 'asset_type'],
        ['assetId', 'asset_id'],
        ['amountMinorUnits', 'amount_minor_units'],
        ['currency', 'currency'],
        ['paidAt', 'paid_at'],
        ['periodStart', 'period_start'],
        ['periodEnd', 'period_end'],
        ['category', 'category'],
        ['notes', 'notes']
      ] as const;
      const entries = fields.filter(([api]) => Object.prototype.hasOwnProperty.call(body, api));
      if (entries.length > 0) {
        const assignments = entries.map(([, db]) => `${db} = ?`);
        const values: DbValue[] = entries.map(([api]) => {
          const value = body[api];
          if (value === undefined) return null;
          return value as DbValue;
        });
        assignments.push('updated_at = ?');
        values.push(toIsoDateTime(context.now()), Number(req.params.id));
        context.db.run(`UPDATE expenses SET ${assignments.join(', ')} WHERE id = ?`, values);
      }
      res.json({ item: getExpenseOrThrow(context, Number(req.params.id)) });
    })
  );

  router.delete(
    '/expenses/:id',
    asyncHandler(async (req, res) => {
      getExpenseOrThrow(context, Number(req.params.id));
      context.db.run('DELETE FROM expenses WHERE id = ?', [Number(req.params.id)]);
      res.status(204).end();
    })
  );
}

function getExpenseOrThrow(context: AppContext, id: number) {
  const row = context.db.get<Record<string, unknown>>('SELECT * FROM expenses WHERE id = ?', [id]);
  if (!row) throw new HttpError(404, 'EXPENSE_NOT_FOUND', 'Expense not found');
  return mapExpense(row);
}

function mapExpense(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    assetType: row.asset_type,
    assetId: Number(row.asset_id),
    amountMinorUnits: Number(row.amount_minor_units),
    currency: row.currency,
    paidAt: row.paid_at,
    periodStart: row.period_start ?? null,
    periodEnd: row.period_end ?? null,
    category: row.category,
    notes: row.notes ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
