import React from 'react';

interface Props {
  url: string;
}

export default function GoogleDrivePlayer({ url }: Props) {
  // Extract file ID from various Google Drive URL formats
  const getDriveFileId = (link: string) => {
    try {
      if (!link.includes('drive.google.com')) return null;
      
      // format: https://drive.google.com/file/d/FILE_ID/view...
      const match1 = link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match1 && match1[1]) return match1[1];
      
      // format: https://drive.google.com/open?id=FILE_ID
      const urlObj = new URL(link);
      const id = urlObj.searchParams.get('id');
      if (id) return id;
      
      return null;
    } catch (e) {
      return null;
    }
  };

  const fileId = getDriveFileId(url);

  if (fileId) {
    const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    return (
      <div style={{ width: '100%', height: '150px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(0,0,0,0.1)' }}>
        <iframe 
          src={embedUrl} 
          width="100%" 
          height="100%" 
          allow="autoplay"
          style={{ border: 'none' }}
          title="Google Drive Player"
        />
      </div>
    );
  }

  // Fallback for old Firebase Storage URLs (backward compatibility)
  return (
    <audio controls src={url} style={{ width: '100%' }}>
      เบราว์เซอร์ของคุณไม่รองรับการเล่นเสียง
    </audio>
  );
}
