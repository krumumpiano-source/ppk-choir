import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// กำหนด Path ที่ต้องการป้องกัน
const protectedPaths = ['/admin'];
// Path สำหรับหน้า Login
const loginPath = '/login';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ตรวจสอบว่าเป็น path ที่อยู่ภายใต้ /admin หรือไม่
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isLoginPath = pathname === loginPath;
  const isLoginAction = pathname === '/admin/actions/login';

  if (isProtectedPath && !isLoginPath && !isLoginAction) {
    // TODO: แทนที่ด้วยระบบ Auth จริง (เช่น อ่านจาก Session Cookie, JWT, หรือ Firebase Auth Token)
    const isAdmin = request.cookies.has('admin_session');

    if (!isAdmin) {
      // ถ้าไม่ได้ Login เป็น Admin ให้ Redirect ไปหน้า Login
      const url = request.nextUrl.clone();
      url.pathname = loginPath;
      // เก็บ URL เดิมไว้ใน query string เผื่อให้กลับมาหลังจาก login เสร็จ
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }
  
  if (isLoginPath) {
     const isAdmin = request.cookies.has('admin_session');
     if (isAdmin) {
        // ถ้าเข้าหน้า login แต่มี session แล้ว ให้กลับไปหน้า dashboard
        const url = request.nextUrl.clone();
        url.pathname = '/admin/dashboard';
        return NextResponse.redirect(url);
     }
  }

  return NextResponse.next();
}

// กำหนดให้ Middleware ทำงานเฉพาะ path ที่กำหนดเพื่อประสิทธิภาพที่ดีขึ้น
export const config = {
  matcher: [
    '/admin/:path*'
  ],
};
