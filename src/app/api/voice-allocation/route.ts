import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'edge';

const DEFAULT_TARGET_RATIOS: Record<string, number> = {
  'Soprano 1': 15,
  'Soprano 2': 15,
  'Alto 1': 15,
  'Alto 2': 15,
  'Tenor 1': 10,
  'Tenor 2': 10,
  'Baritone': 10,
  'Bass': 10,
};

export async function GET() {
  try {
    const db = getDb();
    
    // Fetch target ratios settings
    const settingRow = await db.prepare('SELECT data FROM settings WHERE id = ?').bind('voice_ratios').first<any>();
    let ratios = DEFAULT_TARGET_RATIOS;

    if (settingRow && settingRow.data) {
      try {
        ratios = JSON.parse(settingRow.data);
      } catch (e) {
        console.error('Error parsing settings JSON:', e);
      }
    }

    return NextResponse.json({ ratios });
  } catch (error: any) {
    console.error('GET Voice Allocation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as any;
    const { action, ratios, assignments } = body;
    const db = getDb();

    if (action === 'save_ratios' && ratios) {
      const dataStr = JSON.stringify(ratios);
      const existing = await db.prepare('SELECT id FROM settings WHERE id = ?').bind('voice_ratios').first<any>();
      if (existing) {
        await db.prepare('UPDATE settings SET data = ? WHERE id = ?').bind(dataStr, 'voice_ratios').run();
      } else {
        await db.prepare('INSERT INTO settings (id, data) VALUES (?, ?)').bind('voice_ratios', dataStr).run();
      }
      return NextResponse.json({ success: true, message: 'บันทึกอัตราส่วนเรียบร้อยแล้ว' });
    }

    if (action === 'confirm_assignments' && Array.isArray(assignments)) {
      // Batch update user voice parts
      for (const item of assignments) {
        if (item.userId && item.voiceType) {
          await db.prepare('UPDATE users SET voiceType = ? WHERE id = ?').bind(item.voiceType, item.userId).run();
        }
      }
      return NextResponse.json({ success: true, message: `อัปเดตแนวเสียงของนักเรียน ${assignments.length} คนเรียบร้อยแล้ว` });
    }

    return NextResponse.json({ error: 'Action ไม่ถูกต้อง' }, { status: 400 });
  } catch (error: any) {
    console.error('POST Voice Allocation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
