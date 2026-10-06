import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole, serverError } from '@/lib/auth-guard';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const auth = await requireRole();
    if (auth.error) return auth.error;
    
    const db = getDb();
    const studentId = auth.user.id;
    
    const record = await db.prepare('SELECT * FROM consents WHERE studentId = ?').bind(studentId).first();
    
    return NextResponse.json({ consent: record || null });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole();
    if (auth.error) return auth.error;

    const body = await request.json() as any;
    const { isAllowed, parentName, signatureData } = body;
    
    if (isAllowed === undefined || !parentName || !signatureData) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    const db = getDb();
    const studentId = auth.user.id;
    const id = crypto.randomUUID();
    
    // Check if already submitted
    const existing = await db.prepare('SELECT id FROM consents WHERE studentId = ?').bind(studentId).first();
    if (existing) {
      return NextResponse.json({ error: 'คุณส่งใบขออนุญาตแล้ว' }, { status: 400 });
    }

    await db.prepare(`
      INSERT INTO consents (id, studentId, isAllowed, parentName, signatureData)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, studentId, isAllowed ? 1 : 0, parentName, signatureData).run();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return serverError(error);
  }
}
