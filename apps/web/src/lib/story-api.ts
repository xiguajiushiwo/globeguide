export type StoryType = 'guide' | 'moment';
export type StoryFormat = 'text' | 'video' | 'gallery' | 'live';
export type StoryStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'removed';

export type Story = {
  id: string;
  author: { id: string; displayName: string };
  type: StoryType;
  format?: StoryFormat;
  title: string | null;
  body: string;
  language: string;
  destinationId: string;
  visitedMonth: string | null;
  status: StoryStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  publishedAt: string | null;
  mediaUrls?: string[];
  liveUrl?: string | null;
  liveStartsAt?: string | null;
  coverImage?: string;
  sourceLabel?: string;
  sourceUrl?: string;
};

export type StoryInput = {
  type: StoryType;
  format?: StoryFormat;
  title: string | null;
  body: string;
  language: string;
  destinationId: string;
  visitedMonth: string | null;
  mediaUrls?: string[];
  liveUrl?: string | null;
  liveStartsAt?: string | null;
};

export type StoryList = { items: Story[]; nextCursor: string | null };
export type SessionSummary = { id: string; email: string; displayName: string; role: 'member' | 'admin' };

export class StoryApiError extends Error {
  constructor(public readonly code: string, public readonly status: number) {
    super(code);
  }
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { credentials: 'same-origin', cache: 'no-store', ...init });
  } catch {
    throw new StoryApiError('network_unavailable', 0);
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new StoryApiError('invalid_server_response', response.status);
  }
  if (!response.ok) {
    const code = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
      ? data.error : 'request_failed';
    throw new StoryApiError(code, response.status);
  }
  return data as T;
}

function jsonInit(method: string, data: unknown): RequestInit {
  return { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) };
}

export function listStories(filters: { destinationId?: string; type?: StoryType; format?: StoryFormat; authorId?: string; cursor?: string; feed?: 'for-you' | 'following' | 'saved' } = {}) {
  const params = new URLSearchParams();
  if (filters.destinationId) params.set('destinationId', filters.destinationId);
  if (filters.type) params.set('type', filters.type);
  if (filters.format) params.set('format', filters.format);
  if (filters.authorId) params.set('authorId', filters.authorId);
  if (filters.cursor) params.set('cursor', filters.cursor);
  if (filters.feed && filters.feed !== 'for-you') params.set('feed', filters.feed);
  return requestJson<StoryList>(`/api/posts${params.size ? `?${params}` : ''}`);
}

export async function getStory(id: string) {
  const result = await requestJson<{ post: Story }>(`/api/posts/${encodeURIComponent(id)}`);
  return result.post;
}

export async function getOwnStory(id: string) {
  const result = await requestJson<{ post: Story }>(`/api/posts/mine/${encodeURIComponent(id)}`);
  return result.post;
}

export async function getSession() {
  const result = await requestJson<{ user: SessionSummary | null }>('/api/auth/me');
  return result.user;
}

export async function listOwnStories() {
  const result = await requestJson<{ items: Story[] }>('/api/posts/mine');
  return result.items;
}

export async function saveStory(input: StoryInput, id?: string) {
  return requestJson<{ id: string; status: StoryStatus }>(id ? `/api/posts/${encodeURIComponent(id)}` : '/api/posts',
    jsonInit(id ? 'PATCH' : 'POST', input));
}

export function submitStory(id: string) {
  return requestJson<{ id: string; status: StoryStatus }>(`/api/posts/${encodeURIComponent(id)}/submit`, jsonInit('POST', {}));
}

export function retractStory(id: string) {
  return requestJson<{ id: string; status: StoryStatus }>(`/api/posts/${encodeURIComponent(id)}/retract`, jsonInit('POST', {}));
}

export function deleteStory(id: string) {
  return requestJson<{ id: string; status: StoryStatus }>(`/api/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function reportStory(postId: string, reason: string) {
  return requestJson<{ status: string }>('/api/reports', jsonInit('POST', { postId, reason }));
}

export type ModerationQueue = {
  items: Story[];
  reports: { id: string; postId: string; reason: string; createdAt: string; reporterName: string }[];
};

export function getModerationQueue() {
  return requestJson<ModerationQueue>('/api/moderation/queue');
}

export function moderateStory(id: string, action: 'approve' | 'reject' | 'takedown', reason: string) {
  return requestJson<{ id: string; status: StoryStatus }>(`/api/moderation/${encodeURIComponent(id)}/${action}`,
    jsonInit('POST', { reason }));
}

export function dismissStoryReport(id: string, reason: string) {
  return requestJson<{ id: string; status: string }>(`/api/moderation/reports/${encodeURIComponent(id)}/dismiss`,
    jsonInit('POST', { reason }));
}

export function getModerationHistory(postId: string) {
  return requestJson<{ items: { action: string; reason: string; createdAt: string; moderatorName: string }[] }>(
    `/api/moderation/history?postId=${encodeURIComponent(postId)}`);
}

export function storyErrorMessage(error: unknown): string {
  if (!(error instanceof StoryApiError)) return 'Something went wrong. Please try again.';
  const messages: Record<string, string> = {
    network_unavailable: 'The Travel Notes service is unavailable. Try again later.',
    invalid_server_response: 'The Travel Notes service is not ready yet.',
    login_required: 'Sign in to continue.',
    email_not_verified: 'Verify your email before publishing.',
    invalid_post: 'Check the city, title, caption and media links.',
    invalid_format: 'Check the media format and links.',
    invalid_report: 'Please add a reason of at least 10 characters.',
    already_reported: 'You have already reported this note.',
    report_limit: 'You have reached today’s report limit.',
    blocked: 'This action is unavailable because of a block.',
    rate_limited: 'You are doing that too often. Try again later.',
    profile_not_found: 'This profile is not available.',
    invalid_comment: 'Keep comments plain text and under 2,000 characters.',
    conversation_forbidden: 'You do not have access to this conversation.',
    invalid_transition: 'This note’s status has changed. Refresh and try again.',
    post_not_found: 'This note is not available.',
    admin_required: 'Moderator access is required.',
  };
  return messages[error.code] ?? 'The request could not be completed. Try again.';
}
