// Server-side Device Verification & Anti-cheat Binding for PPK CHOIR

export async function verifyAndRegisterDevice(
  db: any,
  studentId: string,
  studentName: string,
  deviceId?: string | null,
  deviceModel?: string | null,
  userAgent?: string | null,
  clientIp?: string | null
): Promise<{ isSuspicious: number; deviceNote: string | null }> {
  if (!deviceId || !deviceId.trim()) {
    return { isSuspicious: 0, deviceNote: null };
  }

  const cleanDeviceId = deviceId.trim();
  let isSuspicious = 0;
  let deviceNote: string | null = null;

  try {
    // 1. Check if this device is already bound to any other student
    const otherUsers = await db.prepare(`
      SELECT studentId, studentName 
      FROM user_devices 
      WHERE deviceId = ? AND studentId != ?
      LIMIT 3
    `).bind(cleanDeviceId, studentId).all<any>();

    if (otherUsers.results && otherUsers.results.length > 0) {
      isSuspicious = 1;
      const names = otherUsers.results.map((r: any) => r.studentName || r.studentId).join(', ');
      deviceNote = `⚠️ เครื่องนี้เคยใช้งานโดย: ${names}`;
    }

    // 2. Register or update this device for the current student
    const existing = await db.prepare(`
      SELECT id FROM user_devices WHERE studentId = ? AND deviceId = ?
    `).bind(studentId, cleanDeviceId).first<any>();

    if (existing) {
      await db.prepare(`
        UPDATE user_devices 
        SET lastSeenAt = CURRENT_TIMESTAMP, 
            lastIp = COALESCE(?, lastIp), 
            deviceModel = COALESCE(?, deviceModel)
        WHERE id = ?
      `).bind(clientIp || null, deviceModel || null, existing.id).run();
    } else {
      const id = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO user_devices (id, studentId, studentName, deviceId, deviceModel, userAgent, lastIp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, 
        studentId, 
        studentName, 
        cleanDeviceId, 
        deviceModel || 'Unknown', 
        userAgent || '', 
        clientIp || ''
      ).run();
    }
  } catch (error) {
    console.error('Error in verifyAndRegisterDevice:', error);
  }

  return { isSuspicious, deviceNote };
}
