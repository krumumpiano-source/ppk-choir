import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole, serverError } from '@/lib/auth-guard';
import { ensureSystemTables } from '@/lib/db-schema';

export const runtime = 'edge';

function safeParse(value: any, fallback: any) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

export async function GET(request: Request) {
  try {
    const auth = await requireRole();
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const dateStr = url.searchParams.get('date'); // YYYY-MM-DD
    if (!dateStr) {
      return NextResponse.json({ error: 'กรุณาระบุวันที่ (date)' }, { status: 400 });
    }

    const db = getDb();
    await ensureSystemTables(db);

    // Target day of week in Thailand timezone (UTC+7)
    // Create Date object from dateStr at noon UTC to avoid timezone shift
    const targetDate = new Date(`${dateStr}T12:00:00Z`);
    const dayOfWeek = targetDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday

    const allSessionsResult = await db.prepare('SELECT * FROM sessions ORDER BY createdAt DESC').all<any>();
    const userVoice = auth.user.voiceType;
    const userBand = auth.user.bandPosition;

    const matchedSessions = (allSessionsResult.results || []).filter((s: any) => {
      const targetGroups = safeParse(s.targetGroups, []);
      // Check target group eligibility
      const isTargetValid = 
        targetGroups.length === 0 || 
        targetGroups.includes('All') || 
        (userVoice && targetGroups.includes(userVoice)) || 
        (userBand && targetGroups.includes(userBand));

      if (!isTargetValid && auth.user.role === 'student') return false;

      // Check recurring
      if (s.isRecurring) {
        const days = safeParse(s.daysOfWeek, []);
        return days.includes(dayOfWeek);
      }

      // Check one-time
      if (s.startTime) {
        const sDate = s.startTime.slice(0, 10);
        return sDate === dateStr;
      }

      return true;
    }).map((s: any) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      time: s.isRecurring 
        ? `${s.recurringStartTime || ''} - ${s.recurringEndTime || ''}` 
        : `${(s.startTime || '').slice(11, 16)} - ${(s.endTime || '').slice(11, 16)}`
    }));

    return NextResponse.json({
      date: dateStr,
      dayOfWeek,
      sessions: matchedSessions
    });
  } catch (error: any) {
    return serverError(error);
  }
}
