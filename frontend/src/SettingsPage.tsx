import { FormEvent, useEffect, useState } from 'react';
import { Download, Mail, Play, Save } from 'lucide-react';
import type { SettingsValue } from './types';
import { api, ApiError } from './api';
import { Button, Field, inputClass } from './ui';

const defaultSettings: SettingsValue = { reminderDays: [30, 14, 7, 3, 1, 0], reminderEnabled: true, defaultCurrency: 'CNY', timezone: 'Asia/Shanghai', smtpHost: '', smtpPort: 587, smtpUser: '', smtpFrom: '', smtpTo: '' };

export function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');

  useEffect(() => { api.get<{ settings: SettingsValue }>('/api/settings').then((r) => setSettings(r.settings)); }, []);

  const saveSettings = async (e: FormEvent) => { e.preventDefault(); setMessage(''); const r = await api.put<{ settings: SettingsValue }>('/api/settings', settings); setSettings(r.settings); setMessage('设置已保存'); };
  const testEmail = async () => { setMessage(''); try { await api.post('/api/settings/test-email'); setMessage('测试邮件已发送'); } catch (err) { setMessage(err instanceof ApiError ? err.message : '测试邮件失败'); } };
  const runReminder = async () => { const r = await api.post<{ sent: boolean; items: unknown[] }>('/api/reminders/run-now'); setMessage(r.sent ? `已发送提醒：${r.items.length} 项` : '没有需要发送的新提醒'); };
  const changePassword = async (e: FormEvent) => { e.preventDefault(); await api.put('/api/auth/password', passwordForm); setPasswordForm({ currentPassword: '', newPassword: '' }); setMessage('密码已修改'); };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">设置</h2>
        <p className="mt-1 text-sm text-slate-500">管理邮件提醒、账户安全等配置。</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="card">
          <h3 className="mb-5 text-base font-semibold">提醒与邮件</h3>
          <form onSubmit={saveSettings} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="提醒天数（逗号分隔）"><input className={inputClass} value={settings.reminderDays.join(',')} onChange={(e) => setSettings({ ...settings, reminderDays: e.target.value.split(',').map((v) => Number(v.trim())).filter((v) => Number.isFinite(v)) })} /></Field>
              <Field label="提醒开关"><select className={inputClass} value={String(settings.reminderEnabled)} onChange={(e) => setSettings({ ...settings, reminderEnabled: e.target.value === 'true' })}><option value="true">Enabled</option><option value="false">Disabled</option></select></Field>
              <Field label="默认币种"><select className={inputClass} value={settings.defaultCurrency} onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value as SettingsValue['defaultCurrency'] })}><option>CNY</option><option>USD</option><option>GBP</option><option>EUR</option></select></Field>
              <Field label="时区"><input className={inputClass} value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} /></Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="SMTP Host"><input className={inputClass} value={settings.smtpHost} onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })} /></Field>
              <Field label="SMTP Port"><input className={inputClass} type="number" value={settings.smtpPort} onChange={(e) => setSettings({ ...settings, smtpPort: Number(e.target.value) })} /></Field>
              <Field label="SMTP User"><input className={inputClass} value={settings.smtpUser} onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })} /></Field>
              <Field label="From"><input className={inputClass} value={settings.smtpFrom} onChange={(e) => setSettings({ ...settings, smtpFrom: e.target.value })} /></Field>
              <Field label="To"><input className={inputClass} value={settings.smtpTo} onChange={(e) => setSettings({ ...settings, smtpTo: e.target.value })} /></Field>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit"><Save size={16} />保存</Button>
              <Button type="button" variant="secondary" onClick={testEmail}><Mail size={16} />测试邮件</Button>
              <Button type="button" variant="secondary" onClick={runReminder}><Play size={16} />手动扫描</Button>
              <a className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" href="/api/export/json">
                <Download size={16} />导出 JSON
              </a>
            </div>
            {message && <p className="mt-2 rounded-lg bg-success-50 px-3 py-2 text-sm text-success-600 dark:bg-success-500/10 dark:text-success-400">{message}</p>}
          </form>
        </div>

        <div className="card h-fit">
          <h3 className="mb-5 text-base font-semibold">账户安全</h3>
          <form onSubmit={changePassword} className="space-y-5">
            <Field label="当前密码"><input className={inputClass} type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} /></Field>
            <Field label="新密码"><input className={inputClass} type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} /></Field>
            <Button type="submit">修改密码</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
