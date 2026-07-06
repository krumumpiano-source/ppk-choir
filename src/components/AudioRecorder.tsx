'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Loader2, RotateCcw } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

export default function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onRecordingComplete(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('ไม่สามารถเข้าถึงไมโครโฟนได้ กรุณาตรวจสอบการอนุญาตสิทธิ์');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resetRecording = () => {
    setAudioUrl(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.5rem'
    }}>
      
      <div style={{ fontSize: '2.5rem', fontWeight: 300, color: isRecording ? 'var(--danger)' : 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
        {formatTime(recordingTime)}
      </div>

      {!audioUrl ? (
        <button
          onClick={isRecording ? stopRecording : startRecording}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: 'none',
            background: isRecording ? 'var(--danger)' : 'var(--accent-primary)',
            color: isRecording ? 'white' : '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: `0 8px 24px ${isRecording ? 'rgba(255,71,87,0.4)' : 'var(--accent-glow)'}`,
            transition: 'all 0.3s'
          }}
        >
          {isRecording ? <Square size={32} fill="currentColor" /> : <Mic size={36} />}
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
          <audio src={audioUrl} controls style={{ width: '100%' }} />
          <button 
            onClick={resetRecording}
            style={{
              background: 'transparent',
              border: '1px solid var(--text-secondary)',
              color: 'var(--text-secondary)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={16} /> อัดใหม่อีกครั้ง
          </button>
        </div>
      )}
      
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
        {isRecording ? 'กำลังบันทึกเสียง... กดปุ่มสี่เหลี่ยมเพื่อหยุด' : (!audioUrl ? 'กดไมโครโฟนเพื่อเริ่มอัดเสียง' : 'ตรวจสอบเสียงของคุณก่อนส่ง')}
      </p>

    </div>
  );
}
