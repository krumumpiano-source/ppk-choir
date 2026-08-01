import { getRequestContext } from '@cloudflare/next-on-pages';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export function getDb() {
  return (getRequestContext().env as unknown as Env).DB;
}

export function getJwtSecret() {
  const secret = (getRequestContext().env as unknown as Env).JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return secret;
}
