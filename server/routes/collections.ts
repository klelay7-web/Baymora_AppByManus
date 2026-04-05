/**
 * COLLECTIONS — Système de sauvegarde type Pinterest
 *
 * Les utilisateurs peuvent sauvegarder des lieux, restos, hôtels
 * dans des collections personnalisées, les partager, et les retrouver.
 *
 * Limites par plan :
 * - Découverte : 1 collection, 5 items max
 * - Premium : 10 collections, items illimités
 * - Privé : illimité + collections collaboratives
 */

import { Router } from 'express';
import { prisma } from '../db';
import crypto from 'crypto';
import { normalizeCircle } from '../types';

const router = Router();

const requireUser = (req: any, res: any, next: any) => {
  if (!req.baymoraUser?.id) { res.status(401).json({ error: 'Authentification requise' }); return; }
  next();
};

const COLLECTION_LIMITS: Record<string, { maxCollections: number; maxItems: number }> = {
  decouverte: { maxCollections: 1, maxItems: 5 },
  premium: { maxCollections: 10, maxItems: -1 },
  prive: { maxCollections: -1, maxItems: -1 },
};

function getLimits(circle: string) {
  return COLLECTION_LIMITS[normalizeCircle(circle)] || COLLECTION_LIMITS.decouverte;
}

// ─── GET /api/collections — Mes collections ─────────────────────────────────

router.get('/', requireUser, async (req: any, res) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { userId: req.baymoraUser.id },
      include: { items: { orderBy: { position: 'asc' }, take: 4 } }, // preview 4 items
      orderBy: { updatedAt: 'desc' },
    });
    const limits = getLimits(req.baymoraUser.circle);
    res.json({ collections, limits });
  } catch (error) {
    res.status(500).json({ error: 'Erreur chargement collections' });
  }
});

// ─── POST /api/collections — Créer une collection ───────────────────────────

router.post('/', requireUser, async (req: any, res) => {
  try {
    const limits = getLimits(req.baymoraUser.circle);
    if (limits.maxCollections !== -1) {
      const count = await prisma.collection.count({ where: { userId: req.baymoraUser.id } });
      if (count >= limits.maxCollections) {
        res.status(403).json({ error: `Limite atteinte (${limits.maxCollections} collections). Passez au plan supérieur.`, upgrade: true });
        return;
      }
    }

    const { name, description, emoji } = req.body;
    if (!name) { res.status(400).json({ error: 'Nom requis' }); return; }

    const collection = await prisma.collection.create({
      data: {
        userId: req.baymoraUser.id,
        name,
        description: description || null,
        emoji: emoji || '📌',
      },
    });
    res.status(201).json(collection);
  } catch (error) {
    res.status(500).json({ error: 'Erreur création collection' });
  }
});

// ─── POST /api/collections/:id/items — Ajouter un item ──────────────────────

router.post('/:id/items', requireUser, async (req: any, res) => {
  try {
    const collection = await prisma.collection.findFirst({
      where: { id: req.params.id, userId: req.baymoraUser.id },
      include: { _count: { select: { items: true } } },
    });
    if (!collection) { res.status(404).json({ error: 'Collection non trouvée' }); return; }

    const limits = getLimits(req.baymoraUser.circle);
    if (limits.maxItems !== -1 && collection._count.items >= limits.maxItems) {
      res.status(403).json({ error: `Limite atteinte (${limits.maxItems} items). Passez au plan supérieur.`, upgrade: true });
      return;
    }

    const { type, name, city, description, photo, priceRange, rating, bookingUrl, sourceId, notes } = req.body;
    if (!name || !type) { res.status(400).json({ error: 'Nom et type requis' }); return; }

    const item = await prisma.collectionItem.create({
      data: {
        collectionId: req.params.id,
        type, name, city, description, photo, priceRange, rating, bookingUrl, sourceId, notes,
        position: collection._count.items,
      },
    });

    await prisma.collection.update({ where: { id: req.params.id }, data: { updatedAt: new Date() } });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erreur ajout item' });
  }
});

// ─── DELETE /api/collections/:id/items/:itemId ───────────────────────────────

router.delete('/:id/items/:itemId', requireUser, async (req: any, res) => {
  try {
    const collection = await prisma.collection.findFirst({ where: { id: req.params.id, userId: req.baymoraUser.id } });
    if (!collection) { res.status(404).json({ error: 'Collection non trouvée' }); return; }
    await prisma.collectionItem.delete({ where: { id: req.params.itemId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression item' });
  }
});

// ─── GET /api/collections/:id — Détail d'une collection ─────────────────────

router.get('/:id', requireUser, async (req: any, res) => {
  try {
    const collection = await prisma.collection.findFirst({
      where: { id: req.params.id, userId: req.baymoraUser.id },
      include: { items: { orderBy: { position: 'asc' } } },
    });
    if (!collection) { res.status(404).json({ error: 'Collection non trouvée' }); return; }
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: 'Erreur collection' });
  }
});

// ─── DELETE /api/collections/:id — Supprimer une collection ──────────────────

router.delete('/:id', requireUser, async (req: any, res) => {
  try {
    const collection = await prisma.collection.findFirst({ where: { id: req.params.id, userId: req.baymoraUser.id } });
    if (!collection) { res.status(404).json({ error: 'Collection non trouvée' }); return; }
    await prisma.collection.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression collection' });
  }
});

// ─── POST /api/collections/:id/share — Partager une collection ───────────────

router.post('/:id/share', requireUser, async (req: any, res) => {
  try {
    const collection = await prisma.collection.findFirst({ where: { id: req.params.id, userId: req.baymoraUser.id } });
    if (!collection) { res.status(404).json({ error: 'Collection non trouvée' }); return; }

    const shareCode = collection.shareCode || `COL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    await prisma.collection.update({
      where: { id: req.params.id },
      data: { isPublic: true, shareCode },
    });

    res.json({ shareCode, shareUrl: `https://www.baymora.com/collections/${shareCode}` });
  } catch (error) {
    res.status(500).json({ error: 'Erreur partage' });
  }
});

// ─── GET /api/collections/shared/:code — Vue publique ────────────────────────

router.get('/shared/:code', async (req, res) => {
  try {
    const collection = await prisma.collection.findFirst({
      where: { shareCode: req.params.code, isPublic: true },
      include: { items: { orderBy: { position: 'asc' } }, user: { select: { pseudo: true, prenom: true } } },
    });
    if (!collection) { res.status(404).json({ error: 'Collection non trouvée' }); return; }

    await prisma.collection.update({ where: { id: collection.id }, data: { viewCount: { increment: 1 } } });
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: 'Erreur collection partagée' });
  }
});

export default router;
