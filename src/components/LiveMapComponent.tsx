'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { Phone, MessageCircle } from 'lucide-react';

// Fix Leaflet marker icons issue in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

const redIcon = typeof window !== 'undefined' ? new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}) : undefined;



interface LiveMapComponentProps {
  center: { lat: number; lng: number };
  students: { id: string; name: string; lat: number; lng: number; lastUpdate: string; phone?: string; lineId?: string; isOutOfBounds?: boolean }[];
}

export default function LiveMapComponent({ center, students }: LiveMapComponentProps) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={16} scrollWheelZoom={true} style={{ height: '50vh', minHeight: '300px', maxHeight: '500px', width: '100%', borderRadius: '8px', zIndex: 1 }}>
      <TileLayer
        attribution='&copy; Google Maps'
        url="https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}"
      />
      {students.map(s => {
        const popupContent = (
          <Popup>
            <div style={{ padding: '0.5rem', fontFamily: 'var(--font-body)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1a1a24', fontSize: '1.1rem' }}>{s.name}</h4>
              <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.9rem' }}>
                อัปเดต: {new Date((s.lastUpdate && !s.lastUpdate.endsWith('Z') && !s.lastUpdate.includes('+')) ? s.lastUpdate.replace(' ', 'T') + 'Z' : s.lastUpdate).toLocaleTimeString('th-TH')}
              </p>
              
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {s.phone ? (
                  <a 
                    href={`tel:${s.phone}`}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '0.5rem', background: '#2ed573', color: 'white', textDecoration: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <Phone size={14} /> โทร
                  </a>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', background: '#eee', color: '#aaa', borderRadius: '6px', fontSize: '0.85rem' }}>ไม่มีเบอร์</div>
                )}
                
                {s.lineId ? (
                  <a 
                    href={`https://line.me/R/ti/p/~${s.lineId}`}
                    target="_blank" rel="noreferrer"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '0.5rem', background: '#00B900', color: 'white', textDecoration: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <MessageCircle size={14} /> ไลน์
                  </a>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', background: '#eee', color: '#aaa', borderRadius: '6px', fontSize: '0.85rem' }}>ไม่มีไลน์</div>
                )}
              </div>
            </div>
          </Popup>
        );

        if (s.isOutOfBounds && redIcon) {
          return (
            <Marker key={`${s.id}-out`} position={[s.lat, s.lng]} icon={redIcon}>
              {popupContent}
            </Marker>
          );
        } else {
          return (
            <Marker key={`${s.id}-in`} position={[s.lat, s.lng]}>
              {popupContent}
            </Marker>
          );
        }
      })}
    </MapContainer>
  );
}
