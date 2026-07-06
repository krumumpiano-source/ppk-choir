'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', textAlign: 'center' }}>
      <div className="glass-panel" style={{ padding: '3rem', maxWidth: '500px' }}>
        <h2 style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '1.8rem' }}>เกิดข้อผิดพลาดบางอย่าง</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          ขออภัย ระบบไม่สามารถโหลดหน้านี้ได้ กรุณาลองใหม่อีกครั้ง
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={() => reset()} className="btn-primary" style={{ background: 'var(--accent-primary)', color: 'black' }}>
            ลองใหม่
          </button>
          <Link href="/" className="btn-primary" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    </div>
  );
}
