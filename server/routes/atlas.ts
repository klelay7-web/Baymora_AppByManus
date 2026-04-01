/**
 * BAYMORA ATLAS — CMS pour fiches établissements, guides ville, parcours curatés
 *
 * Accessible uniquement par l'admin/équipe (requireOwner).
 * L'IA Baymora peut lire les fiches publiées pour enrichir ses recommandations.
 */

import { Router, RequestHandler } from 'express';
import { prisma } from '../db';
import { verifyToken } from '../services/auth';

const router = Router();

// ─── Middleware admin/équipe ─────────────────────────────────────────────────

const requireTeam: RequestHandler = (req, res, next) => {
  const baymoraUser = (req as any).baymoraUser;
  const token = req.headers.authorization?.split(' ')[1];

  // Soit un user authentifié avec rôle admin/owner, soit un token spécial
  if (baymoraUser?.id) {
    (req as any).teamUserId = baymoraUser.id;
    next();
    return;
  }

  if (token) {
    const decoded = verifyToken(token);
    if (decoded && (decoded.role === 'owner' || decoded.role === 'admin')) {
      (req as any).teamUserId = decoded.userId;
      next();
      return;
    }
  }

  // Vérifier ADMIN_SECRET en header (pour appels API)
  const adminSecret = req.headers['x-admin-secret'] as string;
  if (adminSecret && adminSecret === process.env.ADMIN_SECRET) {
    (req as any).teamUserId = 'admin';
    next();
    return;
  }

  res.status(403).json({ error: 'Accès réservé à l\'équipe Baymora' });
};

// ═══════════════════════════════════════════════════════════════════════════
// VENUES (Fiches établissements)
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/atlas/venues — Liste avec filtres et pagination
router.get('/venues', requireTeam, async (req, res) => {
  try {
    const { city, type, status, search, isPartner, tested, limit = '50', offset = '0' } = req.query as Record<string, string>;
    const where: any = {};
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (type) where.type = type;
    if (status) where.status = status;
    if (isPartner === 'true') where.isPartner = true;
    if (tested === 'true') where.testedByBaymora = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [venues, total] = await Promise.all([
      prisma.atlasVenue.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.atlasVenue.count({ where }),
    ]);
    res.json({ venues, total });
  } catch (error) {
    console.error('[ATLAS] Error listing venues:', error);
    res.status(500).json({ error: 'Erreur liste venues' });
  }
});

// GET /api/atlas/venues/:id — Détail d'une venue
router.get('/venues/:id', requireTeam, async (req, res) => {
  try {
    const venue = await prisma.atlasVenue.findUnique({ where: { id: req.params.id }, include: { partner: true } });
    if (!venue) { res.status(404).json({ error: 'Venue non trouvée' }); return; }
    res.json(venue);
  } catch (error) {
    res.status(500).json({ error: 'Erreur détail venue' });
  }
});

// POST /api/atlas/venues — Créer une venue
router.post('/venues', requireTeam, async (req, res) => {
  try {
    const venue = await prisma.atlasVenue.create({
      data: { ...req.body, createdBy: (req as any).teamUserId },
    });
    console.log(`[ATLAS] Venue créée: ${venue.name} (${venue.city}) par ${venue.createdBy}`);
    res.status(201).json(venue);
  } catch (error) {
    console.error('[ATLAS] Error creating venue:', error);
    res.status(500).json({ error: 'Erreur création venue' });
  }
});

// PUT /api/atlas/venues/:id — Modifier une venue
router.put('/venues/:id', requireTeam, async (req, res) => {
  try {
    const { id, createdBy, createdAt, ...data } = req.body;
    const venue = await prisma.atlasVenue.update({ where: { id: req.params.id }, data });
    res.json(venue);
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise à jour venue' });
  }
});

// DELETE /api/atlas/venues/:id — Archiver (soft delete)
router.delete('/venues/:id', requireTeam, async (req, res) => {
  try {
    await prisma.atlasVenue.update({ where: { id: req.params.id }, data: { status: 'archived' } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur archivage venue' });
  }
});

// POST /api/atlas/venues/:id/publish — Publier une venue
router.post('/venues/:id/publish', requireTeam, async (req, res) => {
  try {
    const venue = await prisma.atlasVenue.findUnique({ where: { id: req.params.id } });
    if (!venue) { res.status(404).json({ error: 'Venue non trouvée' }); return; }
    if (!venue.name || !venue.type || !venue.city) {
      res.status(400).json({ error: 'Nom, type et ville requis pour publier' }); return;
    }
    const updated = await prisma.atlasVenue.update({ where: { id: req.params.id }, data: { status: 'published' } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erreur publication venue' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CITY GUIDES (Guides de ville)
// ═══════════════════════════════════════════════════════════════════════════

router.get('/city-guides', requireTeam, async (req, res) => {
  try {
    const { country, status, search, limit = '50', offset = '0' } = req.query as Record<string, string>;
    const where: any = {};
    if (country) where.country = country;
    if (status) where.status = status;
    if (search) where.city = { contains: search, mode: 'insensitive' };

    const [guides, total] = await Promise.all([
      prisma.atlasCityGuide.findMany({ where, orderBy: { updatedAt: 'desc' }, take: parseInt(limit), skip: parseInt(offset) }),
      prisma.atlasCityGuide.count({ where }),
    ]);
    res.json({ guides, total });
  } catch (error) {
    res.status(500).json({ error: 'Erreur liste guides' });
  }
});

router.get('/city-guides/:id', requireTeam, async (req, res) => {
  try {
    const guide = await prisma.atlasCityGuide.findUnique({ where: { id: req.params.id } });
    if (!guide) { res.status(404).json({ error: 'Guide non trouvé' }); return; }
    res.json(guide);
  } catch (error) {
    res.status(500).json({ error: 'Erreur détail guide' });
  }
});

router.post('/city-guides', requireTeam, async (req, res) => {
  try {
    const guide = await prisma.atlasCityGuide.create({
      data: { ...req.body, createdBy: (req as any).teamUserId },
    });
    console.log(`[ATLAS] Guide créé: ${guide.city} (${guide.country}) par ${guide.createdBy}`);
    res.status(201).json(guide);
  } catch (error: any) {
    if (error.code === 'P2002') { res.status(409).json({ error: 'Un guide existe déjà pour cette ville/pays' }); return; }
    res.status(500).json({ error: 'Erreur création guide' });
  }
});

router.put('/city-guides/:id', requireTeam, async (req, res) => {
  try {
    const { id, createdBy, createdAt, ...data } = req.body;
    const guide = await prisma.atlasCityGuide.update({ where: { id: req.params.id }, data });
    res.json(guide);
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise à jour guide' });
  }
});

router.delete('/city-guides/:id', requireTeam, async (req, res) => {
  try {
    await prisma.atlasCityGuide.update({ where: { id: req.params.id }, data: { status: 'archived' } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur archivage guide' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CURATED ROUTES (Parcours)
// ═══════════════════════════════════════════════════════════════════════════

router.get('/routes', requireTeam, async (req, res) => {
  try {
    const { city, theme, status, limit = '50', offset = '0' } = req.query as Record<string, string>;
    const where: any = {};
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (theme) where.theme = theme;
    if (status) where.status = status;

    const [routes, total] = await Promise.all([
      prisma.atlasCuratedRoute.findMany({ where, orderBy: { updatedAt: 'desc' }, take: parseInt(limit), skip: parseInt(offset) }),
      prisma.atlasCuratedRoute.count({ where }),
    ]);
    res.json({ routes, total });
  } catch (error) {
    res.status(500).json({ error: 'Erreur liste parcours' });
  }
});

router.get('/routes/:id', requireTeam, async (req, res) => {
  try {
    const route = await prisma.atlasCuratedRoute.findUnique({ where: { id: req.params.id } });
    if (!route) { res.status(404).json({ error: 'Parcours non trouvé' }); return; }
    res.json(route);
  } catch (error) {
    res.status(500).json({ error: 'Erreur détail parcours' });
  }
});

router.post('/routes', requireTeam, async (req, res) => {
  try {
    const route = await prisma.atlasCuratedRoute.create({
      data: { ...req.body, createdBy: (req as any).teamUserId },
    });
    console.log(`[ATLAS] Parcours créé: ${route.name} (${route.city}) par ${route.createdBy}`);
    res.status(201).json(route);
  } catch (error) {
    res.status(500).json({ error: 'Erreur création parcours' });
  }
});

router.put('/routes/:id', requireTeam, async (req, res) => {
  try {
    const { id, createdBy, createdAt, ...data } = req.body;
    const route = await prisma.atlasCuratedRoute.update({ where: { id: req.params.id }, data });
    res.json(route);
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise à jour parcours' });
  }
});

router.delete('/routes/:id', requireTeam, async (req, res) => {
  try {
    await prisma.atlasCuratedRoute.update({ where: { id: req.params.id }, data: { status: 'archived' } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur archivage parcours' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// STATS & SEARCH
// ═══════════════════════════════════════════════════════════════════════════

router.get('/stats', requireTeam, async (_req, res) => {
  try {
    const [totalVenues, publishedVenues, totalGuides, totalRoutes, venuesByType] = await Promise.all([
      prisma.atlasVenue.count(),
      prisma.atlasVenue.count({ where: { status: 'published' } }),
      prisma.atlasCityGuide.count(),
      prisma.atlasCuratedRoute.count(),
      prisma.atlasVenue.groupBy({ by: ['type'], _count: { id: true } }),
    ]);
    res.json({
      venues: { total: totalVenues, published: publishedVenues, byType: venuesByType.reduce((acc: any, g) => { acc[g.type] = g._count.id; return acc; }, {}) },
      cityGuides: { total: totalGuides },
      routes: { total: totalRoutes },
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur stats atlas' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC — Fiches publiées pour l'IA et les users Premium/Privé
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/atlas/public/venues?city=...  — Utilisé par le LLM pour enrichir les recommandations
router.get('/public/venues', async (req, res) => {
  try {
    const { city, type, limit = '20' } = req.query as Record<string, string>;
    const where: any = { status: 'published' };
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (type) where.type = type;

    const venues = await prisma.atlasVenue.findMany({
      where,
      select: {
        id: true, name: true, type: true, city: true, country: true, address: true,
        phone: true, website: true, socialLinks: true, photos: true, description: true,
        insiderTips: true, testedByBaymora: true, rating: true, priceLevel: true,
        priceFrom: true, currency: true, tags: true, ambiance: true, seasonalNotes: true,
        affiliateType: true, affiliateUrl: true, isPartner: true,
      },
      orderBy: [{ testedByBaymora: 'desc' }, { rating: 'desc' }],
      take: parseInt(limit),
    });
    res.json(venues);
  } catch (error) {
    res.status(500).json({ error: 'Erreur venues publiques' });
  }
});

// GET /api/atlas/public/city-guide?city=... — Guide ville pour l'IA
router.get('/public/city-guide', async (req, res) => {
  try {
    const { city } = req.query as Record<string, string>;
    if (!city) { res.status(400).json({ error: 'Paramètre city requis' }); return; }
    const guide = await prisma.atlasCityGuide.findFirst({
      where: { city: { contains: city, mode: 'insensitive' }, status: 'published' },
    });
    res.json(guide || null);
  } catch (error) {
    res.status(500).json({ error: 'Erreur guide public' });
  }
});

// GET /api/atlas/public/routes?city=... — Parcours curatés pour l'IA
router.get('/public/routes', async (req, res) => {
  try {
    const { city, theme, limit = '10' } = req.query as Record<string, string>;
    const where: any = { status: 'published' };
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (theme) where.theme = theme;

    const routes = await prisma.atlasCuratedRoute.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit),
    });
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: 'Erreur parcours publics' });
  }
});

export default router;
