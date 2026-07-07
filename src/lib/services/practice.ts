import { VoiceType } from './library';

export interface RubricScore {
  pitch: number;      
  rhythm: number;     
  technique: number;  
  feedback: string;   
}

export interface PracticeRecord {
  id?: string;
  studentId: string;
  studentName: string;
  voiceType: VoiceType;
  audioUrl: string;
  reflection: string;       
  rubricScore?: RubricScore; 
  likes: number;            
  timestamp?: any;
}

export async function submitPracticeLink(driveUrl: string, data: Omit<PracticeRecord, 'id' | 'timestamp' | 'audioUrl' | 'rubricScore' | 'likes'>) {
  try {
    const res = await fetch('/api/practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, audioUrl: driveUrl })
    });
    const result = (await res.json()) as any;
    if (!res.ok || !result.success) {
      return { success: false, error: result.error || 'Failed to submit' };
    }
    return { success: true, id: result.id };
  } catch (error) {
    console.error('Error submitting practice record:', error);
    return { success: false, error };
  }
}

export async function getStudentPractices(studentId: string) {
  try {
    const res = await fetch(`/api/practice?studentId=${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = (await res.json()) as any;
    // Parse rubricScore if exists (since SQLite stores JSON as text)
    return data.practices.map((p: any) => ({
      ...p,
      rubricScore: p.rubricScore ? JSON.parse(p.rubricScore) : undefined
    })) as PracticeRecord[];
  } catch (error) {
    console.error('Error getting student practices:', error);
    return [];
  }
}

export async function getPeerPractices(voiceType: VoiceType) {
  try {
    const res = await fetch('/api/practice');
    if (!res.ok) throw new Error('Failed to fetch');
    const data = (await res.json()) as any;
    let practices = data.practices.map((p: any) => ({
      ...p,
      rubricScore: p.rubricScore ? JSON.parse(p.rubricScore) : undefined
    })) as PracticeRecord[];
    
    if (voiceType !== 'All') {
      practices = practices.filter((p: any) => p.voiceType === voiceType);
    }
    return practices;
  } catch (error) {
    console.error('Error getting peer practices:', error);
    return [];
  }
}

export async function getPendingAssessments() {
  try {
    const res = await fetch('/api/practice');
    if (!res.ok) throw new Error('Failed to fetch');
    const data = (await res.json()) as any;
    const practices = data.practices.map((p: any) => ({
      ...p,
      rubricScore: p.rubricScore ? JSON.parse(p.rubricScore) : undefined
    })) as PracticeRecord[];
    return practices.filter((p: any) => !p.rubricScore);
  } catch (error) {
    console.error('Error getting pending assessments:', error);
    return [];
  }
}

export async function submitRubricScore(recordId: string, rubricScore: RubricScore) {
  try {
    const res = await fetch(`/api/practice/${recordId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rubricScore, feedback: rubricScore.feedback })
    });
    const result = (await res.json()) as any;
    if (!res.ok || !result.success) return { success: false, error: result.error };
    return { success: true };
  } catch (error) {
    console.error('Error submitting rubric score:', error);
    return { success: false, error };
  }
}

export async function likePracticeRecord(recordId: string, currentLikes: number) {
  try {
    const res = await fetch(`/api/practice/${recordId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'like' })
    });
    const result = (await res.json()) as any;
    if (!res.ok || !result.success) return { success: false, error: result.error };
    return { success: true };
  } catch (error) {
    console.error('Error liking practice record:', error);
    return { success: false, error };
  }
}
