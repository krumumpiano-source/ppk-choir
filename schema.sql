-- users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  studentId TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  passwordHash TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  voiceType TEXT,
  section TEXT,
  profileUrl TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- library table
CREATE TABLE IF NOT EXISTS library (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  voiceType TEXT NOT NULL,
  fileUrl TEXT NOT NULL,
  uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- practices table
CREATE TABLE IF NOT EXISTS practices (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  studentName TEXT NOT NULL,
  voiceType TEXT,
  audioUrl TEXT NOT NULL,
  reflection TEXT,
  rubricScore TEXT, -- JSON string for complex rubric scores
  feedback TEXT,
  likes INTEGER DEFAULT 0,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(studentId) REFERENCES users(id) ON DELETE CASCADE
);

-- checkins table
CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  studentName TEXT NOT NULL,
  voiceType TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(studentId) REFERENCES users(id) ON DELETE CASCADE
);

-- gamification table
CREATE TABLE IF NOT EXISTS gamification (
  studentId TEXT PRIMARY KEY,
  streak INTEGER DEFAULT 0,
  lastPracticeDate TEXT,
  badges TEXT, -- JSON string for badges array
  FOREIGN KEY(studentId) REFERENCES users(id) ON DELETE CASCADE
);

-- sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  targetGroups TEXT,
  location TEXT,
  startTime DATETIME,
  endTime DATETIME,
  isActive BOOLEAN DEFAULT 1,
  isRecurring BOOLEAN DEFAULT 0,
  daysOfWeek TEXT,
  recurringStartTime TEXT,
  recurringEndTime TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- settings table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  data TEXT
);

