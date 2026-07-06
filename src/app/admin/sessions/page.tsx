'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Power, Loader2, MapPin, Save } from 'lucide-react';
import { getActiveSession, createSession, endSession, getCheckInSettings, updateCheckInSettings, DEFAULT_CHECKIN_SETTINGS } from '@/lib/services/checkin';

export default function AdminSessionsPage() {
  const [sessionName, setSessionName] = useState('');
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  
  // Settings State
  const [settings, setSettings] = useState(DEFAULT_CHECKIN_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [mapInput, setMapInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [session, config] = await Promise.all([
      getActiveSession(),
      getCheckInSettings()
    ]);
    
    if (session) {
      setActiveSession(session);
      setSessionName(session.name);
    } else {
      setActiveSession(null);
      setSessionName('');
    }
    
    setSettings(config);
    setLoading(false);
  }

  const handleMapInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMapInput(val);
    
    // พยายามดึงตัวเลขจากข้อความ เช่น "13.7563, 100.5018"
    const match = val.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    if (match) {
      setSettings(prev => ({
        ...prev,
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      }));
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    const res = await updateCheckInSettings(settings);
    if (res.success) {
      alert('บันทึกการตั้งค่าพิกัดสำเร็จ!');
      setMapInput(''); // Clear input after successful parse
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    }
    setSavingSettings(false);
  };

  const toggleSession = async () => {
    if (!activeSession && !sessionName.trim()) {
      alert('กรุณาตั้งชื่อรอบการเช็คชื่อก่อนเปิดระบบ');
      return;
    }

    setToggling(true);
    
    if (activeSession) {
      // ปิด Session
      if (confirm('ยืนยันการปิดรับการเช็คชื่อรอบนี้?')) {
        await endSession(activeSession.id);
        setActiveSession(null);
        setSessionName('');
      }
    } else {
      // เปิด Session
      const res = await createSession(sessionName.trim());
      if (res.success) {
        await loadData();
      } else {
        alert('เกิดข้อผิดพลาดในการเปิดเซสชัน');
      }
    }
    
    setToggling(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <Link href="/admin/dashboard" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={24} />
        </Link>
        <Clock size={32} color="var(--accent-primary)" />
        <h1 style={{ margin: 0, fontSize: '2rem' }}>จัดการเวลาเช็คชื่อ</h1>
      </div>

      <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>สถานะระบบเช็คชื่อ</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {activeSession ? 'ระบบกำลังเปิดรับการเช็คชื่อ' : 'ระบบปิดการเช็คชื่ออยู่'}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ 
              padding: '0.3rem 1rem', 
              borderRadius: '50px', 
              fontSize: '0.9rem',
              fontWeight: 600,
              background: activeSession ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)',
              color: activeSession ? 'var(--success)' : 'var(--danger)',
              border: `1px solid ${activeSession ? 'var(--success)' : 'var(--danger)'}`
            }}>
              {activeSession ? 'เปิด' : 'ปิด'}
            </span>
            
            <button
              onClick={toggleSession}
              disabled={toggling}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                border: 'none',
                background: activeSession ? 'var(--danger)' : 'var(--success)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: `0 4px 15px ${activeSession ? 'rgba(255, 71, 87, 0.4)' : 'rgba(46, 213, 115, 0.4)'}`,
                transition: 'transform 0.2s',
                opacity: toggling ? 0.7 : 1
              }}
            >
              {toggling ? <Loader2 className="animate-spin" /> : <Power size={24} />}
            </button>
          </div>
        </div>

        <div className="input-group">
          <label>ชื่อรอบการเช็คชื่อ (เช่น คาบ 6, ซ้อมเย็นวันศุกร์)</label>
          <input 
            type="text" 
            className="input-field" 
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            disabled={activeSession}
            placeholder="ตั้งชื่อรอบก่อนเปิดระบบ..."
            style={{ opacity: activeSession ? 0.6 : 1 }}
          />
        </div>
        
        {activeSession && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--accent-primary)' }}>ข้อมูลเซสชันปัจจุบัน</h4>
            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>
              <strong>ชื่อรอบ:</strong> {sessionName}
            </p>
            <p style={{ margin: '0', color: 'var(--text-secondary)' }}>
              <strong>เปิดเมื่อ:</strong> {activeSession.createdAt ? new Date(activeSession.createdAt.seconds * 1000).toLocaleTimeString('th-TH') : 'กำลังโหลด...'} น.
            </p>
          </div>
        )}

      </div>

      {/* Settings Section */}
      <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <MapPin size={24} color="var(--accent-primary)" />
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>ตั้งค่าพิกัดเช็คชื่อ</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="input-group">
            <label>ละติจูด (Latitude)</label>
            <input 
              type="number" 
              step="any"
              className="input-field" 
              value={settings.lat}
              onChange={(e) => setSettings({...settings, lat: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div className="input-group">
            <label>ลองจิจูด (Longitude)</label>
            <input 
              type="number" 
              step="any"
              className="input-field" 
              value={settings.lng}
              onChange={(e) => setSettings({...settings, lng: parseFloat(e.target.value) || 0})}
            />
          </div>
        </div>

        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
          <label>วางพิกัดจาก Google Maps (เช่น 13.7563, 100.5018)</label>
          <input 
            type="text" 
            className="input-field" 
            value={mapInput}
            onChange={handleMapInput}
            placeholder="วางพิกัดที่นี่เพื่อเติมค่าอัตโนมัติ..."
          />
        </div>

        <div className="input-group" style={{ marginBottom: '2rem' }}>
          <label>รัศมีที่อนุญาตให้เช็คชื่อได้ (เมตร)</label>
          <input 
            type="number" 
            className="input-field" 
            value={settings.radius}
            onChange={(e) => setSettings({...settings, radius: parseInt(e.target.value) || 10})}
          />
        </div>

        <button 
          className="btn-primary" 
          onClick={saveSettings}
          disabled={savingSettings}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
        >
          {savingSettings ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          บันทึกการตั้งค่าพิกัด
        </button>
      </div>
    </div>
  );
}
