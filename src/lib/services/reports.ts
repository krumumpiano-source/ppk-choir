import { CheckInRecord } from './checkin';

export interface ReportData {
  room: string;
  count: number;
  students: CheckInRecord[];
}

export type ReportPeriod = 'week' | 'month' | 'year';

export async function getCheckInReports(period: ReportPeriod): Promise<ReportData[]> {
  try {
    const res = await fetch(`/api/reports?period=${period}`);
    if (!res.ok) throw new Error('Failed to fetch reports');
    const data = (await res.json()) as any;
    return data.data;
  } catch (error) {
    console.error('Error fetching check-in reports:', error);
    return [];
  }
}
