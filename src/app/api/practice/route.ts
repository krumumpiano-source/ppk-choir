import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole, serverError } from '@/lib/auth-guard';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const auth = await requireRole();
    if (auth.error) return auth.error;
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    const db = getDb();
    
    let result;
    if (studentId) {
      result = await db.prepare('SELECT practices.*, users.studentId as actualStudentId FROM practices LEFT JOIN users ON practices.studentId = users.id WHERE practices.studentId = ? ORDER BY timestamp DESC').bind(studentId).all<any>();
    } else {
      result = await db.prepare('SELECT practices.*, users.studentId as actualStudentId FROM practices LEFT JOIN users ON practices.studentId = users.id ORDER BY timestamp DESC').all<any>();
    }
    
    return NextResponse.json({ practices: result.results });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole();
    if (auth.error) return auth.error;
    const body = await request.json() as any;
    // Non-admins can only submit for themselves; identity comes from the session
    const isAdminUser = auth.user.role === 'admin';
    const studentId = isAdminUser && body.studentId ? body.studentId : auth.user.id;
    const studentName = isAdminUser && body.studentName ? body.studentName : (auth.user.name || body.studentName);
    const { voiceType, audioUrl, reflection } = body;
    if (!audioUrl) {
      return NextResponse.json({ error: 'ไม่พบไฟล์เสียง' }, { status: 400 });
    }
    const db = getDb();
    
    const id = crypto.randomUUID();
    await db.prepare(
      'INSERT INTO practices (id, studentId, studentName, voiceType, audioUrl, reflection) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, studentId, studentName, voiceType, audioUrl, reflection).run();
    
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return serverError(error);
  }
}
