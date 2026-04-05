/**
 * Baymora — In-App Notifications Inbox
 * Polling-based notification system (no WebSocket)
 */

import { Router, RequestHandler } from 'express';
import { prisma } from '../db';

const router = Router();

// ─── Auth middleware ──────────────────────────────────────────────────────────

const requireUser: RequestHandler = (req, res, next) => {
  const user = (req as any).baymoraUser;
  if (!user) { res.status(401).json({ error: 'Non authentifié' }); return; }
  next();
};

// ─── Helper: create a notification ───────────────────────────────────────────

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data: Record<string, any> = {},
) {
  return prisma.notification.create({
    data: { userId, type, title, message, data },
  });
}

// ─── GET / — list notifications (newest first, limit 50) ────────────────────

router.get('/', requireUser, (async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ notifications });
  } catch (err) {
    console.error('[inbox] list error', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}) as RequestHandler);

// ─── GET /unread-count — number of unread notifications ─────────────────────

router.get('/unread-count', requireUser, (async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    const count = await prisma.notification.count({
      where: { userId: user.id, read: false },
    });
    res.json({ count });
  } catch (err) {
    console.error('[inbox] unread-count error', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}) as RequestHandler);

// ─── PATCH /:id/read — mark one notification as read ────────────────────────

router.patch('/:id/read', requireUser, (async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    const { id } = req.params;

    const notification = await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { read: true },
    });

    if (notification.count === 0) {
      res.status(404).json({ error: 'Notification introuvable' });
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[inbox] mark-read error', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}) as RequestHandler);

// ─── POST /read-all — mark all notifications as read ────────────────────────

router.post('/read-all', requireUser, (async (req, res) => {
  try {
    const user = (req as any).baymoraUser;

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[inbox] read-all error', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}) as RequestHandler);

export default router;
