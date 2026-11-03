'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Mode = 'login' | 'register' | 'reset';
type ApiError = { error?: string };

function safeNext(): string {
  if (typeof window === 'undefined') return '/account/';
  const raw = new URLSearchParams(window.location.search).get('next');
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return '/account/';
  const url = new URL(raw, window.location.origin);
  return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : '/account/';
}

async function request(path: string, data: Record<string, unknown>): Promise<Response> {
  return fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function AuthForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [code, setCode] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resetComplete, setResetComplete] = useState(false);

  useEffect(() => {
    fetch('/api/auth/config')
      .then((response) => response.ok ? response.json() as Promise<{ registrationAvailable: boolean; passwordResetAvailable?: boolean }> : { registrationAvailable: false, passwordResetAvailable: false })
      .then((data) => setAvailable(mode === 'reset' ? data.passwordResetAvailable ?? false : data.registrationAvailable))
      .catch(() => setAvailable(false));
    if (mode === 'login' && new URLSearchParams(window.location.search).get('passwordChanged') === '1') setMessage('密码已更新，所有设备已退出。请使用新密码重新登录。');
  }, [mode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function sendCode() {
    if (busy || cooldown || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('请先填写有效的邮箱地址。'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await request('/api/auth/code', { email, purpose: mode === 'register' ? 'register' : 'reset' });
      if (!response.ok) throw new Error(((await response.json()) as ApiError).error || 'Could not send code.');
      setMessage('如果该邮箱符合条件，你将收到 8 位验证码，10 分钟内有效。请检查收件箱和垃圾邮件。');
      setCooldown(60);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send code.');
    } finally { setBusy(false); }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    if (mode !== 'login' && password !== confirmation) { setError('两次输入的密码不一致。'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const path = mode === 'login' ? '/api/auth/login' : mode === 'register' ? '/api/auth/register' : '/api/auth/reset';
      const payload = mode === 'login' ? { email, password } : mode === 'register' ? { email, password, displayName, code } : { email, password, code };
      const response = await request(path, payload);
      if (!response.ok) throw new Error(((await response.json()) as ApiError).error || 'Request failed.');
      if (mode === 'reset') { setMessage('密码已重置，原有登录已失效。请使用新密码登录。'); setPassword(''); setConfirmation(''); setCode(''); setResetComplete(true); }
      else window.location.assign(safeNext());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Request failed.');
    } finally { setBusy(false); }
  }

  const needsCode = mode !== 'login';
  return (
    <section className="auth-page shell">
      <div className="auth-panel">
        <p className="auth-eyebrow">Wayella account</p>
        <h1>{mode === 'register' ? '创建账号' : mode === 'reset' ? '找回密码' : '欢迎回来'}</h1>
        <p className="auth-intro">{mode === 'register' ? '验证邮箱，开始记录和分享你的旅行。' : mode === 'reset' ? '通过注册邮箱接收验证码，验证后设置新密码。' : '登录后继续创作、管理作品并查看互动。'}</p>
        {needsCode && available === false && <p className="auth-alert" role="status">{mode === 'reset' ? '邮件找回服务暂不可用，目前无法发送验证码。若你还记得密码，可先登录，在个人中心修改。' : '邮箱验证服务暂不可用，目前无法完成注册。已有账号可以正常登录。'}</p>}
        {resetComplete ? <div><p className="auth-success" role="status">{message}</p><Link className="story-primary" href="/login/?next=/account/">使用新密码登录</Link></div> : <form onSubmit={submit} className="auth-form">
          {mode === 'register' && <label>昵称<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="nickname" required minLength={2} maxLength={48} /></label>}
          <label>邮箱地址<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required maxLength={254} /></label>
          {needsCode && <div className="auth-code-row">
            <label>验证码<input inputMode="numeric" pattern="[0-9]{8}" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="one-time-code" required maxLength={8} /></label>
            <button type="button" className="auth-secondary" onClick={sendCode} disabled={busy || available !== true || !email || cooldown > 0}>{cooldown ? `${cooldown} 秒后重发` : '发送验证码'}</button>
          </div>}
          <label>{mode === 'reset' ? '新密码' : '密码'}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'login' ? 1 : 12} maxLength={128} /></label>
          {mode !== 'login' && <><p className="auth-hint">使用 12–128 个字符。</p><label>确认密码<input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required minLength={12} maxLength={128} /></label></>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-success" role="status">{message}</p>}
          <button type="submit" className="auth-submit" disabled={busy || (needsCode && available !== true)}>{busy ? '请稍候…' : mode === 'register' ? '注册账号' : mode === 'reset' ? '重置密码' : '登录'}</button>
        </form>}
        <div className="auth-links">
          {mode === 'login' ? <><Link href="/reset/">忘记密码？</Link><span>还没有账号？ <Link href="/register/">注册</Link></span></> : <span>已有账号？ <Link href="/login/">登录</Link></span>}
          <Link href="/">继续浏览</Link>
        </div>
      </div>
    </section>
  );
}
