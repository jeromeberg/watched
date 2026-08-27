interface User {
  id: number;
  username: string;
}

export interface JwtPayload {
  sub: number;
  username: string;
  exp?: number;
}

/** Decode one JWT payload with URL-safe base64 and UTF-8 support. */
export function decodeJwtPayload(token: string): unknown {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1] || !/^[A-Za-z0-9_-]+$/.test(parts[1])) {
    throw new Error('Malformed token');
  }

  const remainder = parts[1].length % 4;
  if (remainder === 1) throw new Error('Malformed token');
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - remainder) % 4);
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** Validate identity fields and the optional Unix expiry in one JWT payload. */
export function userFromToken(token: string, now = Date.now()): User | null {
  try {
    const payload = decodeJwtPayload(token);
    if (typeof payload !== 'object' || payload === null) return null;

    const { sub, username, exp } = payload as Partial<JwtPayload>;
    if (!Number.isInteger(sub) || (sub ?? 0) <= 0) return null;
    if (typeof username !== 'string' || !username.trim()) return null;
    if (exp !== undefined && (!Number.isFinite(exp) || exp <= now / 1000)) return null;

    return { id: sub as number, username };
  } catch {
    return null;
  }
}
