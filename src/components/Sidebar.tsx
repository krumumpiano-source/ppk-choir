'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { 
  Home, 
  MapPin, 
  CheckSquare, 
  Music, 
  Users, 
  BarChart2, 
  FileText,
  Menu,
  X,
  LogOut,
  Mic,
  UsersRound
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // If not logged in, don't show the sidebar
  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const adminLinks = [
    { name: 'แดชบอร์ด', path: '/admin/dashboard', icon: Home },
    { name: 'จัดการกิจกรรม', path: '/admin/sessions', icon: MapPin },
    { name: 'ตรวจประเมิน', path: '/admin/assess', icon: CheckSquare },
    { name: 'คลังสื่อ', path: '/admin/library', icon: Music },
    { name: 'จัดการผู้ใช้งาน', path: '/admin/users', icon: Users },
    { name: 'สถิติ Analytics', path: '/admin/analytics', icon: BarChart2 },
    { name: 'ออกรายงาน', path: '/admin/reports', icon: FileText },
  ];

  const studentLinks = [
    { name: 'หน้าแรก', path: '/dashboard', icon: Home },
    { name: 'คลังสื่อ', path: '/library', icon: Music },
    { name: 'ส่งงาน/ฝึกซ้อม', path: '/practice', icon: Mic },
    { name: 'เพียร์ประเมิน', path: '/peers', icon: UsersRound },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar Container */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="gradient-text" style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>PPK CHOIR</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {isAdmin ? 'Admin Panel' : `สวัสดี, ${user.name}`}
          </p>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => {
            const Icon = link.icon;
            // Exact match for dashboard to prevent matching everything, otherwise startsWith
            const isActive = link.path === '/dashboard' || link.path === '/admin/dashboard'
              ? pathname === link.path
              : pathname.startsWith(link.path);
            
            return (
              <Link 
                key={link.path} 
                href={link.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <Icon size={20} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-link logout-btn">
            <LogOut size={20} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>
    </>
  );
}
