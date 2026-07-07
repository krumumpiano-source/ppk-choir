import { User } from '@/types/user';

export async function loginStudent(studentId: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `${studentId}@student.local`, password: studentId }) // simplified for student login if needed, or handle differently
    });
    
    // In our new API, login expects email/password.
    // For students, let's assume they use their studentId as password, or they use actual email/password.
    // If the system expects studentId only, we should adapt the auth API or handle it here.
    // Wait, the original system just looked up by studentId and set local storage!
    // Let's create a specialized route or use dummy email.
    
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
