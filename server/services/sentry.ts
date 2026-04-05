/**
 * SENTRY — Error tracking & performance monitoring
 *
 * Configuration minimale : seul SENTRY_DSN est requis.
 * Si absent, le module est un no-op silencieux.
 */

const SENTRY_DSN = process.env.SENTRY_DSN;

interface SentryLike {
  captureException: (err: unknown, context?: Record<string, any>) => void;
  captureMessage: (msg: string, level?: string) => void;
  setUser: (user: { id: string; email?: string } | null) => void;
}

// ── Stub si Sentry non configuré ─────────────────────────────────────────────

const noopSentry: SentryLike = {
  captureException: () => {},
  captureMessage: () => {},
  setUser: () => {},
};

let sentry: SentryLike = noopSentry;

export async function initSentry(): Promise<void> {
  if (!SENTRY_DSN) {
    console.log('[SENTRY] DSN non configuré — error tracking désactivé');
    return;
  }

  try {
    // Dynamic import pour ne pas crasher si @sentry/node n'est pas installé
    const Sentry = await import('@sentry/node');
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });

    sentry = {
      captureException: (err, context) => {
        Sentry.captureException(err, context ? { extra: context } : undefined);
      },
      captureMessage: (msg, level) => {
        Sentry.captureMessage(msg, level as any);
      },
      setUser: (user) => {
        Sentry.setUser(user);
      },
    };

    console.log('[SENTRY] Error tracking activé');
  } catch {
    console.log('[SENTRY] @sentry/node non installé — error tracking désactivé');
  }
}

export function captureException(err: unknown, context?: Record<string, any>): void {
  sentry.captureException(err, context);
  // Toujours logger en console aussi
  console.error('[ERROR]', err);
}

export function captureMessage(msg: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  sentry.captureMessage(msg, level);
}

export function setSentryUser(user: { id: string; email?: string } | null): void {
  sentry.setUser(user);
}
