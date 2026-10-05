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
    
    return NextResponse.json({ 
      sessions,
      serverTime: new Date().toISOString()
    });
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
    
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

    const sets: string[] = [];
    const vals: any[] = [];
    const add = (col: string, val: any) => { sets.push(`${col} = ?`); vals.push(val); };

    if (body.name !== undefined) add('name', body.name);
    if (body.type !== undefined) add('type', body.type);
    if (body.targetGroups !== undefined) add('targetGroups', JSON.stringify(body.targetGroups || []));
    if (body.location !== undefined) add('location', body.location ? JSON.stringify(body.location) : null);
    if (body.startTime !== undefined) add('startTime', body.startTime || null);
    if (body.endTime !== undefined) add('endTime', body.endTime || null);
    if (body.isActive !== undefined) add('isActive', body.isActive ? 1 : 0);
    if (body.isRecurring !== undefined) add('isRecurring', body.isRecurring ? 1 : 0);
    if (body.daysOfWeek !== undefined) add('daysOfWeek', JSON.stringify(body.daysOfWeek || []));
    if (body.recurringStartTime !== undefined) add('recurringStartTime', body.recurringStartTime || null);
    if (body.recurringEndTime !== undefined) add('recurringEndTime', body.recurringEndTime || null);

    if (sets.length > 0) {
      await db.prepare(`UPDATE sessions SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, id).run();
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
