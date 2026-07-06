import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface CheckInRecord {
  id?: string;
  studentId: string;
  studentName: string;
  location: { lat: number; lng: number } | null;
  devicePlatform: string;
  room?: string;
  timestamp?: any;
  sessionId?: string; // เพิ่ม sessionId เพื่อผูกกับการเปิดคาบเรียน
}

// กำหนดค่า Default หากยังไม่มีใน DB
export const DEFAULT_CHECKIN_SETTINGS = {
  lat: 13.7563,
  lng: 100.5018,
  radius: 10
};

export async function getCheckInSettings() {
  try {
    const docRef = doc(db, 'settings', 'checkin');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as typeof DEFAULT_CHECKIN_SETTINGS;
    }
    return DEFAULT_CHECKIN_SETTINGS;
  } catch (error) {
    console.error('Error getting check-in settings:', error);
    return DEFAULT_CHECKIN_SETTINGS;
  }
}

export async function updateCheckInSettings(settings: typeof DEFAULT_CHECKIN_SETTINGS) {
  try {
    const docRef = doc(db, 'settings', 'checkin');
    await setDoc(docRef, settings, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error updating check-in settings:', error);
    return { success: false, error };
  }
}

// ตรวจสอบคาบเรียนที่เปิดอยู่ล่าสุด
export async function getActiveSession() {
  try {
    const q = query(collection(db, 'sessions'), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
      // Sort manually to find the most recent one (to avoid composite index error)
      docs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      return docs[0];
    }
    return null;
  } catch (error) {
    console.error('Error getting active session:', error);
    return null;
  }
}

export async function createSession(name: string) {
  try {
    const docRef = await addDoc(collection(db, 'sessions'), {
      name,
      isActive: true,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating session:', error);
    return { success: false, error };
  }
}

export async function endSession(sessionId: string) {
  try {
    await updateDoc(doc(db, 'sessions', sessionId), {
      isActive: false,
      endedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error ending session:', error);
    return { success: false, error };
  }
}

export async function saveCheckIn(data: CheckInRecord) {
  try {
    // ป้องกันการเช็คชื่อซ้ำในคาบเรียนเดียวกัน
    if (data.sessionId) {
      const q = query(
        collection(db, 'checkins'), 
        where('studentId', '==', data.studentId),
        where('sessionId', '==', data.sessionId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return { success: false, error: 'คุณได้เช็คชื่อในคาบเรียนนี้ไปแล้ว' };
      }
    }

    const docRef = await addDoc(collection(db, 'checkins'), {
      ...data,
      timestamp: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error saving check-in:', error);
    return { success: false, error: error.message };
  }
}
