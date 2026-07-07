import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json() as any;
    const db = getDb();
    
    const { studentId, studentName, location, devicePlatform, room, sessionId } = body;
    
    if (sessionId) {
      const existing = await db.prepare('SELECT id FROM checkins WHERE studentId = ? AND sessionId = ?').bind(studentId, sessionId).first();
      if (existing) {
        return NextResponse.json({ error: 'คุณได้เช็คชื่อในคาบเรียนนี้ไปแล้ว' }, { status: 400 });
      }
    }
    
    const id = crypto.randomUUID();
    await db.prepare(
      'INSERT INTO checkins (id, studentId, studentName, location, devicePlatform, room, sessionId) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, studentId, studentName, location ? JSON.stringify(location) : null, devicePlatform, room || '', sessionId || '').run();
    
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
