import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'week';
    const db = getDb();
    
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (period === 'year') startDate.setFullYear(now.getFullYear() - 1);
    
    const result = await db.prepare('SELECT * FROM checkins WHERE timestamp >= ? ORDER BY timestamp DESC').bind(startDate.toISOString()).all<any>();
    
    // Group by Room
    const grouped = result.results.reduce((acc: any, checkin: any) => {
      const room = checkin.room || 'ไม่ระบุห้อง';
      if (!acc[room]) acc[room] = [];
      acc[room].push({ ...checkin, location: checkin.location ? JSON.parse(checkin.location) : null });
      return acc;
    }, {});
    
    const reportData = Object.keys(grouped).map(room => ({
      room,
      count: grouped[room].length,
      students: grouped[room]
    })).sort((a, b) => a.room.localeCompare(b.room));
    
    return NextResponse.json({ data: reportData });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
