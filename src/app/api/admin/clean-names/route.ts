import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function POST() {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || (payload as any).role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    
    // Fetch all users to process prefixes safely in JS
    const { results: users } = await db.prepare("SELECT id, name FROM users").all();
    
    const updates = [];
    
    for (const user of users) {
      if (!user.name) continue;
      
      const originalName = String(user.name);
      let newName = originalName.trim();
      
      // Clean up common prefixes accurately using Regex at the beginning of the string
      newName = newName.replace(/^(นาย|นางสาว|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|น\.ส\.|นส\.)\s*/, (match) => {
        const prefix = match.trim();
        if (prefix === 'เด็กชาย') return 'ด.ช.';
        if (prefix === 'เด็กหญิง') return 'ด.ญ.';
        if (prefix === 'น.ส.' || prefix === 'นส.') return 'นางสาว';
        return prefix;
      });

      if (newName !== originalName) {
        updates.push(db.prepare("UPDATE users SET name = ? WHERE id = ?").bind(newName, user.id));
      }
    }
    
    if (updates.length > 0) {
      // D1 batch limits may apply, execute in chunks of 50 to be safe
      for (let i = 0; i < updates.length; i += 50) {
        await db.batch(updates.slice(i, i + 50));
      }
    }

    return NextResponse.json({ success: true, message: `Cleaned up name prefixes successfully for ${updates.length} users.` });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
