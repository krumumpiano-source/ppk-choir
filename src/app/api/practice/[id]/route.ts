import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole, serverError } from '@/lib/auth-guard';

export const runtime = 'edge';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole();
    if (auth.error) return auth.error;

    const params = await context.params;
    const body = await request.json() as any;
    const db = getDb();

    if (body.action === 'like') {
      await db.prepare('UPDATE practices SET likes = likes + 1 WHERE id = ?').bind(params.id).run();
    } else if (body.rubricScore) {
      if (auth.user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Only admins can score' }, { status: 403 });
      }
      const scoreStr = JSON.stringify(body.rubricScore);
      await db.prepare('UPDATE practices SET rubricScore = ?, feedback = ? WHERE id = ?').bind(scoreStr, body.feedback || '', params.id).run();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return serverError(error);
  }
}
