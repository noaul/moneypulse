import { FormEvent, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { AssetType, Currency, ExpenseItem } from './types';
import { api } from './api';
import { compactDate, formatMoney } from './format';
import { Button, Drawer, Field, IconButton, inputClass } from './ui';

type ExpenseForm = {
  assetType: AssetType;
  assetId: string;
  amount: string;
  currency: Currency;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
  category: 'renewal' | 'monthly' | 'setup' | 'other';
  notes: string;
};

const initialForm: ExpenseForm = {
  assetType: 'subscription',
  assetId: '',
  amount: '',
  currency: 'CNY',
  paidAt: new Date().toISOString().slice(0, 10),
  periodStart: '',
  periodEnd: '',
  category: 'monthly',
  notes: ''
};

export function Expenses() {
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseItem | null>(null);
  const [form, setForm] = useState<ExpenseForm>(initialForm);

  const load = async () => {
    const response = await api.get<{ items: ExpenseItem[] }>('/api/expenses');
    setItems(response.items);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setDrawerOpen(true);
  };

  const openEdit = (item: ExpenseItem) => {
    setEditing(item);
    setForm({
      assetType: item.assetType,
      assetId: String(item.assetId),
      amount: (item.amountMinorUnits / 100).toFixed(2),
      currency: item.currency,
      paidAt: item.paidAt,
      periodStart: item.periodStart ?? '',
      periodEnd: item.periodEnd ?? '',
      category: item.category,
      notes: item.notes ?? ''
    });
    setDrawerOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      assetType: form.assetType,
      assetId: Number(form.assetId),
      amountMinorUnits: Math.round(Number(form.amount || 0) * 100),
      currency: form.currency,
      paidAt: form.paidAt,
      periodStart: form.periodStart || null,
      periodEnd: form.periodEnd || null,
      category: form.category,
      notes: form.notes || null
    };
    if (editing) {
      await api.put(`/api/expenses/${editing.id}`, payload);
    } else {
      await api.post('/api/expenses', payload);
    }
    setDrawerOpen(false);
    await load();
  };

  const remove = async (item: ExpenseItem) => {
    if (!window.confirm('删除这条费用流水？')) return;
    await api.delete(`/api/expenses/${item.id}`);
    await load();
  };

  return (
    <div className="space-y-4">
      <section className="flex items-center justify-between border-b border-zinc-800 pb-4 light:border-zinc-200">
        <div>
          <h2 className="text-2xl font-bold">费用流水</h2>
          <p className="text-sm text-zinc-500">记录真实付款，Dashboard 实际支出从这里统计。</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={15} />
          新增流水
        </Button>
      </section>

      <div className="overflow-hidden rounded-md border border-zinc-800 bg-card-dark light:border-zinc-200 light:bg-white">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-zinc-800 text-[11px] uppercase text-zinc-500 light:border-zinc-200">
            <tr>
              <th className="px-4 py-3 font-medium">资产</th>
              <th className="px-4 py-3 text-right font-medium">金额</th>
              <th className="px-4 py-3 text-right font-medium">支付日期</th>
              <th className="px-4 py-3 text-right font-medium">周期</th>
              <th className="px-4 py-3 font-medium">分类</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-zinc-900 hover:bg-zinc-900/50 light:border-zinc-100">
                <td className="px-4 py-3">
                  <div className="font-medium">{item.assetType}</div>
                  <div className="font-mono text-[11px] text-zinc-500">#{item.assetId}</div>
                </td>
                <td className="px-4 py-3 text-right font-mono">{formatMoney(item.amountMinorUnits, item.currency)}</td>
                <td className="px-4 py-3 text-right font-mono text-zinc-400">{item.paidAt}</td>
                <td className="px-4 py-3 text-right font-mono text-zinc-400">
                  {compactDate(item.periodStart)} - {compactDate(item.periodEnd)}
                </td>
                <td className="px-4 py-3 text-zinc-400">{item.category}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <IconButton onClick={() => openEdit(item)} title="编辑">
                      <Pencil size={14} />
                    </IconButton>
                    <IconButton onClick={() => remove(item)} title="删除">
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td className="px-4 py-12 text-center text-sm text-zinc-500" colSpan={6}>
                  暂无费用流水
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? '编辑流水' : '新增流水'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              取消
            </Button>
            <Button form="expense-form" type="submit">
              保存
            </Button>
          </>
        }
      >
        <form id="expense-form" onSubmit={submit} className="space-y-4">
          <Field label="资产类型">
            <select className={inputClass} value={form.assetType} onChange={(e) => setForm({ ...form, assetType: e.target.value as AssetType })}>
              <option value="phone">phone</option>
              <option value="vps">vps</option>
              <option value="domain">domain</option>
              <option value="subscription">subscription</option>
            </select>
          </Field>
          <Field label="资产 ID">
            <input className={inputClass} value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="金额">
              <input className={inputClass} type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Field>
            <Field label="币种">
              <select className={inputClass} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as Currency })}>
                <option>CNY</option>
                <option>USD</option>
                <option>GBP</option>
                <option>EUR</option>
              </select>
            </Field>
          </div>
          <Field label="支付日期">
            <input className={inputClass} type="date" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="周期开始">
              <input className={inputClass} type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} />
            </Field>
            <Field label="周期结束">
              <input className={inputClass} type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} />
            </Field>
          </div>
          <Field label="分类">
            <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseForm['category'] })}>
              <option value="renewal">renewal</option>
              <option value="monthly">monthly</option>
              <option value="setup">setup</option>
              <option value="other">other</option>
            </select>
          </Field>
          <Field label="备注">
            <textarea className={`${inputClass} h-24 py-2`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </form>
      </Drawer>
    </div>
  );
}
