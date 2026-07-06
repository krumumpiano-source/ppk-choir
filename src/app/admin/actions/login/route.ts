import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    // เซ็ต Cookie เพื่อให้ Middleware อนุญาตให้เข้าถึงหน้า /admin ได้
    // (การตรวจสอบสิทธิ์เชิงลึกจริงๆ จะเกิดขึ้นฝั่ง Client ผ่าน AuthProvider อีกชั้น)
    (await cookies()).set('admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
