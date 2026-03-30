/**
 * STRIPE — Abonnements, packs de crédits & déblocages unitaires
 *
 * Forfaits mensuels :
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
 * Déblocage unitaire (guest, sans inscription) :
 *   unlock_single → 1.90 € (5 crédits supplémentaires)
 */

import { Router, RequestHandler } from 'express';
import Stripe from 'stripe';
import { PLANS, CREDIT_PACKS, UNLOCK_SINGLE_PRICE_CENTS, type BaymoraCircle } from '../types';
import { upgradeUserPlan, addCreditsToUser, grantGuestUnlock } from '../services/credits';
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
    const pack = CREDIT_PACKS.find(p => p.id === packId);
    if (!pack) {
      res.status(400).json({ error: 'Pack invalide', code: 'INVALID_PACK' });
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

// ─── POST /api/stripe/unlock — Déblocage unitaire guest (1.90 €) ────────────

const handleUnlock: RequestHandler = async (req, res) => {
  try {
    const { fingerprint, conversationId } = req.body;
    if (!fingerprint) {
      res.status(400).json({ error: 'fingerprint requis', code: 'VALIDATION_ERROR' });
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
            name: 'Baymora — Débloquer votre résultat',
            description: '5 crédits de conversation premium',
          },
          unit_amount: UNLOCK_SINGLE_PRICE_CENTS,
        },
        quantity: 1,
      }],
      metadata: {
        type: 'unlock_single',
        fingerprint,
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

      // ── Déblocage unitaire guest ────────────────────────────────────────
      if (paymentType === 'unlock_single' && meta.fingerprint) {
        await grantGuestUnlock(meta.fingerprint);

        // Enregistrer l'achat
        await prisma.creditPurchase.create({
          data: {
            type: 'unlock_single',
            credits: 5,
            amountEur: UNLOCK_SINGLE_PRICE_CENTS,
            stripeSessionId: session.id,
            status: 'completed',
          },
        });

        console.log(`[STRIPE] Déblocage unitaire pour guest ${meta.fingerprint.substring(0, 8)}...`);
      }
    }

    // ── Annulation d'abonnement ─────────────────────────────────────────────
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      // Retrouver l'utilisateur par stripeSubscriptionId
      const user = await prisma.user.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (user) {
        await upgradeUserPlan(user.id, 'decouverte');
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeSubscriptionId: null },
        });
        console.log(`[STRIPE] Abonnement annulé → ${user.pseudo} revient en Découverte`);
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

  const publicPacks = CREDIT_PACKS.map(p => ({
    id: p.id,
    name: p.name,
    credits: p.credits,
    priceEur: p.priceEurCents / 100,
    pricePerCredit: p.pricePerCredit,
    bonusLabel: p.bonusLabel,
  }));

  res.json({
    plans: publicPlans,
    creditPacks: publicPacks,
    unlockSinglePriceEur: UNLOCK_SINGLE_PRICE_CENTS / 100,
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
