'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, UserPlus, Trash2, Loader2, Save, Check, X, User as UserIcon, Search, Filter, Eye, Key, Edit } from 'lucide-react';
import { getAllUsers, createUser, deleteUser, updateUserStatus, updateUser } from '@/lib/services/users';
import { User, UserRole } from '@/types/user';
import { VoiceType } from '@/lib/services/library';

import { toast } from 'react-hot-toast';

function getDriveImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('data:image')) return url;
  
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    // lh3.googleusercontent.com/d/ID is more reliable for embedding than uc?export=view
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}

const Avatar = ({ src, alt, size = 40 }: { src?: string, alt: string, size?: number }) => {
  const [error, setError] = useState(false);
  
  const driveSrc = getDriveImageUrl(src);
  
  if (!driveSrc || error) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <UserIcon size={size / 2} color="var(--text-secondary)" />
      </div>
    );
  }
  
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={driveSrc} 
      alt={alt} 
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', background: 'rgba(255,255,255,0.05)' }}
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
    />
  );
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter and Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVoiceType, setFilterVoiceType] = useState('All');
  
  // Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // Form State
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newVoiceType, setNewVoiceType] = useState<VoiceType>('Soprano 1');
  const [newBandPosition, setNewBandPosition] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadUsers() {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newName) {
      toast.error('กรุณากรอกรหัสและชื่อผู้ใช้');
      return;
    }
    
    setIsSubmitting(true);
    
    const res = await createUser({
      id: newId,
      name: newName,
      voiceType: newVoiceType,
      bandPosition: newBandPosition || undefined,
      role: newRole
    });

    if (res.success) {
      toast.success('เพิ่มผู้ใช้งานสำเร็จ');
      setNewId('');
      setNewName('');
      setNewBandPosition('');
      setIsAddUserModalOpen(false);
      loadUsers();
    } else {
      toast.error(`ข้อผิดพลาด: ${res.error}`);
    }
    
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ ${id}?`)) {
      const res = await deleteUser(id);
      if (res.success) {
        toast.success(`ลบผู้ใช้ ${id} สำเร็จ`);
        loadUsers();
      } else {
        toast.error(`เกิดข้อผิดพลาดในการลบผู้ใช้`);
      }
    }
  };

  const handleResetPassword = async (id: string, newPassword: string) => {
    if (confirm(`คุณต้องการรีเซ็ตรหัสผ่านของผู้ใช้นี้เป็น "${newPassword}" หรือไม่?`)) {
      try {
        const res = await fetch(`/api/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: newPassword })
        });
        const data = await res.json() as any;
        if (res.ok && data.success) {
          toast.success('รีเซ็ตรหัสผ่านสำเร็จ!');
        } else {
          toast.error(data.error || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
        }
      } catch (err) {
        toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      }
    }
  };

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    const res = await updateUserStatus(id, status);
    if (res.success) {
      toast.success(status === 'approved' ? 'อนุมัติผู้ใช้สำเร็จ' : 'ปฏิเสธผู้ใช้สำเร็จ');
      loadUsers();
    } else {
      toast.error(`เกิดข้อผิดพลาด: ${res.error}`);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setIsSubmitting(true);
    const res = await updateUser(editingUser.id, {
      name: editingUser.name,
      nickname: editingUser.nickname,
      studentId: editingUser.studentId,
      voiceType: editingUser.voiceType,
      bandPosition: editingUser.bandPosition || '',
      role: editingUser.role
    });
    
    if (res.success) {
      toast.success('แก้ไขข้อมูลสำเร็จ');
      setEditingUser(null);
      loadUsers();
    } else {
      toast.error(`ข้อผิดพลาด: ${res.error}`);
    }
    setIsSubmitting(false);
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.nickname?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchVoice = filterVoiceType === 'All' ? true : u.voiceType === filterVoiceType;
    return matchSearch && matchVoice;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', width: '100%', margin: '0 auto', position: 'relative' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <Link href="/admin/dashboard" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={24} />
        </Link>
        <Users size={32} color="var(--accent-primary)" />
        <h1 style={{ margin: 0, fontSize: '2rem' }}>จัดการผู้ใช้งาน</h1>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* User List */}
        <div className="glass-panel animate-fade-in delay-1" style={{ width: '100%', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>รายชื่อผู้ใช้ทั้งหมด ({filteredUsers.length})</h2>
              <button 
                onClick={() => setIsAddUserModalOpen(true)}
                className="btn-primary" 
                style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <UserPlus size={16} /> เพิ่มผู้ใช้งานใหม่
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="input-group" style={{ margin: 0, position: 'relative' }}>
                <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="ค้นหาชื่อ, รหัส, ชื่อเล่น..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '35px', width: '220px', margin: 0 }}
                />
              </div>
              <div className="input-group" style={{ margin: 0, position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={18} color="var(--text-secondary)" />
                <select 
                  className="input-field" 
                  value={filterVoiceType} 
                  onChange={e => setFilterVoiceType(e.target.value)}
                  style={{ appearance: 'auto', margin: 0, width: '130px' }}
                >
                  <option value="All">ทุกพาร์ท</option>
                  <option value="Soprano 1">Soprano 1</option>
                  <option value="Soprano 2">Soprano 2</option>
                  <option value="Alto 1">Alto 1</option>
                  <option value="Alto 2">Alto 2</option>
                  <option value="Tenor 1">Tenor 1</option>
                  <option value="Tenor 2">Tenor 2</option>
                  <option value="Baritone">Baritone</option>
                  <option value="Bass">Bass</option>
                </select>
              </div>
              <button 
                className="btn-secondary"
                style={{ margin: 0, padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                onClick={async () => {
                  if(confirm('ระบบจะปรับคำนำหน้าให้เป็นมาตรฐานเดียวกันทั้งหมด (นาย, นางสาว, ด.ช., ด.ญ.) ยืนยันหรือไม่?')) {
                    const res = await fetch('/api/admin/clean-names', { method: 'POST' });
                    const data = await res.json().catch(() => ({})) as any;
                    if(res.ok) {
                      toast.success('ทำความสะอาดคำนำหน้าสำเร็จ!');
                      loadUsers();
                    } else {
                      toast.error(data.error || 'เกิดข้อผิดพลาด');
                    }
                  }
                }}
              >
                🧹 จัดระเบียบคำนำหน้า
              </button>
            </div>
          </div>
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader2 size={32} className="animate-spin" color="var(--accent-primary)" />
            </div>
          ) : (
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>รูป</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>ID</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>ชื่อ-สกุล</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>ชื่อเล่น</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>พาร์ท</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>การติดต่อ</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>บทบาท</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>สถานะ</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'right', whiteSpace: 'nowrap' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>
                        <Avatar src={u.photoUrl} alt={u.name} size={40} />
                      </td>
                      <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>{u.studentId || u.id}</td>
                      <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>{u.name}</td>
                      <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>{u.nickname || '-'}</td>
                      <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                        {u.voiceType}
                        {u.bandPosition && <><br/><span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>{u.bandPosition}</span></>}
                      </td>
                      <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                          {u.phone && <span>📞 {u.phone}</span>}
                          {u.lineId && <span>💬 {u.lineId}</span>}
                          {!u.phone && !u.lineId && <span style={{ color: 'var(--text-secondary)' }}>-</span>}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                        <span style={{ 
                          padding: '0.2rem 0.6rem', 
                          borderRadius: '4px', 
                          fontSize: '0.8rem',
                          background: u.role === 'admin' ? 'rgba(255, 71, 87, 0.1)' : u.role === 'section_leader' ? 'rgba(255, 159, 67, 0.1)' : 'rgba(46, 213, 115, 0.1)',
                          color: u.role === 'admin' ? 'var(--danger)' : u.role === 'section_leader' ? '#ff9f43' : 'var(--success)',
                          whiteSpace: 'nowrap'
                        }}>
                          {u.role === 'section_leader' ? 'Section Leader' : u.role}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {u.status === 'pending' && <span style={{ color: '#feca57', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>รออนุมัติ</span>}
                        {u.status === 'approved' && <span style={{ color: 'var(--success)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>อนุมัติแล้ว</span>}
                        {u.status === 'rejected' && <span style={{ color: 'var(--danger)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>ไม่อนุมัติ</span>}
                        {!u.status && <span style={{ color: 'var(--success)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>อนุมัติแล้ว</span>}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button onClick={() => setSelectedUser(u)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(230, 185, 128, 0.1)', border: '1px solid rgba(230, 185, 128, 0.3)', color: 'var(--accent-primary)', cursor: 'pointer', transition: 'all 0.2s' }} title="ดูรายละเอียด">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => setEditingUser({...u})} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(123, 237, 159, 0.1)', border: '1px solid rgba(123, 237, 159, 0.3)', color: '#7bed9f', cursor: 'pointer', transition: 'all 0.2s' }} title="แก้ไขข้อมูล">
                            <Edit size={16} />
                          </button>
                          {(!u.status || u.status === 'pending') && (
                            <button onClick={() => handleStatusChange(u.id, 'approved')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(46, 213, 115, 0.1)', border: '1px solid rgba(46, 213, 115, 0.3)', color: 'var(--success)', cursor: 'pointer', transition: 'all 0.2s' }} title="อนุมัติ">
                              <Check size={16} />
                            </button>
                          )}
                          {(!u.status || u.status === 'pending') && (
                            <button onClick={() => handleStatusChange(u.id, 'rejected')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 71, 87, 0.1)', border: '1px solid rgba(255, 71, 87, 0.3)', color: 'var(--danger)', cursor: 'pointer', transition: 'all 0.2s' }} title="ไม่อนุมัติ">
                              <X size={16} />
                            </button>
                          )}
                          <button onClick={() => handleResetPassword(u.id, u.studentId || '123456')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(254, 202, 87, 0.1)', border: '1px solid rgba(254, 202, 87, 0.3)', color: '#feca57', cursor: 'pointer', transition: 'all 0.2s' }} title="รีเซ็ตรหัสผ่านเป็นรหัสประจำตัวนักเรียน">
                            <Key size={16} />
                          </button>
                          <button onClick={() => handleDelete(u.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 71, 87, 0.1)', border: '1px solid rgba(255, 71, 87, 0.3)', color: 'var(--danger)', cursor: 'pointer', transition: 'all 0.2s' }} title="ลบผู้ใช้งาน">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                     <tr>
                        <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>ไม่มีข้อมูลผู้ใช้งานที่ตรงกับการค้นหา</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setSelectedUser(null)}>
          <div 
            className="glass-panel" 
            style={{ 
              width: '100%', 
              maxWidth: '600px', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedUser(null)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Avatar src={selectedUser.photoUrl} alt={selectedUser.name} size={60} />
              <div>
                <div style={{ fontSize: '1.5rem' }}>{selectedUser.name} {selectedUser.nickname ? `(${selectedUser.nickname})` : ''}</div>
                <div style={{ fontSize: '1rem', color: 'var(--accent-primary)' }}>{selectedUser.voiceType} {selectedUser.bandPosition ? `(${selectedUser.bandPosition})` : ''} • รหัส: {selectedUser.studentId || selectedUser.id}</div>
              </div>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
              <div>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>ข้อมูลส่วนตัว</h3>
                <p><strong>เบอร์โทรศัพท์:</strong> {selectedUser.phone || '-'}</p>
                <p><strong>Line ID:</strong> {selectedUser.lineId || '-'}</p>
                <p><strong>อีเมล:</strong> {selectedUser.email || '-'}</p>
                <p><strong>ที่อยู่:</strong> {selectedUser.address || '-'}</p>
                <p><strong>ครูที่ปรึกษา:</strong> {selectedUser.advisorName || '-'}</p>
                {selectedUser.bandPosition && <p><strong>ตำแหน่งในวง:</strong> {selectedUser.bandPosition}</p>}
                {selectedUser.room && <p><strong>ห้อง:</strong> {selectedUser.room}</p>}
                {selectedUser.createdAt && <p><strong>วันที่สมัคร:</strong> {new Date(selectedUser.createdAt).toLocaleDateString('th-TH')}</p>}
              </div>
              
              <div>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>ข้อมูลติดต่อฉุกเฉิน (ผู้ปกครอง)</h3>
                <p><strong>ชื่อผู้ปกครอง:</strong> {selectedUser.parentName || '-'}</p>
                <p><strong>เบอร์โทร:</strong> {selectedUser.parentPhone || '-'}</p>
                <p><strong>Line ID:</strong> {selectedUser.parentLineId || '-'}</p>
                <p><strong>อีเมลผู้ปกครอง:</strong> {selectedUser.parentEmail || '-'}</p>
              </div>
            </div>
            
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedUser(null)} className="btn-secondary">ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setEditingUser(null)}>
          <div 
            className="glass-panel" 
            style={{ 
              width: '100%', 
              maxWidth: '500px', 
              position: 'relative',
              padding: '2rem'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit size={24} color="var(--accent-primary)" />
              แก้ไขข้อมูล
            </h2>
            
            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label>รหัสนักเรียน / ID</label>
                <input type="text" className="input-field" value={editingUser.studentId || editingUser.id} onChange={e => setEditingUser({...editingUser, studentId: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>ชื่อ-สกุล</label>
                <input type="text" className="input-field" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>ชื่อเล่น</label>
                <input type="text" className="input-field" value={editingUser.nickname || ''} onChange={e => setEditingUser({...editingUser, nickname: e.target.value})} />
              </div>
              <div className="input-group">
                <label>แนวเสียง</label>
                <select className="input-field" value={editingUser.voiceType} onChange={e => setEditingUser({...editingUser, voiceType: e.target.value as VoiceType})} style={{ appearance: 'auto' }}>
                  <option value="Soprano 1">Soprano 1</option>
                  <option value="Soprano 2">Soprano 2</option>
                  <option value="Alto 1">Alto 1</option>
                  <option value="Alto 2">Alto 2</option>
                  <option value="Tenor 1">Tenor 1</option>
                  <option value="Tenor 2">Tenor 2</option>
                  <option value="Baritone">Baritone</option>
                  <option value="Bass">Bass</option>
                  <option value="เปียโน (Piano)">เปียโน (Piano)</option>
                  <option value="วงสตริง (String Band)">วงสตริง (String Band)</option>
                  <option value="All">All (สำหรับ Admin)</option>
                </select>
              </div>
              <div className="input-group">
                <label>ตำแหน่งเครื่องดนตรี (ถ้ามี)</label>
                <select className="input-field" value={editingUser.bandPosition || ''} onChange={e => setEditingUser({...editingUser, bandPosition: e.target.value})} style={{ appearance: 'auto' }}>
                  <option value="">-- ไม่ได้เล่นเครื่องดนตรีในวง --</option>
                  <option value="เปียโน">เปียโน</option>
                  <option value="กลอง">กลอง</option>
                  <option value="เบส">เบส</option>
                  <option value="กีต้าร์">กีต้าร์</option>
                  <option value="คีย์บอร์ด">คีย์บอร์ด</option>
                </select>
              </div>
              <div className="input-group">
                <label>บทบาท</label>
                <select className="input-field" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})} style={{ appearance: 'auto' }}>
                  <option value="student">นักเรียน (Student)</option>
                  <option value="section_leader">หัวหน้าพาร์ท (Section Leader)</option>
                  <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary">ยกเลิก</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setIsAddUserModalOpen(false)}>
          <div 
            className="glass-panel" 
            style={{ 
              width: '100%', 
              maxWidth: '500px', 
              position: 'relative',
              padding: '2rem'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsAddUserModalOpen(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={20} color="var(--accent-primary)" />
              เพิ่มผู้ใช้งานใหม่
            </h2>
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label>รหัสนักเรียน / ID</label>
                <input type="text" className="input-field" value={newId} onChange={e => setNewId(e.target.value)} placeholder="เช่น 65001" required />
              </div>
              <div className="input-group">
                <label>ชื่อ-สกุล</label>
                <input type="text" className="input-field" value={newName} onChange={e => setNewName(e.target.value)} placeholder="เช่น สมชาย ใจดี" required />
              </div>
              <div className="input-group">
                <label>แนวเสียง</label>
                <select className="input-field" value={newVoiceType} onChange={e => setNewVoiceType(e.target.value as VoiceType)} style={{ appearance: 'auto' }}>
                  <option value="Soprano 1">Soprano 1</option>
                  <option value="Soprano 2">Soprano 2</option>
                  <option value="Alto 1">Alto 1</option>
                  <option value="Alto 2">Alto 2</option>
                  <option value="Tenor 1">Tenor 1</option>
                  <option value="Tenor 2">Tenor 2</option>
                  <option value="Baritone">Baritone</option>
                  <option value="Bass">Bass</option>
                  <option value="เปียโน (Piano)">เปียโน (Piano)</option>
                  <option value="วงสตริง (String Band)">วงสตริง (String Band)</option>
                  <option value="All">All (สำหรับ Admin)</option>
                </select>
              </div>
              <div className="input-group">
                <label>ตำแหน่งเครื่องดนตรี (ถ้ามี)</label>
                <select className="input-field" value={newBandPosition} onChange={e => setNewBandPosition(e.target.value)} style={{ appearance: 'auto' }}>
                  <option value="">-- ไม่ได้เล่นเครื่องดนตรีในวง --</option>
                  <option value="เปียโน">เปียโน</option>
                  <option value="กลอง">กลอง</option>
                  <option value="เบส">เบส</option>
                  <option value="กีต้าร์">กีต้าร์</option>
                  <option value="คีย์บอร์ด">คีย์บอร์ด</option>
                </select>
              </div>
              <div className="input-group">
                <label>บทบาท</label>
                <select className="input-field" value={newRole} onChange={e => setNewRole(e.target.value as UserRole)} style={{ appearance: 'auto' }}>
                  <option value="student">นักเรียน (Student)</option>
                  <option value="section_leader">หัวหน้าพาร์ท (Section Leader)</option>
                  <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                </select>
              </div>
              
              <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ marginTop: '0.5rem' }}>
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                บันทึกข้อมูล
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
