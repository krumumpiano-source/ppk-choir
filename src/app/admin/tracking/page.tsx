'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Navigation, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getActiveSessions, getSessionCheckIns, CheckInRecord, ScheduledSession } from '@/lib/services/checkin';
import dynamic from 'next/dynamic';

const LiveMapComponent = dynamic(() => import('@/components/LiveMapComponent'), { ssr: false });

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; 
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const deltaP = p2 - p1;
  const deltaLon = lon2 - lon1;
  const deltaLambda = (deltaLon * Math.PI) / 180;
  const a = Math.sin(deltaP/2) * Math.sin(deltaP/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}


export default function LiveTrackingPage() {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState<ScheduledSession[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [outOfBoundsStudents, setOutOfBoundsStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const prevOOBCount = React.useRef(0);

  useEffect(() => {
    if (outOfBoundsStudents.length > prevOOBCount.current) {
      const audio = new Audio('/error.mp3');
      audio.play().catch(() => {});
    }
    prevOOBCount.current = outOfBoundsStudents.length;
  }, [outOfBoundsStudents.length]);

  useEffect(() => {
    async function loadData() {
      try {
        const { sessions } = await getActiveSessions();
        setActiveSessions(sessions);
        
        let students: any[] = [];
        let outOfBounds: any[] = [];
        
        for (const session of sessions) {
          if (session.id) {
            const checkins = await getSessionCheckIns(session.id);
            const now = Date.now();
            const active = checkins.filter(c => {
              if (c.checkoutTime) return false;
              if (!c.liveLat && !c.location) return false;
              
              // Filter out check-ins that are older than 12 hours (stuck pins from previous days)
              let safeIso = c.timestamp;
              if (safeIso && !safeIso.endsWith('Z') && !safeIso.includes('+')) {
                safeIso = safeIso.replace(' ', 'T') + 'Z';
              }
              const checkinTime = new Date(safeIso).getTime();
              if (now - checkinTime > 12 * 60 * 60 * 1000) return false;
              
              return true;
            });
            
            for (const c of active) {
              const lat = c.liveLat || c.location?.lat || 19.170294;
              const lng = c.liveLng || c.location?.lng || 99.910288;
              
              let isOutOfBounds = false;
              let distance = 0;
              
              if (session.location) {
                distance = getDistanceFromLatLonInM(session.location.lat, session.location.lng, lat, lng);
                const safeZone = session.location.trackingRadius || (session.location.radius + 50);
                if (distance > safeZone) {
                  isOutOfBounds = true;
                }
              }

              const studentData = {
                id: c.studentId,
                name: `${c.studentName} (${session.name})`,
                lat,
                lng,
                lastUpdate: c.lastLocationUpdate || c.timestamp,
                phone: c.phone,
                lineId: c.lineId,
                isOutOfBounds,
                distance: Math.round(distance)
              };

              students.push(studentData);
              if (isOutOfBounds) {
                outOfBounds.push(studentData);
              }
            }
          }
        }
        setAllStudents(students);
        setOutOfBoundsStudents(outOfBounds);
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
        
        {outOfBoundsStudents.length > 0 && (
          <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255, 59, 48, 0.1)', borderLeft: '4px solid var(--danger)', borderRadius: '4px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} /> แจ้งเตือน: พบนักเรียนอยู่นอกพื้นที่ ({outOfBoundsStudents.length} คน)
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {outOfBoundsStudents.map(s => (
                <div key={s.id} style={{ background: 'white', padding: '0.3rem 0.6rem', borderRadius: '50px', fontSize: '0.85rem', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                  {s.name} ({s.distance}m)
                </div>
              ))}
            </div>
          </div>
        )}
        
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
