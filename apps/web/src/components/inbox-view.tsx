'use client';

import Link from 'next/link';
import { ArrowLeft, LogOut, MessageCircle, Send, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { createConversation, deleteMessage, leaveConversation, listConversations, listMessages, markConversationRead, muteConversation, sendMessage, socialErrorMessage, type Conversation, type Message } from '@/lib/social-api';
import { getSession } from '@/lib/story-api';

export function InboxView() {
  const params = useSearchParams();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState(params.get('conversation') ?? '');
  const targetId = params.get('to');
  const [targetHandled, setTargetHandled] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const selected = useMemo(() => conversations.find((item) => item.id === selectedId) ?? null, [conversations, selectedId]);

  useEffect(() => { getSession().then((user) => setAuthenticated(Boolean(user))).catch(() => setAuthenticated(false)); }, []);
  useEffect(() => {
    if (!authenticated) { setLoading(false); return; }
    let active = true;
    listConversations().then(async (items) => { if (!active) return; setConversations(items); if (!selectedId && items[0]) setSelectedId(items[0].id); if (targetId && !targetHandled) { try { const conversation = await createConversation({ memberIds: [targetId] }); if (!active) return; setConversations((current) => current.some((item) => item.id === conversation.id) ? current : [conversation, ...current]); setSelectedId(conversation.id); setTargetHandled(true); } catch (error) { if (active) setMessage(socialErrorMessage(error)); } } })
      .catch((error) => { if (active) setMessage(socialErrorMessage(error)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authenticated, selectedId, targetId, targetHandled]);

  useEffect(() => {
    if (!selectedId || !authenticated) { setMessages([]); return; }
    let active = true;
    const refresh = () => listMessages(selectedId, messages.at(-1)?.id).then((data) => { if (!active) return; const incoming = data.items ?? data.messages ?? []; setMessages((current) => [...current, ...incoming.filter((item) => !current.some((existing) => existing.id === item.id))]); if (incoming.at(-1)) void markConversationRead(selectedId, incoming.at(-1)!.id).catch(() => {}); }).catch((error) => { if (active) setMessage(socialErrorMessage(error)); });
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [selectedId, authenticated]);

  async function send() {
    const body = draft.trim();
    if (!selectedId || !body) return;
    setDraft(''); setMessage('');
    try { const item = await sendMessage(selectedId, body); setMessages((current) => [...current, item]); } catch (error) { setDraft(body); setMessage(socialErrorMessage(error)); }
  }
  async function createGroup() {
    const raw = window.prompt('Enter member profile IDs separated by commas');
    if (!raw) return;
    const memberIds = raw.split(',').map((item) => item.trim()).filter(Boolean);
    if (!memberIds.length) return;
    const name = window.prompt('Group name (optional)') || null;
    try { const conversation = await createConversation({ memberIds, name }); setConversations((current) => [conversation, ...current]); setSelectedId(conversation.id); } catch (error) { setMessage(socialErrorMessage(error)); }
  }
  async function toggleMute() { if (!selected) return; try { const next = await muteConversation(selected.id, !selected.muted); setConversations((current) => current.map((item) => item.id === selected.id ? { ...item, muted: next.muted } : item)); } catch (error) { setMessage(socialErrorMessage(error)); } }
  async function leave() { if (!selected || !window.confirm('Leave this conversation?')) return; try { await leaveConversation(selected.id); setConversations((current) => current.filter((item) => item.id !== selected.id)); setSelectedId(''); } catch (error) { setMessage(socialErrorMessage(error)); } }
  async function remove(item: Message) { if (!window.confirm('Delete this message?')) return; try { await deleteMessage(item.id); setMessages((current) => current.map((entry) => entry.id === item.id ? { ...entry, body: 'Message deleted', deletedAt: new Date().toISOString() } : entry)); } catch (error) { setMessage(socialErrorMessage(error)); } }

  if (authenticated === null || loading) return <div className="shell inbox-page"><p className="story-status">Loading inbox…</p></div>;
  if (!authenticated) return <div className="shell inbox-page"><Link className="story-back" href="/stories/"><ArrowLeft size={16} />Travel Notes</Link><div className="inbox-empty"><MessageCircle size={28} /><h1>Your inbox</h1><p>Sign in to message travelers and start group chats.</p><Link className="story-primary" href="/login/?next=%2Finbox%2F">Sign in</Link></div></div>;
  return <div className="shell inbox-page">
    <div className="inbox-heading"><div><p className="stories-eyebrow">Private conversations</p><h1>Inbox</h1></div><button className="story-secondary" type="button" onClick={createGroup}><MessageCircle size={16} />New group</button></div>
    <div className="inbox-layout">
      <aside className="inbox-list" aria-label="Conversations">{conversations.length === 0 && <p className="inbox-list__empty">No conversations yet.</p>}{conversations.map((conversation) => <button key={conversation.id} type="button" className={conversation.id === selectedId ? 'is-active' : ''} onClick={() => setSelectedId(conversation.id)}><strong>{conversation.name || conversation.members.map((member) => member.displayName).join(', ') || 'Direct conversation'}</strong><span>{conversation.lastMessage?.body || 'Start a conversation'}</span></button>)}</aside>
      <section className="inbox-conversation" aria-label="Messages">{selected ? <><header><div><h2>{selected.name || selected.members.map((member) => member.displayName).join(', ') || 'Direct conversation'}</h2><p>{selected.members.length ? `${selected.members.length} member${selected.members.length === 1 ? '' : 's'}` : 'Private conversation'}</p></div><div><button type="button" className="story-tertiary" onClick={toggleMute} aria-label={selected.muted ? 'Unmute conversation' : 'Mute conversation'}>{selected.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button><button type="button" className="story-tertiary" onClick={leave} aria-label="Leave conversation"><LogOut size={16} /></button></div></header><div className="inbox-messages">{messages.length === 0 && <p className="inbox-messages__empty">No messages yet. Say hello.</p>}{messages.map((item) => <article key={item.id} className={item.deletedAt ? 'is-deleted' : ''}><p>{item.body}</p><footer><span>{item.sender.displayName}</span><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>{!item.deletedAt && <button type="button" onClick={() => remove(item)}>Delete</button>}</footer></article>)}</div><form className="inbox-composer" onSubmit={(event) => { event.preventDefault(); void send(); }}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} maxLength={2000} placeholder="Write a message…" /><button className="story-primary" type="submit" disabled={!draft.trim()}><Send size={16} />Send</button></form></> : <div className="inbox-empty"><MessageCircle size={28} /><h2>Select a conversation</h2><p>Choose a conversation from the list to see messages.</p></div>}</section>
    </div>
    {message && <p className="story-notice" role="status">{message}</p>}
  </div>;
}
