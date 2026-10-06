import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole, serverError } from '@/lib/auth-guard';

export const runtime = 'edge';

export async function GET() {
  try {
    const auth = await requireRole(['admin']);
    if (auth.error) return auth.error;

    const db = getDb();
    
    // Count total users
    const totalUsers = await db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").first<{count: number}>();
    
    // Voice type distribution
    const voiceTypes = await db.prepare("SELECT voiceType, COUNT(*) as count FROM users WHERE role = 'student' AND voiceType != 'All' GROUP BY voiceType").all<{voiceType: string, count: number}>();
    
    // High school vs Middle school (M.1-3 vs M.4-6)
    // We assume section format "ม.X/Y"
    const m3Down = await db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND (section LIKE 'ม.1/%' OR section LIKE 'ม.2/%' OR section LIKE 'ม.3/%')").first<{count: number}>();
    const m4Up = await db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND (section LIKE 'ม.4/%' OR section LIKE 'ม.5/%' OR section LIKE 'ม.6/%')").first<{count: number}>();

    // Checkins today
    const checkinsToday = await db.prepare("SELECT COUNT(DISTINCT studentId) as count FROM checkins WHERE date(timestamp, '+7 hours') = date('now', '+7 hours')").first<{count: number}>();

    return NextResponse.json({
      totalStudents: totalUsers?.count || 0,
      middleSchool: m3Down?.count || 0,
      highSchool: m4Up?.count || 0,
      voiceTypes: voiceTypes.results,
      checkinsToday: checkinsToday?.count || 0
    });

  } catch (error: any) {
    return serverError(error);
  }
}
