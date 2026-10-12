import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['admin']);
    if (auth.error) return auth.error;

    const db = getDb();
    const url = new URL(request.url);
    const name = url.searchParams.get('name') || 'ธนทัต';

    // 1. Inspect specific student
    const studentCheckins = await db.prepare(`
      SELECT 
        checkins.id,
        checkins.studentId,
        checkins.studentName,
        checkins.sessionId,
        sessions.name as sessionName,
        sessions.isRecurring,
        checkins.timestamp,
        checkins.checkoutTime,
        datetime(replace(checkins.timestamp, 'T', ' '), '+7 hours') as thaiTimestamp,
        datetime(replace(checkins.checkoutTime, 'T', ' '), '+7 hours') as thaiCheckoutTime,
        date(replace(checkins.timestamp, 'T', ' '), '+7 hours') as thaiDate,
        date('now', '+7 hours') as serverThaiToday,
        checkins.devicePlatform,
        checkins.deviceId,
        checkins.deviceModel,
        checkins.isSuspicious,
        checkins.deviceNote,
        users.studentId as actualStudentId,
        users.name as userName,
        users.section as room
      FROM checkins
      LEFT JOIN users ON checkins.studentId = users.id
      LEFT JOIN sessions ON checkins.sessionId = sessions.id
      WHERE users.name LIKE ? OR checkins.studentName LIKE ? OR users.studentId LIKE ?
      ORDER BY checkins.timestamp DESC
      LIMIT 10
    `).bind(`%${name}%`, `%${name}%`, `%${name}%`).all<any>();

    // 2. Inspect active sessions
    const activeSessions = await db.prepare(`
      SELECT id, name, isRecurring, daysOfWeek, recurringStartTime, recurringEndTime, startTime, endTime, isActive
      FROM sessions
      WHERE isActive = 1
    `).all<any>();

    // 3. Inspect recent checkins today vs past days
    const recentCheckins = await db.prepare(`
      SELECT 
        checkins.studentName,
        sessions.name as sessionName,
        checkins.timestamp,
        date(replace(checkins.timestamp, 'T', ' '), '+7 hours') as thaiDate,
        date('now', '+7 hours') as serverThaiToday,
        checkins.checkoutTime
      FROM checkins
      LEFT JOIN sessions ON checkins.sessionId = sessions.id
      ORDER BY checkins.timestamp DESC
      LIMIT 15
    `).all<any>();

    return NextResponse.json({
      query: name,
      serverTimeUtc: new Date().toISOString(),
      serverThaiToday: (recentCheckins.results?.[0] as any)?.serverThaiToday,
      studentCheckins: studentCheckins.results || [],
      activeSessions: activeSessions.results || [],
      recentCheckins: recentCheckins.results || []
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
