import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/jwt';

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
      room: row.section || 'ไม่ระบุ',
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
    const studentId = body.studentId || body.id;
    const { name, role, voiceType, status } = body;
    const section = body.section || body.room;
    const profileUrl = body.profileUrl || body.photoUrl;
    
    if (!studentId || !name) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    const db = getDb();
    
    // Check if user exists
    const existing = await db.prepare('SELECT id FROM users WHERE studentId = ?').bind(studentId).first();
    if (existing) {
      return NextResponse.json({ error: 'รหัสนักเรียนนี้ลงทะเบียนไว้แล้ว' }, { status: 400 });
    }

    // Set email and password for student login
    const email = `${studentId}@student.local`;
    const passwordHash = await hashPassword(studentId);
    
    const id = crypto.randomUUID();
    await db.prepare(
      'INSERT INTO users (id, studentId, name, email, passwordHash, role, voiceType, section, status, profileUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, 
      studentId, 
      name, 
      email, 
      passwordHash, 
      role || 'student', 
      voiceType || 'All', 
      section || '', 
      status || 'approved',
      profileUrl || ''
    ).run();
    
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
