/**
 * PROGRAMME CRÉATEUR BAYMORA
 *
 * Les clients deviennent créateurs de contenu et gagnent :
 * - Des points (échangeables contre des features/upgrades)
 * - De l'argent réel (commission sur affiliations + cash-out points)
 *
 * Comment ça marche :
 * 1. Le client crée/publie un parcours → gagne des points
 * 2. Le client vérifie son parcours (photos + notes) → badge ✅ + bonus
 * 3. Le client soumet des fiches lieux → points si accepté
 * 4. Quand quelqu'un utilise son parcours → commission récurrente
 * 5. Quand quelqu'un s'inscrit via son lien → bonus
 * 6. Au-dessus de 1000 points → cash-out en € possible
 */

import { Router } from 'express';
import { prisma } from '../db';
import { addPoints } from './club';

const router = Router();

const requireUser = (req: any, res: any, next: any) => {
  if (!req.baymoraUser?.id) { res.status(401).json({ error: 'Non authentifié' }); return; }
  next();
};

// ═══════════════════════════════════════════════════════════════════════════════
// BARÈME DES GAINS
// ═══════════════════════════════════════════════════════════════════════════════

const CREATOR_REWARDS = {
  // Actions qui rapportent des points
  publish_trip:      50,    // Publier un parcours
  verify_trip:       200,   // Vérifier un parcours (photos + notes)
  submit_venue:      25,    // Soumettre une fiche lieu
  venue_accepted:    100,   // Fiche lieu acceptée par l'équipe
  submit_event:      25,    // Signaler un événement
  submit_offmarket:  50,    // Proposer un off-market
  offmarket_accepted: 200,  // Off-market accepté
  invite_signup:     100,   // Un invité s'inscrit
  invite_premium:    500,   // Un invité passe Premium

  // Gains récurrents (à chaque utilisation)
  trip_used_turnkey: 30,    // Quelqu'un utilise son parcours "clé en main"
  trip_used_verified: 50,   // Idem mais parcours vérifié (bonus)

  // Cash-out
  points_per_euro: 100,     // 100 points = 1€
  min_cashout_points: 1000, // Minimum 1000 points pour cash-out (= 10€)
  max_cashout_month: 500,   // Max 500€/mois de cash-out

  // Commission sur affiliations
  affiliate_commission_percent: 5, // 5% des commissions Baymora sur les réservations faites via son parcours
};

// GET /api/creator/rewards — Barème des gains
router.get('/rewards', (_req, res) => {
  res.json(CREATOR_REWARDS);
});

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD CRÉATEUR — Stats et gains
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/stats', requireUser, async (req: any, res) => {
  try {
    const userId = req.baymoraUser.id;

    const [user, publicTrips, verifiedTrips, venues, contributions] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { clubPoints: true, preferences: true } }),
      prisma.trip.findMany({ where: { userId, visibility: 'public' }, select: { totalCommissionEarned: true, totalPointsEarned: true, usedAsTurnkey: true, forkCount: true, viewCount: true, isVerified: true, title: true, id: true } }),
      prisma.trip.count({ where: { userId, isVerified: true } }),
      prisma.atlasVenue.count({ where: { createdBy: userId, status: { not: 'archived' } } }),
      prisma.agentTask.count({ where: { triggeredBy: userId, type: { startsWith: 'contribution_' } } }),
    ]);

    const totalViews = publicTrips.reduce((s, t) => s + (t.viewCount || 0), 0);
    const totalTurnkeys = publicTrips.reduce((s, t) => s + (t.usedAsTurnkey || 0), 0);
    const totalCommission = publicTrips.reduce((s, t) => s + (t.totalCommissionEarned || 0), 0);
    const totalPointsFromTrips = publicTrips.reduce((s, t) => s + (t.totalPointsEarned || 0), 0);
    const cashoutBalance = Math.floor((user?.clubPoints || 0) / CREATOR_REWARDS.points_per_euro);

    const prefs = (user?.preferences || {}) as any;
    const totalCashedOut = prefs.totalCashedOut || 0;

    res.json({
      points: user?.clubPoints || 0,
      cashoutBalance, // €
      totalCashedOut,
      stats: {
        publicTrips: publicTrips.length,
        verifiedTrips,
        venuesSubmitted: venues,
        contributions,
        totalViews,
        totalTurnkeys,
        totalCommission,
        totalPointsFromTrips,
      },
      trips: publicTrips.map(t => ({
        id: t.id,
        title: t.title,
        isVerified: t.isVerified,
        views: t.viewCount,
        turnkeys: t.usedAsTurnkey,
        forks: t.forkCount,
        commission: t.totalCommissionEarned,
        points: t.totalPointsEarned,
      })),
      rewards: CREATOR_REWARDS,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur stats créateur' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SOUMETTRE UNE FICHE LIEU (client → Atlas draft)
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/submit-venue', requireUser, async (req: any, res) => {
  try {
    const { name, type, city, country, address, description, insiderTips, rating, priceLevel, tags, photos } = req.body;
    if (!name || !type || !city) { res.status(400).json({ error: 'Nom, type et ville requis' }); return; }

    const venue = await prisma.atlasVenue.create({
      data: {
        name,
        type,
        city,
        country: country || 'FR',
        address,
        description,
        insiderTips,
        rating: rating ? parseFloat(rating) : undefined,
        priceLevel: priceLevel || 2,
        tags: tags || [],
        photos: photos || [],
        status: 'draft', // En attente de validation équipe
        createdBy: req.baymoraUser.id,
        affiliateType: 'auto',
      },
    });

    await addPoints(req.baymoraUser.id, 'submit_venue', CREATOR_REWARDS.submit_venue, `Fiche soumise: ${name} (${city})`);

    console.log(`[CREATOR] Fiche soumise: ${name} (${city}) par ${req.baymoraUser.pseudo}`);
    res.json({ venue, pointsEarned: CREATOR_REWARDS.submit_venue, message: 'Fiche soumise ! L\'équipe Baymora va la vérifier.' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur soumission fiche' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VÉRIFIER UN PARCOURS (photos + notes d'expérience)
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/verify-trip/:id', requireUser, async (req: any, res) => {
  try {
    const { notes, photos } = req.body;
    const trip = await prisma.trip.findFirst({ where: { id: req.params.id, userId: req.baymoraUser.id } });
    if (!trip) { res.status(404).json({ error: 'Parcours non trouvé' }); return; }
    if (trip.isVerified) { res.status(400).json({ error: 'Déjà vérifié' }); return; }
    if (!photos || photos.length === 0) { res.status(400).json({ error: 'Au moins 1 photo requise pour vérifier' }); return; }

    await prisma.trip.update({
      where: { id: req.params.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedNotes: notes || null,
        verifiedPhotos: photos,
        status: 'verified',
      },
    });

    await addPoints(req.baymoraUser.id, 'verify_trip', CREATOR_REWARDS.verify_trip, `Parcours vérifié: ${trip.title}`);
    await prisma.user.update({ where: { id: req.baymoraUser.id }, data: { creditsLimit: { increment: 50 } } });

    console.log(`[CREATOR] Parcours vérifié: ${trip.title} (+${CREATOR_REWARDS.verify_trip} pts +50 crédits)`);
    res.json({ pointsEarned: CREATOR_REWARDS.verify_trip, creditsEarned: 50, message: 'Parcours vérifié ! Badge ✅ ajouté.' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur vérification' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CASH-OUT — Convertir les points en argent réel
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/cashout', requireUser, async (req: any, res) => {
  try {
    const { points } = req.body;
    const userId = req.baymoraUser.id;

    if (!points || points < CREATOR_REWARDS.min_cashout_points) {
      res.status(400).json({ error: `Minimum ${CREATOR_REWARDS.min_cashout_points} points (${CREATOR_REWARDS.min_cashout_points / CREATOR_REWARDS.points_per_euro}€)` });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { clubPoints: true, email: true, preferences: true } });
    if (!user || user.clubPoints < points) {
      res.status(403).json({ error: `Points insuffisants (${user?.clubPoints || 0}/${points})` });
      return;
    }

    const euros = Math.floor(points / CREATOR_REWARDS.points_per_euro);
    if (euros > CREATOR_REWARDS.max_cashout_month) {
      res.status(400).json({ error: `Maximum ${CREATOR_REWARDS.max_cashout_month}€/mois` });
      return;
    }

    // Déduire les points
    const pointsToDeduct = euros * CREATOR_REWARDS.points_per_euro;
    await prisma.user.update({
      where: { id: userId },
      data: {
        clubPoints: { decrement: pointsToDeduct },
        preferences: {
          ...(user.preferences as object || {}),
          totalCashedOut: ((user.preferences as any)?.totalCashedOut || 0) + euros,
          lastCashout: new Date().toISOString(),
        },
      },
    });

    await addPoints(userId, 'cashout', -pointsToDeduct, `Cash-out: ${euros}€ (${pointsToDeduct} points)`);

    // Log pour le paiement manuel (Stripe Connect ou virement)
    await prisma.agentTask.create({
      data: {
        type: 'cashout_request',
        status: 'pending',
        priority: 2,
        input: { userId, email: user.email, euros, points: pointsToDeduct },
        triggeredBy: userId,
        startedAt: new Date(),
      },
    });

    console.log(`[CREATOR] Cash-out: ${userId} → ${euros}€ (${pointsToDeduct} pts)`);
    res.json({ success: true, euros, pointsDeducted: pointsToDeduct, message: `${euros}€ seront versés sur votre compte sous 48h.` });
  } catch (error) {
    res.status(500).json({ error: 'Erreur cash-out' });
  }
});

export default router;
