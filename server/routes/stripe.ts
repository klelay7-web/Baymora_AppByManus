/**
 * STRIPE — Abonnements, packs de crédits & déblocages ponctuels
 *
 * Forfaits mensuels (avec rollover — crédits non utilisés s'additionnent) :
 *   voyageur    →  9.90 €/mois  (100 crédits)
 *   explorateur → 29.00 €/mois  (350 crédits)
 *   prive       → 79.00 €/mois  (1200 crédits)
 *   fondateur   → 199.00 €/mois (4000 crédits)
 *
 * Packs de crédits supplémentaires (one-time) :
 *   pack_50   →  4.90 € (50 crédits)
 *   pack_150  → 12.90 € (150 crédits)
 *   pack_500  → 34.90 € (500 crédits + accès Gold 1 mois)
 *   pack_1000 → 59.90 € (1000 crédits + accès Platinum 1 mois)
 *
 * Déblocages ponctuels (guest ou abonné, prix volontairement élevés pour pousser vers l'abo) :
 *   unlock_5  →  9.90 € (5 crédits)   ← même prix que Voyageur pour 100 crédits/mois !
 *   unlock_10 → 15.90 € (10 crédits)
 *   unlock_20 → 19.90 € (20 crédits)
 */

import { Router, RequestHandler } from 'express';
import Stripe from 'stripe';
import { PLANS, CREDIT_PACKS, CREDIT_PACKS_BY_PLAN, UNLOCK_TIERS, getPacksForPlan, type BaymoraCircle } from '../types';
import { upgradeUserPlan, addCreditsToUser, grantGuestUnlock, grantUserUnlock } from '../services/credits';
import { handleGiftPayment } from './gifts';
import { cancelSubscription } from '../services/retention';
import { prisma } from '../db';

const router = Router();

// ─── Initialisation Stripe (lazy) ────────────────────────────────────────────

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY non configuré');
  return new Stripe(key, { apiVersion: '2023-10-16' });
}

// ─── POST /api/stripe/checkout — Abonnement mensuel ─────────────────────────

const handleCheckout: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    if (!user) {
      res.status(401).json({ error: 'Connexion requise', code: 'NOT_AUTHENTICATED' });
      return;
    }

    const { circle } = req.body;
    const plan = PLANS[circle as BaymoraCircle];
    if (!plan || plan.priceEurCents === 0) {
      res.status(400).json({ error: 'Plan invalide', code: 'INVALID_PLAN' });
      return;
    }

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'eur',
          recurring: { interval: 'month' },
          product_data: { name: `Baymora ${plan.name}` },
          unit_amount: plan.priceEurCents,
        },
        quantity: 1,
      }],
      metadata: {
        userId: user.id,
        circle,
        type: 'subscription',
      },
      success_url: process.env.STRIPE_SUCCESS_URL || 'http://localhost:8080/chat?upgraded=1',
      cancel_url: process.env.STRIPE_CANCEL_URL || 'http://localhost:8080/chat',
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('[STRIPE] Erreur checkout:', error.message);
    res.status(500).json({ error: 'Erreur paiement', code: 'STRIPE_ERROR' });
  }
};

// ─── POST /api/stripe/buy-credits — Pack de crédits supplémentaires ─────────

const handleBuyCredits: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    if (!user) {
      res.status(401).json({ error: 'Connexion requise', code: 'NOT_AUTHENTICATED' });
      return;
    }

    const { packId } = req.body;
    // Chercher dans les packs du plan de l'utilisateur
    const userPacks = getPacksForPlan(user.circle as BaymoraCircle);
    const pack = userPacks.find(p => p.id === packId);
    if (!pack) {
      res.status(400).json({ error: 'Pack invalide pour votre plan', code: 'INVALID_PACK' });
      return;
    }

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Baymora ${pack.name} — ${pack.credits} crédits`,
            description: pack.bonusLabel || undefined,
          },
          unit_amount: pack.priceEurCents,
        },
        quantity: 1,
      }],
      metadata: {
        userId: user.id,
        type: 'credit_pack',
        packId: pack.id,
        credits: String(pack.credits),
      },
      success_url: process.env.STRIPE_SUCCESS_URL || 'http://localhost:8080/chat?credits=added',
      cancel_url: process.env.STRIPE_CANCEL_URL || 'http://localhost:8080/chat',
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('[STRIPE] Erreur achat crédits:', error.message);
    res.status(500).json({ error: 'Erreur paiement', code: 'STRIPE_ERROR' });
  }
};

// ─── POST /api/stripe/unlock — Déblocage ponctuel (3 paliers) ───────────────
//
// Prix volontairement élevés pour rendre l'abonnement évident :
//   5 crédits = 9.90€   ← même prix que Voyageur (100 crédits/mois) !
//   10 crédits = 15.90€
//   20 crédits = 19.90€
//
// Le client voit : "Je paie 9.90€ pour 5 crédits, ou 9.90€/mois pour 100 ?"
// → Conversion naturelle vers l'abonnement.

const handleUnlock: RequestHandler = async (req, res) => {
  try {
    const { fingerprint, unlockId, conversationId } = req.body;
    const baymoraUser = (req as any).baymoraUser;

    // Valider le palier
    const tier = UNLOCK_TIERS.find(t => t.id === unlockId);
    if (!tier) {
      res.status(400).json({ error: 'Palier invalide', code: 'INVALID_UNLOCK' });
      return;
    }

    // Guest ou user authentifié : les deux peuvent débloquer
    if (!fingerprint && !baymoraUser?.id) {
      res.status(400).json({ error: 'fingerprint ou connexion requis', code: 'VALIDATION_ERROR' });
      return;
    }

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Baymora — ${tier.credits} crédits`,
            description: `Débloquez ${tier.credits} crédits de conversation premium`,
          },
          unit_amount: tier.priceEurCents,
        },
        quantity: 1,
      }],
      metadata: {
        type: 'unlock',
        unlockId: tier.id,
        credits: String(tier.credits),
        fingerprint: fingerprint || '',
        userId: baymoraUser?.id || '',
        conversationId: conversationId || '',
      },
      success_url: process.env.STRIPE_SUCCESS_URL || `http://localhost:8080/chat?unlocked=1&cid=${conversationId || ''}`,
      cancel_url: process.env.STRIPE_CANCEL_URL || 'http://localhost:8080/chat',
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('[STRIPE] Erreur unlock:', error.message);
    res.status(500).json({ error: 'Erreur paiement', code: 'STRIPE_ERROR' });
  }
};

// ─── POST /api/stripe/webhook ────────────────────────────────────────────────

const handleWebhook: RequestHandler = async (req, res) => {
  try {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    if (webhookSecret) {
      const sig = req.headers['stripe-signature'] as string;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch {
        res.status(400).json({ error: 'Signature webhook invalide' });
        return;
      }
    } else {
      event = req.body as Stripe.Event;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata || {};
      const paymentType = meta.type;

      // ── Abonnement mensuel ──────────────────────────────────────────────
      if (paymentType === 'subscription' && meta.userId && meta.circle) {
        const circle = meta.circle as BaymoraCircle;
        if (PLANS[circle]) {
          await upgradeUserPlan(meta.userId, circle);
          // Stocker le subscription ID pour gestion future
          if (session.subscription) {
            await prisma.user.update({
              where: { id: meta.userId },
              data: {
                stripeCustomerId: session.customer as string || undefined,
                stripeSubscriptionId: session.subscription as string,
              },
            });
          }
          console.log(`[STRIPE] Abonnement ${circle} activé pour ${meta.userId}`);
        }
      }

      // ── Pack de crédits ─────────────────────────────────────────────────
      if (paymentType === 'credit_pack' && meta.userId && meta.packId) {
        const pack = CREDIT_PACKS.find(p => p.id === meta.packId);
        if (pack) {
          await addCreditsToUser(meta.userId, pack.credits, pack.id);

          // Bonus : accès boutique temporaire pour les gros packs
          if (pack.bonusLabel && meta.packId === 'pack_500') {
            // Temporairement Gold pendant 1 mois (sans changer le plan)
            // On pourrait stocker ça dans les preferences
            const user = await prisma.user.findUnique({ where: { id: meta.userId } });
            if (user) {
              const prefs = (user.preferences as Record<string, any>) || {};
              prefs.tempBoutiqueTier = 'gold';
              prefs.tempBoutiqueTierExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
              await prisma.user.update({ where: { id: meta.userId }, data: { preferences: prefs } });
            }
          }
          if (pack.bonusLabel && meta.packId === 'pack_1000') {
            const user = await prisma.user.findUnique({ where: { id: meta.userId } });
            if (user) {
              const prefs = (user.preferences as Record<string, any>) || {};
              prefs.tempBoutiqueTier = 'platinum';
              prefs.tempBoutiqueTierExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
              await prisma.user.update({ where: { id: meta.userId }, data: { preferences: prefs } });
            }
          }

          console.log(`[STRIPE] Pack ${meta.packId} (+${pack.credits} crédits) pour ${meta.userId}`);
        }
      }

      // ── Déblocage ponctuel (3 paliers) ─────────────────────────────────
      if (paymentType === 'unlock' && meta.unlockId) {
        const tier = UNLOCK_TIERS.find(t => t.id === meta.unlockId);
        const credits = tier?.credits ?? parseInt(meta.credits || '5', 10);

        if (meta.userId) {
          // User authentifié : ajouter à son compte
          await grantUserUnlock(meta.userId, credits, meta.unlockId, tier?.priceEurCents ?? 0);
        } else if (meta.fingerprint) {
          // Guest : ajouter à sa session
          await grantGuestUnlock(meta.fingerprint, credits);
        }

        // Enregistrer l'achat
        await prisma.creditPurchase.create({
          data: {
            userId: meta.userId || undefined,
            type: meta.unlockId,
            credits,
            amountEur: tier?.priceEurCents ?? 0,
            stripeSessionId: session.id,
            status: 'completed',
          },
        });

        console.log(`[STRIPE] Déblocage ${meta.unlockId} (+${credits} crédits) pour ${meta.userId || `guest ${meta.fingerprint?.substring(0, 8)}...`}`);
      }

      // ── Cadeau payé ─────────────────────────────────────────────────────
      if (paymentType === 'gift' && meta.giftId) {
        await handleGiftPayment(meta.giftId, session.id);
        console.log(`[STRIPE] Cadeau ${meta.giftId} payé`);
      }
    }

    // ── Annulation d'abonnement → rétention 90 jours ───────────────────────
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const user = await prisma.user.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (user) {
        await cancelSubscription(user.id, 'stripe_cancellation');
        console.log(`[STRIPE] Résiliation → ${user.pseudo} en rétention 90 jours`);
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('[STRIPE] Erreur webhook:', error.message);
    res.status(500).json({ error: 'Erreur traitement webhook' });
  }
};

// ─── GET /api/stripe/plans — Grille tarifaire publique ──────────────────────

const handlePlans: RequestHandler = (_req, res) => {
  const publicPlans = Object.values(PLANS).map(p => ({
    circle: p.circle,
    name: p.name,
    priceEur: p.priceEurCents / 100,
    priceEurCents: p.priceEurCents,
    creditsLimit: p.creditsLimit,
    perplexityLimit: p.perplexityLimit,
    maxTrips: p.maxTrips,
    maxCompanions: p.maxCompanions,
    hasConcierge: p.hasConcierge,
    hasHumanConcierge: p.hasHumanConcierge,
    boutiqueTier: p.boutiqueTier,
    historyDays: p.historyDays,
  }));

  // Packs de crédits adaptés par plan
  const packsByPlan: Record<string, any[]> = {};
  for (const [circle, packs] of Object.entries(CREDIT_PACKS_BY_PLAN)) {
    packsByPlan[circle] = packs.map(p => ({
      id: p.id,
      name: p.name,
      credits: p.credits,
      priceEur: p.priceEurCents / 100,
      pricePerCredit: p.pricePerCredit,
      bonusLabel: p.bonusLabel,
    }));
  }

  res.json({
    plans: publicPlans,
    creditPacksByPlan: packsByPlan,
    unlockTiers: UNLOCK_TIERS.map(t => ({
      id: t.id,
      credits: t.credits,
      priceEur: t.priceEurCents / 100,
      label: t.label,
    })),
    rollover: true,
    rolloverMaxMultiplier: 3,
  });
};

// ─── GET /api/stripe/credits — Solde crédits de l'utilisateur ───────────────

const handleGetCredits: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    if (!user) {
      res.status(401).json({ error: 'Connexion requise', code: 'NOT_AUTHENTICATED' });
      return;
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        creditsUsed: true, creditsLimit: true, creditsResetAt: true,
        perplexityUsed: true, perplexityLimit: true, circle: true,
      },
    });

    if (!dbUser) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    res.json({
      credits: {
        used: dbUser.creditsUsed,
        limit: dbUser.creditsLimit,
        remaining: dbUser.creditsLimit - dbUser.creditsUsed,
        resetAt: dbUser.creditsResetAt,
      },
      perplexity: {
        used: dbUser.perplexityUsed,
        limit: dbUser.perplexityLimit,
        remaining: dbUser.perplexityLimit === -1 ? 'unlimited' : dbUser.perplexityLimit - dbUser.perplexityUsed,
      },
      circle: dbUser.circle,
    });
  } catch (error: any) {
    console.error('[STRIPE] Erreur get credits:', error.message);
    res.status(500).json({ error: 'Erreur récupération crédits' });
  }
};

// ─── Routes ──────────────────────────────────────────────────────────────────

router.post('/checkout', handleCheckout);
router.post('/buy-credits', handleBuyCredits);
router.post('/unlock', handleUnlock);
router.post('/webhook', handleWebhook);
router.get('/plans', handlePlans);
router.get('/credits', handleGetCredits);

export default router;
