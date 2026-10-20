'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Save } from 'lucide-react';
import { destinationCatalog } from '@globeguide/domain';

import { getOwnStory, getSession, saveStory, storyErrorMessage, submitStory } from '@/lib/story-api';
import type { StoryInput, StoryStatus, StoryType } from '@/lib/story-api';

export function StoryComposer() {
  const editId = useSearchParams().get('id') ?? '';
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [type, setType] = useState<StoryType>('guide');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [language, setLanguage] = useState('en');
  const [destinationId, setDestinationId] = useState('');
  const [visitedMonth, setVisitedMonth] = useState('');
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
      setType(story.type); setTitle(story.title ?? ''); setBody(story.body);
      setLanguage(story.language); setDestinationId(story.destinationId);
      setVisitedMonth(story.visitedMonth ?? ''); setStatus(story.status);
    }).catch((error: unknown) => { if (active) setMessage(storyErrorMessage(error)); });
    return () => { active = false; };
  }, [editId]);

  async function save(submit: boolean) {
    setWorking(true);
    setMessage('');
    const input: StoryInput = {
      type, title: title.trim() || null, body: body.trim(), language,
      destinationId, visitedMonth: visitedMonth || null,
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
      setMessage(nextStatus === 'pending' ? 'Saved and awaiting moderator review.' : 'Draft saved. You can return to it from Your writing.');
      if (!editId) window.history.replaceState(null, '', `/stories/write/?id=${encodeURIComponent(result.id)}`);
    } catch (error) {
      setMessage(storyErrorMessage(error));
    } finally {
      setWorking(false);
    }
  }

  if (authenticated === false) return <div className="shell story-compose">
    <Link className="story-back" href="/stories/"><ArrowLeft size={17} aria-hidden="true" />All stories</Link>
    <h1>Write a story</h1><p>Sign in to save a draft and submit it for review.</p>
    <Link className="story-primary" href="/login/?next=/stories/write/">Sign in to write</Link>
  </div>;

  return <div className="shell story-compose">
    <Link className="story-back" href="/stories/mine/"><ArrowLeft size={17} aria-hidden="true" />Your writing</Link>
    <div className="story-compose__heading"><div><p className="stories-eyebrow">Creator studio</p><h1>{editId ? 'Edit your story' : 'Write a story'}</h1></div>
      {status && <span className="story-status-pill">{status}</span>}
    </div>
    <p className="story-compose__intro">Share your own experience in plain text. Every story is reviewed before it appears publicly.</p>
    <form onSubmit={(event) => { event.preventDefault(); void save(true); }}>
      <fieldset className="story-type-picker"><legend>Story type</legend>
        <label><input type="radio" name="story-type" value="guide" checked={type === 'guide'} onChange={() => setType('guide')} />Guide</label>
        <label><input type="radio" name="story-type" value="moment" checked={type === 'moment'} onChange={() => setType('moment')} />Travel journal</label>
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
      <label>Story <span aria-hidden="true">*</span>
        <textarea value={body} onChange={(event) => setBody(event.target.value)} minLength={20} maxLength={6000} required rows={13} placeholder="What did you discover? What would help another traveler?" />
        <span className="story-count">{body.length} / 6000</span>
      </label>
      <label>Language
        <select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="en">English</option><option value="zh-CN">简体中文</option></select>
      </label>
      <p className="story-compose__policy">Only publish writing and photos you have rights to share. Photo uploads are not available in this beta. Do not paste another site’s article.</p>
      {message && <p className="story-notice" role="status">{message}</p>}
      <div className="story-form-actions">
        <button className="story-secondary" type="button" onClick={() => void save(false)} disabled={working || !destinationId || body.trim().length < 20 || (type === 'guide' && title.trim().length < 4)}><Save size={17} aria-hidden="true" />Save draft</button>
        <button className="story-primary" type="submit" disabled={working || !destinationId || body.trim().length < 20 || (type === 'guide' && title.trim().length < 4)}><Send size={17} aria-hidden="true" />Submit for review</button>
      </div>
    </form>
  </div>;
}
