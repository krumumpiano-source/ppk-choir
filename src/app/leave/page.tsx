'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Smartphone,
  Trash2,
  CalendarX,
  History,
  Eye,
  Info
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getDeviceId, getDeviceModel } from '@/lib/device';
import { compressImage } from '@/lib/image-upload';
import toast from 'react-hot-toast';

interface SessionItem {
  id: string;
  name: string;
  type?: string;
  time?: string;
}

interface LeaveRecord {
  id: string;
  leaveDate: string;
  sessionId?: string;
  sessionName?: string;
  leaveType: string;
  reason: string;
  attachmentUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminComment?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  deviceModel?: string;
}

const LEAVE_TYPES = [
  { id: 'sick', label: 'ลาป่วย 🤒', desc: 'มีอาการป่วย ไม่สบาย หรือพบแพทย์' },
  { id: 'business', label: 'ลากิจ 📋', desc: 'ธุระจำเป็นของครอบครัวหรือส่วนตัว' },
  { id: 'exam', label: 'ติดสอบ / เรียนพิเศษ 📚', desc: 'สอบกลางภาค/ปลายภาค หรือเรียนเสริม' },
  { id: 'school_activity', label: 'กิจกรรมโรงเรียน 🏫', desc: 'งานตัวแทนโรงเรียน หรือกิจกรรมวิชาการ' },
  { id: 'other', label: 'อื่นๆ 💬', desc: 'เหตุผลจำเป็นอื่นๆ' }
];

export default function LeavePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');

  // Form states
  const [leaveDate, setLeaveDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedSessionName, setSelectedSessionName] = useState<string>('');
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);
  const [leaveType, setLeaveType] = useState<string>('sick');
  const [reason, setReason] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Device Info
  const [deviceInfo, setDeviceInfo] = useState({ id: '', model: '' });

  // History states
  const [myLeaves, setMyLeaves] = useState<LeaveRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    setDeviceInfo({
      id: getDeviceId(),
      model: getDeviceModel()
    });
  }, []);

  // Fetch eligible sessions when leaveDate changes
  useEffect(() => {
    async function fetchSessions() {
      if (!leaveDate) return;
      setLoadingSessions(true);
      try {
        const res = await fetch(`/api/leave/eligible-sessions?date=${leaveDate}`);
        if (res.ok) {
          const data = await res.json();
          const list = data.sessions || [];
          setSessions(list);
          if (list.length > 0) {
            setSelectedSessionId(list[0].id);
            setSelectedSessionName(list[0].name);
          } else {
            setSelectedSessionId('');
            setSelectedSessionName('ซ้อมทั่วไป / ลาทั้งวัน');
          }
        }
      } catch (err) {
        console.error('Error fetching eligible sessions:', err);
      } finally {
        setLoadingSessions(false);
      }
    }

    if (user) {
      fetchSessions();
    }
  }, [leaveDate, user]);

  // Fetch user's leave history
  const loadMyLeaves = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/leave');
      if (res.ok) {
        const data = await res.json();
        setMyLeaves(data.leaves || []);
      }
    } catch (err) {
      console.error('Error loading leaves:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user && activeTab === 'history') {
      loadMyLeaves();
    }
  }, [user, activeTab]);

  // Handle image upload with auto-compression
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    setUploadingImage(true);
    compressImage(file, (base64) => {
      setAttachmentUrl(base64);
      setUploadingImage(false);
      toast.success('แนบรูปภาพหลักฐานเรียบร้อย');
    });
  };

  // Submit leave request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveDate) {
      toast.error('กรุณาเลือกวันที่ต้องการลา');
      return;
    }
    if (!reason.trim()) {
      toast.error('กรุณาระบุเหตุผลการลาอย่างละเอียด');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveDate,
          sessionId: selectedSessionId || null,
          sessionName: selectedSessionName || 'ซ้อมประจำวัน',
          leaveType,
          reason,
          attachmentUrl: attachmentUrl || null,
          deviceId: deviceInfo.id,
          deviceModel: deviceInfo.model
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'ส่งคำขอลาเรียบร้อยแล้ว');
        setReason('');
        setAttachmentUrl('');
        setActiveTab('history');
        loadMyLeaves();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการยื่นคำขอ');
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel pending leave request
  const handleCancelLeave = async (id: string) => {
    if (!confirm('คุณต้องการยกเลิกคำขอลานี้ใช่หรือไม่?')) return;
    try {
      const res = await fetch(`/api/leave/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('ยกเลิกคำขอลาเรียบร้อย');
        loadMyLeaves();
      } else {
        const data = await res.json();
        toast.error(data.error || 'ไม่สามารถยกเลิกคำขอได้');
      }
    } catch (e) {
      toast.error('เกิดข้อผิดพลาดในการยกเลิก');
    }
  };

  const formatThaiDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr + 'T12:00:00Z');
      return d.toLocaleDateString('th-TH', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  if (authLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '850px', margin: '0 auto', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CalendarX color="var(--accent-primary)" size={32} /> แจ้งลาซ้อม / กิจกรรม
          </h1>
          <p style={{ margin: '0.3rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            ยื่นคำขอลาย้อนหลังหรือล่วงหน้า พร้อมติดตามผลการอนุมัติจากคุณครู
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem', borderRadius: '12px' }}>
        <button
          onClick={() => setActiveTab('request')}
          style={{
            flex: 1,
            padding: '0.8rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'request' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'request' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <FileText size={18} /> ยื่นใบลา
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            flex: 1,
            padding: '0.8rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'history' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'history' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <History size={18} /> ประวัติการลาของฉัน ({myLeaves.length})
        </button>
      </div>

      {/* TAB 1: FORM */}
      {activeTab === 'request' && (
        <form onSubmit={handleSubmit} className="glass-panel animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Section: Date Picker */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              📅 วันที่ต้องการลา (สามารถเลือกลาย้อนหลังได้) <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="date"
              value={leaveDate}
              onChange={(e) => setLeaveDate(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'var(--accent-primary)' }}>
              {formatThaiDate(leaveDate)}
            </p>
          </div>

          {/* Section: Session Selection */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              ⏰ รอบ/ตารางซ้อมของวันนั้น
            </label>
            {loadingSessions ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', padding: '0.8rem' }}>
                <Loader2 size={16} className="animate-spin" /> กำลังโหลดรอบซ้อมของวันที่เลือก...
              </div>
            ) : sessions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedSessionId(s.id);
                      setSelectedSessionName(s.name);
                    }}
                    style={{
                      padding: '0.8rem 1rem',
                      borderRadius: '8px',
                      border: selectedSessionId === s.id ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                      background: selectedSessionId === s.id ? 'rgba(230, 185, 128, 0.15)' : 'rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: selectedSessionId === s.id ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                        {s.name}
                      </div>
                      {s.time && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          เวลา: {s.time}
                        </div>
                      )}
                    </div>
                    {selectedSessionId === s.id && <CheckCircle size={20} color="var(--accent-primary)" />}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                วันดังกล่าวไม่มีตารางซ้อมประจำที่กำหนดไว้ในระบบ (จะบันทึกเป็นการลาซ้อมทั่วไปประจำวัน)
              </div>
            )}
          </div>

          {/* Section: Leave Type */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              🏷️ ประเภทการลา <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem' }}>
              {LEAVE_TYPES.map(t => (
                <div
                  key={t.id}
                  onClick={() => setLeaveType(t.id)}
                  style={{
                    padding: '0.8rem 1rem',
                    borderRadius: '8px',
                    border: leaveType === t.id ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                    background: leaveType === t.id ? 'rgba(230, 185, 128, 0.15)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 600, color: leaveType === t.id ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {t.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Reason */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              📝 เหตุผลการลาโดยละเอียด <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="กรุณาระบุรายละเอียด เช่น เป็นไข้หวัดไปหาหมอ, ติดสอบเก็บคะแนนวิชาคณิตศาสตร์, ติดภารกิจจำเป็นของทางบ้าน ฯลฯ"
              required
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Section: Photo Attachment */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              📎 แนบรูปภาพหลักฐาน (ถ้ามี เช่น ใบรับรองแพทย์ / ใบนัดหมอ / บันทึกข้อความ)
            </label>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <input
                type="file"
                id="leave-attachment"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                disabled={uploadingImage}
              />
              <label
                htmlFor="leave-attachment"
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: uploadingImage ? 'not-allowed' : 'pointer',
                  opacity: uploadingImage ? 0.7 : 1,
                  padding: '0.7rem 1.2rem',
                  borderRadius: '8px'
                }}
              >
                {uploadingImage ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                {uploadingImage ? 'กำลังประมวลผลรูปภาพ...' : 'ถ่ายรูป / เลือกภาพหลักฐาน'}
              </label>

              {attachmentUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img
                    src={attachmentUrl}
                    alt="หลักฐาน"
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--accent-primary)', cursor: 'pointer' }}
                    onClick={() => setPreviewImage(attachmentUrl)}
                  />
                  <button
                    type="button"
                    onClick={() => setAttachmentUrl('')}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Device Attribution Notice */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.03)', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            borderRadius: '8px', 
            padding: '0.8rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            <Smartphone size={20} color="var(--accent-primary)" />
            <div>
              <span>อุปกรณ์ที่ใช้ยื่นเรื่อง: </span>
              <strong style={{ color: 'var(--text-primary)' }}>{deviceInfo.model || 'ตรวจจับอุปกรณ์'}</strong>
              <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', opacity: 0.7 }}>
                (รหัสเครื่อง: {deviceInfo.id ? deviceInfo.id.substring(0, 10) + '...' : '-'})
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || uploadingImage}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.05rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              marginTop: '0.5rem',
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
            {submitting ? 'กำลังส่งข้อมูล...' : 'ยืนยันการยื่นคำขอลา'}
          </button>
        </form>
      )}

      {/* TAB 2: MY LEAVES HISTORY */}
      {activeTab === 'history' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loadingHistory ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 size={40} className="animate-spin" color="var(--accent-primary)" />
            </div>
          ) : myLeaves.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <CalendarX size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
              <p>คุณยังไม่มีประวัติการแจ้งลา</p>
              <button 
                onClick={() => setActiveTab('request')} 
                className="btn-primary" 
                style={{ marginTop: '1rem', padding: '0.6rem 1.2rem' }}
              >
                ยื่นคำขอลาตอนนี้
              </button>
            </div>
          ) : (
            myLeaves.map(item => (
              <div key={item.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      📅 {formatThaiDate(item.leaveDate)}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      รอบซ้อม: <strong style={{ color: 'var(--accent-primary)' }}>{item.sessionName || 'ซ้อมประจำวัน'}</strong>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {item.status === 'pending' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(254, 202, 87, 0.2)', color: '#feca57', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        <Clock size={14} /> รอคุณครูตรวจสอบ
                      </span>
                    )}
                    {item.status === 'approved' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(46, 213, 115, 0.2)', color: 'var(--success)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        <CheckCircle size={14} /> อนุมัติแล้ว
                      </span>
                    )}
                    {item.status === 'rejected' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255, 71, 87, 0.2)', color: 'var(--danger)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        <XCircle size={14} /> ไม่อนุมัติ
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                    ประเภท: <strong>{LEAVE_TYPES.find(t => t.id === item.leaveType)?.label || item.leaveType}</strong>
                  </div>
                  <div style={{ color: 'var(--text-primary)', lineHeight: '1.4' }}>
                    {item.reason}
                  </div>
                </div>

                {/* Admin Feedback */}
                {item.adminComment && (
                  <div style={{ background: 'rgba(230, 185, 128, 0.1)', border: '1px solid rgba(230, 185, 128, 0.3)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--accent-primary)', marginBottom: '0.2rem' }}>
                      💬 ข้อความจากคุณครู ({item.approvedBy || 'ครูผู้ดูแล'}):
                    </div>
                    <div style={{ color: 'var(--text-primary)' }}>{item.adminComment}</div>
                  </div>
                )}

                {/* Footer with Attachment and Cancel button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem', marginTop: '0.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {item.attachmentUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(item.attachmentUrl!)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
                      >
                        <Eye size={16} /> ดูรูปหลักฐาน
                      </button>
                    )}
                    {item.deviceModel && (
                      <span>📱 {item.deviceModel}</span>
                    )}
                  </div>

                  {item.status === 'pending' && (
                    <button
                      onClick={() => handleCancelLeave(item.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
                    >
                      <Trash2 size={16} /> ยกเลิกคำขอ
                    </button>
                  )}
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '2rem'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <img 
              src={previewImage} 
              alt="หลักฐานขยาย" 
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', objectFit: 'contain' }} 
            />
            <p style={{ textAlign: 'center', color: '#fff', marginTop: '1rem', fontSize: '0.9rem' }}>
              คลิกที่ใดก็ได้เพื่อปิด
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
