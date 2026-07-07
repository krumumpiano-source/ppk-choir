import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const body = await request.json() as any;
    const db = getDb();
    
    if (body.action === 'like') {
      await db.prepare('UPDATE practices SET likes = likes + 1 WHERE id = ?').bind(params.id).run();
    } else if (body.rubricScore) {
      const scoreStr = JSON.stringify(body.rubricScore);
      await db.prepare('UPDATE practices SET rubricScore = ?, feedback = ? WHERE id = ?').bind(scoreStr, body.feedback || '', params.id).run();
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
