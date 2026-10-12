'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CalendarX, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Smartphone, 
  AlertTriangle, 
  Loader2, 
  Eye, 
  Filter, 
  RefreshCw,
  MessageSquare,
  User,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';

interface AdminLeaveRecord {
  id: string;
  studentId: string;
  studentName: string;
  actualStudentId?: string;
  room?: string;
  voiceType?: string;
  bandPosition?: string;
  profileUrl?: string;
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
  deviceId?: string;
  deviceModel?: string;
  ipAddress?: string;
  isSuspicious?: number;
  deviceNote?: string;
  createdAt: string;
}

const LEAVE_TYPE_NAMES: Record<string, string> = {
  sick: 'ลาป่วย 🤒',
  business: 'ลากิจ 📋',
  exam: 'ติดสอบ/เรียนพิเศษ 📚',
  school_activity: 'กิจกรรมโรงเรียน 🏫',
  other: 'อื่นๆ 💬'
};

export default function AdminLeavesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [leaves, setLeaves] = useState<AdminLeaveRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modal for Action Confirmation
  const [activeModal, setActiveModal] = useState<{
    leave: AdminLeaveRecord;
    action: 'approved' | 'rejected';
  } | null>(null);
  const [adminComment, setAdminComment] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Modal for Image preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'section_leader'))) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'all' ? '/api/leave' : `/api/leave?status=${statusFilter}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLeaves(data.leaves || []);
      }
    } catch (e) {
      toast.error('ไม่สามารถโหลดข้อมูลคำขอลาได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'section_leader')) {
      loadLeaves();
    }
  }, [user, statusFilter]);

  const handleUpdateStatus = async () => {
    if (!activeModal) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/leave/${activeModal.leave.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: activeModal.action,
          adminComment: adminComment.trim() || null
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'บันทึกสถานะเรียบร้อย');
        setActiveModal(null);
        setAdminComment('');
        loadLeaves();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (e) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setActionLoading(false);
    }
  };

  const formatThaiDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr + 'T12:00:00Z');
      return d.toLocaleDateString('th-TH', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  // Filter leaves by search
  const filteredLeaves = leaves.filter(l => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (l.studentName || '').toLowerCase().includes(term) ||
      (l.actualStudentId || '').toLowerCase().includes(term) ||
      (l.room || '').toLowerCase().includes(term) ||
      (l.reason || '').toLowerCase().includes(term) ||
      (l.sessionName || '').toLowerCase().includes(term)
    );
  });

  const pendingCount = leaves.filter(l => l.status === 'pending').length;

  if (authLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/admin/dashboard" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={24} />
          </Link>
          <CalendarX size={32} color="var(--accent-primary)" />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>จัดการคำขอลาซ้อม</h1>
            <p style={{ margin: '0.3rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              ตรวจสอบคำขอลาย้อนหลัง/ล่วงหน้าของนักเรียน พร้อมระบบตรวจจับอุปกรณ์
            </p>
          </div>
        </div>

        <button
          onClick={loadLeaves}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: '8px' }}
        >
          <RefreshCw size={16} /> รีเฟรชข้อมูล
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '1.2rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setStatusFilter('pending')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              border: 'none',
              background: statusFilter === 'pending' ? '#feca57' : 'rgba(255,255,255,0.05)',
              color: statusFilter === 'pending' ? '#000' : 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Clock size={16} /> รออนุมัติ ({statusFilter === 'pending' ? leaves.length : pendingCount})
          </button>
          
          <button
            onClick={() => setStatusFilter('approved')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              border: 'none',
              background: statusFilter === 'approved' ? 'var(--success)' : 'rgba(255,255,255,0.05)',
              color: statusFilter === 'approved' ? '#fff' : 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <CheckCircle size={16} /> อนุมัติแล้ว
          </button>

          <button
            onClick={() => setStatusFilter('rejected')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              border: 'none',
              background: statusFilter === 'rejected' ? 'var(--danger)' : 'rgba(255,255,255,0.05)',
              color: statusFilter === 'rejected' ? '#fff' : 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <XCircle size={16} /> ไม่อนุมัติ
          </button>

          <button
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              border: 'none',
              background: statusFilter === 'all' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
              color: statusFilter === 'all' ? '#000' : 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            ทั้งหมด
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', minWidth: '250px', flex: 1, maxWidth: '350px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อ, รหัส, ม./ห้อง..."
            style={{
              width: '100%',
              padding: '0.6rem 1rem 0.6rem 2.6rem',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
        </div>

      </div>

      {/* Main Leave Records List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
        </div>
      ) : filteredLeaves.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <CheckCircle size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p>ไม่มีรายการคำขอลาในสถานะนี้</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {filteredLeaves.map(leave => (
            <div key={leave.id} className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Top Row: Student Profile + Status Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {leave.profileUrl ? (
                    <img 
                      src={leave.profileUrl} 
                      alt={leave.studentName} 
                      style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }} 
                    />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(230, 185, 128, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={28} color="var(--accent-primary)" />
                    </div>
                  )}

                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                      {leave.studentName}
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      รหัส: <strong>{leave.actualStudentId || leave.studentId}</strong> | {leave.room || 'ม.ไม่ระบุ'} | แนวเสียง: <strong style={{ color: 'var(--accent-primary)' }}>{leave.voiceType || leave.bandPosition || '-'}</strong>
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {leave.status === 'pending' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(254, 202, 87, 0.2)', color: '#feca57', padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      <Clock size={16} /> รอการตรวจสอบ
                    </span>
                  )}
                  {leave.status === 'approved' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(46, 213, 115, 0.2)', color: 'var(--success)', padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      <CheckCircle size={16} /> อนุมัติแล้ว โดย {leave.approvedBy || 'ครู'}
                    </span>
                  )}
                  {leave.status === 'rejected' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255, 71, 87, 0.2)', color: 'var(--danger)', padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      <XCircle size={16} /> ไม่อนุมัติ
                    </span>
                  )}
                </div>
              </div>

              {/* Leave Details Box */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                    📅 วันที่ขอลา: <strong style={{ color: 'var(--accent-primary)' }}>{formatThaiDate(leave.leaveDate)}</strong>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    รอบซ้อม: <strong>{leave.sessionName || 'ซ้อมประจำวัน'}</strong>
                  </div>
                  <div>
                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                      {LEAVE_TYPE_NAMES[leave.leaveType] || leave.leaveType}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                  <strong>เหตุผล:</strong> {leave.reason}
                </div>

                {leave.adminComment && (
                  <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: '#feca57' }}>
                    <strong>หมายเหตุจากผู้ตรวจสอบ:</strong> {leave.adminComment}
                  </div>
                )}
              </div>

              {/* Anti-cheat & Device Attribution Box */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                flexWrap: 'wrap', 
                gap: '0.8rem',
                background: leave.isSuspicious === 1 ? 'rgba(255, 71, 87, 0.15)' : 'rgba(255,255,255,0.02)',
                border: leave.isSuspicious === 1 ? '1px solid #ff4757' : '1px solid rgba(255,255,255,0.05)',
                padding: '0.8rem 1rem',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <Smartphone size={18} color={leave.isSuspicious === 1 ? '#ff4757' : 'var(--text-secondary)'} />
                  <span>อุปกรณ์ที่ยื่น: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{leave.deviceModel || 'ไม่ทราบรุ่น'}</strong>
                  {leave.ipAddress && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}> (IP: {leave.ipAddress})</span>
                  )}
                </div>

                {/* Suspicious Anti-cheat alert */}
                {leave.isSuspicious === 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ff6b81', fontWeight: 600, fontSize: '0.85rem' }}>
                    <ShieldAlert size={18} />
                    <span>{leave.deviceNote || '⚠️ ตรวจพบเครื่องซ้ำกับนักเรียนคนอื่น'}</span>
                  </div>
                )}

                {/* Attachment Link */}
                {leave.attachmentUrl && (
                  <button
                    type="button"
                    onClick={() => setPreviewImage(leave.attachmentUrl!)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
                  >
                    <Eye size={16} /> ดูรูปหลักฐานแนบ
                  </button>
                )}
              </div>

              {/* Action Buttons for Pending leaves */}
              {leave.status === 'pending' && (
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setActiveModal({ leave, action: 'rejected' });
                      setAdminComment('');
                    }}
                    style={{
                      background: 'rgba(255, 71, 87, 0.15)',
                      color: 'var(--danger)',
                      border: '1px solid var(--danger)',
                      padding: '0.6rem 1.2rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <XCircle size={18} /> ปฏิเสธการลา
                  </button>

                  <button
                    onClick={() => {
                      setActiveModal({ leave, action: 'approved' });
                      setAdminComment('');
                    }}
                    style={{
                      background: 'var(--success)',
                      color: '#fff',
                      border: 'none',
                      padding: '0.6rem 1.4rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <CheckCircle size={18} /> อนุมัติการลา
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {activeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '480px', width: '100%', padding: '2rem', background: '#1e1e24', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem', color: activeModal.action === 'approved' ? 'var(--success)' : 'var(--danger)' }}>
              {activeModal.action === 'approved' ? 'ยืนยันการอนุมัติการลา' : 'ยืนยันการปฏิเสธคำขอลา'}
            </h3>

            <p style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '0.95rem' }}>
              นักเรียน: <strong>{activeModal.leave.studentName}</strong> ({activeModal.leave.room})<br />
              วันที่ลา: <strong>{formatThaiDate(activeModal.leave.leaveDate)}</strong>
            </p>

            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              ข้อความตอบกลับหรือหมายเหตุ (ไม่บังคับ):
            </label>
            <textarea
              rows={3}
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              placeholder="เช่น อนุมัติให้พักผ่อน, หรือ ข้อมูลไม่ครบถ้วน..."
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                marginBottom: '1.5rem'
              }}
            />

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn-secondary"
                disabled={actionLoading}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={actionLoading}
                style={{
                  background: activeModal.action === 'approved' ? 'var(--success)' : 'var(--danger)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.6rem 1.4rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                {actionLoading && <Loader2 size={16} className="animate-spin" />}
                ยืนยัน
              </button>
            </div>
          </div>
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
