/**
 * Baymora — Routes Conciergerie
 * Demandes clients + fil de discussion admin/client
 */

import { Router, RequestHandler } from 'express';
import { prisma } from '../db';
import { sendEmail } from '../services/email';
import { sendNotification } from '../services/sms';
import { verifyToken } from '../services/auth';

const router = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'conciergerie@baymora.com';

// ─── Middlewares ──────────────────────────────────────────────────────────────

const requireUser: RequestHandler = (req, res, next) => {
  const user = (req as any).baymoraUser;
  if (!user) { res.status(401).json({ error: 'Non authentifié' }); return; }
  next();
};

const requireOwner: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ error: 'Non autorisé' }); return; }
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'owner') {
    res.status(403).json({ error: 'Accès réservé' }); return;
  }
  (req as any).adminUser = decoded;
  next();
};

// ─── Statuts & priorités ─────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending:     'En attente',
  in_progress: 'En cours',
  completed:   'Traité',
  cancelled:   'Annulé',
};

const PRIORITY_LABELS: Record<string, string> = {
  normal: 'Normal',
  high:   'Prioritaire',
  urgent: 'Urgent',
};

// ─── Email admin — nouvelle demande ──────────────────────────────────────────

async function notifyAdminNewRequest(req: any, user: any) {
  const subject = `[Conciergerie] Nouvelle demande — ${req.title}`;
  const html = `
    <h2>Nouvelle demande de conciergerie</h2>
    <p><strong>Client :</strong> ${user.prenom || user.pseudo}${user.email ? ` (${user.email})` : ''}</p>
    <p><strong>Titre :</strong> ${req.title}</p>
    ${req.destination ? `<p><strong>Destination :</strong> ${req.destination}</p>` : ''}
    ${req.dates ? `<p><strong>Dates :</strong> ${req.dates}</p>` : ''}
    ${req.travelers ? `<p><strong>Voyageurs :</strong> ${req.travelers}</p>` : ''}
    ${req.budget ? `<p><strong>Budget :</strong> ${req.budget}</p>` : ''}
    <hr/>
    <p><strong>Message :</strong><br/>${req.message.replace(/\n/g, '<br/>')}</p>
    <hr/>
    <p><a href="${process.env.APP_URL || 'https://baymora.com'}/admin/dashboard">Voir dans l'admin →</a></p>
  `;
  await sendEmail(ADMIN_EMAIL, subject, html);
}

// ─── Email client — réponse admin ────────────────────────────────────────────

async function notifyClientReply(userEmail: string, userName: string, requestTitle: string, replyContent: string) {
  const subject = `Réponse Baymora — ${requestTitle}`;
  const html = `
    <h2>Baymora Conciergerie</h2>
    <p>Bonjour ${userName},</p>
    <p>L'équipe Baymora a répondu à votre demande <strong>"${requestTitle}"</strong> :</p>
    <blockquote style="border-left:3px solid #c8a94a;padding-left:16px;color:#555;margin:16px 0;">
      ${replyContent.replace(/\n/g, '<br/>')}
    </blockquote>
    <p><a href="${process.env.APP_URL || 'https://baymora.com'}/conciergerie">Voir votre demande →</a></p>
    <p style="color:#999;font-size:12px;">— L'équipe Baymora</p>
  `;
  await sendEmail(userEmail, subject, html);
}

// ─── POST /api/concierge — nouvelle demande ───────────────────────────────────

router.post('/', requireUser, async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    const { title, destination, dates, travelers, budget, message } = req.body;

    if (!message || message.trim().length < 10) {
      res.status(400).json({ error: 'Message trop court (minimum 10 caractères)' }); return;
    }

    const conciergeReq = await prisma.conciergeRequest.create({
      data: {
        userId: user.id,
        title: (title || message.slice(0, 60)).trim(),
        destination: destination || null,
        dates: dates || null,
        travelers: travelers ? Number(travelers) : null,
        budget: budget || null,
        message: message.trim(),
        status: 'pending',
        priority: 'normal',
      },
      include: { messages: true },
    });

    // Notification admin
    try {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { pseudo: true, prenom: true, email: true } });
      if (dbUser) await notifyAdminNewRequest(conciergeReq, dbUser);
    } catch (e) { console.error('[CONCIERGE] Email admin failed:', e); }

    res.status(201).json({ request: conciergeReq });
  } catch (err) {
    console.error('[CONCIERGE] Erreur création:', err);
    res.status(500).json({ error: 'Erreur création demande' });
  }
});

// ─── GET /api/concierge — liste des demandes du user ─────────────────────────

router.get('/', requireUser, async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    const requests = await prisma.conciergeRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        _count: { select: { messages: true } },
      },
    });
    res.json({ requests });
  } catch (err) {
    console.error('[CONCIERGE] Erreur liste:', err);
    res.status(500).json({ error: 'Erreur chargement demandes' });
  }
});

// ─── GET /api/concierge/:id ───────────────────────────────────────────────────

router.get('/:id', requireUser, async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    const request = await prisma.conciergeRequest.findUnique({
      where: { id: req.params.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!request) { res.status(404).json({ error: 'Demande introuvable' }); return; }
    if (request.userId !== user.id) { res.status(403).json({ error: 'Accès refusé' }); return; }
    res.json({ request });
  } catch (err) {
    console.error('[CONCIERGE] Erreur récupération:', err);
    res.status(500).json({ error: 'Erreur chargement demande' });
  }
});

// ─── POST /api/concierge/:id/messages — ajouter un message (client) ───────────

router.post('/:id/messages', requireUser, async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    const { content } = req.body;
    if (!content?.trim()) { res.status(400).json({ error: 'Message vide' }); return; }

    const request = await prisma.conciergeRequest.findUnique({ where: { id: req.params.id } });
    if (!request) { res.status(404).json({ error: 'Demande introuvable' }); return; }
    if (request.userId !== user.id) { res.status(403).json({ error: 'Accès refusé' }); return; }

    const message = await prisma.conciergeMessage.create({
      data: { requestId: req.params.id, fromAdmin: false, content: content.trim() },
    });
    // Mise à jour updatedAt
    await prisma.conciergeRequest.update({ where: { id: req.params.id }, data: { updatedAt: new Date() } });

    res.status(201).json({ message });
  } catch (err) {
    console.error('[CONCIERGE] Erreur message client:', err);
    res.status(500).json({ error: 'Erreur envoi message' });
  }
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────

// GET /api/concierge/admin/list
router.get('/admin/list', requireOwner, async (req, res) => {
  try {
    const { status, priority } = req.query as Record<string, string>;
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const requests = await prisma.conciergeRequest.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { id: true, pseudo: true, prenom: true, email: true, circle: true, clubPoints: true, phone: true, notifWhatsApp: true, notifSms: true } },
        messages: { orderBy: { createdAt: 'asc' } },
        _count: { select: { messages: true } },
      },
    });
    res.json({ requests, total: requests.length });
  } catch (err) {
    console.error('[CONCIERGE] Erreur admin list:', err);
    res.status(500).json({ error: 'Erreur chargement' });
  }
});

// GET /api/concierge/admin/stats
router.get('/admin/stats', requireOwner, async (_req, res) => {
  try {
    const [total, pending, in_progress, completed] = await Promise.all([
      prisma.conciergeRequest.count(),
      prisma.conciergeRequest.count({ where: { status: 'pending' } }),
      prisma.conciergeRequest.count({ where: { status: 'in_progress' } }),
      prisma.conciergeRequest.count({ where: { status: 'completed' } }),
    ]);
    res.json({ total, pending, in_progress, completed });
  } catch (err) {
    console.error('[CONCIERGE] Erreur admin stats:', err);
    res.status(500).json({ error: 'Erreur stats' });
  }
});

// PATCH /api/concierge/admin/:id — changer statut, priorité, assigné
router.patch('/admin/:id', requireOwner, async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.body;
    const data: any = {};
    if (status && ['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) data.status = status;
    if (priority && ['normal', 'high', 'urgent'].includes(priority)) data.priority = priority;
    if (assignedTo !== undefined) data.assignedTo = assignedTo || null;

    const updated = await prisma.conciergeRequest.update({
      where: { id: req.params.id },
      data,
      include: { user: { select: { email: true, prenom: true, pseudo: true, phone: true, notifWhatsApp: true, notifSms: true } } },
    });

    // Notifier le client si statut change vers in_progress ou completed
    if (status === 'in_progress' || status === 'completed') {
      const u = updated.user;
      const label = STATUS_LABELS[status];
      const msg = `📋 Baymora Conciergerie\nVotre demande "${updated.title}" est maintenant : ${label}.\nConsultez le suivi sur baymora.com/conciergerie`;
      if (u.phone && (u.notifWhatsApp || u.notifSms)) {
        try {
          await sendNotification({ phone: u.phone, notifSms: u.notifSms, notifWhatsApp: u.notifWhatsApp }, msg);
        } catch (e) { console.error('[CONCIERGE] Notif SMS failed:', e); }
      }
    }

    res.json({ request: updated });
  } catch (err) {
    console.error('[CONCIERGE] Erreur admin patch:', err);
    res.status(500).json({ error: 'Erreur mise à jour' });
  }
});

// POST /api/concierge/admin/:id/messages — réponse admin
router.post('/admin/:id/messages', requireOwner, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) { res.status(400).json({ error: 'Message vide' }); return; }

    const request = await prisma.conciergeRequest.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { email: true, prenom: true, pseudo: true, phone: true, notifWhatsApp: true, notifSms: true } } },
    });
    if (!request) { res.status(404).json({ error: 'Demande introuvable' }); return; }

    const message = await prisma.conciergeMessage.create({
      data: { requestId: req.params.id, fromAdmin: true, content: content.trim() },
    });

    await prisma.conciergeRequest.update({
      where: { id: req.params.id },
      data: { status: 'in_progress', updatedAt: new Date() },
    });

    // Notifier le client
    const u = request.user;
    const name = u.prenom || u.pseudo;
    if (u.email) {
      try { await notifyClientReply(u.email, name, request.title, content.trim()); }
      catch (e) { console.error('[CONCIERGE] Email client failed:', e); }
    }
    if (u.phone && (u.notifWhatsApp || u.notifSms)) {
      const smsMsg = `💬 Baymora Conciergerie\nBonjour ${name}, l'équipe a répondu à votre demande "${request.title}".\n\n${content.slice(0, 160)}${content.length > 160 ? '...' : ''}\n\nConsultez : baymora.com/conciergerie`;
      try { await sendNotification({ phone: u.phone, notifSms: u.notifSms, notifWhatsApp: u.notifWhatsApp }, smsMsg); }
      catch (e) { console.error('[CONCIERGE] SMS client failed:', e); }
    }

    res.status(201).json({ message });
  } catch (err) {
    console.error('[CONCIERGE] Erreur admin reply:', err);
    res.status(500).json({ error: 'Erreur envoi réponse' });
  }
});

export { STATUS_LABELS, PRIORITY_LABELS };
export default router;
