'use client';

import Link from 'next/link';
import { Bookmark, Compass, Inbox, LogOut, Menu, Route, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { copy } from '@/lib/copy';

type User = { id: string; email: string; displayName: string | null; role: 'member' | 'admin' };

export function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 10);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((response) => response.ok ? response.json() as Promise<{ user: User | null }> : { user: null })
      .then((data) => { if (active) setUser(data.user); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  async function logout() {
    const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    if (response.ok) {
      setUser(null);
      window.location.assign('/');
    }
  }

  return (
    <header className={`site-header${scrolled ? ' site-header--scrolled' : ''}`}>
      <div className="shell site-header__inner">
        <Link className="brand" href="/" aria-label={`${copy.brand} home`} onClick={() => setOpen(false)}>
          <span className="brand__mark"><Compass size={21} strokeWidth={2.4} aria-hidden="true" /></span>
          <span>{copy.brand}</span>
        </Link>
        <button className="nav-menu-button" type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div className={`header-links${open ? ' header-links--open' : ''}`}>
          <nav aria-label="Main navigation" className="main-nav">
            <Link href="/#destinations" onClick={() => setOpen(false)}>{copy.explore}</Link>
            <Link href="/map/" onClick={() => setOpen(false)}>Map</Link>
            <Link href="/stories/" onClick={() => setOpen(false)}>Travel Notes</Link>
            <Link href="/saved/" aria-label={copy.saved} onClick={() => setOpen(false)}><Bookmark size={17} strokeWidth={2} aria-hidden="true" /><span>{copy.saved}</span></Link>
            <Link href="/trips/" aria-label={copy.trips} onClick={() => setOpen(false)}><Route size={17} strokeWidth={2} aria-hidden="true" /><span>{copy.trips}</span></Link>
          </nav>
          <div className="header-account">
            {user ? <>
              <Link href="/account/" onClick={() => setOpen(false)}><UserRound size={17} aria-hidden="true" /><span>{user.displayName || 'Account'}</span></Link>
              <Link href="/inbox/" onClick={() => setOpen(false)}><Inbox size={17} aria-hidden="true" /><span>Inbox</span></Link>
              <button type="button" onClick={logout} title="Log out"><LogOut size={17} aria-hidden="true" /><span>Log out</span></button>
            </> : <>
              <Link href="/login/" onClick={() => setOpen(false)}>Log in</Link>
              <Link className="header-signup" href="/register/" onClick={() => setOpen(false)}>Sign up</Link>
            </>}
          </div>
        </div>
      </div>
    </header>
  );
}
