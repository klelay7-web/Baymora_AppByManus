/**
 * Baymora — Routes Mes Voyages
 * Sauvegarde, consultation et gestion des plans de voyage
 */

import { Router, RequestHandler } from 'express';
import { prisma } from '../db';
import { addPoints } from './club';

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
        id: true,
        title: true,
        destination: true,
        dates: true,
        duration: true,
        travelers: true,
        budget: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        // planData exclu de la liste pour alléger la réponse
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

    const { status, title } = req.body;
    const data: any = {};
    if (status && ['planning', 'confirmed', 'past'].includes(status)) data.status = status;
    if (title && typeof title === 'string') data.title = title.trim().slice(0, 200);

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

export default router;
