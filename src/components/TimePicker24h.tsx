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
        className="input-field"
        style={{ padding: '0.75rem 0.5rem', width: '70px', marginBottom: 0 }}
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
        className="input-field"
        style={{ padding: '0.75rem 0.5rem', width: '70px', marginBottom: 0 }}
      >
        {Array.from({length: 60}).map((_, i) => { // Changed to every minute for more flexibility
          const val = String(i).padStart(2, '0');
          return <option key={val} value={val}>{val}</option>;
        })}
      </select>
    </div>
  );
}
