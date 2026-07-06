'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Download, Loader2, Calendar } from 'lucide-react';
import { getCheckInReports, ReportData, ReportPeriod } from '@/lib/services/reports';
import { useAuth } from '@/components/providers/AuthProvider';
import html2canvas from 'html2canvas';

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [data, setData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login');
      return;
    }
    
    if (user?.role === 'admin') {
      loadData(period);
    }
  }, [user, authLoading, router, period]);

  async function loadData(selectedPeriod: ReportPeriod) {
    setLoading(true);
    const result = await getCheckInReports(selectedPeriod);
    setData(result);
    setLoading(false);
  }

  const handleExportImage = async () => {
    if (!reportRef.current) return;
    
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // High resolution
        backgroundColor: '#121212', // Match dark theme background
        logging: false
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      
      const dateLabel = period === 'week' ? 'รายสัปดาห์' : period === 'month' ? 'รายเดือน' : 'รายปี';
      link.download = `รายงานเช็คชื่อ_${dateLabel}_${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
      alert('เกิดข้อผิดพลาดในการสร้างรูปภาพ');
    } finally {
      setExporting(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/admin/dashboard" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={24} />
          </Link>
          <FileText size={32} color="var(--accent-primary)" />
          <h1 style={{ margin: 0, fontSize: '2rem' }}>รายงานการเช็คชื่อ</h1>
        </div>
        
        <button 
          onClick={handleExportImage}
          disabled={loading || data.length === 0 || exporting}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: (loading || data.length === 0 || exporting) ? 0.5 : 1 }}
        >
          {exporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
          บันทึกเป็นรูปภาพ
        </button>
      </div>

      <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Calendar size={24} color="var(--accent-primary)" />
        <span style={{ fontWeight: 600 }}>เลือกช่วงเวลา:</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['week', 'month', 'year'] as ReportPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: period === p ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                background: period === p ? 'rgba(230, 185, 128, 0.1)' : 'transparent',
                color: period === p ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {p === 'week' ? '7 วันที่ผ่านมา' : p === 'month' ? '1 เดือนที่ผ่านมา' : '1 ปีที่ผ่านมา'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--accent-primary)' }}>
          <Loader2 size={40} className="animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="glass-panel animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>ไม่มีข้อมูลการเช็คชื่อในช่วงเวลานี้</h3>
        </div>
      ) : (
        <div 
          ref={reportRef} 
          style={{ 
            background: 'var(--bg-secondary)', 
            padding: '2rem', 
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--accent-primary)', margin: '0 0 0.5rem 0' }}>สรุปรายงานการเช็คชื่อกิจกรรมชุมนุม</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              {period === 'week' ? 'รายสัปดาห์' : period === 'month' ? 'รายเดือน' : 'รายปี'} 
              (พิมพ์เมื่อ: {new Date().toLocaleDateString('th-TH')})
            </p>
          </div>

          <div style={{ display: 'grid', gap: '2rem' }}>
            {data.map((roomGroup) => (
              <div key={roomGroup.room} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--accent-secondary)' }}>ห้อง: {roomGroup.room}</h3>
                  <span style={{ background: 'rgba(46, 213, 115, 0.1)', color: 'var(--success)', padding: '0.3rem 0.8rem', borderRadius: '50px', fontSize: '0.9rem', fontWeight: 600 }}>
                    รวม {roomGroup.count} ครั้ง
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                  {roomGroup.students.map((checkin, idx) => (
                    <div key={idx} style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 500 }}>{checkin.studentName} ({checkin.studentId})</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {checkin.timestamp ? new Date(checkin.timestamp.seconds * 1000).toLocaleString('th-TH') : 'ไม่ทราบเวลา'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            <p>รายงานสร้างจากระบบ PPK CHOIR (ชุมนุมสานฝันด้วยเส้นเสียง)</p>
          </div>
        </div>
      )}

    </div>
  );
}
