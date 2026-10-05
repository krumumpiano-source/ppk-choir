import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';

// กำหนด Path ที่ต้องการป้องกัน
const protectedPaths = ['/admin', '/api'];
// Path สำหรับหน้า Login
const loginPath = '/login';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ตรวจสอบว่าเป็น path ที่อยู่ภายใต้ /admin หรือ /api หรือไม่
  const isAdminPath = pathname.startsWith('/admin');
  const isApiPath = pathname.startsWith('/api');
  const isLoginPath = pathname === loginPath;

  // ยกเว้น API บางตัวที่ไม่ต้องใช้ Token หรืออนุญาตให้ Public
  const publicApiPaths = [
    '/api/auth', // login, session
    '/api/users', // POST สำหรับลงทะเบียนต้องเปิด public, แต่ GET ควรปิด (เช็คภายใน Route อีกที)
  ];

  const isPublicApi = publicApiPaths.some(path => pathname.startsWith(path));

  // ตรวจสอบ Token
  const tokenCookie = request.cookies.get('token');
  let isAdmin = false;
  let isStudent = false;

  if (tokenCookie) {
    try {
      const payload = await verifyToken(tokenCookie.value);
      if (payload) {
        if ((payload as any).role === 'admin') isAdmin = true;
        if ((payload as any).role === 'student' || (payload as any).role === 'section_leader') isStudent = true;
      }
    } catch (e) {
      // invalid token
    }
  }

  // ป้องกันหน้า /admin
  if (isAdminPath && !isLoginPath) {
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = loginPath;
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  // ป้องกันหน้า /api ที่ไม่ใช่ Public
  if (isApiPath && !isPublicApi) {
    if (!isAdmin && !isStudent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Redirect หน้า Login ถ้าเข้าสู่ระบบแล้ว
  if (isLoginPath && isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/dashboard';
    return NextResponse.redirect(url);
  }
  
  if (isLoginPath && isStudent) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// กำหนดให้ Middleware ทำงานเฉพาะ path ที่กำหนดเพื่อประสิทธิภาพที่ดีขึ้น
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*'
  ],
};
