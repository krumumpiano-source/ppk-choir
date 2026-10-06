'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export default function VersionChecker() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [newVersion, setNewVersion] = useState<string | null>(null);

  useEffect(() => {
    // Check version every 5 minutes and when window regains focus
    const checkVersion = async () => {
      try {
        const res = await fetch(`/api/version?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as { version?: string };
          const currentVersion = process.env.NEXT_PUBLIC_APP_BUILD_ID;
          
          if (
            data.version && 
            currentVersion && 
            data.version !== currentVersion && 
            currentVersion !== 'unknown' &&
            data.version !== 'unknown'
          ) {
            // เช็คว่าเคยกดปิดเวอร์ชันนี้ไปแล้วหรือยังใน session นี้
            const ignoredVersion = sessionStorage.getItem('ignored_version');
            if (ignoredVersion !== data.version) {
              setNewVersion(data.version);
              setHasUpdate(true);
            }
          }
        }
      } catch (e) {
        console.error('Failed to check version:', e);
      }
    };

    // Initial check
    const timeout = setTimeout(checkVersion, 5000); // Check 5 seconds after load
    
    // Check periodically
    const interval = setInterval(checkVersion, 5 * 60 * 1000);
    
    // Check on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!hasUpdate) return null;

  const handleUpdate = () => {
    if (newVersion) {
      sessionStorage.setItem('ignored_version', newVersion);
    }
    window.location.href = window.location.pathname + '?update=' + Date.now();
  };

  const handleClose = () => {
    if (newVersion) {
      sessionStorage.setItem('ignored_version', newVersion);
    }
    setHasUpdate(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'var(--accent-primary)',
      color: '#000',
      padding: '12px 12px 12px 20px',
      borderRadius: '30px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 9999,
      animation: 'slideUp 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <strong style={{ fontSize: '0.9rem' }}>มีระบบเวอร์ชันใหม่!</strong>
        <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>กรุณาอัปเดตเพื่อให้ทำงานได้สมบูรณ์</span>
      </div>
      <button 
        onClick={handleUpdate}
        style={{
          background: '#000',
          color: '#fff',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 'bold',
          marginLeft: '5px'
        }}
      >
        <RefreshCw size={16} /> อัปเดตทันที
      </button>
      <button
        onClick={handleClose}
        style={{
          background: 'transparent',
          color: '#000',
          border: 'none',
          padding: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.6,
          transition: 'opacity 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
        onMouseOut={(e) => e.currentTarget.style.opacity = '0.6'}
        title="ปิดการแจ้งเตือน"
      >
        <X size={18} />
      </button>
    </div>
  );
}
