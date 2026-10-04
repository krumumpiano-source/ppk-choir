import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword, verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json() as { newPassword?: string };
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
    }

    const db = getDb();
    const passwordHash = await hashPassword(newPassword);

    await db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?')
      .bind(passwordHash, payload.id)
      .run();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
