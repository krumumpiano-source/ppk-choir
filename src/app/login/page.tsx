'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Lock, LogIn } from 'lucide-react';
import { loginStudent, loginAdminWithFirebase } from '@/lib/services/auth';
import { useAuth } from '@/components/providers/AuthProvider';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const isEmail = identifier.includes('@');
  const router = useRouter();
  const { setUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    if (isEmail && !password) {
      setError('กรุณากรอกรหัสผ่านสำหรับแอดมิน');
      return;
    }

    setLoading(true);
    setError('');

    if (isEmail) {
      const res = await loginAdminWithFirebase(identifier.trim(), password);
      if (res.success && res.user) {
        setUser(res.user);
        router.push('/admin/dashboard');
      } else {
        setError(res.error || 'การเข้าสู่ระบบล้มเหลว');
      }
    } else {
      const res = await loginStudent(identifier.trim());
      if (res.success && res.user) {
        setUser(res.user);
        router.push('/dashboard');
      } else {
        setError(res.error || 'รหัสนักเรียนไม่ถูกต้อง');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '400px', width: '100%', position: 'relative' }}>
        
        <Link href="/" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={20} />
        </Link>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>เข้าสู่ระบบ</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>สำหรับนักเรียนและผู้ดูแลระบบ</p>
        </div>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
          
          <div className="input-group">
            <label htmlFor="identifier">รหัสนักเรียน / อีเมลแอดมิน</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                id="identifier" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="input-field" 
                placeholder="เช่น 65001 หรือ admin@email.com"
                style={{ width: '100%', paddingLeft: '2.8rem' }}
                disabled={loading}
              />
            </div>
          </div>

          {isEmail && (
            <div className="input-group animate-fade-in" style={{ marginTop: '1rem' }}>
              <label htmlFor="password">รหัสผ่าน (สำหรับแอดมิน)</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }} />
                <input 
                  type="password" 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field" 
                  placeholder="กรอกรหัสผ่าน"
                  style={{ width: '100%', paddingLeft: '2.8rem' }}
                  disabled={loading}
                />
              </div>
            </div>
          )}
          
          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', width: '100%', opacity: loading ? 0.7 : 1 }}>
            {loading ? <span className="animate-spin" style={{ display: 'inline-block', border: '2px solid transparent', borderTopColor: 'currentColor', borderRadius: '50%', width: '18px', height: '18px' }} /> : <LogIn size={18} />}
            {loading ? 'กำลังตรวจสอบ...' : 'ลงชื่อเข้าใช้งาน'}
          </button>
          
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            ยังไม่มีบัญชีใช่หรือไม่?{' '}
            <Link href="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>
              ลงทะเบียนเข้าใช้งาน
            </Link>
          </p>
        </div>
        
      </div>
      
    </div>
  );
}
