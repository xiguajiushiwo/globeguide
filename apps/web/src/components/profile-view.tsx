'use client';

import Link from 'next/link';
import { ArrowLeft, Ban, MessageCircle, UserPlus, UserRoundCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { blockUser, followUser, getProfile, reportSocialTarget, socialErrorMessage, unblockUser, unfollowUser, type Profile } from '@/lib/social-api';
import { getSession } from '@/lib/story-api';
import { StoriesFeed } from './stories-feed';

export function ProfileView({ id }: { id: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getProfile(id), getSession().catch(() => null)]).then(([next, viewer]) => { if (active) { setProfile(next); setViewerId(viewer?.id ?? null); } })
      .catch((error) => { if (active) setMessage(socialErrorMessage(error)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function relationship(action: 'follow' | 'unfollow' | 'block' | 'unblock') {
    if (!profile || busy) return;
    if (action === 'block' && !window.confirm(`Block ${profile.displayName}?`)) return;
    setBusy(true); setMessage('');
    try {
      if (action === 'follow') await followUser(profile.id);
      if (action === 'unfollow') await unfollowUser(profile.id);
      if (action === 'block') await blockUser(profile.id);
      if (action === 'unblock') await unblockUser(profile.id);
      setProfile({ ...profile, following: action === 'follow' ? true : action === 'unfollow' || action === 'block' ? false : profile.following, blocked: action === 'block' ? true : action === 'unblock' ? false : profile.blocked, counts: { ...profile.counts, followers: action === 'follow' ? profile.counts.followers + 1 : action === 'unfollow' ? Math.max(0, profile.counts.followers - 1) : profile.counts.followers } });
    } catch (error) { setMessage(socialErrorMessage(error)); }
    finally { setBusy(false); }
  }

  async function report() {
    if (!profile || !window.confirm('Report this profile for moderator review?')) return;
    const reason = window.prompt('Why should a moderator review this profile?');
    if (!reason) return;
    try { await reportSocialTarget('profile', profile.id, reason); setMessage('Report received.'); } catch (error) { setMessage(socialErrorMessage(error)); }
  }

  if (loading) return <div className="shell profile-page"><p className="story-status">Loading profile…</p></div>;
  if (!profile) return <div className="shell profile-page"><p className="story-notice" role="status">{message || 'This profile is not available.'}</p><Link className="story-back" href="/stories/"><ArrowLeft size={16} />Back to travel notes</Link></div>;
  const own = viewerId === profile.id;
  return <div className="shell profile-page">
    <Link className="story-back" href="/stories/"><ArrowLeft size={16} />Travel Notes</Link>
    <section className="profile-hero">
      <span className="profile-hero__avatar" aria-hidden="true">{profile.avatarInitial || profile.displayName.slice(0, 1)}</span>
      <div className="profile-hero__identity"><p className="stories-eyebrow">GlobeGuide traveler</p><h1>{profile.displayName}</h1><p>{profile.bio || 'Sharing places, planning ideas, and small travel moments.'}</p></div>
      {!own && <div className="profile-hero__actions">{profile.blocked ? <button className="story-secondary" type="button" disabled={busy} onClick={() => relationship('unblock')}><Ban size={16} />Unblock</button> : <><button className="story-primary" type="button" disabled={busy || !viewerId} onClick={() => relationship(profile.following ? 'unfollow' : 'follow')}>{profile.following ? <UserRoundCheck size={16} /> : <UserPlus size={16} />}{profile.following ? 'Following' : 'Follow'}</button>{viewerId && <Link className="story-secondary" href={`/inbox/?to=${encodeURIComponent(profile.id)}`}><MessageCircle size={16} />Message</Link>}<button className="story-tertiary" type="button" onClick={report}>Report</button></>}</div>}
    </section>
    <dl className="profile-stats"><div><dt>Notes</dt><dd>{profile.counts.posts}</dd></div><div><dt>Followers</dt><dd>{profile.counts.followers}</dd></div><div><dt>Following</dt><dd>{profile.counts.following}</dd></div></dl>
    {message && <p className="story-notice" role="status">{message}</p>}
    {!profile.blocked && <section className="profile-posts"><div className="notes-section-heading"><div><p className="stories-eyebrow">Published notes</p><h2>From {profile.displayName}</h2></div></div><StoriesFeed authorId={profile.id} /></section>}
  </div>;
}
