'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Flag, MapPin } from 'lucide-react';
import { getDestination } from '@globeguide/domain';

import { editorialExample } from '@/lib/story-examples';
import { getStory, reportStory, storyErrorMessage } from '@/lib/story-api';
import type { Story } from '@/lib/story-api';

export function StoryViewer() {
  const id = useSearchParams().get('id') ?? '';
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const example = id.startsWith('editorial-');

  useEffect(() => {
    let active = true;
    if (!id) { setLoading(false); setMessage('Choose a story from the list.'); return; }
    const local = editorialExample(id);
    if (local) { setStory(local); setLoading(false); return; }
    setLoading(true);
    getStory(id).then((post) => { if (active) { setStory(post); setMessage(''); } })
      .catch((error: unknown) => { if (active) { setStory(null); setMessage(storyErrorMessage(error)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!story) return;
    try {
      await reportStory(story.id, reason);
      setReportMessage('Report received. A moderator will review it.');
      setReportOpen(false);
      setReason('');
    } catch (error) {
      setReportMessage(storyErrorMessage(error));
    }
  }

  const destination = story ? getDestination(story.destinationId) : undefined;
  return <div className="shell story-detail">
    <Link className="story-back" href="/stories/"><ArrowLeft size={17} aria-hidden="true" />All stories</Link>
    {loading && <p className="story-status">Loading story…</p>}
    {!loading && message && <p className="story-notice" role="status">{message}</p>}
    {story && <article>
      <div className="story-detail__meta"><span className={`story-kind story-kind--${story.type}`}>
        {story.type === 'guide' ? 'Guide' : 'Travel journal'}</span>
        {example && <span>GlobeGuide editorial example · not a traveler submission</span>}
      </div>
      <h1>{story.title || 'A travel note'}</h1>
      <p className="story-detail__byline">By {example ? story.author.displayName : <Link href={`/stories/creator/?id=${encodeURIComponent(story.author.id)}`}>{story.author.displayName}</Link>}
        {story.publishedAt && <> · {new Date(story.publishedAt).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })}</>}
        {story.visitedMonth && <> · Visited {story.visitedMonth}</>}
      </p>
      {destination && <Link className="story-detail__place" href={`/destinations/${destination.place.id}/`}>
        <MapPin size={17} aria-hidden="true" />{destination.place.name} · {destination.nameZh}</Link>}
      <div className="story-detail__body">{story.body.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      {example && <p className="story-example-note">This original platform example shows how stories will appear. It does not claim a personal visit or provide current opening hours or prices.</p>}
      {!example && <div className="story-report">
        <button type="button" className="story-tertiary" onClick={() => { setReportOpen((open) => !open); setReportMessage(''); }}>
          <Flag size={16} aria-hidden="true" />Report story
        </button>
        {reportOpen && <form onSubmit={submitReport}>
          <label htmlFor="report-reason">Why should a moderator review this story?</label>
          <textarea id="report-reason" value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} required rows={3} />
          <button className="story-secondary" type="submit">Send report</button>
        </form>}
        {reportMessage && <p role="status">{reportMessage}{reportMessage.includes('Sign in') && <> <Link href={`/login/?next=${encodeURIComponent(`/stories/post/?id=${story.id}`)}`}>Sign in</Link></>}</p>}
      </div>}
    </article>}
  </div>;
}
