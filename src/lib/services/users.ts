import { collection, getDocs, getDoc, addDoc, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, UserRole } from '@/types/user';

export async function getAllUsers(): Promise<User[]> {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id, // Student ID or UID
        name: data.name,
        voiceType: data.voiceType,
        role: data.role as UserRole,
        status: data.status,
        photoUrl: data.photoUrl,
        room: data.room || 'ไม่ระบุห้อง',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function createUser(user: User): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = doc(db, 'users', user.id);
    
    // ตรวจสอบว่ามีผู้ใช้นี้อยู่แล้วหรือไม่
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return { success: false, error: 'รหัสนักเรียนนี้ถูกลงทะเบียนไปแล้ว' };
    }

    // ใช้ setDoc เพื่อกำหนด ID เอง (เช่น รหัสนักเรียน 65001) แทนที่จะให้ Firestore generate ให้
    await setDoc(userRef, {
      name: user.name,
      voiceType: user.voiceType,
      role: user.role,
      status: user.status || 'pending',
      photoUrl: user.photoUrl || null,
      room: user.room || 'ไม่ระบุห้อง',
      createdAt: new Date()
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, 'users', id));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, { status });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating user status:", error);
    return { success: false, error: error.message };
  }
}
