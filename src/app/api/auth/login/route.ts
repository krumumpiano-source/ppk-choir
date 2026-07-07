import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json() as any;
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' }, { status: 400 });
    }

    const db = getDb();
    const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<any>();

    if (!user) {
      return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const payload = { 
      id: user.id, 
      studentId: user.studentId, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      voiceType: user.voiceType, 
      section: user.section,
      profileUrl: user.profileUrl
    };
    
    const token = await signToken(payload);

    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return NextResponse.json({ success: true, user: payload });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
