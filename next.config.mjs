import { execSync } from 'node:child_process';

// Build ID ต้องคงที่ตลอดการ build เดียวกัน (ทั้ง client bundle และ edge function)
// เดิมใช้ Date.now() ซึ่งถูกคำนวณหลายครั้งในแต่ละ compile pass ทำให้ค่าไม่ตรงกัน
// จึงเกิดแบนเนอร์ "มีเวอร์ชันใหม่" ซ้ำตลอดแม้อัปเดตแล้ว
function resolveBuildId() {
  const fromEnv =
    process.env.CF_PAGES_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA;
  if (fromEnv) return fromEnv.slice(0, 12);
  try {
    return execSync('git rev-parse --short=12 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_APP_BUILD_ID: resolveBuildId(),
  }
};

export default nextConfig;
