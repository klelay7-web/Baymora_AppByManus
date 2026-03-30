/**
 * CREDIT SERVICE — Baymora
 *
 * Gestion centralisée des crédits :
 * - Vérification de solde (user + guest)
 * - Décompte après chaque action
 * - Rollover mensuel (crédits non utilisés s'additionnent, cap 3x)
 * - Déblocages ponctuels (3 paliers : 9.90€ / 15.90€ / 19.90€)
 * - Packs de crédits supplémentaires
 */

import { prisma } from '../db';
import { PLANS, CREDIT_COSTS, CREDIT_PACKS, CREDIT_PACKS_BY_PLAN, UNLOCK_TIERS, ROLLOVER_MAX_MULTIPLIER, getPacksForPlan, type BaymoraCircle } from '../types';
import crypto from 'crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreditCheck {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
  /** Si bloqué, raison pour le client */
  reason?: 'credits_exhausted' | 'perplexity_exhausted' | 'upgrade_required';
  /** Info pour l'UI de conversion */
  upgradeOptions?: {
    nextPlan?: BaymoraCircle;
    nextPlanPrice?: number;
    unlockTiers?: typeof UNLOCK_TIERS;   // 3 paliers de déblocage
    creditPacks?: typeof CREDIT_PACKS;
    /** Message incitant à l'abonnement */
    subscriptionHint?: string;
  };
}

export interface CreditDeduction {
  model: 'opus' | 'sonnet' | 'fallback';
  usedPerplexity: boolean;
  totalCost: number;
}

// ─── Guest fingerprinting ────────────────────────────────────────────────────

export function buildGuestFingerprint(ip: string, userAgent: string): string {
  return crypto.createHash('sha256').update(`${ip}::${userAgent}`).digest('hex').substring(0, 64);
}

// ─── Vérification crédits (user authentifié) ─────────────────────────────────

export async function checkUserCredits(userId: string): Promise<CreditCheck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditsUsed: true, creditsLimit: true, creditsResetAt: true, circle: true },
  });

  if (!user) {
    return { allowed: false, remaining: 0, limit: 0, used: 0, reason: 'credits_exhausted' };
  }

  // Reset mensuel automatique
  await maybeResetUserCredits(userId, user.creditsResetAt);

  const freshUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditsUsed: true, creditsLimit: true, circle: true },
  });
  if (!freshUser) {
    return { allowed: false, remaining: 0, limit: 0, used: 0, reason: 'credits_exhausted' };
  }

  const remaining = freshUser.creditsLimit - freshUser.creditsUsed;
  const allowed = remaining > 0;

  const result: CreditCheck = {
    allowed,
    remaining,
    limit: freshUser.creditsLimit,
    used: freshUser.creditsUsed,
  };

  if (!allowed) {
    result.reason = 'credits_exhausted';
    const circle = freshUser.circle as BaymoraCircle;
    const nextPlan = getNextPlan(circle);
    result.upgradeOptions = {
      unlockTiers: UNLOCK_TIERS,
      creditPacks: CREDIT_PACKS,
    };
    if (nextPlan) {
      result.upgradeOptions.nextPlan = nextPlan;
      result.upgradeOptions.nextPlanPrice = PLANS[nextPlan].priceEurCents;
      // Hint : montrer que l'abonnement est bien plus avantageux que le déblocage
      const plan = PLANS[nextPlan];
      result.upgradeOptions.subscriptionHint =
        `${plan.creditsLimit} crédits/mois pour ${(plan.priceEurCents / 100).toFixed(2).replace('.', ',')} €/mois — et vos crédits non utilisés s'accumulent !`;
    }
  }

  return result;
}

// ─── Vérification Perplexity (user authentifié) ──────────────────────────────

export async function checkUserPerplexity(userId: string): Promise<CreditCheck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { perplexityUsed: true, perplexityLimit: true, circle: true },
  });

  if (!user) {
    return { allowed: false, remaining: 0, limit: 0, used: 0, reason: 'perplexity_exhausted' };
  }

  // -1 = illimité
  if (user.perplexityLimit === -1) {
    return { allowed: true, remaining: 9999, limit: -1, used: user.perplexityUsed };
  }

  const remaining = user.perplexityLimit - user.perplexityUsed;
  return {
    allowed: remaining > 0,
    remaining,
    limit: user.perplexityLimit,
    used: user.perplexityUsed,
    reason: remaining <= 0 ? 'perplexity_exhausted' : undefined,
  };
}

// ─── Vérification crédits (guest) ────────────────────────────────────────────

export async function checkGuestCredits(fingerprint: string): Promise<CreditCheck> {
  let session = await prisma.guestSession.findUnique({ where: { fingerprint } });

  if (!session) {
    // Créer la session guest
    session = await prisma.guestSession.create({
      data: {
        fingerprint,
        creditsUsed: 0,
        creditsLimit: PLANS.decouverte.creditsLimit,
        perplexityUsed: 0,
        perplexityLimit: PLANS.decouverte.perplexityLimit,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      },
    });
  }

  // Session expirée → reset
  if (session.expiresAt < new Date()) {
    session = await prisma.guestSession.update({
      where: { fingerprint },
      data: {
        creditsUsed: 0,
        perplexityUsed: 0,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  const remaining = session.creditsLimit - session.creditsUsed;
  const allowed = remaining > 0;

  return {
    allowed,
    remaining,
    limit: session.creditsLimit,
    used: session.creditsUsed,
    reason: allowed ? undefined : 'credits_exhausted',
    upgradeOptions: allowed ? undefined : {
      unlockTiers: UNLOCK_TIERS,
      creditPacks: CREDIT_PACKS,
      nextPlan: 'voyageur',
      nextPlanPrice: PLANS.voyageur.priceEurCents,
      subscriptionHint: `100 crédits/mois pour 9,90 €/mois — vos crédits non utilisés s'accumulent d'un mois sur l'autre !`,
    },
  };
}

export async function checkGuestPerplexity(fingerprint: string): Promise<CreditCheck> {
  const session = await prisma.guestSession.findUnique({ where: { fingerprint } });
  if (!session) {
    return { allowed: true, remaining: 3, limit: 3, used: 0 };
  }

  const remaining = session.perplexityLimit - session.perplexityUsed;
  return {
    allowed: remaining > 0,
    remaining,
    limit: session.perplexityLimit,
    used: session.perplexityUsed,
    reason: remaining <= 0 ? 'perplexity_exhausted' : undefined,
  };
}

// ─── Décompte après action ───────────────────────────────────────────────────

export async function deductUserCredits(userId: string, deduction: CreditDeduction): Promise<void> {
  const creditCost = deduction.totalCost;

  const updates: Record<string, any> = {
    creditsUsed: { increment: creditCost },
    messagesUsed: { increment: 1 }, // legacy
  };

  if (deduction.usedPerplexity) {
    updates.perplexityUsed = { increment: 1 };
  }

  await prisma.user.update({
    where: { id: userId },
    data: updates,
  });

  console.log(`[CREDITS] User ${userId}: -${creditCost} crédits (${deduction.model}${deduction.usedPerplexity ? ' +perplexity' : ''})`);
}

export async function deductGuestCredits(fingerprint: string, deduction: CreditDeduction): Promise<void> {
  const updates: Record<string, any> = {
    creditsUsed: { increment: deduction.totalCost },
  };

  if (deduction.usedPerplexity) {
    updates.perplexityUsed = { increment: 1 };
  }

  await prisma.guestSession.update({
    where: { fingerprint },
    data: updates,
  });

  console.log(`[CREDITS] Guest ${fingerprint.substring(0, 8)}...: -${deduction.totalCost} crédits`);
}

// ─── Ajout de crédits (achat pack) ──────────────────────────────────────────

export async function addCreditsToUser(userId: string, credits: number, purchaseType: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { creditsLimit: { increment: credits } },
  });

  await prisma.creditPurchase.create({
    data: {
      userId,
      type: purchaseType,
      credits,
      amountEur: Object.values(CREDIT_PACKS_BY_PLAN).flat().find(p => p.id === purchaseType)?.priceEurCents ?? 0,
      status: 'completed',
    },
  });

  console.log(`[CREDITS] +${credits} crédits ajoutés à ${userId} (${purchaseType})`);
}

// ─── Déblocage ponctuel (3 paliers) ─────────────────────────────────────────

export async function grantGuestUnlock(fingerprint: string, credits: number): Promise<void> {
  await prisma.guestSession.update({
    where: { fingerprint },
    data: { creditsLimit: { increment: credits } },
  });

  console.log(`[CREDITS] Guest ${fingerprint.substring(0, 8)}...: +${credits} crédits (déblocage ponctuel)`);
}

export async function grantUserUnlock(userId: string, credits: number, unlockId: string, amountEur: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { creditsLimit: { increment: credits } },
  });

  await prisma.creditPurchase.create({
    data: {
      userId,
      type: unlockId,
      credits,
      amountEur,
      status: 'completed',
    },
  });

  console.log(`[CREDITS] User ${userId}: +${credits} crédits (déblocage ${unlockId})`);
}

// ─── Calcul du coût d'une action ─────────────────────────────────────────────

export function calculateCreditCost(model: 'opus' | 'sonnet' | 'fallback', usedPerplexity: boolean): CreditDeduction {
  let totalCost = 0;

  if (model === 'opus') {
    totalCost += CREDIT_COSTS.message_opus;
  } else if (model === 'sonnet') {
    totalCost += CREDIT_COSTS.message_sonnet;
  }
  // fallback = 0

  if (usedPerplexity) {
    totalCost += CREDIT_COSTS.perplexity_search;
  }

  return { model, usedPerplexity, totalCost };
}

// ─── Upgrade de plan ─────────────────────────────────────────────────────────

export async function upgradeUserPlan(userId: string, newCircle: BaymoraCircle): Promise<void> {
  const plan = PLANS[newCircle];
  if (!plan) throw new Error(`Plan inconnu: ${newCircle}`);

  // Récupérer les crédits restants pour les conserver (rollover)
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditsLimit: true, creditsUsed: true },
  });
  const carryOver = currentUser ? Math.max(0, currentUser.creditsLimit - currentUser.creditsUsed) : 0;

  // Nouveau plafond = quota du plan + crédits restants (cap à 3x le quota)
  const maxAccumulated = plan.creditsLimit * ROLLOVER_MAX_MULTIPLIER;
  const newLimit = Math.min(plan.creditsLimit + carryOver, maxAccumulated);

  await prisma.user.update({
    where: { id: userId },
    data: {
      circle: newCircle,
      creditsLimit: newLimit,
      creditsUsed: 0,
      perplexityUsed: 0,
      perplexityLimit: plan.perplexityLimit,
      messagesLimit: plan.creditsLimit, // legacy sync
      creditsResetAt: getNextResetDate(),
    },
  });

  console.log(`[CREDITS] User ${userId} upgradé vers ${newCircle} (${newLimit} crédits, dont ${carryOver} reportés)`);
}

// ─── Rollover mensuel ───────────────────────────────────────────────────────
//
// Les crédits non utilisés s'additionnent au mois suivant.
// Cap d'accumulation = 3x le quota mensuel du plan.
//
// Exemple Voyageur (100/mois) :
//   Mois 1 : utilise 30 → reste 70 → mois 2 = 100 + 70 = 170
//   Mois 2 : utilise 0  → reste 170 → mois 3 = 100 + 170 = 270
//   Mois 3 : utilise 0  → reste 270 → mois 4 = 100 + 270 = 300 (cap 3x100)
//
// → Parfait pour les petits budgets : pas de perte, accumulation quand en sommeil.

async function maybeResetUserCredits(userId: string, resetAt: Date): Promise<boolean> {
  if (resetAt > new Date()) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditsUsed: true, creditsLimit: true, circle: true },
  });
  if (!user) return false;

  const circle = user.circle as BaymoraCircle;
  const plan = PLANS[circle];
  if (!plan || plan.priceEurCents === 0) {
    // Découverte (gratuit) : pas de rollover, reset simple
    await prisma.user.update({
      where: { id: userId },
      data: {
        creditsUsed: 0,
        creditsLimit: plan?.creditsLimit ?? 15,
        perplexityUsed: 0,
        messagesUsed: 0,
        creditsResetAt: getNextResetDate(),
      },
    });
    console.log(`[CREDITS] Reset mensuel (découverte) pour user ${userId}`);
    return true;
  }

  // Rollover : crédits restants + nouveau quota mensuel, cap à 3x
  const remaining = Math.max(0, user.creditsLimit - user.creditsUsed);
  const maxAccumulated = plan.creditsLimit * ROLLOVER_MAX_MULTIPLIER;
  const newLimit = Math.min(plan.creditsLimit + remaining, maxAccumulated);

  await prisma.user.update({
    where: { id: userId },
    data: {
      creditsUsed: 0,
      creditsLimit: newLimit,
      perplexityUsed: 0,
      messagesUsed: 0,
      creditsResetAt: getNextResetDate(),
    },
  });

  console.log(`[CREDITS] Rollover mensuel pour ${userId}: ${remaining} reportés + ${plan.creditsLimit} nouveaux = ${newLimit} (cap: ${maxAccumulated})`);
  return true;
}

function getNextResetDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1); // 1er du mois suivant
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNextPlan(current: BaymoraCircle): BaymoraCircle | null {
  const order: BaymoraCircle[] = ['decouverte', 'voyageur', 'explorateur', 'prive', 'fondateur'];
  const idx = order.indexOf(current);
  if (idx === -1 || idx >= order.length - 1) return null;
  return order[idx + 1];
}
