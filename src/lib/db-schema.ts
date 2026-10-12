// Database Schema Migration & Initialization for PPK CHOIR
// Runs safely on Cloudflare D1 (SQLite) with zero data loss

export async function ensureSystemTables(db: any) {
  try {
    // 1. Table for Student Leave Requests
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS leaves (
        id TEXT PRIMARY KEY,
        studentId TEXT NOT NULL,
        studentName TEXT NOT NULL,
        leaveDate TEXT NOT NULL,
        sessionId TEXT,
        sessionName TEXT,
        leaveType TEXT NOT NULL,
        reason TEXT NOT NULL,
        attachmentUrl TEXT,
        status TEXT DEFAULT 'pending',
        adminComment TEXT,
        approvedBy TEXT,
        approvedAt DATETIME,
        deviceId TEXT,
        deviceModel TEXT,
        ipAddress TEXT,
        isSuspicious INTEGER DEFAULT 0,
        deviceNote TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(studentId) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();

    // 2. Table for Registered Devices (Device Binding)
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS user_devices (
        id TEXT PRIMARY KEY,
        studentId TEXT NOT NULL,
        studentName TEXT,
        deviceId TEXT NOT NULL,
        deviceModel TEXT,
        userAgent TEXT,
        lastIp TEXT,
        firstSeenAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        lastSeenAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 3. Add Device Tracking columns to 'checkins' safely if not yet present
    const tableInfo = await db.prepare("PRAGMA table_info(checkins)").all();
    const existingCols = new Set((tableInfo.results || []).map((col: any) => col.name));

    if (!existingCols.has('deviceId')) {
      try { await db.prepare("ALTER TABLE checkins ADD COLUMN deviceId TEXT").run(); } catch {}
    }
    if (!existingCols.has('deviceModel')) {
      try { await db.prepare("ALTER TABLE checkins ADD COLUMN deviceModel TEXT").run(); } catch {}
    }
    if (!existingCols.has('ipAddress')) {
      try { await db.prepare("ALTER TABLE checkins ADD COLUMN ipAddress TEXT").run(); } catch {}
    }
    if (!existingCols.has('isSuspicious')) {
      try { await db.prepare("ALTER TABLE checkins ADD COLUMN isSuspicious INTEGER DEFAULT 0").run(); } catch {}
    }
    if (!existingCols.has('deviceNote')) {
      try { await db.prepare("ALTER TABLE checkins ADD COLUMN deviceNote TEXT").run(); } catch {}
    }

  } catch (error) {
    console.error('Error ensuring system tables:', error);
  }
}
