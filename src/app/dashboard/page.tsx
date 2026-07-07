'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User as UserIcon, Mic2, MapPin, Library, Award, Flame, Users, Calendar, Activity, Loader2, LogOut } from 'lucide-react';
import { getStudentStats, StudentStats } from '../../lib/services/gamification';
import { getStudentPractices, PracticeRecord } from '../../lib/services/practice';
import { useAuth } from '@/components/providers/AuthProvider';

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [practices, setPractices] = useState<PracticeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (user?.id) {
        const [statsData, practiceData] = await Promise.all([
          getStudentStats(user.id),
          getStudentPractices(user.id)
        ]);
        setStats(statsData);
        setPractices(practiceData);
      }
      setLoading(false);
    }
    
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (authLoading || loading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      {/* Header Profile */}
      <div className="glass-panel animate-fade-in" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2rem', marginBottom: '2rem', position: 'relative' }}>
        
        <button onClick={handleLogout} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={18} />
          <span style={{ fontSize: '0.9rem' }}>ออกจากระบบ</span>
        </button>

        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(230, 185, 128, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UserIcon size={40} color="var(--accent-primary)" />
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem' }}>{user.name} (รหัส: {user.id})</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>แนวเสียง: {user.voiceType}</p>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', color: '#ff9f43', fontSize: '1.5rem', fontWeight: 'bold' }}>
              <Flame size={24} /> {stats?.streak || 0}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Streak (วัน)</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', color: 'var(--accent-primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>
              <Award size={24} /> {stats?.badges?.length || 0}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>เหรียญรางวัล</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>เมนูด่วน</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        
        <Link href="/check-in" className="glass-panel animate-fade-in delay-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textDecoration: 'none', padding: '1.5rem', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <div style={{ background: 'rgba(230, 185, 128, 0.1)', padding: '1rem', borderRadius: '50%' }}>
            <MapPin size={32} color="var(--accent-primary)" />
          </div>
          <span style={{ fontWeight: 500 }}>เช็คชื่อ (GPS)</span>
        </Link>
        
        <Link href="/library" className="glass-panel animate-fade-in delay-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textDecoration: 'none', padding: '1.5rem', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <div style={{ background: 'rgba(230, 185, 128, 0.1)', padding: '1rem', borderRadius: '50%' }}>
            <Library size={32} color="var(--accent-primary)" />
          </div>
          <span style={{ fontWeight: 500 }}>คลังสื่อฝึกซ้อม</span>
        </Link>

        <Link href="/practice" className="glass-panel animate-fade-in delay-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textDecoration: 'none', padding: '1.5rem', transition: 'transform 0.2s', cursor: 'pointer', border: '1px solid var(--accent-primary)' }}>
          <div style={{ background: 'var(--accent-primary)', padding: '1rem', borderRadius: '50%' }}>
            <Mic2 size={32} color="#000" />
          </div>
          <span style={{ fontWeight: 500, color: 'var(--accent-primary)' }}>ส่งงานอัดเสียง</span>
        </Link>

        <Link href="/peers" className="glass-panel animate-fade-in delay-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textDecoration: 'none', padding: '1.5rem', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <div style={{ background: 'rgba(230, 185, 128, 0.1)', padding: '1rem', borderRadius: '50%' }}>
            <Users size={32} color="var(--accent-primary)" />
          </div>
          <span style={{ fontWeight: 500 }}>ฟังเพื่อนแนวเดียวกัน</span>
        </Link>

      </div>

      {/* History */}
      <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>ประวัติการส่งงาน</h2>
      <div className="glass-panel animate-fade-in delay-3" style={{ padding: '0' }}>
        {practices.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            ยังไม่มีประวัติการส่งงาน เริ่มอัดเสียงครั้งแรกของคุณได้เลย!
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {practices.map((practice, index) => (
              <li key={practice.id} style={{ padding: '1.5rem', borderBottom: index < practices.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <Calendar size={16} /> 
                    {practice.timestamp ? new Date(practice.timestamp.seconds * 1000).toLocaleDateString('th-TH') : 'กำลังดำเนินการ'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: practice.rubricScore ? 'var(--success)' : '#f39c12' }}>
                    <Activity size={16} />
                    {practice.rubricScore ? 'ตรวจแล้ว' : 'รอการประเมิน'}
                  </div>
                </div>
                
                <p style={{ margin: '0 0 1rem 0', fontStyle: 'italic' }}>&quot;{practice.reflection}&quot;</p>
                
                <audio src={practice.audioUrl} controls style={{ width: '100%', height: '40px' }} />

                {practice.rubricScore && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(46, 213, 115, 0.1)', borderRadius: '8px', border: '1px solid rgba(46, 213, 115, 0.2)' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--success)' }}>ผลการประเมินจากครู</h4>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      <span>ระดับเสียง: {practice.rubricScore.pitch}/5</span>
                      <span>จังหวะ: {practice.rubricScore.rhythm}/5</span>
                      <span>เทคนิค: {practice.rubricScore.technique}/5</span>
                    </div>
                    {practice.rubricScore.feedback && (
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <strong>ข้อเสนอแนะ:</strong> {practice.rubricScore.feedback}
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
