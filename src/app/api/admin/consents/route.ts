import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole, serverError } from '@/lib/auth-guard';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['admin', 'section_leader']);
    if (auth.error) return auth.error;
    
    const db = getDb();
    const result = await db.prepare(`
      SELECT c.*, u.name as studentName, u.studentId as actualStudentId, u.voiceType, u.section
      FROM consents c
      JOIN users u ON c.studentId = u.id
      ORDER BY c.timestamp DESC
    `).all();
    
    return NextResponse.json({ consents: result.results });
  } catch (error: any) {
    return serverError(error);
  }
}
