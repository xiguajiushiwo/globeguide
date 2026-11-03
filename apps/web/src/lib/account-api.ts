import { requestJson, StoryApiError } from './story-api';

export type BlockedUser = { id: string; displayName: string; createdAt: string };
export type Notification = {
  id: string; kind: 'comment' | 'reply'; createdAt: string; readAt: string | null;
  actorId: string; actorName: string; commentId: string; postId: string;
  body: string; commentKind: string; postTitle: string;
};
export type NotificationPage = { items: Notification[]; unreadCount: number; nextCursor: string | null };
export const profileHref = (id: string) => `/profiles/?id=${encodeURIComponent(id)}`;
export function profileListText(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) return value.join('、');
  if (!value) return '';
  try { const parsed: unknown = JSON.parse(value); if (Array.isArray(parsed)) return parsed.join('、'); } catch { /* Legacy profiles contain plain text. */ }
  return value;
}
export async function getBlockedUsers() { return (await requestJson<{ items: BlockedUser[] }>('/api/blocks')).items; }
export function listNotifications(cursor?: string, unread = false) {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (unread) params.set('unread', '1');
  return requestJson<NotificationPage>(`/api/notifications?${params}`);
}
export function notificationCount() { return requestJson<{ unreadCount: number }>('/api/notifications/count'); }
export async function readNotifications(ids: string[]) {
  await requestJson('/api/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
  window.dispatchEvent(new Event('globeguide:notifications'));
}
export function changePassword(currentPassword: string, password: string) {
  return requestJson('/api/auth/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, password }) });
}
export function accountError(error: unknown) {
  const messages: Record<string, string> = {
    login_required: '登录已失效，请重新登录。', invalid_profile: '请检查资料长度，资料中暂不支持链接或 HTML。',
    incorrect_password: '当前密码不正确，请重新输入。', invalid_password: '新密码需要 12–128 个字符。',
    password_unchanged: '新密码不能与当前密码相同。', rate_limited: '操作太频繁，请稍后重试。',
    network_unavailable: '网络连接失败，请重试。', blocked: '你与对方已存在拉黑关系，无法进行此操作。',
  };
  return error instanceof StoryApiError ? messages[error.code] ?? '操作暂时未完成，请重试。' : '网络连接失败，请重试。';
}
