import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword, verifyToken } from '@/lib/jwt';

import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function GET() {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || (payload as any).role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const result = await db.prepare('SELECT * FROM users ORDER BY createdAt DESC').all<any>();
    
    const users = result.results.map((row: any) => ({
      id: row.id,
      studentId: row.studentId,
      name: row.name,
      nickname: row.nickname,
      email: row.email,
      phone: row.phone,
      lineId: row.lineId,
      parentName: row.parentName,
      parentPhone: row.parentPhone,
      parentLineId: row.parentLineId,
      parentEmail: row.parentEmail,
      address: row.address,
      advisorName: row.advisorName,
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
    const { name, role, voiceType, status, nickname, phone, lineId, parentName, parentPhone, parentLineId, parentEmail, address, advisorName, bandPosition } = body;
    const section = body.section || body.room;
    const profileUrl = body.profileUrl || body.photoUrl;
    
    if (!studentId || !name || !nickname || !phone || !lineId || !parentName || !parentPhone || !parentLineId || !address || !advisorName) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง (ยกเว้นอีเมลผู้ปกครอง)' }, { status: 400 });
    }

    const db = getDb();
    
    // Check if user exists
    const existing = await db.prepare('SELECT id FROM users WHERE studentId = ?').bind(studentId).first();
    if (existing) {
      return NextResponse.json({ error: 'รหัสนักเรียนนี้ลงทะเบียนไว้แล้ว' }, { status: 400 });
    }

    // Set email and password for student login
    const email = `${studentId}@ppk-choir.app`;
    const passwordHash = await hashPassword(studentId);
    
    const id = crypto.randomUUID();
    await db.prepare(
      `INSERT INTO users (
        id, studentId, name, nickname, email, phone, lineId, 
        parentName, parentPhone, parentLineId, parentEmail, address, advisorName, 
        passwordHash, role, voiceType, bandPosition, section, status, profileUrl
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, studentId, name, nickname, email, phone, lineId,
      parentName, parentPhone, parentLineId, parentEmail || '', address, advisorName,
      passwordHash, role || 'student', voiceType || 'All', bandPosition || '',
      section || '', status || 'approved', profileUrl || ''
    ).run();
    
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
