export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ success: boolean; meta: { changes?: number } }>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}

export interface D1Database {
  prepare(query: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown[]>;
}

export interface MailSink {
  send(to: string, subject: string, body: string): Promise<void>;
}

export interface Env {
  DB: D1Database;
  ASSETS: { fetch(request: Request): Promise<Response> };
  MAIL_API_KEY?: string;
  MAIL_FROM?: string;
  MAIL_SINK?: MailSink;
  AUTH_SECRET: string;
  CODE_HMAC_KEY: string;
}
