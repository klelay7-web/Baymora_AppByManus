/**
 * Baymora — Routes Mes Voyages + Partage
 * Sauvegarde, consultation, partage et fork de plans de voyage
 */

import { Router, RequestHandler } from 'express';
import { prisma } from '../db';
import { addPoints } from './club';
import { SHARING_REWARDS } from '../types';
import crypto from 'crypto';

const router = Router();

// ─── Auth middleware ──────────────────────────────────────────────────────────

const requireUser: RequestHandler = (req, res, next) => {
  const user = (req as any).baymoraUser;
  if (!user) { res.status(401).json({ error: 'Non authentifié' }); return; }
  next();
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateTripTitle(plan: any): string {
  const dest = plan.destination || 'Voyage';
  const date = plan.dates ? ` · ${plan.dates}` : '';
  return `${dest}${date}`;
}

function generateShareCode(destination: string): string {
  const slug = (destination || 'TRIP')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 10);
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${slug}-${rand}`;
}

// ─── POST /api/trips — sauvegarder un plan ───────────────────────────────────

router.post('/', requireUser, async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    const { plan, sourceConvId } = req.body;

    if (!plan || typeof plan !== 'object') {
      res.status(400).json({ error: 'plan requis' }); return;
    }

    const title = generateTripTitle(plan);

    const trip = await prisma.trip.create({
      data: {
        userId: user.id,
        title,
        destination: plan.destination ?? null,
        dates: plan.dates ?? null,
        duration: plan.duration ?? null,
        travelers: plan.travelers ? Number(plan.travelers) : null,
        budget: plan.budget ?? null,
        planData: plan,
        status: 'planning',
        sourceConvId: sourceConvId ?? null,
      },
    });

    // +25 Crystals pour la sauvegarde d'un voyage
    let pointsEarned = 0;
    try {
      await addPoints(user.id, 'trip_saved', 25, `Voyage sauvegardé : ${title}`);
      pointsEarned = 25;
    } catch (e) {
      console.error('[TRIPS] Erreur attribution points:', e);
    }

    res.status(201).json({ trip, pointsEarned });
  } catch (err) {
    console.error('[TRIPS] Erreur création:', err);
    res.status(500).json({ error: 'Erreur sauvegarde voyage' });
  }
});

// ─── GET /api/trips — liste des voyages ──────────────────────────────────────

router.get('/', requireUser, async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    const { status, limit = '50' } = req.query as Record<string, string>;

    const where: any = { userId: user.id };
    if (status && ['planning', 'confirmed', 'past'].includes(status)) {
      where.status = status;
    }

    const trips = await prisma.trip.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit), 100),
      select: {
        id: true, title: true, destination: true, dates: true,
        duration: true, travelers: true, budget: true, status: true,
        shareCode: true, isPublic: true, shareCount: true,
        createdAt: true, updatedAt: true,
      },
    });

    res.json({ trips, total: trips.length });
  } catch (err) {
    console.error('[TRIPS] Erreur liste:', err);
    res.status(500).json({ error: 'Erreur chargement voyages' });
  }
});

// ─── GET /api/trips/:id — voyage complet ─────────────────────────────────────

router.get('/:id', requireUser, async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });

    if (!trip) { res.status(404).json({ error: 'Voyage introuvable' }); return; }
    if (trip.userId !== user.id) { res.status(403).json({ error: 'Accès refusé' }); return; }

    res.json({ trip });
  } catch (err) {
    console.error('[TRIPS] Erreur récupération:', err);
    res.status(500).json({ error: 'Erreur chargement voyage' });
  }
});

// ─── PATCH /api/trips/:id — mise à jour statut / titre ───────────────────────

router.patch('/:id', requireUser, async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    const existing = await prisma.trip.findUnique({ where: { id: req.params.id } });

    if (!existing) { res.status(404).json({ error: 'Voyage introuvable' }); return; }
    if (existing.userId !== user.id) { res.status(403).json({ error: 'Accès refusé' }); return; }

    const { status, title, planData } = req.body;
    const data: any = {};
    if (status && ['planning', 'confirmed', 'past'].includes(status)) data.status = status;
    if (title && typeof title === 'string') data.title = title.trim().slice(0, 200);
    if (planData && typeof planData === 'object') data.planData = planData;

    const trip = await prisma.trip.update({ where: { id: req.params.id }, data });
    res.json({ trip });
  } catch (err) {
    console.error('[TRIPS] Erreur mise à jour:', err);
    res.status(500).json({ error: 'Erreur mise à jour voyage' });
  }
});

// ─── DELETE /api/trips/:id ────────────────────────────────────────────────────

router.delete('/:id', requireUser, async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    const existing = await prisma.trip.findUnique({ where: { id: req.params.id } });

    if (!existing) { res.status(404).json({ error: 'Voyage introuvable' }); return; }
    if (existing.userId !== user.id) { res.status(403).json({ error: 'Accès refusé' }); return; }

    await prisma.trip.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('[TRIPS] Erreur suppression:', err);
    res.status(500).json({ error: 'Erreur suppression voyage' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PARTAGE DE TRIPS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── POST /api/trips/:id/share — Générer un lien de partage ─────────────────

router.post('/:id/share', requireUser, async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });

    if (!trip) { res.status(404).json({ error: 'Voyage introuvable' }); return; }
    if (trip.userId !== user.id) { res.status(403).json({ error: 'Accès refusé' }); return; }

    // Générer le code de partage si pas encore fait
    let shareCode = trip.shareCode;
    if (!shareCode) {
      shareCode = generateShareCode(trip.destination || 'VOYAGE');
      // S'assurer de l'unicité
      while (await prisma.trip.findUnique({ where: { shareCode } })) {
        shareCode = generateShareCode(trip.destination || 'VOYAGE');
      }
      await prisma.trip.update({
        where: { id: trip.id },
        data: { shareCode, isPublic: true, shareCount: { increment: 1 } },
      });
    } else {
      await prisma.trip.update({
        where: { id: trip.id },
        data: { shareCount: { increment: 1 } },
      });
    }

    // Créer ou mettre à jour le TripShare
    let tripShare = await prisma.tripShare.findFirst({
      where: { tripId: trip.id, sharerId: user.id },
    });
    if (!tripShare) {
      tripShare = await prisma.tripShare.create({
        data: { tripId: trip.id, sharerId: user.id },
      });
    }

    const shareUrl = `https://baymora.com/shared/${shareCode}`;

    // +10 points Club pour le partage
    try {
      await addPoints(user.id, 'trip_shared', 10, `Voyage partagé : ${trip.title}`);
    } catch {}

    res.json({ shareCode, shareUrl, tripShareId: tripShare.id });
  } catch (err) {
    console.error('[TRIPS] Erreur partage:', err);
    res.status(500).json({ error: 'Erreur partage voyage' });
  }
});

// ─── GET /api/trips/shared/:code — Voir un voyage partagé (public) ──────────

router.get('/shared/:code', async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { shareCode: req.params.code },
      include: {
        user: { select: { pseudo: true, prenom: true, clubPoints: true } },
      },
    });

    if (!trip || !trip.isPublic) {
      res.status(404).json({ error: 'Voyage introuvable ou non partagé' });
      return;
    }

    // Incrémenter les vues
    const share = await prisma.tripShare.findFirst({
      where: { tripId: trip.id },
    });
    if (share) {
      await prisma.tripShare.update({
        where: { id: share.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    // Retourner le trip sans données sensibles
    res.json({
      trip: {
        title: trip.title,
        destination: trip.destination,
        dates: trip.dates,
        duration: trip.duration,
        travelers: trip.travelers,
        budget: trip.budget,
        planData: trip.planData,
        status: trip.status,
        shareCode: trip.shareCode,
        createdAt: trip.createdAt,
      },
      sharedBy: {
        pseudo: trip.user.pseudo,
        prenom: trip.user.prenom,
      },
    });
  } catch (err) {
    console.error('[TRIPS] Erreur récupération partagé:', err);
    res.status(500).json({ error: 'Erreur chargement voyage partagé' });
  }
});

// ─── POST /api/trips/shared/:code/fork — Copier un voyage partagé ───────────

router.post('/shared/:code/fork', requireUser, async (req, res) => {
  try {
    const user = (req as any).baymoraUser;

    const original = await prisma.trip.findUnique({
      where: { shareCode: req.params.code },
    });

    if (!original || !original.isPublic) {
      res.status(404).json({ error: 'Voyage introuvable' });
      return;
    }

    // Empêcher de copier son propre voyage
    if (original.userId === user.id) {
      res.status(400).json({ error: 'Vous ne pouvez pas copier votre propre voyage' });
      return;
    }

    // Créer la copie
    const fork = await prisma.trip.create({
      data: {
        userId: user.id,
        title: `${original.title} (copie)`,
        destination: original.destination,
        dates: original.dates,
        duration: original.duration,
        travelers: original.travelers,
        budget: original.budget,
        planData: original.planData as any,
        status: 'planning',
        forkedFromId: original.id,
      },
    });

    // Mettre à jour le compteur de forks sur le TripShare du créateur original
    const share = await prisma.tripShare.findFirst({
      where: { tripId: original.id },
    });
    if (share) {
      await prisma.tripShare.update({
        where: { id: share.id },
        data: { forkCount: { increment: 1 } },
      });
    }

    // Récompenser le créateur original : +30 crédits + 100 points
    try {
      await prisma.user.update({
        where: { id: original.userId },
        data: { creditsLimit: { increment: SHARING_REWARDS.signupCredits } },
      });
      await addPoints(original.userId, 'trip_fork_reward', SHARING_REWARDS.signupPoints,
        `${user.pseudo || 'Quelqu\'un'} a copié votre voyage "${original.title}"`);

      // Mettre à jour les gains du TripShare
      if (share) {
        await prisma.tripShare.update({
          where: { id: share.id },
          data: {
            creditsEarned: { increment: SHARING_REWARDS.signupCredits },
          },
        });
      }

      console.log(`[TRIPS] Fork reward: +${SHARING_REWARDS.signupCredits} crédits + ${SHARING_REWARDS.signupPoints} pts pour ${original.userId}`);
    } catch (e) {
      console.error('[TRIPS] Erreur récompense fork:', e);
    }

    // Points pour celui qui copie aussi
    try {
      await addPoints(user.id, 'trip_saved', 25, `Voyage copié : ${fork.title}`);
    } catch {}

    res.status(201).json({ trip: fork });
  } catch (err) {
    console.error('[TRIPS] Erreur fork:', err);
    res.status(500).json({ error: 'Erreur copie voyage' });
  }
});

// ─── GET /api/trips/my-shares — Statistiques de partage ─────────────────────

router.get('/my-shares', requireUser, async (req, res) => {
  try {
    const user = (req as any).baymoraUser;

    const shares = await prisma.tripShare.findMany({
      where: { sharerId: user.id },
      include: {
        trip: { select: { title: true, destination: true, shareCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totals = shares.reduce((acc, s) => ({
      views: acc.views + s.viewCount,
      forks: acc.forks + s.forkCount,
      signups: acc.signups + s.signupCount,
      creditsEarned: acc.creditsEarned + s.creditsEarned,
      commissionEarned: acc.commissionEarned + s.commissionEarned,
    }), { views: 0, forks: 0, signups: 0, creditsEarned: 0, commissionEarned: 0 });

    res.json({ shares, totals });
  } catch (err) {
    console.error('[TRIPS] Erreur stats partage:', err);
    res.status(500).json({ error: 'Erreur chargement stats' });
  }
});

export default router;
