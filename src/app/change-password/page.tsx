'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { ShieldAlert, Save, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }

    // Call API to change password
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว!');
        router.push('/dashboard');
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    } catch (err: any) {
      toast.error('ไม่สามารถเปลี่ยนรหัสผ่านได้');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '450px', width: '100%', position: 'relative' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#f87171' }}>
            <ShieldAlert size={28} />
            กรุณาตั้งรหัสผ่านใหม่
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            เนื่องจากคุณยังใช้รหัสนักเรียนเป็นรหัสผ่านอยู่ เพื่อความปลอดภัยของข้อมูลการเช็คชื่อ ระบบจึงบังคับให้ตั้งรหัสผ่านใหม่ครับ
          </p>
        </div>
        
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="newPassword">รหัสผ่านใหม่</label>
            <input 
              type="password" 
              id="newPassword" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field" 
              placeholder="ตั้งรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร"
              disabled={loading}
              required
              minLength={6}
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</label>
            <input 
              type="password" 
              id="confirmPassword" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field" 
              placeholder="พิมพ์รหัสผ่านใหม่อีกครั้งให้ตรงกัน"
              disabled={loading}
              required
              minLength={6}
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', width: '100%', opacity: loading ? 0.7 : 1 }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
          </button>
          
        </form>
      </div>
    </div>
  );
}
