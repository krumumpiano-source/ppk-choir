import { getRequestContext } from '@cloudflare/next-on-pages';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export function getDb() {
  return (getRequestContext().env as unknown as Env).DB;
}

export function getJwtSecret() {
  return (getRequestContext().env as unknown as Env).JWT_SECRET || 'fallback-secret-for-development';
}
