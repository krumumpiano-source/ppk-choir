import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken, hashPassword } from '@/lib/jwt';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function DELETE(request: Request, context: { params: { id: string } }) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || (payload as any).role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const params = context.params;
    const db = getDb();
    await db.prepare('DELETE FROM users WHERE id = ?').bind(params.id).run();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || (payload as any).role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const params = context.params;
    const body = await request.json() as any;
    const { status } = body;
    
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const db = getDb();
    await db.prepare('UPDATE users SET status = ? WHERE id = ?').bind(status, params.id).run();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const params = context.params;
    
    // Check if the user is updating their own profile OR is an admin
    if ((payload as any).id !== params.id && (payload as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as any;
    const db = getDb();
    
    const updateFields = [];
    const values = [];
    
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
      const passwordHash = await hashPassword(body.password);
      updateFields.push(`passwordHash = ?`);
      values.push(passwordHash);
    }
    
    if (updateFields.length > 0) {
      values.push(params.id);
      await db.prepare(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`).bind(...values).run();
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
