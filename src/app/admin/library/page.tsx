'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileAudio, Loader2 } from 'lucide-react';
import { uploadLibraryItem, VoiceType } from '../../../lib/services/library';
import { useAuth } from '@/components/providers/AuthProvider';

export default function AdminLibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [voiceType, setVoiceType] = useState<VoiceType | 'All'>('All');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file || voiceType === 'All') {
      setMessage('กรุณากรอกข้อมูลและเลือกแนวเสียงให้ครบถ้วน (ไม่สามารถเลือก All ได้)');
      return;
    }

    setIsUploading(true);
    setMessage('');

    const result = await uploadLibraryItem(file, voiceType as VoiceType, title);

    setIsUploading(false);

    if (result.success) {
      setMessage('อัปโหลดไฟล์สำเร็จ!');
      setTitle('');
      setFile(null);
      // reset file input visually
      const fileInput = document.getElementById('audio-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } else {
      setMessage('เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่');
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
        <h1 style={{ margin: 0, fontSize: '2rem' }}>จัดการคลังเสียง</h1>
      </div>

      <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
          อัปโหลดสื่อการสอนใหม่
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
            <label>ไฟล์เสียง (.mp3, .wav, .m4a)</label>
            <div style={{ 
              border: '2px dashed rgba(255,255,255,0.2)', 
              borderRadius: '8px', 
              padding: '2rem', 
              textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              position: 'relative'
            }}>
              <input 
                id="audio-upload"
                type="file" 
                accept="audio/*"
                onChange={handleFileChange}
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
              <div style={{ pointerEvents: 'none' }}>
                <Upload size={32} color="var(--text-secondary)" style={{ margin: '0 auto 1rem auto' }} />
                {file ? (
                  <p style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>{file.name}</p>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>คลิกหรือลากไฟล์มาวางที่นี่</p>
                )}
              </div>
            </div>
          </div>

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
                กำลังอัปโหลด...
              </>
            ) : (
              <>
                <Upload size={20} />
                อัปโหลดไฟล์เสียง
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
