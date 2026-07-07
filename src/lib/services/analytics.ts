import { VoiceType } from './library';

export interface VoiceStats {
  voiceType: VoiceType;
  totalSubmissions: number;
  avgPitch: number;
  avgRhythm: number;
  avgTechnique: number;
  overallAvg: number;
}

export interface AnalyticsData {
  totalPractices: number;
  assessedPractices: number;
  voiceStats: VoiceStats[];
  insights: string[];
  suggestedResearch: string[];
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  try {
    const res = await fetch('/api/analytics');
    if (!res.ok) throw new Error('Failed to fetch analytics');
    const data = (await res.json()) as any;
    return data as AnalyticsData;
  } catch (error) {
    console.error('Error in Analytics:', error);
    return { totalPractices: 0, assessedPractices: 0, voiceStats: [], insights: ['เกิดข้อผิดพลาดในการดึงข้อมูล'], suggestedResearch: [] };
  }
}
