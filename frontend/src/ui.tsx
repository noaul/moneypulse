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
          'border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 light:border-zinc-200 light:bg-white light:text-zinc-950',
        variant === 'ghost' && 'border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100',
        variant === 'danger' && 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20',
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
        'inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 light:border-zinc-200 light:hover:bg-zinc-100',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[11px] font-medium uppercase tracking-normal text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-brand focus:ring-1 focus:ring-brand/30 light:border-zinc-200 light:bg-white light:text-zinc-950';

export function StatusBadge({ status }: { status: AssetStatus }) {
  const classes: Record<AssetStatus, string> = {
    active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    paused: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
    expired: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
    cancelled: 'border-zinc-700 bg-zinc-800/50 text-zinc-400',
    archived: 'border-violet-500/20 bg-violet-500/10 text-violet-400'
  };
  return (
    <span
      className={clsx(
        'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium',
        classes[status]
      )}
    >
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
      <button
        aria-label="关闭"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-card-dark shadow-none light:border-zinc-200 light:bg-white">
        <header className="flex h-14 items-center justify-between border-b border-zinc-800 px-5 light:border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-100 light:text-zinc-950">{title}</h2>
          <IconButton onClick={onClose} title="关闭">
            <X size={16} />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        <footer className="flex justify-end gap-2 border-t border-zinc-800 px-5 py-4 light:border-zinc-200">
          {footer}
        </footer>
      </aside>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-zinc-800 bg-card-dark p-4 light:border-zinc-200 light:bg-white">
      <div className="text-[11px] font-medium uppercase text-zinc-500">{label}</div>
      <div className="mt-3 font-mono text-xl font-medium text-zinc-100 light:text-zinc-950">{value}</div>
      {detail ? <div className="mt-2 text-xs text-zinc-500">{detail}</div> : null}
    </section>
  );
}
