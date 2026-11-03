'use client';

import Link from 'next/link';
import { ArrowLeft, Ban, MessageCircle, UserPlus, UserRoundCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { blockUser, followUser, getProfile, reportSocialTarget, socialErrorMessage, unblockUser, unfollowUser, type Profile } from '@/lib/social-api';
import { getSession } from '@/lib/story-api';
import { profileHref, profileListText } from '@/lib/account-api';
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
    if (action === 'block' && !window.confirm(`拉黑 ${profile.displayName}？双方将无法关注、评论互动或发送私信，可在个人中心解除。`)) return;
    setBusy(true); setMessage('');
    try {
      if (action === 'follow') await followUser(profile.id);
      if (action === 'unfollow') await unfollowUser(profile.id);
      if (action === 'block') await blockUser(profile.id);
      if (action === 'unblock') await unblockUser(profile.id);
      if (action === 'block') {
        setProfile({ ...profile, following: false, blocked: true });
        setMessage('已拉黑。你可以在个人中心的黑名单中管理。');
      } else setProfile(await getProfile(profile.id));
      window.dispatchEvent(new Event('globeguide:notifications'));
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
  if (!profile) return <div className="shell profile-page"><p className="story-notice" role="status">{message || 'This profile is not available.'}</p><Link className="story-back" href="/stories/"><ArrowLeft size={16} />Back to travel notes</Link><Link className="story-secondary" href="/account/#blocked">管理我的黑名单</Link></div>;
  const own = viewerId === profile.id;
  return <div className="shell profile-page">
    <Link className="story-back" href="/stories/"><ArrowLeft size={16} />Travel Notes</Link>
    <section className="profile-hero">
      <span className="profile-hero__avatar" aria-hidden="true">{profile.avatarInitial || profile.displayName.slice(0, 1)}</span>
      <div className="profile-hero__identity"><p className="stories-eyebrow">Wayella traveler</p><h1>{profile.displayName}</h1><p>{profile.bio || 'Sharing places, planning ideas, and small travel moments.'}</p></div>
      <div className="profile-hero__actions">{own ? <Link className="story-secondary" href="/account/#profile">编辑资料</Link> : !viewerId ? <Link className="story-primary" href={`/login/?next=${encodeURIComponent(profileHref(profile.id))}`}>登录后互动</Link> : profile.blocked ? <button className="story-secondary" type="button" disabled={busy} onClick={() => relationship('unblock')}><Ban size={16} />解除拉黑</button> : <><button className="story-primary" type="button" disabled={busy} onClick={() => relationship(profile.following ? 'unfollow' : 'follow')}>{profile.following ? <UserRoundCheck size={16} /> : <UserPlus size={16} />}{profile.following ? '已关注' : '关注'}</button><Link className="story-secondary" href={`/inbox/?to=${encodeURIComponent(profile.id)}`}><MessageCircle size={16} />私信</Link><button className="story-tertiary" type="button" disabled={busy} onClick={() => relationship('block')}><Ban size={16} />拉黑</button><button className="story-tertiary" type="button" disabled={busy} onClick={report}>举报</button></>}</div>
    </section>
    <dl className="profile-stats"><div><dt>Notes</dt><dd>{profile.counts.posts}</dd></div><div><dt>Followers</dt><dd>{profile.counts.followers}</dd></div><div><dt>Following</dt><dd>{profile.counts.following}</dd></div></dl>
    {!profile.blocked && (profile.languages || profile.travelPreferences) && <div className="member-hint">{profile.languages && <p>常用语言：{profileListText(profile.languages)}</p>}{profile.travelPreferences && <p>旅行偏好：{profileListText(profile.travelPreferences)}</p>}</div>}
    {message && <p className="story-notice" role="status">{message}</p>}
    {!profile.blocked && <section className="profile-posts"><div className="notes-section-heading"><div><p className="stories-eyebrow">Published notes</p><h2>From {profile.displayName}</h2></div></div><StoriesFeed authorId={profile.id} /></section>}
  </div>;
}
