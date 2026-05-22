import {
  Globe2,
  LayoutDashboard,
  LogOut,
  Moon,
  ReceiptText,
  Repeat2,
  Server,
  Settings,
  Smartphone,
  Sun
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
  const current = navItems.find((item) => location.pathname.startsWith(item.to));

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', !isDark);
    document.documentElement.classList.toggle('light', isDark);
    localStorage.setItem('moneypulse-theme', isDark ? 'light' : 'dark');
  };

  const logout = async () => {
    await api.post('/api/auth/logout');
    onLogout();
  };

  return (
    <div className="min-h-screen bg-background-dark text-zinc-100 light:bg-background-light light:text-zinc-950">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-zinc-800 bg-zinc-950 light:border-zinc-200 light:bg-white md:block">
        <div className="flex h-14 items-center border-b border-zinc-800 px-4 light:border-zinc-200">
          <div className="font-mono text-sm font-semibold tracking-normal">MoneyPulse</div>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100 light:hover:bg-zinc-100',
                    isActive && 'bg-zinc-900 text-zinc-100 light:bg-zinc-100 light:text-zinc-950'
                  )
                }
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-800 bg-background-dark/90 px-4 backdrop-blur light:border-zinc-200 light:bg-background-light/90">
          <div>
            <h1 className="text-lg font-semibold">{current?.label ?? 'MoneyPulse'}</h1>
            <p className="hidden text-xs text-zinc-500 sm:block">单用户资产费用管理</p>
          </div>
          <div className="flex items-center gap-2">
            <IconButton onClick={toggleTheme} title="切换主题">
              <Moon className="hidden dark:block" size={15} />
              <Sun className="dark:hidden" size={15} />
            </IconButton>
            <div className="hidden border-l border-zinc-800 pl-3 text-right light:border-zinc-200 sm:block">
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
