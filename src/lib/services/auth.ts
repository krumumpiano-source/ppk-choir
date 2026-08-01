import { User } from '@/types/user';

export async function loginStudent(studentId: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `${studentId}@ppk-choir.app`, password: studentId })
    });
    
    const data = (await res.json()) as any;
    if (!res.ok || !data.success) {
      return { success: false, error: data.error };
    }
    return { success: true, user: data.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function loginAdminWithFirebase(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = (await res.json()) as any;
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Login failed' };
    }
    return { success: true, user: data.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
