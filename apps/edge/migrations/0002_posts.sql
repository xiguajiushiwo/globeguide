CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('guide', 'moment')),
  title TEXT,
  body TEXT NOT NULL,
  language TEXT NOT NULL,
  destination_id TEXT NOT NULL,
  visited_month TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'removed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  submitted_at TEXT,
  published_at TEXT,
  deleted_at TEXT
);

CREATE INDEX posts_public_feed ON posts(status, published_at DESC, id DESC);
CREATE INDEX posts_destination_feed ON posts(destination_id, status, published_at DESC);
CREATE INDEX posts_author_list ON posts(author_id, updated_at DESC);
CREATE INDEX posts_moderation_queue ON posts(status, submitted_at ASC);

CREATE TABLE post_reports (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id),
  reporter_id TEXT NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'dismissed')),
  reviewed_at TEXT,
  reviewer_id TEXT REFERENCES users(id),
  UNIQUE (post_id, reporter_id)
);

CREATE TABLE post_moderation_actions (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id),
  actor_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'takedown', 'dismiss_report')),
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX post_moderation_history ON post_moderation_actions(post_id, created_at DESC);
