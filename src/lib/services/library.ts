export type VoiceType = 'Soprano' | 'Alto' | 'Tenor' | 'Bass' | 'All' | 'Soprano 1' | 'Soprano 2' | 'Alto 1' | 'Alto 2' | 'Tenor 1' | 'Tenor 2' | 'Baritone';

export interface LibraryItem {
  id: string;
  title: string;
  voiceType: VoiceType;
  fileUrl: string; // Used for Google Drive link
  uploadedAt: string;
}

export async function getLibraryItems(voiceType: VoiceType = 'All'): Promise<LibraryItem[]> {
  try {
    const res = await fetch(`/api/library?voiceType=${encodeURIComponent(voiceType)}`);
    if (!res.ok) throw new Error('Failed to fetch library items');
    const data = (await res.json()) as any;
    return data.items;
  } catch (error) {
    console.error("Error fetching library items:", error);
    return [];
  }
}

export async function saveLibraryItemLink(title: string, voiceType: VoiceType, fileUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, voiceType, fileUrl })
    });
    const data = (await res.json()) as any;
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to save item' };
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error saving library item:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteLibraryItem(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/library/${id}`, { method: 'DELETE' });
    const data = (await res.json()) as any;
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to delete item' };
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting library item:", error);
    return { success: false, error: error.message };
  }
}
