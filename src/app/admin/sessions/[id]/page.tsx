'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Users, Loader2 } from 'lucide-react';
import { getSessionCheckIns, CheckInRecord } from '@/lib/services/checkin';
import { useAuth } from '@/components/providers/AuthProvider';

export default function SessionCheckinsPage({ params }: { params: { id: string } }) {
  const [checkins, setCheckins] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function load() {
      const data = await getSessionCheckIns(params.id);
      setCheckins(data);
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const formatTime = (ts: any) => {
    if (!ts) return '-';
    const d = new Date(ts);
    return d.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/admin/sessions" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={24} />
        </Link>
        <Users size={32} color="var(--accent-primary)" />
        <h1 style={{ margin: 0, fontSize: '2rem' }}>รายชื่อผู้ที่เช็คชื่อแล้ว</h1>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--accent-primary)' }}>ยอดคนเข้าเรียน</h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>รวมทั้งหมดจากระบบ GPS</p>
        </div>
        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
          {checkins.length} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>คน</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.4)' }}>
                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)' }}>รหัสนักเรียน</th>
                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)' }}>ชื่อ-สกุล</th>
                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)' }}>เวลาที่เช็คชื่อ</th>
                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)' }}>อุปกรณ์</th>
                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)' }}>พิกัด</th>
              </tr>
            </thead>
            <tbody>
              {checkins.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    ยังไม่มีผู้เช็คชื่อในกิจกรรมนี้
                  </td>
                </tr>
              ) : (
                checkins.map((record) => (
                  <tr key={record.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{record.studentId}</td>
                    <td style={{ padding: '1rem 1.2rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{record.studentName}</strong>
                    </td>
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.9rem' }}>
                      {formatTime(record.timestamp)}
                    </td>
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {record.devicePlatform}
                    </td>
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.9rem' }}>
                      {record.location ? (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${record.location.lat},${record.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: 'var(--accent-primary)', textDecoration: 'none' }}
                        >
                          <MapPin size={16} /> ดูแผนที่
                        </a>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
