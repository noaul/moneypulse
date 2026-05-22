import clsx from 'clsx';
import { X } from 'lucide-react';
import type { AssetStatus } from './types';
import { formatStatus } from './format';

// --- Button ---
export function Button({
  children, variant = 'primary', size = 'md', className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50',
        size === 'md' && 'h-10 px-5 text-sm',
        size === 'sm' && 'h-8 px-3 text-xs',
        variant === 'primary' && 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30',
        variant === 'secondary' && 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
        variant === 'ghost' && 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
        variant === 'danger' && 'bg-danger-50 text-danger-600 hover:bg-danger-100 dark:bg-danger-500/10 dark:text-danger-400',
        className
      )}
      {...props}
    >{children}</button>
  );
}

// --- IconButton ---
export function IconButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
        className
      )}
      {...props}
    >{children}</button>
  );
}

// --- Field ---
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  );
}

// --- Input ---
export const inputClass =
  'h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-brand-500/20';

// --- Status Badge ---
export function StatusBadge({ status }: { status: AssetStatus }) {
  const map: Record<AssetStatus, string> = {
    active: 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400',
    paused: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400',
    expired: 'bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-400',
    cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    archived: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
  };
  return <span className={clsx('inline-flex rounded-lg px-2.5 py-1 text-[11px] font-semibold', map[status])}>{formatStatus(status)}</span>;
}

// --- Metric Card ---
export function MetricCard({ icon, label, value, detail, color = 'brand' }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; detail?: React.ReactNode;
  color?: 'brand' | 'success' | 'warning' | 'danger';
}) {
  const iconBg: Record<string, string> = {
    brand: 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400',
    success: 'bg-success-100 text-success-600 dark:bg-success-500/20 dark:text-success-400',
    warning: 'bg-warning-100 text-warning-600 dark:bg-warning-500/20 dark:text-warning-400',
    danger: 'bg-danger-100 text-danger-600 dark:bg-danger-500/20 dark:text-danger-400'
  };
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className={clsx('flex h-11 w-11 items-center justify-center rounded-xl', iconBg[color])}>{icon}</div>
      </div>
      <div className="mt-4">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 font-mono text-2xl font-bold tracking-tight">{value}</p>
        {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
      </div>
    </div>
  );
}

// --- Drawer ---
export function Drawer({ title, open, onClose, children, footer }: {
  title: string; open: boolean; onClose: () => void; children: React.ReactNode; footer: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="关闭" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-slate-900">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <h2 className="text-lg font-semibold">{title}</h2>
          <IconButton onClick={onClose} title="关闭"><X size={16} /></IconButton>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        <footer className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">{footer}</footer>
      </aside>
    </div>
  );
}

// --- Skeleton ---
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800', className)} />;
}

// --- DataTable ---
export interface DataTableColumn<T> {
  key: string; header: string; align?: 'left' | 'right' | 'center'; render: (item: T) => React.ReactNode;
}

export function DataTable<T extends { id: number | string }>({ columns, data, emptyText = '暂无数据' }: {
  columns: DataTableColumn<T>[]; data: T[]; emptyText?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            {columns.map((col) => (
              <th key={col.key} className={clsx('px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="border-b border-slate-50 transition hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/30">
              {columns.map((col) => (
                <td key={col.key} className={clsx('px-5 py-4', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}>
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr><td className="px-5 py-16 text-center text-slate-400" colSpan={columns.length}>{emptyText}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// --- Asset Card (for card grid view) ---
export function AssetCard({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={clsx('card-hover cursor-pointer', className)}>
      {children}
    </div>
  );
}

// --- Progress Bar ---
export function ProgressBar({ value, max, color = 'brand' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-500', success: 'bg-success-500', warning: 'bg-warning-500', danger: 'bg-danger-500'
  };
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
      <div className={clsx('h-2 rounded-full transition-all', colorMap[color] ?? 'bg-brand-500')} style={{ width: `${pct}%` }} />
    </div>
  );
}
