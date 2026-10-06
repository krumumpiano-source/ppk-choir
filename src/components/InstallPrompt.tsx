'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    if (isStandalone) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed this before (within 7 days)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const safari = /safari/i.test(navigator.userAgent) && !/chrome|crios|fxios/i.test(navigator.userAgent);
    if (ios && safari) {
      setIsIOS(true);
      setTimeout(() => setShowBanner(true), 3000); // Show after 3s delay
      return;
    }

    // Android/Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      width: 'calc(100% - 2rem)',
      maxWidth: '420px',
      animation: 'slideUp 0.4s ease',
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(120%); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 62, 0.98), rgba(13, 13, 26, 0.98))',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(230, 185, 128, 0.3)',
        borderRadius: '16px',
        padding: '1.2rem 1.5rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(230,185,128,0.1)',
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-start',
      }}>
        {/* Icon */}
        <div style={{
          width: '52px', height: '52px', flexShrink: 0,
          background: 'linear-gradient(135deg, #e6b980, #a67c52)',
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Smartphone size={26} color="#0d0d1a" />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
            ติดตั้ง PPK CHOIR บนโทรศัพท์
          </p>
          <p style={{ margin: '0.25rem 0 0.8rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
            {isIOS
              ? <>แตะ <Share size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> ด้านล่าง แล้วเลือก <strong style={{color: '#e6b980'}}>&quot;เพิ่มไปยังหน้าจอโฮม&quot;</strong></>
              : 'เพิ่มลงหน้าจอหลัก เปิดได้เร็ว ใช้งานเหมือนแอปปกติ'
            }
          </p>
          {!isIOS && (
            <button
              onClick={handleInstall}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1.2rem',
                background: 'linear-gradient(135deg, #e6b980, #a67c52)',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                color: '#0d0d1a', fontWeight: 700, fontSize: '0.85rem',
              }}
            >
              <Download size={16} />
              ติดตั้งเลย
            </button>
          )}
        </div>

        {/* Close */}
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)', padding: '0.2rem', flexShrink: 0
          }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
