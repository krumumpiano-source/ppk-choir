import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { requireRole, serverError } from '@/lib/auth-guard';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const auth = await requireRole();
    if (auth.error) return auth.error;
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const studentId = url.searchParams.get('studentId');
    const db = getDb();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // If studentId provided, ensure user is admin or fetching their own record
    if (studentId) {
      if (auth.user.role !== 'admin' && auth.user.id !== studentId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      let record;
      if (sessionId) {
        record = await db.prepare(`
          SELECT * FROM checkins 
          WHERE studentId = ? AND sessionId = ? 
          AND date(timestamp, '+7 hours') = date('now', '+7 hours')
          ORDER BY timestamp DESC
        `).bind(studentId, sessionId).first<any>();
      } else {
        record = await db.prepare('SELECT * FROM checkins WHERE studentId = ? AND checkoutTime IS NULL ORDER BY timestamp DESC').bind(studentId).first<any>();
      }
      if (record && record.location && typeof record.location === 'string') {
        try { record.location = JSON.parse(record.location); } catch (e) {}
      }
      return NextResponse.json({ checkin: record || null });
    }

    // Only admin or section_leader can fetch all checkins for a session
    if (auth.user.role !== 'admin' && auth.user.role !== 'section_leader') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await db.prepare(`
      SELECT checkins.*, users.phone, users.lineId, users.studentId as actualStudentId
      FROM checkins 
      LEFT JOIN users ON checkins.studentId = users.id 
      WHERE sessionId = ? ORDER BY timestamp DESC
    `).bind(sessionId).all<any>();
    
    const checkins = result.results.map((c: any) => {
      if (c.location && typeof c.location === 'string') {
        try { c.location = JSON.parse(c.location); } catch (e) {}
      }
      return c;
    });
    
    return NextResponse.json({ checkins });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole();
    if (auth.error) return auth.error;

    const body = await request.json() as any;
    const db = getDb();
    
    const isAdminUser = auth.user.role === 'admin';
    const studentId = isAdminUser && body.studentId ? body.studentId : auth.user.id;
    const studentName = isAdminUser && body.studentName ? body.studentName : (auth.user.name || body.studentName);
    const { location, devicePlatform, room, sessionId } = body;
    
    if (sessionId) {
      const existing = await db.prepare(`
        SELECT id FROM checkins 
        WHERE studentId = ? AND sessionId = ? 
        AND date(timestamp, '+7 hours') = date('now', '+7 hours')
      `).bind(studentId, sessionId).first();
      if (existing) {
        return NextResponse.json({ error: 'คุณได้เช็คชื่อเข้าสำหรับวันนี้ไปแล้ว' }, { status: 400 });
      }
      // Check if session is actually active
      const session = await db.prepare('SELECT isActive FROM sessions WHERE id = ?').bind(sessionId).first<{isActive: number}>();
      if (!session || !session.isActive) {
        return NextResponse.json({ error: 'คาบเรียนนี้ไม่ได้เปิดให้เช็คชื่อ' }, { status: 400 });
      }
    }
    
    const id = crypto.randomUUID();
    await db.prepare(
      'INSERT INTO checkins (id, studentId, studentName, location, devicePlatform, room, sessionId) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, studentId, studentName, location ? JSON.stringify(location) : null, devicePlatform, room || '', sessionId || '').run();
    
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireRole();
    if (auth.error) return auth.error;

    const body = await request.json() as any;
    const { sessionId } = body;
    const isAdminUser = auth.user.role === 'admin';
    const studentId = isAdminUser && body.studentId ? body.studentId : auth.user.id;
    const db = getDb();
    
    if (!studentId || !sessionId) {
      return NextResponse.json({ error: 'studentId and sessionId are required' }, { status: 400 });
    }

    // Find the latest checkin for this session that hasn't been checked out, preferably today's
    const existing = await db.prepare(`
      SELECT id, checkoutTime FROM checkins 
      WHERE studentId = ? AND sessionId = ? 
      ORDER BY timestamp DESC
    `).bind(studentId, sessionId).first<any>();
    
    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการเช็คชื่อเข้า กรุณาเช็คชื่อเข้าก่อน' }, { status: 400 });
    }
    if (existing.checkoutTime) {
      return NextResponse.json({ error: 'คุณได้เช็คชื่อออกแล้ว' }, { status: 400 });
    }

    const checkoutTime = new Date().toISOString();
    await db.prepare('UPDATE checkins SET checkoutTime = ? WHERE id = ?')
      .bind(checkoutTime, existing.id).run();
    
    return NextResponse.json({ success: true, checkoutTime });
  } catch (error: any) {
    return serverError(error);
  }
}
