import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    const db = getDb();
    
    let result;
    if (studentId) {
      result = await db.prepare('SELECT * FROM practices WHERE studentId = ? ORDER BY timestamp DESC').bind(studentId).all<any>();
    } else {
      result = await db.prepare('SELECT * FROM practices ORDER BY timestamp DESC').all<any>();
    }
    
    return NextResponse.json({ practices: result.results });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as any;
    const { studentId, studentName, voiceType, audioUrl, reflection } = body;
    const db = getDb();
    
    const id = crypto.randomUUID();
    await db.prepare(
      'INSERT INTO practices (id, studentId, studentName, voiceType, audioUrl, reflection) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, studentId, studentName, voiceType, audioUrl, reflection).run();
    
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
