import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'week';
    const db = getDb();
    
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);
    
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'term1') {
      startDate = new Date(now.getFullYear(), 4, 16); // May 16
      endDate = new Date(now.getFullYear(), 9, 31); // Oct 31
    } else if (period === 'term2') {
      startDate = new Date(now.getFullYear(), 10, 1); // Nov 1
      endDate = new Date(now.getFullYear() + 1, 2, 31); // Mar 31 next year
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 4, 1); // May 1 academic year start
    } else if (period === 'all') {
      startDate = new Date(2000, 0, 1);
    }
    
    const sqliteStartDate = startDate.toISOString().replace('T', ' ').slice(0, 19);
    const sqliteEndDate = endDate.toISOString().replace('T', ' ').slice(0, 19);
    
    const result = await db.prepare('SELECT checkins.*, users.voiceType as studentVoiceType FROM checkins LEFT JOIN users ON checkins.studentId = users.id WHERE checkins.timestamp >= ? AND checkins.timestamp <= ? ORDER BY checkins.timestamp DESC').bind(sqliteStartDate, sqliteEndDate).all<any>();
    
    const flatData = result.results.map((c: any) => ({
      ...c,
      location: c.location ? JSON.parse(c.location) : null
    }));
    
    return NextResponse.json({ data: flatData });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
