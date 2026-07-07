import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json() as any;
    const { studentId, name, email, password, voiceType, section } = body;

    if (!studentId || !name || !email || !password || !voiceType || !section) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    const db = getDb();

    // Check if user exists
    const existing = await db.prepare('SELECT id FROM users WHERE email = ? OR studentId = ?').bind(email, studentId).first();
    if (existing) {
      return NextResponse.json({ error: 'อีเมล หรือ รหัสนักเรียน นี้มีผู้ใช้งานแล้ว' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const id = crypto.randomUUID();

    await db.prepare(
      'INSERT INTO users (id, studentId, name, email, passwordHash, role, voiceType, section) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, studentId, name, email, hashedPassword, 'student', voiceType, section).run();

    // Generate token
    const user = { id, studentId, name, email, role: 'student', voiceType, section };
    const token = await signToken(user);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
