import { RequestHandler } from 'express';
import { verifyToken, extractTokenFromHeader } from '../services/auth';

/**
 * Middleware to verify JWT token
 * Sets req.admin if token is valid
 */
export const authMiddleware: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    // No token required for public routes, but available for protected routes
    (req as any).admin = null;
    return next();
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    });
  }

  (req as any).admin = {
    userId: decoded.userId,
    role: decoded.role,
  };

  next();
};

/**
 * Middleware to require authentication
 * Returns 401 if no valid token
 */
export const requireAuth: RequestHandler = (req, res, next) => {
  const admin = (req as any).admin;
  if (!admin) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'NOT_AUTHENTICATED',
    });
  }
  next();
};

/**
 * Middleware to require owner role
 */
export const requireOwner: RequestHandler = (req, res, next) => {
  const admin = (req as any).admin;
  if (!admin || admin.role !== 'owner') {
    return res.status(403).json({
      error: 'Owner access required',
      code: 'INSUFFICIENT_PERMISSION',
    });
  }
  next();
};

/**
 * Middleware to require admin role
 */
export const requireAdmin: RequestHandler = (req, res, next) => {
  const admin = (req as any).admin;
  if (!admin || (admin.role !== 'admin' && admin.role !== 'owner')) {
    return res.status(403).json({
      error: 'Admin access required',
      code: 'INSUFFICIENT_PERMISSION',
    });
  }
  next();
};
