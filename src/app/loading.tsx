import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
      <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>กำลังโหลด...</p>
    </div>
  );
}
