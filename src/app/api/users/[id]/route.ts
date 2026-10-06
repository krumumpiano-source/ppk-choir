import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/jwt';
import { requireRole, serverError, forbidden } from '@/lib/auth-guard';

export const runtime = 'edge';

type Ctx = { params: { id: string } | Promise<{ id: string }> };

const VALID_STATUSES = ['pending', 'approved', 'rejected'];

export async function DELETE(request: Request, context: Ctx) {
  try {
    const auth = await requireRole(['admin']);
    if (auth.error) return auth.error;
    const params = await context.params;
    const db = getDb();
    await db.prepare('DELETE FROM users WHERE id = ?').bind(params.id).run();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function PATCH(request: Request, context: Ctx) {
  try {
    const auth = await requireRole(['admin']);
    if (auth.error) return auth.error;

    const params = await context.params;
    const body = await request.json() as any;
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const db = getDb();
    await db.prepare('UPDATE users SET status = ? WHERE id = ?').bind(status, params.id).run();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function PUT(request: Request, context: Ctx) {
  try {
    const auth = await requireRole();
    if (auth.error) return auth.error;
    const user = auth.user;

    const params = await context.params;

    // Users may only update their own profile unless they are admin
    if (user.id !== params.id && user.role !== 'admin') {
      return forbidden();
    }

    const body = await request.json() as any;
    const db = getDb();
    
    if (body.section) {
      let section = body.section.trim();
      const sectionMatch = section.match(/^(?:ม\.|ม\.?\s*)?([1-6])\s*\/\s*([1-9][0-9]?)$/);
      if (sectionMatch) {
        body.section = `ม.${sectionMatch[1]}/${sectionMatch[2]}`;
      }
    }

    const updateFields: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'name', 'nickname', 'phone', 'lineId',
      'parentName', 'parentPhone', 'parentLineId', 'parentEmail',
      'address', 'advisorName', 'voiceType', 'bandPosition',
      'section', 'profileUrl'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (body.password) {
      if (String(body.password).length < 6) {
        return NextResponse.json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
      }
      const passwordHash = await hashPassword(String(body.password));
      updateFields.push(`passwordHash = ?`);
      values.push(passwordHash);
    }

    if (updateFields.length > 0) {
      values.push(params.id);
      await db.prepare(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`).bind(...values).run();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return serverError(error);
  }
}
