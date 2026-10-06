import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole, serverError } from '@/lib/auth-guard';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const auth = await requireRole();
    if (auth.error) return auth.error;
    
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId') || auth.user.id;
    
    // Ensure they only fetch their own data, unless they are admin/section_leader
    if (auth.user.role !== 'admin' && auth.user.role !== 'section_leader' && auth.user.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getDb();
    const result = await db.prepare(`
      SELECT c.id, c.timestamp, c.checkoutTime, s.name as sessionName, s.type as sessionType
      FROM checkins c
      LEFT JOIN sessions s ON c.sessionId = s.id
      WHERE c.studentId = ?
      ORDER BY c.timestamp DESC
    `).bind(studentId).all();

    return NextResponse.json({ history: result.results });
  } catch (error: any) {
    return serverError(error);
  }
}
