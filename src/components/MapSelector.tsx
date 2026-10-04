'use client';

import { useEffect, useState, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

interface MapSelectorProps {
  lat: number;
  lng: number;
  radius: number;
  onLocationChange: (lat: number, lng: number) => void;
}

// Load the Leaflet map on the client only, without next/dynamic
// (next/dynamic crashed with "r is not a function" on this React/Next combo).
export default function MapSelector(props: MapSelectorProps) {
  const [Comp, setComp] = useState<ComponentType<MapSelectorProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    import('./MapComponent').then(mod => {
      if (!cancelled) setComp(() => mod.default);
    });
    return () => { cancelled = true; };
  }, []);

  if (!Comp) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
        <Loader2 className="animate-spin" size={32} color="var(--accent-primary)" />
      </div>
    );
  }
  return <Comp {...props} />;
}
