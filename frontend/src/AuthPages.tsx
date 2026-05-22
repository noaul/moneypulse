import { FormEvent, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { api, ApiError } from './api';
import { Button, Field, inputClass } from './ui';
import type { User } from './types';

export function LoginPage({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    try { const r = await api.post<{ user: User }>('/api/auth/login', { username, password }); onAuthenticated(r.user); }
    catch (err) { setError(err instanceof ApiError ? err.message : '登录失败'); }
  };

  return (
    <AuthFrame title="欢迎回来" subtitle="登录你的 MoneyPulse 账户">
      <form onSubmit={submit} className="space-y-5">
        <Field label="用户名"><input className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} /></Field>
        <Field label="密码"><input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {error && <p className="text-sm text-danger-500">{error}</p>}
        <Button className="w-full" type="submit">登录</Button>
      </form>
    </AuthFrame>
  );
}

export function SetupPage({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [form, setForm] = useState({ username: 'owner', email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    try { const r = await api.post<{ user: User }>('/api/auth/setup', form); onAuthenticated(r.user); }
    catch (err) { setError(err instanceof ApiError ? err.message : '初始化失败'); }
  };

  return (
    <AuthFrame title="初始化设置" subtitle="创建你的管理员账户">
      <form onSubmit={submit} className="space-y-5">
        <Field label="用户名"><input className={inputClass} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
        <Field label="提醒邮箱"><input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="密码"><input className={inputClass} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        {error && <p className="text-sm text-danger-500">{error}</p>}
        <Button className="w-full" type="submit">创建账户</Button>
      </form>
    </AuthFrame>
  );
}

function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/30">
            <LockKeyhole size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="card">{children}</div>
      </div>
    </div>
  );
}
