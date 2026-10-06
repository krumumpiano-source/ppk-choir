import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole, serverError } from '@/lib/auth-guard';

export const runtime = 'edge';

export async function GET() {
  try {
    const auth = await requireRole(['admin', 'section_leader']);
    if (auth.error) return auth.error;
    const db = getDb();
    
    // Fetch users along with their latest audition record if exists
    const query = `
      SELECT 
        u.id as userId,
        u.studentId,
        u.name,
        u.nickname,
        u.voiceType,
        u.role,
        u.section,
        u.profileUrl,
        u.bandPosition,
        a.id as auditionId,
        a.lowestNote,
        a.highestNote,
        a.timbreQuality,
        a.pitchAccuracy,
        a.auditedBy,
        a.auditedAt,
        a.notes
      FROM users u
      LEFT JOIN auditions a ON u.id = a.studentId
      ORDER BY u.name ASC
    `;

    const result = await db.prepare(query).all<any>();

    const students = result.results.map((row: any) => ({
      id: row.userId,
      studentId: row.studentId,
      name: row.name,
      nickname: row.nickname,
      voiceType: row.voiceType || 'Unassigned',
      role: row.role,
      section: row.section || 'ไม่ระบุ',
      profileUrl: row.profileUrl,
      bandPosition: row.bandPosition || '',
      audition: row.auditionId ? {
        id: row.auditionId,
        lowestNote: row.lowestNote,
        highestNote: row.highestNote,
        timbreQuality: row.timbreQuality || 'Medium',
        pitchAccuracy: row.pitchAccuracy || 5,
        auditedBy: row.auditedBy || '',
        auditedAt: row.auditedAt,
        notes: row.notes || '',
      } : null
    }));

    return NextResponse.json({ students });
  } catch (error: any) {
    return serverError(error, 'GET Auditions API Error:');
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(['admin', 'section_leader']);
    if (auth.error) return auth.error;
    const body = await request.json() as any;
    const { studentId, lowestNote, highestNote, timbreQuality, pitchAccuracy, notes } = body;
    // Auditor identity comes from the session, not the request body
    const auditedBy = auth.user.name || (auth.user.role === 'admin' ? 'Admin' : 'Section Leader');

    if (!studentId || !lowestNote || !highestNote) {
      return NextResponse.json({ error: 'กรุณาระบุข้อมูลคีย์ต่ำสุดและคีย์สูงสุดให้ครบถ้วน' }, { status: 400 });
    }

    const db = getDb();

    // Check if audition record exists for student
    const existing = await db.prepare('SELECT id FROM auditions WHERE studentId = ?').bind(studentId).first<any>();

    if (existing) {
      // Update existing audition
      await db.prepare(`
        UPDATE auditions 
        SET lowestNote = ?, highestNote = ?, timbreQuality = ?, pitchAccuracy = ?, notes = ?, auditedBy = ?, auditedAt = CURRENT_TIMESTAMP
        WHERE studentId = ?
      `).bind(
        lowestNote,
        highestNote,
        timbreQuality || 'Medium',
        pitchAccuracy || 5,
        notes || '',
        auditedBy,
        studentId
      ).run();
    } else {
      // Insert new audition
      const id = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO auditions (id, studentId, lowestNote, highestNote, timbreQuality, pitchAccuracy, notes, auditedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        studentId,
        lowestNote,
        highestNote,
        timbreQuality || 'Medium',
        pitchAccuracy || 5,
        notes || '',
        auditedBy
      ).run();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return serverError(error, 'POST Auditions API Error:');
  }
}
