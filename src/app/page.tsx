import { Music, MapPin, LogIn, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', textAlign: 'center' }}>
      
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '800px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(230, 185, 128, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--accent-primary)' }}>
            <Music size={48} strokeWidth={1.5} />
          </div>
        </div>
        
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          PPK <span className="gradient-text">CHOIR</span>
        </h1>
        
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
          ชุมนุมสานฝันด้วยเส้นเสียง<br/>
          <span style={{ fontSize: '1rem' }}>นวัตกรรมการจัดการเรียนรู้เพื่อพัฒนาศักยภาพการขับร้องประสานเสียง</span>
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem', textAlign: 'left' }}>
          
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <MapPin size={24} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Smart Check-in</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>เช็คชื่อด้วยพิกัด GPS แม่นยำ รวดเร็ว ตรวจสอบได้แบบเรียลไทม์</p>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Sparkles size={24} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Active Learning</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ฝึกซ้อมด้วยตนเองผ่านคลังไฟล์เสียง พร้อมส่งคลิปประเมินพัฒนาการ</p>
          </div>
          
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login" className="btn-primary delay-2 animate-fade-in">
            <LogIn size={20} />
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" className="btn-primary delay-3 animate-fade-in" style={{ background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', boxShadow: 'none' }}>
            ลงทะเบียน
          </Link>
        </div>
        
      </div>
      
      <footer style={{ marginTop: '3rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        © {new Date().getFullYear()} PPK CHOIR Innovation. All rights reserved.
      </footer>
    </div>
  );
}
