import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole, serverError } from '@/lib/auth-guard';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    // Only admins or section leaders can scan
    const auth = await requireRole(['admin', 'section_leader']);
    if (auth.error) return auth.error;

    const body = await request.json() as any;
    const { studentId, studentName, sessionId, qrTimestamp } = body;
    
    if (!studentId || !sessionId) {
      return NextResponse.json({ error: 'ข้อมูล QR Code ไม่สมบูรณ์' }, { status: 400 });
    }

    // 1. Validate Dynamic QR Code Timestamp (Required to prevent screenshot sharing)
    if (!qrTimestamp) {
      return NextResponse.json({ error: 'QR Code รูปแบบเก่าไม่อนุญาตให้ใช้งาน กรุณารีเฟรชหน้าเว็บเพื่อรับ QR ล่าสุด' }, { status: 400 });
    }
    
    const now = Date.now();
    const qrTime = parseInt(qrTimestamp, 10);
    // If QR code is older than 60 seconds (60000 ms) or invalid, reject it
    if (isNaN(qrTime) || now - qrTime > 60000) {
      return NextResponse.json({ error: 'QR Code หมดอายุแล้ว (กรุณาให้ผู้เรียนเปิดหน้าเว็บใหม่เพื่อรับ QR ล่าสุด)' }, { status: 400 });
    }

    const db = getDb();
    
    // Check if session exists and is active
    const session = await db.prepare('SELECT * FROM sessions WHERE id = ?').bind(sessionId).first();
    if (!session) {
      return NextResponse.json({ error: 'ไม่พบกิจกรรมที่อ้างถึง' }, { status: 404 });
    }

    // Ensure student exists and get details
    const student = await db.prepare('SELECT * FROM users WHERE id = ?').bind(studentId).first<{id: string, name: string, room: string, studentId: string, profileUrl?: string, photoUrl?: string, section?: string}>();
    if (!student) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลนักเรียนนี้ในระบบ' }, { status: 404 });
    }
    
    const profilePic = student.profileUrl || student.photoUrl || null;

    // Check if already checked in TODAY for this session
    // Replace 'T' with ' ' to ensure compatibility with older SQLite date() parsers
    const existing = await db.prepare(`
      SELECT id, timestamp, checkoutTime 
      FROM checkins 
      WHERE studentId = ? AND sessionId = ? 
      AND date(replace(timestamp, 'T', ' '), '+7 hours') = date('now', '+7 hours')
      ORDER BY timestamp DESC
    `).bind(studentId, sessionId).first<{id: string, timestamp: string, checkoutTime: string | null}>();
    
    // Use format YYYY-MM-DD HH:MM:SS for safe SQLite insertion
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (existing) {
      if (!existing.checkoutTime) {
        // Prevent accidental double scans instantly. Require at least 15 minutes (900000ms) between check-in and check-out.
        const checkinTimeMs = new Date(existing.timestamp).getTime();
        const nowMs = new Date(timestamp).getTime();
        if (nowMs - checkinTimeMs < 15 * 60 * 1000) {
          return NextResponse.json({ error: 'เพิ่งเช็คชื่อเข้าเมื่อสักครู่ (ป้องกันการสแกนซ้ำ)' }, { status: 400 });
        }
        
        // They are checked in, but not checked out. So this scan means Check-Out!
        await db.prepare('UPDATE checkins SET checkoutTime = ? WHERE id = ?').bind(timestamp, existing.id).run();
        return NextResponse.json({ success: true, action: 'checkout', timestamp, studentName: studentName || student.name, profileUrl: profilePic });
      } else {
        // Already checked out
        return NextResponse.json({ error: 'นักเรียนคนนี้เช็คชื่อเข้าและออกไปแล้ว' }, { status: 400 });
      }
    }

    // Insert Checkin record
    const id = crypto.randomUUID();
    // Safely parse session location
    let scannerLat = body.lat || 0;
    let scannerLng = body.lng || 0;
    
    if (!scannerLat || !scannerLng) {
      if (session.location && typeof session.location === 'string' && session.location.includes('{')) {
        try {
          const parsed = JSON.parse(session.location);
          scannerLat = scannerLat || parsed.lat || 0;
          scannerLng = scannerLng || parsed.lng || 0;
        } catch (e) {
          console.error("Failed to parse session location:", e);
        }
      }
    }

    const room = student.room || student.section || 'ไม่ระบุห้อง';
    
    // Create simple object to store in DB
    const locationObj = { lat: scannerLat, lng: scannerLng };

    await db.prepare(`
      INSERT INTO checkins (id, studentId, studentName, sessionId, timestamp, location, liveLat, liveLng, devicePlatform, room)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, studentId, studentName || student.name, sessionId, timestamp,
      JSON.stringify(locationObj), scannerLat, scannerLng, 'scanner', room
    ).run();

    return NextResponse.json({ success: true, action: 'checkin', timestamp, studentName: studentName || student.name, profileUrl: profilePic });
  } catch (error: any) {
    console.error('SCAN_ERROR_CAUGHT:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
