import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole, serverError } from '@/lib/auth-guard';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const auth = await requireRole(['admin']);
    if (auth.error) return auth.error;

    const body = await request.json() as { id: string, data: string };
    if (!body.id || !body.data) {
      return NextResponse.json({ error: 'Missing id or data' }, { status: 400 });
    }

    const db = getDb();
    
    // Insert or replace setting
    await db.prepare('INSERT OR REPLACE INTO settings (id, data) VALUES (?, ?)').bind(body.id, body.data).run();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return serverError(error);
  }
}
