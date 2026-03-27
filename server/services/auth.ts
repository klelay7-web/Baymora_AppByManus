import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// NOTE: In production, use bcryptjs package:
// import bcryptjs from 'bcryptjs';
// But for starter, we'll use crypto-based hashing for demo purposes

/**
 * Generate bcrypt-like hash (simplified for starter template)
 * In production: use bcryptjs.hash() with cost factor 12
 */
export async function hashPassword(password: string): Promise<string> {
  // Production: return bcryptjs.hash(password, 12);
  
  // Starter implementation using crypto (NOT for production)
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  // Production: return bcryptjs.compare(password, hash);
  
  // Starter implementation
  const [salt, storedHash] = hash.split(':');
  const derivedHash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');
  return derivedHash === storedHash;
}

/**
 * Generate JWT token for admin/owner access
 */
export function generateToken(
  userId: string,
  role: 'admin' | 'owner',
  expiresIn: string = '24h'
): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error(
      'JWT_SECRET must be set and at least 32 characters long'
    );
  }

  return jwt.sign(
    {
      userId,
      role,
      iat: Math.floor(Date.now() / 1000),
    },
    jwtSecret,
    { expiresIn, algorithm: 'HS256' }
  );
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): { userId: string; role: string } | null {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    if (typeof decoded === 'object' && 'userId' in decoded && 'role' in decoded) {
      return { userId: decoded.userId as string, role: decoded.role as string };
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return null;
}

/**
 * Generate secure access code for concierge (32 chars)
 */
export function generateAccessCode(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Hash access code for storage
 */
export function hashAccessCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Verify access code
 */
export function verifyAccessCode(code: string, hash: string): boolean {
  return hashAccessCode(code) === hash;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Rate limit check for login attempts
 * Returns true if request should be allowed
 */
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

export function checkLoginRateLimit(identifier: string): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt) {
    loginAttempts.set(identifier, { count: 1, resetTime: now + 15 * 60 * 1000 });
    return true;
  }

  if (now > attempt.resetTime) {
    loginAttempts.set(identifier, { count: 1, resetTime: now + 15 * 60 * 1000 });
    return true;
  }

  if (attempt.count >= 5) {
    return false;
  }

  attempt.count++;
  return true;
}

/**
 * Clear login rate limit for identifier
 */
export function clearLoginRateLimit(identifier: string): void {
  loginAttempts.delete(identifier);
}
