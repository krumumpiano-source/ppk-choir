'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/components/providers/AuthProvider';
import { noteToMidi, midiToNote, VOICE_PART_SPECS } from '@/lib/services/voiceAllocation';
import { 
  Mic, 
  Music, 
  Search, 
  Save, 
  CheckCircle2, 
  Sliders, 
  Loader2, 
  UserCheck, 
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function generateNoteOptions() {
  const options: string[] = [];
  for (let octave = 2; octave <= 6; octave++) {
    for (const note of CHROMATIC_NOTES) {
      options.push(`${note}${octave}`);
    }
  }
  return options;
}

const ALL_NOTE_OPTIONS = generateNoteOptions();

export default function AuditionsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Audition Form State
  const [lowestNote, setLowestNote] = useState('C3');
  const [highestNote, setHighestNote] = useState('C5');
  const [timbreQuality, setTimbreQuality] = useState('Bright');
  const [pitchAccuracy, setPitchAccuracy] = useState(5);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAuditions();
  }, []);

  const fetchAuditions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auditions');
      const data = await res.json() as any;
      if (data.students) {
        setStudents(data.students);
      }
    } catch (err: any) {
      toast.error('ไม่สามารถโหลดข้อมูลนักเรียนได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    if (student.audition) {
      setLowestNote(student.audition.lowestNote || 'C3');
      setHighestNote(student.audition.highestNote || 'C5');
      setTimbreQuality(student.audition.timbreQuality || 'Bright');
      setPitchAccuracy(student.audition.pitchAccuracy || 5);
      setNotes(student.audition.notes || '');
    } else {
      setLowestNote('C3');
      setHighestNote('C5');
      setTimbreQuality('Bright');
      setPitchAccuracy(5);
      setNotes('');
    }
  };

  const handleSaveAudition = async () => {
    if (!selectedStudent) return;

    const lowMidi = noteToMidi(lowestNote);
    const highMidi = noteToMidi(highestNote);

    if (lowMidi >= highMidi) {
      toast.error('โน้ตต่ำสุดต้องต่ำกว่าโน้ตสูงสุด');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/auditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          lowestNote,
          highestNote,
          timbreQuality,
          pitchAccuracy,
          notes,
          auditedBy: user?.name || 'Section Leader',
        }),
      });

      const data = await res.json() as any;
      if (res.ok && data.success) {
        toast.success(`บันทึกช่วงเสียงของ ${selectedStudent.name} เรียบร้อยแล้ว`);
        await fetchAuditions();
        setSelectedStudent((prev: any) => ({
          ...prev,
          audition: { lowestNote, highestNote, timbreQuality, pitchAccuracy, notes },
        }));
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (err: any) {
      toast.error('ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const auditedCount = students.filter((s) => s.audition || (s.voiceType && s.voiceType !== 'All' && s.voiceType !== 'Unassigned' && s.voiceType !== '')).length;
  const lowMidi = noteToMidi(lowestNote);
  const highMidi = noteToMidi(highestNote);
  const rangeSpan = Math.max(0, highMidi - lowMidi);

  return (
    <div className="layout-container">
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Mic size={32} color="var(--accent-primary)" />
            <h1 style={{ fontSize: '2rem', margin: 0 }}>คัดเลือกและทดสอบช่วงเสียง (Audition Panel)</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            สำหรับหัวหน้าวงและหัวหน้าแนว: ทดสอบและบันทึกคีย์ต่ำสุด-สูงสุดของสมาชิกในวงเพื่อใช้คัดแยกแนวเสียง
          </p>
        </div>

        {/* Audition Summary Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ความคืบหน้าการคัดเสียงในวง</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
              {auditedCount} / {students.length} คน ({students.length > 0 ? Math.round((auditedCount / students.length) * 100) : 0}%)
            </div>
          </div>

          <div style={{ flex: '1', maxWidth: '400px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', height: '12px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${students.length > 0 ? (auditedCount / students.length) * 100 : 0}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #e6b980, #eacda3)',
                  transition: 'width 0.4s ease'
                }} 
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Left Column: Student List */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={20} color="var(--accent-primary)" /> รายชื่อสมาชิกในวง
            </h3>

            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรือ รหัสนักเรียน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.2)',
                  color: '#fff',
                }}
              />
            </div>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
                กำลังโหลดรายชื่อ...
              </div>
            ) : (
              <div style={{ maxHeight: '520px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredStudents.map((s) => {
                  const isSelected = selectedStudent?.id === s.id;
                  const hasAssignedVoice = s.voiceType && s.voiceType !== 'All' && s.voiceType !== 'Unassigned' && s.voiceType !== '';
                  const isAudited = !!s.audition || hasAssignedVoice;

                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectStudent(s)}
                      style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(230, 185, 128, 0.15)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.05)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{s.name} {s.nickname ? `(${s.nickname})` : ''}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          รหัส: {s.studentId || '-'} | แนวเดิม: {s.voiceType || 'ยังไม่ได้กำหนด'} {s.bandPosition ? `| ตำแหน่ง: ${s.bandPosition}` : ''}
                        </div>
                      </div>

                      <div>
                        {isAudited ? (
                          <span style={{ fontSize: '0.75rem', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '0.25rem 0.6rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={12} /> {s.audition ? `${s.audition.lowestNote}-${s.audition.highestNote}` : `คัดเลือกแล้ว (${s.voiceType})`}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.25rem 0.6rem', borderRadius: '20px' }}>
                            ยังไม่คัดเสียง
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Audition Test Form */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            {selectedStudent ? (
              <div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.4rem' }}>คัดเสียง: {selectedStudent.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    รหัสนักเรียน: {selectedStudent.studentId || '-'} | ห้อง: {selectedStudent.section || '-'}
                  </div>
                </div>

                {/* Range Selector Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                      🎵 โน้ตต่ำสุดที่ร้องได้ (Lowest Note)
                    </label>
                    <select
                      value={lowestNote}
                      onChange={(e) => setLowestNote(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: '#1a1a2e',
                        color: '#fff',
                        fontSize: '1rem',
                      }}
                    >
                      {ALL_NOTE_OPTIONS.map((note) => (
                        <option key={note} value={note}>{note}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                      🎵 โน้ตสูงสุดที่ร้องได้ (Highest Note)
                    </label>
                    <select
                      value={highestNote}
                      onChange={(e) => setHighestNote(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: '#1a1a2e',
                        color: '#fff',
                        fontSize: '1rem',
                      }}
                    >
                      {ALL_NOTE_OPTIONS.map((note) => (
                        <option key={note} value={note}>{note}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Range Compass Visual Graph */}
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    <span>ช่วงเสียง (Vocal Compass): <strong>{lowestNote} → {highestNote}</strong></span>
                    <span>กว้าง {rangeSpan} ครึ่งเสียง ({Math.round(rangeSpan / 12 * 10) / 10} Octaves)</span>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', height: '16px', position: 'relative', overflow: 'hidden' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: `${Math.max(0, ((lowMidi - 36) / 60) * 100)}%`,
                        width: `${Math.min(100, (rangeSpan / 60) * 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #3b82f6, #e6b980, #ef4444)',
                        borderRadius: '6px',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                    <span>C2 (ต่ำสุด)</span>
                    <span>C4 (กลาง)</span>
                    <span>C6 (สูงสุด)</span>
                  </div>
                </div>

                {/* Timbre & Quality Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                      ✨ ลักษณะน้ำเสียง (Timbre)
                    </label>
                    <select
                      value={timbreQuality}
                      onChange={(e) => setTimbreQuality(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: '#1a1a2e',
                        color: '#fff',
                      }}
                    >
                      <option value="Bright">Bright / สดใส กังวาน</option>
                      <option value="Warm">Warm / นุ่มนวล อบอุ่น</option>
                      <option value="Rich">Rich & Heavy / หนักแน่น ทุ้มลึก</option>
                      <option value="Light">Light & Thin / เบา บาง</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                      🎯 ความตรงคีย์ (Pitch Accuracy 1-5)
                    </label>
                    <select
                      value={pitchAccuracy}
                      onChange={(e) => setPitchAccuracy(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: '#1a1a2e',
                        color: '#fff',
                      }}
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5/5) แม่นยำมาก</option>
                      <option value={4}>⭐⭐⭐⭐ (4/5) ค่อนข้างตรง</option>
                      <option value={3}>⭐⭐⭐ (3/5) พอใช้</option>
                      <option value={2}>⭐⭐ (2/5) เพี้ยนบางช่วง</option>
                      <option value={1}>⭐ (1/5) ต้องปรับปรุง</option>
                    </select>
                  </div>
                </div>

                {/* Additional Notes */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                    📝 หมายเหตุเพิ่มเติมจากผู้คัดเสียง
                  </label>
                  <textarea
                    rows={3}
                    placeholder="เช่น หายใจยาวได้ดี, เสียงหลบใส, ฯลฯ"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: '#1a1a2e',
                      color: '#fff',
                    }}
                  />
                </div>

                {/* Save Button */}
                <button
                  className="btn-primary"
                  onClick={handleSaveAudition}
                  disabled={saving}
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  บันทึกผลการคัดเสียง
                </button>
              </div>
            ) : (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Sliders size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h3>เลือกรายชื่อนักเรียนทางซ้าย</h3>
                <p>เพื่อเริ่มต้นระบุช่วงเสียง (Lowest Note - Highest Note) และผลการคัดเสียง</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
