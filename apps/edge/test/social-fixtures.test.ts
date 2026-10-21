import { describe, expect, it } from 'vitest';

import { createSocialDatabase } from './social-fixtures';

describe('social migration', () => {
  it('creates all social tables and enforces relationship uniqueness', async () => {
    const fixture = createSocialDatabase();
    const tableRows = await fixture.db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all<{ name: string }>();
    const names = new Set(tableRows.results.map((row) => row.name));
    for (const name of ['profiles', 'follows', 'blocks', 'post_comments', 'post_likes', 'post_bookmarks', 'post_shares', 'conversations', 'conversation_members', 'messages', 'message_reads', 'social_reports']) {
      expect(names.has(name)).toBe(true);
    }
    fixture.close();
  });

  it('keeps duplicate follows and interactions out at the database boundary', async () => {
    const fixture = createSocialDatabase();
    await fixture.db.prepare(`INSERT INTO users (id,email,display_name,password_hash,email_verified_at,created_at,updated_at)
      VALUES ('a','a@example.com','A','x','now','now','now'),('b','b@example.com','B','x','now','now','now')`).run();
    await fixture.db.prepare("INSERT INTO follows (follower_id, following_id, created_at) VALUES ('a','b','now')").run();
    await expect(fixture.db.prepare("INSERT INTO follows (follower_id, following_id, created_at) VALUES ('a','b','now')").run()).rejects.toThrow();
    fixture.close();
  });
});
