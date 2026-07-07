'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LineChart, Lightbulb, Beaker, Copy, Loader2, CheckCircle2 } from 'lucide-react';
import { getAnalyticsData, AnalyticsData } from '../../../lib/services/analytics';
import { useAuth } from '@/components/providers/AuthProvider';

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login');
      return;
    }
    
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user, authLoading, router]);

  async function loadData() {
    setLoading(true);
    const result = await getAnalyticsData();
    setData(result);
    setLoading(false);
  }

  const handleExport = () => {
    if (!data) return;
    
    let report = `รายงานสถิติ PPK CHOIR (สำหรับ PLC / งานวิจัย คศ.4)\n`;
    report += `วันที่รายงาน: ${new Date().toLocaleDateString('th-TH')}\n\n`;
    report += `[ ภาพรวมการส่งงาน ]\n`;
    report += `- งานที่ส่งทั้งหมด: ${data.totalPractices} ชิ้น\n`;
    report += `- งานที่ได้รับการประเมินแล้ว: ${data.assessedPractices} ชิ้น\n\n`;
    
    report += `[ สถิติรายแนวเสียง (เต็ม 5 คะแนน) ]\n`;
    data.voiceStats.forEach(v => {
      report += `• ${v.voiceType}: ค่าเฉลี่ยรวม ${v.overallAvg} (Pitch: ${v.avgPitch}, Rhythm: ${v.avgRhythm}, Technique: ${v.avgTechnique})\n`;
    });
    
    report += `\n[ AI Insights (ผลการวิเคราะห์ปัญหา) ]\n`;
    data.insights.forEach(msg => report += `- ${msg}\n`);
    
    report += `\n[ หัวข้อวิจัยที่แนะนำ (Action Research) ]\n`;
    data.suggestedResearch.forEach(msg => report += `- ${msg}\n`);

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (authLoading || !user) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/admin/dashboard" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={24} />
          </Link>
          <LineChart size={32} color="var(--accent-primary)" />
          <h1 style={{ margin: 0, fontSize: '2rem' }}>วิเคราะห์ข้อมูลและงานวิจัย</h1>
        </div>
        
        <button 
          onClick={handleExport}
          disabled={loading || !data}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.8rem 1.5rem',
            borderRadius: '8px',
            background: copied ? 'var(--success)' : 'transparent',
            border: copied ? '1px solid var(--success)' : '1px solid var(--accent-primary)',
            color: copied ? 'white' : 'var(--accent-primary)',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
          {copied ? 'คัดลอกสำเร็จ!' : 'Export รายงาน (คัดลอก)'}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--accent-primary)' }}>
          <Loader2 size={40} className="animate-spin" />
        </div>
      ) : !data || data.assessedPractices === 0 ? (
        <div className="glass-panel animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>ยังไม่มีข้อมูลการประเมินที่เพียงพอ</h3>
          <p style={{ color: 'var(--text-secondary)' }}>กรุณาประเมินผลงานนักเรียนในเมนู &quot;ตรวจผลงาน (Rubric)&quot; เพื่อให้ระบบ AI เริ่มการวิเคราะห์</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* AI Insights Section */}
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', border: '1px solid var(--accent-primary)', background: 'linear-gradient(135deg, rgba(230, 185, 128, 0.05), rgba(0,0,0,0.2))' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--accent-primary)', margin: '0 0 1.5rem 0' }}>
              <Lightbulb size={28} /> AI Diagnostics & Insights
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.insights.map((msg, i) => (
                <li key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', fontSize: '0.8rem' }}>{i + 1}</div>
                  <p style={{ margin: 0, lineHeight: 1.6 }}>{msg}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Data Visualization */}
          <div className="glass-panel animate-fade-in delay-1" style={{ padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>สถิติคะแนนเฉลี่ยรายแนวเสียง (คะแนนเต็ม 5)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {data.voiceStats.map(stat => (
                <div key={stat.voiceType} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--accent-secondary)', fontSize: '1.2rem', textAlign: 'center' }}>{stat.voiceType}</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                        <span>Pitch</span><span>{stat.avgPitch}</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${(stat.avgPitch / 5) * 100}%`, height: '100%', background: 'var(--success)' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                        <span>Rhythm</span><span>{stat.avgRhythm}</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${(stat.avgRhythm / 5) * 100}%`, height: '100%', background: '#3498db' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                        <span>Technique</span><span>{stat.avgTechnique}</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${(stat.avgTechnique / 5) * 100}%`, height: '100%', background: '#9b59b6' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    ส่งงานมาแล้ว {stat.totalSubmissions} ชิ้น
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Research Ideas */}
          <div className="glass-panel animate-fade-in delay-2" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '0 0 1.5rem 0' }}>
              <Beaker size={24} color="var(--success)" /> หัวข้อวิจัยในชั้นเรียนที่แนะนำ (Action Research)
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              จากข้อมูลสถิติและการประเมินเบื้องต้น ระบบขอเสนอหัวข้อวิจัยเพื่อใช้ต่อยอดสำหรับวิทยฐานะ คศ.4 ดังนี้:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.suggestedResearch.map((title, i) => (
                <div key={i} style={{ padding: '1.5rem', background: 'rgba(46, 213, 115, 0.05)', border: '1px solid rgba(46, 213, 115, 0.2)', borderRadius: '8px' }}>
                  <p style={{ margin: 0, fontWeight: 500, color: 'white' }}>{title}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
