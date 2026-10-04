import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/jwt';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action: string; studentId: string; phone: string; newPassword?: string };
    const { action, studentId, phone, newPassword } = body;

    if (!studentId || !phone) {
      return NextResponse.json({ error: 'กรุณากรอกรหัสนักเรียนและเบอร์โทรศัพท์' }, { status: 400 });
    }

    const db = getDb();
    
    // Verify user exists with matching studentId and phone
    const user = await db.prepare('SELECT id FROM users WHERE studentId = ? AND phone = ?').bind(studentId, phone).first();
    
    if (!user) {
      return NextResponse.json({ error: 'รหัสนักเรียนหรือเบอร์โทรศัพท์ไม่ถูกต้อง' }, { status: 404 });
    }

    if (action === 'verify') {
      return NextResponse.json({ success: true });
    }

    if (action === 'reset') {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
      }

      const passwordHash = await hashPassword(newPassword);

      await db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?')
        .bind(passwordHash, user.id)
        .run();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
