import { FormEvent, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { api, ApiError } from './api';
import { Button, Field, inputClass } from './ui';
import type { User } from './types';

export function LoginPage({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const response = await api.post<{ user: User }>('/api/auth/login', { username, password });
      onAuthenticated(response.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '登录失败');
    }
  };

  return (
    <AuthFrame title="登录 MoneyPulse">
      <form onSubmit={submit} className="space-y-4">
        <Field label="用户名">
          <input className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} />
        </Field>
        <Field label="密码">
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        <Button className="w-full" type="submit">
          登录
        </Button>
      </form>
    </AuthFrame>
  );
}

export function SetupPage({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [form, setForm] = useState({
    username: 'owner',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const response = await api.post<{ user: User }>('/api/auth/setup', form);
      onAuthenticated(response.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '初始化失败');
    }
  };

  return (
    <AuthFrame title="初始化 MoneyPulse">
      <form onSubmit={submit} className="space-y-4">
        <Field label="用户名">
          <input
            className={inputClass}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </Field>
        <Field label="提醒邮箱">
          <input
            className={inputClass}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="密码">
          <input
            className={inputClass}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        <Button className="w-full" type="submit">
          创建单用户账户
        </Button>
      </form>
    </AuthFrame>
  );
}

function AuthFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background-dark px-4 py-10 text-zinc-100 light:bg-background-light light:text-zinc-950">
      <div className="mx-auto mt-20 w-full max-w-sm rounded-md border border-zinc-800 bg-card-dark p-6 light:border-zinc-200 light:bg-white">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 light:border-zinc-200 light:bg-zinc-100">
            <LockKeyhole size={17} />
          </div>
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-xs text-zinc-500">高密度资产费用管理</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
