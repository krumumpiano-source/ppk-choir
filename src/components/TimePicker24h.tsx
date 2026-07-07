'use client';
import React from 'react';

interface Props {
  value: string; // "HH:mm"
  onChange: (val: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function TimePicker24h({ value, onChange, className, style }: Props) {
  const [h, m] = (value || '00:00').split(':');

  const handleHour = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(`${e.target.value}:${m}`);
  };

  const handleMin = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(`${h}:${e.target.value}`);
  };

  return (
    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', ...style }} className={className}>
      <select 
        value={h} 
        onChange={handleHour} 
        style={{ padding: '0.75rem 0.5rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', border: '1px solid rgba(255, 255, 255, 0.2)', outline: 'none' }}
      >
        {Array.from({length: 24}).map((_, i) => {
          const val = String(i).padStart(2, '0');
          return <option key={val} value={val}>{val}</option>;
        })}
      </select>
      <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>:</span>
      <select 
        value={m} 
        onChange={handleMin} 
        style={{ padding: '0.75rem 0.5rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', border: '1px solid rgba(255, 255, 255, 0.2)', outline: 'none' }}
      >
        {Array.from({length: 12}).map((_, i) => { // intervals of 5 minutes are usually better, but let's do every minute just in case. Or maybe just every minute.
          const val = String(i * 5).padStart(2, '0');
          return <option key={val} value={val}>{val}</option>;
        })}
      </select>
    </div>
  );
}
