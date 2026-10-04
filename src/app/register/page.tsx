'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, User, Loader2, Link as LinkIcon } from 'lucide-react';
import { createUser } from '@/lib/services/users';
import { VoiceType } from '@/lib/services/library';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  
  const [studentId, setStudentId] = useState('');
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
  const [voiceType, setVoiceType] = useState<VoiceType>('Soprano 1');
  const [bandPosition, setBandPosition] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const BAND_POSITIONS = ['เปียโน', 'กลอง', 'เบส', 'กีต้าร์', 'คีย์บอร์ด', 'นักร้องนำ'];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId.trim() || !password.trim() || !studentName.trim() || !nickname.trim() || !phone.trim() || !lineId.trim() || !parentName.trim() || !parentPhone.trim() || !parentLineId.trim() || !address.trim() || !advisorName.trim() || !room.trim()) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง (ยกเว้นอีเมลผู้ปกครอง)');
      return;
    }

    if (password.length < 6) {
      toast.error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);

    try {
      // Clean up any accidentally typed prefixes in the name field
      let cleanName = studentName.trim();
      cleanName = cleanName.replace(/^(นาย|นางสาว|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|น\.ส\.|นส\.)\s*/, '');
      const formattedName = `${namePrefix}${cleanName}`;
      
      const res = await createUser({
        id: studentId.trim(),
        name: formattedName,
        password: password.trim(),
        nickname: nickname.trim(),
        phone: phone.trim(),
        lineId: lineId.trim(),
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        parentLineId: parentLineId.trim(),
        parentEmail: parentEmail.trim(),
        address: address.trim(),
        advisorName: advisorName.trim(),
        email: `${studentId.trim()}@ppk-choir.app`,
        voiceType,
        bandPosition: bandPosition || undefined,
        role: 'student',
        status: 'pending',
        photoUrl: photoUrl.trim() || undefined,
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
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
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
          
          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="photoUrl">ลิ้งค์รูปโปรไฟล์ (Google Drive)</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <LinkIcon size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }} />
              <input 
                type="url" 
                id="photoUrl" 
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="input-field" 
                placeholder="วางลิ้งค์รูปภาพจาก Google Drive"
                style={{ width: '100%', paddingLeft: '2.8rem' }}
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="studentId">รหัสนักเรียน <span style={{color: 'red'}}>*</span></label>
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
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="password">ตั้งรหัสผ่าน <span style={{color: 'red'}}>*</span></label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field" 
              placeholder="สำหรับเข้าสู่ระบบ (อย่างน้อย 6 ตัวอักษร)"
              disabled={loading}
              required
              minLength={6}
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="studentName">ชื่อ-สกุล (ไม่ต้องใส่คำนำหน้า) <span style={{color: 'red'}}>*</span></label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select 
                value={namePrefix}
                onChange={(e) => setNamePrefix(e.target.value)}
                className="input-field"
                style={{ width: '120px', appearance: 'auto' }}
                disabled={loading}
              >
                <option value="นาย">นาย</option>
                <option value="นางสาว">นางสาว</option>
                <option value="ด.ช.">ด.ช.</option>
                <option value="ด.ญ.">ด.ญ.</option>
              </select>
              <input 
                type="text" 
                id="studentName" 
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="input-field" 
                placeholder="เช่น สมชาย ใจดี"
                style={{ flex: 1 }}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="nickname">ชื่อเล่น <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              id="nickname" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="input-field" 
              placeholder="ชื่อเล่น"
              disabled={loading}
              required
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="room">ห้องเรียน <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              id="room" 
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="input-field" 
              placeholder="เช่น ม.4/1 หรือ 4/1"
              disabled={loading}
              required
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="advisorName">ชื่อครูที่ปรึกษา <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              id="advisorName" 
              value={advisorName}
              onChange={(e) => setAdvisorName(e.target.value)}
              className="input-field" 
              placeholder="ชื่อครูที่ปรึกษา"
              disabled={loading}
              required
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="phone">เบอร์โทรศัพท์นักเรียน <span style={{color: 'red'}}>*</span></label>
            <input 
              type="tel" 
              id="phone" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field" 
              placeholder="เช่น 0812345678"
              disabled={loading}
              required
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="lineId">Line ID นักเรียน <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              id="lineId" 
              value={lineId}
              onChange={(e) => setLineId(e.target.value)}
              className="input-field" 
              placeholder="ไอดีไลน์ของนักเรียน"
              disabled={loading}
              required
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="address">ที่อยู่ <span style={{color: 'red'}}>*</span></label>
            <textarea 
              id="address" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-field" 
              placeholder="ที่อยู่ปัจจุบัน"
              disabled={loading}
              required
              rows={2}
            />
          </div>

          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '1rem 0' }} />

          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>ข้อมูลผู้ปกครอง</h3>

          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="parentName">ชื่อ-สกุล ผู้ปกครอง <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              id="parentName" 
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              className="input-field" 
              placeholder="ชื่อและนามสกุลของผู้ปกครอง"
              disabled={loading}
              required
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="parentPhone">เบอร์โทรศัพท์ผู้ปกครอง <span style={{color: 'red'}}>*</span></label>
            <input 
              type="tel" 
              id="parentPhone" 
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              className="input-field" 
              placeholder="เบอร์โทรศัพท์สำหรับติดต่อฉุกเฉิน"
              disabled={loading}
              required
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="parentLineId">Line ID ผู้ปกครอง <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              id="parentLineId" 
              value={parentLineId}
              onChange={(e) => setParentLineId(e.target.value)}
              className="input-field" 
              placeholder="ไอดีไลน์ของผู้ปกครอง"
              disabled={loading}
              required
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="parentEmail">อีเมลผู้ปกครอง <span style={{color: 'var(--text-secondary)', fontSize: '0.8rem'}}>(ไม่บังคับ)</span></label>
            <input 
              type="email" 
              id="parentEmail" 
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              className="input-field" 
              placeholder="สำหรับเข้าสู่ระบบตรวจสอบการเข้าร่วมกิจกรรม (ระบุทีหลังได้)"
              disabled={loading}
            />
          </div>

          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '1rem 0' }} />

          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="voiceType">แนวเสียง (Voice Type) <span style={{color: 'red'}}>*</span></label>
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

          <div className="input-group" style={{ margin: 0 }}>
            <label>ตำแหน่งในวงสตริง <span style={{color: 'var(--text-secondary)', fontSize: '0.8rem'}}>(ไม่บังคับ — เลือกถ้าเล่นเครื่องดนตรีในวงด้วย)</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.3rem' }}>
              {BAND_POSITIONS.map(pos => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setBandPosition(prev => prev === pos ? '' : pos)}
                  disabled={loading}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '50px',
                    border: '1px solid var(--accent-primary)',
                    background: bandPosition === pos ? 'var(--accent-primary)' : 'transparent',
                    color: bandPosition === pos ? '#000' : 'var(--text-primary)',
                    cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s'
                  }}
                >
                  {pos}
                </button>
              ))}
            </div>
            {bandPosition && <p style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', marginTop: '0.5rem' }}>เลือก: {bandPosition} (คลิกอีกครั้งเพื่อยกเลิก)</p>}
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
            <br/><span style={{ fontSize: '0.7rem', opacity: 0.5 }}>v1.1 (Proxy)</span>
          </p>
        </div>
        
      </div>
      
    </div>
  );
}
