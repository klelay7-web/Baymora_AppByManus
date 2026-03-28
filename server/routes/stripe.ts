/**
 * STRIPE — Paiement & upgrades de cercle
 *
 * Endpoint checkout pour upgrades :
 *   essentiel  → 29€/mois
 *   elite      → 99€/mois
 *   prive      → 299€/mois
 */

import { Router, RequestHandler } from 'express';
import Stripe from 'stripe';
import { userStore } from '../stores';
import type { BaymoraUser } from '../types';

const router = Router();

// ─── Plans ────────────────────────────────────────────────────────────────────

const PLANS: Record<string, { name: string; priceEur: number; messagesLimit: number }> = {
  essentiel: { name: 'Baymora Essentiel',  priceEur: 2900,  messagesLimit: 100  },
  elite:     { name: 'Baymora Élite',      priceEur: 9900,  messagesLimit: 500  },
  prive:     { name: 'Baymora Privé',      priceEur: 29900, messagesLimit: 9999 },
};

// ─── Initialisation Stripe (lazy — évite crash si clé absente) ───────────────

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY non configuré');
  return new Stripe(key, { apiVersion: '2023-10-16' });
}

// ─── POST /api/stripe/checkout ────────────────────────────────────────────────

const handleCheckout: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).baymoraUser as BaymoraUser | undefined;
    if (!user) {
      res.status(401).json({ error: 'Connexion requise', code: 'NOT_AUTHENTICATED' });
      return;
    }

    const { circle } = req.body;
    const plan = PLANS[circle];
    if (!plan) {
      res.status(400).json({ error: 'Cercle invalide', code: 'INVALID_PLAN' });
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
          product_data: { name: plan.name },
          unit_amount: plan.priceEur,
        },
        quantity: 1,
      }],
      metadata: {
        userId: user.id,
        circle,
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

// ─── POST /api/stripe/webhook ─────────────────────────────────────────────────

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
      // Dev mode sans vérification signature
      event = req.body as Stripe.Event;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const circle = session.metadata?.circle as BaymoraUser['circle'];

      if (userId && circle && PLANS[circle]) {
        const user = userStore.get(userId);
        if (user) {
          user.circle = circle;
          user.messagesLimit = PLANS[circle].messagesLimit;
          user.updatedAt = new Date();
          console.log(`[STRIPE] Upgrade cercle: ${user.pseudo} → ${circle}`);
        }
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('[STRIPE] Erreur webhook:', error.message);
    res.status(500).json({ error: 'Erreur traitement webhook' });
  }
};

// ─── GET /api/stripe/plans ────────────────────────────────────────────────────

const handlePlans: RequestHandler = (_req, res) => {
  res.json({ plans: PLANS });
};

router.post('/checkout', handleCheckout);
router.post('/webhook', handleWebhook);
router.get('/plans', handlePlans);

export default router;
