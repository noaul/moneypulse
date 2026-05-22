import { z } from 'zod';

export const currencySchema = z.enum(['CNY', 'USD', 'GBP', 'EUR']);
export const billingCycleSchema = z.enum(['monthly', 'quarterly', 'annual']);
export const statusSchema = z.enum(['active', 'paused', 'expired', 'cancelled', 'archived']);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const nullableText = z.string().trim().optional().nullable();

export const commonAssetSchema = z.object({
  amountMinorUnits: z.number().int().nonnegative(),
  currency: currencySchema,
  billingCycle: billingCycleSchema,
  nextDueDate: dateSchema.optional().nullable(),
  autoRenew: z.boolean().optional().default(false),
  paymentMethod: nullableText,
  renewalUrl: nullableText,
  status: statusSchema.optional().default('active'),
  tags: z.array(z.string().trim().min(1)).optional().default([]),
  notes: nullableText
});

export const phoneSchema = commonAssetSchema.extend({
  cardNumber: z.string().trim().min(1),
  carrier: nullableText,
  planName: nullableText,
  billingDay: z.number().int().min(1).max(31).optional().nullable(),
  activateDate: dateSchema.optional().nullable(),
  expireDate: dateSchema.optional().nullable()
});

export const vpsSchema = commonAssetSchema.extend({
  name: z.string().trim().min(1),
  provider: nullableText,
  ipAddress: nullableText,
  location: nullableText,
  cpu: nullableText,
  memory: nullableText,
  storage: nullableText,
  bandwidth: nullableText,
  os: nullableText,
  startDate: dateSchema.optional().nullable(),
  expireDate: dateSchema.optional().nullable()
});

export const domainSchema = commonAssetSchema.extend({
  domainName: z.string().trim().min(1),
  registrar: nullableText,
  dnsProvider: nullableText,
  purpose: nullableText,
  registerDate: dateSchema.optional().nullable(),
  expireDate: dateSchema.optional().nullable()
});

export const subscriptionSchema = commonAssetSchema.extend({
  name: z.string().trim().min(1),
  provider: nullableText,
  account: nullableText,
  category: nullableText
});

export const expenseSchema = z.object({
  assetType: z.enum(['phone', 'vps', 'domain', 'subscription']),
  assetId: z.number().int().positive(),
  amountMinorUnits: z.number().int().nonnegative(),
  currency: currencySchema,
  paidAt: dateSchema,
  periodStart: dateSchema.optional().nullable(),
  periodEnd: dateSchema.optional().nullable(),
  category: z.enum(['renewal', 'monthly', 'setup', 'other']).optional().default('other'),
  notes: nullableText
});
