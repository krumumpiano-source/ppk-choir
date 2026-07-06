import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User } from '@/types/user';

export async function loginStudent(studentId: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const userDoc = await getDoc(doc(db, 'users', studentId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.role === 'student' || userData.role === 'section_leader') {
        const user: User = {
          id: userDoc.id,
          name: userData.name,
          voiceType: userData.voiceType,
          role: userData.role,
          room: userData.room || '',
          createdAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
        // บันทึก Session ลง LocalStorage (เพราะไม่ได้ใช้ Firebase Auth สำหรับนักเรียน)
        if (typeof window !== 'undefined') {
          localStorage.setItem('student_session', JSON.stringify(user));
        }
        return { success: true, user };
      } else {
        return { success: false, error: 'ไอดีนี้ไม่ใช่บัญชีนักเรียน' };
      }
    } else {
      return { success: false, error: 'ไม่พบรหัสนักเรียนในระบบ' };
    }
  } catch (error: any) {
    console.error('Error logging in student:', error);
    return { success: false, error: error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' };
  }
}

export async function loginAdminWithFirebase(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // 1. ตรวจสอบรหัสผ่านกับ Firestore โดยตรง (แทน Firebase Auth ที่ยังมีปัญหา)
    const adminDoc = await getDoc(doc(db, 'users', email));
    if (!adminDoc.exists()) {
      return { success: false, error: 'ไม่พบบัญชีผู้ดูแลระบบนี้' };
    }
    
    const adminData = adminDoc.data();
    if (adminData.role !== 'admin') {
      return { success: false, error: 'อีเมลนี้ไม่ใช่บัญชีผู้ดูแลระบบ' };
    }
    
    if (adminData.password !== password) {
      return { success: false, error: 'รหัสผ่านไม่ถูกต้อง' };
    }

    // 2. เรียก Server Action เพี่อเซ็ต Cookie สำหรับ Middleware
    const res = await fetch('/admin/actions/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const user: User = {
      id: email,
      name: adminData.name || 'Admin',
      voiceType: adminData.voiceType || 'All',
      role: 'admin',
      createdAt: adminData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_session', JSON.stringify(user));
    }
    
    return { success: true, user };
  } catch (error: any) {
    console.error('Error logging in admin:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' };
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (e) {
    console.error(e);
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('student_session');
    localStorage.removeItem('admin_session');
  }
}
