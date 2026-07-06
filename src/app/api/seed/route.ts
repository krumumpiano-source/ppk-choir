import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function GET() {
  try {
    const adminId = 'admin01';
    
    // ตรวจสอบว่ามี admin หรือยัง
    const adminRef = doc(db, 'users', adminId);
    const adminSnap = await getDoc(adminRef);
    
    if (adminSnap.exists()) {
      return NextResponse.json({ message: 'บัญชีผู้ดูแลระบบ (Admin) มีอยู่แล้ว', id: adminId });
    }

    // สร้างบัญชี Admin เริ่มต้น
    await setDoc(adminRef, {
      name: 'ผู้ดูแลระบบ PPK CHOIR',
      role: 'admin',
      voiceType: 'All',
      createdAt: new Date()
    });

    return NextResponse.json({ message: 'สร้างบัญชีผู้ดูแลระบบสำเร็จ', id: adminId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
