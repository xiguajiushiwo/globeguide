'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, ShieldAlert, X } from 'lucide-react';

import { dismissStoryReport, getModerationQueue, moderateStory, storyErrorMessage } from '@/lib/story-api';
import type { ModerationQueue } from '@/lib/story-api';

export function StoryModeration() {
  const [queue, setQueue] = useState<ModerationQueue | null>(null);
  const [message, setMessage] = useState('');
  const [workingId, setWorkingId] = useState('');
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    try { setQueue(await getModerationQueue()); setMessage(''); }
    catch (error) { setMessage(storyErrorMessage(error)); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);

  async function act(id: string, action: 'approve' | 'reject' | 'takedown') {
    setWorkingId(id);
    try { await moderateStory(id, action, reasons[id] ?? ''); await reload(); }
    catch (error) { setMessage(storyErrorMessage(error)); }
    finally { setWorkingId(''); }
  }

  async function dismiss(id: string, postId: string) {
    setWorkingId(id);
    try { await dismissStoryReport(id, reasons[postId] ?? ''); await reload(); }
    catch (error) { setMessage(storyErrorMessage(error)); }
    finally { setWorkingId(''); }
  }

  return <div className="shell stories-page">
    <div className="stories-heading"><div><p className="stories-eyebrow">Moderation</p><h1>Review queue</h1>
      <p>Only approved stories appear to the public. Decisions are recorded with the moderator and time.</p></div></div>
    {message && <p className="story-notice" role="status">{message}</p>}
    {!queue && !message && <p className="story-status">Loading review queue…</p>}
    {queue && <>
      <h2 className="story-moderation-title">Awaiting review <span>{queue.items.length}</span></h2>
      {queue.items.length === 0 && <p className="story-status">No stories are awaiting review.</p>}
      <div className="story-review-list">{queue.items.map((story) => <article key={story.id} className="story-review-item">
        <p className="story-review-item__meta">{story.type === 'guide' ? 'Guide' : 'Travel journal'} · {story.author.displayName} · {story.destinationId}</p>
        <h3>{story.title || 'Travel journal'}</h3><p className="story-review-item__body">{story.body}</p>
        <label>Reason for rejection <span className="story-optional">required when rejecting</span>
          <input value={reasons[story.id] ?? ''} onChange={(event) => setReasons((current) => ({ ...current, [story.id]: event.target.value }))} maxLength={500} placeholder="Explain the decision to the author" />
        </label>
        <div className="story-form-actions"><button type="button" className="story-primary" disabled={workingId === story.id} onClick={() => void act(story.id, 'approve')}><Check size={17} />Approve</button>
          <button type="button" className="story-secondary" disabled={workingId === story.id || (reasons[story.id] ?? '').trim().length < 10} onClick={() => void act(story.id, 'reject')}><X size={17} />Reject</button></div>
      </article>)}</div>
      <h2 className="story-moderation-title">Reports <span>{queue.reports.length}</span></h2>
      {queue.reports.length === 0 && <p className="story-status">No open reports.</p>}
      <div className="story-review-list">{queue.reports.map((report) => <article key={report.id} className="story-review-item">
        <p className="story-review-item__meta"><ShieldAlert size={16} aria-hidden="true" />Reported by {report.reporterName}</p>
        <p>{report.reason}</p><a href={`/stories/post/?id=${encodeURIComponent(report.postId)}`} target="_blank" rel="noopener noreferrer">View story</a>
        <label>Reason for removal
          <input value={reasons[report.postId] ?? ''} onChange={(event) => setReasons((current) => ({ ...current, [report.postId]: event.target.value }))} maxLength={500} placeholder="Explain the removal" />
        </label>
        <button type="button" className="story-secondary" disabled={workingId === report.postId || (reasons[report.postId] ?? '').trim().length < 10} onClick={() => void act(report.postId, 'takedown')}>Take down story</button>
        <button type="button" className="story-tertiary" disabled={workingId === report.id || (reasons[report.postId] ?? '').trim().length < 10} onClick={() => void dismiss(report.id, report.postId)}>Dismiss report</button>
      </article>)}</div>
    </>}
  </div>;
}
