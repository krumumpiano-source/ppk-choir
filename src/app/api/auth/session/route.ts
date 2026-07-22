import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('token');
    
    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ user: null });
    }

    const payload = await verifyToken(tokenCookie.value);
    
    if (!payload) {
      return NextResponse.json({ user: null });
    }
    
    // Optionally fetch latest user data from DB to ensure it's up to date
    const db = getDb();
    const user = await db.prepare('SELECT id, studentId, name, email, role, voiceType, section, profileUrl FROM users WHERE id = ?').bind(payload.id).first<any>();
    
    if (!user) {
      return NextResponse.json({ user: null });
    }

    const userWithRoom = {
      ...user,
      room: user.section
    };

    return NextResponse.json({ user: userWithRoom });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
