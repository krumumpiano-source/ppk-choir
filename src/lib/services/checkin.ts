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
  type: string; // 'practice' | 'performance' | 'outing' | 'competition'
  targetGroups: string[]; // ['All'] หรือ ['Soprano', 'Alto', ...]
  location: { lat: number; lng: number; radius: number } | null;
  startTime?: any; 
  endTime?: any; 
  isActive: boolean;
  createdAt?: any;
  isRecurring?: boolean;
  daysOfWeek?: number[]; // Array of days: [1, 3, 5] for Mon, Wed, Fri
  dayOfWeek?: number; // Legacy backwards compatibility
  recurringStartTime?: string; // "16:00"
  recurringEndTime?: string; // "18:00"
}

export const DEFAULT_CHECKIN_SETTINGS = {
  lat: 19.17029465512379,
  lng: 99.91028862524004,
  radius: 10
};

export async function getCheckInSettings() {
  return DEFAULT_CHECKIN_SETTINGS; // Or fetch from an API if we implemented settings table
}

export async function updateCheckInSettings(settings: typeof DEFAULT_CHECKIN_SETTINGS) {
  return { success: true };
}

// === New Session Management Functions === //

export async function getAllSessions(): Promise<ScheduledSession[]> {
  try {
    const res = await fetch('/api/checkin/sessions');
    if (!res.ok) return [];
    const data = (await res.json()) as any;
    return data.sessions;
  } catch (error) {
    console.error('Error getting all sessions:', error);
    return [];
  }
}

export async function getActiveSessions(): Promise<ScheduledSession[]> {
  try {
    const res = await fetch('/api/checkin/sessions?active=true');
    if (!res.ok) return [];
    const data = (await res.json()) as any;
    return data.sessions;
  } catch (error) {
    console.error('Error getting active sessions:', error);
    return [];
  }
}

export async function createScheduledSession(data: Omit<ScheduledSession, 'id' | 'createdAt'>) {
  try {
    const res = await fetch('/api/checkin/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = (await res.json()) as any;
    if (!res.ok || !result.success) return { success: false, error: result.error };
    return { success: true, id: result.id };
  } catch (error) {
    console.error('Error creating scheduled session:', error);
    return { success: false, error };
  }
}

export async function updateScheduledSession(id: string, data: Partial<ScheduledSession>) {
  try {
    const res = await fetch(`/api/checkin/sessions?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = (await res.json()) as any;
    if (!res.ok || !result.success) return { success: false, error: result.error };
    return { success: true };
  } catch (error) {
    console.error('Error updating session:', error);
    return { success: false, error };
  }
}

export async function deleteScheduledSession(id: string) {
  try {
    const res = await fetch(`/api/checkin/sessions?id=${id}`, { method: 'DELETE' });
    const result = (await res.json()) as any;
    if (!res.ok || !result.success) return { success: false, error: result.error };
    return { success: true };
  } catch (error) {
    console.error('Error deleting session:', error);
    return { success: false, error };
  }
}

export async function getActiveSession() {
  try {
    const sessions = await getActiveSessions();
    if (sessions.length > 0) {
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
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // +2 hours by default
    isActive: true
  });
}

export async function endSession(sessionId: string) {
  return updateScheduledSession(sessionId, { isActive: false });
}

export async function saveCheckIn(data: CheckInRecord) {
  try {
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = (await res.json()) as any;
    if (!res.ok || !result.success) return { success: false, error: result.error };
    return { success: true, id: result.id };
  } catch (error: any) {
    console.error('Error saving check-in:', error);
    return { success: false, error: error.message };
  }
}
