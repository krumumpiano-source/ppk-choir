import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    if (!studentId) {
      return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
    }
    
    const db = getDb();
    const result = await db.prepare('SELECT * FROM gamification WHERE studentId = ?').bind(studentId).first<any>();
    
    if (result) {
      return NextResponse.json({ stats: { ...result, badges: result.badges ? JSON.parse(result.badges) : [] } });
    } else {
      return NextResponse.json({ stats: { studentId, streak: 0, lastPracticeDate: '', badges: [] } });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as any;
    const { studentId, action, badgeId } = body;
    const db = getDb();
    
    // Fetch current stats
    let stats = await db.prepare('SELECT * FROM gamification WHERE studentId = ?').bind(studentId).first<any>();
    if (!stats) {
      stats = { studentId, streak: 0, lastPracticeDate: '', badges: '[]' };
      await db.prepare('INSERT INTO gamification (studentId, streak, lastPracticeDate, badges) VALUES (?, ?, ?, ?)').bind(studentId, 0, '', '[]').run();
    }
    
    let badgesArray = stats.badges ? JSON.parse(stats.badges) : [];
    
    if (action === 'update_streak') {
      const today = new Date().toISOString().split('T')[0];
      if (stats.lastPracticeDate === today) {
        return NextResponse.json({ success: true, stats: { ...stats, badges: badgesArray } });
      }
      
      let newStreak = stats.streak;
      if (!stats.lastPracticeDate) {
        newStreak = 1;
        if (!badgesArray.includes('first_note')) badgesArray.push('first_note');
      } else {
        const lastDate = new Date(stats.lastPracticeDate);
        const currentDate = new Date(today);
        const diffDays = Math.ceil(Math.abs(currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) newStreak += 1;
        else if (diffDays > 1) newStreak = 1;
      }
      
      if (newStreak >= 3 && !badgesArray.includes('streak_3')) badgesArray.push('streak_3');
      if (newStreak >= 7 && !badgesArray.includes('streak_7')) badgesArray.push('streak_7');
      
      await db.prepare('UPDATE gamification SET streak = ?, lastPracticeDate = ?, badges = ? WHERE studentId = ?').bind(newStreak, today, JSON.stringify(badgesArray), studentId).run();
      
      return NextResponse.json({ success: true, stats: { studentId, streak: newStreak, lastPracticeDate: today, badges: badgesArray } });
    } else if (action === 'award_badge' && badgeId) {
      if (!badgesArray.includes(badgeId)) {
        badgesArray.push(badgeId);
        await db.prepare('UPDATE gamification SET badges = ? WHERE studentId = ?').bind(JSON.stringify(badgesArray), studentId).run();
      }
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
