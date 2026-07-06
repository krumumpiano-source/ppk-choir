'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Library, Search, Loader2 } from 'lucide-react';
import AudioPlayer from '../../components/AudioPlayer';
import { getLibraryItems, VoiceType, LibraryItem } from '../../lib/services/library';
import { useAuth } from '@/components/providers/AuthProvider';

const VOICE_TABS: (VoiceType | 'All')[] = ['All', 'Soprano', 'Alto', 'Tenor', 'Bass'];

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<VoiceType | 'All'>('All');
  const [resources, setResources] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Set default tab based on user's voiceType
  useEffect(() => {
    if (user?.voiceType) {
      setActiveTab(user.voiceType as VoiceType);
    }
  }, [user]);

  useEffect(() => {
    async function loadResources() {
      setLoading(true);
      const data = await getLibraryItems(activeTab);
      setResources(data);
      setLoading(false);
    }
    
    loadResources();
  }, [activeTab]);

  const filteredResources = resources.filter(res => 
    res.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={24} />
        </Link>
        <Library size={32} color="var(--accent-primary)" />
        <h1 style={{ margin: 0, fontSize: '2rem' }}>คลังเสียงซ้อม</h1>
      </div>

      <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
          {VOICE_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '50px',
                border: '1px solid',
                borderColor: activeTab === tab ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                background: activeTab === tab ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab ? '#000' : 'var(--text-primary)',
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {tab === 'All' ? 'ทั้งหมด' : tab}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', marginTop: '1rem' }}>
          <Search size={20} color="var(--text-secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="ค้นหาเพลง หรือ แบบฝึกซ้อม..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem 1rem 1rem 3rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.2)',
              color: 'white',
              fontFamily: 'var(--font-body)'
            }}
          />
        </div>
      </div>

      <div className="animate-fade-in delay-1">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--accent-primary)' }}>
            <Loader2 size={32} className="animate-spin" />
          </div>
        ) : filteredResources.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            ไม่พบสื่อในหมวดหมู่นี้
          </div>
        ) : (
          filteredResources.map(resource => (
            <AudioPlayer 
              key={resource.id} 
              title={`${resource.title} (${resource.voiceType})`} 
              url={resource.fileUrl} 
            />
          ))
        )}
      </div>

    </div>
  );
}
