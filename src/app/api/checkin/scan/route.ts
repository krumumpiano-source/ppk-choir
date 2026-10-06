import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole, serverError } from '@/lib/auth-guard';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    // Only admins or section leaders can scan
    const auth = await requireRole(['admin', 'section_leader']);
    if (auth.error) return auth.error;

    const body = await request.json() as any;
    const { studentId, studentName, sessionId } = body;
    
    if (!studentId || !sessionId) {
      return NextResponse.json({ error: 'ข้อมูล QR Code ไม่สมบูรณ์' }, { status: 400 });
    }

    const db = getDb();
    
    // Check if session exists and is active
    const session = await db.prepare('SELECT * FROM sessions WHERE id = ?').bind(sessionId).first();
    if (!session) {
      return NextResponse.json({ error: 'ไม่พบกิจกรรมที่อ้างถึง' }, { status: 404 });
    }

    // Ensure student exists and get details
    const student = await db.prepare('SELECT * FROM users WHERE id = ?').bind(studentId).first<{id: string, name: string, room: string, studentId: string}>();
    if (!student) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลนักเรียนนี้ในระบบ' }, { status: 404 });
    }

    // Check if already checked in
    const existing = await db.prepare('SELECT id, checkoutTime FROM checkins WHERE studentId = ? AND sessionId = ?').bind(studentId, sessionId).first<{id: string, checkoutTime: string | null}>();
    
    const timestamp = new Date().toISOString();

    if (existing) {
      if (!existing.checkoutTime) {
        // They are checked in, but not checked out. So this scan means Check-Out!
        await db.prepare('UPDATE checkins SET checkoutTime = ? WHERE id = ?').bind(timestamp, existing.id).run();
        return NextResponse.json({ success: true, action: 'checkout', timestamp, studentName: student.name });
      } else {
        // Already checked out
        return NextResponse.json({ error: 'นักเรียนคนนี้เช็คชื่อเข้าและออกไปแล้ว' }, { status: 400 });
      }
    }

    // Insert Checkin record
    const id = crypto.randomUUID();
    // Use scanner's location if available, otherwise just use session's center location to satisfy schema
    const scannerLat = body.lat || (session.location ? JSON.parse(session.location as string).lat : 0);
    const scannerLng = body.lng || (session.location ? JSON.parse(session.location as string).lng : 0);

    const room = student.room || 'ไม่ระบุห้อง';
    // actualStudentId refers to the human readable ID like '35282'
    const actualStudentId = student.studentId || '';

    const locationObj = { lat: scannerLat, lng: scannerLng };

    await db.prepare(`
      INSERT INTO checkins (id, studentId, studentName, sessionId, timestamp, location, liveLat, liveLng, devicePlatform, room)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, studentId, studentName || student.name, sessionId, timestamp,
      JSON.stringify(locationObj), scannerLat, scannerLng, 'scanner', room
    ).run();

    return NextResponse.json({ success: true, action: 'checkin', timestamp, studentName: student.name });
  } catch (error: any) {
    return serverError(error);
  }
}
