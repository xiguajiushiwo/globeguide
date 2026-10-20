'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type User = { id: string; email: string; displayName: string | null; role: 'member' | 'admin' };

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((response) => response.ok ? response.json() as Promise<{ user: User | null }> : { user: null })
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoaded(true));
  }, []);

  return <section className="content-page shell account-page">
    <h1>Your account</h1>
    {!loaded ? <p>Loading account...</p> : user ? <>
      <p className="page-intro">Signed in as {user.displayName || user.email}</p>
      <dl className="account-details"><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Account</dt><dd>{user.role === 'admin' ? 'Administrator' : 'Traveler'}</dd></div></dl>
      <div className="account-actions"><Link href="/stories/write/">Write a story</Link>{user.role === 'admin' && <Link href="/stories/moderation/">Moderation queue</Link>}</div>
      <p className="account-local-note">Saved places and trips still live only in this browser. Signing in does not sync them to your account.</p>
    </> : <><p className="page-intro">You can explore GlobeGuide without an account.</p><Link className="trip-link" href="/login/">Log in</Link></>}
  </section>;
}
