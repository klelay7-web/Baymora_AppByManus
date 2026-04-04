/**
 * OFF-MARKET — Pépites secrètes, lieux cachés, produits rares
 *
 * Réservé aux membres Privé (ou déblocable par points pour Premium).
 * Admin/équipe peut créer et gérer les items off-market.
 */

import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

const requireTeam = (req: any, res: any, next: any) => {
  const baymoraUser = req.baymoraUser;
  if (baymoraUser?.id) { req.teamUserId = baymoraUser.id; return next(); }
  const adminSecret = req.headers['x-admin-secret'] as string;
  if (adminSecret && adminSecret === (process.env.ADMIN_SECRET || '').trim()) { req.teamUserId = 'admin'; return next(); }
  res.status(403).json({ error: 'Accès réservé' });
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN — CRUD off-market items
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/admin/items', requireTeam, async (req, res) => {
  try {
    const { type, city, status, limit = '50' } = req.query as Record<string, string>;
    const where: any = {};
    if (type) where.type = type;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.offMarketItem.findMany({ where, orderBy: { updatedAt: 'desc' }, take: parseInt(limit) }),
      prisma.offMarketItem.count({ where }),
    ]);
    res.json({ items, total });
  } catch (error) {
    res.status(500).json({ error: 'Erreur liste off-market' });
  }
});

router.post('/admin/items', requireTeam, async (req: any, res) => {
  try {
    const item = await prisma.offMarketItem.create({
      data: { ...req.body, createdBy: req.teamUserId },
    });
    console.log(`[OFFMARKET] Item créé: ${item.name} (${item.type})`);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erreur création' });
  }
});

router.put('/admin/items/:id', requireTeam, async (req, res) => {
  try {
    const { id, createdBy, createdAt, ...data } = req.body;
    const item = await prisma.offMarketItem.update({ where: { id: req.params.id }, data });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise à jour' });
  }
});

router.delete('/admin/items/:id', requireTeam, async (req, res) => {
  try {
    await prisma.offMarketItem.update({ where: { id: req.params.id }, data: { status: 'archived' } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur archivage' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC — Items off-market pour les membres Privé
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/items', async (req, res) => {
  try {
    const { type, city, limit = '20' } = req.query as Record<string, string>;
    const where: any = { status: 'published' };
    if (type) where.type = type;
    if (city) where.city = { contains: city, mode: 'insensitive' };

    const items = await prisma.offMarketItem.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit),
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Erreur off-market' });
  }
});

export default router;
