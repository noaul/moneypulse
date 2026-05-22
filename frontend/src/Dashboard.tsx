import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Currency, DashboardSummary, DueItem } from './types';
import { api } from './api';
import { compactDate, dueTone, formatCycle, formatMoney } from './format';
import { DataTable, MetricCard, ProgressBar, Skeleton, StatusBadge, type DataTableColumn } from './ui';

const currencies: Currency[] = ['CNY', 'USD', 'GBP', 'EUR'];
const chartColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const dueColumns: DataTableColumn<DueItem & { id: string }>[] = [
  { key: 'name', header: '资产', render: (item) => <span className="font-semibold">{item.name}</span> },
  { key: 'type', header: '类型', render: (item) => <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">{item.assetType}</span> },
  { key: 'amount', header: '金额', align: 'right', render: (item) => <span className="font-mono font-semibold">{formatMoney(item.amountMinorUnits, item.currency)}</span> },
  { key: 'cycle', header: '周期', align: 'right', render: (item) => <span className="text-slate-500">{formatCycle(item.billingCycle)}</span> },
  { key: 'date', header: '日期', align: 'right', render: (item) => <span className="font-mono text-slate-500">{compactDate(item.dueDate)}</span> },
  { key: 'days', header: '剩余', align: 'right', render: (item) => <span className={`font-mono font-bold ${dueTone(item.daysLeft)}`}>{item.daysLeft}d</span> },
  { key: 'status', header: '状态', align: 'center', render: (item) => <StatusBadge status={item.status} /> }
];

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [dueItems, setDueItems] = useState<DueItem[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<DashboardSummary>('/api/dashboard/summary'),
      api.get<{ items: DueItem[] }>('/api/dashboard/expiring?days=30')
    ]).then(([s, d]) => { setSummary(s); setDueItems(d.items); });
  }, []);

  const yearlyChart = useMemo(() => {
    if (!summary) return [];
    return currencies.map((c) => ({ currency: c, 预测: summary.predictedYearly[c] ?? 0, 实际: summary.actualYearly[c] ?? 0 }));
  }, [summary]);

  const assetChart = useMemo(() => {
    if (!summary) return [];
    return [
      { name: '电话卡', value: summary.assetCounts.phones ?? 0 },
      { name: 'VPS', value: summary.assetCounts.vps ?? 0 },
      { name: '域名', value: summary.assetCounts.domains ?? 0 },
      { name: '订阅', value: summary.assetCounts.subscriptions ?? 0 }
    ].filter((i) => i.value > 0);
  }, [summary]);

  const totalAssets = useMemo(() => assetChart.reduce((a, b) => a + b.value, 0), [assetChart]);

  if (!summary) {
    return (
      <div className="space-y-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={<DollarSign size={20} />} color="brand" label="本月预测" value={<MoneyPrimary values={summary.predictedMonthly} />} />
        <MetricCard icon={<TrendingUp size={20} />} color="success" label="年度预测" value={<MoneyPrimary values={summary.predictedYearly} />} />
        <MetricCard icon={<BarChart3 size={20} />} color="warning" label="年度实际" value={<MoneyPrimary values={summary.actualYearly} />} />
        <MetricCard icon={<AlertTriangle size={20} />} color="danger" label="30 天内到期" value={summary.expiringCount} detail="包含续费与扣费" />
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-1 text-base font-semibold">多币种年度对比</h2>
          <p className="mb-5 text-xs text-slate-500">预测支出 vs 实际支出</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyChart} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="[&>line]:stroke-slate-100 dark:[&>line]:stroke-slate-800" />
                <XAxis dataKey="currency" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                <Bar dataKey="预测" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="实际" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-1 text-base font-semibold">资产构成</h2>
          <p className="mb-4 text-xs text-slate-500">共 {totalAssets} 项活跃资产</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={assetChart} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} strokeWidth={0}>
                  {assetChart.map((_e, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {assetChart.map((item, i) => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full" style={{ background: chartColors[i % chartColors.length] }} />
                <span className="flex-1 text-sm">{item.name}</span>
                <span className="font-mono text-sm font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spending breakdown by category */}
      {assetChart.length > 0 && (
        <div className="card">
          <h2 className="mb-4 text-base font-semibold">资产分布</h2>
          <div className="space-y-4">
            {assetChart.map((item, i) => (
              <div key={item.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="font-mono font-semibold">{totalAssets > 0 ? Math.round((item.value / totalAssets) * 100) : 0}%</span>
                </div>
                <ProgressBar value={item.value} max={totalAssets} color={['brand', 'success', 'warning', 'danger'][i % 4]} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Due Items */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger-100 text-danger-600 dark:bg-danger-500/20 dark:text-danger-400">
            <Calendar size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold">到期 / 扣费预警</h2>
            <p className="text-xs text-slate-500">未来 30 天内</p>
          </div>
        </div>
        <DataTable columns={dueColumns} data={dueItems.map((d) => ({ ...d, id: `${d.assetType}-${d.assetId}` }))} emptyText="30 天内没有到期项目 🎉" />
      </div>
    </div>
  );
}

function MoneyPrimary({ values }: { values: Partial<Record<Currency, number>> }) {
  const entries = currencies.filter((c) => values[c]);
  if (entries.length === 0) return <span className="text-slate-400">-</span>;
  // Show first non-zero currency as primary
  const primary = entries[0];
  return (
    <div>
      <span>{formatMoney(values[primary] ?? 0, primary)}</span>
      {entries.length > 1 && <span className="ml-2 text-sm font-normal text-slate-400">+{entries.length - 1}</span>}
    </div>
  );
}
