import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function POST() {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || (payload as any).role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    
    // Using batch for D1 to execute all updates efficiently
    await db.batch([
      db.prepare("UPDATE users SET name = REPLACE(name, 'นาย ', 'นาย')"),
      db.prepare("UPDATE users SET name = REPLACE(name, 'นางสาว ', 'นางสาว')"),
      db.prepare("UPDATE users SET name = REPLACE(name, 'เด็กชาย ', 'ด.ช.')"),
      db.prepare("UPDATE users SET name = REPLACE(name, 'เด็กหญิง ', 'ด.ญ.')"),
      db.prepare("UPDATE users SET name = REPLACE(name, 'ด.ช. ', 'ด.ช.')"),
      db.prepare("UPDATE users SET name = REPLACE(name, 'ด.ญ. ', 'ด.ญ.')"),
      db.prepare("UPDATE users SET name = REPLACE(name, 'น.ส. ', 'นางสาว')"),
      db.prepare("UPDATE users SET name = REPLACE(name, 'น.ส.', 'นางสาว')"),
      db.prepare("UPDATE users SET name = REPLACE(name, 'เด็กชาย', 'ด.ช.')"),
      db.prepare("UPDATE users SET name = REPLACE(name, 'เด็กหญิง', 'ด.ญ.')")
    ]);

    return NextResponse.json({ success: true, message: "Cleaned up name prefixes successfully." });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
