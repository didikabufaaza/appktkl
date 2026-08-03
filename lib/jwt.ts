import { SignJWT, jwtVerify } from 'jose';
import { UserSession } from '@/types/nakes';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ktkl-rsud-super-secret-key-2026'
);

export async function signJWT(payload: UserSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<UserSession | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as UserSession;
  } catch (err) {
    return null;
  }
}
