'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Camera, CheckCircle, XCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ScannerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [scanResult, setScanResult] = useState<{success: boolean, name?: string, error?: string, action?: 'checkin' | 'checkout'} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'section_leader'))) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleScan = async (text: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      const data = JSON.parse(text);
      if (data.type !== 'CHOIR_CHECKIN' || !data.id || !data.session) {
        throw new Error('QR Code ไม่ถูกต้องสำหรับระบบนี้');
      }

      // Try to get teacher's GPS to attach to the scan (optional, but good for validation)
      let lat = 0, lng = 0;
      try {
        if (navigator.geolocation) {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => 
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        }
      } catch(e) {}

      const res = await fetch('/api/checkin/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: data.id,
          studentName: data.name,
          sessionId: data.session,
          lat, lng
        })
      });

      const resultData = await res.json();
      
      if (res.ok && resultData.success) {
        setScanResult({ success: true, name: data.name || data.sid, action: resultData.action });
        // Play success beep
        const audio = new Audio('/success.mp3');
        audio.play().catch(e => {}); // ignore error if browser blocks autoplay
      } else {
        setScanResult({ success: false, error: resultData.error || 'ไม่สามารถบันทึกข้อมูลได้' });
      }

    } catch (e: any) {
      setScanResult({ success: false, error: e.message || 'QR Code ไม่ถูกต้อง หรืออ่านไม่ได้' });
    }

    // Reset after 3 seconds
    setTimeout(() => {
      setScanResult(null);
      setIsProcessing(false);
    }, 3000);
  };

  if (loading || !user) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><Loader2 className="animate-spin" size={48} /></div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={24} />
        </Link>
        <Camera size={28} color="var(--accent-primary)" />
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>เครื่องสแกนเช็คชื่อ (Scanner)</h1>
      </div>

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', overflow: 'hidden', borderRadius: '16px', background: '#000', border: '4px solid rgba(255,255,255,0.1)' }}>
        
        {/* React QR Scanner */}
        {!isProcessing && (
          <Scanner 
            onScan={(detectedCodes) => {
              if (detectedCodes && detectedCodes.length > 0) {
                handleScan(detectedCodes[0].rawValue);
              }
            }}
            onError={(error) => console.log(error?.message)}
            allowMultiple={false}
            scanDelay={1000}
          />
        )}
        
        {/* Processing / Result Overlay */}
        {(isProcessing || scanResult) && (
          <div style={{ 
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
            background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', 
            alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center',
            zIndex: 10
          }}>
            {!scanResult && (
              <>
                <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                <p>กำลังบันทึกข้อมูล...</p>
              </>
            )}
            
            {scanResult?.success && (
              <>
                <CheckCircle size={64} color={scanResult.action === 'checkout' ? '#feca57' : 'var(--success)'} style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: scanResult.action === 'checkout' ? '#feca57' : 'var(--success)', margin: '0 0 0.5rem 0' }}>
                  {scanResult.action === 'checkout' ? 'เช็คชื่อออกสำเร็จ!' : 'เช็คชื่อเข้าสำเร็จ!'}
                </h3>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{scanResult.name}</p>
              </>
            )}

            {scanResult?.success === false && (
              <>
                <XCircle size={64} color="var(--danger)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: 'var(--danger)', margin: '0 0 0.5rem 0' }}>ผิดพลาด!</h3>
                <p style={{ color: '#ff7675' }}>{scanResult.error}</p>
              </>
            )}
          </div>
        )}
      </div>

      <p style={{ marginTop: '2rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
        ให้หัวหน้าพาร์ทหรือผู้ดูแลระบบนำกล้องไปจ่อที่ QR Code บนจอมือถือของนักเรียนเพื่อเช็คชื่อเข้าซ้อม
      </p>

    </div>
  );
}
