'use client';

import Link from 'next/link';
import { Bell, Bookmark, Compass, Inbox, Menu, Radio, Route, Store, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { copy } from '@/lib/copy';
import { notificationCount } from '@/lib/account-api';

type User = { id: string; email: string; displayName: string | null; role: 'member' | 'admin' };

export function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 10);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => {
    let active = true;
    const refresh = () => fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<{ user: User | null }> : { user: null })
      .then((data) => { if (active) setUser(data.user); })
      .catch(() => {});
    void refresh();
    window.addEventListener('globeguide:account', refresh);
    return () => { active = false; window.removeEventListener('globeguide:account', refresh); };
  }, []);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    let active = true;
    const refresh = () => { if (document.visibilityState === 'visible') void notificationCount().then((data) => { if (active) setUnread(data.unreadCount); }).catch(() => {}); };
    refresh(); const timer = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh); window.addEventListener('globeguide:notifications', refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('globeguide:notifications', refresh); };
  }, [user?.id]);

  return (
    <header className={`site-header${scrolled ? ' site-header--scrolled' : ''}`}>
      <div className="shell site-header__inner">
        <Link className="brand" href="/" aria-label={`${copy.brand} home`} onClick={() => setOpen(false)}>
          <span className="brand__mark"><Compass size={21} strokeWidth={2.4} aria-hidden="true" /></span>
          <span>{copy.brand}</span>
        </Link>
        {user && <div className="header-compact-account"><Link href="/account/" aria-label="个人中心" onClick={() => setOpen(false)}><UserRound size={20} /></Link><Link href="/notifications/" aria-label={`互动通知${unread ? `，${unread} 条未读` : ''}`} onClick={() => setOpen(false)}><Bell size={20} />{unread > 0 && <b className="notification-badge">{unread > 99 ? '99+' : unread}</b>}</Link></div>}
        <button className="nav-menu-button" type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div className={`header-links${open ? ' header-links--open' : ''}`}>
          <nav aria-label="Main navigation" className="main-nav">
            <Link href="/#destinations" onClick={() => setOpen(false)}>{copy.explore}</Link>
            <Link href="/map/" onClick={() => setOpen(false)}>Map</Link>
            <Link href="/guides/" onClick={() => setOpen(false)}>旅行攻略</Link>
            <Link href="/stories/" onClick={() => setOpen(false)}>Travel Notes</Link>
            <Link href="/stories/write/" onClick={() => setOpen(false)}><Radio size={17} aria-hidden="true" /><span>创作</span></Link>
            <Link href="/live/" onClick={() => setOpen(false)}><Radio size={17} aria-hidden="true" /><span>直播</span></Link>
            <Link href="/market/" onClick={() => setOpen(false)}><Store size={17} aria-hidden="true" /><span>商城</span></Link>
            <Link href="/saved/" aria-label={copy.saved} onClick={() => setOpen(false)}><Bookmark size={17} strokeWidth={2} aria-hidden="true" /><span>{copy.saved}</span></Link>
            <Link href="/trips/" aria-label={copy.trips} onClick={() => setOpen(false)}><Route size={17} strokeWidth={2} aria-hidden="true" /><span>{copy.trips}</span></Link>
          </nav>
          <div className="header-account">
            {user ? <>
              <Link href="/account/" title={user.displayName || '个人中心'} onClick={() => setOpen(false)}><UserRound size={17} aria-hidden="true" /><span>个人中心</span></Link>
              <Link href="/notifications/" aria-label={`互动通知${unread ? `，${unread} 条未读` : ''}`} onClick={() => setOpen(false)}><Bell size={17} aria-hidden="true" />{unread > 0 && <b className="notification-badge">{unread > 99 ? '99+' : unread}</b>}</Link>
              <Link href="/inbox/" onClick={() => setOpen(false)}><Inbox size={17} aria-hidden="true" /><span>Inbox</span></Link>
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
