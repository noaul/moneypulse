import { useState } from 'react';
import {
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  ReceiptText,
  Repeat2,
  Server,
  Settings,
  Smartphone,
  Sun,
  X
} from 'lucide-react';
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

  const logout = async () => {
    await api.post('/api/auth/logout');
    onLogout();
  };

  const navContent = (
    <nav className="space-y-1 p-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition',
                isActive
                  ? 'bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
              )
            }
          >
            <Icon size={16} />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:block">
        <div className="flex h-14 items-center border-b border-zinc-200 px-4 dark:border-zinc-800">
          <div className="font-mono text-sm font-semibold tracking-normal">MoneyPulse</div>
        </div>
        {navContent}
      </aside>

      {/* Mobile overlay nav */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button aria-label="关闭菜单" className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
              <div className="font-mono text-sm font-semibold">MoneyPulse</div>
              <button onClick={() => setMobileOpen(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                <X size={18} />
              </button>
            </div>
            {navContent}
          </aside>
        </div>
      )}

      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="flex items-center gap-3">
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="打开菜单"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-lg font-semibold">{current?.label ?? 'MoneyPulse'}</h1>
              <p className="hidden text-xs text-zinc-500 sm:block">单用户资产费用管理</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IconButton onClick={toggleTheme} title="切换主题">
              <Moon className="hidden dark:block" size={15} />
              <Sun className="block dark:hidden" size={15} />
            </IconButton>
            <div className="hidden border-l border-zinc-200 pl-3 text-right dark:border-zinc-800 sm:block">
              <div className="text-xs font-medium">{user.username}</div>
              <div className="text-[11px] text-zinc-500">{user.email}</div>
            </div>
            <IconButton onClick={logout} title="登出">
              <LogOut size={15} />
            </IconButton>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
