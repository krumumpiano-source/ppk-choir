import { NextResponse } from 'next/server';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    if (!file || !path) {
      return NextResponse.json({ error: 'Missing file or path' }, { status: 400 });
    }

    // Convert file to ArrayBuffer for uploading in Node.js
    const buffer = await file.arrayBuffer();
    const fileRef = ref(storage, path);
    
    // Upload bytes directly from Server
    await uploadBytes(fileRef, buffer, { contentType: file.type });
    const url = await getDownloadURL(fileRef);

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
