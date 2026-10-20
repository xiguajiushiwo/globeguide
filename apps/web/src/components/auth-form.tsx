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

  useEffect(() => {
    fetch('/api/auth/config')
      .then((response) => response.ok ? response.json() as Promise<{ registrationAvailable: boolean }> : { registrationAvailable: false })
      .then((data) => setAvailable(data.registrationAvailable))
      .catch(() => setAvailable(false));
  }, []);

  async function sendCode() {
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await request('/api/auth/code', { email, purpose: mode === 'register' ? 'register' : 'reset' });
      if (!response.ok) throw new Error(((await response.json()) as ApiError).error || 'Could not send code.');
      setMessage('If this address is eligible, a code has been sent. Check your inbox and spam folder.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send code.');
    } finally { setBusy(false); }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const path = mode === 'login' ? '/api/auth/login' : mode === 'register' ? '/api/auth/register' : '/api/auth/reset';
      const payload = mode === 'login' ? { email, password } : mode === 'register' ? { email, password, displayName, code } : { email, password, code };
      const response = await request(path, payload);
      if (!response.ok) throw new Error(((await response.json()) as ApiError).error || 'Request failed.');
      if (mode === 'reset') { setMessage('Password changed. You can now log in.'); setPassword(''); setCode(''); }
      else window.location.assign(safeNext());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Request failed.');
    } finally { setBusy(false); }
  }

  const needsCode = mode !== 'login';
  return (
    <section className="auth-page shell">
      <div className="auth-panel">
        <p className="auth-eyebrow">GlobeGuide account</p>
        <h1>{mode === 'register' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Welcome back'}</h1>
        <p className="auth-intro">{mode === 'register' ? 'Verify your email to join the travel community.' : mode === 'reset' ? 'We will send a verification code to your email.' : 'Log in to write and manage your travel stories.'}</p>
        {needsCode && available === false && <p className="auth-alert" role="status">Email verification is not available yet. You can keep exploring GlobeGuide without an account.</p>}
        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && <label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="nickname" required minLength={2} maxLength={48} /></label>}
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required maxLength={254} /></label>
          {needsCode && <div className="auth-code-row">
            <label>Verification code<input inputMode="numeric" pattern="[0-9]{8}" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="one-time-code" required maxLength={8} /></label>
            <button type="button" className="auth-secondary" onClick={sendCode} disabled={busy || available !== true || !email}>Send code</button>
          </div>}
          <label>{mode === 'reset' ? 'New password' : 'Password'}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'login' ? 1 : 12} maxLength={128} /></label>
          {mode !== 'login' && <p className="auth-hint">Use at least 12 characters.</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-success" role="status">{message}</p>}
          <button type="submit" className="auth-submit" disabled={busy || (needsCode && available !== true)}>{busy ? 'Please wait...' : mode === 'register' ? 'Create account' : mode === 'reset' ? 'Change password' : 'Log in'}</button>
        </form>
        <div className="auth-links">
          {mode === 'login' ? <><Link href="/reset/">Forgot password?</Link><span>New here? <Link href="/register/">Sign up</Link></span></> : <span>Already have an account? <Link href="/login/">Log in</Link></span>}
          <Link href="/">Continue exploring</Link>
        </div>
      </div>
    </section>
  );
}
