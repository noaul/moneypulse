import { useState } from 'react';
import { Globe2, LayoutDashboard, LogOut, Menu, Moon, ReceiptText, Repeat2, Server, Settings, Smartphone, Sun, X } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import type { User } from './types';
import { api } from './api';
import { IconButton } from './ui';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/phones', label: '电话卡', icon: Smartphone },
  { to: '/vps', label: 'VPS', icon: Server },
  { to: '/domains', label: '域名', icon: Globe2 },
  { to: '/subscriptions', label: '订阅', icon: Repeat2 },
  { to: '/expenses', label: '费用流水', icon: ReceiptText },
  { to: '/settings', label: '设置', icon: Settings }
];

export function Layout({ user, onLogout }: { user: User; onLogout: () => void }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = navItems.find((item) => location.pathname.startsWith(item.to));

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', !isDark);
    localStorage.setItem('moneypulse-theme', isDark ? 'light' : 'dark');
  };

  const logout = async () => { await api.post('/api/auth/logout'); onLogout(); };

  const navContent = (
    <nav className="space-y-1 px-4 py-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
            className={({ isActive }) => clsx(
              'flex h-10 items-center gap-3 rounded-xl px-4 text-sm font-medium transition',
              isActive
                ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            )}>
            <Icon size={18} />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:block">
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white text-xs font-bold">M</div>
          <span className="text-base font-bold tracking-tight">MoneyPulse</span>
        </div>
        {navContent}
      </aside>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button aria-label="关闭" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white dark:bg-slate-950 shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white text-xs font-bold">M</div>
                <span className="text-base font-bold">MoneyPulse</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            {navContent}
          </aside>
        </div>
      )}

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex items-center gap-4">
            <button className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden" onClick={() => setMobileOpen(true)} aria-label="菜单">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{current?.label ?? 'MoneyPulse'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <IconButton onClick={toggleTheme} title="切换主题">
              <Moon className="hidden dark:block" size={16} />
              <Sun className="block dark:hidden" size={16} />
            </IconButton>
            <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 dark:border-slate-700 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                {user.username[0].toUpperCase()}
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{user.username}</div>
                <div className="text-[11px] text-slate-500">{user.email}</div>
              </div>
            </div>
            <IconButton onClick={logout} title="登出"><LogOut size={16} /></IconButton>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
