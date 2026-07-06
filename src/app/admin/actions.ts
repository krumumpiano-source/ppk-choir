'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAdmin(formData: FormData) {
  const email = formData.get('email')
  const password = formData.get('password')

  // Mock authentication logic
  // ในอนาคตสามารถเปลี่ยนไปเช็คกับ Database หรือ Firebase ได้
  if (email === 'admin@school.ac.th' && password === 'password') {
    // กำหนด Cookie เพื่อจำลอง Session
    (await cookies()).set('admin_session', 'mock-session-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    })
    
    // Redirect ไปหน้า Dashboard หลังจาก Login สำเร็จ
    redirect('/admin/dashboard')
  } else {
    return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
  }
}

export async function logoutAdmin() {
  (await cookies()).delete('admin_session')
  redirect('/login')
}
