import { requestJson, StoryApiError } from './story-api';

export type SocialCounts = { posts: number; followers: number; following: number; likes?: number; comments?: number; bookmarks?: number; shares?: number };
export type Profile = {
  id: string;
  displayName: string;
  bio: string | null;
  avatarInitial: string;
  language?: string;
  travelPreferences?: string[];
  createdAt?: string;
  following: boolean;
  blocked: boolean;
  counts: SocialCounts;
};
export type SocialState = {
  liked: boolean;
  bookmarked: boolean;
  shared?: boolean;
  counts: { likes: number; bookmarks: number; shares: number; comments?: number };
};
export type SocialComment = {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  deletedAt?: string | null;
  author: { id: string; displayName: string };
  replies?: SocialComment[];
};
export type Conversation = {
  id: string;
  name: string | null;
  isGroup: boolean;
  members: { id: string; displayName: string; role?: string; muted?: boolean }[];
  lastMessage?: Message | null;
  muted?: boolean;
  updatedAt?: string;
};
export type Message = { id: string; conversationId: string; sender: { id: string; displayName: string }; body: string; createdAt: string; deletedAt?: string | null };

function jsonInit(method: string, data: unknown): RequestInit {
  return { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) };
}

export async function getProfile(id: string) {
  const result = await requestJson<{ profile: Profile }>(`/api/profiles/${encodeURIComponent(id)}`);
  return result.profile;
}

export async function updateProfile(id: string, input: { displayName?: string; bio?: string | null; avatarInitial?: string; language?: string; languages?: string; travelPreferences?: string[] | string }) {
  const result = await requestJson<{ profile: Profile }>(`/api/profiles/${encodeURIComponent(id)}`, jsonInit('PATCH', input));
  return result.profile;
}

export async function followUser(id: string) {
  return requestJson<{ following: boolean; counts?: SocialCounts }>(`/api/follows/${encodeURIComponent(id)}`, jsonInit('POST', {}));
}
export async function unfollowUser(id: string) {
  return requestJson<{ following: boolean; counts?: SocialCounts }>(`/api/follows/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
export async function removeFollower(id: string) {
  return requestJson<{ removed: boolean }>(`/api/followers/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
export async function blockUser(id: string) {
  return requestJson<{ blocked: boolean }>(`/api/blocks/${encodeURIComponent(id)}`, jsonInit('POST', {}));
}
export async function unblockUser(id: string) {
  return requestJson<{ blocked: boolean }>(`/api/blocks/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

async function interaction(kind: 'like' | 'bookmark' | 'share', postId: string, method: 'POST' | 'DELETE') {
  return requestJson<SocialState>(`/api/interactions/${kind}/${encodeURIComponent(postId)}`, method === 'POST' ? jsonInit(method, {}) : { method });
}
export async function toggleLike(postId: string, liked: boolean) { return interaction('like', postId, liked ? 'POST' : 'DELETE'); }
export async function toggleBookmark(postId: string, bookmarked: boolean) { return interaction('bookmark', postId, bookmarked ? 'POST' : 'DELETE'); }
export async function recordShare(postId: string) { return interaction('share', postId, 'POST'); }
export async function getInteractionState(postId: string) {
  return requestJson<SocialState>(`/api/interactions?postId=${encodeURIComponent(postId)}`);
}

export async function listComments(postId: string, cursor?: string) {
  const params = new URLSearchParams({ postId });
  if (cursor) params.set('cursor', cursor);
  const result = await requestJson<{ comments?: SocialComment[]; items?: SocialComment[]; nextCursor?: string | null }>(`/api/comments?${params}`);
  const comments = (result.comments ?? result.items ?? []).map((comment) => {
    const raw = comment as SocialComment & { authorId?: string; authorName?: string };
    return raw.author ? raw : { ...raw, author: { id: raw.authorId ?? '', displayName: raw.authorName ?? 'Traveler' } };
  });
  return { comments, items: comments, nextCursor: result.nextCursor ?? null };
}
export async function createComment(postId: string, body: string, parentId?: string | null) {
  const result = await requestJson<{ comment?: SocialComment } & SocialComment>('/api/comments', jsonInit('POST', { postId, body, parentId: parentId ?? null }));
  const raw = (result.comment ?? result) as SocialComment & { authorId?: string; authorName?: string };
  return raw.author ? raw : { ...raw, author: { id: raw.authorId ?? '', displayName: raw.authorName ?? 'Traveler' } };
}
export async function deleteComment(id: string) {
  return requestJson<{ deleted: boolean }>(`/api/comments/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
export async function reportSocialTarget(targetType: 'profile' | 'post' | 'comment' | 'message', targetId: string, reason: string) {
  return requestJson<{ status: string }>('/api/social-reports', jsonInit('POST', { targetType: targetType === 'profile' ? 'user' : targetType, targetId, reason }));
}

export async function listConversations() {
  const result = await requestJson<{ items: Conversation[]; conversations?: Conversation[] }>('/api/conversations');
  return (result.items ?? result.conversations ?? []).map((item) => {
    const raw = item as Conversation & { kind?: string; lastMessage?: string; lastMessageId?: string };
    return { ...raw, isGroup: raw.isGroup ?? raw.kind === 'group', members: raw.members ?? [], lastMessage: typeof raw.lastMessage === 'string' ? { id: raw.lastMessageId ?? '', conversationId: raw.id, sender: { id: '', displayName: '' }, body: String(raw.lastMessage), createdAt: raw.updatedAt ?? '' } : raw.lastMessage ?? null };
  });
}
export async function createConversation(input: { memberIds: string[]; name?: string | null }) {
  const result = await requestJson<{ conversation?: Conversation; id: string; kind?: string; name?: string | null }>('/api/conversations', jsonInit('POST', input));
  return result.conversation ?? { id: result.id, isGroup: result.kind === 'group', name: result.name ?? null, members: [] };
}
export async function getConversation(id: string) {
  const result = await requestJson<{ conversation: Conversation }>(`/api/conversations/${encodeURIComponent(id)}`);
  return result.conversation;
}
export async function listMessages(id: string, after?: string) {
  const params = after ? `?after=${encodeURIComponent(after)}` : '';
  const result = await requestJson<{ items: Message[]; messages?: Message[]; nextCursor: string | null }>(`/api/conversations/${encodeURIComponent(id)}/messages${params}`);
  const items = (result.items ?? result.messages ?? []).map((item) => {
    const raw = item as Message & { senderId?: string; senderName?: string };
    return raw.sender ? raw : { ...raw, sender: { id: raw.senderId ?? '', displayName: raw.senderName ?? 'Traveler' } };
  });
  return { ...result, items, messages: items };
}
export async function sendMessage(conversationId: string, body: string) {
  const result = await requestJson<{ message?: Message } & Message>(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, jsonInit('POST', { body }));
  const raw = (result.message ?? result) as Message & { senderId?: string; senderName?: string };
  return raw.sender ? raw : { ...raw, sender: { id: raw.senderId ?? '', displayName: raw.senderName ?? 'Traveler' } };
}
export async function deleteMessage(id: string) {
  return requestJson<{ deleted: boolean }>(`/api/messages/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
export async function markConversationRead(id: string, messageId: string) {
  return requestJson<{ read: boolean }>(`/api/conversations/${encodeURIComponent(id)}/read`, jsonInit('POST', { messageId }));
}
export async function muteConversation(id: string, muted: boolean) {
  return requestJson<{ muted: boolean }>(`/api/conversations/${encodeURIComponent(id)}/${muted ? 'mute' : 'unmute'}`, { method: 'POST' });
}
export async function leaveConversation(id: string) {
  return requestJson<{ left: boolean }>(`/api/conversations/${encodeURIComponent(id)}/leave`, { method: 'POST' });
}

export function socialErrorMessage(error: unknown): string {
  if (!(error instanceof StoryApiError)) return 'Something went wrong. Please try again.';
  const messages: Record<string, string> = {
    login_required: 'Sign in to continue.', email_not_verified: 'Verify your email before continuing.', blocked: 'This action is unavailable because of a block.',
    rate_limited: 'You are doing that too often. Try again later.', profile_not_found: 'This profile is not available.', post_not_found: 'This note is not available.',
    comment_not_found: 'This comment is no longer available.', invalid_comment: 'Keep comments plain text and under 2,000 characters.', invalid_message: 'Keep messages plain text and under 2,000 characters.', already_reported: 'You have already reported this.', invalid_report: 'Please add a reason of at least 10 characters.', invalid_profile: 'Check your profile details.',
    conversation_forbidden: 'You do not have access to this conversation.', conversation_not_found: 'This conversation is no longer available.', message_not_found: 'This message is no longer available.',
    network_unavailable: 'The social service is unavailable. Try again later.',
  };
  return messages[error.code] ?? 'The request could not be completed. Try again.';
}
