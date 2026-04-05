import { Router, RequestHandler, Request, Response } from 'express';
import { LoginRequestSchema, AuthTokenSchema } from '../../shared/api';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  validatePasswordStrength,
  checkLoginRateLimit,
  clearLoginRateLimit,
} from '../services/auth';

const router = Router();

// In-memory store for demo (replace with database in production)
const adminUsers = new Map<
  string,
  {
    id: string;
    email: string;
    passwordHash: string;
    role: 'admin' | 'owner';
  }
>();

// Initialize default owner (hash pre-computed for demo)
// In production: Initialize from database with proper hash
function initializeDefaultOwner() {
  const defaultEmail = process.env.ADMIN_EMAIL || 'owner@baymora.com';
  // This is a DEMO password - in production, use environment variable with pre-hashed value
  const demoPasswordHash =
    '7f5a8d9c2e1b4a6f:8a9c3d7e2f1a5b8c9d0e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a';

  if (!adminUsers.has(defaultEmail)) {
    adminUsers.set(defaultEmail, {
      id: 'owner-001',
      email: defaultEmail,
      passwordHash: demoPasswordHash,
      role: 'owner',
    });
  }
}

initializeDefaultOwner();

/**
 * POST /api/auth/owner-login
 * Admin/Owner login endpoint
 */
export const handleOwnerLogin: RequestHandler = async (req: Request, res: Response) => {
  try {
    const input = LoginRequestSchema.parse(req.body);
    const { email, password } = input;

    // Rate limit check
    const identifier = email;
    if (!checkLoginRateLimit(identifier)) {
      res.status(429).json({
        error: 'Too many login attempts. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
      });
      return;
    }

    // Find admin user
    const adminUser = adminUsers.get(email);
    if (!adminUser) {
      res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    // Verify password
    const isValid = await verifyPassword(password, adminUser.passwordHash);
    if (!isValid) {
      res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    // Generate token
    const accessToken = generateToken(adminUser.id, adminUser.role);
    clearLoginRateLimit(identifier);

    // Log audit entry
    console.log(`[AUDIT] Admin login: ${email}, role: ${adminUser.role}`);

    const response = AuthTokenSchema.parse({
      accessToken,
      expiresIn: 86400, // 24 hours in seconds
      tokenType: 'Bearer',
    });

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Login error:', error.message);
    }
    res.status(400).json({
      error: 'Invalid request',
      code: 'VALIDATION_ERROR',
    });
  }
};

/**
 * POST /api/auth/verify
 * Verify current session token
 */
export const handleVerifyToken: RequestHandler = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      res.status(401).json({
        error: 'No token provided',
        code: 'NO_TOKEN',
      });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    res.status(200).json({
      userId: decoded.userId,
      role: decoded.role,
      valid: true,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Verification failed',
      code: 'SERVER_ERROR',
    });
  }
};

/**
 * POST /api/auth/logout
 * Logout (client-side token deletion)
 */
export const handleLogout: RequestHandler = async (req: Request, res: Response) => {
  // In production, invalidate token in database/cache
  res.status(200).json({
    message: 'Logged out successfully',
  });
};

/**
 * POST /api/auth/owner/grant-access
 * Owner grants complementary/free access to user
 * Protected by token verification
 */
export const handleGrantAccess: RequestHandler = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        code: 'NO_TOKEN',
      });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'owner') {
      res.status(403).json({
        error: 'Only owners can grant access',
        code: 'INSUFFICIENT_PERMISSION',
      });
      return;
    }

    const { userId, planId, planTier, durationDays } = req.body;

    if (!userId || !planTier) {
      res.status(400).json({
        error: 'Missing required fields: userId, planTier',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Log audit entry
    console.log(
      `[AUDIT] Owner ${decoded.userId} granted access to user ${userId}, plan: ${planTier}, duration: ${durationDays || 'permanent'}`
    );

    // In production: Update user's subscription in database
    res.status(200).json({
      message: 'Access granted successfully',
      userId,
      planTier,
      grantedBy: decoded.userId,
      grantedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to grant access',
      code: 'SERVER_ERROR',
    });
  }
};

// Register routes
router.post("/owner-login", handleOwnerLogin);
router.get("/verify", handleVerifyToken);
router.post("/logout", handleLogout);
router.post("/owner/grant-access", handleGrantAccess);

export default router;
