'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix Leaflet marker icons issue in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

interface LiveMapComponentProps {
  center: { lat: number; lng: number };
  students: { id: string; name: string; lat: number; lng: number; lastUpdate: string }[];
}

export default function LiveMapComponent({ center, students }: LiveMapComponentProps) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={16} scrollWheelZoom={true} style={{ height: '400px', width: '100%', borderRadius: '8px', zIndex: 1 }}>
      <TileLayer
        attribution='&copy; Google Maps'
        url="https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}"
      />
      {students.map(s => (
        <Marker key={s.id} position={[s.lat, s.lng]}>
          <Popup>
            <strong>{s.name}</strong><br/>
            อัปเดต: {new Date(s.lastUpdate).toLocaleTimeString('th-TH')}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
