import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('active') === 'true';
    const db = getDb();
    
    let result;
    if (activeOnly) {
      result = await db.prepare('SELECT * FROM sessions WHERE isActive = 1 ORDER BY createdAt DESC').all<any>();
    } else {
      result = await db.prepare('SELECT * FROM sessions ORDER BY createdAt DESC').all<any>();
    }
    
    const sessions = result.results.map((r: any) => ({
      ...r,
      targetGroups: r.targetGroups ? JSON.parse(r.targetGroups) : [],
      location: r.location ? JSON.parse(r.location) : null,
      daysOfWeek: r.daysOfWeek ? JSON.parse(r.daysOfWeek) : []
    }));
    
    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as any;
    const db = getDb();
    const id = crypto.randomUUID();
    
    await db.prepare(`
      INSERT INTO sessions (id, name, type, targetGroups, location, startTime, endTime, isActive, isRecurring, daysOfWeek, recurringStartTime, recurringEndTime)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.name, body.type, JSON.stringify(body.targetGroups || []),
      body.location ? JSON.stringify(body.location) : null,
      body.startTime || null, body.endTime || null, body.isActive ? 1 : 0,
      body.isRecurring ? 1 : 0, JSON.stringify(body.daysOfWeek || []),
      body.recurringStartTime || null, body.recurringEndTime || null
    ).run();
    
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as any;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const db = getDb();
    
    if (body.isActive !== undefined) {
      await db.prepare('UPDATE sessions SET isActive = ? WHERE id = ?').bind(body.isActive ? 1 : 0, id).run();
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const db = getDb();
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(id).run();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
