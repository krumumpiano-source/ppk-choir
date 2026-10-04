'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/components/providers/AuthProvider';
import { 
  VOICE_PART_SPECS, 
  smartAllocateVoiceParts, 
  StudentFitResult,
  midiToNote
} from '@/lib/services/voiceAllocation';
import { 
  PieChart, 
  Sliders, 
  Sparkles, 
  Save, 
  CheckCircle2, 
  RefreshCw, 
  UserCheck, 
  Loader2, 
  ShieldCheck,
  Check,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const VOICE_PARTS = Object.keys(VOICE_PART_SPECS);

const CHOIR_FORMAT_TEMPLATES: Record<string, Record<string, number>> = {
  'SSAATTBB (8 แนว)': {
    'Soprano 1': 15, 'Soprano 2': 15, 'Alto 1': 15, 'Alto 2': 15, 
    'Tenor 1': 10, 'Tenor 2': 10, 'Baritone': 10, 'Bass': 10
  },
  'SATB (4 แนว)': {
    'Soprano': 30, 'Alto': 30, 'Tenor': 20, 'Bass': 20
  },
  'SSAB (4 แนว)': {
    'Soprano 1': 30, 'Soprano 2': 25, 'Alto': 25, 'Baritone': 20
  },
  'SSAA (4 แนว)': {
    'Soprano 1': 25, 'Soprano 2': 25, 'Alto 1': 25, 'Alto 2': 25
  },
  'SAB (3 แนว)': {
    'Soprano': 40, 'Alto': 30, 'Baritone': 30
  }
};

export default function VoiceAllocationPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRatios, setSavingRatios] = useState(false);
  const [confirmingAssignments, setConfirmingAssignments] = useState(false);

  // Target ratios (percentages)
  const [ratios, setRatios] = useState<Record<string, number>>({
    'Soprano 1': 15,
    'Soprano 2': 15,
    'Alto 1': 15,
    'Alto 2': 15,
    'Tenor 1': 10,
    'Tenor 2': 10,
    'Baritone': 10,
    'Bass': 10,
  });

  // Allocation results
  const [allocatedStudents, setAllocatedStudents] = useState<StudentFitResult[]>([]);
  // Manual overrides per studentId -> voicePart
  const [manualAssignments, setManualAssignments] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch target ratios
      const ratioRes = await fetch('/api/voice-allocation');
      const ratioData = await ratioRes.json() as any;
      if (ratioData.ratios) {
        setRatios(ratioData.ratios);
      }

      // Fetch auditioned students
      const audRes = await fetch('/api/auditions');
      const audData = await audRes.json() as any;
      if (audData.students) {
        setStudents(audData.students);
        
        // Run initial smart allocation
        runAllocationEngine(audData.students, ratioData.ratios || ratios);
      }
    } catch (err: any) {
      toast.error('ไม่สามารถโหลดข้อมูลการจัดสรรแนวเสียงได้');
    } finally {
      setLoading(false);
    }
  };

  const runAllocationEngine = (studentList: any[], currentRatios: Record<string, number>) => {
    // Filter students with valid auditions or registered voiceTypes, EXCLUDING Instrumentalists
    const auditioned = studentList.filter((s) => 
      (s.audition || (s.voiceType && s.voiceType !== 'All' && s.voiceType !== 'Unassigned' && s.voiceType !== '')) &&
      s.voiceType !== 'นักดนตรี (Instrumentalist)'
    ).map((s) => {
      let lowestNote = 'C4';
      let highestNote = 'C5';
      
      if (s.audition) {
        lowestNote = s.audition.lowestNote;
        highestNote = s.audition.highestNote;
      } else if (s.voiceType && VOICE_PART_SPECS[s.voiceType]) {
        // Fallback to the ideal range for their registered voiceType
        lowestNote = midiToNote(VOICE_PART_SPECS[s.voiceType].idealLowMidi);
        highestNote = midiToNote(VOICE_PART_SPECS[s.voiceType].idealHighMidi);
      }

      return {
        id: s.id,
        name: s.name,
        lowestNote,
        highestNote,
        currentVoiceType: s.voiceType,
      };
    });

    const results = smartAllocateVoiceParts(auditioned, currentRatios);
    setAllocatedStudents(results);

    // Initialize manual assignments state to the student's CURRENT voice type (what they applied with)
    const initialMap: Record<string, string> = {};
    results.forEach((res) => {
      // Find the original student to get their current voice type
      const originalStudent = studentList.find(s => s.id === res.studentId);
      initialMap[res.studentId] = originalStudent?.voiceType || res.topSuggestedPart;
    });
    setManualAssignments(initialMap);
  };

  const handleRatioChange = (part: string, val: number) => {
    const updated = { ...ratios, [part]: Math.max(0, val) };
    setRatios(updated);
    runAllocationEngine(students, updated);
  };

  const handleSaveRatios = async () => {
    try {
      setSavingRatios(true);
      const res = await fetch('/api/voice-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_ratios',
          ratios,
        }),
      });

      const data = await res.json() as any;
      if (res.ok && data.success) {
        toast.success('บันทึกสัดส่วนเป้าหมายแนวเสียงเรียบร้อยแล้ว');
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการบันทึกสัดส่วน');
      }
    } catch (err: any) {
      toast.error('ไม่สามารถบันทึกสัดส่วนได้');
    } finally {
      setSavingRatios(false);
    }
  };

  const handleApplyAISuggestions = () => {
    const updated: Record<string, string> = {};
    allocatedStudents.forEach((st) => {
      updated[st.studentId] = st.topSuggestedPart;
    });
    setManualAssignments(updated);
    toast.success('นำข้อเสนอแนะ AI ไปใช้กับนักเรียนทุกคนแล้ว');
  };

  const handleManualAssignmentChange = (studentId: string, newPart: string) => {
    setManualAssignments((prev) => ({
      ...prev,
      [studentId]: newPart,
    }));
  };

  const handleConfirmFinalAssignments = async () => {
    const payload = Object.entries(manualAssignments).map(([userId, voiceType]) => ({
      userId,
      voiceType,
    }));

    if (payload.length === 0) {
      toast.error('ไม่มีข้อมูลการกำหนดแนวเสียงที่ต้องการบันทึก');
      return;
    }

    try {
      setConfirmingAssignments(true);
      const res = await fetch('/api/voice-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_assignments',
          assignments: payload,
        }),
      });

      const data = await res.json() as any;
      if (res.ok && data.success) {
        toast.success(data.message || 'ยืนยันและบันทึกแนวเสียงเรียบร้อยแล้ว');
        await loadData();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (err: any) {
      toast.error('ไม่สามารถอนุมัติบันทึกแนวเสียงได้');
    } finally {
      setConfirmingAssignments(false);
    }
  };

  const totalPercentage = Object.values(ratios).reduce((acc, curr) => acc + curr, 0);

  // Compute current actual counts based on manualAssignments
  const actualCounts: Record<string, number> = {};
  VOICE_PARTS.forEach((p) => (actualCounts[p] = 0));
  Object.values(manualAssignments).forEach((p) => {
    if (actualCounts[p] !== undefined) {
      actualCounts[p]++;
    }
  });

  const totalAudited = allocatedStudents.length;

  return (
    <div className="layout-container">
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <PieChart size={32} color="var(--accent-primary)" />
            <h1 style={{ fontSize: '2rem', margin: 0 }}>จัดสรรแนวเสียงวง (Smart Voice Allocation)</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            สำหรับครูผู้สอน/แอดมิน: กำหนดอัตราส่วนแนวเสียงเป้าหมายของวง ให้ระบบช่วยวิเคราะห์ และปรับเปลี่ยนกำหนดรายคนได้อย่างอิสระ
          </p>
        </div>

        {/* Section 1: Target Ratio Config Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={20} color="var(--accent-primary)" />
                กำหนดอัตราส่วนเป้าหมาย (Target Ratio Configuration)
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                รวมอัตราส่วนปัจจุบัน: <span style={{ color: totalPercentage === 100 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>{totalPercentage}%</span>
                {totalPercentage !== 100 && ' (ควรปรับให้รวมกันได้ 100%)'}
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={handleSaveRatios}
              disabled={savingRatios}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
            >
              {savingRatios ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              บันทึกสัดส่วนเป้าหมาย
            </button>
          </div>

          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
            <span style={{ fontWeight: 'bold' }}>รูปแบบวง (Choir Format):</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  const newRatios = CHOIR_FORMAT_TEMPLATES[e.target.value];
                  setRatios(newRatios);
                  runAllocationEngine(students, newRatios);
                  toast.success(`เปลี่ยนรูปแบบวงเป็น ${e.target.value} แล้ว (อย่าลืมกดบันทึก)`);
                }
              }}
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                background: '#1a1a2e',
                color: '#fff',
                border: '1px solid var(--accent-primary)',
              }}
            >
              <option value="">-- เลือกรูปแบบวงด่วน --</option>
              {Object.keys(CHOIR_FORMAT_TEMPLATES).map(fmt => (
                <option key={fmt} value={fmt}>{fmt}</option>
              ))}
            </select>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              * เลือกเพื่อตั้งค่าสัดส่วนอัตโนมัติ (จะซ่อนแนวเสียงที่ไม่ได้ใช้ออกไป)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
            {VOICE_PARTS.filter(p => ratios[p] !== undefined && ratios[p] > 0).map((part) => (
              <div key={part} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>{part}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={ratios[part] || 0}
                    onChange={(e) => handleRatioChange(part, Number(e.target.value))}
                    style={{
                      width: '65px',
                      padding: '0.4rem',
                      textAlign: 'center',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: '#1a1a2e',
                      color: '#fff',
                      fontWeight: 'bold',
                    }}
                  />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>%</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  เป้าหมาย: ~{Math.round(((ratios[part] || 0) / 100) * totalAudited)} คน
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Current Voice Distribution Progress Bars */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>สัดส่วนการจัดสรรปัจจุบันเทียบกับเป้าหมาย</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {VOICE_PARTS.filter(p => ratios[p] !== undefined && ratios[p] > 0).map((part) => {
              const current = actualCounts[part] || 0;
              const targetPct = ratios[part] || 0;
              const targetCount = Math.max(1, Math.round((targetPct / 100) * totalAudited));
              const fillPct = totalAudited > 0 ? Math.min(100, Math.round((current / targetCount) * 100)) : 0;

              return (
                <div key={part} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 'bold' }}>{part}</span>
                    <span>{current} / {targetCount} คน</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${fillPct}%`,
                        height: '100%',
                        background: fillPct >= 100 ? '#4ade80' : 'var(--accent-primary)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Smart Allocation Table with Individual Override */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} color="var(--accent-primary)" />
                ตารางจัดสรรแนวเสียงรายคน (Individual Voice Placement & Overrides)
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                ผลการวิเคราะห์จากช่วงเสียงจริง + คุณครูกำหนดปรับเปลี่ยนได้เป็นรายคน
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleApplyAISuggestions}
                style={{
                  background: 'rgba(230, 185, 128, 0.15)',
                  border: '1px solid var(--accent-primary)',
                  color: 'var(--accent-primary)',
                  padding: '0.6rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Sparkles size={16} /> ใช้คำแนะนำ AI ทั้งหมด
              </button>

              <button
                className="btn-primary"
                onClick={handleConfirmFinalAssignments}
                disabled={confirmingAssignments}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
              >
                {confirmingAssignments ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                อนุมัติและบันทึกแนวเสียงจริง
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
              กำลังโหลดข้อมูลการประเมิน...
            </div>
          ) : allocatedStudents.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <AlertTriangle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>ยังไม่มีนักเรียนได้รับการคัดและทดสอบช่วงเสียง</p>
              <p style={{ fontSize: '0.85rem' }}>โปรดให้หัวหน้าแนวหรือหัวหน้าวงทดสอบคัดเสียงในหน้า "คัดเลือกช่วงเสียง" ก่อน</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>นักเรียน</th>
                    <th style={{ padding: '0.75rem 1rem' }}>ช่วงเสียงที่ทดสอบได้</th>
                    <th style={{ padding: '0.75rem 1rem' }}>คำแนะนำจาก AI</th>
                    <th style={{ padding: '0.75rem 1rem' }}>คะแนนความเหมาะสม</th>
                    <th style={{ padding: '0.75rem 1rem' }}>แนวเสียงที่ครูกำหนด (Manual)</th>
                  </tr>
                </thead>
                <tbody>
                  {allocatedStudents.map((st) => {
                    const originalStudent = students.find(s => s.id === st.studentId);
                    const originalVoice = originalStudent?.voiceType;
                    const currentAssigned = manualAssignments[st.studentId] || originalVoice || st.topSuggestedPart;
                    
                    // It is overridden if the current assigned part is different from what they originally applied with
                    const isOverridden = currentAssigned !== originalVoice;
                    const displayName = originalStudent?.nickname ? `${st.studentName} (${originalStudent.nickname})` : st.studentName;

                    return (
                      <tr key={st.studentId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s ease' }}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 'bold' }}>{displayName}</div>
                          {originalStudent?.bandPosition && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
                              🎸 {originalStudent.bandPosition}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500' }}>
                            🎵 {st.lowestNote} - {st.highestNote} ({st.rangeInSemitones} ST)
                          </span>
                        </td>

                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                            {st.topSuggestedPart}
                          </span>
                        </td>

                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', width: '80px', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${st.topFitScore}%`, height: '100%', background: '#4ade80' }} />
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#4ade80', fontWeight: 'bold' }}>
                              {st.topFitScore}%
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '0.85rem 1rem' }}>
                          <select
                            value={currentAssigned}
                            onChange={(e) => handleManualAssignmentChange(st.studentId, e.target.value)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              borderRadius: '8px',
                              border: isOverridden ? '1px solid #e6b980' : '1px solid rgba(255,255,255,0.15)',
                              background: '#1a1a2e',
                              color: '#fff',
                              fontWeight: 'bold',
                            }}
                          >
                            {VOICE_PARTS.map((part) => (
                              <option key={part} value={part}>
                                {part}
                              </option>
                            ))}
                          </select>
                          {isOverridden && (
                            <span style={{ fontSize: '0.75rem', color: '#e6b980', display: 'block', marginTop: '0.2rem' }}>
                              *(ครูปรับเปลี่ยนด้วยตนเอง)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
