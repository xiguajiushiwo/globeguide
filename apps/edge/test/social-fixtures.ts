import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

import type { D1Database, D1Statement } from '../src/env';

const migrations = [
  '../migrations/0001_auth.sql',
  '../migrations/0002_posts.sql',
  '../migrations/0003_social.sql',
];

function d1(db: DatabaseSync): D1Database {
  return {
    prepare(query: string): D1Statement {
      const statement = db.prepare(query);
      let parameters: unknown[] = [];
      return {
        bind(...values: unknown[]) { parameters = values; return this; },
        async first<T>() { return (statement.get(...parameters as []) ?? null) as T | null; },
        async run() {
          const result = statement.run(...parameters as []);
          return { success: true, meta: { changes: Number(result.changes) } };
        },
        async all<T>() { return { results: statement.all(...parameters as []) as T[] }; },
      };
    },
    async batch(statements) { return Promise.all(statements.map((statement) => statement.run())); },
  };
}

export function createSocialDatabase(): { db: D1Database; close(): void } {
  const database = new DatabaseSync(':memory:');
  for (const migration of migrations) {
    database.exec(readFileSync(fileURLToPath(new URL(migration, import.meta.url)), 'utf8'));
  }
  return { db: d1(database), close: () => database.close() };
}

export { d1 };
