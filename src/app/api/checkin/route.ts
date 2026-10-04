import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const studentId = url.searchParams.get('studentId');
    const db = getDb();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // If studentId provided, return this student's checkin record for that session
    if (studentId) {
      const record = await db.prepare('SELECT * FROM checkins WHERE studentId = ? AND sessionId = ?').bind(studentId, sessionId).first<any>();
      return NextResponse.json({ checkin: record || null });
    }

    const result = await db.prepare(`
      SELECT checkins.*, users.phone, users.lineId 
      FROM checkins 
      LEFT JOIN users ON checkins.studentId = users.id 
      WHERE sessionId = ? ORDER BY timestamp DESC
    `).bind(sessionId).all<any>();
    return NextResponse.json({ checkins: result.results });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as any;
    const { studentId, sessionId } = body;
    const db = getDb();
    
    if (!studentId || !sessionId) {
      return NextResponse.json({ error: 'studentId and sessionId are required' }, { status: 400 });
    }

    const existing = await db.prepare('SELECT id, checkoutTime FROM checkins WHERE studentId = ? AND sessionId = ?').bind(studentId, sessionId).first<any>();
    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการเช็คชื่อเข้า กรุณาเช็คชื่อเข้าก่อน' }, { status: 400 });
    }
    if (existing.checkoutTime) {
      return NextResponse.json({ error: 'คุณได้เช็คชื่อออกแล้ว' }, { status: 400 });
    }

    const checkoutTime = new Date().toISOString();
    await db.prepare('UPDATE checkins SET checkoutTime = ? WHERE studentId = ? AND sessionId = ?')
      .bind(checkoutTime, studentId, sessionId).run();
    
    return NextResponse.json({ success: true, checkoutTime });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
