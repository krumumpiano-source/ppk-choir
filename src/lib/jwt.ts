import { SignJWT, jwtVerify } from 'jose';
import { getJwtSecret } from './db';

const alg = 'HS256';

export async function signToken(payload: any) {
  const secret = new TextEncoder().encode(getJwtSecret());
  return await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(getJwtSecret());
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

const PBKDF2_ITERATIONS = 100000; // Cloudflare Workers maximum
const PBKDF2_PREFIX = 'pbkdf2';

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

const fromHex = (hex: string) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
};

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    key,
    256
  );
  return toHex(bits);
}

async function legacySha256(password: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return toHex(hashBuffer);
}

// Format: pbkdf2$<iterations>$<saltHex>$<hashHex>
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `${PBKDF2_PREFIX}$${PBKDF2_ITERATIONS}$${toHex(salt)}$${hash}`;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  if (stored.startsWith(`${PBKDF2_PREFIX}$`)) {
    const [, iterStr, saltHex, hashHex] = stored.split('$');
    const iterations = parseInt(iterStr, 10);
    if (!iterations || !saltHex || !hashHex) return false;
    const computed = await pbkdf2(password, fromHex(saltHex), iterations);
    return timingSafeEqual(computed, hashHex);
  }
  // Legacy unsalted SHA-256 hash (upgraded on next successful login)
  return timingSafeEqual(await legacySha256(password), stored);
}

export function needsRehash(stored: string): boolean {
  return !stored.startsWith(`${PBKDF2_PREFIX}$`);
}
