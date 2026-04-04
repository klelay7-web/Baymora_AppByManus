import { Router, RequestHandler } from 'express';
import { verifyToken } from '../services/auth';
import { prisma } from '../db';
import { runAllManusMissions } from '../services/agents/manusMissions';
import { sendEmail, sendBetaInviteEmail } from '../services/email';
import { generateUserToken } from './users';
import { PLANS } from '../types';
import crypto from 'crypto';

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

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalUsers,
      newUsersToday,
      newUsersWeek,
      totalConversations,
      totalMessages,
      messagesWeek,
      usersByCircle,
      paidUsers,
      totalPurchases,
      monthlyPurchases,
      totalGifts,
      totalPartnerClicks,
      totalConversions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.message.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.groupBy({ by: ['circle'], _count: { id: true } }),
      prisma.user.count({ where: { circle: { not: 'decouverte' } } }),
      prisma.creditPurchase.aggregate({ _sum: { amountEur: true }, _count: { id: true } }),
      prisma.creditPurchase.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { amountEur: true },
        _count: { id: true },
      }),
      prisma.gift.count({ where: { status: 'claimed' } }),
      prisma.affiliateClick.count(),
      prisma.affiliateClick.count({ where: { converted: true } }),
    ]);

    // Calcul CA estimé (abonnements + achats)
    const premiumCount = paidUsers; // simplified
    const estimatedMRR = premiumCount * 14.90; // estimation basse (tous premium)
    const totalRevenue = (totalPurchases._sum.amountEur || 0) / 100; // cents → euros
    const monthlyRevenue = (monthlyPurchases._sum.amountEur || 0) / 100;

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
      revenue: {
        totalPurchases: totalRevenue,
        monthlyPurchases: monthlyRevenue,
        purchaseCount: totalPurchases._count.id,
        monthlyPurchaseCount: monthlyPurchases._count.id,
        estimatedMRR,
        giftsCompleted: totalGifts,
      },
      partners: {
        totalClicks: totalPartnerClicks,
        conversions: totalConversions,
        conversionRate: totalPartnerClicks > 0 ? Math.round((totalConversions / totalPartnerClicks) * 100) : 0,
      },
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
    const valid = ['decouverte', 'premium', 'prive', 'voyageur', 'explorateur', 'fondateur'];
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

// ─── POST /api/admin/grant-unlimited ─────────────────────────────────────────
// Route sécurisée par ADMIN_SECRET pour donner un accès illimité au owner.
// Usage : POST /api/admin/grant-unlimited { email, secret }

router.post('/grant-unlimited', async (req, res) => {
  try {
    const { email, secret } = req.body;
    const adminSecret = (process.env.ADMIN_SECRET || '').trim();

    console.log(`[ADMIN] grant-unlimited attempt | secret match: ${secret?.trim() === adminSecret} | env set: ${!!adminSecret}`);

    if (!adminSecret || secret?.trim() !== adminSecret) {
      res.status(403).json({ error: 'Secret invalide' });
      return;
    }

    if (!email) {
      res.status(400).json({ error: 'Email requis' });
      return;
    }

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    // Passer en fondateur avec crédits quasi-illimités
    await prisma.user.update({
      where: { id: user.id },
      data: {
        circle: 'fondateur',
        creditsLimit: 999999,
        creditsUsed: 0,
        perplexityLimit: -1,        // illimité
        perplexityUsed: 0,
        messagesLimit: 999999,
        messagesUsed: 0,
        creditsResetAt: new Date(2099, 11, 31), // ne reset jamais
      },
    });

    console.log(`[ADMIN] Accès illimité accordé à ${email} (${user.id})`);
    res.json({ success: true, message: `${email} est maintenant Fondateur avec accès illimité` });
  } catch (error) {
    console.error('Admin grant-unlimited error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// ─── POST /api/admin/invite-team — Inviter un membre d'équipe ────────────────
// Usage : POST /api/admin/invite-team { email, name, secret }

router.post('/invite-team', async (req, res) => {
  try {
    const { email, name, secret } = req.body;
    const adminSecret = (process.env.ADMIN_SECRET || '').trim();

    if (!adminSecret || secret?.trim() !== adminSecret) {
      res.status(403).json({ error: 'Secret invalide' });
      return;
    }

    if (!email) {
      res.status(400).json({ error: 'Email requis' });
      return;
    }

    // Vérifier si l'utilisateur existe déjà
    let user = await prisma.user.findFirst({ where: { email } });

    if (user) {
      // User existe → upgrade en team member avec accès illimité
      await prisma.user.update({
        where: { id: user.id },
        data: {
          circle: 'prive',
          creditsLimit: 999999,
          creditsUsed: 0,
          perplexityLimit: -1,
          perplexityUsed: 0,
          messagesLimit: 999999,
          messagesUsed: 0,
          creditsResetAt: new Date(2099, 11, 31),
          preferences: {
            ...(user.preferences as object || {}),
            role: 'team',
          },
        },
      });
      console.log(`[ADMIN] Membre équipe upgradé: ${email}`);
    } else {
      // Créer un nouveau compte team member
      const inviteToken = crypto.randomBytes(32).toString('hex');
      user = await prisma.user.create({
        data: {
          pseudo: name || email.split('@')[0],
          prenom: name || undefined,
          email,
          mode: 'signature',
          circle: 'prive',
          creditsUsed: 0,
          creditsLimit: 999999,
          perplexityUsed: 0,
          perplexityLimit: -1,
          messagesUsed: 0,
          messagesLimit: 999999,
          creditsResetAt: new Date(2099, 11, 31),
          preferences: { role: 'team', inviteToken },
        },
      });
      console.log(`[ADMIN] Nouveau membre équipe créé: ${email} (${user.id})`);
    }

    // Générer un token de connexion direct
    const loginToken = generateUserToken(user.id, 'prive');

    // Envoyer l'email d'invitation
    const appUrl = process.env.APP_URL || 'https://www.baymora.com';
    const loginLink = `${appUrl}/auth?token=${loginToken}&team=true`;

    await sendEmail(
      email,
      'Invitation Baymora — Accès équipe',
      `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;background:#ffffff;">
        <h1 style="color:#1a1a2e;font-size:22px;margin-bottom:20px;">Bienvenue dans l'équipe Baymora</h1>
        <p style="color:#444;font-size:14px;line-height:1.6;">
          Tu as été invité(e) à rejoindre l'équipe Baymora avec un accès complet et illimité.
        </p>
        <p style="color:#444;font-size:14px;line-height:1.6;">
          Tu as accès au Back-Office, à l'Atlas (création de fiches), et à toutes les fonctionnalités de l'app sans limite.
        </p>
        <a href="${loginLink}" style="display:inline-block;background:#c8a94a;color:#1a1a2e;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:14px;margin:24px 0;">
          Accéder à Baymora
        </a>
        <p style="color:#999;font-size:12px;margin-top:30px;">
          Ce lien est personnel. Ne le partagez pas.
        </p>
      </div>`,
    );

    res.json({
      success: true,
      message: `${email} invité(e) dans l'équipe avec accès illimité`,
      userId: user.id,
      loginLink,
    });
  } catch (error) {
    console.error('Admin invite-team error:', error);
    res.status(500).json({ error: 'Erreur invitation' });
  }
});

// ─── GET /api/admin/team — Liste des membres de l'équipe ─────────────────────

router.get('/team', requireOwner, async (_req, res) => {
  try {
    const teamMembers = await prisma.user.findMany({
      where: {
        preferences: { path: ['role'], equals: 'team' },
      },
      select: {
        id: true, pseudo: true, prenom: true, email: true,
        circle: true, creditsUsed: true, creditsLimit: true,
        createdAt: true, updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ members: teamMembers, total: teamMembers.length });
  } catch (error) {
    console.error('Admin team list error:', error);
    res.status(500).json({ error: 'Erreur liste équipe' });
  }
});

// ─── DELETE /api/admin/team/:id — Retirer un membre de l'équipe ──────────────

router.delete('/team/:id', requireOwner, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) { res.status(404).json({ error: 'Utilisateur non trouvé' }); return; }

    // Downgrade vers découverte
    await prisma.user.update({
      where: { id: req.params.id },
      data: {
        circle: 'decouverte',
        creditsLimit: PLANS.decouverte.creditsLimit,
        creditsUsed: 0,
        perplexityLimit: PLANS.decouverte.perplexityLimit,
        preferences: {
          ...(user.preferences as object || {}),
          role: undefined,
        },
      },
    });

    console.log(`[ADMIN] Membre équipe retiré: ${user.email} (${user.id})`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression membre' });
  }
});

// ─── POST /api/admin/run-agents — Lancer les agents Manus manuellement ──────

router.post('/run-agents', async (req, res) => {
  try {
    const { secret } = req.body;
    const adminSecret = (process.env.ADMIN_SECRET || '').trim();
    if (!adminSecret || secret?.trim() !== adminSecret) {
      res.status(403).json({ error: 'Secret invalide' }); return;
    }

    console.log('[ADMIN] Lancement manuel des agents Manus...');
    // Lancer en background (ne pas bloquer la réponse)
    runAllManusMissions().catch(e => console.error('[ADMIN] Erreur agents:', e));

    res.json({ success: true, message: 'Agents Manus lancés. Consultez les logs Railway pour le suivi.' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lancement agents' });
  }
});

// ─── GET /api/admin/agents — Monitoring temps réel des agents ────────────────

router.get('/agents', requireOwner, async (_req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);

    const [totalTasks, recentTasks, hourlyTasks, tasksByType, lastTask] = await Promise.all([
      prisma.agentTask.count(),
      prisma.agentTask.count({ where: { createdAt: { gte: last24h } } }),
      prisma.agentTask.count({ where: { createdAt: { gte: lastHour } } }),
      prisma.agentTask.groupBy({ by: ['type'], _count: { id: true }, where: { createdAt: { gte: last24h } }, orderBy: { _count: { id: 'desc' } } }),
      prisma.agentTask.findFirst({ orderBy: { createdAt: 'desc' } }),
    ]);

    const recentHistory = await prisma.agentTask.findMany({
      where: { createdAt: { gte: last24h } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, type: true, status: true, input: true, output: true, agentProfile: true, createdAt: true, completedAt: true },
    });

    // Stats Atlas
    const [totalVenues, publishedVenues, draftVenues, totalGuides] = await Promise.all([
      prisma.atlasVenue.count(),
      prisma.atlasVenue.count({ where: { status: 'published' } }),
      prisma.atlasVenue.count({ where: { status: 'draft' } }),
      prisma.seoGuide.count({ where: { status: 'published' } }),
    ]);

    res.json({
      agents: {
        total: 15,
        active: hourlyTasks > 0 ? 'En cours' : 'En attente',
        lastRun: lastTask?.createdAt || null,
        nextRun: '~2h (mode SEO continu)',
      },
      tasks: {
        total: totalTasks,
        last24h: recentTasks,
        lastHour: hourlyTasks,
        byType: tasksByType.reduce((acc: any, t) => { acc[t.type] = t._count.id; return acc; }, {}),
      },
      atlas: {
        totalVenues,
        published: publishedVenues,
        drafts: draftVenues,
        guides: totalGuides,
      },
      history: recentHistory,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur monitoring agents' });
  }
});

// ─── GET /api/admin/user/:id — Voir/gérer un compte client ──────────────────

router.get('/user/:id', requireOwner, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        companions: true,
        dates: true,
        conversations: { take: 10, orderBy: { updatedAt: 'desc' } },
        trips: { take: 10, orderBy: { createdAt: 'desc' } },
        collections: { include: { items: true } },
        creditPurchases: { take: 10, orderBy: { createdAt: 'desc' } },
        pointHistory: { take: 20, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!user) { res.status(404).json({ error: 'Utilisateur non trouvé' }); return; }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erreur chargement utilisateur' });
  }
});

// ─── PATCH /api/admin/user/:id — Modifier un compte client ───────────────────

router.patch('/user/:id', requireOwner, async (req, res) => {
  try {
    const { circle, creditsLimit, creditsUsed, clubPoints, preferences } = req.body;
    const data: any = {};
    if (circle) data.circle = circle;
    if (creditsLimit !== undefined) data.creditsLimit = creditsLimit;
    if (creditsUsed !== undefined) data.creditsUsed = creditsUsed;
    if (clubPoints !== undefined) data.clubPoints = clubPoints;
    if (preferences) data.preferences = preferences;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, pseudo: true, email: true, circle: true, creditsLimit: true, creditsUsed: true, clubPoints: true },
    });
    console.log(`[ADMIN] User modifié: ${user.pseudo} (${user.id}) → ${JSON.stringify(data)}`);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erreur modification utilisateur' });
  }
});

export default router;
