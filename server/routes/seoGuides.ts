/**
 * SEO GUIDES — Listes curatées publiques ("Top 10 restos Paris")
 *
 * Double SEO :
 * - EXTERNE : titre + description + 3 premiers items visibles par tous (Google indexe)
 * - INTERNE : reste des items derrière paywall (inscription/plan/points/paiement)
 *
 * Gating :
 * - Non inscrit : voit 3 items + "Inscrivez-vous pour voir les 7 autres"
 * - Inscrit gratuit : 1 guide offert, puis 4.90€ ou points
 * - Premium : tous les guides inclus
 * - Privé : tout + prix réduits partenaires
 */

import { Router } from 'express';
import { prisma } from '../db';
import { normalizeCircle } from '../types';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC — Pages SEO (indexables par Google)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/guides — Liste des guides publiés (pour la landing)
router.get('/', async (req, res) => {
  try {
    const { city, category, limit = '20' } = req.query as Record<string, string>;
    const where: any = { status: 'published' };
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (category) where.category = category;

    const guides = await prisma.seoGuide.findMany({
      where,
      select: {
        id: true, slug: true, title: true, subtitle: true, city: true,
        category: true, coverEmoji: true, coverPhoto: true,
        description: true, itemCount: true, previewCount: true,
        viewCount: true, unlockCount: true, unlockPrice: true,
        unlockPoints: true, minPlan: true, freeAccess: true,
        tags: true, metaTitle: true, metaDescription: true,
      },
      orderBy: [{ viewCount: 'desc' }, { updatedAt: 'desc' }],
      take: parseInt(limit),
    });

    res.json(guides);
  } catch (error) {
    res.status(500).json({ error: 'Erreur guides' });
  }
});

// GET /api/guides/:slug — Page publique d'un guide (SEO)
router.get('/:slug', async (req, res) => {
  try {
    const guide = await prisma.seoGuide.findUnique({ where: { slug: req.params.slug } });
    if (!guide || guide.status !== 'published') {
      res.status(404).json({ error: 'Guide non trouvé' }); return;
    }

    // Incrémenter les vues
    await prisma.seoGuide.update({ where: { id: guide.id }, data: { viewCount: { increment: 1 } } });

    // Déterminer le niveau d'accès du visiteur
    const baymoraUser = (req as any).baymoraUser;
    const userCircle = baymoraUser ? normalizeCircle(baymoraUser.circle || 'decouverte') : null;

    const allItems = guide.items as any[];
    let visibleItems: any[];
    let locked = false;
    let lockReason = '';

    if (!baymoraUser) {
      // Non inscrit → preview seulement
      visibleItems = allItems.slice(0, guide.previewCount);
      locked = allItems.length > guide.previewCount;
      lockReason = 'signup'; // "Inscrivez-vous gratuitement"
    } else if (userCircle === 'prive') {
      // Privé → tout visible + prix réduits
      visibleItems = allItems;
      locked = false;
    } else if (userCircle === 'premium' || (guide.minPlan === 'decouverte')) {
      // Premium ou guide gratuit → tout visible
      visibleItems = allItems;
      locked = false;
    } else if (guide.freeAccess) {
      // Guide gratuit pour tous les inscrits
      visibleItems = allItems;
      locked = false;
    } else {
      // Inscrit gratuit → preview + paywall
      visibleItems = allItems.slice(0, guide.previewCount);
      locked = allItems.length > guide.previewCount;
      lockReason = 'unlock'; // "Débloquer pour 4.90€ ou 500 points"
    }

    // Pour les Privé : révéler les prix Baymora réduits
    if (userCircle === 'prive') {
      visibleItems = visibleItems.map((item: any) => ({
        ...item,
        showBaymoraPrice: true,
      }));
    }

    res.json({
      ...guide,
      items: visibleItems,
      totalItems: allItems.length,
      locked,
      lockReason,
      hiddenCount: locked ? allItems.length - visibleItems.length : 0,
      unlockOptions: locked ? {
        price: guide.unlockPrice ? (guide.unlockPrice / 100).toFixed(2) + '€' : null,
        points: guide.unlockPoints,
        signupFree: lockReason === 'signup',
        upgradePlan: guide.minPlan,
      } : null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur guide' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN — CRUD guides SEO
// ═══════════════════════════════════════════════════════════════════════════════

const requireTeam = (req: any, res: any, next: any) => {
  if (req.baymoraUser?.id) { req.teamUserId = req.baymoraUser.id; return next(); }
  const adminSecret = req.headers['x-admin-secret'] as string;
  if (adminSecret && adminSecret === (process.env.ADMIN_SECRET || '').trim()) { req.teamUserId = 'admin'; return next(); }
  res.status(403).json({ error: 'Accès réservé' });
};

router.get('/admin/list', requireTeam, async (req, res) => {
  try {
    const guides = await prisma.seoGuide.findMany({ orderBy: { updatedAt: 'desc' } });
    res.json({ guides, total: guides.length });
  } catch (error) {
    res.status(500).json({ error: 'Erreur liste guides admin' });
  }
});

router.post('/admin/create', requireTeam, async (req: any, res) => {
  try {
    const guide = await prisma.seoGuide.create({
      data: { ...req.body, createdBy: req.teamUserId },
    });
    console.log(`[SEO_GUIDE] Créé: ${guide.title} (${guide.slug})`);
    res.status(201).json(guide);
  } catch (error: any) {
    if (error.code === 'P2002') { res.status(409).json({ error: 'Ce slug existe déjà' }); return; }
    res.status(500).json({ error: 'Erreur création guide' });
  }
});

router.put('/admin/:id', requireTeam, async (req, res) => {
  try {
    const { id, createdBy, createdAt, ...data } = req.body;
    const guide = await prisma.seoGuide.update({ where: { id: req.params.id }, data });
    res.json(guide);
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise à jour guide' });
  }
});

router.delete('/admin/:id', requireTeam, async (req, res) => {
  try {
    await prisma.seoGuide.update({ where: { id: req.params.id }, data: { status: 'archived' } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur archivage' });
  }
});

export default router;
