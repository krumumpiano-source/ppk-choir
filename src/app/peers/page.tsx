'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Heart, MessageSquare, Loader2 } from 'lucide-react';
import { getPeerPractices, likePracticeRecord, PracticeRecord } from '../../lib/services/practice';
import { VoiceType } from '../../lib/services/library';

export default function PeersPage() {
  const [studentVoiceType, setStudentVoiceType] = useState<VoiceType>('Soprano'); // สำหรับ Demo
  const [practices, setPractices] = useState<PracticeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [likingId, setLikingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getPeerPractices(studentVoiceType);
      setPractices(data);
      setLoading(false);
    }
    
    loadData();
  }, [studentVoiceType]);

  const handleLike = async (recordId: string, currentLikes: number) => {
    setLikingId(recordId);
    const result = await likePracticeRecord(recordId, currentLikes);
    if (result.success) {
      setPractices(prev => prev.map(p => 
        p.id === recordId ? { ...p, likes: p.likes + 1 } : p
      ));
    }
    setLikingId(null);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={24} />
        </Link>
        <Users size={32} color="var(--accent-primary)" />
        <h1 style={{ margin: 0, fontSize: '2rem' }}>ผลงานเพื่อนแนวเสียงเดียวกัน</h1>
      </div>

      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>คุณกำลังดูผลงานของแนวเสียง:</span>
        <span style={{ background: 'rgba(230, 185, 128, 0.2)', color: 'var(--accent-primary)', padding: '0.3rem 1rem', borderRadius: '50px', fontWeight: 600 }}>
          {studentVoiceType}
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--accent-primary)' }}>
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : practices.length === 0 ? (
        <div className="glass-panel animate-fade-in" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          ยังไม่มีผลงานของเพื่อนในแนวเสียงนี้
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {practices.map((practice, index) => (
            <div key={practice.id} className="glass-panel animate-fade-in" style={{ animationDelay: `${index * 0.1}s`, padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.2rem' }}>{practice.studentName}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {practice.timestamp ? new Date(practice.timestamp.seconds * 1000).toLocaleString('th-TH') : 'เมื่อสักครู่'}
                  </span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', borderLeft: '4px solid var(--accent-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <MessageSquare size={16} style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                  <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.95rem' }}>
                    "{practice.reflection}"
                  </p>
                </div>
              </div>

              <audio src={practice.audioUrl} controls style={{ width: '100%', height: '40px', marginBottom: '1rem' }} />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => handleLike(practice.id!, practice.likes)}
                  disabled={likingId === practice.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'transparent',
                    border: '1px solid rgba(230, 185, 128, 0.3)',
                    color: 'var(--accent-primary)',
                    padding: '0.5rem 1rem',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: likingId === practice.id ? 0.5 : 1
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(230, 185, 128, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Heart size={18} fill={practice.likes > 0 ? 'currentColor' : 'none'} />
                  <span>{practice.likes} ให้กำลังใจ</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
