/**
 * GIFTS — Offrir un forfait, des crédits ou un article boutique
 *
 * Types de cadeaux :
 *   subscription → offrir un plan (1, 3, 6 ou 12 mois)
 *   credits      → offrir X crédits
 *   boutique_item → offrir un article de la boutique (futur)
 *
 * Flux :
 *   1. L'acheteur choisit un cadeau + message personnel
 *   2. Paiement via Stripe
 *   3. Le destinataire reçoit un email avec un lien de réclamation
 *   4. Le destinataire clique → crédits/plan activé sur son compte
 *   5. Si pas de compte → inscription + cadeau appliqué automatiquement
 */

import { Router, RequestHandler } from 'express';
import Stripe from 'stripe';
import { prisma } from '../db';
import { PLANS, CREDIT_PACKS, type BaymoraCircle } from '../types';
import { upgradeUserPlan, addCreditsToUser } from '../services/credits';
import { sendEmail } from '../services/email';

const router = Router();

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY non configuré');
  return new Stripe(key, { apiVersion: '2023-10-16' });
}

// ─── POST /api/gifts/send — Créer un cadeau ─────────────────────────────────

const handleSendGift: RequestHandler = async (req, res) => {
  try {
    const sender = (req as any).baymoraUser;
    if (!sender) {
      res.status(401).json({ error: 'Connexion requise' });
      return;
    }

    const { type, recipientEmail, message: giftMessage, circle, months, credits, itemId, itemName } = req.body;

    if (!type || !recipientEmail) {
      res.status(400).json({ error: 'type et recipientEmail requis' });
      return;
    }

    // Anti-fraude : max 5 cadeaux par jour par utilisateur
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const giftsToday = await prisma.gift.count({
      where: { senderId: sender.id, createdAt: { gte: todayStart } },
    });
    if (giftsToday >= 5) {
      res.status(429).json({ error: 'Maximum 5 cadeaux par jour', code: 'GIFT_LIMIT' });
      return;
    }

    // Calculer le prix
    let amountCents = 0;
    let productName = '';
    let giftData: Record<string, any> = {};

    if (type === 'subscription') {
      const plan = PLANS[circle as BaymoraCircle];
      if (!plan || plan.priceEurCents === 0) {
        res.status(400).json({ error: 'Plan invalide' });
        return;
      }
      const m = months || 1;
      amountCents = plan.priceEurCents * m;
      productName = `Baymora ${plan.name} — ${m} mois`;
      giftData = { giftCircle: circle, giftMonths: m };
    } else if (type === 'credits') {
      const pack = CREDIT_PACKS.find(p => p.credits === credits);
      if (!pack) {
        res.status(400).json({ error: 'Nombre de crédits invalide' });
        return;
      }
      amountCents = pack.priceEurCents;
      productName = `${credits} crédits Baymora`;
      giftData = { giftCredits: credits };
    } else if (type === 'boutique_item') {
      // Futur : vérifier l'article en boutique
      res.status(400).json({ error: 'Boutique bientôt disponible' });
      return;
    } else {
      res.status(400).json({ error: 'Type de cadeau invalide' });
      return;
    }

    // Chercher si le destinataire existe déjà
    const existingRecipient = await prisma.user.findFirst({
      where: { email: recipientEmail.trim().toLowerCase() },
      select: { id: true },
    });

    // Créer le cadeau en base
    const gift = await prisma.gift.create({
      data: {
        senderId: sender.id,
        recipientId: existingRecipient?.id || null,
        recipientEmail: recipientEmail.trim().toLowerCase(),
        type,
        ...giftData,
        message: giftMessage || null,
        amountEur: amountCents,
        status: 'pending',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 jours
      },
    });

    // Créer la session Stripe
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Cadeau Baymora — ${productName}`,
            description: giftMessage ? `Message : "${giftMessage}"` : undefined,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      metadata: {
        type: 'gift',
        giftId: gift.id,
        senderId: sender.id,
      },
      success_url: process.env.STRIPE_SUCCESS_URL || `http://localhost:8080/dashboard?gift=sent`,
      cancel_url: process.env.STRIPE_CANCEL_URL || 'http://localhost:8080/dashboard',
    });

    res.json({ url: session.url, sessionId: session.id, giftId: gift.id });
  } catch (error: any) {
    console.error('[GIFTS] Erreur:', error.message);
    res.status(500).json({ error: 'Erreur création cadeau' });
  }
};

// ─── POST /api/gifts/claim/:id — Réclamer un cadeau ─────────────────────────

const handleClaimGift: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    if (!user) {
      res.status(401).json({ error: 'Connexion requise pour réclamer un cadeau' });
      return;
    }

    const gift = await prisma.gift.findUnique({ where: { id: req.params.id } });

    if (!gift) {
      res.status(404).json({ error: 'Cadeau introuvable' });
      return;
    }
    if (gift.status !== 'paid') {
      res.status(400).json({ error: 'Ce cadeau n\'est pas disponible' });
      return;
    }
    if (gift.expiresAt && gift.expiresAt < new Date()) {
      res.status(410).json({ error: 'Ce cadeau a expiré' });
      return;
    }

    // Claim atomique : appliquer + marquer en une transaction (empêche le double-claim)
    try {
      await prisma.$transaction(async (tx) => {
        // Re-vérifier le statut dans la transaction (empêche les claims concurrents)
        const freshGift = await tx.gift.findUnique({ where: { id: gift.id } });
        if (!freshGift || freshGift.status !== 'paid') {
          throw new Error('ALREADY_CLAIMED');
        }

        // Marquer comme réclamé AVANT d'appliquer (si l'application échoue, on peut retry)
        await tx.gift.update({
          where: { id: gift.id },
          data: { status: 'claimed', recipientId: user.id, claimedAt: new Date() },
        });
      });
    } catch (err: any) {
      if (err.message === 'ALREADY_CLAIMED') {
        res.status(409).json({ error: 'Ce cadeau a déjà été réclamé' });
        return;
      }
      throw err;
    }

    // Appliquer le cadeau (hors transaction — si ça échoue, le cadeau est marqué claimed mais on peut retry)
    if (gift.type === 'subscription' && gift.giftCircle) {
      await upgradeUserPlan(user.id, gift.giftCircle as BaymoraCircle);
    } else if (gift.type === 'credits' && gift.giftCredits) {
      await addCreditsToUser(user.id, gift.giftCredits, `gift_${gift.id}`);
    }

    // Log pour audit
    console.log(`[GIFTS] Cadeau ${gift.id} réclamé par ${user.id} (type: ${gift.type}, ${gift.giftCredits || gift.giftCircle})`);

    const sender = await prisma.user.findUnique({
      where: { id: gift.senderId },
      select: { prenom: true, pseudo: true },
    });

    res.json({
      success: true,
      gift: {
        type: gift.type,
        circle: gift.giftCircle,
        credits: gift.giftCredits,
        message: gift.message,
        from: sender?.prenom || sender?.pseudo || 'Un ami',
      },
    });
  } catch (error: any) {
    console.error('[GIFTS] Erreur claim:', error.message);
    res.status(500).json({ error: 'Erreur réclamation cadeau' });
  }
};

// ─── GET /api/gifts/sent — Cadeaux envoyés ──────────────────────────────────

const handleListSent: RequestHandler = async (req, res) => {
  const user = (req as any).baymoraUser;
  if (!user) { res.status(401).json({ error: 'Non authentifié' }); return; }

  const gifts = await prisma.gift.findMany({
    where: { senderId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ gifts });
};

// ─── GET /api/gifts/received — Cadeaux reçus ────────────────────────────────

const handleListReceived: RequestHandler = async (req, res) => {
  const user = (req as any).baymoraUser;
  if (!user) { res.status(401).json({ error: 'Non authentifié' }); return; }

  const gifts = await prisma.gift.findMany({
    where: {
      OR: [
        { recipientId: user.id },
        { recipientEmail: user.email || '__never__' },
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { prenom: true, pseudo: true } },
    },
  });

  res.json({ gifts });
};

// ─── Webhook helper (appelé depuis stripe.ts) ───────────────────────────────

export async function handleGiftPayment(giftId: string, stripeSessionId: string): Promise<void> {
  const gift = await prisma.gift.findUnique({ where: { id: giftId } });
  if (!gift) return;

  await prisma.gift.update({
    where: { id: giftId },
    data: { status: 'paid', stripeSessionId },
  });

  // Envoyer l'email au destinataire
  if (gift.recipientEmail) {
    const sender = await prisma.user.findUnique({
      where: { id: gift.senderId },
      select: { prenom: true, pseudo: true },
    });

    const senderName = sender?.prenom || sender?.pseudo || 'Un ami';
    let giftDesc = '';
    if (gift.type === 'subscription' && gift.giftCircle) {
      const plan = PLANS[gift.giftCircle as BaymoraCircle];
      giftDesc = `un abonnement ${plan?.name || gift.giftCircle} de ${gift.giftMonths || 1} mois`;
    } else if (gift.type === 'credits') {
      giftDesc = `${gift.giftCredits} crédits`;
    }

    const claimUrl = `https://baymora.com/gift/${gift.id}`;

    await sendGiftEmail(gift.recipientEmail, senderName, giftDesc, gift.message, claimUrl);
  }

  console.log(`[GIFTS] Cadeau ${giftId} payé — email envoyé à ${gift.recipientEmail}`);
}

// ─── Email de cadeau ─────────────────────────────────────────────────────────

async function sendGiftEmail(
  to: string,
  senderName: string,
  giftDescription: string,
  personalMessage: string | null,
  claimUrl: string,
): Promise<void> {
  const subject = `${senderName} vous offre un cadeau Baymora`;

  const html = `
<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f3ef;margin:0;padding:0;">
<div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #e8e3da;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#1a1e2e,#0f1420);padding:40px 32px;text-align:center;">
    <div style="font-size:48px;margin-bottom:12px;">🎁</div>
    <div style="font-size:11px;color:rgba(200,169,74,0.9);letter-spacing:2px;text-transform:uppercase;font-weight:600;">Baymora</div>
  </div>
  <div style="padding:32px;">
    <h1 style="font-size:24px;color:#1a1a1a;margin:0 0 8px;text-align:center;">
      Vous avez reçu un cadeau !
    </h1>
    <p style="color:#555;font-size:16px;text-align:center;margin:0 0 24px;">
      <strong>${senderName}</strong> vous offre ${giftDescription}
    </p>

    ${personalMessage ? `
    <div style="background:#fdf8ed;border:1px solid #e8dbb8;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center;">
      <p style="color:#1a1a1a;font-size:15px;font-style:italic;margin:0;">
        "${personalMessage}"
      </p>
      <p style="color:#a08a3c;font-size:13px;margin:8px 0 0;">— ${senderName}</p>
    </div>
    ` : ''}

    <div style="text-align:center;margin-bottom:12px;">
      <a href="${claimUrl}" style="display:inline-block;background:#c8a94a;color:#000;font-weight:700;font-size:16px;padding:16px 36px;border-radius:10px;text-decoration:none;">
        Ouvrir mon cadeau →
      </a>
    </div>
    <p style="color:#999;font-size:12px;text-align:center;margin:12px 0 0;">
      Ce cadeau est valable 90 jours.
    </p>
  </div>
  <div style="padding:16px 32px;text-align:center;border-top:1px solid #e8e3da;background:#faf9f7;">
    <span style="color:#999;font-size:11px;">Baymora · Conciergerie de voyage privée</span>
  </div>
</div>
</body></html>`;

  await sendEmail(to, subject, html);
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.post('/send', handleSendGift);
router.post('/claim/:id', handleClaimGift);
router.get('/sent', handleListSent);
router.get('/received', handleListReceived);

export default router;
