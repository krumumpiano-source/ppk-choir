'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icons issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  lat: number;
  lng: number;
  radius: number;
  trackingRadius?: number;
  onLocationChange: (lat: number, lng: number) => void;
}

function LocationMarker({ lat, lng, onLocationChange }: { lat: number, lng: number, onLocationChange: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<L.LatLng>(new L.LatLng(lat, lng));
  const onLocationChangeRef = useRef(onLocationChange);
  const hasLocated = useRef(false);

  // Keep the ref updated without triggering re-renders
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  });

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationChangeRef.current(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
    locationfound(e) {
      setPosition(e.latlng);
      onLocationChangeRef.current(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    }
  });

  useEffect(() => {
    // Only auto-locate once on mount if using default Phayao coords
    if (!hasLocated.current) {
      hasLocated.current = true;
      if (Math.abs(lat - 19.170294) < 0.0001 && Math.abs(lng - 99.910288) < 0.0001) {
        map.locate({ setView: true, maxZoom: 16 });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

function MapBoundsFitter({ lat, lng, radius, trackingRadius }: { lat: number, lng: number, radius: number, trackingRadius?: number }) {
  const map = useMapEvents({});
  
  useEffect(() => {
    const maxRadius = trackingRadius && trackingRadius > radius ? trackingRadius : radius;
    if (maxRadius > 0 && lat && lng) {
      const circle = L.circle([lat, lng], { radius: maxRadius });
      map.fitBounds(circle.getBounds(), { padding: [30, 30] });
    }
  }, [lat, lng, radius, trackingRadius, map]);
  
  return null;
}

export default function MapComponent({ lat, lng, radius, trackingRadius, onLocationChange }: MapComponentProps) {
  return (
    <MapContainer 
      center={[lat, lng]} 
      zoom={16} 
      style={{ height: '100%', width: '100%', borderRadius: '8px', zIndex: 1 }}
    >
      <TileLayer
        attribution='&copy; Google Maps'
        url="https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}"
      />
      <LocationMarker lat={lat} lng={lng} onLocationChange={onLocationChange} />
      <MapBoundsFitter lat={lat} lng={lng} radius={radius} trackingRadius={trackingRadius} />
      <Circle center={[lat, lng]} radius={radius} pathOptions={{ color: '#ffb142', fillColor: '#ffb142', fillOpacity: 0.4, weight: 3 }} />
      {trackingRadius && trackingRadius > radius && (
        <Circle center={[lat, lng]} radius={trackingRadius} pathOptions={{ color: '#2ed573', fillColor: '#2ed573', fillOpacity: 0.15, weight: 3, dashArray: '8, 8' }} />
      )}
    </MapContainer>
  );
}
