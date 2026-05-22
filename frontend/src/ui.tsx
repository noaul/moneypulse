import clsx from 'clsx';
import { X } from 'lucide-react';
import type { AssetStatus } from './types';
import { formatStatus } from './format';

export function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  return (
    <button
      className={clsx(
        'inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition focus:outline-none focus:ring-1 focus:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'border-brand bg-brand text-white hover:bg-brand-hover',
        variant === 'secondary' &&
          'border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800',
        variant === 'ghost' && 'border-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100',
        variant === 'danger' && 'border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-300',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        'inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[11px] font-medium uppercase tracking-normal text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-brand focus:ring-1 focus:ring-brand/30 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600';

export function StatusBadge({ status }: { status: AssetStatus }) {
  const classes: Record<AssetStatus, string> = {
    active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    paused: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    expired: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
    cancelled: 'border-zinc-300 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400',
    archived: 'border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400'
  };
  return (
    <span className={clsx('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium', classes[status])}>
      {formatStatus(status)}
    </span>
  );
}

export function Drawer({
  title,
  open,
  onClose,
  children,
  footer
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="关闭" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <header className="flex h-14 items-center justify-between border-b border-zinc-200 px-5 dark:border-zinc-800">
          <h2 className="text-base font-semibold">{title}</h2>
          <IconButton onClick={onClose} title="关闭">
            <X size={16} />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        <footer className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
          {footer}
        </footer>
      </aside>
    </div>
  );
}

export function MetricCard({ label, value, detail }: { label: string; value: React.ReactNode; detail?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-[11px] font-medium uppercase text-zinc-500">{label}</div>
      <div className="mt-3 font-mono text-xl font-medium">{value}</div>
      {detail ? <div className="mt-2 text-xs text-zinc-500">{detail}</div> : null}
    </section>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800', className)} />;
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="space-y-0">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-zinc-100 px-4 py-3 last:border-0 dark:border-zinc-800">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  render: (item: T) => React.ReactNode;
}

export function DataTable<T extends { id: number | string }>({
  columns,
  data,
  emptyText = '暂无数据'
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyText?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
        <thead className="border-b border-zinc-200 text-[11px] uppercase text-zinc-500 dark:border-zinc-800">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx('px-4 py-3 font-medium', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={clsx('px-4 py-3', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}
                >
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td className="px-4 py-12 text-center text-sm text-zinc-500" colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
