import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
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

export async function uploadPracticeRecord(file: Blob, data: Omit<PracticeRecord, 'id' | 'timestamp' | 'audioUrl' | 'rubricScore' | 'likes'>) {
  try {
    const fileRef = ref(storage, `practices/${data.studentId}/${Date.now()}.webm`);
    await uploadBytes(fileRef, file);
    const audioUrl = await getDownloadURL(fileRef);

    const docRef = await addDoc(collection(db, 'practices'), {
      ...data,
      audioUrl,
      likes: 0,
      timestamp: serverTimestamp()
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error uploading practice record:', error);
    return { success: false, error };
  }
}

export async function getStudentPractices(studentId: string) {
  try {
    const q = query(collection(db, 'practices'), where('studentId', '==', studentId));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PracticeRecord[];
    return docs.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
  } catch (error) {
    console.error('Error getting student practices:', error);
    return [];
  }
}

export async function getPeerPractices(voiceType: VoiceType) {
  try {
    const q = query(collection(db, 'practices'), where('voiceType', '==', voiceType));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PracticeRecord[];
    return docs.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
  } catch (error) {
    console.error('Error getting peer practices:', error);
    return [];
  }
}

export async function getPendingAssessments() {
  try {
    const q = query(collection(db, 'practices'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const practices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PracticeRecord[];
    return practices.filter(p => !p.rubricScore);
  } catch (error) {
    console.error('Error getting pending assessments:', error);
    return [];
  }
}

export async function submitRubricScore(recordId: string, rubricScore: RubricScore) {
  try {
    const recordRef = doc(db, 'practices', recordId);
    await updateDoc(recordRef, { rubricScore });
    return { success: true };
  } catch (error) {
    console.error('Error submitting rubric score:', error);
    return { success: false, error };
  }
}

export async function likePracticeRecord(recordId: string, currentLikes: number) {
  try {
    const recordRef = doc(db, 'practices', recordId);
    await updateDoc(recordRef, { likes: currentLikes + 1 });
    return { success: true };
  } catch (error) {
    console.error('Error liking practice record:', error);
    return { success: false, error };
  }
}
