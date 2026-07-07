import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
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
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as any;
    const { title, voiceType, fileUrl } = body;
    const db = getDb();
    
    const id = crypto.randomUUID();
    await db.prepare(
      'INSERT INTO library (id, title, voiceType, fileUrl) VALUES (?, ?, ?, ?)'
    ).bind(id, title, voiceType, fileUrl).run();
    
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
