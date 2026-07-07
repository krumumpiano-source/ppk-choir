import { User, UserRole } from '@/types/user';

export async function getAllUsers(): Promise<User[]> {
  try {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    const data = (await res.json()) as any;
    return data.users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function createUser(user: User): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    const data = (await res.json()) as any;
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to create user' };
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    const data = (await res.json()) as any;
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to delete user' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = (await res.json()) as any;
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to update user' };
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error updating user status:", error);
    return { success: false, error: error.message };
  }
}
