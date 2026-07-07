import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
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

export interface ScheduledSession {
  id?: string;
  name: string;
  type: string; // 'practice' | 'performance' | 'outing'
  targetGroups: string[]; // ['All'] หรือ ['Soprano', 'Alto', ...]
  location: { lat: number; lng: number; radius: number } | null;
  startTime: any; // Firestore Timestamp
  endTime: any; // Firestore Timestamp
  isActive: boolean;
  createdAt?: any;
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

// === New Session Management Functions === //

// Admin: Get all sessions for the table
export async function getAllSessions(): Promise<ScheduledSession[]> {
  try {
    const q = query(collection(db, 'sessions'));
    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScheduledSession));
    
    // Sort by startTime descending
    sessions.sort((a, b) => {
      const timeA = a.startTime?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
      const timeB = b.startTime?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
    return sessions;
  } catch (error) {
    console.error('Error getting all sessions:', error);
    return [];
  }
}

// Student & Admin: Get currently active sessions
export async function getActiveSessions(): Promise<ScheduledSession[]> {
  try {
    const q = query(collection(db, 'sessions'), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScheduledSession));
  } catch (error) {
    console.error('Error getting active sessions:', error);
    return [];
  }
}

// Admin: Create a new scheduled session
export async function createScheduledSession(data: Omit<ScheduledSession, 'id' | 'createdAt'>) {
  try {
    const docRef = await addDoc(collection(db, 'sessions'), {
      ...data,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating scheduled session:', error);
    return { success: false, error };
  }
}

export async function updateScheduledSession(id: string, data: Partial<ScheduledSession>) {
  try {
    await updateDoc(doc(db, 'sessions', id), data as any);
    return { success: true };
  } catch (error) {
    console.error('Error updating session:', error);
    return { success: false, error };
  }
}

export async function deleteScheduledSession(id: string) {
  try {
    await deleteDoc(doc(db, 'sessions', id));
    return { success: true };
  } catch (error) {
    console.error('Error deleting session:', error);
    return { success: false, error };
  }
}

// ตรวจสอบคาบเรียนที่เปิดอยู่ล่าสุด (Legacy support)
export async function getActiveSession() {
  try {
    const sessions = await getActiveSessions();
    if (sessions.length > 0) {
      sessions.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      return sessions[0];
    }
    return null;
  } catch (error) {
    console.error('Error getting active session:', error);
    return null;
  }
}

export async function createSession(name: string) {
  return createScheduledSession({
    name,
    type: 'practice',
    targetGroups: ['All'],
    location: null,
    startTime: new Date(),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // +2 hours by default
    isActive: true
  });
}

export async function endSession(sessionId: string) {
  return updateScheduledSession(sessionId, { isActive: false });
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
