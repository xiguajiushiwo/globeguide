'use client';

import Link from 'next/link';
import { CornerDownRight, ImagePlus, MessageCircle, Mic, Send, Square, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { blockUser, createComment, deleteComment, listComments, socialErrorMessage, type SocialComment } from '@/lib/social-api';
import { profileHref } from '@/lib/account-api';

type Props = { postId: string; authenticated: boolean; viewerId?: string | null | undefined };

export function CommentThread({ postId, authenticated, viewerId }: Props) {
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [body, setBody] = useState('');
  const [kind, setKind] = useState<NonNullable<SocialComment['kind']>>('text');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    let active = true;
    listComments(postId).then((data) => { if (active) setComments(data.comments ?? data.items ?? []); })
      .catch((error) => { if (active) setMessage(socialErrorMessage(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [postId]);

  useEffect(() => {
    if (!loading && window.location.hash.startsWith('#comment-')) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'center' });
  }, [loading]);
  const roots = useMemo(() => comments.filter((comment) => !comment.parentId || !comments.some((parent) => parent.id === comment.parentId)), [comments]);
  const replies = (id: string) => comments.filter((comment) => comment.parentId === id);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = body.trim();
    if (!authenticated || pending || ((kind === 'photo' || kind === 'voice') ? !attachmentUrl : !text)) return;
    setPending(true); setMessage('');
    try {
      const created = await createComment(postId, text, replyTo, { kind, attachmentUrl: attachmentUrl || null });
      setComments((current) => [...current, created]); setBody(''); setReplyTo(null); setKind('text'); setAttachmentUrl('');
    } catch (error) { setMessage(socialErrorMessage(error)); }
    finally { setPending(false); }
  }

  async function toggleRecording() {
    if (recording) { recorder.current?.stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setMessage('This browser cannot record voice comments.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const next = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      next.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      next.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const reader = new FileReader();
        reader.onload = () => { setAttachmentUrl(typeof reader.result === 'string' ? reader.result : ''); setKind('voice'); setMessage('Voice note ready. You can post it now.'); };
        reader.readAsDataURL(new Blob(chunks, { type: next.mimeType || 'audio/webm' }));
        setRecording(false);
      };
      recorder.current = next; next.start(); setRecording(true); setMessage('Recording… press the button again to stop.');
    } catch { setMessage('Microphone access was not granted.'); }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this comment?')) return;
    try { await deleteComment(id); setComments((current) => current.map((comment) => comment.id === id ? { ...comment, body: 'Comment deleted', deletedAt: new Date().toISOString() } : comment)); }
    catch (error) { setMessage(socialErrorMessage(error)); }
  }

  async function block(author: SocialComment['author']) {
    if (pending || !window.confirm(`拉黑 ${author.displayName}？双方将无法关注、评论互动或发送私信。`)) return;
    setPending(true); setMessage('');
    try {
      await blockUser(author.id);
      setComments((current) => current.filter((item) => item.author.id !== author.id)); setReplyTo(null);
      window.dispatchEvent(new Event('globeguide:notifications'));
      setMessage('已拉黑，可前往个人中心的黑名单管理解除。');
    } catch (error) { setMessage(socialErrorMessage(error)); }
    finally { setPending(false); }
  }

  const loginHref = `/login/?next=${encodeURIComponent(`/stories/post/?id=${postId}#comments`)}`;
  return <section id="comments" className="comment-thread" aria-labelledby="comments-title">
    <div className="notes-section-heading"><div><p className="stories-eyebrow">Join the conversation</p><h2 id="comments-title"><MessageCircle size={20} aria-hidden="true" /> Comments</h2></div><span>{comments.length} total</span></div>
    {loading && <p className="story-status">Loading comments…</p>}
    {!loading && roots.length === 0 && <p className="comment-thread__empty">No comments yet. Add a thoughtful note about this journey.</p>}
    <div className="comment-thread__list">
      {roots.map((comment) => <CommentItem key={comment.id} comment={comment} replies={replies(comment.id)} onReply={setReplyTo} onDelete={remove} onBlock={block} pending={pending} viewerId={viewerId} />)}
    </div>
    {authenticated ? <form className="comment-thread__form" onSubmit={submit}>
      {replyTo && <p className="comment-thread__replying">Replying to a comment <button type="button" onClick={() => setReplyTo(null)}>Cancel</button></p>}
      <label htmlFor={`comment-${postId}`}>Add a comment</label>
      <textarea id={`comment-${postId}`} value={body} onChange={(event) => { setBody(event.target.value); if (kind !== 'text') setKind('text'); }} maxLength={2000} rows={3} placeholder="Share a useful detail…" required={kind !== 'photo' && kind !== 'voice'} />
      <div className="comment-thread__tools" aria-label="Comment attachments">
        <span className="comment-thread__tool-label">Add</span>
        {['😀', '👏', '❤️', '😂', '✈️'].map((emoji) => <button key={emoji} type="button" title={`Emoji ${emoji}`} onClick={() => { setKind('emoji'); setBody((current) => `${current}${emoji}`); }}>{emoji}</button>)}
        {['🎉', '🌟', '🗺️'].map((sticker) => <button key={sticker} type="button" className="comment-thread__sticker" title="Sticker" onClick={() => { setKind('sticker'); setBody(sticker); }}>{sticker}</button>)}
        <label className="comment-thread__attachment"><ImagePlus size={15} aria-hidden="true" /><span>Photo URL</span><input type="url" value={kind === 'photo' ? attachmentUrl : ''} onChange={(event) => { setKind('photo'); setAttachmentUrl(event.target.value); }} placeholder="https://…" /></label>
        <button type="button" className={recording ? 'is-recording' : ''} onClick={() => void toggleRecording()}>{recording ? <Square size={15} aria-hidden="true" /> : <Mic size={15} aria-hidden="true" />}{recording ? 'Stop' : 'Voice'}</button>
      </div>
      {(kind === 'photo' || kind === 'voice') && attachmentUrl && <p className="comment-thread__attachment-note">{kind === 'voice' ? 'Voice note attached.' : 'Photo attached.'}</p>}
      <div><span>{body.length}/2,000</span><button className="story-primary" type="submit" disabled={pending || ((kind === 'photo' || kind === 'voice') ? !attachmentUrl : !body.trim())}><Send size={16} aria-hidden="true" />{pending ? 'Posting…' : replyTo ? 'Reply' : 'Comment'}</button></div>
    </form> : <p className="comment-thread__signin"><Link href={loginHref}>Sign in</Link> to add a comment or reply.</p>}
    {message && <p className="story-notice" role="status">{message}</p>}
  </section>;
}

function CommentItem({ comment, replies, onReply, onDelete, onBlock, pending, viewerId }: { comment: SocialComment; replies: SocialComment[]; onReply: (id: string) => void; onDelete: (id: string) => void; onBlock: (author: SocialComment['author']) => void; pending: boolean; viewerId?: string | null | undefined }) {
  return <article className="comment-item" id={`comment-${comment.id}`}>
    <div className="comment-item__meta"><span className="comment-item__avatar" aria-hidden="true">{comment.author.displayName.slice(0, 1)}</span><Link href={profileHref(comment.author.id)}><strong>{comment.author.displayName}</strong></Link><time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleDateString()}</time></div>
    <CommentAttachment comment={comment} />
    {comment.body && <p className={comment.deletedAt ? 'comment-item__body is-deleted' : 'comment-item__body'}>{comment.body}</p>}
    {!comment.deletedAt && <div className="comment-item__actions"><button type="button" onClick={() => onReply(comment.parentId || comment.id)}><CornerDownRight size={14} /> Reply</button>{viewerId === comment.author.id ? <button type="button" onClick={() => onDelete(comment.id)} aria-label="Delete comment"><Trash2 size={14} /></button> : viewerId && <button type="button" disabled={pending} onClick={() => onBlock(comment.author)}>拉黑此用户</button>}</div>}
    {replies.length > 0 && <div className="comment-item__replies">{replies.map((reply) => <CommentItem key={reply.id} comment={reply} replies={[]} onReply={onReply} onDelete={onDelete} onBlock={onBlock} pending={pending} viewerId={viewerId} />)}</div>}
  </article>;
}

function CommentAttachment({ comment }: { comment: SocialComment }) {
  if (!comment.attachmentUrl || comment.deletedAt) return null;
  if (comment.kind === 'photo') return <img className="comment-item__photo" src={comment.attachmentUrl} alt="Comment attachment" loading="lazy" />;
  if (comment.kind === 'voice') return <audio className="comment-item__audio" controls src={comment.attachmentUrl} />;
  return null;
}
