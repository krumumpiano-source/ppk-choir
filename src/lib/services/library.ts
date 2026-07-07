import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

// Support both legacy VoiceTypes and detailed detailed Choir sections
export type VoiceType = 
  | 'Soprano 1' | 'Soprano 2' | 'Alto 1' | 'Alto 2' 
  | 'Tenor 1' | 'Tenor 2' | 'Baritone' | 'Bass' 
  | 'Soprano' | 'Alto' | 'Tenor'; // Legacy for backward compatibility

export interface LibraryItem {
  id?: string;
  voiceType: VoiceType;
  title: string;
  fileUrl: string;
  uploadedAt?: any;
}

export async function saveLibraryItemLink(fileUrl: string, voiceType: VoiceType, title: string) {
  try {
    const docRef = await addDoc(collection(db, 'library'), {
      voiceType,
      title,
      fileUrl,
      uploadedAt: serverTimestamp()
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving library item link:', error);
    return { success: false, error };
  }
}

export async function getLibraryItems(voiceType: string) {
  try {
    let q;
    if (voiceType === 'All') {
      q = query(collection(db, 'library'));
    } else {
      q = query(
        collection(db, 'library'),
        where('voiceType', '==', voiceType)
      );
    }
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LibraryItem[];
    return docs.sort((a, b) => (b.uploadedAt?.toMillis?.() || 0) - (a.uploadedAt?.toMillis?.() || 0));
  } catch (error) {
    console.error('Error getting library items:', error);
    return [];
  }
}
