'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, CheckCircle, AlertTriangle, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { saveCheckIn, getActiveSession, getCheckInSettings, DEFAULT_CHECKIN_SETTINGS } from '../../lib/services/checkin';
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
  const [status, setStatus] = useState<'idle' | 'locating' | 'success' | 'failed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [activeSession, setActiveSession] = useState<any>(null);
  const [settings, setSettings] = useState(DEFAULT_CHECKIN_SETTINGS);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function checkSession() {
      const [session, config] = await Promise.all([
        getActiveSession(),
        getCheckInSettings()
      ]);
      setActiveSession(session);
      setSettings(config);
      setCheckingSession(false);
    }
    checkSession();
  }, []);

  const initiateCheckIn = () => {
    if (!activeSession) {
      alert('ขณะนี้ยังไม่มีการเปิดคาบเรียนให้เช็คชื่อ');
      return;
    }
    if (!pdpaAccepted) {
      setShowPdpa(true);
      return;
    }
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

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        const dist = getDistanceFromLatLonInM(latitude, longitude, settings.lat, settings.lng);
        setDistance(dist);
        
        const isSuccess = dist <= settings.radius;
        
        if (user && isSuccess) {
          const res = await saveCheckIn({
            studentId: user.id,
            studentName: user.name,
            location: { lat: latitude, lng: longitude },
            devicePlatform: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
            room: user.room || 'ไม่ระบุห้อง',
            sessionId: activeSession.id
          });
          
          if (res.success) {
            setStatus('success');
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
      (error) => {
        setStatus('error');
        setErrorMessage('ไม่สามารถดึงตำแหน่งได้ กรุณาอนุญาตให้เว็บเข้าถึง GPS ของคุณ');
      },
      { enableHighAccuracy: true } 
    );
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
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '500px', width: '100%', background: 'var(--bg-secondary)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <ShieldCheck size={48} color="var(--accent-primary)" style={{ margin: '0 auto' }} />
              <h2 style={{ marginTop: '1rem' }}>ข้อตกลงการประมวลผลข้อมูล (PDPA)</h2>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '2rem' }}>
              ในการเช็คชื่อเข้ากิจกรรม "ชุมนุมสานฝันด้วยเส้นเสียง" ทางโรงเรียนมีความจำเป็นต้องเข้าถึง **ตำแหน่งที่ตั้ง (GPS)** ของคุณ เพื่อตรวจสอบว่าคุณอยู่ในบริเวณพื้นที่ที่กำหนด
              <br/><br/>
              ข้อมูลตำแหน่งของคุณจะถูกใช้สำหรับการเช็คชื่อเท่านั้น และจะไม่ถูกนำไปเปิดเผยหรือใช้งานในวัตถุประสงค์อื่น
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowPdpa(false)}
                style={{ padding: '0.8rem 1.5rem', background: 'transparent', border: '1px solid var(--text-secondary)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
                ปฏิเสธ
              </button>
              <button 
                onClick={acceptPdpa}
                className="btn-primary" style={{ borderRadius: '8px' }}>
                ยินยอมและดำเนินการต่อ
              </button>
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
          <p style={{ color: 'var(--text-secondary)' }}>รัศมีที่อนุญาต: {settings.radius} เมตร</p>
          
          {activeSession ? (
            <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(46, 213, 115, 0.1)', color: 'var(--success)', borderRadius: '8px', fontSize: '0.9rem' }}>
              กำลังเปิดรับเช็คชื่อ (Session Active)
            </div>
          ) : (
            <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(255, 71, 87, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.9rem' }}>
              ขณะนี้ปิดรับการเช็คชื่อ
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          
          {status === 'idle' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>สวัสดี, {user.name}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>รหัส: {user.id}</p>
            </div>
          )}

          {status === 'locating' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}>
              <Navigation className="animate-spin" size={20} />
              <span>กำลังดึงตำแหน่ง GPS ของคุณ...</span>
            </div>
          )}

          {status === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
              <CheckCircle size={48} />
              <h3 style={{ fontSize: '1.2rem' }}>เช็คชื่อสำเร็จ!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>คุณอยู่ห่างจากจุดศูนย์กลาง {distance?.toFixed(2)} เมตร</p>
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
                คุณอยู่ห่างจากจุดศูนย์กลาง {distance?.toFixed(2)} เมตร<br/>
                (ต้องอยู่ภายในระยะ {settings.radius} เมตร)
              </p>
            </div>
          )}

          {status === 'error' && (
            <div style={{ color: 'var(--danger)', textAlign: 'center', fontSize: '0.9rem' }}>
              {errorMessage}
            </div>
          )}

          {status !== 'success' && (
            <button 
              onClick={initiateCheckIn} 
              className="btn-primary" 
              disabled={status === 'locating' || !activeSession}
              style={{ width: '100%', marginTop: '1rem', opacity: (status === 'locating' || !activeSession) ? 0.5 : 1 }}
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

