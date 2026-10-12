'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Loader2, CheckCircle, XCircle, Clock, MapPin, 
  Calendar, Trash2, LogOut as LogOutIcon, UserCheck, RefreshCw 
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getActiveSessions, getSessionCheckIns, deleteCheckIn, ScheduledSession, CheckInRecord } from '@/lib/services/checkin';

function getBangkokDateStr(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(d);
}

function getBangkokDateFromTimestamp(iso?: string | null): string {
  if (!iso) return '';
  let safeIso = iso;
  if (!safeIso.endsWith('Z') && !safeIso.includes('+')) {
    safeIso = safeIso.replace(' ', 'T') + 'Z';
  }
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date(safeIso));
  } catch {
    return '';
  }
}

function formatThaiDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return date.toLocaleDateString('th-TH', {
      timeZone: 'Asia/Bangkok',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export default function AttendanceTodayPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const todayBangkok = getBangkokDateStr();
  const [selectedDate, setSelectedDate] = useState<string>(todayBangkok);
  const [activeSessions, setActiveSessions] = useState<ScheduledSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<CheckInRecord[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [operatingId, setOperatingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'section_leader'))) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      // 1. Fetch active sessions
      const { sessions } = await getActiveSessions();
      setActiveSessions(sessions);

      // 2. Fetch approved leaves
      try {
        const resLeaves = await fetch('/api/leave?status=approved');
        if (resLeaves.ok) {
          const dataLeaves = await resLeaves.json();
          setLeaves(dataLeaves.leaves || []);
        }
      } catch (e) {
        console.error('Error fetching leaves:', e);
      }

      if (sessions.length > 0) {
        // 3. Fetch all active students
        const resUsers = await fetch('/api/users');
        if (resUsers.ok) {
          const dataUsers = (await resUsers.json()) as any;
          const activeStudents = (dataUsers.users || []).filter((u: any) => 
            (u.role === 'student' || u.role === 'section_leader') && u.status === 'approved'
          );
          setStudents(activeStudents);
        }

        // Determine session to use
        let activeSessionId = selectedSessionId;
        if (!activeSessionId || !sessions.some(s => s.id === activeSessionId)) {
          activeSessionId = sessions[0].id;
          setSelectedSessionId(activeSessionId);
        }
        
        if (activeSessionId) {
          const checkinData = await getSessionCheckIns(activeSessionId, selectedDate);
          setCheckins(checkinData);
        }
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSessionId, selectedDate]);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'section_leader')) {
      loadData();
      // Auto refresh every 30 seconds
      const interval = setInterval(() => loadData(true), 30000);
      return () => clearInterval(interval);
    }
  }, [user, loadData]);

  // Handler: Delete Checkin
  const handleDeleteCheckin = async (checkinId: string, studentName: string) => {
    if (!confirm(`คุณต้องการยกเลิกการเช็คชื่อของ "${studentName}" ใช่หรือไม่?\n(ข้อมูลการเช็คชื่อของรอบนี้จะถูกลบออก)`)) return;
    setOperatingId(checkinId);
    try {
      const res = await deleteCheckIn(checkinId);
      if (res.success) {
        await loadData(true);
      } else {
        alert('เกิดข้อผิดพลาด: ' + (res.error || 'ไม่สามารถยกเลิกได้'));
      }
    } finally {
      setOperatingId(null);
    }
  };

  // Handler: Manual Checkout for student
  const handleManualCheckout = async (studentId: string, studentName: string) => {
    if (!confirm(`ต้องการบันทึกเวลาเช็คชื่อออก (กลับแล้ว) ให้ "${studentName}" หรือไม่?`)) return;
    setOperatingId(studentId);
    try {
      const res = await fetch('/api/checkin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, sessionId: selectedSessionId })
      });
      if (res.ok) {
        await loadData(true);
      } else {
        const d = await res.json() as any;
        alert('เกิดข้อผิดพลาด: ' + (d.error || 'ไม่สามารถเช็คเอาท์ได้'));
      }
    } finally {
      setOperatingId(null);
    }
  };

  // Handler: Manual Checkin for student
  const handleManualCheckin = async (student: any) => {
    if (!confirm(`ต้องการเช็คชื่อเข้าแทนให้ "${student.name}" หรือไม่?\n(ใช้กรณีนักเรียนลืมโทรศัพท์ หรือมีเหตุจำเป็น)`)) return;
    setOperatingId(student.id);
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          studentName: student.name,
          room: student.room,
          sessionId: selectedSessionId,
          deviceModel: 'คุณครูเช็คชื่อให้ (Manual)'
        })
      });
      if (res.ok) {
        await loadData(true);
      } else {
        const d = await res.json() as any;
        alert('เกิดข้อผิดพลาด: ' + (d.error || 'ไม่สามารถเช็คชื่อได้'));
      }
    } finally {
      setOperatingId(null);
    }
  };

  if (authLoading || !user) return null;

  // Process data to map each student to their checkin status
  const getAttendanceList = () => {
    if (activeSessions.length === 0 || !selectedSessionId) return [];
    const session = activeSessions.find(s => s.id === selectedSessionId) || activeSessions[0];

    // Filter students based on session targetGroups if needed
    let targetStudents = students;
    if (session.targetGroups && session.targetGroups.length > 0 && !session.targetGroups.includes('All')) {
      targetStudents = students.filter(s => 
        session.targetGroups.includes(s.voiceType) || 
        (s.bandPosition && session.targetGroups.includes(s.bandPosition)) ||
        checkins.some(c => c.studentId === s.id)
      );
    }

    return targetStudents.map(student => {
      // STRICT FILTER: Record date in Bangkok timezone MUST match selectedDate
      const studentCheckins = checkins.filter(c => 
        c.studentId === student.id && 
        getBangkokDateFromTimestamp(c.timestamp) === selectedDate
      );
      const latestCheckin = studentCheckins.length > 0 ? studentCheckins[0] : null;
      
      const studentLeave = leaves.find(l => 
        l.studentId === student.id && 
        (l.leaveDate === selectedDate || (!l.leaveDate && l.sessionId === selectedSessionId))
      );

      let status = 'absent';
      if (latestCheckin) {
        if (latestCheckin.checkoutTime) {
          status = 'checked_out';
        } else {
          status = 'checked_in';
        }
      } else if (studentLeave) {
        status = 'leave';
      }

      return {
        ...student,
        checkinRecord: latestCheckin,
        leaveRecord: studentLeave,
        attendanceStatus: status
      };
    }).sort((a, b) => {
      // Sort by status: checked_in first, then checked_out, then leave, then absent
      const order = { 'checked_in': 1, 'checked_out': 2, 'leave': 3, 'absent': 4 };
      const diff = (order[a.attendanceStatus as keyof typeof order] || 9) - (order[b.attendanceStatus as keyof typeof order] || 9);
      if (diff !== 0) return diff;
      return (a.name || '').localeCompare(b.name || '');
    });
  };

  const attendanceList = getAttendanceList();
  
  const formatTime = (iso: string | null) => {
    if (!iso) return '-';
    let safeIso = iso;
    if (!iso.endsWith('Z') && !iso.includes('+')) {
      safeIso = iso.replace(' ', 'T') + 'Z';
    }
    return new Date(safeIso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const presentCount = attendanceList.filter(s => s.attendanceStatus === 'checked_in' || s.attendanceStatus === 'checked_out').length;
  const leaveCount = attendanceList.filter(s => s.attendanceStatus === 'leave').length;
  const absentCount = attendanceList.filter(s => s.attendanceStatus === 'absent').length;

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={24} />
          </Link>
          <MapPin size={32} color="var(--accent-primary)" />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>สถานะการเช็คชื่อเข้าซ้อม</h1>
            <div style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={15} />
              <span>{formatThaiDate(selectedDate)}</span>
              {selectedDate === todayBangkok && (
                <span style={{ background: 'rgba(46, 213, 115, 0.2)', color: 'var(--success)', padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  วันนี้
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Date Selector & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.06)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>เลือกวันที่:</span>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.3)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '0.35rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>

          {selectedDate !== todayBangkok && (
            <button
              onClick={() => setSelectedDate(todayBangkok)}
              style={{
                background: 'rgba(9, 132, 227, 0.2)',
                color: '#74b9ff',
                border: '1px solid rgba(9, 132, 227, 0.4)',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              กลับมาวันนี้
            </button>
          )}

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="รีเฟรชข้อมูล"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'var(--text-primary)',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '0.45rem',
              borderRadius: '8px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
        {loading && attendanceList.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: '300px' }}>
            <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
          </div>
        ) : activeSessions.length === 0 ? (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', minHeight: '200px' }}>
            ไม่มีกิจกรรมที่เปิดรับเช็คชื่อในขณะนี้
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>
                  กิจกรรม: {activeSessions.find(s => s.id === selectedSessionId)?.name || activeSessions[0].name}
                </h2>
                {activeSessions.length > 1 && (
                  <select 
                    value={selectedSessionId || ''} 
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: 'var(--text-primary)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {activeSessions.map(s => (
                      <option key={s.id} value={s.id} style={{ color: '#000' }}>{s.name} ({s.targetGroups.includes('All') ? 'รวม' : s.targetGroups.join(', ')})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Stats Summary Bar */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', flex: 1, minWidth: '130px' }}>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>เป้าหมายทั้งหมด</p>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '1.8rem', fontWeight: 'bold' }}>{attendanceList.length}</p>
                </div>
                <div style={{ background: 'rgba(46, 213, 115, 0.1)', padding: '1rem', borderRadius: '8px', flex: 1, minWidth: '130px', borderLeft: '3px solid var(--success)' }}>
                  <p style={{ margin: 0, color: 'var(--success)', fontSize: '0.85rem' }}>มาซ้อมแล้ว</p>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--success)' }}>{presentCount}</p>
                </div>
                <div style={{ background: 'rgba(9, 132, 227, 0.15)', padding: '1rem', borderRadius: '8px', flex: 1, minWidth: '130px', borderLeft: '3px solid #74b9ff' }}>
                  <p style={{ margin: 0, color: '#74b9ff', fontSize: '0.85rem' }}>ลาซ้อม (มีใบลา)</p>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: '#74b9ff' }}>{leaveCount}</p>
                </div>
                <div style={{ background: 'rgba(255, 71, 87, 0.1)', padding: '1rem', borderRadius: '8px', flex: 1, minWidth: '130px', borderLeft: '3px solid var(--danger)' }}>
                  <p style={{ margin: 0, color: 'var(--danger)', fontSize: '0.85rem' }}>ยังไม่มา (ขาด)</p>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--danger)' }}>{absentCount}</p>
                </div>
              </div>
            </div>

            {/* Attendance Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>ชื่อ - นามสกุล</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>แนวเสียง / ตำแหน่ง</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>สถานะ</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>เวลาเช็คอิน</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>เวลาเช็คเอาท์</th>
                    {user.role === 'admin' && (
                      <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>จัดการ</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {attendanceList.map(student => (
                    <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 'bold' }}>{student.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>รหัส: {student.studentId} | {student.room}</div>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {student.voiceType || student.bandPosition || '-'}
                      </td>
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
                        {student.attendanceStatus === 'leave' && (
                          <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(9, 132, 227, 0.2)', color: '#74b9ff', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                              ℹ️ ลาซ้อม ({student.leaveRecord?.leaveType === 'sick' ? 'ลาป่วย' : student.leaveRecord?.leaveType === 'business' ? 'ลากิจ' : 'มีใบลา'})
                            </span>
                            {student.leaveRecord?.reason && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                {student.leaveRecord.reason}
                              </div>
                            )}
                          </div>
                        )}
                        {student.attendanceStatus === 'absent' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255, 71, 87, 0.2)', color: 'var(--danger)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            <XCircle size={14} /> ยังไม่มา
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        <div>{formatTime(student.checkinRecord?.timestamp)}</div>
                        {student.checkinRecord?.deviceModel && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            📱 {student.checkinRecord.deviceModel}
                          </div>
                        )}
                        {(student.checkinRecord as any)?.isSuspicious === 1 && (
                          <div style={{ fontSize: '0.75rem', color: '#ff6b81', marginTop: '0.2rem', fontWeight: 'bold' }}>
                            ⚠️ {(student.checkinRecord as any)?.deviceNote || 'เครื่องน่าสงสัย'}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {formatTime(student.checkinRecord?.checkoutTime)}
                      </td>

                      {/* Admin Quick Actions */}
                      {user.role === 'admin' && (
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                            {/* If checked in (not yet checked out): Allow manual checkout */}
                            {student.attendanceStatus === 'checked_in' && (
                              <button
                                onClick={() => handleManualCheckout(student.id, student.name)}
                                disabled={operatingId === student.id}
                                title="บันทึกเวลาเช็คเอาท์ (กลับแล้ว)"
                                style={{
                                  background: 'rgba(254, 202, 87, 0.15)',
                                  color: '#feca57',
                                  border: '1px solid rgba(254, 202, 87, 0.3)',
                                  borderRadius: '6px',
                                  padding: '0.35rem 0.6rem',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}
                              >
                                <LogOutIcon size={12} />
                                ออก
                              </button>
                            )}

                            {/* If checked in or checked out: Allow canceling/deleting checkin */}
                            {student.checkinRecord && (
                              <button
                                onClick={() => handleDeleteCheckin(student.checkinRecord.id, student.name)}
                                disabled={operatingId === student.checkinRecord.id}
                                title="ยกเลิกการเช็คชื่อนี้ (ลบรายการ)"
                                style={{
                                  background: 'rgba(255, 71, 87, 0.15)',
                                  color: 'var(--danger)',
                                  border: '1px solid rgba(255, 71, 87, 0.3)',
                                  borderRadius: '6px',
                                  padding: '0.35rem 0.5rem',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.2rem'
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}

                            {/* If absent: Allow manual checkin */}
                            {student.attendanceStatus === 'absent' && (
                              <button
                                onClick={() => handleManualCheckin(student)}
                                disabled={operatingId === student.id}
                                title="เช็คชื่อเข้าแทน (กรณีลืมโทรศัพท์)"
                                style={{
                                  background: 'rgba(46, 213, 115, 0.15)',
                                  color: 'var(--success)',
                                  border: '1px solid rgba(46, 213, 115, 0.3)',
                                  borderRadius: '6px',
                                  padding: '0.35rem 0.6rem',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}
                              >
                                <UserCheck size={13} />
                                เช็คเข้า
                              </button>
                            )}
                          </div>
                        </td>
                      )}
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
