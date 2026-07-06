export type UserRole = 'student' | 'section_leader' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  voiceType: string;
  role: UserRole;
  status?: UserStatus;
  photoUrl?: string;
  room?: string;
  createdAt?: string | Date;
}
