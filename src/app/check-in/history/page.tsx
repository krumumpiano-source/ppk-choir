'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Loader2, ArrowLeft, Calendar, Clock, MapPin, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface CheckinHistoryRecord {
  id: string;
  timestamp: string;
  checkoutTime: string | null;
  sessionName: string;
  sessionType: string;
}

export default function CheckinHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<CheckinHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadHistory() {
      if (!user) return;
      try {
        const res = await fetch(`/api/checkin/history`);
        const data = await res.json();
        if (res.ok) {
          setHistory(data.history || []);
        } else {
          toast.error(data.error || 'โหลดข้อมูลไม่สำเร็จ');
        }
      } catch (e) {
        toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      } finally {
        setLoading(false);
      }
    }
    
    if (user && !authLoading) {
      loadHistory();
    }
  }, [user, authLoading]);

  const formatTime = (iso: string | null) => {
    if (!iso) return '-';
    let safeIso = iso;
    if (!iso.endsWith('Z') && !iso.includes('+')) {
      safeIso = iso.replace(' ', 'T') + 'Z';
    }
    return new Date(safeIso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
      <div className="glass-panel animate-fade-in" style={{ position: 'relative' }}>
        <Link href="/dashboard" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={20} />
        </Link>
        
        <h1 style={{ textAlign: 'center', fontSize: '1.8rem', margin: '0 0 2rem 0' }}>ประวัติการเข้าซ้อม</h1>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            ยังไม่มีประวัติการเช็คชื่อ
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map((record) => (
              <div key={record.id} style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.3rem 0', color: 'var(--accent-primary)', fontSize: '1.2rem' }}>
                      {record.sessionName || 'กิจกรรม'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <Calendar size={16} />
                      <span>{formatDate(record.timestamp)}</span>
                    </div>
                  </div>
                  {record.checkoutTime ? (
                    <div style={{ background: 'rgba(46, 213, 115, 0.1)', color: 'var(--success)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle size={14} /> สำเร็จ
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(243, 156, 18, 0.1)', color: '#f39c12', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem' }}>
                      ยังไม่ได้สแกนออก
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ background: 'rgba(46, 213, 115, 0.2)', padding: '0.5rem', borderRadius: '50%', color: 'var(--success)' }}>
                      <MapPin size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>เวลาเข้า</div>
                      <div style={{ fontWeight: 'bold' }}>{formatTime(record.timestamp)}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ background: record.checkoutTime ? 'rgba(255, 71, 87, 0.2)' : 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '50%', color: record.checkoutTime ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      <Clock size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>เวลาออก</div>
                      <div style={{ fontWeight: 'bold', color: record.checkoutTime ? '#fff' : 'var(--text-secondary)' }}>
                        {formatTime(record.checkoutTime)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
