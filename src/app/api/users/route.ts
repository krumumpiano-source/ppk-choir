import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

export async function GET() {
  try {
    const db = getDb();
    const result = await db.prepare('SELECT * FROM users ORDER BY createdAt DESC').all<any>();
    
    const users = result.results.map((row: any) => ({
      id: row.id,
      studentId: row.studentId,
      name: row.name,
      voiceType: row.voiceType,
      role: row.role,
      status: row.status || 'approved',
      photoUrl: row.profileUrl,
      section: row.section || 'ไม่ระบุ',
      createdAt: row.createdAt
    }));
    
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as any;
    const { studentId, name, role, voiceType, section } = body;
    const db = getDb();
    
    const id = crypto.randomUUID();
    await db.prepare(
      'INSERT INTO users (id, studentId, name, role, voiceType, section) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, studentId, name, role || 'student', voiceType || 'All', section || '').run();
    
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
