'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { VoiceType } from '@/lib/services/library';
import { toast } from 'react-hot-toast';
import { compressImage } from '@/lib/image-upload';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [password, setPassword] = useState('');
  const [namePrefix, setNamePrefix] = useState('นาย');
  const [studentName, setStudentName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [lineId, setLineId] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentLineId, setParentLineId] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [address, setAddress] = useState('');
  const [advisorName, setAdvisorName] = useState('');
  
  const [room, setRoom] = useState('');
  const [voiceType, setVoiceType] = useState<VoiceType | 'นักดนตรี (Instrumentalist)'>('Soprano 1');
  const [bandPosition, setBandPosition] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => {
        setPhotoUrl(base64);
      });
    }
  };

  const BAND_POSITIONS = ['เปียโน', 'กลอง', 'เบส', 'กีต้าร์', 'คีย์บอร์ด', 'นักร้องนำ'];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSetup(window.location.search.includes('setup=true'));
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      // Parse prefix from name if exists
      const match = user.name.match(/^(นาย|นางสาว|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|น\.ส\.|นส\.)\s*/);
      if (match) {
        setNamePrefix(match[1]);
        setStudentName(user.name.replace(match[0], ''));
      } else {
        setStudentName(user.name);
      }
      
      setNickname(user.nickname || '');
      setPhone(user.phone || '');
      setLineId(user.lineId || '');
      setParentName(user.parentName || '');
      setParentPhone(user.parentPhone || '');
      setParentLineId(user.parentLineId || '');
      setParentEmail(user.parentEmail || '');
      setAddress(user.address || '');
      setAdvisorName(user.advisorName || '');
      setRoom(user.section || user.room || '');
      setVoiceType((user.voiceType as VoiceType) || 'Soprano 1');
      setBandPosition(user.bandPosition || '');
      setPhotoUrl(user.profileUrl || user.photoUrl || '');
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    if (!studentName.trim() || !nickname.trim() || !phone.trim() || !lineId.trim() || !parentName.trim() || !parentPhone.trim() || !parentLineId.trim() || !address.trim() || !advisorName.trim() || !room.trim()) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง (ยกเว้นรหัสผ่านและอีเมลผู้ปกครอง)');
      return;
    }

    if (password && password.length < 6) {
      toast.error('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);

    try {
      let cleanName = studentName.trim();
      cleanName = cleanName.replace(/^(นาย|นางสาว|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|น\.ส\.|นส\.)\s*/, '');
      const formattedName = `${namePrefix}${cleanName}`;
      
      const payload: any = {
        name: formattedName,
        nickname: nickname.trim(),
        phone: phone.trim(),
        lineId: lineId.trim(),
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        parentLineId: parentLineId.trim(),
        parentEmail: parentEmail.trim(),
        address: address.trim(),
        advisorName: advisorName.trim(),
        voiceType,
        bandPosition: bandPosition || undefined,
        section: room.trim(),
        profileUrl: photoUrl.trim() || undefined
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว!');
        // Refresh page or trigger context update
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      }
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '600px', width: '100%', position: 'relative' }}>
        
        <Link href="/dashboard" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={24} />
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '2rem' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(230, 185, 128, 0.2)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' 
          }}>
            <User size={32} color="var(--accent-primary)" />
          </div>
          <h1 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 700, color: 'var(--accent-primary)' }}>แก้ไขข้อมูลส่วนตัว</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>อัปเดตข้อมูลส่วนตัวของคุณ</p>
        </div>

        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>รหัสนักเรียน (แก้ไขไม่ได้)</label>
              <input type="text" value={user.studentId} disabled style={{ background: 'rgba(0,0,0,0.2)', opacity: 0.7 }} />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>
                ตั้งรหัสผ่านใหม่ 
                {isSetup ? <span style={{color: 'red'}}> * (บังคับตั้งครั้งแรก)</span> : ' (เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)'}
              </label>
              <input 
                type="password" 
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={isSetup}
                minLength={6}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="input-group" style={{ width: '120px' }}>
              <label>คำนำหน้า</label>
              <select value={namePrefix} onChange={(e) => setNamePrefix(e.target.value)}>
                <option value="นาย">นาย</option>
                <option value="นางสาว">นางสาว</option>
                <option value="เด็กชาย">เด็กชาย</option>
                <option value="เด็กหญิง">เด็กหญิง</option>
                <option value="ด.ช.">ด.ช.</option>
                <option value="ด.ญ.">ด.ญ.</option>
              </select>
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>ชื่อ-นามสกุลจริง (ไม่ต้องใส่คำนำหน้า)</label>
              <input 
                type="text" 
                placeholder="เช่น สมชาย ใจดี"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>ชื่อเล่น</label>
              <input 
                type="text" 
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>ชั้น/ห้อง (เช่น ม.4/1)</label>
              <input 
                type="text" 
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>แนวเสียงปัจจุบันที่ต้องการออดิชัน</label>
            <select 
              value={voiceType} 
              onChange={(e) => {
                setVoiceType(e.target.value as any);
                if (e.target.value !== 'นักดนตรี (Instrumentalist)') {
                  setBandPosition('');
                }
              }}
            >
              <optgroup label="Soprano (เสียงสูงหญิง)">
                <option value="Soprano 1">Soprano 1</option>
                <option value="Soprano 2">Soprano 2</option>
              </optgroup>
              <optgroup label="Alto (เสียงต่ำหญิง)">
                <option value="Alto 1">Alto 1</option>
                <option value="Alto 2">Alto 2</option>
              </optgroup>
              <optgroup label="Tenor (เสียงสูงชาย)">
                <option value="Tenor 1">Tenor 1</option>
                <option value="Tenor 2">Tenor 2</option>
              </optgroup>
              <optgroup label="Bass (เสียงต่ำชาย)">
                <option value="Baritone">Baritone (เสียงกลางชาย)</option>
                <option value="Bass">Bass</option>
              </optgroup>
              <optgroup label="อื่นๆ">
                <option value="นักดนตรี (Instrumentalist)">นักดนตรี (เล่นดนตรีอย่างเดียว ไม่ร้อง)</option>
              </optgroup>
            </select>
          </div>

          {voiceType === 'นักดนตรี (Instrumentalist)' && (
            <div className="input-group animate-fade-in">
              <label>ตำแหน่งเครื่องดนตรี</label>
              <select 
                value={bandPosition} 
                onChange={(e) => setBandPosition(e.target.value)}
                required
              >
                <option value="">-- เลือกเครื่องดนตรี --</option>
                {BAND_POSITIONS.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>เบอร์โทรศัพท์นักเรียน</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Line ID นักเรียน</label>
              <input 
                type="text" 
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>ชื่อ-นามสกุล ครูที่ปรึกษา</label>
            <input 
              type="text" 
              value={advisorName}
              onChange={(e) => setAdvisorName(e.target.value)}
              required
            />
          </div>

          <hr style={{ border: 0, borderTop: '1px solid rgba(255,255,255,0.1)', margin: '1rem 0' }} />

          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent-primary)' }}>ข้อมูลผู้ปกครอง</h3>

          <div className="input-group">
            <label>ชื่อ-นามสกุล ผู้ปกครอง</label>
            <input 
              type="text" 
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>เบอร์โทรศัพท์ผู้ปกครอง</label>
              <input 
                type="tel" 
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                required
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Line ID ผู้ปกครอง</label>
              <input 
                type="text" 
                value={parentLineId}
                onChange={(e) => setParentLineId(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>ที่อยู่ปัจจุบัน</label>
            <textarea 
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              style={{ resize: 'none' }}
            />
          </div>

          <div className="input-group">
            <label>รูปโปรไฟล์ <span style={{color: 'red'}}>*</span></label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px' }}>
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl.startsWith('data:image') || photoUrl.startsWith('http') ? photoUrl : ''} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={30} color="var(--text-secondary)" />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={loading}
                  required={!photoUrl}
                  style={{ width: '100%', fontSize: '0.9rem' }}
                />
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
              สามารถกดถ่ายรูปจากกล้องมือถือ หรือเลือกรูปจากแกลลอรี่ได้เลย ระบบจะบันทึกให้อัตโนมัติ
            </span>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save />}
            บันทึกการแก้ไข
          </button>
        </form>
      </div>
    </div>
  );
}
