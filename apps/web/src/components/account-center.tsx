'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, Bell, Bookmark, FilePenLine, LayoutDashboard, LogOut, MessageCircle, Route, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import { getSession, requestJson, type SessionSummary } from '@/lib/story-api';
import { getProfile, updateProfile, unblockUser, type Profile } from '@/lib/social-api';
import { accountError, changePassword, getBlockedUsers, profileHref, profileListText, type BlockedUser } from '@/lib/account-api';

const tabs = [
  { id: 'overview', label: '我的空间', icon: LayoutDashboard },
  { id: 'profile', label: '编辑资料', icon: UserRound },
  { id: 'security', label: '账号安全', icon: ShieldCheck },
  { id: 'blocked', label: '黑名单管理', icon: UsersRound },
] as const;
type Tab = typeof tabs[number]['id'];

export function AccountCenter() {
  const [user, setUser] = useState<SessionSummary | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [initial, setInitial] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState('');
  const [preferences, setPreferences] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [blocked, setBlocked] = useState<BlockedUser[] | null>(null);

  const load = useCallback(async () => {
    setLoaded(false); setLoadError('');
    try {
      const session = await getSession(); setUser(session);
      if (session) {
        const next = await getProfile(session.id); setProfile(next);
        setName(next.displayName); setInitial(next.avatarInitial ?? ''); setBio(next.bio ?? '');
        setLanguages(profileListText(next.languages)); setPreferences(profileListText(next.travelPreferences));
      }
    } catch (cause) { setLoadError(accountError(cause)); }
    finally { setLoaded(true); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const sync = () => { const selected = window.location.hash.slice(1); if (tabs.some((item) => item.id === selected)) setTab(selected as Tab); };
    sync(); window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => {
    if (tab !== 'blocked' || !user) return;
    let active = true; setBlocked(null);
    getBlockedUsers().then((items) => { if (active) setBlocked(items); }).catch((cause) => { if (active) setError(accountError(cause)); });
    return () => { active = false; };
  }, [tab, user]);

  function select(next: Tab) { setTab(next); setMessage(''); setError(''); window.history.replaceState(null, '', `/account/#${next}`); }
  async function saveProfile(event: React.FormEvent) {
    event.preventDefault(); if (!user || busy) return;
    setBusy(true); setMessage(''); setError('');
    try {
      const next = await updateProfile(user.id, { displayName: name.trim(), avatarInitial: initial.trim(), bio: bio.trim(), languages: languages.trim(), travelPreferences: preferences.trim() });
      setProfile(next); setUser({ ...user, displayName: next.displayName });
      window.dispatchEvent(new Event('globeguide:account'));
      setMessage('资料已保存，个人主页也已更新。');
    } catch (cause) { setError(accountError(cause)); }
    finally { setBusy(false); }
  }
  async function savePassword(event: React.FormEvent) {
    event.preventDefault(); if (busy) return; setMessage(''); setError('');
    if (password !== confirmation) { setError('两次输入的新密码不一致。'); return; }
    setBusy(true);
    try { await changePassword(currentPassword, password); window.location.assign('/login/?passwordChanged=1&next=/account/'); }
    catch (cause) { setError(accountError(cause)); setBusy(false); }
  }
  async function removeBlock(item: BlockedUser) {
    if (busy || !window.confirm(`解除对「${item.displayName}」的拉黑？解除后可重新互动，但不会自动恢复关注。`)) return;
    setBusy(true); setError(''); setMessage('');
    try { await unblockUser(item.id); setBlocked((items) => items?.filter((entry) => entry.id !== item.id) ?? []); setMessage(`已解除对 ${item.displayName} 的拉黑。`); window.dispatchEvent(new Event('globeguide:notifications')); }
    catch (cause) { setError(accountError(cause)); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true); setError('');
    try { await requestJson('/api/auth/logout', { method: 'POST' }); window.location.assign('/login/'); }
    catch (cause) { setError(accountError(cause)); setBusy(false); }
  }

  if (!loaded) return <div className="shell member-page"><p role="status">正在加载个人中心…</p></div>;
  if (loadError) return <div className="shell member-page"><p role="alert">{loadError}</p><button className="story-primary" onClick={() => void load()}>重新加载</button></div>;
  if (!user || !profile) return <div className="shell member-page member-empty"><UserRound size={36} /><h1>你的旅行，从这里继续</h1><p>登录后管理个人资料、创作和互动通知。</p><Link className="story-primary" href="/login/?next=/account/">登录账号</Link><Link className="story-secondary" href="/register/">注册账号</Link></div>;

  return <div className="shell member-page">
    <header className="member-hero">
      <div className="member-avatar" aria-hidden="true">{profile.avatarInitial || profile.displayName.slice(0, 1)}</div>
      <div className="member-hero__identity"><p className="member-eyebrow">MY WAYELLA</p><h1>{profile.displayName}</h1><p>{profile.bio || '记录旅行，分享发现，让下一次出发更从容。'}</p></div>
      <Link className="member-hero__link" href={profileHref(user.id)}>查看公开主页 <ArrowUpRight size={17} /></Link>
    </header>
    <div className="member-layout">
      <aside className="member-nav"><nav aria-label="个人中心导航">{tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => select(id)}><Icon size={18} />{label}</button>)}<Link href="/notifications/"><Bell size={18} />互动通知</Link><Link href="/inbox/"><MessageCircle size={18} />私信</Link></nav><button className="member-logout" type="button" disabled={busy} onClick={() => void logout()}><LogOut size={17} />退出登录</button></aside>
      <div className="member-content">
        {tab === 'overview' && <>
          <div className="member-section-heading"><div><p className="member-eyebrow">YOUR TRAVEL SPACE</p><h2>我的空间</h2></div><Link className="story-primary" href="/stories/write/"><FilePenLine size={17} />发布内容</Link></div>
          {!profile.bio && <div className="member-onboarding"><div><strong>让旅友认识你</strong><p>添加个人简介、常用语言和旅行偏好，完善你的旅行名片。</p></div><button className="story-secondary" onClick={() => select('profile')}>完善资料</button></div>}
          <dl className="member-stats"><div><dt>已发布作品</dt><dd>{profile.counts.posts}</dd></div><div><dt>粉丝</dt><dd>{profile.counts.followers}</dd></div><div><dt>关注</dt><dd>{profile.counts.following}</dd></div></dl>
          <div className="member-cards">
            <Link href="/stories/mine/"><FilePenLine /><h3>我的作品</h3><p>管理草稿、待审核和已发布内容</p><ArrowUpRight className="member-card-arrow" size={18} /></Link>
            <Link href="/notifications/"><Bell /><h3>互动通知</h3><p>查看评论与回复，回到对话现场</p><ArrowUpRight className="member-card-arrow" size={18} /></Link>
            <Link href="/stories/?feed=saved"><Bookmark /><h3>收藏的内容</h3><p>再次阅读值得保存的旅行分享</p><ArrowUpRight className="member-card-arrow" size={18} /></Link>
            <Link href="/trips/"><Route /><h3>我的行程</h3><p>继续规划下一次出发</p><ArrowUpRight className="member-card-arrow" size={18} /></Link>
          </div>
          <p className="member-hint">内容收藏保存在账号中；<Link href="/saved/">收藏的地点</Link>和行程目前保存在当前浏览器。</p>
          {user.role === 'admin' && <Link className="story-secondary" href="/stories/moderation/">进入内容审核</Link>}
        </>}
        {tab === 'profile' && <section><div className="member-section-heading"><div><p className="member-eyebrow">PROFILE</p><h2>编辑个人资料</h2><p>以下资料会显示在你的公开主页。</p></div></div>
          <form className="member-form" onSubmit={saveProfile}><fieldset disabled={busy}>
            <div className="member-form-grid"><label>昵称<input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={48} autoComplete="nickname" /></label><label>头像文字<input value={initial} onChange={(e) => setInitial(e.target.value)} maxLength={3} placeholder="例如：旅" /><small>最多 3 个字符，留空使用昵称首字。</small></label></div>
            <label>个人简介<textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={500} placeholder="介绍你的旅行故事，以及你愿意分享的经验…" /><small>{bio.length} / 500</small></label>
            <label>常用语言<input value={languages} onChange={(e) => setLanguages(e.target.value)} maxLength={500} placeholder="例如：中文、English、日本語" /></label>
            <label>旅行偏好<input value={preferences} onChange={(e) => setPreferences(e.target.value)} maxLength={500} placeholder="例如：城市漫步、美食、亲子旅行" /></label>
            <button className="story-primary" type="submit">{busy ? '保存中…' : '保存资料'}</button>
          </fieldset></form></section>}
        {tab === 'security' && <section><div className="member-section-heading"><div><p className="member-eyebrow">ACCOUNT & SECURITY</p><h2>账号安全</h2><p>管理登录密码，保护你的账号。</p></div></div>
          <div className="member-email"><ShieldCheck size={21} /><div><strong>登录邮箱</strong><p>{user.email}</p></div><span>已验证</span></div>
          <form className="member-form" onSubmit={savePassword}><fieldset disabled={busy}><legend>修改密码</legend>
            <label>当前密码<input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required maxLength={128} autoComplete="current-password" /></label>
            <div className="member-form-grid"><label>新密码<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12} maxLength={128} autoComplete="new-password" /></label><label>确认新密码<input type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required minLength={12} maxLength={128} autoComplete="new-password" /></label></div>
            <p className="member-hint">使用 12–128 个字符。修改成功后，所有设备上的登录会失效，需要重新登录。</p>
            <button className="story-primary" type="submit">{busy ? '提交中…' : '更新密码'}</button><Link className="member-text-link" href="/reset/">忘记当前密码？通过邮箱找回</Link>
          </fieldset></form></section>}
        {tab === 'blocked' && <section><div className="member-section-heading"><div><p className="member-eyebrow">PRIVACY</p><h2>黑名单管理</h2><p>拉黑后，双方无法关注、评论互动或发送私信。可在对方主页或评论处拉黑。</p></div></div>
          {blocked === null ? <p role="status">{error ? '黑名单暂未加载。切换页面后可重试。' : '正在加载黑名单…'}</p> : blocked.length === 0 ? <div className="member-empty"><ShieldCheck size={32} /><h3>黑名单为空</h3><p>你可以随时管理不希望收到的互动。</p></div> : <ul className="member-blocks">{blocked.map((item) => <li key={item.id}><div><strong>{item.displayName}</strong><p>拉黑于 {new Date(item.createdAt).toLocaleDateString('zh-CN')}</p></div><button className="story-secondary" disabled={busy} onClick={() => void removeBlock(item)}>解除拉黑</button></li>)}</ul>}
        </section>}
        {error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="member-success" role="status">{message}</p>}
      </div>
    </div>
  </div>;
}
