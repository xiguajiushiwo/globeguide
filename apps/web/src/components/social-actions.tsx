'use client';

import Link from 'next/link';
import { Bookmark, Check, Copy, Heart, MessageCircle, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getInteractionState, socialErrorMessage, toggleBookmark, toggleLike, recordShare, type SocialState } from '@/lib/social-api';

type Props = { postId: string; initial: SocialState; authenticated: boolean };

export function SocialActions({ postId, initial, authenticated }: Props) {
  const [state, setState] = useState<SocialState>(initial);
  const [busy, setBusy] = useState<'like' | 'bookmark' | 'share' | null>(null);
  const [message, setMessage] = useState('');
  const loginHref = `/login/?next=${encodeURIComponent(typeof window === 'undefined' ? `/stories/post/?id=${postId}` : window.location.pathname + window.location.search)}`;
  useEffect(() => { if (!authenticated) return; let active = true; getInteractionState(postId).then((next) => { if (active) setState((current) => ({ ...current, ...next, counts: { ...current.counts, ...next.counts } })); }).catch(() => {}); return () => { active = false; }; }, [postId, authenticated]);

  async function toggle(kind: 'like' | 'bookmark') {
    if (!authenticated) return;
    const active = kind === 'like' ? state.liked : state.bookmarked;
    const counts = { ...state.counts, [kind === 'like' ? 'likes' : 'bookmarks']: Math.max(0, state.counts[kind === 'like' ? 'likes' : 'bookmarks'] + (active ? -1 : 1)) };
    setState({ ...state, counts, [kind === 'like' ? 'liked' : 'bookmarked']: !active });
    setBusy(kind); setMessage('');
    try {
      const next = kind === 'like' ? await toggleLike(postId, !active) : await toggleBookmark(postId, !active);
      setState((current) => ({ ...current, ...next, counts: { ...current.counts, ...next.counts } }));
    } catch (error) {
      setState((current) => ({ ...current, [kind === 'like' ? 'liked' : 'bookmarked']: active, counts: state.counts }));
      setMessage(socialErrorMessage(error));
    } finally { setBusy(null); }
  }

  async function share() {
    if (!authenticated) return;
    const url = typeof window === 'undefined' ? `/stories/post/?id=${encodeURIComponent(postId)}` : window.location.href;
    setBusy('share'); setMessage('');
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(url);
      const next = await recordShare(postId);
      setState((current) => ({ ...current, ...next, counts: { ...current.counts, ...next.counts, shares: Math.max(current.counts.shares + 1, next.counts.shares) } }));
      setMessage('Link copied.');
    } catch (error) { setMessage(socialErrorMessage(error)); }
    finally { setBusy(null); }
  }

  const content = <div className="social-actions" aria-label="Travel note actions">
    <button type="button" className={state.liked ? 'is-active' : ''} disabled={busy !== null} onClick={() => toggle('like')} aria-label={state.liked ? 'Unlike note' : 'Like note'} title={state.liked ? 'Unlike' : 'Like'}><Heart size={17} fill={state.liked ? 'currentColor' : 'none'} /> <span>{state.counts.likes}</span></button>
    <button type="button" className={state.bookmarked ? 'is-active' : ''} disabled={busy !== null} onClick={() => toggle('bookmark')} aria-label={state.bookmarked ? 'Remove bookmark' : 'Bookmark note'} title={state.bookmarked ? 'Remove bookmark' : 'Bookmark'}><Bookmark size={17} fill={state.bookmarked ? 'currentColor' : 'none'} /> <span>{state.counts.bookmarks}</span></button>
    <a className="social-actions__comments" href="#comments" aria-label={`${state.counts.comments ?? 0} comments`}><MessageCircle size={17} /> <span>{state.counts.comments ?? 0}</span></a>
    <button type="button" disabled={busy !== null} onClick={share} aria-label="Copy note link" title="Copy note link"><Share2 size={17} /> <span>{state.counts.shares}</span></button>
  </div>;

  return <>
    {authenticated ? content : <div className="social-actions social-actions--guest">
      <Link href={loginHref} aria-label="Sign in to interact"><Heart size={17} /> <span>Sign in to interact</span></Link>
      <a href="#comments" aria-label={`${state.counts.comments ?? 0} comments`}><MessageCircle size={17} /> <span>{state.counts.comments ?? 0}</span></a>
      <Link href={loginHref} aria-label="Sign in to share"><Copy size={17} /></Link>
    </div>}
    {message && <p className="social-actions__message" role="status">{message}{message === 'Link copied.' && <Check size={14} aria-hidden="true" />}</p>}
  </>;
}
