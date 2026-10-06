import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/jwt';
import { serverError } from '@/lib/auth-guard';

export const runtime = 'edge';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

async function ensureTable(db: D1Database) {
  await db.prepare(
    'CREATE TABLE IF NOT EXISTS reset_attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL, windowStart INTEGER NOT NULL)'
  ).run();
}

async function isLocked(db: D1Database, key: string): Promise<boolean> {
  const row = await db.prepare('SELECT count, windowStart FROM reset_attempts WHERE key = ?').bind(key).first<any>();
  if (!row) return false;
  if (Date.now() - row.windowStart > WINDOW_MS) return false;
  return row.count >= MAX_ATTEMPTS;
}

async function recordFailure(db: D1Database, key: string) {
  const now = Date.now();
  const row = await db.prepare('SELECT count, windowStart FROM reset_attempts WHERE key = ?').bind(key).first<any>();
  if (!row || now - row.windowStart > WINDOW_MS) {
    await db.prepare('INSERT OR REPLACE INTO reset_attempts (key, count, windowStart) VALUES (?, 1, ?)').bind(key, now).run();
  } else {
    await db.prepare('UPDATE reset_attempts SET count = count + 1 WHERE key = ?').bind(key).run();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action: string; studentId: string; phone: string; newPassword?: string };
    const { action, studentId, phone, newPassword } = body;

    if (!studentId || !phone) {
      return NextResponse.json({ error: 'กรุณากรอกรหัสนักเรียนและเบอร์โทรศัพท์' }, { status: 400 });
    }

    const db = getDb();
    await ensureTable(db);

    // Throttle per target account and per client IP to prevent brute-forcing
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const keys = [`sid:${String(studentId)}`, `ip:${ip}`];
    for (const k of keys) {
      if (await isLocked(db, k)) {
        return NextResponse.json({ error: 'พยายามหลายครั้งเกินไป กรุณารอ 15 นาทีแล้วลองใหม่' }, { status: 429 });
      }
    }

    // Verify user exists with matching studentId and phone
    const user = await db.prepare('SELECT id FROM users WHERE studentId = ? AND phone = ?').bind(studentId, phone).first<any>();

    if (!user) {
      for (const k of keys) await recordFailure(db, k);
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

      await db.prepare('DELETE FROM reset_attempts WHERE key = ?').bind(keys[0]).run();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return serverError(error, 'Reset password error:');
  }
}
