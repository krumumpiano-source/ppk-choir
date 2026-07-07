'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { getPendingAssessments, submitRubricScore, PracticeRecord, RubricScore } from '../../../lib/services/practice';
import { awardBadge } from '../../../lib/services/gamification';
import { useAuth } from '@/components/providers/AuthProvider';

export default function AdminAssessPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [pendingWorks, setPendingWorks] = useState<PracticeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State สำหรับเก็บฟอร์มที่กำลังประเมิน (id -> RubricScore)
  const [assessments, setAssessments] = useState<Record<string, RubricScore>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login');
      return;
    }
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user, authLoading, router]);

  async function loadData() {
    setLoading(true);
    const data = await getPendingAssessments();
    setPendingWorks(data);
    
    // Initialize empty form state for all pending works
    const initForm: Record<string, RubricScore> = {};
    data.forEach(work => {
      initForm[work.id!] = { pitch: 0, rhythm: 0, technique: 0, feedback: '' };
    });
    setAssessments(initForm);
    
    setLoading(false);
  }

  const handleScoreChange = (recordId: string, field: keyof RubricScore, value: any) => {
    setAssessments(prev => ({
      ...prev,
      [recordId]: { ...prev[recordId], [field]: value }
    }));
  };

  const handleSubmit = async (recordId: string, studentId: string) => {
    const score = assessments[recordId];
    if (score.pitch === 0 || score.rhythm === 0 || score.technique === 0) {
      alert('กรุณาให้คะแนนให้ครบทุกช่อง (อย่างน้อย 1 คะแนน)');
      return;
    }

    setSubmittingId(recordId);

    // 1. ส่งผลประเมิน
    const result = await submitRubricScore(recordId, score);
    
    if (result.success) {
      // 2. เช็ค Gamification (Perfect Pitch)
      if (score.pitch === 5) {
        await awardBadge(studentId, 'perfect_pitch');
      }

      // 3. เอาออกจาก List
      setPendingWorks(prev => prev.filter(w => w.id !== recordId));
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกคะแนน');
    }

    setSubmittingId(null);
  };

  if (authLoading || !user) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <Link href="/admin/dashboard" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={24} />
        </Link>
        <ClipboardCheck size={32} color="var(--accent-primary)" />
        <h1 style={{ margin: 0, fontSize: '2rem' }}>ตรวจผลงานนักเรียน (Rubric)</h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--accent-primary)' }}>
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : pendingWorks.length === 0 ? (
        <div className="glass-panel animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <CheckCircle2 size={64} color="var(--success)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>ยอดเยี่ยม! ไม่มีงานค้างตรวจ</h2>
          <p style={{ color: 'var(--text-secondary)' }}>นักเรียนทุกคนได้รับการประเมินเรียบร้อยแล้ว</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {pendingWorks.map((work) => (
            <div key={work.id} className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-primary)' }}>{work.studentName} ({work.studentId})</h2>
                  <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.8rem', borderRadius: '50px', fontSize: '0.9rem' }}>
                    {work.voiceType}
                  </span>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  ส่งเมื่อ: {work.timestamp ? new Date(work.timestamp.seconds * 1000).toLocaleString('th-TH') : '-'}
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Self-Reflection:</h4>
                <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--accent-secondary)' }}>
                  &quot;{work.reflection}&quot;
                </p>
              </div>

              <audio src={work.audioUrl} controls style={{ width: '100%', marginBottom: '2rem' }} />

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ClipboardCheck size={20} color="var(--accent-primary)" /> ให้คะแนน (Rubric)
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>ระดับเสียง (Pitch) 1-5</label>
                    <input 
                      type="number" min="0" max="5" className="input-field"
                      value={assessments[work.id!]?.pitch || ''}
                      onChange={(e) => handleScoreChange(work.id!, 'pitch', Number(e.target.value))}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>จังหวะ (Rhythm) 1-5</label>
                    <input 
                      type="number" min="0" max="5" className="input-field"
                      value={assessments[work.id!]?.rhythm || ''}
                      onChange={(e) => handleScoreChange(work.id!, 'rhythm', Number(e.target.value))}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>เทคนิค (Technique) 1-5</label>
                    <input 
                      type="number" min="0" max="5" className="input-field"
                      value={assessments[work.id!]?.technique || ''}
                      onChange={(e) => handleScoreChange(work.id!, 'technique', Number(e.target.value))}
                    />
                  </div>

                </div>

                <div className="input-group">
                  <label>ข้อเสนอแนะเพิ่มเติม (Feedback)</label>
                  <textarea 
                    className="input-field" 
                    rows={3} 
                    placeholder="พิมพ์คำแนะนำเพื่อให้นักเรียนนำไปพัฒนาต่อ..."
                    value={assessments[work.id!]?.feedback || ''}
                    onChange={(e) => handleScoreChange(work.id!, 'feedback', e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button 
                    onClick={() => handleSubmit(work.id!, work.studentId)}
                    disabled={submittingId === work.id}
                    className="btn-primary"
                    style={{ opacity: submittingId === work.id ? 0.7 : 1 }}
                  >
                    {submittingId === work.id ? <><Loader2 size={18} className="animate-spin" /> กำลังบันทึก...</> : 'บันทึกการประเมิน'}
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
