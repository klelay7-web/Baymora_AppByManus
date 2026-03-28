/**
 * Rate limiter simple en mémoire (sans dépendance externe)
 * Phase 2 : remplacer par Redis-backed rate limiter
 */

import type { RequestHandler } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Nettoyage toutes les 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  windowMs: number;   // Fenêtre en ms
  max: number;        // Nb max de requêtes dans la fenêtre
  message?: string;
}

export function createRateLimit(options: RateLimitOptions): RequestHandler {
  const { windowMs, max, message = 'Trop de requêtes, veuillez réessayer plus tard' } = options;

  return (req, res, next) => {
    // Identifier par IP (ou userId si authentifié)
    const baymoraUser = (req as any).baymoraUser;
    const key = baymoraUser?.id || req.ip || 'unknown';
    const now = Date.now();

    const entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.status(429).json({ error: message, code: 'RATE_LIMITED', retryAfter });
      return;
    }

    next();
  };
}

// ── Limiteurs pré-configurés ───────────────────────────────────────────────────

/** Chat : 30 messages par minute par utilisateur */
export const chatRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Vous envoyez trop de messages. Attendez une minute.',
});

/** Auth : 5 tentatives de login par 15 minutes */
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
});

/** API générale : 200 requêtes par minute */
export const apiRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: 200,
});
