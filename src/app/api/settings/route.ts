import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole, serverError } from '@/lib/auth-guard';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const auth = await requireRole();
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    if (!key) {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 });
    }

    const db = getDb();
    const result = await db.prepare('SELECT data FROM settings WHERE id = ?').bind(key).first<{data: string}>();
    
    return NextResponse.json({ data: result?.data || null });
  } catch (error: any) {
    return serverError(error);
  }
}
