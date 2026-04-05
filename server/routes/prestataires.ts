/**
 * PRESTATAIRES — Terrain Baymora
 *
 * Les prestataires sont des personnes qui travaillent POUR Baymora :
 * - Visitent des établissements et rédigent des rapports
 * - Créent des fiches partenaires (alimentent l'IA)
 * - Recrutent de nouveaux partenaires
 * - Touchent des commissions sur les partenaires recrutés (10% pendant 12 mois)
 * - Peuvent partager des parcours (comme les clients)
 *
 * Rémunération :
 *   50€ par visite validée
 *   30€ par fiche publiée
 *   100€ par partenaire recruté et approuvé
 *   10% des commissions des partenaires recrutés (12 mois)
 */

import { Router, RequestHandler } from 'express';
import { prisma } from '../db';
import { verifyToken } from '../services/auth';

const router = Router();

// ─── Middleware prestataire ──────────────────────────────────────────────────

const requirePrestataire: RequestHandler = async (req, res, next) => {
  const user = (req as any).baymoraUser;
  if (!user) { res.status(401).json({ error: 'Non authentifié' }); return; }

  const prestataire = await prisma.prestataire.findUnique({ where: { userId: user.id } });
  if (!prestataire || prestataire.status !== 'active') {
    res.status(403).json({ error: 'Accès réservé aux prestataires Baymora' }); return;
  }

  (req as any).prestataire = prestataire;
  next();
};

const requireOwner: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ error: 'Non autorisé' }); return; }
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'owner') {
    res.status(403).json({ error: 'Accès admin requis' }); return;
  }
  next();
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES PRESTATAIRE
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /api/prestataires/me — Dashboard prestataire ────────────────────────

router.get('/me', requirePrestataire, async (req, res) => {
  try {
    const presta = (req as any).prestataire;

    const visits = await prisma.partnerVisit.findMany({
      where: { prestataireId: presta.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { partner: { select: { name: true, city: true, status: true } } },
    });

    // Commissions des partenaires recrutés
    const recruitedPartners = await prisma.partner.findMany({
      where: { verifiedById: presta.id, status: 'approved' },
      select: { id: true, name: true, city: true, totalCommissions: true, approvedAt: true },
    });

    const totalRecruitCommission = recruitedPartners.reduce((sum, p) => {
      // 10% des commissions du partenaire (pendant 12 mois après approbation)
      const monthsSinceApproval = p.approvedAt
        ? Math.floor((Date.now() - p.approvedAt.getTime()) / (30 * 24 * 60 * 60 * 1000))
        : 99;
      if (monthsSinceApproval <= 12) {
        return sum + (p.totalCommissions * presta.commissionOnRecruit / 100);
      }
      return sum;
    }, 0);

    res.json({
      prestataire: {
        id: presta.id,
        region: presta.region,
        speciality: presta.speciality,
        status: presta.status,
        visitsCompleted: presta.visitsCompleted,
        partnersRecruited: presta.partnersRecruited,
        fichesCreated: presta.fichesCreated,
        totalEarned: presta.totalEarned,
        rates: {
          perVisit: presta.ratePerVisit,
          perFiche: presta.ratePerFiche,
          perRecruit: presta.ratePerRecruit,
          commissionOnRecruit: presta.commissionOnRecruit,
        },
      },
      visits,
      recruitedPartners: recruitedPartners.map(p => ({
        ...p,
        myCommission: totalRecruitCommission,
      })),
      earnings: {
        visits: presta.visitsCompleted * presta.ratePerVisit,
        fiches: presta.fichesCreated * presta.ratePerFiche,
        recruits: presta.partnersRecruited * presta.ratePerRecruit,
        recruitCommissions: totalRecruitCommission,
        total: presta.totalEarned + totalRecruitCommission,
      },
    });
  } catch (err) {
    console.error('[PRESTA] Erreur dashboard:', err);
    res.status(500).json({ error: 'Erreur chargement dashboard' });
  }
});

// ─── POST /api/prestataires/visits — Créer un rapport de visite ─────────────

router.post('/visits', requirePrestataire, async (req, res) => {
  try {
    const presta = (req as any).prestataire;
    const { establishmentName, establishmentType, city, visitDate, report, photos, rating, recommendation, partnerId } = req.body;

    if (!establishmentName || !city || !report) {
      res.status(400).json({ error: 'establishmentName, city et report requis' }); return;
    }

    const visit = await prisma.partnerVisit.create({
      data: {
        prestataireId: presta.id,
        partnerId: partnerId || null,
        establishmentName,
        establishmentType: establishmentType || 'hotel',
        city,
        visitDate: visitDate ? new Date(visitDate) : new Date(),
        report,
        photos: photos || [],
        rating: rating || null,
        recommendation: recommendation || null,
        status: 'submitted',
      },
    });

    console.log(`[PRESTA] Visite soumise: ${establishmentName} (${city}) par ${presta.id}`);
    res.status(201).json({ visit });
  } catch (err) {
    console.error('[PRESTA] Erreur création visite:', err);
    res.status(500).json({ error: 'Erreur création visite' });
  }
});

// ─── GET /api/prestataires/visits — Mes visites ─────────────────────────────

router.get('/visits', requirePrestataire, async (req, res) => {
  try {
    const presta = (req as any).prestataire;
    const visits = await prisma.partnerVisit.findMany({
      where: { prestataireId: presta.id },
      orderBy: { createdAt: 'desc' },
      include: { partner: { select: { name: true, city: true } } },
    });
    res.json({ visits });
  } catch (err) {
    res.status(500).json({ error: 'Erreur chargement visites' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES ADMIN (gestion des prestataires)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── POST /api/prestataires/admin/create — Créer un prestataire ─────────────

router.post('/admin/create', requireOwner, async (req, res) => {
  try {
    const { userId, region, speciality, ratePerVisit, ratePerFiche, ratePerRecruit } = req.body;

    if (!userId || !region) {
      res.status(400).json({ error: 'userId et region requis' }); return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { res.status(404).json({ error: 'Utilisateur introuvable' }); return; }

    const presta = await prisma.prestataire.create({
      data: {
        userId,
        region,
        speciality: speciality || null,
        ratePerVisit: ratePerVisit || 50,
        ratePerFiche: ratePerFiche || 30,
        ratePerRecruit: ratePerRecruit || 100,
      },
    });

    console.log(`[PRESTA] Nouveau prestataire: ${user.pseudo} (${region})`);
    res.status(201).json({ prestataire: presta });
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Cet utilisateur est déjà prestataire' }); return;
    }
    console.error('[PRESTA] Erreur création:', err);
    res.status(500).json({ error: 'Erreur création prestataire' });
  }
});

// ─── GET /api/prestataires/admin/list — Tous les prestataires ───────────────

router.get('/admin/list', requireOwner, async (_req, res) => {
  try {
    const prestataires = await prisma.prestataire.findMany({
      include: {
        user: { select: { pseudo: true, prenom: true, email: true } },
        visits: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ prestataires });
  } catch (err) {
    res.status(500).json({ error: 'Erreur chargement prestataires' });
  }
});

// ─── PATCH /api/prestataires/admin/visits/:id — Reviewer une visite ─────────

router.patch('/admin/visits/:id', requireOwner, async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;
    const adminUser = (req as any).adminUser;

    const visit = await prisma.partnerVisit.findUnique({ where: { id: req.params.id } });
    if (!visit) { res.status(404).json({ error: 'Visite introuvable' }); return; }

    const data: any = {};
    if (status && ['reviewed', 'published', 'draft'].includes(status)) data.status = status;
    if (reviewNotes) data.reviewNotes = reviewNotes;
    data.reviewedBy = adminUser?.userId || null;

    if (status === 'published') {
      data.publishedAt = new Date();

      // Incrémenter les stats du prestataire
      await prisma.prestataire.update({
        where: { id: visit.prestataireId },
        data: {
          visitsCompleted: { increment: 1 },
          fichesCreated: { increment: 1 },
          totalEarned: { increment: 50 + 30 }, // visite + fiche
        },
      });

      // Si la visite valide un partenaire → incrémenter partnersRecruited
      if (visit.recommendation === 'approved' && visit.partnerId) {
        await prisma.partner.update({
          where: { id: visit.partnerId },
          data: {
            verificationLevel: 'human_verified',
            verifiedById: visit.prestataireId,
            verifiedAt: new Date(),
            verificationReport: visit.report,
            badgeType: 'verified',
          },
        });
        await prisma.prestataire.update({
          where: { id: visit.prestataireId },
          data: {
            partnersRecruited: { increment: 1 },
            totalEarned: { increment: 100 }, // bonus recrutement
          },
        });
        console.log(`[PRESTA] Partenaire vérifié par prestataire: ${visit.partnerId}`);
      }
    }

    const updated = await prisma.partnerVisit.update({ where: { id: req.params.id }, data });
    res.json({ visit: updated });
  } catch (err) {
    console.error('[PRESTA] Erreur review visite:', err);
    res.status(500).json({ error: 'Erreur review visite' });
  }
});

export default router;
