import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole, serverError, forbidden } from '@/lib/auth-guard';
import { ensureSystemTables } from '@/lib/db-schema';

export const runtime = 'edge';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(['admin', 'section_leader']);
    if (auth.error) return auth.error;

    const { id } = params;
    const body = await request.json() as any;
    const { status, adminComment } = body;

    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'สถานะไม่ถูกต้อง (ต้องเป็น approved หรือ rejected)' }, { status: 400 });
    }

    const db = getDb();
    await ensureSystemTables(db);

    const leave = await db.prepare('SELECT * FROM leaves WHERE id = ?').bind(id).first<any>();
    if (!leave) {
      return NextResponse.json({ error: 'ไม่พบคำขอลาที่ระบุ' }, { status: 404 });
    }

    const approvedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const approvedBy = auth.user.name || 'คุณครู/ผู้ดูแล';

    await db.prepare(`
      UPDATE leaves 
      SET status = ?, adminComment = ?, approvedBy = ?, approvedAt = ?
      WHERE id = ?
    `).bind(status, adminComment || null, approvedBy, approvedAt, id).run();

    return NextResponse.json({ 
      success: true, 
      status, 
      message: status === 'approved' ? 'อนุมัติการลาเรียบร้อยแล้ว' : 'ปฏิเสธคำขอลาเรียบร้อยแล้ว'
    });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole();
    if (auth.error) return auth.error;

    const { id } = params;
    const db = getDb();
    await ensureSystemTables(db);

    const leave = await db.prepare('SELECT * FROM leaves WHERE id = ?').bind(id).first<any>();
    if (!leave) {
      return NextResponse.json({ error: 'ไม่พบคำขอลาที่ระบุ' }, { status: 404 });
    }

    // Only owner (if pending) or admin can delete
    if (auth.user.role !== 'admin' && leave.studentId !== auth.user.id) {
      return forbidden();
    }
    if (auth.user.role !== 'admin' && leave.status !== 'pending') {
      return NextResponse.json({ error: 'ไม่สามารถยกเลิกคำขอที่ได้รับการตรวจสอบแล้วได้' }, { status: 400 });
    }

    await db.prepare('DELETE FROM leaves WHERE id = ?').bind(id).run();

    return NextResponse.json({ success: true, message: 'ยกเลิกคำขอลาเรียบร้อยแล้ว' });
  } catch (error: any) {
    return serverError(error);
  }
}
