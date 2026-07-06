import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { doc, setDoc } from 'firebase/firestore';

export async function GET() {
  const email = 'krumum.piano@gmail.com';
  // ตั้งรหัสผ่านเริ่มต้นให้คุณครู
  const password = '123456';

  try {
    // 2. Create User Document in Firestore
    await setDoc(doc(db, 'users', email), {
      name: 'ครูมัม (Admin)',
      role: 'admin',
      voiceType: 'All',
      status: 'approved',
      password: password, // เก็บแบบง่ายๆ ชั่วคราวไปก่อน
      createdAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Admin account created successfully in Firestore',
      email: email,
      password: password
    });
  } catch (error: any) {
    console.error("CREATE ADMIN ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
