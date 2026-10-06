'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle, XCircle, Search, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminConsentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [consents, setConsents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
          setConsents(data.consents || []);
        } else {
          toast.error(data.error || 'โหลดข้อมูลล้มเหลว');
        }
      } catch (e) {
        toast.error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      } finally {
        setLoading(false);
      }
    }

    if (user && (user.role === 'admin' || user.role === 'section_leader')) {
      fetchConsents();
    }
  }, [user]);

  const filteredConsents = consents.filter(c => 
    (c.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.actualStudentId || '').includes(searchTerm)
  );

  const allowedCount = consents.filter(c => c.isAllowed).length;
  const disallowedCount = consents.filter(c => !c.isAllowed).length;

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/admin/dashboard" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={24} />
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>จัดการใบขออนุญาตผู้ปกครอง</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel animate-fade-in delay-1" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '50%' }}>
            <CheckCircle size={32} color="var(--success)" />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{allowedCount}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>อนุญาต</div>
          </div>
        </div>
        <div className="glass-panel animate-fade-in delay-2" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '50%' }}>
            <XCircle size={32} color="var(--danger)" />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{disallowedCount}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ไม่อนุญาต</div>
          </div>
        </div>
      </div>

      <div className="glass-panel animate-fade-in delay-3" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อหรือรหัสนักเรียน..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.5rem', margin: 0 }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>นักเรียน</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>การอนุญาต</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>ชื่อผู้ปกครอง</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>ลายเซ็น</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>วันที่เซ็น</th>
              </tr>
            </thead>
            <tbody>
              {filteredConsents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>ไม่มีข้อมูลใบขออนุญาต</td>
                </tr>
              ) : (
                filteredConsents.map((consent) => (
                  <tr key={consent.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 'bold' }}>{consent.studentName}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>รหัส: {consent.actualStudentId} • {consent.voiceType}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {consent.isAllowed ? (
                        <span style={{ background: 'rgba(46, 213, 115, 0.1)', color: 'var(--success)', padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.85rem' }}>อนุญาต</span>
                      ) : (
                        <span style={{ background: 'rgba(255, 71, 87, 0.1)', color: 'var(--danger)', padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.85rem' }}>ไม่อนุญาต</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {consent.parentName}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ background: '#fff', borderRadius: '4px', padding: '0.2rem', display: 'inline-block' }}>
                        <img src={consent.signatureData} alt="Signature" style={{ height: '40px' }} />
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {new Date(consent.timestamp).toLocaleDateString('th-TH')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
