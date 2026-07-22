'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Link as LinkIcon, FileAudio, Loader2 } from 'lucide-react';
import { saveLibraryItemLink, VoiceType } from '../../../lib/services/library';
import { useAuth } from '@/components/providers/AuthProvider';
import GoogleDrivePlayer from '@/components/GoogleDrivePlayer';

export default function AdminLibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [voiceType, setVoiceType] = useState<VoiceType | 'All'>('All');
  const [driveUrl, setDriveUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !driveUrl || voiceType === 'All') {
      setMessage('กรุณากรอกข้อมูลและเลือกแนวเสียงให้ครบถ้วน (ไม่สามารถเลือก All ได้)');
      return;
    }

    if (!driveUrl.includes('drive.google.com')) {
      setMessage('กรุณาใส่ลิงก์จาก Google Drive เท่านั้น');
      return;
    }

    setIsUploading(true);
    setMessage('');

    const result = await saveLibraryItemLink(driveUrl, voiceType as VoiceType, title);

    setIsUploading(false);

    if (result.success) {
      setMessage('เพิ่มสื่อการสอนสำเร็จ!');
      setTitle('');
      setDriveUrl('');
    } else {
      setMessage('เกิดข้อผิดพลาดในการเพิ่มข้อมูล กรุณาลองใหม่');
    }
  };

  if (authLoading || !user) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <Link href="/admin/dashboard" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={24} />
        </Link>
        <FileAudio size={32} color="var(--accent-primary)" />
        <h1 style={{ margin: 0, fontSize: '2rem' }}>จัดการคลังเสียง (Google Drive)</h1>
      </div>

      <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
          เพิ่มสื่อการสอนใหม่ (แปะลิงก์ Drive)
        </h3>

        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="input-group">
            <label>ชื่อเพลง / แบบฝึกซ้อม</label>
            <input 
              type="text" 
              className="input-field" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น เพลงสรรเสริญพระบารมี (ท่อนแรก)"
            />
          </div>

          <div className="input-group">
            <label>หมวดหมู่ (แนวเสียง)</label>
            <select className="input-field" value={voiceType} 
                onChange={(e) => setVoiceType(e.target.value as VoiceType)}
                style={{ appearance: 'auto' }}
              >
                <option value="All">ทั้งหมด (ทุกแนวเสียง)</option>
                <option value="Soprano 1">Soprano 1</option>
                <option value="Soprano 2">Soprano 2</option>
                <option value="Alto 1">Alto 1</option>
                <option value="Alto 2">Alto 2</option>
                <option value="Tenor 1">Tenor 1</option>
                <option value="Tenor 2">Tenor 2</option>
                <option value="Baritone">Baritone</option>
                <option value="Bass">Bass</option>
              </select>
          </div>

          <div className="input-group">
            <label>ลิงก์ Google Drive (ไฟล์เสียงหรือวิดีโอ)</label>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
              อย่าลืมตั้งค่าสิทธิ์ไฟล์เป็น "Anyone with the link (ทุกคนที่มีลิงก์)" ก่อนนำมาแปะ
            </p>
            <input 
              type="url" 
              className="input-field" 
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
            />
          </div>

          {driveUrl && driveUrl.includes('drive.google.com') && (
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>ตัวอย่างเครื่องเล่น (Preview):</label>
              <GoogleDrivePlayer url={driveUrl} />
            </div>
          )}

          {message && (
            <div style={{ 
              padding: '1rem', 
              borderRadius: '8px', 
              background: message.includes('สำเร็จ') ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)',
              color: message.includes('สำเร็จ') ? 'var(--success)' : 'var(--danger)',
              border: `1px solid ${message.includes('สำเร็จ') ? 'var(--success)' : 'var(--danger)'}`
            }}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isUploading}
            style={{ marginTop: '1rem', opacity: isUploading ? 0.7 : 1 }}
          >
            {isUploading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <LinkIcon size={20} />
                บันทึกลิงก์สื่อการสอน
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
