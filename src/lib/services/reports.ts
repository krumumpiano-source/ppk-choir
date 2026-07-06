import { collection, query, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckInRecord } from './checkin';

export interface ReportData {
  room: string;
  count: number;
  students: CheckInRecord[];
}

export type ReportPeriod = 'week' | 'month' | 'year';

export async function getCheckInReports(period: ReportPeriod): Promise<ReportData[]> {
  try {
    const now = new Date();
    let startDate = new Date();

    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const q = query(
      collection(db, 'checkins'),
      where('timestamp', '>=', Timestamp.fromDate(startDate))
      // Removed orderBy('timestamp', 'desc') to avoid composite index requirement
    );

    const snapshot = await getDocs(q);
    const checkins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CheckInRecord));

    // Sort manually by timestamp descending
    checkins.sort((a, b) => {
      const timeA = a.timestamp?.toMillis?.() || 0;
      const timeB = b.timestamp?.toMillis?.() || 0;
      return timeB - timeA;
    });

    // Group by Room
    const grouped = checkins.reduce((acc: { [key: string]: CheckInRecord[] }, checkin) => {
      const room = checkin.room || 'ไม่ระบุห้อง';
      if (!acc[room]) {
        acc[room] = [];
      }
      acc[room].push(checkin);
      return acc;
    }, {});

    // Convert to array
    const reportData: ReportData[] = Object.keys(grouped).map(room => ({
      room,
      count: grouped[room].length,
      students: grouped[room]
    }));

    // Sort by room name
    reportData.sort((a, b) => a.room.localeCompare(b.room));

    return reportData;
  } catch (error) {
    console.error('Error fetching check-in reports:', error);
    return [];
  }
}
