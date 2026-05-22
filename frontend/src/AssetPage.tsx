import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Archive, ExternalLink, Grid3X3, List, Pencil, Plus, Search } from 'lucide-react';
import type { AssetPageConfig } from './assetConfig';
import type { AssetItem, AssetStatus, BillingCycle, Currency } from './types';
import { api, ApiError } from './api';
import { compactDate, daysLeft, dueTone, formatCycle, formatMoney } from './format';
import { Button, DataTable, Drawer, Field, IconButton, Skeleton, StatusBadge, inputClass, type DataTableColumn } from './ui';

type FormState = Record<string, string | boolean>;
const currencies: Currency[] = ['CNY', 'USD', 'GBP', 'EUR'];
const cycles: BillingCycle[] = ['monthly', 'quarterly', 'annual'];
const statuses: AssetStatus[] = ['active', 'paused', 'expired', 'cancelled', 'archived'];

export function AssetPage({ config }: { config: AssetPageConfig }) {
  const [items, setItems] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'card' | 'table'>('card');
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
    const r = await api.get<{ items: AssetItem[] }>(`/api/${config.endpoint}?${params}`);
    setItems(r.items); setLoading(false);
  };

  useEffect(() => { setLoading(true); load().catch((e) => { setError(e instanceof ApiError ? e.message : '加载失败'); setLoading(false); }); }, [config.endpoint, query, status]);

  const filtered = useMemo(() => items.filter((i) => !currency || i.currency === currency), [items, currency]);

  const openCreate = () => { setEditing(null); setForm(initialForm(config)); setDrawerOpen(true); };
  const openEdit = (item: AssetItem) => { setEditing(item); setForm(assetToForm(config, item)); setDrawerOpen(true); };

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    try {
      const payload = formToPayload(config, form);
      if (editing) await api.put(`/api/${config.endpoint}/${editing.id}`, payload);
      else await api.post(`/api/${config.endpoint}`, payload);
      setDrawerOpen(false); await load();
    } catch (err) { setError(err instanceof ApiError ? err.message : '保存失败'); }
  };

  const archive = async (item: AssetItem) => {
    if (!window.confirm(`归档 ${getText(item, config.primaryKey)}？`)) return;
    await api.delete(`/api/${config.endpoint}/${item.id}`); await load();
  };

  const columns: DataTableColumn<AssetItem>[] = [
    { key: 'name', header: '名称', render: (item) => <span className="font-semibold">{getText(item, config.primaryKey)}</span> },
    { key: 'provider', header: '供应商', render: (item) => <span className="text-slate-500">{getText(item, config.secondaryKey)}</span> },
    { key: 'amount', header: '金额', align: 'right', render: (item) => <span className="font-mono font-semibold">{formatMoney(item.amountMinorUnits, item.currency)}</span> },
    { key: 'cycle', header: '周期', align: 'right', render: (item) => <span className="text-slate-500">{formatCycle(item.billingCycle)}</span> },
    { key: 'days', header: '剩余', align: 'right', render: (item) => { const d = String(item[config.dueKey] ?? item.nextDueDate ?? item.expireDate ?? ''); const l = daysLeft(d || null); return <span className={`font-mono font-bold ${dueTone(l)}`}>{l === null ? '-' : `${l}d`}</span>; } },
    { key: 'status', header: '状态', align: 'center', render: (item) => <StatusBadge status={item.status} /> },
    { key: 'actions', header: '', align: 'right', render: (item) => (
      <div className="flex justify-end gap-1">
        <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800" onClick={() => openEdit(item)}><Pencil size={14} /></button>
        <button className="rounded-lg p-1.5 text-slate-400 hover:bg-danger-50 hover:text-danger-500" onClick={() => archive(item)}><Archive size={14} /></button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{config.title}</h2>
          <p className="mt-1 text-sm text-slate-500">共 {filtered.length} 项{config.singular}</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} />新增{config.singular}</Button>
      </div>

      {/* Filters */}
      <div className="card flex flex-col gap-3 !p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-2.5 text-slate-400" size={16} />
          <input className={`${inputClass} pl-10`} placeholder="搜索..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className={inputClass + ' md:w-36'} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">全部状态</option>
          {statuses.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select className={inputClass + ' md:w-32'} value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="">全部币种</option>
          {currencies.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <div className="flex gap-1">
          <IconButton onClick={() => setView('card')} className={view === 'card' ? '!bg-brand-50 !text-brand-600 !border-brand-200 dark:!bg-brand-500/10 dark:!border-brand-500/30' : ''} title="卡片"><Grid3X3 size={16} /></IconButton>
          <IconButton onClick={() => setView('table')} className={view === 'table' ? '!bg-brand-50 !text-brand-600 !border-brand-200 dark:!bg-brand-500/10 dark:!border-brand-500/30' : ''} title="表格"><List size={16} /></IconButton>
        </div>
      </div>

      {error && <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-600 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-400">{error}</div>}

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>
      ) : view === 'card' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const dueDate = String(item[config.dueKey] ?? item.nextDueDate ?? item.expireDate ?? '');
            const left = daysLeft(dueDate || null);
            return (
              <div key={item.id} className="card-hover group relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{getText(item, config.primaryKey)}</h3>
                    <p className="mt-0.5 text-sm text-slate-500">{getText(item, config.secondaryKey)}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="font-mono text-xl font-bold">{formatMoney(item.amountMinorUnits, item.currency)}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{formatCycle(item.billingCycle)} · {item.autoRenew ? '自动续费' : '手动续费'}</p>
                  </div>
                  {left !== null && (
                    <div className={`text-right font-mono text-sm font-bold ${dueTone(left)}`}>
                      {left}d
                      <p className="font-sans text-[11px] font-normal text-slate-400">{compactDate(dueDate)}</p>
                    </div>
                  )}
                </div>
                {item.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.tags.map((t) => <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">{t}</span>)}
                  </div>
                )}
                {/* Hover actions */}
                <div className="absolute right-4 top-4 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  {item.renewalUrl && <a href={item.renewalUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-slate-200 text-slate-500 hover:text-brand-600 dark:bg-slate-800 dark:ring-slate-700"><ExternalLink size={13} /></a>}
                  <button onClick={() => openEdit(item)} className="rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-slate-200 text-slate-500 hover:text-brand-600 dark:bg-slate-800 dark:ring-slate-700"><Pencil size={13} /></button>
                  <button onClick={() => archive(item)} className="rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-slate-200 text-slate-500 hover:text-danger-500 dark:bg-slate-800 dark:ring-slate-700"><Archive size={13} /></button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="col-span-full py-16 text-center text-slate-400">暂无数据</p>}
        </div>
      ) : (
        <DataTable columns={columns} data={filtered} emptyText="暂无数据" />
      )}

      {/* Drawer Form */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? `编辑${config.singular}` : `新增${config.singular}`}
        footer={<><Button variant="secondary" onClick={() => setDrawerOpen(false)}>取消</Button><Button type="submit" form="asset-form">保存</Button></>}>
        <form id="asset-form" onSubmit={submit} className="space-y-6">
          <Section title="基础信息">
            {config.fields.map((f) => (
              <Field key={f.key} label={f.label}>
                {f.type === 'textarea' ? <textarea className={`${inputClass} h-24 py-2.5`} value={String(form[f.key] ?? '')} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                : <input className={inputClass} type={f.type} required={f.required} value={String(form[f.key] ?? '')} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />}
              </Field>
            ))}
          </Section>
          <Section title="费用信息">
            <div className="grid grid-cols-2 gap-3">
              <Field label="金额"><input className={`${inputClass} font-mono`} type="number" step="0.01" value={String(form.amount ?? '')} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
              <Field label="币种"><select className={inputClass} value={String(form.currency)} onChange={(e) => setForm({ ...form, currency: e.target.value })}>{currencies.map((v) => <option key={v}>{v}</option>)}</select></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="计费周期"><select className={inputClass} value={String(form.billingCycle)} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}>{cycles.map((v) => <option key={v} value={v}>{v}</option>)}</select></Field>
              <Field label="下次扣费"><input className={inputClass} type="date" value={String(form.nextDueDate ?? '')} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} /></Field>
            </div>
          </Section>
          <Section title="状态与备注">
            <div className="grid grid-cols-2 gap-3">
              <Field label="状态"><select className={inputClass} value={String(form.status)} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statuses.map((v) => <option key={v}>{v}</option>)}</select></Field>
              <Field label="自动续费"><select className={inputClass} value={String(form.autoRenew)} onChange={(e) => setForm({ ...form, autoRenew: e.target.value === 'true' })}><option value="true">ON</option><option value="false">OFF</option></select></Field>
            </div>
            <Field label="支付方式"><input className={inputClass} value={String(form.paymentMethod ?? '')} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} /></Field>
            <Field label="续费链接"><input className={inputClass} value={String(form.renewalUrl ?? '')} onChange={(e) => setForm({ ...form, renewalUrl: e.target.value })} /></Field>
            <Field label="标签（逗号分隔）"><input className={inputClass} value={String(form.tags ?? '')} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></Field>
            <Field label="备注"><textarea className={`${inputClass} h-24 py-2.5`} value={String(form.notes ?? '')} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          </Section>
        </form>
      </Drawer>
    </div>
  );
}

function initialForm(config: AssetPageConfig): FormState {
  const base: FormState = { amount: '', currency: 'CNY', billingCycle: config.endpoint === 'domains' ? 'annual' : 'monthly', nextDueDate: '', status: 'active', autoRenew: true, paymentMethod: '', renewalUrl: '', tags: '', notes: '' };
  for (const f of config.fields) base[f.key] = '';
  return base;
}
function assetToForm(config: AssetPageConfig, item: AssetItem): FormState {
  const base = initialForm(config);
  for (const f of config.fields) base[f.key] = String(item[f.key] ?? '');
  return { ...base, amount: (item.amountMinorUnits / 100).toFixed(2), currency: item.currency, billingCycle: item.billingCycle, nextDueDate: item.nextDueDate ?? '', status: item.status, autoRenew: item.autoRenew, paymentMethod: item.paymentMethod ?? '', renewalUrl: item.renewalUrl ?? '', tags: item.tags.join(', '), notes: item.notes ?? '' };
}
function formToPayload(config: AssetPageConfig, form: FormState): Record<string, unknown> {
  const p: Record<string, unknown> = { amountMinorUnits: Math.round(Number(form.amount || 0) * 100), currency: form.currency, billingCycle: form.billingCycle, nextDueDate: nil(form.nextDueDate), status: form.status, autoRenew: Boolean(form.autoRenew), paymentMethod: nil(form.paymentMethod), renewalUrl: nil(form.renewalUrl), tags: String(form.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean), notes: nil(form.notes) };
  for (const f of config.fields) { const v = form[f.key]; p[f.key] = f.type === 'number' ? (v === '' ? null : Number(v)) : nil(v); }
  return p;
}
function nil(v: unknown): string | null | boolean { if (typeof v === 'boolean') return v; const s = String(v ?? '').trim(); return s || null; }
function getText(item: AssetItem, key: string) { return String(item[key] ?? '-'); }
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-4"><h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3><div className="space-y-3">{children}</div></section>;
}
