import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole, serverError } from '@/lib/auth-guard';

export const runtime = 'edge';

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(['admin']);
    if (auth.error) return auth.error;
    const params = await context.params;
    const db = getDb();
    await db.prepare('DELETE FROM library WHERE id = ?').bind(params.id).run();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return serverError(error);
  }
}
