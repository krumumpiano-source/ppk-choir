import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

// Update live location
export async function PUT(request: Request) {
  try {
    const body = await request.json() as any;
    const { studentId, sessionId, lat, lng } = body;
    const db = getDb();
    
    if (!studentId || !sessionId || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const now = new Date().toISOString();
    await db.prepare('UPDATE checkins SET liveLat = ?, liveLng = ?, lastLocationUpdate = ? WHERE studentId = ? AND sessionId = ? AND checkoutTime IS NULL')
      .bind(lat, lng, now, studentId, sessionId).run();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
