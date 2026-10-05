'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Phone, KeyRound, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !phone.trim()) {
      toast.error('กรุณากรอกรหัสนักเรียนและเบอร์โทรศัพท์');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', studentId, phone })
      });
      const data = await res.json() as any;
      
      if (res.ok && data.success) {
        setStep(2);
      } else {
        toast.error(data.error || 'ข้อมูลไม่ถูกต้อง');
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', studentId, phone, newPassword })
      });
      const data = await res.json() as any;
      
      if (res.ok && data.success) {
        setStep(3);
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '400px', width: '100%', position: 'relative' }}>
        
        {step !== 3 && (
          <Link href="/login" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={20} />
          </Link>
        )}
        
        <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>ลืมรหัสผ่าน</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {step === 1 ? 'ยืนยันตัวตนด้วยเบอร์โทรศัพท์ที่ใช้ตอนสมัคร' : step === 2 ? 'ตั้งรหัสผ่านใหม่' : ''}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  required
                />
              </div>
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label htmlFor="phone">เบอร์โทรศัพท์นักเรียน (ที่กรอกตอนสมัคร)</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Phone size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }} />
                <input 
                  type="tel" 
                  id="phone" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field" 
                  placeholder="เช่น 0812345678"
                  style={{ width: '100%', paddingLeft: '2.8rem' }}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', width: '100%', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'กำลังตรวจสอบ...' : 'ถัดไป'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label htmlFor="newPassword">รหัสผ่านใหม่</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <KeyRound size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }} />
                <input 
                  type="password" 
                  id="newPassword" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field" 
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  style={{ width: '100%', paddingLeft: '2.8rem' }}
                  disabled={loading}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <KeyRound size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }} />
                <input 
                  type="password" 
                  id="confirmPassword" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field" 
                  placeholder="พิมพ์ให้ตรงกันอีกครั้ง"
                  style={{ width: '100%', paddingLeft: '2.8rem' }}
                  disabled={loading}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', width: '100%', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <CheckCircle2 size={64} color="#10b981" />
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>เปลี่ยนรหัสผ่านสำเร็จ</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              คุณสามารถใช้รหัสผ่านใหม่ในการเข้าสู่ระบบได้ทันที
            </p>
            <Link href="/login" className="btn-primary" style={{ width: '100%', display: 'block', textAlign: 'center' }}>
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
