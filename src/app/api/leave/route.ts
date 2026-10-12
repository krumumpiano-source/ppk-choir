import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole, serverError } from '@/lib/auth-guard';
import { ensureSystemTables } from '@/lib/db-schema';
import { verifyAndRegisterDevice } from '@/lib/device-server';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const auth = await requireRole();
    if (auth.error) return auth.error;

    const db = getDb();
    await ensureSystemTables(db);

    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status'); // 'pending' | 'approved' | 'rejected' | 'all'
    const studentIdFilter = url.searchParams.get('studentId');

    const isAdminOrLeader = auth.user.role === 'admin' || auth.user.role === 'section_leader';

    let query = `
      SELECT leaves.*, users.voiceType, users.bandPosition, users.section as room, users.studentId as actualStudentId, users.profileUrl, users.nickname
      FROM leaves
      LEFT JOIN users ON leaves.studentId = users.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (!isAdminOrLeader) {
      // Normal students can only view their own leaves
      conditions.push('leaves.studentId = ?');
      params.push(auth.user.id);
    } else if (studentIdFilter) {
      conditions.push('leaves.studentId = ?');
      params.push(studentIdFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      conditions.push('leaves.status = ?');
      params.push(statusFilter);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY leaves.createdAt DESC';

    const result = await db.prepare(query).bind(...params).all<any>();

    return NextResponse.json({
      leaves: result.results || []
    });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole();
    if (auth.error) return auth.error;

    const body = await request.json() as any;
    const { 
      leaveDate, 
      sessionId, 
      sessionName, 
      leaveType, 
      reason, 
      attachmentUrl,
      deviceId,
      deviceModel
    } = body;

    if (!leaveDate) {
      return NextResponse.json({ error: 'กรุณาระบุวันที่ที่ต้องการลา' }, { status: 400 });
    }
    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุเหตุผลการลา' }, { status: 400 });
    }

    const studentId = auth.user.id;
    const studentName = auth.user.name || 'นักเรียน';

    const db = getDb();
    await ensureSystemTables(db);

    // Get IP address from headers
    const clientIp = request.headers.get('cf-connecting-ip') || 
                     request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     '';
    const userAgent = request.headers.get('user-agent') || '';

    // Verify device and track fraud / device attribution
    const { isSuspicious, deviceNote } = await verifyAndRegisterDevice(
      db,
      studentId,
      studentName,
      deviceId,
      deviceModel,
      userAgent,
      clientIp
    );

    const id = crypto.randomUUID();

    await db.prepare(`
      INSERT INTO leaves (
        id, studentId, studentName, leaveDate, sessionId, sessionName,
        leaveType, reason, attachmentUrl, status,
        deviceId, deviceModel, ipAddress, isSuspicious, deviceNote
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
    `).bind(
      id,
      studentId,
      studentName,
      leaveDate,
      sessionId || null,
      sessionName || 'ซ้อมประจำวัน',
      leaveType || 'business',
      reason.trim(),
      attachmentUrl || null,
      deviceId || null,
      deviceModel || 'Unknown Device',
      clientIp,
      isSuspicious,
      deviceNote
    ).run();

    return NextResponse.json({ 
      success: true, 
      id,
      message: 'ยื่นคำขอลาเรียบร้อยแล้ว รอคุณครูตรวจสอบและอนุมัติ'
    });
  } catch (error: any) {
    return serverError(error);
  }
}
