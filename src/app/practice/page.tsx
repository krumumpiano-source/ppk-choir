'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mic2, Send, Loader2, Link as LinkIcon } from 'lucide-react';
import { submitPracticeLink } from '../../lib/services/practice';
import { updateStreakAndBadges } from '../../lib/services/gamification';
import { VoiceType } from '../../lib/services/library';
import { useAuth } from '@/components/providers/AuthProvider';
import GoogleDrivePlayer from '@/components/GoogleDrivePlayer';

export default function PracticePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [reflection, setReflection] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [streakData, setStreakData] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !driveUrl || !reflection) {
      setMessage('กรุณาใส่ลิงก์ผลงานและเขียนสะท้อนผลให้ครบถ้วน');
      return;
    }

    if (!driveUrl.includes('drive.google.com')) {
      setMessage('กรุณาใส่ลิงก์จาก Google Drive เท่านั้น');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    // 1. Upload Record (Link)
    const result = await submitPracticeLink(driveUrl, {
      studentId: user.id,
      studentName: user.name,
      voiceType: user.voiceType as VoiceType,
      reflection
    });

    if (result.success) {
      // 2. Update Gamification Streak
      const streakResult = await updateStreakAndBadges(user.id);
      if (streakResult.success) {
        setStreakData(streakResult.stats);
      }
      
      setShowSuccess(true);
    } else {
      setMessage('เกิดข้อผิดพลาดในการส่งงาน กรุณาลองใหม่');
    }
    
    setIsSubmitting(false);
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
      </div>
    );
  }

  if (!user) return null;

  if (showSuccess) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '3rem 2rem' }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <Mic2 size={40} color="white" />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--success)' }}>ส่งงานซ้อมสำเร็จ!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>ผลงานของคุณถูกส่งให้คุณครูประเมินเรียบร้อยแล้ว</p>
          
          {streakData && (
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-primary)' }}>🔥 Streak ปัจจุบัน: {streakData.streak} วัน</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>รักษาความต่อเนื่องไว้เพื่อรับเหรียญรางวัลพิเศษ!</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/dashboard" className="btn-primary">
              กลับไปหน้าแรก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={24} />
        </Link>
        <Mic2 size={32} color="var(--accent-primary)" />
        <h1 style={{ margin: 0, fontSize: '2rem' }}>บันทึกและสะท้อนการซ้อม</h1>
      </div>

      <div className="glass-panel animate-fade-in">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* ข้อมูลเบื้องต้น ดึงจาก Auth อัตโนมัติ */}
          <div style={{ display: 'flex', gap: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
             <div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block' }}>ผู้ส่งงาน</span>
                <strong>{user.name}</strong>
             </div>
             <div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block' }}>รหัสนักเรียน</span>
                <strong>{user.id}</strong>
             </div>
             <div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block' }}>แนวเสียง</span>
                <strong>{user.voiceType}</strong>
             </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>1. อัปโหลดผลงาน (Google Drive Link)</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              อัดวิดีโอหรือเสียงร้องของคุณ อัปโหลดลง Google Drive ตั้งค่าเป็น "Anyone with the link" แล้วนำลิงก์มาวางที่นี่
            </p>
            <input 
              type="url" 
              className="input-field" 
              style={{ width: '100%' }}
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
            />
            {driveUrl && driveUrl.includes('drive.google.com') && (
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ตัวอย่างผลงาน:</label>
                <GoogleDrivePlayer url={driveUrl} />
              </div>
            )}
          </div>

          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>2. สะท้อนผล (Self-Reflection)</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              เล่าสิ่งที่คุณทำได้ดีในวันนี้ และสิ่งที่คิดว่าต้องปรับปรุงในครั้งต่อไป
            </p>
            <textarea 
              className="input-field" 
              style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
              placeholder="เช่น วันนี้ร้องโน้ตสูงได้ดีขึ้น แต่จังหวะช่วงท่อนฮุคยังคร่อมอยู่..."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
            />
          </div>

          {message && (
            <div style={{ color: 'var(--danger)', textAlign: 'center', background: 'rgba(255, 71, 87, 0.1)', padding: '1rem', borderRadius: '8px' }}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isSubmitting || !driveUrl}
            style={{ 
              padding: '1rem', 
              fontSize: '1.2rem', 
              marginTop: '1rem',
              opacity: (isSubmitting || !driveUrl) ? 0.5 : 1
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                กำลังส่งผลงาน...
              </>
            ) : (
              <>
                <Send size={24} />
                ส่งผลงานให้คุณครูตรวจ
              </>
            )}
          </button>

        </form>
      </div>

    </div>
  );
}
