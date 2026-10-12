// Client-side Device Identification Helper for PPK CHOIR

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let deviceId = localStorage.getItem('ppk_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID ? crypto.randomUUID() : 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('ppk_device_id', deviceId);
    }
    return deviceId;
  } catch (e) {
    return 'fallback_' + Math.random().toString(36).substring(2, 10);
  }
}

export function getDeviceModel(): string {
  if (typeof window === 'undefined') return 'Unknown';
  try {
    const ua = navigator.userAgent || '';
    let isPwa = false;
    try {
      isPwa = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    } catch {}

    const isLine = /Line\//i.test(ua);
    let extraApp = isPwa ? ' [PWA]' : isLine ? ' [LINE]' : '';

    // iOS detection
    if (/iPad|iPhone|iPod/.test(ua)) {
      const match = ua.match(/OS (\d+[._]\d+)/);
      const version = match ? match[1].replace('_', '.') : '';
      const device = /iPad/.test(ua) ? 'iPad' : 'iPhone';
      return `${device}${version ? ` (iOS ${version})` : ''}${extraApp}`;
    }

    // Android detection
    if (/Android/i.test(ua)) {
      // Try to find model name
      let model = '';
      const matchModel = ua.match(/;\s*([^;)]+)\s*Build\//i);
      if (matchModel && matchModel[1]) {
        model = matchModel[1].trim();
      }
      const matchVer = ua.match(/Android\s*([0-9.]+)/i);
      const version = matchVer ? matchVer[1] : '';
      return `${model || 'Android'}${version ? ` (Android ${version})` : ''}${extraApp}`;
    }

    // Desktop
    if (/Macintosh|Mac OS X/i.test(ua)) return `MacBook/Mac${extraApp}`;
    if (/Windows/i.test(ua)) return `Windows PC${extraApp}`;
    if (/Linux/i.test(ua)) return `Linux PC${extraApp}`;

    return `Mobile Web${extraApp}`;
  } catch (e) {
    return 'Web Browser';
  }
}

export function getClientDeviceInfo() {
  return {
    deviceId: getDeviceId(),
    deviceModel: getDeviceModel(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
  };
}
