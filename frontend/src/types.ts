export type Currency = 'CNY' | 'USD' | 'GBP' | 'EUR';
export type BillingCycle = 'monthly' | 'quarterly' | 'annual';
export type AssetStatus = 'active' | 'paused' | 'expired' | 'cancelled' | 'archived';
export type AssetType = 'phone' | 'vps' | 'domain' | 'subscription';

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AssetItem {
  id: number;
  assetType: AssetType;
  amountMinorUnits: number;
  currency: Currency;
  billingCycle: BillingCycle;
  nextDueDate: string | null;
  expireDate?: string | null;
  autoRenew: boolean;
  paymentMethod: string | null;
  renewalUrl: string | null;
  status: AssetStatus;
  tags: string[];
  notes: string | null;
  archivedAt: string | null;
  [key: string]: unknown;
}

export interface ExpenseItem {
  id: number;
  assetType: AssetType;
  assetId: number;
  amountMinorUnits: number;
  currency: Currency;
  paidAt: string;
  periodStart: string | null;
  periodEnd: string | null;
  category: 'renewal' | 'monthly' | 'setup' | 'other';
  notes: string | null;
}

export interface DashboardSummary {
  predictedMonthly: Partial<Record<Currency, number>>;
  predictedYearly: Partial<Record<Currency, number>>;
  actualYearly: Partial<Record<Currency, number>>;
  assetCounts: Record<string, number>;
  expiringCount: number;
}

export interface DueItem {
  assetType: AssetType;
  assetId: number;
  name: string;
  dueDate: string;
  daysLeft: number;
  amountMinorUnits: number;
  currency: Currency;
  billingCycle: BillingCycle;
  autoRenew: boolean;
  renewalUrl: string | null;
  status: AssetStatus;
}

export interface SettingsValue {
  reminderDays: number[];
  reminderEnabled: boolean;
  defaultCurrency: Currency;
  timezone: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFrom: string;
  smtpTo: string;
}
