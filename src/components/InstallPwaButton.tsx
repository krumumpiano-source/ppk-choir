'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(true); // Default true to prevent flash

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    } else {
      setIsInstalled(false);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      setIsInstalled(false);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('ไม่สามารถติดตั้งแอปได้ในขณะนี้ อาจจะเพราะคุณเปิดในเบราว์เซอร์ที่ไม่รองรับ (เช่น Line) หรือติดตั้งแอปนี้ไปแล้ว แนะนำให้เปิดด้วย Google Chrome หรือ Safari ครับ');
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) return null;

  return (
    <button 
      onClick={handleInstallClick}
      className="btn-primary" 
      style={{ 
        width: '100%', 
        padding: '1rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '0.8rem',
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, #0984e3, #6c5ce7)',
        border: 'none',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(9, 132, 227, 0.3)'
      }}
    >
      <Download size={20} />
      ติดตั้งแอป PPK Choir ลงในเครื่อง
    </button>
  );
}
