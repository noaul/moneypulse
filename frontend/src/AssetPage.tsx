import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Archive, ExternalLink, Pencil, Plus, Search } from 'lucide-react';
import type { AssetPageConfig } from './assetConfig';
import type { AssetItem, AssetStatus, BillingCycle, Currency } from './types';
import { api, ApiError } from './api';
import { compactDate, daysLeft, dueTone, formatCycle, formatMoney } from './format';
import { Button, Drawer, Field, IconButton, StatusBadge, inputClass } from './ui';

type FormState = Record<string, string | boolean>;

const currencies: Currency[] = ['CNY', 'USD', 'GBP', 'EUR'];
const cycles: BillingCycle[] = ['monthly', 'quarterly', 'annual'];
const statuses: AssetStatus[] = ['active', 'paused', 'expired', 'cancelled', 'archived'];

export function AssetPage({ config }: { config: AssetPageConfig }) {
  const [items, setItems] = useState<AssetItem[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [currency, setCurrency] = useState('');
  const [editing, setEditing] = useState<AssetItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => initialForm(config));
  const [error, setError] = useState('');

  const load = async () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (status) params.set('status', status);
    const response = await api.get<{ items: AssetItem[] }>(`/api/${config.endpoint}?${params}`);
    setItems(response.items);
  };

  useEffect(() => {
    load().catch((err) => setError(err instanceof ApiError ? err.message : '加载失败'));
  }, [config.endpoint, query, status]);

  const filteredItems = useMemo(
    () => items.filter((item) => !currency || item.currency === currency),
    [items, currency]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm(config));
    setDrawerOpen(true);
  };

  const openEdit = (item: AssetItem) => {
    setEditing(item);
    setForm(assetToForm(config, item));
    setDrawerOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const payload = formToPayload(config, form);
    try {
      if (editing) {
        await api.put(`/api/${config.endpoint}/${editing.id}`, payload);
      } else {
        await api.post(`/api/${config.endpoint}`, payload);
      }
      setDrawerOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '保存失败');
    }
  };

  const archive = async (item: AssetItem) => {
    if (!window.confirm(`归档 ${getText(item, config.primaryKey)}？`)) return;
    await api.delete(`/api/${config.endpoint}/${item.id}`);
    await load();
  };

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 border-b border-zinc-800 pb-4 light:border-zinc-200 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{config.title}</h2>
          <p className="text-sm text-zinc-500">高密度表格管理，金额与日期使用等宽字体对齐。</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={15} />
          新增{config.singular}
        </Button>
      </section>

      <section className="flex flex-col gap-2 rounded-md border border-zinc-800 bg-card-dark p-3 light:border-zinc-200 light:bg-white md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-zinc-500" size={15} />
          <input
            className={`${inputClass} pl-9`}
            placeholder="搜索名称、供应商、备注"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">全部状态</option>
          {statuses.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select className={inputClass} value={currency} onChange={(event) => setCurrency(event.target.value)}>
          <option value="">全部币种</option>
          {currencies.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </section>

      {error ? <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div> : null}

      <div className="overflow-hidden rounded-md border border-zinc-800 bg-card-dark light:border-zinc-200 light:bg-white">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead className="border-b border-zinc-800 text-[11px] uppercase text-zinc-500 light:border-zinc-200">
            <tr>
              <th className="px-4 py-3 font-medium">名称</th>
              <th className="px-4 py-3 font-medium">供应商</th>
              <th className="px-4 py-3 text-right font-medium">金额</th>
              <th className="px-4 py-3 text-right font-medium">周期</th>
              <th className="px-4 py-3 text-right font-medium">到期 / 扣费</th>
              <th className="px-4 py-3 text-right font-medium">剩余</th>
              <th className="px-4 py-3 text-center font-medium">状态</th>
              <th className="px-4 py-3 text-center font-medium">自动续费</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const dueDate = String(item[config.dueKey] ?? item.nextDueDate ?? item.expireDate ?? '');
              const left = daysLeft(dueDate || null);
              return (
                <tr
                  key={item.id}
                  className="border-b border-zinc-900 hover:bg-zinc-900/50 light:border-zinc-100 light:hover:bg-zinc-50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-100 light:text-zinc-950">{getText(item, config.primaryKey)}</div>
                    {item.tags.length ? (
                      <div className="mt-1 text-[11px] text-zinc-500">{item.tags.join(' / ')}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{getText(item, config.secondaryKey)}</td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-100 light:text-zinc-950">
                    {formatMoney(item.amountMinorUnits, item.currency)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-400">{formatCycle(item.billingCycle)}</td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-400">{compactDate(dueDate)}</td>
                  <td className={`px-4 py-3 text-right font-mono ${dueTone(left)}`}>{left === null ? '-' : `${left}d`}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-xs text-zinc-400">
                    {item.autoRenew ? 'ON' : 'OFF'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {item.renewalUrl ? (
                        <a
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                          href={item.renewalUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="续费链接"
                        >
                          <ExternalLink size={14} />
                        </a>
                      ) : null}
                      <IconButton onClick={() => openEdit(item)} title="编辑">
                        <Pencil size={14} />
                      </IconButton>
                      <IconButton onClick={() => archive(item)} title="归档">
                        <Archive size={14} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-zinc-500">
                  暂无数据
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? `编辑${config.singular}` : `新增${config.singular}`}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setDrawerOpen(false)}>
              取消
            </Button>
            <Button type="submit" form="asset-form">
              保存
            </Button>
          </>
        }
      >
        <form id="asset-form" onSubmit={submit} className="space-y-6">
          <FormSection title="基础信息">
            {config.fields.map((field) => (
              <Field key={field.key} label={field.label}>
                {field.type === 'textarea' ? (
                  <textarea
                    className={`${inputClass} h-24 py-2`}
                    value={String(form[field.key] ?? '')}
                    onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                  />
                ) : (
                  <input
                    className={inputClass}
                    type={field.type}
                    required={field.required}
                    value={String(form[field.key] ?? '')}
                    onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                  />
                )}
              </Field>
            ))}
          </FormSection>
          <FormSection title="费用信息">
            <div className="grid grid-cols-2 gap-3">
              <Field label="金额">
                <input
                  className={`${inputClass} font-mono`}
                  type="number"
                  step="0.01"
                  value={String(form.amount ?? '')}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                />
              </Field>
              <Field label="币种">
                <select
                  className={inputClass}
                  value={String(form.currency)}
                  onChange={(event) => setForm({ ...form, currency: event.target.value })}
                >
                  {currencies.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="计费周期">
                <select
                  className={inputClass}
                  value={String(form.billingCycle)}
                  onChange={(event) => setForm({ ...form, billingCycle: event.target.value })}
                >
                  {cycles.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="下次扣费">
                <input
                  className={inputClass}
                  type="date"
                  value={String(form.nextDueDate ?? '')}
                  onChange={(event) => setForm({ ...form, nextDueDate: event.target.value })}
                />
              </Field>
            </div>
          </FormSection>
          <FormSection title="状态与备注">
            <div className="grid grid-cols-2 gap-3">
              <Field label="状态">
                <select
                  className={inputClass}
                  value={String(form.status)}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                >
                  {statuses.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </Field>
              <Field label="自动续费">
                <select
                  className={inputClass}
                  value={String(form.autoRenew)}
                  onChange={(event) => setForm({ ...form, autoRenew: event.target.value === 'true' })}
                >
                  <option value="true">ON</option>
                  <option value="false">OFF</option>
                </select>
              </Field>
            </div>
            <Field label="支付方式">
              <input
                className={inputClass}
                value={String(form.paymentMethod ?? '')}
                onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}
              />
            </Field>
            <Field label="续费链接">
              <input
                className={inputClass}
                value={String(form.renewalUrl ?? '')}
                onChange={(event) => setForm({ ...form, renewalUrl: event.target.value })}
              />
            </Field>
            <Field label="标签，逗号分隔">
              <input
                className={inputClass}
                value={String(form.tags ?? '')}
                onChange={(event) => setForm({ ...form, tags: event.target.value })}
              />
            </Field>
            <Field label="备注">
              <textarea
                className={`${inputClass} h-24 py-2`}
                value={String(form.notes ?? '')}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </Field>
          </FormSection>
        </form>
      </Drawer>
    </div>
  );
}

function initialForm(config: AssetPageConfig): FormState {
  const base: FormState = {
    amount: '',
    currency: 'CNY',
    billingCycle: config.endpoint === 'domains' ? 'annual' : 'monthly',
    nextDueDate: '',
    status: 'active',
    autoRenew: true,
    paymentMethod: '',
    renewalUrl: '',
    tags: '',
    notes: ''
  };
  for (const field of config.fields) {
    base[field.key] = '';
  }
  return base;
}

function assetToForm(config: AssetPageConfig, item: AssetItem): FormState {
  const base = initialForm(config);
  for (const field of config.fields) {
    base[field.key] = String(item[field.key] ?? '');
  }
  return {
    ...base,
    amount: (item.amountMinorUnits / 100).toFixed(2),
    currency: item.currency,
    billingCycle: item.billingCycle,
    nextDueDate: item.nextDueDate ?? '',
    status: item.status,
    autoRenew: item.autoRenew,
    paymentMethod: item.paymentMethod ?? '',
    renewalUrl: item.renewalUrl ?? '',
    tags: item.tags.join(', '),
    notes: item.notes ?? ''
  };
}

function formToPayload(config: AssetPageConfig, form: FormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    amountMinorUnits: Math.round(Number(form.amount || 0) * 100),
    currency: form.currency,
    billingCycle: form.billingCycle,
    nextDueDate: emptyToNull(form.nextDueDate),
    status: form.status,
    autoRenew: Boolean(form.autoRenew),
    paymentMethod: emptyToNull(form.paymentMethod),
    renewalUrl: emptyToNull(form.renewalUrl),
    tags: String(form.tags ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    notes: emptyToNull(form.notes)
  };

  for (const field of config.fields) {
    const value = form[field.key];
    payload[field.key] =
      field.type === 'number' ? (value === '' ? null : Number(value)) : emptyToNull(value);
  }
  return payload;
}

function emptyToNull(value: unknown): string | null | boolean {
  if (typeof value === 'boolean') return value;
  const text = String(value ?? '').trim();
  return text ? text : null;
}

function getText(item: AssetItem, key: string): string {
  return String(item[key] ?? '-');
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-100 light:text-zinc-950">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
