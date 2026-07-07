'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, User, Loader2, Camera } from 'lucide-react';
import { createUser } from '@/lib/services/users';
import { VoiceType } from '@/lib/services/library';
import { toast } from 'react-hot-toast';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function RegisterPage() {
  const router = useRouter();
  
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [room, setRoom] = useState('');
  const [voiceType, setVoiceType] = useState<VoiceType>('Soprano 1');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId.trim() || !studentName.trim() || !room.trim() || !photo) {
      toast.error('กรุณากรอกข้อมูลและถ่ายรูปให้ครบถ้วน');
      return;
    }

    setLoading(true);

    try {
      // Upload photo first
      const photoRef = ref(storage, `profiles/${studentId.trim()}-${Date.now()}`);
      await uploadBytes(photoRef, photo);
      const photoUrl = await getDownloadURL(photoRef);

      const res = await createUser({
        id: studentId.trim(),
        name: studentName.trim(),
        voiceType,
        role: 'student',
        status: 'pending',
        photoUrl,
        room: room.trim()
      });

      if (res.success) {
        toast.success('ลงทะเบียนสำเร็จ! กรุณารอแอดมินอนุมัติ...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        toast.error(res.error || 'เกิดข้อผิดพลาดในการลงทะเบียน');
      }
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ หรือระบบขัดข้อง');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '450px', width: '100%', position: 'relative' }}>
        
        <Link href="/login" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={20} />
        </Link>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <UserPlus size={28} color="var(--accent-primary)" />
            ลงทะเบียน
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>สมัครสมาชิกสำหรับนักเรียน PPK CHOIR</p>
        </div>
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <label 
              style={{ 
                width: '120px', height: '120px', borderRadius: '50%', 
                background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                border: '2px dashed var(--accent-primary)', position: 'relative'
              }}
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Camera size={32} color="var(--accent-primary)" />
              )}
              <input 
                type="file" 
                accept="image/*" 
                capture="user" 
                onChange={handlePhotoChange} 
                style={{ display: 'none' }} 
                disabled={loading}
              />
            </label>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>แตะเพื่อถ่ายรูปโปรไฟล์</span>
          </div>
          
          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="studentId">รหัสนักเรียน</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                id="studentId" 
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="input-field" 
                placeholder="เช่น 65001"
                style={{ width: '100%', paddingLeft: '2.8rem' }}
                disabled={loading}
              />
            </div>
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="studentName">ชื่อ-สกุล</label>
            <input 
              type="text" 
              id="studentName" 
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="input-field" 
              placeholder="เช่น สมชาย ใจดี"
              disabled={loading}
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="room">ห้องเรียน</label>
            <input 
              type="text" 
              id="room" 
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="input-field" 
              placeholder="เช่น ม.4/1 หรือ 4/1"
              disabled={loading}
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="voiceType">แนวเสียง (Voice Type)</label>
              <select 
                className="input-field" 
                value={voiceType} 
                onChange={(e) => setVoiceType(e.target.value as VoiceType)}
                style={{ appearance: 'auto' }}
              >
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
          
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', width: '100%', opacity: loading ? 0.7 : 1 }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            {loading ? 'กำลังลงทะเบียน...' : 'ยืนยันการลงทะเบียน'}
          </button>
          
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            มีบัญชีอยู่แล้ว?{' '}
            <Link href="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
        
      </div>
      
    </div>
  );
}
