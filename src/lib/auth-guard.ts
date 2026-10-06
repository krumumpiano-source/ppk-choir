import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';

export type SessionUser = {
  id: string;
  role: string;
  [key: string]: any;
};

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export function serverError(error: unknown, context = 'API Error') {
  console.error(context, error);
  return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get('token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !payload.id) return null;
  return payload as unknown as SessionUser;
}

/**
 * Returns { user } when the caller has one of the allowed roles,
 * otherwise { error } containing a ready-to-return response.
 */
export async function requireRole(roles: string[] | null = null): Promise<
  { user: SessionUser; error?: undefined } | { user?: undefined; error: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) return { error: unauthorized() };
  if (roles && !roles.includes(user.role)) return { error: forbidden() };
  return { user };
}

export const isAdmin = (u: SessionUser) => u.role === 'admin';
