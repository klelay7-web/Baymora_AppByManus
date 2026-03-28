import { Router, RequestHandler } from 'express';
import { verifyToken } from '../services/auth';
import { prisma } from '../db';

const router = Router();

// ─── Middleware owner ──────────────────────────────────────────────────────────

const requireOwner: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ error: 'Non autorisé' }); return; }
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'owner') { res.status(403).json({ error: 'Accès réservé à l\'administration' }); return; }
  (req as any).adminUser = decoded;
  next();
};

// ─── GET /api/admin/stats ──────────────────────────────────────────────────────

router.get('/stats', requireOwner, async (_req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersToday,
      newUsersWeek,
      totalConversations,
      totalMessages,
      messagesWeek,
      usersByCircle,
      paidUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.message.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.groupBy({ by: ['circle'], _count: { id: true } }),
      prisma.user.count({ where: { circle: { not: 'decouverte' } } }),
    ]);

    res.json({
      users: {
        total: totalUsers,
        today: newUsersToday,
        thisWeek: newUsersWeek,
        paid: paidUsers,
        byCircle: usersByCircle.reduce((acc: Record<string, number>, g) => {
          acc[g.circle] = g._count.id;
          return acc;
        }, {}),
      },
      conversations: { total: totalConversations },
      messages: { total: totalMessages, thisWeek: messagesWeek },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Erreur stats' });
  }
});

// ─── GET /api/admin/users ──────────────────────────────────────────────────────

router.get('/users', requireOwner, async (req, res) => {
  try {
    const { search, circle, limit = '50', offset = '0' } = req.query as Record<string, string>;

    const where: any = {};
    if (search) {
      where.OR = [
        { pseudo: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (circle) where.circle = circle;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, pseudo: true, prenom: true, email: true,
          circle: true, mode: true, messagesUsed: true, messagesLimit: true,
          createdAt: true, updatedAt: true,
          _count: { select: { conversations: true, companions: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Erreur liste utilisateurs' });
  }
});

// ─── PATCH /api/admin/users/:id/circle ────────────────────────────────────────

router.patch('/users/:id/circle', requireOwner, async (req, res) => {
  try {
    const { circle } = req.body;
    const valid = ['decouverte', 'essentiel', 'elite', 'prive', 'fondateur'];
    if (!valid.includes(circle)) {
      res.status(400).json({ error: 'Circle invalide' }); return;
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { circle },
      select: { id: true, pseudo: true, circle: true },
    });
    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Erreur mise à jour circle' });
  }
});

// ─── PATCH /api/admin/users/:id/messages ──────────────────────────────────────

router.patch('/users/:id/messages', requireOwner, async (req, res) => {
  try {
    const { messagesLimit } = req.body;
    if (typeof messagesLimit !== 'number' || messagesLimit < 0) {
      res.status(400).json({ error: 'messagesLimit invalide' }); return;
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { messagesLimit },
      select: { id: true, pseudo: true, messagesLimit: true },
    });
    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Erreur mise à jour limite' });
  }
});

export default router;
