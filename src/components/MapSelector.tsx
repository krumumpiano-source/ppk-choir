'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const MapComponent = dynamic(
  () => import('./MapComponent'),
  { 
    ssr: false, 
    loading: () => (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
        <Loader2 className="animate-spin" size={32} color="var(--accent-primary)" />
      </div>
    )
  }
);

interface MapSelectorProps {
  lat: number;
  lng: number;
  radius: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function MapSelector(props: MapSelectorProps) {
  return <MapComponent {...props} />;
}
