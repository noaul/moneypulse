import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { MetricCard, StatusBadge } from './ui';

const currencies: Currency[] = ['CNY', 'USD', 'GBP', 'EUR'];
const chartColors = ['#6366f1', '#10b981', '#f59e0b', '#e11d48'];

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [dueItems, setDueItems] = useState<DueItem[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<DashboardSummary>('/api/dashboard/summary'),
      api.get<{ items: DueItem[] }>('/api/dashboard/expiring?days=30')
    ]).then(([summaryResponse, dueResponse]) => {
      setSummary(summaryResponse);
      setDueItems(dueResponse.items);
    });
  }, []);

  const yearlyChart = useMemo(() => {
    if (!summary) return [];
    return currencies.map((currency) => ({
      currency,
      predicted: summary.predictedYearly[currency] ?? 0,
      actual: summary.actualYearly[currency] ?? 0
    }));
  }, [summary]);

  const assetChart = useMemo(() => {
    if (!summary) return [];
    return [
      { name: '电话卡', value: summary.assetCounts.phones ?? 0 },
      { name: 'VPS', value: summary.assetCounts.vps ?? 0 },
      { name: '域名', value: summary.assetCounts.domains ?? 0 },
      { name: '订阅', value: summary.assetCounts.subscriptions ?? 0 }
    ].filter((item) => item.value > 0);
  }, [summary]);

  if (!summary) {
    return <div className="text-sm text-zinc-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="本月预测" value={<MoneyGroup values={summary.predictedMonthly} />} />
        <MetricCard label="年度预测" value={<MoneyGroup values={summary.predictedYearly} />} />
        <MetricCard label="年度实际" value={<MoneyGroup values={summary.actualYearly} />} />
        <MetricCard label="30 天内到期" value={summary.expiringCount} detail="包含续费与扣费" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-md border border-zinc-800 bg-card-dark p-4 light:border-zinc-200 light:bg-white">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">多币种年度趋势</h2>
            <span className="text-xs text-zinc-500">预测 vs 实际</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyChart}>
                <CartesianGrid stroke="#27272a" vertical={false} />
                <XAxis dataKey="currency" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: '#121214',
                    border: '1px solid #27272a',
                    borderRadius: 6,
                    color: '#f4f4f5'
                  }}
                />
                <Bar dataKey="predicted" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="actual" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-md border border-zinc-800 bg-card-dark p-4 light:border-zinc-200 light:bg-white">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">资产构成</h2>
            <span className="text-xs text-zinc-500">Active</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={assetChart} dataKey="value" nameKey="name" innerRadius={54} outerRadius={92}>
                  {assetChart.map((_entry, index) => (
                    <Cell key={index} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#121214',
                    border: '1px solid #27272a',
                    borderRadius: 6,
                    color: '#f4f4f5'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-md border border-zinc-800 bg-card-dark light:border-zinc-200 light:bg-white">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 light:border-zinc-200">
          <h2 className="text-base font-semibold">到期 / 扣费预警</h2>
          <span className="text-xs text-zinc-500">30 days</span>
        </div>
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-zinc-800 text-[11px] uppercase text-zinc-500 light:border-zinc-200">
            <tr>
              <th className="px-4 py-3 font-medium">资产</th>
              <th className="px-4 py-3 font-medium">类型</th>
              <th className="px-4 py-3 text-right font-medium">金额</th>
              <th className="px-4 py-3 text-right font-medium">周期</th>
              <th className="px-4 py-3 text-right font-medium">日期</th>
              <th className="px-4 py-3 text-right font-medium">剩余</th>
              <th className="px-4 py-3 text-center font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {dueItems.map((item) => (
              <tr key={`${item.assetType}-${item.assetId}`} className="border-b border-zinc-900 light:border-zinc-100">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-zinc-400">{item.assetType}</td>
                <td className="px-4 py-3 text-right font-mono">{formatMoney(item.amountMinorUnits, item.currency)}</td>
                <td className="px-4 py-3 text-right font-mono text-zinc-400">{formatCycle(item.billingCycle)}</td>
                <td className="px-4 py-3 text-right font-mono text-zinc-400">{compactDate(item.dueDate)}</td>
                <td className={`px-4 py-3 text-right font-mono ${dueTone(item.daysLeft)}`}>{item.daysLeft}d</td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
            {dueItems.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-zinc-500" colSpan={7}>
                  30 天内没有到期项目
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function MoneyGroup({ values }: { values: Partial<Record<Currency, number>> }) {
  const entries = currencies.filter((currency) => values[currency]);
  if (entries.length === 0) return <span className="text-zinc-500">-</span>;
  return (
    <div className="space-y-1 text-sm">
      {entries.map((currency) => (
        <div key={currency} className="flex justify-between gap-4">
          <span className="text-zinc-500">{currency}</span>
          <span>{formatMoney(values[currency] ?? 0, currency)}</span>
        </div>
      ))}
    </div>
  );
}
