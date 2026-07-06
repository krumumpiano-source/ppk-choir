import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

export type VoiceType = 'Soprano' | 'Alto' | 'Tenor' | 'Bass';

export interface LibraryItem {
  id?: string;
  voiceType: VoiceType;
  title: string;
  fileUrl: string;
  uploadedAt?: any;
}

export async function uploadLibraryItem(file: File, voiceType: VoiceType, title: string) {
  try {
    const fileRef = ref(storage, `library/${voiceType}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const fileUrl = await getDownloadURL(fileRef);

    const docRef = await addDoc(collection(db, 'library'), {
      voiceType,
      title,
      fileUrl,
      uploadedAt: serverTimestamp()
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error uploading library item:', error);
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
