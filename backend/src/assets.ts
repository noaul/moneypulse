import type { Router } from 'express';
import { z } from 'zod';
import type { AppContext, AssetType, BillingCycle, Currency, DbValue } from './types.js';
import { asyncHandler, HttpError, parseBody } from './http.js';
import { domainSchema, phoneSchema, subscriptionSchema, vpsSchema } from './schemas.js';
import { parseJsonArray, toIsoDateTime } from './utils.js';

type Field = { api: string; db: string };

export interface AssetConfig {
  route: string;
  table: string;
  type: AssetType;
  schema: z.AnyZodObject;
  fields: Field[];
  searchable: string[];
  displayField: string;
  dueFields: string[];
}

const commonFields: Field[] = [
  { api: 'amountMinorUnits', db: 'amount_minor_units' },
  { api: 'currency', db: 'currency' },
  { api: 'billingCycle', db: 'billing_cycle' },
  { api: 'nextDueDate', db: 'next_due_date' },
  { api: 'autoRenew', db: 'auto_renew' },
  { api: 'paymentMethod', db: 'payment_method' },
  { api: 'renewalUrl', db: 'renewal_url' },
  { api: 'status', db: 'status' },
  { api: 'tags', db: 'tags' },
  { api: 'notes', db: 'notes' }
];

export const assetConfigs: AssetConfig[] = [
  {
    route: 'phones',
    table: 'phones',
    type: 'phone',
    schema: phoneSchema,
    fields: [
      { api: 'cardNumber', db: 'card_number' },
      { api: 'carrier', db: 'carrier' },
      { api: 'planName', db: 'plan_name' },
      { api: 'billingDay', db: 'billing_day' },
      { api: 'activateDate', db: 'activate_date' },
      { api: 'expireDate', db: 'expire_date' },
      ...commonFields
    ],
    searchable: ['card_number', 'carrier', 'plan_name'],
    displayField: 'card_number',
    dueFields: ['next_due_date', 'expire_date']
  },
  {
    route: 'vps',
    table: 'vps',
    type: 'vps',
    schema: vpsSchema,
    fields: [
      { api: 'name', db: 'name' },
      { api: 'provider', db: 'provider' },
      { api: 'ipAddress', db: 'ip_address' },
      { api: 'location', db: 'location' },
      { api: 'cpu', db: 'cpu' },
      { api: 'memory', db: 'memory' },
      { api: 'storage', db: 'storage' },
      { api: 'bandwidth', db: 'bandwidth' },
      { api: 'os', db: 'os' },
      { api: 'startDate', db: 'start_date' },
      { api: 'expireDate', db: 'expire_date' },
      ...commonFields
    ],
    searchable: ['name', 'provider', 'ip_address', 'location'],
    displayField: 'name',
    dueFields: ['next_due_date', 'expire_date']
  },
  {
    route: 'domains',
    table: 'domains',
    type: 'domain',
    schema: domainSchema,
    fields: [
      { api: 'domainName', db: 'domain_name' },
      { api: 'registrar', db: 'registrar' },
      { api: 'dnsProvider', db: 'dns_provider' },
      { api: 'purpose', db: 'purpose' },
      { api: 'registerDate', db: 'register_date' },
      { api: 'expireDate', db: 'expire_date' },
      ...commonFields
    ],
    searchable: ['domain_name', 'registrar', 'dns_provider', 'purpose'],
    displayField: 'domain_name',
    dueFields: ['next_due_date', 'expire_date']
  },
  {
    route: 'subscriptions',
    table: 'subscriptions',
    type: 'subscription',
    schema: subscriptionSchema,
    fields: [
      { api: 'name', db: 'name' },
      { api: 'provider', db: 'provider' },
      { api: 'account', db: 'account' },
      { api: 'category', db: 'category' },
      ...commonFields
    ],
    searchable: ['name', 'provider', 'account', 'category'],
    displayField: 'name',
    dueFields: ['next_due_date']
  }
];

export function registerAssetRoutes(router: Router, context: AppContext): void {
  for (const config of assetConfigs) {
    router.get(
      `/${config.route}`,
      asyncHandler(async (req, res) => {
        const where: string[] = [];
        const params: DbValue[] = [];
        const status = typeof req.query.status === 'string' ? req.query.status : '';
        const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

        if (status) {
          where.push('status = ?');
          params.push(status);
        } else {
          where.push('archived_at IS NULL');
        }

        if (q) {
          where.push(`(${config.searchable.map((field) => `LOWER(${field}) LIKE LOWER(?)`).join(' OR ')})`);
          for (const _field of config.searchable) {
            params.push(`%${q}%`);
          }
        }

        const rows = context.db.all<Record<string, unknown>>(
          `SELECT * FROM ${config.table} WHERE ${where.join(' AND ')} ORDER BY ${dueOrderClause(config.dueFields)}`,
          params
        );
        res.json({ items: rows.map((row) => mapAssetRow(config, row)) });
      })
    );

    router.get(
      `/${config.route}/:id`,
      asyncHandler(async (req, res) => {
        res.json({ item: getAssetOrThrow(context, config, Number(req.params.id)) });
      })
    );

    router.post(
      `/${config.route}`,
      asyncHandler(async (req, res) => {
        const body = parseBody(config.schema, req.body) as Record<string, unknown>;
        const now = toIsoDateTime(context.now());
        const columns = [...config.fields.map((field) => field.db), 'created_at', 'updated_at'];
        const values = [...config.fields.map((field) => toDbValue(field.api, body[field.api])), now, now];
        const placeholders = columns.map(() => '?').join(', ');
        const id = context.db.insert(
          `INSERT INTO ${config.table} (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );
        res.status(201).json({ item: getAssetOrThrow(context, config, id) });
      })
    );

    router.put(
      `/${config.route}/:id`,
      asyncHandler(async (req, res) => {
        getAssetOrThrow(context, config, Number(req.params.id));
        const body = parseBody(config.schema.partial(), req.body) as Record<string, unknown>;
        const entries = config.fields.filter((field) => Object.prototype.hasOwnProperty.call(body, field.api));
        if (entries.length > 0) {
          const assignments = entries.map((field) => `${field.db} = ?`);
          const params = entries.map((field) => toDbValue(field.api, body[field.api]));
          assignments.push('updated_at = ?');
          params.push(toIsoDateTime(context.now()), Number(req.params.id));
          context.db.run(`UPDATE ${config.table} SET ${assignments.join(', ')} WHERE id = ?`, params);
        }
        res.json({ item: getAssetOrThrow(context, config, Number(req.params.id)) });
      })
    );

    router.delete(
      `/${config.route}/:id`,
      asyncHandler(async (req, res) => {
        getAssetOrThrow(context, config, Number(req.params.id));
        const now = toIsoDateTime(context.now());
        context.db.run(
          `UPDATE ${config.table} SET status = 'archived', archived_at = ?, updated_at = ? WHERE id = ?`,
          [now, now, Number(req.params.id)]
        );
        res.status(204).end();
      })
    );
  }
}

export function getAssetOrThrow(context: AppContext, config: AssetConfig, id: number) {
  const row = context.db.get<Record<string, unknown>>(`SELECT * FROM ${config.table} WHERE id = ?`, [id]);
  if (!row) {
    throw new HttpError(404, 'ASSET_NOT_FOUND', 'Asset not found');
  }
  return mapAssetRow(config, row);
}

export function mapAssetRow(config: AssetConfig, row: Record<string, unknown>) {
  const item: Record<string, unknown> = {
    id: Number(row.id),
    assetType: config.type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at ?? null
  };

  for (const field of config.fields) {
    const value = row[field.db];
    if (field.api === 'autoRenew') {
      item[field.api] = Boolean(value);
    } else if (field.api === 'tags') {
      item[field.api] = parseJsonArray(value);
    } else {
      item[field.api] = value ?? null;
    }
  }
  return item;
}

export function toDbValue(apiField: string, value: unknown): DbValue {
  if (apiField === 'tags') {
    return JSON.stringify(Array.isArray(value) ? value : []);
  }
  if (apiField === 'autoRenew') {
    return value ? 1 : 0;
  }
  if (value === undefined) {
    return null;
  }
  if (typeof value === 'string' || typeof value === 'number' || value === null) {
    return value;
  }
  return String(value);
}

export function getDueDate(row: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    if (typeof row[field] === 'string' && row[field]) {
      return String(row[field]);
    }
  }
  return null;
}

function dueDateExpression(fields: string[]): string {
  if (fields.length === 0) {
    return 'NULL';
  }
  const nullableFields = fields.map((field) => `NULLIF(${field}, '')`);
  return nullableFields.length === 1 ? nullableFields[0] : `COALESCE(${nullableFields.join(', ')})`;
}

function dueOrderClause(fields: string[]): string {
  const dueDate = dueDateExpression(fields);
  return `CASE WHEN ${dueDate} IS NULL THEN 1 ELSE 0 END ASC, ${dueDate} ASC, id DESC`;
}

export function normalizeBillingCycle(value: unknown): BillingCycle {
  return value === 'quarterly' || value === 'annual' ? value : 'monthly';
}

export function normalizeCurrency(value: unknown): Currency {
  if (value === 'USD' || value === 'GBP' || value === 'EUR') return value;
  return 'CNY';
}
