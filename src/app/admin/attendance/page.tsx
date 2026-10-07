'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getActiveSessions, getSessionCheckIns, ScheduledSession, CheckInRecord } from '@/lib/services/checkin';

export default function AttendanceTodayPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeSessions, setActiveSessions] = useState<ScheduledSession[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'section_leader'))) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // 1. Fetch active sessions
        const { sessions } = await getActiveSessions();
        setActiveSessions(sessions);

        if (sessions.length > 0) {
          // 2. Fetch all students
          const resUsers = await fetch('/api/users');
          if (resUsers.ok) {
            const dataUsers = (await resUsers.json()) as any;
            // Filter only approved students
            const activeStudents = (dataUsers.users || []).filter((u: any) => u.role === 'student' && u.status === 'approved');
            setStudents(activeStudents);
          }

          // 3. Fetch checkins for the first active session
          const activeSessionId = sessions[0].id;
          if (activeSessionId) {
            const checkinData = await getSessionCheckIns(activeSessionId);
            setCheckins(checkinData);
          }
        }
      } catch (error) {
        console.error('Error loading attendance data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user && (user.role === 'admin' || user.role === 'section_leader')) {
      loadData();
      // Auto refresh every 30 seconds
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (authLoading || !user) return null;

  // Process data to map each student to their checkin status
  const getAttendanceList = () => {
    if (activeSessions.length === 0) return [];
    const session = activeSessions[0];

    // Filter students based on session targetGroups if needed
    let targetStudents = students;
    if (session.targetGroups && session.targetGroups.length > 0 && !session.targetGroups.includes('All')) {
      targetStudents = students.filter(s => session.targetGroups.includes(s.voiceType) || session.targetGroups.includes(s.bandPosition));
    }

    return targetStudents.map(student => {
      // Look for a checkin record today for this student
      const today = new Date();
      // Adjust server time string to Date object
      const studentCheckins = checkins.filter(c => {
        if (c.studentId !== student.id) return false;
        const cDate = new Date(c.timestamp);
        return cDate.getDate() === today.getDate() && cDate.getMonth() === today.getMonth() && cDate.getFullYear() === today.getFullYear();
      });
      
      const latestCheckin = studentCheckins.length > 0 ? studentCheckins[0] : null;
      
      let status = 'absent';
      if (latestCheckin) {
        if (latestCheckin.checkoutTime) {
          status = 'checked_out';
        } else {
          status = 'checked_in';
        }
      }

      return {
        ...student,
        checkinRecord: latestCheckin,
        attendanceStatus: status
      };
    }).sort((a, b) => {
      // Sort by status: checked_in first, then checked_out, then absent
      const order = { 'checked_in': 1, 'checked_out': 2, 'absent': 3 };
      const diff = order[a.attendanceStatus as keyof typeof order] - order[b.attendanceStatus as keyof typeof order];
      if (diff !== 0) return diff;
      return (a.name || '').localeCompare(b.name || '');
    });
  };

  const attendanceList = getAttendanceList();
  
  const presentCount = attendanceList.filter(s => s.attendanceStatus === 'checked_in' || s.attendanceStatus === 'checked_out').length;
  const absentCount = attendanceList.filter(s => s.attendanceStatus === 'absent').length;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={24} />
        </Link>
        <MapPin size={32} color="var(--accent-primary)" />
        <h1 style={{ margin: 0, fontSize: '2rem' }}>สถานะการเข้าซ้อมวันนี้</h1>
      </div>

      <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
        {loading && attendanceList.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
          </div>
        ) : activeSessions.length === 0 ? (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            ไม่มีกิจกรรมที่เปิดรับเช็คชื่อในขณะนี้
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>กิจกรรม: {activeSessions[0].name}</h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', flex: 1, minWidth: '150px' }}>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>จำนวนนักเรียนเป้าหมาย</p>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 'bold' }}>{attendanceList.length}</p>
                </div>
                <div style={{ background: 'rgba(46, 213, 115, 0.1)', padding: '1rem', borderRadius: '8px', flex: 1, minWidth: '150px' }}>
                  <p style={{ margin: 0, color: 'var(--success)', fontSize: '0.9rem' }}>มาซ้อมแล้ว (เช็คอิน/เช็คเอาท์)</p>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{presentCount}</p>
                </div>
                <div style={{ background: 'rgba(255, 71, 87, 0.1)', padding: '1rem', borderRadius: '8px', flex: 1, minWidth: '150px' }}>
                  <p style={{ margin: 0, color: 'var(--danger)', fontSize: '0.9rem' }}>ยังไม่มา (ขาด/สาย)</p>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger)' }}>{absentCount}</p>
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>ชื่อ - นามสกุล</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>แนวเสียง</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>สถานะ</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>เวลาเช็คอิน</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>เวลาเช็คเอาท์</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceList.map(student => (
                    <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 'bold' }}>{student.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>รหัส: {student.studentId} | {student.room}</div>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{student.voiceType}</td>
                      <td style={{ padding: '1rem' }}>
                        {student.attendanceStatus === 'checked_in' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(46, 213, 115, 0.2)', color: 'var(--success)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            <CheckCircle size={14} /> กำลังซ้อม
                          </span>
                        )}
                        {student.attendanceStatus === 'checked_out' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(254, 202, 87, 0.2)', color: '#feca57', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            <Clock size={14} /> กลับแล้ว
                          </span>
                        )}
                        {student.attendanceStatus === 'absent' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255, 71, 87, 0.2)', color: 'var(--danger)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            <XCircle size={14} /> ยังไม่มา
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {student.checkinRecord?.timestamp ? new Date(student.checkinRecord.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {student.checkinRecord?.checkoutTime ? new Date(student.checkinRecord.checkoutTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
