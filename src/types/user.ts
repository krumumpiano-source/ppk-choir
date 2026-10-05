export type UserRole = 'student' | 'section_leader' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type BandPosition = 'เปียโน' | 'กลอง' | 'เบส' | 'กีต้าร์' | 'คีย์บอร์ด' | 'นักร้องนำ' | '';

export type VoicePart = 
  | 'Soprano 1' 
  | 'Soprano 2' 
  | 'Alto 1' 
  | 'Alto 2' 
  | 'Tenor 1' 
  | 'Tenor 2' 
  | 'Baritone' 
  | 'Bass'
  | 'Unassigned'
  | string;

export interface User {
  id: string;
  studentId?: string;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  lineId: string;
  parentName: string;
  parentPhone: string;
  parentLineId: string;
  parentEmail?: string;
  address: string;
  advisorName: string;
  voiceType: string;
  bandPosition?: string;
  role: UserRole;
  status?: UserStatus;
  photoUrl?: string;
  profileUrl?: string;
  room?: string;
  section?: string;
  createdAt?: string | Date;
  password?: string;
}

export interface AuditionRecord {
  id: string;
  studentId: string;
  lowestNote: string;
  highestNote: string;
  timbreQuality?: string;
  pitchAccuracy?: number;
  auditedBy?: string;
  auditedAt?: string;
  notes?: string;
}

export interface VoiceTargetRatio {
  voicePart: VoicePart;
  percentage: number; // e.g. 15 for 15%
  targetCount?: number;
}

