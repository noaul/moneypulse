import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { Currency, DashboardSummary, DueItem } from './types';
import { api } from './api';
import { compactDate, dueTone, formatCycle, formatMoney } from './format';
import { DataTable, MetricCard, Skeleton, StatusBadge, type DataTableColumn } from './ui';

const currencies: Currency[] = ['CNY', 'USD', 'GBP', 'EUR'];
const chartColors = ['#6366f1', '#10b981', '#f59e0b', '#e11d48'];

const dueColumns: DataTableColumn<DueItem & { id: string }>[] = [
  { key: 'name', header: '资产', render: (item) => <span className="font-medium">{item.name}</span> },
  { key: 'type', header: '类型', render: (item) => <span className="text-zinc-500">{item.assetType}</span> },
  { key: 'amount', header: '金额', align: 'right', render: (item) => <span className="font-mono">{formatMoney(item.amountMinorUnits, item.currency)}</span> },
  { key: 'cycle', header: '周期', align: 'right', render: (item) => <span className="font-mono text-zinc-500">{formatCycle(item.billingCycle)}</span> },
  { key: 'date', header: '日期', align: 'right', render: (item) => <span className="font-mono text-zinc-500">{compactDate(item.dueDate)}</span> },
  { key: 'days', header: '剩余', align: 'right', render: (item) => <span className={`font-mono ${dueTone(item.daysLeft)}`}>{item.daysLeft}d</span> },
  { key: 'status', header: '状态', align: 'center', render: (item) => <StatusBadge status={item.status} /> }
];

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [dueItems, setDueItems] = useState<DueItem[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<DashboardSummary>('/api/dashboard/summary'),
      api.get<{ items: DueItem[] }>('/api/dashboard/expiring?days=30')
    ]).then(([s, d]) => {
      setSummary(s);
      setDueItems(d.items);
    });
  }, []);

  const yearlyChart = useMemo(() => {
    if (!summary) return [];
    return currencies.map((c) => ({
      currency: c,
      预测: summary.predictedYearly[c] ?? 0,
      实际: summary.actualYearly[c] ?? 0
    }));
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

  if (!summary) {
    return (
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <Skeleton className="mb-3 h-3 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
        <Skeleton className="h-72 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <MetricCard label="本月预测" value={<MoneyGroup values={summary.predictedMonthly} />} />
        <MetricCard label="年度预测" value={<MoneyGroup values={summary.predictedYearly} />} />
        <MetricCard label="年度实际" value={<MoneyGroup values={summary.actualYearly} />} />
        <MetricCard label="30 天内到期" value={summary.expiringCount} detail="包含续费与扣费" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">多币种年度趋势</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="[&>line]:stroke-zinc-200 dark:[&>line]:stroke-zinc-800" />
                <XAxis dataKey="currency" stroke="#a1a1aa" fontSize={12} />
                <YAxis stroke="#a1a1aa" fontSize={12} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="预测" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="实际" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">资产构成</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={assetChart} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} label={({ name, value }) => `${name} ${value}`}>
                  {assetChart.map((_entry, index) => (
                    <Cell key={index} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">到期 / 扣费预警</h2>
          <span className="text-xs text-zinc-500">30 天内</span>
        </div>
        <DataTable columns={dueColumns} data={dueItems.map((d) => ({ ...d, id: `${d.assetType}-${d.assetId}` }))} emptyText="30 天内没有到期项目" />
      </section>
    </div>
  );
}

function MoneyGroup({ values }: { values: Partial<Record<Currency, number>> }) {
  const entries = currencies.filter((c) => values[c]);
  if (entries.length === 0) return <span className="text-zinc-500">-</span>;
  return (
    <div className="space-y-1 text-sm">
      {entries.map((c) => (
        <div key={c} className="flex justify-between gap-4">
          <span className="text-zinc-500">{c}</span>
          <span>{formatMoney(values[c] ?? 0, c)}</span>
        </div>
      ))}
    </div>
  );
}
