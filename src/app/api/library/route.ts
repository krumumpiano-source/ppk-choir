import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole, serverError } from '@/lib/auth-guard';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const auth = await requireRole();
    if (auth.error) return auth.error;
    const url = new URL(request.url);
    const voiceType = url.searchParams.get('voiceType') || 'All';
    const db = getDb();
    
    let result;
    if (voiceType && voiceType !== 'All') {
      result = await db.prepare('SELECT * FROM library WHERE voiceType = ? ORDER BY uploadedAt DESC').bind(voiceType).all<any>();
    } else {
      result = await db.prepare('SELECT * FROM library ORDER BY uploadedAt DESC').all<any>();
    }
    
    return NextResponse.json({ items: result.results });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(['admin']);
    if (auth.error) return auth.error;
    const body = await request.json() as any;
    if (!body.title || !body.fileUrl) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อและลิงก์ไฟล์' }, { status: 400 });
    }
    const { title, voiceType, fileUrl } = body;
    const db = getDb();
    
    const id = crypto.randomUUID();
    await db.prepare(
      'INSERT INTO library (id, title, voiceType, fileUrl) VALUES (?, ?, ?, ?)'
    ).bind(id, title, voiceType, fileUrl).run();
    
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return serverError(error);
  }
}
