'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Clock, FileAudio, LogOut, Settings, ClipboardCheck, LineChart, Users, MapPin, Camera } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
    } else if (user?.role === 'admin') {
      fetch('/api/admin/stats').then(r => r.json()).then(data => {
        if (!data.error) setStats(data);
      }).catch(() => {});
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading || !user) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      
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

      {stats && (
        <div className="animate-fade-in" style={{ marginBottom: '3rem' }}>
          {/* Top Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>นักเรียนทั้งหมด</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.totalStudents}</span>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>เช็คชื่อวันนี้ (คน)</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{stats.checkinsToday}</span>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #feca57', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>สัดส่วน ม.ต้น : ม.ปลาย</span>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#feca57' }}>{stats.middleSchool}</span>
                <span style={{ fontSize: '1.5rem', paddingBottom: '0.3rem', color: 'var(--text-secondary)' }}>:</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ff9f43' }}>{stats.highSchool}</span>
              </div>
            </div>
          </div>

          {/* Voice Type Chart (CSS Bars) */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="var(--accent-primary)" />
              สัดส่วนแนวเสียงในวง (Voice Types)
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats.voiceTypes && stats.voiceTypes.sort((a:any, b:any) => b.count - a.count).map((v: any) => {
                const percentage = Math.round((v.count / stats.totalStudents) * 100) || 0;
                // Generate a consistent color based on voice type name
                const colorHash = v.voiceType.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                const hue = (colorHash * 137.508) % 360;
                const color = `hsl(${hue}, 70%, 60%)`;
                
                return (
                  <div key={v.voiceType}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                      <span>{v.voiceType}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{v.count} คน ({percentage}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', background: color, transition: 'width 1s ease-out' }}></div>
                    </div>
                  </div>
                );
              })}
              {(!stats.voiceTypes || stats.voiceTypes.length === 0) && (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>ยังไม่มีข้อมูลนักเรียน</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        <Link href="/admin/users" className="glass-panel animate-fade-in" style={{ display: 'block', textDecoration: 'none', border: '1px solid var(--accent-primary)' }}>
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

        <Link href="/admin/tracking" className="glass-panel animate-fade-in delay-1" style={{ display: 'block', textDecoration: 'none', background: 'rgba(255, 60, 60, 0.05)', border: '1px solid rgba(255, 60, 60, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(255, 71, 87, 0.1)', padding: '0.8rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="animate-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', position: 'absolute', transform: 'translate(-10px, -10px)' }}></div>
              <MapPin size={28} color="var(--danger)" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--danger)' }}>เรดาร์ติดตาม (Live Map)</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            ดูแผนที่ตำแหน่งของนักเรียนแบบเรียลไทม์ (Real-time GPS Tracking) เพื่อดูแลความปลอดภัย
          </p>
        </Link>
        
        <Link href="/admin/scanner" className="glass-panel animate-fade-in delay-1" style={{ display: 'block', textDecoration: 'none', border: '1px solid #feca57' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(254, 202, 87, 0.1)', padding: '0.8rem', borderRadius: '12px' }}>
              <Camera size={28} color="#feca57" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#feca57' }}>เครื่องสแกนเช็คชื่อ</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            สแกน QR Code เพื่อเช็คชื่อนักเรียน หรือมอบหมายหน้าที่ให้หัวหน้าพาร์ท
          </p>
        </Link>

        <Link href="/admin/sessions" className="glass-panel animate-fade-in delay-1" style={{ display: 'block', textDecoration: 'none' }}>
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

        <Link href="/admin/reports" className="glass-panel animate-fade-in delay-1" style={{ display: 'block', textDecoration: 'none' }}>
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

        <Link href="/admin/library" className="glass-panel animate-fade-in delay-1" style={{ display: 'block', textDecoration: 'none' }}>
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
        
        <Link href="/admin/assess" className="glass-panel animate-fade-in delay-2" style={{ display: 'block', textDecoration: 'none' }}>
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

        <Link href="/admin/analytics" className="glass-panel animate-fade-in delay-3" style={{ display: 'block', textDecoration: 'none' }}>
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
