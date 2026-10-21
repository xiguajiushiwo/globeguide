'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Flag, MapPin } from 'lucide-react';
import { getDestination } from '@globeguide/domain';

import { editorialExample, editorialExamples } from '@/lib/story-examples';
import { getSession, getStory, listStories, reportStory, storyErrorMessage } from '@/lib/story-api';
import type { Story } from '@/lib/story-api';
import { SocialActions } from './social-actions';
import { CommentThread } from './comment-thread';

export function StoryViewer() {
  const id = useSearchParams().get('id') ?? '';
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [related, setRelated] = useState<Story[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const example = id.startsWith('editorial-');

  useEffect(() => { getSession().then((user) => { setAuthenticated(Boolean(user)); setViewerId(user?.id ?? null); }).catch(() => { setAuthenticated(false); setViewerId(null); }); }, []);

  useEffect(() => {
    let active = true;
    if (!id) { setLoading(false); setMessage('Choose a travel note from the list.'); return; }
    const local = editorialExample(id);
    if (local) { setStory(local); setLoading(false); return; }
    setLoading(true);
    getStory(id).then((post) => { if (active) { setStory(post); setMessage(''); } })
      .catch((error: unknown) => { if (active) { setStory(null); setMessage(storyErrorMessage(error)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!story) return;
    if (example) {
      setRelated(editorialExamples.filter((item) => item.destinationId === story.destinationId && item.id !== story.id).slice(0, 3));
      return;
    }
    let active = true;
    listStories({ destinationId: story.destinationId }).then((data) => {
      if (active) setRelated(data.items.filter((item) => item.id !== story.id).slice(0, 3));
    }).catch(() => { if (active) setRelated([]); });
    return () => { active = false; };
  }, [story, example]);

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
    <Link className="story-back" href="/stories/"><ArrowLeft size={17} aria-hidden="true" />All travel notes</Link>
    {loading && <p className="story-status">Loading travel note…</p>}
    {!loading && message && <p className="story-notice" role="status">{message}</p>}
    {story && <article>
      <div className="story-detail__meta"><span className={`story-kind story-kind--${story.type}`}>
        {story.type === 'guide' ? 'Guide' : 'Travel journal'}</span>
        {example && <span>GlobeGuide editorial example · not a traveler submission</span>}
      </div>
      <h1>{story.title || 'A travel note'}</h1>
      <p className="story-detail__byline">By {example ? story.author.displayName : <Link href={`/profiles/${encodeURIComponent(story.author.id)}/`}>{story.author.displayName}</Link>}
        {story.publishedAt && <> · {new Date(story.publishedAt).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })}</>}
        {story.visitedMonth && <> · Visited {story.visitedMonth}</>}
      </p>
      {destination && <Link className="story-detail__place" href={`/destinations/${destination.place.id}/`}>
        <MapPin size={17} aria-hidden="true" />{destination.place.name} · {destination.nameZh}</Link>}
      <div className="story-detail__body">{story.body.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      {example && <div className="story-example-note"><p>This original platform example shows how notes will appear. It does not claim a personal visit or provide current opening hours or prices.</p>{story.sourceUrl && <a href={story.sourceUrl} target="_blank" rel="noreferrer">{story.sourceLabel ?? 'Reference source'} <ArrowUpRight size={14} aria-hidden="true" /></a>}</div>}
      {!example && <>
        <SocialActions postId={story.id} authenticated={authenticated} initial={{ liked: false, bookmarked: false, counts: { likes: 0, bookmarks: 0, shares: 0, comments: 0 } }} />
        <CommentThread postId={story.id} authenticated={authenticated} viewerId={viewerId} />
      </>}
      {!example && <div className="story-report">
        <button type="button" className="story-tertiary" onClick={() => { setReportOpen((open) => !open); setReportMessage(''); }}>
          <Flag size={16} aria-hidden="true" />Report note
        </button>
        {reportOpen && <form onSubmit={submitReport}>
          <label htmlFor="report-reason">Why should a moderator review this note?</label>
          <textarea id="report-reason" value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} required rows={3} />
          <button className="story-secondary" type="submit">Send report</button>
        </form>}
        {reportMessage && <p role="status">{reportMessage}{reportMessage.includes('Sign in') && <> <Link href={`/login/?next=${encodeURIComponent(`/stories/post/?id=${story.id}`)}`}>Sign in</Link></>}</p>}
      </div>}
      {related.length > 0 && <section className="story-related" aria-labelledby="related-notes-title">
        <div className="notes-section-heading"><div><p className="stories-eyebrow">Keep exploring</p><h2 id="related-notes-title">More from {destination?.place.name ?? 'this place'}</h2></div></div>
        <div className="stories-grid">{related.map((item) => <Link className="story-related__item" key={item.id} href={`/stories/post/?id=${encodeURIComponent(item.id)}`}><span className={`story-kind story-kind--${item.type}`}>{item.type === 'guide' ? 'Guide' : 'Moment'}</span><strong>{item.title || 'A travel note'}</strong><span>{item.author.displayName}</span></Link>)}</div>
      </section>}
    </article>}
  </div>;
}
