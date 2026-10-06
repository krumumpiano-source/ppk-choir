import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, signToken, hashPassword, needsRehash } from '@/lib/jwt';
import { serverError } from '@/lib/auth-guard';
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

    if (needsRehash(user.passwordHash)) {
      try {
        const upgraded = await hashPassword(password);
        await db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').bind(upgraded, user.id).run();
      } catch (e) {
        console.error('Password rehash failed:', e);
      }
    }

    if (user.status === 'pending') {
      return NextResponse.json({ error: 'บัญชีของคุณอยู่ระหว่างรอการอนุมัติจากแอดมิน' }, { status: 403 });
    }
    if (user.status === 'rejected') {
      return NextResponse.json({ error: 'บัญชีของคุณไม่ได้รับการอนุมัติ' }, { status: 403 });
    }

    const payload = { 
      id: user.id, 
      studentId: user.studentId, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      voiceType: user.voiceType, 
      bandPosition: user.bandPosition,
      section: user.section,
      room: user.section,
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
    return serverError(error, 'Login error:');
  }
}
