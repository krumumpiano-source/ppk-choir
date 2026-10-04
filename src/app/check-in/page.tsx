'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, CheckCircle, AlertTriangle, ArrowLeft, ShieldCheck, Loader2, LogOut } from 'lucide-react';
import { saveCheckIn, getActiveSessions, ScheduledSession } from '../../lib/services/checkin';
import { useAuth } from '@/components/providers/AuthProvider';

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

export default function CheckInPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [showPdpa, setShowPdpa] = useState(false);
  const [pdpaAccepted, setPdpaAccepted] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'locating' | 'success' | 'checked_out' | 'already_in' | 'failed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkinTime, setCheckinTime] = useState<string | null>(null);
  const [checkoutTime, setCheckoutTime] = useState<string | null>(null);

  const [availableSessions, setAvailableSessions] = useState<ScheduledSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ScheduledSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const watchIdRef = useRef<number | null>(null);

  // Live Location Tracking
  useEffect(() => {
    if (status === 'already_in' && !checkoutTime && selectedSession?.id && user?.id) {
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (position) => {
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
      const sessions = await getActiveSessions();
      
      const eligibleSessions = sessions.filter(session => {
        const now = new Date();
        let isTimeValid = false;

        if (session.isRecurring) {
          const currentDay = now.getDay();
          const currentTime = now.toTimeString().slice(0, 5);
          const isDayMatch = session.daysOfWeek ? session.daysOfWeek.includes(currentDay) : session.dayOfWeek === currentDay;
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
        
        const isTargetValid = session.targetGroups?.includes('All') || session.targetGroups?.includes(user.voiceType) || (user.bandPosition && session.targetGroups?.includes(user.bandPosition));
        return isTimeValid && isTargetValid && session.location;
      });

      setAvailableSessions(eligibleSessions);
      if (eligibleSessions.length === 1) {
        setSelectedSession(eligibleSessions[0]);
        // Check if user already checked in for this session
        await checkExistingCheckin(user.id, eligibleSessions[0].id!);
      }
      setCheckingSession(false);
    }
    
    if (user) checkSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function checkExistingCheckin(studentId: string, sessionId: string) {
    try {
      const res = await fetch(`/api/checkin?studentId=${studentId}&sessionId=${sessionId}`);
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

  const initiateCheckIn = () => {
    if (!selectedSession) { alert('กรุณาเลือกกิจกรรมที่ต้องการเช็คชื่อ'); return; }
    if (!pdpaAccepted) { setShowPdpa(true); return; }
    handleCheckIn();
  };

  const acceptPdpa = () => {
    setPdpaAccepted(true);
    setShowPdpa(false);
    handleCheckIn();
  };

  const handleCheckIn = () => {
    setStatus('locating');
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง GPS');
      return;
    }
    if (!selectedSession?.location) {
      setStatus('error');
      setErrorMessage('กิจกรรมนี้ไม่มีการตั้งค่าพิกัด');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        const targetLoc = selectedSession.location!;
        const dist = getDistanceFromLatLonInM(latitude, longitude, targetLoc.lat, targetLoc.lng);
        setDistance(dist);
        const isSuccess = dist <= targetLoc.radius;
        
        if (user && isSuccess) {
          const res = await saveCheckIn({
            studentId: user.id,
            studentName: user.name,
            location: { lat: latitude, lng: longitude },
            devicePlatform: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
            room: user.room || 'ไม่ระบุห้อง',
            sessionId: selectedSession.id
          });
          if (res.success) {
            setCheckinTime(new Date().toISOString());
            setStatus('already_in');
          } else {
            setStatus('error');
            setErrorMessage(typeof res.error === 'string' ? res.error : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
          }
        } else if (!isSuccess) {
          setStatus('failed');
        } else {
          setStatus('error');
          setErrorMessage('ไม่พบข้อมูลผู้ใช้งาน');
        }
      },
      () => {
        setStatus('error');
        setErrorMessage('ไม่สามารถดึงตำแหน่งได้ กรุณาอนุญาตให้เว็บเข้าถึง GPS ของคุณ');
      },
      { enableHighAccuracy: true }
    );
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
    return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  if (authLoading || checkingSession) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
      {/* PDPA Modal */}
      {showPdpa && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '500px', width: '100%', background: 'var(--bg-secondary)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <ShieldCheck size={48} color="var(--accent-primary)" style={{ margin: '0 auto' }} />
              <h2 style={{ marginTop: '1rem' }}>ข้อตกลงการประมวลผลข้อมูล (PDPA)</h2>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '2rem' }}>
              ในการเช็คชื่อเข้ากิจกรรม &quot;ชุมนุมสานฝันด้วยเส้นเสียง&quot; ทางโรงเรียนมีความจำเป็นต้องเข้าถึง <strong>ตำแหน่งที่ตั้ง (GPS)</strong> ของคุณ เพื่อตรวจสอบว่าคุณอยู่ในบริเวณที่กำหนด 
              รวมถึง <strong>ติดตามตำแหน่งแบบเรียลไทม์ระหว่างที่คุณยังอยู่ในกิจกรรม</strong> เพื่อความปลอดภัยขณะอยู่ในความดูแลของคุณครู
              <br/><br/>
              ข้อมูลตำแหน่งจะถูกใช้เฉพาะขณะทำการเช็คชื่อและในระหว่างที่คุณทำกิจกรรมอยู่เท่านั้น ระบบจะหยุดแชร์ตำแหน่งทันทีเมื่อคุณกดเช็คชื่อออก (Check-out) และจะไม่มีการนำไปเปิดเผยเพื่อวัตถุประสงค์อื่น
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowPdpa(false)} style={{ padding: '0.8rem 1.5rem', background: 'transparent', border: '1px solid var(--text-secondary)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>ปฏิเสธ</button>
              <button onClick={acceptPdpa} className="btn-primary" style={{ borderRadius: '8px' }}>ยินยอมและดำเนินการต่อ</button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel animate-fade-in" style={{ maxWidth: '500px', width: '100%', position: 'relative', marginTop: '2rem' }}>
        <Link href="/dashboard" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={20} />
        </Link>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', marginBottom: '1rem' }}>
            <MapPin size={40} color="var(--accent-primary)" />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>ระบบเช็คชื่อกิจกรรม</h2>
          
          {availableSessions.length > 0 ? (
            <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(46, 213, 115, 0.1)', color: 'var(--success)', borderRadius: '8px', fontSize: '0.9rem' }}>
              มีกิจกรรมที่คุณสามารถเช็คชื่อได้ ({availableSessions.length} กิจกรรม)
            </div>
          ) : (
            <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(255, 71, 87, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.9rem' }}>
              ขณะนี้ไม่มีกิจกรรมที่เปิดรับการเช็คชื่อสำหรับคุณ
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          
          {/* Session selector */}
          {availableSessions.length > 0 && (
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
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>รัศมีอนุญาต: {session.location?.radius || 0} เมตร</span>
                </div>
              ))}
            </div>
          )}

          {/* Status displays */}
          {status === 'locating' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}>
              <Navigation className="animate-spin" size={20} />
              <span>กำลังดึงตำแหน่ง GPS ของคุณ...</span>
            </div>
          )}

          {/* Already checked in — show check-out button */}
          {status === 'already_in' && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                <CheckCircle size={48} />
                <h3 style={{ fontSize: '1.2rem' }}>เช็คชื่อเข้าสำเร็จ ✅</h3>
                {checkinTime && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>เวลาเข้า: {formatTime(checkinTime)}</p>}
                {distance !== null && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ระยะห่าง: {distance.toFixed(0)} เมตร</p>}
              </div>

              {!checkoutTime && (
                <div style={{ background: 'rgba(255, 60, 60, 0.1)', border: '1px solid var(--danger)', padding: '1rem', borderRadius: '8px', width: '100%', display: 'flex', alignItems: 'flex-start', gap: '0.8rem', marginTop: '0.5rem' }}>
                  <div className="animate-pulse" style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--danger)', marginTop: '4px', flexShrink: 0 }}></div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--danger)', fontSize: '0.9rem' }}>กำลังแชร์ตำแหน่งแบบเรียลไทม์</p>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>เพื่อความปลอดภัยขณะทำกิจกรรม ระบบจะแชร์ตำแหน่งของคุณให้คุณครูทราบ และจะหยุดทันทีเมื่อเช็คชื่อออก หรือปิดหน้านี้</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleCheckOut}
                disabled={checkoutLoading}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '1rem', borderRadius: '8px', cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                  background: 'rgba(255, 71, 87, 0.15)', border: '1px solid var(--danger)',
                  color: 'var(--danger)', fontSize: '1rem', fontWeight: 600, transition: 'all 0.2s',
                  opacity: checkoutLoading ? 0.6 : 1
                }}
              >
                {checkoutLoading ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
                {checkoutLoading ? 'กำลังบันทึก...' : 'เช็คชื่อออก (เมื่อกลับบ้าน)'}
              </button>
            </div>
          )}

          {/* Fully checked out */}
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

          {status === 'failed' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', textAlign: 'center' }}>
              <AlertTriangle size={48} />
              <h3 style={{ fontSize: '1.2rem' }}>คุณอยู่นอกพื้นที่</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                คุณอยู่ห่างจากจุดศูนย์กลาง {distance?.toFixed(0)} เมตร<br/>
                (ต้องอยู่ภายในระยะ {selectedSession?.location?.radius || 0} เมตร)
              </p>
            </div>
          )}

          {status === 'error' && (
            <div style={{ color: 'var(--danger)', textAlign: 'center', fontSize: '0.9rem' }}>
              {errorMessage}
            </div>
          )}

          {/* Check-in button — only show when not yet checked in */}
          {(status === 'idle' || status === 'failed' || status === 'error') && availableSessions.length > 0 && (
            <button
              onClick={initiateCheckIn}
              className="btn-primary"
              disabled={status === 'locating' || !selectedSession}
              style={{ width: '100%', marginTop: '0.5rem', opacity: (status === 'locating' || !selectedSession) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <MapPin size={20} />
              {status === 'failed' || status === 'error' ? 'ลองเช็คชื่อใหม่อีกครั้ง' : 'กดเพื่อเช็คชื่อเข้ากิจกรรม'}
            </button>
          )}
          
        </div>
      </div>
    </div>
  );
}
