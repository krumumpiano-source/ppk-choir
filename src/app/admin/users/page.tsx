'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, UserPlus, Trash2, Loader2, Save, Check, X, User as UserIcon } from 'lucide-react';
import { getAllUsers, createUser, deleteUser, updateUserStatus } from '@/lib/services/users';
import { User, UserRole } from '@/types/user';
import { VoiceType } from '@/lib/services/library';

import { toast } from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newVoiceType, setNewVoiceType] = useState<VoiceType>('Soprano');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  }

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
      role: newRole
    });

    if (res.success) {
      toast.success('เพิ่มผู้ใช้งานสำเร็จ');
      setNewId('');
      setNewName('');
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

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    const res = await updateUserStatus(id, status);
    if (res.success) {
      toast.success(status === 'approved' ? 'อนุมัติผู้ใช้สำเร็จ' : 'ปฏิเสธผู้ใช้สำเร็จ');
      loadUsers();
    } else {
      toast.error(`เกิดข้อผิดพลาด: ${res.error}`);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <Link href="/admin/dashboard" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={24} />
        </Link>
        <Users size={32} color="var(--accent-primary)" />
        <h1 style={{ margin: 0, fontSize: '2rem' }}>จัดการผู้ใช้งาน</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Form Add User */}
        <div className="glass-panel animate-fade-in">
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
                <option value="Soprano">Soprano</option>
                <option value="Alto">Alto</option>
                <option value="Tenor">Tenor</option>
                <option value="Bass">Bass</option>
                <option value="All">All (สำหรับ Admin)</option>
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

        {/* User List */}
        <div className="glass-panel animate-fade-in delay-1">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>รายชื่อผู้ใช้ทั้งหมด ({users.length})</h2>
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader2 size={32} className="animate-spin" color="var(--accent-primary)" />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>รูป</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>ID</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>ชื่อ</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>พาร์ท</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>บทบาท</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>สถานะ</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'right' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>
                        {u.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.photoUrl} alt={u.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserIcon size={20} color="var(--text-secondary)" />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>{u.id}</td>
                      <td style={{ padding: '1rem' }}>{u.name}</td>
                      <td style={{ padding: '1rem' }}>{u.voiceType}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.2rem 0.6rem', 
                          borderRadius: '4px', 
                          fontSize: '0.8rem',
                          background: u.role === 'admin' ? 'rgba(255, 71, 87, 0.1)' : u.role === 'section_leader' ? 'rgba(255, 159, 67, 0.1)' : 'rgba(46, 213, 115, 0.1)',
                          color: u.role === 'admin' ? 'var(--danger)' : u.role === 'section_leader' ? '#ff9f43' : 'var(--success)'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {u.status === 'pending' && <span style={{ color: '#feca57', fontSize: '0.85rem' }}>รออนุมัติ</span>}
                        {u.status === 'approved' && <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>อนุมัติแล้ว</span>}
                        {u.status === 'rejected' && <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>ไม่อนุมัติ</span>}
                        {!u.status && <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>อนุมัติแล้ว</span>}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          {(!u.status || u.status === 'pending') && (
                            <button onClick={() => handleStatusChange(u.id, 'approved')} style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer' }} title="อนุมัติ">
                              <Check size={18} />
                            </button>
                          )}
                          {(!u.status || u.status === 'pending') && (
                            <button onClick={() => handleStatusChange(u.id, 'rejected')} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }} title="ไม่อนุมัติ">
                              <X size={18} />
                            </button>
                          )}
                          <button onClick={() => handleDelete(u.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginLeft: '0.5rem' }} title="ลบ">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                     <tr>
                        <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>ไม่มีข้อมูลผู้ใช้งาน</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
