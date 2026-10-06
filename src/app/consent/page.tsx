'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';
import { ArrowLeft, Loader2, Edit3, CheckCircle, XCircle } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import toast from 'react-hot-toast';

export default function ConsentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const sigPad = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [parentName, setParentName] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function checkConsent() {
      try {
        const res = await fetch('/api/consent');
        const data = await res.json();
        if (res.ok && data.consent) {
          setHasSubmitted(true);
          setSubmittedData(data.consent);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (user && !authLoading) {
      checkConsent();
    }
  }, [user, authLoading]);

  const clearSignature = () => {
    if (sigPad.current) {
      sigPad.current.clear();
    }
  };

  const handleSubmit = async () => {
    if (isAllowed === null) {
      toast.error('กรุณาเลือกว่าอนุญาตหรือไม่อนุญาต');
      return;
    }
    if (!parentName.trim()) {
      toast.error('กรุณาระบุชื่อผู้ปกครอง');
      return;
    }
    if (sigPad.current?.isEmpty()) {
      toast.error('กรุณาลงลายมือชื่อผู้ปกครอง');
      return;
    }

    const signatureData = sigPad.current.getTrimmedCanvas().toDataURL('image/png');

    setSubmitting(true);
    try {
      const res = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isAllowed,
          parentName,
          signatureData
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('ส่งใบขออนุญาตเรียบร้อยแล้ว');
        setHasSubmitted(true);
        setSubmittedData({
          isAllowed: isAllowed ? 1 : 0,
          parentName,
          signatureData,
          timestamp: new Date().toISOString()
        });
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (e) {
      toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
      </div>
    );
  }

  if (hasSubmitted && submittedData) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
        <div className="glass-panel animate-fade-in" style={{ position: 'relative', textAlign: 'center', padding: '3rem 2rem' }}>
          <Link href="/dashboard" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={20} />
          </Link>
          
          <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 1.5rem' }} />
          <h1 style={{ color: 'var(--success)', marginBottom: '1rem' }}>คุณได้ส่งใบขออนุญาตแล้ว</h1>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', textAlign: 'left', marginTop: '2rem' }}>
            <p><strong>การอนุญาต:</strong> {submittedData.isAllowed ? 'อนุญาต' : 'ไม่อนุญาต'}</p>
            <p><strong>ผู้ปกครอง:</strong> {submittedData.parentName}</p>
            <p><strong>วันที่เซ็น:</strong> {new Date(submittedData.timestamp).toLocaleDateString('th-TH')} เวลา {new Date(submittedData.timestamp).toLocaleTimeString('th-TH')}</p>
            
            <div style={{ marginTop: '1rem', background: '#fff', borderRadius: '8px', padding: '1rem', display: 'inline-block' }}>
              <img src={submittedData.signatureData} alt="Signature" style={{ maxHeight: '100px' }} />
            </div>
          </div>
          
          <Link href="/dashboard" className="btn-primary" style={{ display: 'inline-block', marginTop: '2rem' }}>
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
      <div className="glass-panel animate-fade-in" style={{ position: 'relative' }}>
        <Link href="/dashboard" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={20} />
        </Link>
        
        <h1 style={{ textAlign: 'center', fontSize: '1.5rem', margin: '0 0 2rem 0' }}>ใบขออนุญาตผู้ปกครอง</h1>

        {/* Document Content */}
        <div style={{ 
          background: 'rgba(255,255,255,0.95)', 
          color: '#333', 
          padding: '2rem', 
          borderRadius: '8px', 
          marginBottom: '2rem',
          fontFamily: 'sans-serif',
          lineHeight: '1.6',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>
            เรื่อง ขออนุญาตให้นักเรียนทำกิจกรรมและฝึกซ้อมในช่วงปิดภาคเรียน<br/>
            เรียน ผู้ปกครองนักเรียน
          </h2>
          
          <p style={{ textIndent: '2rem', marginBottom: '1rem', textAlign: 'justify' }}>
            ด้วยนักเรียนกิจกรรมชุมนุมสานฝันด้วยเส้นเสียง ซึ่งประกอบด้วยวงขับร้องประสานเสียง และวงสตริง ของโรงเรียนพะเยาพิทยาคม 
            มีความตั้งใจและมุ่งมั่นที่จะศึกษาเรียนรู้เพิ่มเติมและพัฒนาทักษะทางด้านดนตรี เพื่อเตรียมความพร้อมสำหรับการเข้าร่วมแข่งขันในงานศิลปหัตถกรรมนักเรียน ประจำปีการศึกษา ๒๕๖๗ 
            ตลอดจนเตรียมความพร้อมสำหรับภารกิจอื่นๆ ในการแสดงตามที่โรงเรียนได้รับมอบหมาย
          </p>
          <p style={{ textIndent: '2rem', marginBottom: '1rem', textAlign: 'justify' }}>
            เนื่องจากในช่วงเปิดภาคเรียนปกติมีเวลาในการฝึกซ้อมค่อนข้างจำกัด โดยคณะครูผู้ดูแลกิจกรรม ได้เล็งเห็นถึงความมุ่งมั่นตั้งใจของนักเรียน 
            และยินดีที่จะเสียสละเวลาเพื่อดูแลการฝึกซ้อมอย่างเต็มกำลังความสามารถ ดังนั้น จึงได้ดำเนินการทำกิจกรรมและฝึกซ้อมในช่วงปิดภาคเรียน 
            <strong> ในระหว่างวันที่ ๙ - ๑๕ ตุลาคม ๒๕๖๗ </strong> ณ ห้อง อส๕ ห้องขับร้องประสานเสียง อาคารเอนกประสงค์ ชั้น นั้น
          </p>
          <p style={{ textIndent: '2rem', marginBottom: '1rem', textAlign: 'justify' }}>
            ในการนี้ โรงเรียนพะเยาพิทยาคม จึงขออนุญาตนำนักเรียนในความปกครองของท่าน ทำกิจกรรมและฝึกซ้อมในช่วงปิดภาคเรียน 
            โดยกำหนดการฝึกซ้อม ดังนี้ วงขับร้องประสานเสียง : ทำการฝึกซ้อมในทุกวันจันทร์ วันพุธ และวันศุกร์ เวลา ๐๙.๐๐ - ๑๕.๐๐ น. 
            โดยขอความร่วมมือผู้ปกครองกำชับและติดตามการเดินทางกลับ หรือ รับ-ส่งนักเรียน
          </p>
        </div>

        {/* Signature Section */}
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Edit3 size={20} color="var(--accent-primary)" />
          ส่วนสำหรับผู้ปกครองกรอก
        </h3>

        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 'bold' }}>1. การอนุญาตเข้าร่วมกิจกรรม</label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div 
                onClick={() => setIsAllowed(true)}
                style={{ 
                  flex: 1, padding: '1rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                  background: isAllowed === true ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: isAllowed === true ? '2px solid var(--success)' : '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                <CheckCircle size={20} color={isAllowed === true ? 'var(--success)' : 'var(--text-secondary)'} />
                <span style={{ color: isAllowed === true ? 'var(--success)' : 'inherit', fontWeight: isAllowed === true ? 'bold' : 'normal' }}>
                  อนุญาตให้นักเรียนเข้าร่วมกิจกรรม
                </span>
              </div>
              <div 
                onClick={() => setIsAllowed(false)}
                style={{ 
                  flex: 1, padding: '1rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                  background: isAllowed === false ? 'rgba(255, 71, 87, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: isAllowed === false ? '2px solid var(--danger)' : '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                <XCircle size={20} color={isAllowed === false ? 'var(--danger)' : 'var(--text-secondary)'} />
                <span style={{ color: isAllowed === false ? 'var(--danger)' : 'inherit', fontWeight: isAllowed === false ? 'bold' : 'normal' }}>
                  ไม่อนุญาตให้นักเรียนเข้าร่วมกิจกรรม
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>2. ชื่อ-นามสกุล ผู้ปกครอง</label>
            <input 
              type="text" 
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              className="input-field" 
              placeholder="นาย / นาง / นางสาว ..."
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 'bold' }}>3. ลายมือชื่อผู้ปกครอง (ใช้นิ้วเขียนบนกรอบด้านล่าง)</label>
              <button onClick={clearSignature} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>
                ลบ/เขียนใหม่
              </button>
            </div>
            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '2px dashed rgba(255,255,255,0.3)' }}>
              <SignatureCanvas 
                ref={sigPad}
                penColor="blue"
                canvasProps={{ 
                  className: 'signature-canvas',
                  style: { width: '100%', height: '200px' } 
                }}
              />
            </div>
          </div>

        </div>

        <button 
          onClick={handleSubmit} 
          disabled={submitting}
          className="btn-primary" 
          style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? 'กำลังส่งข้อมูล...' : 'ส่งใบขออนุญาต'}
        </button>
      </div>
    </div>
  );
}
