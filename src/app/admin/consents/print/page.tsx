'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function ConsentPrintPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id'); // Can be 'all' or specific student ID
  
  const [consents, setConsents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'section_leader'))) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchConsents() {
      try {
        const res = await fetch('/api/admin/consents');
        const data = await res.json();
        if (res.ok) {
          if (id === 'all') {
            setConsents(data.consents || []);
          } else {
            setConsents((data.consents || []).filter((c: any) => c.studentId === id));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    if (user && (user.role === 'admin' || user.role === 'section_leader')) {
      fetchConsents();
    }
  }, [user, id]);

  useEffect(() => {
    if (!loading && consents.length > 0) {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [loading, consents]);

  if (loading || authLoading) return <div>กำลังโหลดข้อมูล...</div>;
  if (consents.length === 0) return <div>ไม่พบข้อมูล</div>;

  return (
    <div style={{ background: '#fff', color: '#000', minHeight: '100vh', fontFamily: '"Sarabun", "TH Sarabun PSK", sans-serif' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; margin: 0; padding: 0; }
          .page-break { page-break-after: always; }
          @page { size: A4; margin: 2cm; }
        }
      `}} />
      
      {consents.map((consent, index) => (
        <div key={consent.id} className="page-break" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', boxSizing: 'border-box' }}>
          
          <div style={{ borderBottom: '1px dashed #000', marginBottom: '2rem', position: 'relative' }}>
             <span style={{ position: 'absolute', right: 0, bottom: '-10px', background: '#fff', padding: '0 10px', fontSize: '20px' }}>✂️</span>
          </div>
          
          <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '1.5rem' }}>หนังสือตอบรับ</h2>
          
          <div style={{ fontSize: '20px', lineHeight: '1.8' }}>
            <div style={{ display: 'flex', marginBottom: '1rem' }}>
              <div style={{ width: '80px' }}>เรียน</div>
              <div>ผู้อำนวยการโรงเรียนพะเยาพิทยาคม</div>
            </div>
            
            <div style={{ textIndent: '40px' }}>
              ข้าพเจ้า <span style={{ display: 'inline-block', borderBottom: '1px dotted #000', minWidth: '350px', textAlign: 'center' }}>{consent.parentName}</span>
            </div>
            
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              <div>ผู้ปกครองของ</div>
              <div style={{ borderBottom: '1px dotted #000', flex: 1, textAlign: 'center' }}>{consent.studentName}</div>
              <div>ชั้น ม.</div>
              <div style={{ borderBottom: '1px dotted #000', width: '100px', textAlign: 'center' }}>{consent.section || ''}</div>
            </div>
            
            <div style={{ marginTop: '1.5rem', paddingLeft: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '20px', height: '20px', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                  {!consent.isAllowed ? '✓' : ''}
                </div>
                <div>ไม่อนุญาตให้นักเรียนในความปกครองของข้าพเจ้าเข้าร่วมกิจกรรม</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '20px', height: '20px', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                  {consent.isAllowed ? '✓' : ''}
                </div>
                <div>อนุญาตให้นักเรียนในความปกครองของข้าพเจ้าเข้าร่วมกิจกรรม</div>
              </div>
            </div>
            
            <div style={{ textIndent: '40px', marginTop: '1.5rem' }}>
              จึงเรียนมาเพื่อทราบ
            </div>
            
            <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div>ลงชื่อ</div>
                <div style={{ borderBottom: '1px dotted #000', width: '250px', textAlign: 'center', position: 'relative' }}>
                  {consent.signatureData && (
                    <img 
                      src={consent.signatureData} 
                      alt="Signature" 
                      style={{ height: '50px', position: 'absolute', bottom: '5px', left: '50%', transform: 'translateX(-50%)' }} 
                    />
                  )}
                </div>
              </div>
              <div style={{ width: '250px', textAlign: 'center' }}>
                ({consent.parentName})
              </div>
            </div>
            
          </div>
        </div>
      ))}
      
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem' }} className="print-hidden">
        <button onClick={() => window.print()} className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          พิมพ์เอกสาร (Print)
        </button>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .print-hidden { display: none !important; }
        }
      `}} />
    </div>
  );
}
