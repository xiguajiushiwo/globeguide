CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id TEXT NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('comment', 'reply')),
  created_at TEXT NOT NULL,
  read_at TEXT,
  UNIQUE (recipient_id, comment_id),
  CHECK (recipient_id <> actor_id)
);
CREATE INDEX IF NOT EXISTS notifications_recipient_cursor ON notifications(recipient_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS notifications_unread ON notifications(recipient_id, read_at);
