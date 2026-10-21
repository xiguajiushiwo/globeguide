'use client';

import Link from 'next/link';
import { CornerDownRight, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { createComment, deleteComment, listComments, socialErrorMessage, type SocialComment } from '@/lib/social-api';

type Props = { postId: string; authenticated: boolean; viewerId?: string | null | undefined };

export function CommentThread({ postId, authenticated, viewerId }: Props) {
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    listComments(postId).then((data) => { if (active) setComments(data.comments ?? data.items ?? []); })
      .catch((error) => { if (active) setMessage(socialErrorMessage(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [postId]);

  const roots = useMemo(() => comments.filter((comment) => !comment.parentId), [comments]);
  const replies = (id: string) => comments.filter((comment) => comment.parentId === id);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = body.trim();
    if (!authenticated || !text || pending) return;
    setPending(true); setMessage('');
    try {
      const created = await createComment(postId, text, replyTo);
      setComments((current) => [...current, created]); setBody(''); setReplyTo(null);
    } catch (error) { setMessage(socialErrorMessage(error)); }
    finally { setPending(false); }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this comment?')) return;
    try { await deleteComment(id); setComments((current) => current.map((comment) => comment.id === id ? { ...comment, body: 'Comment deleted', deletedAt: new Date().toISOString() } : comment)); }
    catch (error) { setMessage(socialErrorMessage(error)); }
  }

  const loginHref = `/login/?next=${encodeURIComponent(`/stories/post/?id=${postId}#comments`)}`;
  return <section id="comments" className="comment-thread" aria-labelledby="comments-title">
    <div className="notes-section-heading"><div><p className="stories-eyebrow">Join the conversation</p><h2 id="comments-title"><MessageCircle size={20} aria-hidden="true" /> Comments</h2></div><span>{comments.length} total</span></div>
    {loading && <p className="story-status">Loading comments…</p>}
    {!loading && roots.length === 0 && <p className="comment-thread__empty">No comments yet. Add a thoughtful note about this journey.</p>}
    <div className="comment-thread__list">
      {roots.map((comment) => <CommentItem key={comment.id} comment={comment} replies={replies(comment.id)} onReply={setReplyTo} onDelete={remove} viewerId={viewerId} />)}
    </div>
    {authenticated ? <form className="comment-thread__form" onSubmit={submit}>
      {replyTo && <p className="comment-thread__replying">Replying to a comment <button type="button" onClick={() => setReplyTo(null)}>Cancel</button></p>}
      <label htmlFor={`comment-${postId}`}>Add a comment</label>
      <textarea id={`comment-${postId}`} value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} rows={3} placeholder="Share a useful detail…" required />
      <div><span>{body.length}/2,000</span><button className="story-primary" type="submit" disabled={pending || !body.trim()}><Send size={16} aria-hidden="true" />{pending ? 'Posting…' : replyTo ? 'Reply' : 'Comment'}</button></div>
    </form> : <p className="comment-thread__signin"><Link href={loginHref}>Sign in</Link> to add a comment or reply.</p>}
    {message && <p className="story-notice" role="status">{message}</p>}
  </section>;
}

function CommentItem({ comment, replies, onReply, onDelete, viewerId }: { comment: SocialComment; replies: SocialComment[]; onReply: (id: string) => void; onDelete: (id: string) => void; viewerId?: string | null | undefined }) {
  return <article className="comment-item">
    <div className="comment-item__meta"><span className="comment-item__avatar" aria-hidden="true">{comment.author.displayName.slice(0, 1)}</span><strong>{comment.author.displayName}</strong><time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleDateString()}</time></div>
    <p className={comment.deletedAt ? 'comment-item__body is-deleted' : 'comment-item__body'}>{comment.body}</p>
    {!comment.deletedAt && <div className="comment-item__actions"><button type="button" onClick={() => onReply(comment.id)}><CornerDownRight size={14} /> Reply</button>{viewerId === comment.author.id && <button type="button" onClick={() => onDelete(comment.id)} aria-label="Delete comment"><Trash2 size={14} /></button>}</div>}
    {replies.length > 0 && <div className="comment-item__replies">{replies.map((reply) => <div className="comment-item comment-item--reply" key={reply.id}><div className="comment-item__meta"><span className="comment-item__avatar" aria-hidden="true">{reply.author.displayName.slice(0, 1)}</span><strong>{reply.author.displayName}</strong><time dateTime={reply.createdAt}>{new Date(reply.createdAt).toLocaleDateString()}</time></div><p className={reply.deletedAt ? 'comment-item__body is-deleted' : 'comment-item__body'}>{reply.body}</p>{!reply.deletedAt && viewerId === reply.author.id && <div className="comment-item__actions"><button type="button" onClick={() => onDelete(reply.id)} aria-label="Delete reply"><Trash2 size={14} /></button></div>}</div>)}</div>}
  </article>;
}
