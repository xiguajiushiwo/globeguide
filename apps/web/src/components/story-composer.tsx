'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, ImagePlus, Send, Sparkles, Video, Radio, Save } from 'lucide-react';
import { destinationCatalog } from '@globeguide/domain';

import { getOwnStory, getSession, saveStory, storyErrorMessage, submitStory } from '@/lib/story-api';
import type { StoryFormat, StoryInput, StoryStatus, StoryType } from '@/lib/story-api';

export function StoryComposer() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('id') ?? '';
  const requestedMode = searchParams.get('mode');
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [type, setType] = useState<StoryType>('guide');
  const [format, setFormat] = useState<StoryFormat>(requestedMode === 'video' || requestedMode === 'gallery' || requestedMode === 'live' ? requestedMode : 'text');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [language, setLanguage] = useState('en');
  const [destinationId, setDestinationId] = useState('');
  const [visitedMonth, setVisitedMonth] = useState('');
  const [mediaText, setMediaText] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [liveStartsAt, setLiveStartsAt] = useState('');
  const [status, setStatus] = useState<StoryStatus | null>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const [savedId, setSavedId] = useState(editId);

  useEffect(() => {
    let active = true;
    getSession().then(async (user) => {
      if (!active) return;
      setAuthenticated(Boolean(user));
      if (!user || !editId) return;
      const story = await getOwnStory(editId);
      if (!active) return;
      setType(story.type); setFormat(story.format ?? 'text'); setTitle(story.title ?? ''); setBody(story.body);
      setLanguage(story.language); setDestinationId(story.destinationId);
      setVisitedMonth(story.visitedMonth ?? ''); setMediaText((story.mediaUrls ?? []).join('\n')); setLiveUrl(story.liveUrl ?? '');
      setLiveStartsAt(story.liveStartsAt ? story.liveStartsAt.slice(0, 16) : ''); setStatus(story.status);
    }).catch((error: unknown) => { if (active) setMessage(storyErrorMessage(error)); });
    return () => { active = false; };
  }, [editId]);

  async function save(submit: boolean) {
    setWorking(true);
    setMessage('');
    const mediaUrls = mediaText.split(/\r?\n|,/).map((value) => value.trim()).filter(Boolean);
    const input: StoryInput = {
      type, format, title: title.trim() || null, body: body.trim(), language,
      destinationId, visitedMonth: visitedMonth || null, mediaUrls,
      liveUrl: liveUrl.trim() || null, liveStartsAt: liveStartsAt ? new Date(liveStartsAt).toISOString() : null,
    };
    try {
      const result = await saveStory(input, savedId || undefined);
      setSavedId(result.id);
      let nextStatus = result.status;
      if (submit && result.status === 'draft') {
        const submitted = await submitStory(result.id);
        nextStatus = submitted.status;
      }
      setStatus(nextStatus);
      setMessage(nextStatus === 'pending' ? 'Saved and awaiting moderator review.' : 'Draft saved. You can return to it from Your notes.');
      if (!editId) window.history.replaceState(null, '', `/stories/write/?id=${encodeURIComponent(result.id)}`);
    } catch (error) {
      setMessage(storyErrorMessage(error));
    } finally {
      setWorking(false);
    }
  }

  const mediaValid = format === 'text' || format === 'live'
    ? format === 'text' || Boolean(liveStartsAt || liveUrl.trim())
    : (format === 'video' ? mediaText.trim().length > 0 : mediaText.trim().length > 0);
  const canSubmit = !working && Boolean(destinationId) && body.trim().length >= 20
    && (type === 'guide' ? title.trim().length >= 4 : true) && mediaValid;

  if (authenticated === false) return <div className="shell story-compose">
    <Link className="story-back" href="/stories/"><ArrowLeft size={17} aria-hidden="true" />All travel notes</Link>
    <h1>Write a note</h1><p>Sign in to save a draft and submit it for review.</p>
    <Link className="story-primary" href="/login/?next=/stories/write/">Sign in to write</Link>
  </div>;

  return <div className="shell story-compose">
    <Link className="story-back" href="/stories/mine/"><ArrowLeft size={17} aria-hidden="true" />Your notes</Link>
    <div className="story-compose__heading"><div><p className="stories-eyebrow">Creator studio</p><h1>{editId ? 'Edit your note' : 'Write a note'}</h1></div>
      {status && <span className="story-status-pill">{status}</span>}
    </div>
    <p className="story-compose__intro">Share a text note, short video, photo gallery or scheduled live room. Every submission is reviewed before it appears publicly.</p>
    <form onSubmit={(event) => { event.preventDefault(); void save(true); }}>
      <fieldset className="story-type-picker"><legend>Note type</legend>
        <label><input type="radio" name="story-type" value="guide" checked={type === 'guide'} onChange={() => setType('guide')} />Guide</label>
        <label><input type="radio" name="story-type" value="moment" checked={type === 'moment'} onChange={() => setType('moment')} />Moment</label>
      </fieldset>
      <fieldset className="story-type-picker story-format-picker"><legend>Publish format</legend>
        <label><input type="radio" name="story-format" value="text" checked={format === 'text'} onChange={() => setFormat('text')} /><Sparkles size={15} aria-hidden="true" />图文</label>
        <label><input type="radio" name="story-format" value="video" checked={format === 'video'} onChange={() => setFormat('video')} /><Video size={15} aria-hidden="true" />视频</label>
        <label><input type="radio" name="story-format" value="gallery" checked={format === 'gallery'} onChange={() => setFormat('gallery')} /><ImagePlus size={15} aria-hidden="true" />相册</label>
        <label><input type="radio" name="story-format" value="live" checked={format === 'live'} onChange={() => setFormat('live')} /><Radio size={15} aria-hidden="true" />直播</label>
      </fieldset>
      <div className="story-form-grid">
        <label>Destination <span aria-hidden="true">*</span>
          <select value={destinationId} onChange={(event) => setDestinationId(event.target.value)} required>
            <option value="">Choose a city</option>
            {destinationCatalog.map((destination) => <option key={destination.place.id} value={destination.place.id}>
              {destination.place.name} · {destination.nameZh}
            </option>)}
          </select>
        </label>
        <label>Visited month <span className="story-optional">optional</span>
          <input type="month" value={visitedMonth} onChange={(event) => setVisitedMonth(event.target.value)} />
        </label>
      </div>
      <label>Title {type === 'moment' && <span className="story-optional">optional</span>}
        <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} minLength={type === 'guide' ? 4 : undefined} maxLength={120} required={type === 'guide'} placeholder={type === 'guide' ? 'A useful title for your guide' : 'A moment worth remembering'} />
      </label>
      <label>Note <span aria-hidden="true">*</span>
        <textarea value={body} onChange={(event) => setBody(event.target.value)} minLength={20} maxLength={6000} required rows={13} placeholder="What did you discover? What would help another traveler?" />
        <span className="story-count">{body.length} / 6000</span>
      </label>
      {format === 'video' && <label>视频地址 <span className="story-optional">需要可访问的 MP4/HLS 地址</span>
        <input type="url" value={mediaText} onChange={(event) => setMediaText(event.target.value)} placeholder="https://cdn.example.com/travel-video.mp4" required />
      </label>}
      {format === 'gallery' && <label>图片地址 <span className="story-optional">每行一张，最多 9 张</span>
        <textarea value={mediaText} onChange={(event) => setMediaText(event.target.value)} rows={5} placeholder="https://cdn.example.com/tokyo-1.jpg\nhttps://cdn.example.com/tokyo-2.jpg" required />
      </label>}
      {format === 'live' && <div className="story-live-fields">
        <label><span><Radio size={15} aria-hidden="true" />直播间地址 <span className="story-optional">可先留空，开播前补上</span></span><input type="url" value={liveUrl} onChange={(event) => setLiveUrl(event.target.value)} placeholder="https://live.example.com/room" /></label>
        <label><span><CalendarClock size={15} aria-hidden="true" />开播时间</span><input type="datetime-local" value={liveStartsAt} onChange={(event) => setLiveStartsAt(event.target.value)} /></label>
      </div>}
      <label>Language
        <select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="en">English</option><option value="zh-CN">简体中文</option></select>
      </label>
      <p className="story-compose__policy">Only publish media you own or are licensed to share. This first version stores approved media links and live room links; Cloudflare R2/Stream upload can be connected after the content flow is validated.</p>
      {message && <p className="story-notice" role="status">{message}</p>}
      <div className="story-form-actions">
        <button className="story-secondary" type="button" onClick={() => void save(false)} disabled={!canSubmit}><Save size={17} aria-hidden="true" />Save draft</button>
        <button className="story-primary" type="submit" disabled={!canSubmit}><Send size={17} aria-hidden="true" />Submit for review</button>
      </div>
    </form>
  </div>;
}
