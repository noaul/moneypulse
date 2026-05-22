import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import initSqlJs from 'sql.js';
import type { DbClient, DbValue } from './types.js';

type SqlStatement = {
  bind(params: DbValue[]): boolean;
  step(): boolean;
  getAsObject(): Record<string, unknown>;
  free(): void;
  run(params?: DbValue[]): void;
};

type SqlDatabase = {
  exec(sql: string): void;
  prepare(sql: string): SqlStatement;
  export(): Uint8Array;
};

export interface DatabaseOptions {
  filePath?: string;
  persist: boolean;
}

export async function createDatabase(options: DatabaseOptions): Promise<DbClient> {
  const require = createRequire(import.meta.url);
  const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
  const SQL = await initSqlJs({ locateFile: () => wasmPath });
  const initialData =
    options.persist && options.filePath && fs.existsSync(options.filePath)
      ? fs.readFileSync(options.filePath)
      : undefined;
  const sql = initialData ? new SQL.Database(initialData) : new SQL.Database();
  const client = new SqlJsClient(sql as SqlDatabase, options.filePath, options.persist);
  migrate(client);
  return client;
}

class SqlJsClient implements DbClient {
  constructor(
    private readonly sql: SqlDatabase,
    private readonly filePath: string | undefined,
    private readonly persist: boolean
  ) {}

  exec(sql: string): void {
    this.sql.exec(sql);
    this.save();
  }

  run(sql: string, params: DbValue[] = []): void {
    const stmt = this.sql.prepare(sql);
    try {
      stmt.run(params);
    } finally {
      stmt.free();
    }
    this.save();
  }

  get<T extends Record<string, unknown>>(sql: string, params: DbValue[] = []): T | undefined {
    return this.all<T>(sql, params)[0];
  }

  all<T extends Record<string, unknown>>(sql: string, params: DbValue[] = []): T[] {
    const stmt = this.sql.prepare(sql);
    const rows: T[] = [];
    try {
      if (params.length > 0) {
        stmt.bind(params);
      }
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as T);
      }
    } finally {
      stmt.free();
    }
    return rows;
  }

  insert(sql: string, params: DbValue[] = []): number {
    this.run(sql, params);
    const row = this.get<{ id: number }>('SELECT last_insert_rowid() as id');
    return Number(row?.id);
  }

  save(): void {
    if (!this.persist || !this.filePath) {
      return;
    }
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, Buffer.from(this.sql.export()));
  }
}

function migrate(db: DbClient): void {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS phones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_number TEXT NOT NULL,
      carrier TEXT,
      plan_name TEXT,
      amount_minor_units INTEGER NOT NULL,
      currency TEXT NOT NULL,
      billing_cycle TEXT NOT NULL,
      billing_day INTEGER,
      activate_date TEXT,
      next_due_date TEXT,
      expire_date TEXT,
      auto_renew INTEGER NOT NULL DEFAULT 0,
      payment_method TEXT,
      renewal_url TEXT,
      status TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived_at TEXT
    );

    CREATE TABLE IF NOT EXISTS vps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      provider TEXT,
      ip_address TEXT,
      location TEXT,
      cpu TEXT,
      memory TEXT,
      storage TEXT,
      bandwidth TEXT,
      os TEXT,
      amount_minor_units INTEGER NOT NULL,
      currency TEXT NOT NULL,
      billing_cycle TEXT NOT NULL,
      start_date TEXT,
      next_due_date TEXT,
      expire_date TEXT,
      auto_renew INTEGER NOT NULL DEFAULT 0,
      payment_method TEXT,
      renewal_url TEXT,
      status TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived_at TEXT
    );

    CREATE TABLE IF NOT EXISTS domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_name TEXT NOT NULL,
      registrar TEXT,
      dns_provider TEXT,
      purpose TEXT,
      register_date TEXT,
      next_due_date TEXT,
      expire_date TEXT,
      amount_minor_units INTEGER NOT NULL,
      currency TEXT NOT NULL,
      billing_cycle TEXT NOT NULL,
      auto_renew INTEGER NOT NULL DEFAULT 0,
      payment_method TEXT,
      renewal_url TEXT,
      status TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived_at TEXT
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      provider TEXT,
      account TEXT,
      category TEXT,
      amount_minor_units INTEGER NOT NULL,
      currency TEXT NOT NULL,
      billing_cycle TEXT NOT NULL,
      next_due_date TEXT,
      auto_renew INTEGER NOT NULL DEFAULT 0,
      payment_method TEXT,
      renewal_url TEXT,
      status TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived_at TEXT
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_type TEXT NOT NULL,
      asset_id INTEGER NOT NULL,
      amount_minor_units INTEGER NOT NULL,
      currency TEXT NOT NULL,
      paid_at TEXT NOT NULL,
      period_start TEXT,
      period_end TEXT,
      category TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminder_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT NOT NULL,
      asset_type TEXT NOT NULL,
      asset_id INTEGER NOT NULL,
      due_date TEXT NOT NULL,
      days_before INTEGER NOT NULL,
      sent_at TEXT NOT NULL,
      status TEXT NOT NULL,
      error_message TEXT,
      UNIQUE(asset_type, asset_id, due_date, days_before, status)
    );
  `);

  seedSetting(db, 'reminderDays', [30, 14, 7, 3, 1, 0]);
  seedSetting(db, 'reminderEnabled', true);
  seedSetting(db, 'defaultCurrency', 'CNY');
  seedSetting(db, 'timezone', 'Asia/Shanghai');
  seedSetting(db, 'smtpHost', '');
  seedSetting(db, 'smtpPort', 587);
  seedSetting(db, 'smtpUser', '');
  seedSetting(db, 'smtpFrom', '');
  seedSetting(db, 'smtpTo', '');
}

function seedSetting(db: DbClient, key: string, value: unknown): void {
  db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [
    key,
    JSON.stringify(value)
  ]);
}
