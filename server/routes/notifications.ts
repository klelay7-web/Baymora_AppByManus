/**
 * Baymora — Routes Notifications SMS / WhatsApp
 */

import { Router, RequestHandler } from 'express';
import { prisma } from '../db';
import { sendNotification, sendSMS, sendWhatsApp, NotifTemplates } from '../services/sms';
import { verifyToken } from '../services/auth';

const router = Router();

// ─── Auth middleware ──────────────────────────────────────────────────────────

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

// ─── GET /api/notifications/prefs — lire les préférences ─────────────────────

router.get('/prefs', requireUser, async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        phone: true,
        notifSms: true,
        notifWhatsApp: true,
        notifFlights: true,
        notifCheckin: true,
        notifBirthdays: true,
        notifOffers: true,
      },
    });
    if (!dbUser) { res.status(404).json({ error: 'Utilisateur introuvable' }); return; }
    res.json(dbUser);
  } catch (err) {
    console.error('[NOTIF] Erreur prefs:', err);
    res.status(500).json({ error: 'Erreur chargement préférences' });
  }
});

// ─── PATCH /api/notifications/prefs — modifier les préférences ───────────────

router.patch('/prefs', requireUser, async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    const {
      phone,
      notifSms,
      notifWhatsApp,
      notifFlights,
      notifCheckin,
      notifBirthdays,
      notifOffers,
    } = req.body;

    // Validation numéro de téléphone (format E.164 minimal)
    if (phone !== undefined && phone !== null && phone !== '') {
      const cleaned = phone.replace(/\s/g, '');
      if (!/^\+[1-9]\d{6,14}$/.test(cleaned)) {
        res.status(400).json({ error: 'Format téléphone invalide (ex: +33612345678)' });
        return;
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(phone !== undefined && { phone: phone || null }),
        ...(notifSms !== undefined && { notifSms: Boolean(notifSms) }),
        ...(notifWhatsApp !== undefined && { notifWhatsApp: Boolean(notifWhatsApp) }),
        ...(notifFlights !== undefined && { notifFlights: Boolean(notifFlights) }),
        ...(notifCheckin !== undefined && { notifCheckin: Boolean(notifCheckin) }),
        ...(notifBirthdays !== undefined && { notifBirthdays: Boolean(notifBirthdays) }),
        ...(notifOffers !== undefined && { notifOffers: Boolean(notifOffers) }),
      },
      select: {
        phone: true,
        notifSms: true,
        notifWhatsApp: true,
        notifFlights: true,
        notifCheckin: true,
        notifBirthdays: true,
        notifOffers: true,
      },
    });

    res.json({ success: true, prefs: updated });
  } catch (err) {
    console.error('[NOTIF] Erreur update prefs:', err);
    res.status(500).json({ error: 'Erreur mise à jour préférences' });
  }
});

// ─── POST /api/notifications/test — envoyer un SMS de test ───────────────────

router.post('/test', requireUser, async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    const { channel } = req.body; // 'sms' | 'whatsapp'

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { phone: true, prenom: true, pseudo: true },
    });

    if (!dbUser?.phone) {
      res.status(400).json({ error: 'Aucun numéro de téléphone configuré' });
      return;
    }

    const name = dbUser.prenom ?? dbUser.pseudo;
    const message = `✅ Baymora — Test notification\nBonjour ${name} ! Vos notifications sont bien actives. 💎`;

    if (channel === 'whatsapp') {
      await sendWhatsApp(dbUser.phone, message);
    } else {
      await sendSMS(dbUser.phone, message);
    }

    res.json({ success: true, message: `Message de test envoyé par ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}` });
  } catch (err: any) {
    console.error('[NOTIF] Erreur test:', err);
    res.status(500).json({ error: err?.message ?? 'Erreur envoi test' });
  }
});

// ─── Routes admin ─────────────────────────────────────────────────────────────

// POST /api/notifications/admin/broadcast — envoyer à tous les membres notif activée
router.post('/admin/broadcast', requireOwner, async (req, res) => {
  try {
    const { message, channel, tierMin } = req.body;
    if (!message) { res.status(400).json({ error: 'message requis' }); return; }

    // Récupérer les membres avec le channel activé
    const where: any = { phone: { not: null } };
    if (channel === 'sms') where.notifSms = true;
    if (channel === 'whatsapp') where.notifWhatsApp = true;

    // Filtre par tier minimum si précisé
    const TIER_MIN_POINTS: Record<string, number> = { crystal: 0, gold: 500, platinum: 2000, diamond: 5000 };
    if (tierMin && TIER_MIN_POINTS[tierMin] !== undefined) {
      where.clubPoints = { gte: TIER_MIN_POINTS[tierMin] };
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true, phone: true, prenom: true, pseudo: true, notifSms: true, notifWhatsApp: true },
    });

    let sent = 0;
    let failed = 0;

    for (const u of users) {
      if (!u.phone) continue;
      try {
        await sendNotification(
          { phone: u.phone, notifSms: u.notifSms, notifWhatsApp: u.notifWhatsApp },
          message
        );
        sent++;
      } catch {
        failed++;
      }
    }

    res.json({ success: true, sent, failed, total: users.length });
  } catch (err) {
    console.error('[NOTIF] Erreur broadcast:', err);
    res.status(500).json({ error: 'Erreur broadcast' });
  }
});

// POST /api/notifications/admin/send — envoyer à un membre spécifique
router.post('/admin/send', requireOwner, async (req, res) => {
  try {
    const { userId, message, channel } = req.body;
    if (!userId || !message) { res.status(400).json({ error: 'userId et message requis' }); return; }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, prenom: true, pseudo: true },
    });

    if (!dbUser?.phone) {
      res.status(400).json({ error: 'Ce membre n\'a pas de numéro configuré' });
      return;
    }

    if (channel === 'whatsapp') {
      await sendWhatsApp(dbUser.phone, message);
    } else {
      await sendSMS(dbUser.phone, message);
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('[NOTIF] Erreur admin send:', err);
    res.status(500).json({ error: err?.message ?? 'Erreur envoi' });
  }
});

// GET /api/notifications/admin/stats — statistiques notifications
router.get('/admin/stats', requireOwner, async (_req, res) => {
  try {
    const [total, withPhone, smsEnabled, waEnabled] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { phone: { not: null } } }),
      prisma.user.count({ where: { notifSms: true, phone: { not: null } } }),
      prisma.user.count({ where: { notifWhatsApp: true, phone: { not: null } } }),
    ]);

    res.json({ totalMembers: total, withPhone, smsEnabled, whatsAppEnabled: waEnabled });
  } catch (err) {
    console.error('[NOTIF] Erreur admin stats:', err);
    res.status(500).json({ error: 'Erreur stats' });
  }
});

export { NotifTemplates };
export default router;
