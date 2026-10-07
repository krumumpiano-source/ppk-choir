'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, CheckCircle, AlertTriangle, ArrowLeft, ShieldCheck, Loader2, LogOut, QrCode } from 'lucide-react';
import { getActiveSessions, ScheduledSession } from '../../lib/services/checkin';
import { useAuth } from '@/components/providers/AuthProvider';
import { QRCodeSVG } from 'qrcode.react';

export default function CheckInPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [status, setStatus] = useState<'idle' | 'showing_qr' | 'already_in' | 'checked_out' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkinTime, setCheckinTime] = useState<string | null>(null);
  const [checkoutTime, setCheckoutTime] = useState<string | null>(null);

  const [availableSessions, setAvailableSessions] = useState<ScheduledSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ScheduledSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const watchIdRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll to see if scanned by section leader
  useEffect(() => {
    if (status === 'showing_qr' && selectedSession && user) {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/checkin?studentId=${user.id}&sessionId=${selectedSession.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.checkin) {
              if (data.checkin.checkoutTime) {
                setCheckoutTime(data.checkin.checkoutTime);
                setStatus('checked_out');
              } else {
                setCheckinTime(data.checkin.timestamp);
                setStatus('already_in');
              }
            }
          }
        } catch (e) {}
      }, 3000);
    } else if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [status, selectedSession, user]);

  // Live Location Tracking ONCE checked in
  useEffect(() => {
    let lastUpdateTime = 0;
    if (status === 'already_in' && !checkoutTime && selectedSession?.id && user?.id) {
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (position) => {
            const now = Date.now();
            if (now - lastUpdateTime < 15000) return; // limit to 15s
            lastUpdateTime = now;

            const { latitude, longitude } = position.coords;
            try {
              await fetch('/api/checkin/live', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: user.id, sessionId: selectedSession.id, lat: latitude, lng: longitude })
              });
            } catch (e) {
              console.error('Failed to update live location', e);
            }
          },
          (err) => console.error('Live location error:', err),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      }
    } else {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [status, checkoutTime, selectedSession?.id, user?.id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function checkSessions() {
      if (!user) return;
      const { sessions, serverTime } = await getActiveSessions();
      
      const serverDate = new Date(serverTime);
      const clientDate = new Date();
      const timeDelta = serverDate.getTime() - clientDate.getTime();
      
      const eligibleSessions = sessions.filter(session => {
        const now = new Date(Date.now() + timeDelta);
        let isTimeValid = false;

        if (session.isRecurring) {
          const thaiTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
          const currentDay = thaiTime.getUTCDay();
          const currentHour = thaiTime.getUTCHours().toString().padStart(2, '0');
          const currentMinute = thaiTime.getUTCMinutes().toString().padStart(2, '0');
          const currentTime = `${currentHour}:${currentMinute}`;
          
          const isDayMatch = (session.daysOfWeek && session.daysOfWeek.length > 0) ? session.daysOfWeek.includes(currentDay) : session.dayOfWeek === currentDay;
          if (isDayMatch && currentTime >= (session.recurringStartTime || '') && currentTime <= (session.recurringEndTime || '')) {
            isTimeValid = true;
          }
        } else {
          if (session.startTime && session.endTime) {
            const start = session.startTime?.toDate ? session.startTime.toDate() : new Date(session.startTime);
            const end = session.endTime?.toDate ? session.endTime.toDate() : new Date(session.endTime);
            if (now >= start && now <= end) isTimeValid = true;
          }
        }
        
        const isTargetValid = !session.targetGroups || session.targetGroups.length === 0 || session.targetGroups.includes('All') || session.targetGroups.includes(user.voiceType) || (user.bandPosition && session.targetGroups.includes(user.bandPosition));
        return isTimeValid && isTargetValid && session.location;
      });

      setAvailableSessions(eligibleSessions);
      if (eligibleSessions.length === 1) {
        setSelectedSession(eligibleSessions[0]);
        await checkExistingCheckin(user.id, eligibleSessions[0].id!);
      }
      setCheckingSession(false);
    }
    
    if (user) checkSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function checkExistingCheckin(studentId: string, sessionId: string) {
    try {
      const res = await fetch(`/api/checkin?studentId=${studentId}&sessionId=${sessionId}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json() as any;
        if (data.checkin) {
          setCheckinTime(data.checkin.timestamp);
          if (data.checkin.checkoutTime) {
            setCheckoutTime(data.checkin.checkoutTime);
            setStatus('checked_out');
          } else {
            setStatus('already_in');
          }
        }
      }
    } catch (e) {}
  }

  const onSelectSession = async (session: ScheduledSession) => {
    setSelectedSession(session);
    setStatus('idle');
    setCheckinTime(null);
    setCheckoutTime(null);
    if (user && session.id) {
      await checkExistingCheckin(user.id, session.id);
    }
  };

  const handleShowQR = () => {
    if (!selectedSession) { alert('กรุณาเลือกกิจกรรม'); return; }
    
    // Request location permission first so that background tracking works smoothly later
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setStatus('showing_qr'),
        () => {
          if(confirm('ระบบต้องใช้พิกัดเพื่อติดตามความปลอดภัยระหว่างซ้อม กรุณาอนุญาต GPS ก่อนแสดง QR Code')) {
            setStatus('showing_qr');
          }
        },
        { timeout: 5000 }
      );
    } else {
      setStatus('showing_qr');
    }
  };

  const handleCheckOut = async () => {
    if (!user || !selectedSession?.id) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user.id, sessionId: selectedSession.id })
      });
      const data = await res.json() as any;
      if (res.ok && data.success) {
        setCheckoutTime(data.checkoutTime);
        setStatus('checked_out');
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการเช็คชื่อออก');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
    setCheckoutLoading(false);
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '-';
    let safeIso = iso;
    if (!iso.endsWith('Z') && !iso.includes('+')) {
      safeIso = iso.replace(' ', 'T') + 'Z';
    }
    return new Date(safeIso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const [qrTimestamp, setQrTimestamp] = useState<number>(Date.now());

  // Update QR timestamp every 15 seconds when showing QR
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'showing_qr') {
      interval = setInterval(() => {
        setQrTimestamp(Date.now());
      }, 15000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  if (authLoading || checkingSession) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
      </div>
    );
  }

  if (!user) return null;

  // Optimize QR density: Use a compact format instead of JSON
  // Format: CHK|<userId>|<sessionId>|<timestamp>
  const qrData = `CHK|${user.id}|${selectedSession?.id}|${qrTimestamp}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '500px', width: '100%', position: 'relative', marginTop: '2rem' }}>
        <Link href="/dashboard" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={20} />
        </Link>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', marginBottom: '1rem' }}>
            <QrCode size={40} color="var(--accent-primary)" />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>ระบบเช็คชื่อกิจกรรม</h2>
          
          {availableSessions.length > 0 ? (
            <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(46, 213, 115, 0.1)', color: 'var(--success)', borderRadius: '8px', fontSize: '0.9rem' }}>
              มีกิจกรรมที่คุณสามารถเช็คชื่อได้ ({availableSessions.length} กิจกรรม)
            </div>
          ) : (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255, 71, 87, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
              <div>ขณะนี้ไม่มีกิจกรรมที่เปิดรับการเช็คชื่อสำหรับคุณ</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          
          {availableSessions.length > 0 && status === 'idle' && (
            <div style={{ width: '100%' }}>
              <p style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>เลือกกิจกรรม:</p>
              {availableSessions.map(session => (
                <div 
                  key={session.id}
                  onClick={() => onSelectSession(session)}
                  style={{
                    padding: '1rem', borderRadius: '8px',
                    border: selectedSession?.id === session.id ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                    background: selectedSession?.id === session.id ? 'rgba(230, 185, 128, 0.1)' : 'transparent',
                    cursor: 'pointer', marginBottom: '0.5rem', transition: 'all 0.2s'
                  }}
                >
                  <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{session.name}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ให้คุณครูหรือหัวหน้าพาร์ทสแกนเพื่อเช็คชื่อ</span>
                </div>
              ))}
              
              <button
                onClick={handleShowQR}
                className="btn-primary"
                disabled={!selectedSession}
                style={{ width: '100%', marginTop: '1rem', opacity: !selectedSession ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <QrCode size={20} />
                สร้าง QR Code เช็คชื่อเข้า
              </button>
            </div>
          )}

          {status === 'showing_qr' && selectedSession && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
              <h3 style={{ color: 'var(--accent-primary)', textAlign: 'center' }}>ยื่น QR Code ให้คุณครูหรือหัวหน้าพาร์ทสแกน</h3>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
                <QRCodeSVG value={qrData} size={250} level="M" includeMargin={true} />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
                หน้าต่างนี้จะปิดอัตโนมัติเมื่อทำการสแกนสำเร็จ
              </p>
              <div className="animate-pulse" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <Loader2 size={16} className="animate-spin" />
                กำลังรอการสแกน...
              </div>
              <button onClick={() => setStatus('idle')} className="btn-secondary" style={{ width: '100%', marginTop: '1rem' }}>ยกเลิก</button>
            </div>
          )}

          {status === 'already_in' && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                <CheckCircle size={48} />
                <h3 style={{ fontSize: '1.2rem' }}>เช็คชื่อเข้าสำเร็จ ✅</h3>
                {checkinTime && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>เวลาเข้า: {formatTime(checkinTime)}</p>}
              </div>

              {!checkoutTime && (
                <div style={{ background: 'rgba(255, 60, 60, 0.1)', border: '1px solid var(--danger)', padding: '1rem', borderRadius: '8px', width: '100%', display: 'flex', alignItems: 'flex-start', gap: '0.8rem', marginTop: '0.5rem' }}>
                  <div className="animate-pulse" style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--danger)', marginTop: '4px', flexShrink: 0 }}></div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--danger)', fontSize: '0.9rem' }}>กำลังแชร์ตำแหน่งแบบเรียลไทม์</p>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>เพื่อความปลอดภัยขณะทำกิจกรรม ระบบกำลังส่งตำแหน่งของคุณให้คุณครูทราบผ่าน GPS จะหยุดเมื่อเช็คชื่อออก กรุณาเปิดหน้านี้ทิ้งไว้ในพื้นหลัง</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStatus('showing_qr')}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '1rem', borderRadius: '8px', cursor: 'pointer',
                  background: 'var(--accent-primary)', border: 'none',
                  color: '#fff', fontSize: '1rem', fontWeight: 600, transition: 'all 0.2s'
                }}
              >
                <QrCode size={20} />
                แสดง QR Code สแกนออก (เมื่อกลับบ้าน)
              </button>
            </div>
          )}

          {status === 'checked_out' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
              <div style={{ color: 'var(--success)' }}>
                <CheckCircle size={48} />
                <h3 style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>เช็คชื่อครบทั้งขาเข้าและขาออก ✅</h3>
              </div>
              {checkinTime && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>เข้า: {formatTime(checkinTime)}</p>}
              {checkoutTime && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ออก: {formatTime(checkoutTime)}</p>}
              <Link href="/dashboard" style={{ marginTop: '1rem', background: 'transparent', border: '1px solid var(--success)', color: 'var(--success)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', textDecoration: 'none' }}>
                กลับหน้าหลัก
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div style={{ color: 'var(--danger)', textAlign: 'center', fontSize: '0.9rem' }}>
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
