import type { RequestHandler } from 'express';

export type Currency = 'CNY' | 'USD' | 'GBP' | 'EUR';
export type BillingCycle = 'monthly' | 'quarterly' | 'annual';
export type AssetStatus = 'active' | 'paused' | 'expired' | 'cancelled' | 'archived';
export type AssetType = 'phone' | 'vps' | 'domain' | 'subscription';

export type DbValue = string | number | null;

export interface DbClient {
  exec(sql: string): void;
  run(sql: string, params?: DbValue[]): void;
  get<T extends Record<string, unknown>>(sql: string, params?: DbValue[]): T | undefined;
  all<T extends Record<string, unknown>>(sql: string, params?: DbValue[]): T[];
  insert(sql: string, params?: DbValue[]): number;
  save(): void;
}

export interface MailMessage {
  to: string;
  from: string;
  subject: string;
  text: string;
}

export interface Mailer {
  sent: MailMessage[];
  send(message: MailMessage): Promise<void>;
}

export interface AppContext {
  db: DbClient;
  jwtSecret: string;
  cookieSecure: boolean;
  now: () => Date;
  mailer: Mailer;
}

export type AuthedHandler = RequestHandler;
