'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Power, Loader2, MapPin, Save, Plus, Trash2, Calendar } from 'lucide-react';
import { getAllSessions, createScheduledSession, updateScheduledSession, deleteScheduledSession, ScheduledSession } from '@/lib/services/checkin';
import MapSelector from '@/components/MapSelector';
import ThaiDatePicker from '@/components/ThaiDatePicker';
import TimePicker24h from '@/components/TimePicker24h';
import { Timestamp } from 'firebase/firestore'; 

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'practice',
    targetGroups: ['All'],
    lat: 19.17029465512379,
    lng: 99.91028862524004,
    radius: 50,
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    daysOfWeek: [1] // 1=Monday
  });

  useEffect(() => {
    loadData();
    
    // Set default dates to today/now
    const now = new Date();
    const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    setFormData(prev => ({
      ...prev,
      startDate: now.toISOString().split('T')[0],
      startTime: now.toTimeString().slice(0, 5),
      endDate: later.toISOString().split('T')[0],
      endTime: later.toTimeString().slice(0, 5)
    }));
  }, []);

  async function loadData() {
    setLoading(true);
    const data = await getAllSessions();
    setSessions(data);
    setLoading(false);
  }

  const handleTargetChange = (val: string) => {
    if (val === 'All') {
      setFormData(prev => ({ ...prev, targetGroups: ['All'] }));
    } else {
      setFormData(prev => {
        let newTargets = prev.targetGroups.filter(t => t !== 'All');
        if (newTargets.includes(val)) {
          newTargets = newTargets.filter(t => t !== val);
        } else {
          newTargets.push(val);
        }
        if (newTargets.length === 0) newTargets = ['All'];
        return { ...prev, targetGroups: newTargets };
      });
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return alert('กรุณากรอกชื่อกิจกรรม');
    if (!formData.startTime || !formData.endTime) return alert('กรุณากรอกเวลาให้ครบถ้วน');
    if (formData.type !== 'practice' && (!formData.startDate || !formData.endDate)) return alert('กรุณาเลือกวันที่');

    setSaving(true);
    let sessionData: Omit<ScheduledSession, 'id' | 'createdAt'> = {
      name: formData.name.trim(),
      type: formData.type,
      targetGroups: formData.targetGroups,
      location: { lat: formData.lat, lng: formData.lng, radius: formData.radius },
      isActive: true
    };

    if (formData.type === 'practice') {
      sessionData.isRecurring = true;
      sessionData.daysOfWeek = formData.daysOfWeek;
      sessionData.recurringStartTime = formData.startTime;
      sessionData.recurringEndTime = formData.endTime;
    } else {
      sessionData.isRecurring = false;
      sessionData.startTime = new Date(`${formData.startDate}T${formData.startTime}`);
      sessionData.endTime = new Date(`${formData.endDate}T${formData.endTime}`);
    }

    const res = await createScheduledSession(sessionData);

    if (res.success) {
      alert('บันทึกกิจกรรมสำเร็จ');
      setShowForm(false);
      loadData();
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
    setSaving(false);
  };

  const toggleSessionStatus = async (session: ScheduledSession) => {
    await updateScheduledSession(session.id!, { isActive: !session.isActive });
    loadData();
  };

  const deleteSession = async (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบกิจกรรมนี้?')) {
      await deleteScheduledSession(id);
      loadData();
    }
  };

  const formatTime = (ts: any) => {
    if (!ts) return '-';
    // Handle both Firestore Timestamp and JS Date
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
  };

  const isCurrent = (session: ScheduledSession) => {
    if (!session.isActive) return false;
    const now = new Date();
    
    if (session.isRecurring) {
      const currentDay = now.getDay();
      const currentTime = now.toTimeString().slice(0, 5);
      const isDayMatch = session.daysOfWeek ? session.daysOfWeek.includes(currentDay) : session.dayOfWeek === currentDay; // Backwards compatibility just in case
      return isDayMatch && 
             currentTime >= (session.recurringStartTime || '') && 
             currentTime <= (session.recurringEndTime || '');
    } else {
      if (!session.startTime || !session.endTime) return false;
      const start = session.startTime?.toDate ? session.startTime.toDate() : new Date(session.startTime);
      const end = session.endTime?.toDate ? session.endTime.toDate() : new Date(session.endTime);
      return now >= start && now <= end;
    }
  };

  const getDayName = (day: number) => {
    return ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'][day];
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/admin/dashboard" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={24} />
          </Link>
          <Calendar size={32} color="var(--accent-primary)" />
          <h1 style={{ margin: 0, fontSize: '2rem' }}>ปฏิทินเช็คชื่อ (Sessions)</h1>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} /> สร้างกิจกรรมใหม่
        </button>
      </div>

      {showForm && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--accent-primary)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>รายละเอียดกิจกรรม</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>ชื่อกิจกรรม</label>
              <input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="เช่น ซ้อมย่อยเย็นวันศุกร์" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>ประเภท</label>
              <select className="input-field" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="practice">ซ้อมตามปกติ (Practice)</option>
                <option value="performance">การแสดง (Performance)</option>
                <option value="outing">ออกงาน (Outing)</option>
                <option value="competition">แข่งขัน (Competition)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>กลุ่มเป้าหมายที่ต้องเช็คชื่อ</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['All', 'Soprano 1', 'Soprano 2', 'Alto 1', 'Alto 2', 'Tenor 1', 'Tenor 2', 'Baritone', 'Bass'].map(g => (
                <button 
                  key={g}
                  onClick={() => handleTargetChange(g)}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '50px', border: '1px solid var(--accent-primary)',
                    background: formData.targetGroups.includes(g) ? 'var(--accent-primary)' : 'transparent',
                    color: formData.targetGroups.includes(g) ? '#000' : 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  {g === 'All' ? 'ทุกคน (รวมวง)' : g}
                </button>
              ))}
            </div>
          </div>

          {formData.type === 'practice' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>วันในสัปดาห์ (เลือกได้หลายวัน)</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[{ id: 1, label: 'จ' }, { id: 2, label: 'อ' }, { id: 3, label: 'พ' }, { id: 4, label: 'พฤ' }, { id: 5, label: 'ศ' }, { id: 6, label: 'ส' }, { id: 0, label: 'อา' }].map(day => {
                    const isSelected = formData.daysOfWeek.includes(day.id);
                    return (
                      <button 
                        key={day.id}
                        onClick={() => setFormData(prev => {
                          let newDays = [...prev.daysOfWeek];
                          if (isSelected) {
                            newDays = newDays.filter(d => d !== day.id);
                            if (newDays.length === 0) newDays = [day.id]; // Prevent deselecting all
                          } else {
                            newDays.push(day.id);
                          }
                          return { ...prev, daysOfWeek: newDays };
                        })}
                        type="button"
                        style={{
                          width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--accent-primary)',
                          background: isSelected ? 'var(--accent-primary)' : 'transparent',
                          color: isSelected ? '#000' : 'var(--text-primary)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          transition: 'all 0.2s'
                        }}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ช่วงเวลา</label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <TimePicker24h value={formData.startTime} onChange={val => setFormData({...formData, startTime: val})} />
                  <span>ถึง</span>
                  <TimePicker24h value={formData.endTime} onChange={val => setFormData({...formData, endTime: val})} />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>วันที่เริ่มต้น</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <ThaiDatePicker value={formData.startDate} onChange={val => setFormData({...formData, startDate: val})} style={{ flex: 1, minWidth: '160px' }} />
                  <TimePicker24h value={formData.startTime} onChange={val => setFormData({...formData, startTime: val})} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>วันที่สิ้นสุด</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <ThaiDatePicker value={formData.endDate} onChange={val => setFormData({...formData, endDate: val})} style={{ flex: 1, minWidth: '160px' }} />
                  <TimePicker24h value={formData.endTime} onChange={val => setFormData({...formData, endTime: val})} />
                </div>
              </div>
            </div>
          )}

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={20} color="var(--accent-primary)" /> เลือกพิกัดสถานที่
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <div className="input-group">
                <label>ละติจูด</label>
                <input type="number" step="any" className="input-field" value={formData.lat} onChange={e => setFormData({...formData, lat: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="input-group">
                <label>ลองจิจูด</label>
                <input type="number" step="any" className="input-field" value={formData.lng} onChange={e => setFormData({...formData, lng: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="input-group">
                <label>รัศมีอนุญาต (เมตร)</label>
                <input type="number" className="input-field" value={formData.radius} onChange={e => setFormData({...formData, radius: parseInt(e.target.value) || 50})} />
              </div>
            </div>
            <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <MapSelector 
                lat={formData.lat} 
                lng={formData.lng} 
                radius={formData.radius} 
                onLocationChange={(lat, lng) => setFormData(prev => ({ ...prev, lat, lng }))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>ยกเลิก</button>
            <button className="btn-primary" onClick={handleCreate} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} บันทึกกิจกรรม
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.4)' }}>
                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)' }}>สถานะ</th>
                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)' }}>ชื่อกิจกรรม</th>
                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)' }}>เป้าหมาย</th>
                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)' }}>เวลา (เริ่ม - จบ)</th>
                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    ยังไม่มีกิจกรรมที่สร้างไว้
                  </td>
                </tr>
              ) : (
                sessions.map(session => {
                  const active = isCurrent(session);
                  return (
                    <tr key={session.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '1rem 1.2rem' }}>
                        <span style={{ 
                          padding: '0.3rem 0.8rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 600,
                          background: active ? 'rgba(46, 213, 115, 0.1)' : session.isActive ? 'rgba(255, 171, 0, 0.1)' : 'rgba(255, 71, 87, 0.1)',
                          color: active ? 'var(--success)' : session.isActive ? '#ffab00' : 'var(--danger)',
                          border: `1px solid ${active ? 'var(--success)' : session.isActive ? '#ffab00' : 'var(--danger)'}`
                        }}>
                          {active ? 'กำลังดำเนินอยู่' : session.isActive ? 'เปิดระบบไว้' : 'ปิดระบบแล้ว'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.2rem' }}>
                        <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{session.name}</strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{session.type}</span>
                      </td>
                      <td style={{ padding: '1rem 1.2rem', fontSize: '0.9rem' }}>
                        {session.targetGroups?.join(', ') || 'All'}
                      </td>
                      <td style={{ padding: '1rem 1.2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {session.isRecurring ? (
                          <>
                            ทุกวัน{session.daysOfWeek ? session.daysOfWeek.map(getDayName).join(', ') : getDayName(session.dayOfWeek ?? 1)} <br/>
                            {session.recurringStartTime} ถึง {session.recurringEndTime}
                          </>
                        ) : (
                          <>
                            {formatTime(session.startTime)} <br/> ถึง <br/> {formatTime(session.endTime)}
                          </>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.2rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => toggleSessionStatus(session)}
                            style={{ 
                              padding: '0.5rem', borderRadius: '8px', cursor: 'pointer',
                              background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                              color: session.isActive ? 'var(--danger)' : 'var(--success)'
                            }}
                            title={session.isActive ? "ปิดรับเช็คชื่อ (Force Close)" : "เปิดรับเช็คชื่อ (Force Open)"}
                          >
                            <Power size={18} />
                          </button>
                          <button 
                            onClick={() => deleteSession(session.id!)}
                            style={{ padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--danger)' }}
                            title="ลบกิจกรรม"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
