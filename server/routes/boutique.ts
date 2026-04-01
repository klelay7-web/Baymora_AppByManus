/**
 * BOUTIQUE BAYMORA — Produits affiliés premium
 *
 * Pas de stock, pas de livraison. Baymora prend la commission sur les ventes.
 * L'IA recommande des produits dans la conversation quand pertinent
 * (anniversaires, cadeaux, occasions).
 */

import { Router } from 'express';
import { prisma } from '../db';
import { verifyToken } from '../services/auth';

const router = Router();

// ─── Middleware admin ────────────────────────────────────────────────────────

const requireTeam = (req: any, res: any, next: any) => {
  const baymoraUser = req.baymoraUser;
  if (baymoraUser?.id) { req.teamUserId = baymoraUser.id; return next(); }
  const adminSecret = req.headers['x-admin-secret'] as string;
  if (adminSecret && adminSecret === (process.env.ADMIN_SECRET || '').trim()) { req.teamUserId = 'admin'; return next(); }
  res.status(403).json({ error: 'Accès réservé' });
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN — CRUD produits boutique
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/boutique/admin/items — Liste tous les produits
router.get('/admin/items', requireTeam, async (req, res) => {
  try {
    const { category, status, search, limit = '50', offset = '0' } = req.query as Record<string, string>;
    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
    ];

    const [items, total] = await Promise.all([
      prisma.boutiqueItem.findMany({ where, orderBy: { updatedAt: 'desc' }, take: parseInt(limit), skip: parseInt(offset) }),
      prisma.boutiqueItem.count({ where }),
    ]);
    res.json({ items, total });
  } catch (error) {
    res.status(500).json({ error: 'Erreur liste boutique' });
  }
});

// POST /api/boutique/admin/items — Créer un produit
router.post('/admin/items', requireTeam, async (req: any, res) => {
  try {
    const item = await prisma.boutiqueItem.create({
      data: { ...req.body, createdBy: req.teamUserId },
    });
    console.log(`[BOUTIQUE] Produit créé: ${item.name} (${item.category})`);
    res.status(201).json(item);
  } catch (error) {
    console.error('[BOUTIQUE] Create error:', error);
    res.status(500).json({ error: 'Erreur création produit' });
  }
});

// PUT /api/boutique/admin/items/:id — Modifier un produit
router.put('/admin/items/:id', requireTeam, async (req, res) => {
  try {
    const { id, createdBy, createdAt, ...data } = req.body;
    const item = await prisma.boutiqueItem.update({ where: { id: req.params.id }, data });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise à jour produit' });
  }
});

// DELETE /api/boutique/admin/items/:id — Archiver un produit
router.delete('/admin/items/:id', requireTeam, async (req, res) => {
  try {
    await prisma.boutiqueItem.update({ where: { id: req.params.id }, data: { status: 'archived' } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur archivage produit' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC — Boutique visible par les clients
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/boutique/items — Produits publiés (pour les clients Premium+)
router.get('/items', async (req, res) => {
  try {
    const { category, occasion, featured, limit = '20' } = req.query as Record<string, string>;
    const where: any = { status: 'published' };
    if (category) where.category = category;
    if (occasion) where.occasion = occasion;
    if (featured === 'true') where.featured = true;

    const items = await prisma.boutiqueItem.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
      take: parseInt(limit),
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Erreur boutique' });
  }
});

// GET /api/boutique/suggestions — Suggestions IA pour cadeaux (utilisé par le LLM)
router.get('/suggestions', async (req, res) => {
  try {
    const { relation, occasion, maxPrice, category } = req.query as Record<string, string>;
    const where: any = { status: 'published' };
    if (category) where.category = category;
    if (occasion) where.occasion = occasion;
    if (relation) where.targetRelation = { contains: relation };
    if (maxPrice) where.priceEur = { lte: parseFloat(maxPrice) };

    const items = await prisma.boutiqueItem.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { priceEur: 'asc' }],
      take: 5,
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Erreur suggestions' });
  }
});

export default router;
