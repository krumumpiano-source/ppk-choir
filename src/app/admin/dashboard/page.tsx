'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Clock, FileAudio, LogOut, Settings, ClipboardCheck, LineChart, Users } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading || !user) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <LayoutDashboard size={32} color="var(--accent-primary)" />
          <h1 style={{ margin: 0, fontSize: '2rem' }}>ผู้ดูแลระบบ (Admin)</h1>
        </div>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
          <LogOut size={20} />
          ออกจากระบบ
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        <Link href="/admin/users" className="glass-panel animate-fade-in" style={{ display: 'block', textDecoration: 'none', transition: 'transform 0.2s', cursor: 'pointer', border: '1px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--accent-primary)', padding: '0.8rem', borderRadius: '12px' }}>
              <Users size={28} color="#000" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--accent-primary)' }}>จัดการผู้ใช้งาน</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            เพิ่ม ลบ หรือแก้ไขข้อมูลนักเรียน และกำหนดบทบาท (Role) ของแต่ละคน
          </p>
        </Link>

        <Link href="/admin/sessions" className="glass-panel animate-fade-in delay-1" style={{ display: 'block', textDecoration: 'none', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(230, 185, 128, 0.1)', padding: '0.8rem', borderRadius: '12px' }}>
              <Clock size={28} color="var(--accent-primary)" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>จัดการเวลาเช็คชื่อ</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            เปิด-ปิด เซสชันการเช็คชื่อเข้ากิจกรรม กำหนดเวลาคาบเรียนหรือเวลานัดหมายพิเศษ
          </p>
        </Link>

        <Link href="/admin/reports" className="glass-panel animate-fade-in delay-1" style={{ display: 'block', textDecoration: 'none', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(46, 213, 115, 0.1)', padding: '0.8rem', borderRadius: '12px' }}>
              <FileAudio size={28} color="var(--success)" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--success)' }}>รายงานการเช็คชื่อ</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            ดูสรุปการเช็คชื่อแยกตามห้องเรียน (รายสัปดาห์/เดือน/ปี) และบันทึกเป็นรูปภาพ
          </p>
        </Link>

        <Link href="/admin/library" className="glass-panel animate-fade-in delay-1" style={{ display: 'block', textDecoration: 'none', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(230, 185, 128, 0.1)', padding: '0.8rem', borderRadius: '12px' }}>
              <FileAudio size={28} color="var(--accent-primary)" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>จัดการคลังเสียง</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            อัปโหลดไฟล์เสียงร้อง แบบฝึกหัด และจัดหมวดหมู่แยกตามแนวเสียงสำหรับนักเรียน
          </p>
        </Link>
        
        <Link href="/admin/assess" className="glass-panel animate-fade-in delay-2" style={{ display: 'block', textDecoration: 'none', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(230, 185, 128, 0.1)', padding: '0.8rem', borderRadius: '12px' }}>
              <ClipboardCheck size={28} color="var(--accent-primary)" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>ตรวจผลงาน (Rubric)</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            ประเมินผลงานอัดเสียงที่นักเรียนส่งมา ให้คะแนนและข้อเสนอแนะเป็นรายบุคคล
          </p>
        </Link>

        <Link href="/admin/analytics" className="glass-panel animate-fade-in delay-3" style={{ display: 'block', textDecoration: 'none', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(230, 185, 128, 0.1)', padding: '0.8rem', borderRadius: '12px' }}>
              <LineChart size={28} color="var(--accent-primary)" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>วิเคราะห์ & วิจัย</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            ดูสถิติเชิงลึก ภาพรวมการเข้าเรียนและคะแนนเพื่อนำไปใช้วิจัย
          </p>
        </Link>

      </div>

    </div>
  );
}
