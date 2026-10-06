import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { requireRole, serverError } from '@/lib/auth-guard';

export const runtime = 'edge';

// Update live location
export async function PUT(request: Request) {
  try {
    const auth = await requireRole();
    if (auth.error) return auth.error;

    const body = await request.json() as any;
    const { sessionId, lat, lng } = body;
    const db = getDb();
    const isAdminUser = auth.user.role === 'admin';
    const studentId = isAdminUser && body.studentId ? body.studentId : auth.user.id;
    
    if (!studentId || !sessionId || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const now = new Date().toISOString();
    await db.prepare('UPDATE checkins SET liveLat = ?, liveLng = ?, lastLocationUpdate = ? WHERE studentId = ? AND sessionId = ? AND checkoutTime IS NULL')
      .bind(lat, lng, now, studentId, sessionId).run();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return serverError(error);
  }
}
