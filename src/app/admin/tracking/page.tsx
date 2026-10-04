'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Navigation, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getActiveSessions, getSessionCheckIns, CheckInRecord, ScheduledSession } from '@/lib/services/checkin';
import dynamic from 'next/dynamic';

const LiveMapComponent = dynamic(() => import('@/components/LiveMapComponent'), { ssr: false });

export const runtime = 'edge';

export default function LiveTrackingPage() {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState<ScheduledSession[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const sessions = await getActiveSessions();
        setActiveSessions(sessions);
        
        let students: any[] = [];
        for (const session of sessions) {
          if (session.id) {
            const checkins = await getSessionCheckIns(session.id);
            // Filter only active checkins (no checkoutTime)
            const active = checkins.filter(c => !c.checkoutTime && (c.liveLat || c.location));
            
            for (const c of active) {
              students.push({
                id: c.studentId,
                name: `${c.studentName} (${session.name})`,
                lat: c.liveLat || c.location?.lat || 19.170294,
                lng: c.liveLng || c.location?.lng || 99.910288,
                lastUpdate: c.lastLocationUpdate || c.timestamp
              });
            }
          }
        }
        setAllStudents(students);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!user || user.role !== 'admin') return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <Link href="/admin/dashboard" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={24} />
        </Link>
        <MapPin size={32} color="var(--danger)" />
        <h1 style={{ margin: 0, fontSize: '2rem' }}>เรดาร์ติดตามนักเรียน (Live Radar)</h1>
      </div>

      <div className="glass-panel" style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>กิจกรรมที่เปิดอยู่: {activeSessions.length} กิจกรรม</p>
            <p style={{ margin: '0.2rem 0 0', fontWeight: 'bold', color: 'var(--success)' }}>นักเรียนที่กำลังออนไลน์: {allStudents.length} คน</p>
          </div>
          {loading && <Loader2 size={24} className="animate-spin" color="var(--accent-primary)" />}
        </div>
        
        <div style={{ flex: 1, position: 'relative', zIndex: 1, minHeight: '400px' }}>
          {activeSessions.length > 0 ? (
            <LiveMapComponent 
              center={activeSessions[0]?.location || { lat: 19.170294, lng: 99.910288 }} 
              students={allStudents}
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexDirection: 'column', gap: '1rem' }}>
              <Navigation size={48} opacity={0.5} />
              <p>ไม่มีกิจกรรมที่เปิดรับเช็คชื่อในขณะนี้</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
