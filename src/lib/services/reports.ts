import { CheckInRecord } from './checkin';

export type ReportPeriod = 'today' | 'week' | 'month' | 'term1' | 'term2' | 'year' | 'all';

// We now return flat records
export async function getCheckInReports(period: ReportPeriod): Promise<any[]> {
  try {
    const res = await fetch(`/api/reports?period=${period}`);
    if (!res.ok) throw new Error('Failed to fetch reports');
    const data = (await res.json()) as any;
    return data.data; // Array of flat checkin records
  } catch (error) {
    console.error('Error fetching check-in reports:', error);
    return [];
  }
}
