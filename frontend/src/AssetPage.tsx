import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Archive, ExternalLink, Pencil, Plus, Search } from 'lucide-react';
import type { AssetPageConfig } from './assetConfig';
import type { AssetItem, AssetStatus, BillingCycle, Currency } from './types';
import { api, ApiError } from './api';
import { compactDate, daysLeft, dueTone, formatCycle, formatMoney } from './format';
import { Button, DataTable, Drawer, Field, IconButton, StatusBadge, TableSkeleton, inputClass, type DataTableColumn } from './ui';

type FormState = Record<string, string | boolean>;

const currencies: Currency[] = ['CNY', 'USD', 'GBP', 'EUR'];
const cycles: BillingCycle[] = ['monthly', 'quarterly', 'annual'];
const statuses: AssetStatus[] = ['active', 'paused', 'expired', 'cancelled', 'archived'];

export function AssetPage({ config }: { config: AssetPageConfig }) {
  const [items, setItems] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load().catch((err) => { setError(err instanceof ApiError ? err.message : '加载失败'); setLoading(false); });
  }, [config.endpoint, query, status]);

  const filteredItems = useMemo(
    () => items.filter((item) => !currency || item.currency === currency),
    [items, currency]
  );

  const openCreate = () => { setEditing(null); setForm(initialForm(config)); setDrawerOpen(true); };
  const openEdit = (item: AssetItem) => { setEditing(item); setForm(assetToForm(config, item)); setDrawerOpen(true); };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const payload = formToPayload(config, form);
    try {
      if (editing) await api.put(`/api/${config.endpoint}/${editing.id}`, payload);
      else await api.post(`/api/${config.endpoint}`, payload);
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

  const columns: DataTableColumn<AssetItem>[] = [
    {
      key: 'name', header: '名称', render: (item) => (
        <div>
          <div className="font-medium">{getText(item, config.primaryKey)}</div>
          {item.tags.length > 0 && <div className="mt-0.5 text-[11px] text-zinc-500">{item.tags.join(' / ')}</div>}
        </div>
      )
    },
    { key: 'provider', header: '供应商', render: (item) => <span className="text-zinc-500">{getText(item, config.secondaryKey)}</span> },
    { key: 'amount', header: '金额', align: 'right', render: (item) => <span className="font-mono">{formatMoney(item.amountMinorUnits, item.currency)}</span> },
    { key: 'cycle', header: '周期', align: 'right', render: (item) => <span className="font-mono text-zinc-500">{formatCycle(item.billingCycle)}</span> },
    {
      key: 'due', header: '到期/扣费', align: 'right', render: (item) => {
        const d = String(item[config.dueKey] ?? item.nextDueDate ?? item.expireDate ?? '');
        return <span className="font-mono text-zinc-500">{compactDate(d)}</span>;
      }
    },
    {
      key: 'days', header: '剩余', align: 'right', render: (item) => {
        const d = String(item[config.dueKey] ?? item.nextDueDate ?? item.expireDate ?? '');
        const left = daysLeft(d || null);
        return <span className={`font-mono ${dueTone(left)}`}>{left === null ? '-' : `${left}d`}</span>;
      }
    },
    { key: 'status', header: '状态', align: 'center', render: (item) => <StatusBadge status={item.status} /> },
    { key: 'renew', header: '续费', align: 'center', render: (item) => <span className="font-mono text-xs text-zinc-500">{item.autoRenew ? 'ON' : 'OFF'}</span> },
    {
      key: 'actions', header: '操作', align: 'right', render: (item) => (
        <div className="flex justify-end gap-1">
          {item.renewalUrl && (
            <a className="inline-flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100" href={item.renewalUrl} target="_blank" rel="noreferrer" title="续费链接">
              <ExternalLink size={14} />
            </a>
          )}
          <button className="inline-flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => openEdit(item)} title="编辑"><Pencil size={14} /></button>
          <button className="inline-flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:text-rose-500" onClick={() => archive(item)} title="归档"><Archive size={14} /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-800 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{config.title}</h2>
          <p className="text-sm text-zinc-500">管理你的{config.singular}资产与费用。</p>
        </div>
        <Button onClick={openCreate}><Plus size={15} />新增{config.singular}</Button>
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-zinc-400" size={15} />
          <input className={`${inputClass} pl-9`} placeholder="搜索名称、供应商、备注" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">全部状态</option>
          {statuses.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="">全部币种</option>
          {currencies.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </section>

      {error && <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-300">{error}</div>}

      {loading ? <TableSkeleton rows={5} cols={6} /> : <DataTable columns={columns} data={filteredItems} emptyText="暂无数据" />}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? `编辑${config.singular}` : `新增${config.singular}`}
        footer={<><Button variant="secondary" type="button" onClick={() => setDrawerOpen(false)}>取消</Button><Button type="submit" form="asset-form">保存</Button></>}
      >
        <form id="asset-form" onSubmit={submit} className="space-y-6">
          <FormSection title="基础信息">
            {config.fields.map((field) => (
              <Field key={field.key} label={field.label}>
                {field.type === 'textarea' ? (
                  <textarea className={`${inputClass} h-24 py-2`} value={String(form[field.key] ?? '')} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} />
                ) : (
                  <input className={inputClass} type={field.type} required={field.required} value={String(form[field.key] ?? '')} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} />
                )}
              </Field>
            ))}
          </FormSection>
          <FormSection title="费用信息">
            <div className="grid grid-cols-2 gap-3">
              <Field label="金额"><input className={`${inputClass} font-mono`} type="number" step="0.01" value={String(form.amount ?? '')} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
              <Field label="币种"><select className={inputClass} value={String(form.currency)} onChange={(e) => setForm({ ...form, currency: e.target.value })}>{currencies.map((v) => <option key={v}>{v}</option>)}</select></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="计费周期"><select className={inputClass} value={String(form.billingCycle)} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}>{cycles.map((v) => <option key={v} value={v}>{v}</option>)}</select></Field>
              <Field label="下次扣费"><input className={inputClass} type="date" value={String(form.nextDueDate ?? '')} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} /></Field>
            </div>
          </FormSection>
          <FormSection title="状态与备注">
            <div className="grid grid-cols-2 gap-3">
              <Field label="状态"><select className={inputClass} value={String(form.status)} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statuses.map((v) => <option key={v}>{v}</option>)}</select></Field>
              <Field label="自动续费"><select className={inputClass} value={String(form.autoRenew)} onChange={(e) => setForm({ ...form, autoRenew: e.target.value === 'true' })}><option value="true">ON</option><option value="false">OFF</option></select></Field>
            </div>
            <Field label="支付方式"><input className={inputClass} value={String(form.paymentMethod ?? '')} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} /></Field>
            <Field label="续费链接"><input className={inputClass} value={String(form.renewalUrl ?? '')} onChange={(e) => setForm({ ...form, renewalUrl: e.target.value })} /></Field>
            <Field label="标签，逗号分隔"><input className={inputClass} value={String(form.tags ?? '')} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></Field>
            <Field label="备注"><textarea className={`${inputClass} h-24 py-2`} value={String(form.notes ?? '')} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          </FormSection>
        </form>
      </Drawer>
    </div>
  );
}

function initialForm(config: AssetPageConfig): FormState {
  const base: FormState = { amount: '', currency: 'CNY', billingCycle: config.endpoint === 'domains' ? 'annual' : 'monthly', nextDueDate: '', status: 'active', autoRenew: true, paymentMethod: '', renewalUrl: '', tags: '', notes: '' };
  for (const field of config.fields) base[field.key] = '';
  return base;
}

function assetToForm(config: AssetPageConfig, item: AssetItem): FormState {
  const base = initialForm(config);
  for (const field of config.fields) base[field.key] = String(item[field.key] ?? '');
  return { ...base, amount: (item.amountMinorUnits / 100).toFixed(2), currency: item.currency, billingCycle: item.billingCycle, nextDueDate: item.nextDueDate ?? '', status: item.status, autoRenew: item.autoRenew, paymentMethod: item.paymentMethod ?? '', renewalUrl: item.renewalUrl ?? '', tags: item.tags.join(', '), notes: item.notes ?? '' };
}

function formToPayload(config: AssetPageConfig, form: FormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    amountMinorUnits: Math.round(Number(form.amount || 0) * 100),
    currency: form.currency, billingCycle: form.billingCycle, nextDueDate: emptyToNull(form.nextDueDate),
    status: form.status, autoRenew: Boolean(form.autoRenew), paymentMethod: emptyToNull(form.paymentMethod),
    renewalUrl: emptyToNull(form.renewalUrl),
    tags: String(form.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean),
    notes: emptyToNull(form.notes)
  };
  for (const field of config.fields) {
    const v = form[field.key];
    payload[field.key] = field.type === 'number' ? (v === '' ? null : Number(v)) : emptyToNull(v);
  }
  return payload;
}

function emptyToNull(value: unknown): string | null | boolean {
  if (typeof value === 'boolean') return value;
  const text = String(value ?? '').trim();
  return text || null;
}

function getText(item: AssetItem, key: string): string {
  return String(item[key] ?? '-');
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
