/**
 * Baymora Club — Routes
 * Système de points, invitations et niveaux de fidélité
 */

import { Router, RequestHandler } from 'express';
import { prisma } from '../db';

const router = Router();

// ─── Niveaux Club ─────────────────────────────────────────────────────────────

export const CLUB_TIERS = [
  { name: 'Crystal',  min: 0,    emoji: '💎', color: 'sky'    },
  { name: 'Gold',     min: 500,  emoji: '🌟', color: 'amber'  },
  { name: 'Platinum', min: 2000, emoji: '✨', color: 'violet' },
  { name: 'Diamond',  min: 5000, emoji: '👑', color: 'white'  },
];

export const POINT_RULES = {
  registration:           50,
  invitation_received:   100,
  invitation_sent:       150,
  profile_complete:       50,
  message_milestone:      25,
  partner_booking:       200,
  admin_grant:             0, // variable
};

export function getClubTier(points: number) {
  return [...CLUB_TIERS].reverse().find(t => points >= t.min) ?? CLUB_TIERS[0];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateInviteCode(pseudo: string): string {
  const clean = pseudo.toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8) || 'BAY';
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BAY-${clean}-${rand}`;
}

async function addPoints(
  userId: string,
  type: string,
  points: number,
  description: string,
  refId?: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.pointTransaction.create({
      data: { userId, type, points, description, refId: refId ?? null },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { clubPoints: { increment: points } },
    }),
  ]);
}

// ─── Middleware auth ──────────────────────────────────────────────────────────

const requireUser: RequestHandler = (req, res, next) => {
  const user = (req as any).baymoraUser;
  if (!user) { res.status(401).json({ error: 'Non authentifié' }); return; }
  next();
};

// ─── Routes publiques ─────────────────────────────────────────────────────────

// GET /api/club/stats
router.get('/stats', async (_req, res) => {
  try {
    const [totalMembers, totalVerified, totalPoints] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { clubVerified: true } }),
      prisma.user.aggregate({ _sum: { clubPoints: true } }),
    ]);
    res.json({
      totalMembers,
      totalVerified,
      totalPointsDistributed: totalPoints._sum.clubPoints ?? 0,
    });
  } catch (err) {
    console.error('[CLUB] Erreur stats:', err);
    res.status(500).json({ error: 'Erreur stats' });
  }
});

// GET /api/club/join/:code — valider un code d'invitation
router.get('/join/:code', async (req, res) => {
  try {
    const invite = await prisma.inviteCode.findFirst({
      where: { code: req.params.code, isActive: true },
      include: { user: { select: { pseudo: true, prenom: true, mode: true } } },
    });
    if (!invite) { res.status(404).json({ error: 'Code introuvable ou inactif' }); return; }
    res.json({
      valid: true,
      code: invite.code,
      inviterName: invite.user.mode === 'fantome'
        ? `${invite.user.pseudo.slice(0, 3)}***`
        : (invite.user.prenom ?? invite.user.pseudo),
      bonusPoints: POINT_RULES.invitation_received,
    });
  } catch (err) {
    console.error('[CLUB] Erreur join:', err);
    res.status(500).json({ error: 'Erreur validation code' });
  }
});

// ─── Routes authentifiées ─────────────────────────────────────────────────────

// GET /api/club/me
router.get('/me', requireUser, async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    const [dbUser, inviteCode] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { clubPoints: true, clubVerified: true, invitedById: true },
      }),
      prisma.inviteCode.findUnique({
        where: { userId: user.id },
        select: { code: true, usedCount: true, isActive: true },
      }),
    ]);

    const points = dbUser?.clubPoints ?? 0;
    const tier = getClubTier(points);
    const nextTier = CLUB_TIERS[CLUB_TIERS.indexOf(tier) + 1] ?? null;

    res.json({
      points,
      clubVerified: dbUser?.clubVerified ?? false,
      invitedById: dbUser?.invitedById ?? null,
      tier,
      nextTier,
      progressPercent: nextTier
        ? Math.min(100, Math.round(((points - tier.min) / (nextTier.min - tier.min)) * 100))
        : 100,
      inviteCode: inviteCode ?? null,
    });
  } catch (err) {
    console.error('[CLUB] Erreur me:', err);
    res.status(500).json({ error: 'Erreur profil Club' });
  }
});

// GET /api/club/invite — obtenir (ou créer) son code d'invitation
router.get('/invite', requireUser, async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    let invite = await prisma.inviteCode.findUnique({ where: { userId: user.id } });

    if (!invite) {
      let code = generateInviteCode(user.pseudo);
      // Garantir l'unicité
      while (await prisma.inviteCode.findUnique({ where: { code } })) {
        code = generateInviteCode(user.pseudo);
      }
      invite = await prisma.inviteCode.create({
        data: { userId: user.id, code },
      });
    }

    res.json({ code: invite.code, usedCount: invite.usedCount, isActive: invite.isActive });
  } catch (err) {
    console.error('[CLUB] Erreur invite:', err);
    res.status(500).json({ error: 'Erreur code invitation' });
  }
});

// GET /api/club/points — historique des transactions
router.get('/points', requireUser, async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    const transactions = await prisma.pointTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json({ transactions });
  } catch (err) {
    console.error('[CLUB] Erreur points history:', err);
    res.status(500).json({ error: 'Erreur historique points' });
  }
});

// GET /api/club/leaderboard — top 10
router.get('/leaderboard', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { clubPoints: 'desc' },
      take: 10,
      select: { id: true, pseudo: true, prenom: true, mode: true, clubPoints: true, clubVerified: true },
    });

    const leaderboard = users.map((u, i) => ({
      rank: i + 1,
      displayName: u.mode === 'fantome'
        ? `${u.pseudo.slice(0, 3)}***`
        : (u.prenom ?? u.pseudo),
      points: u.clubPoints,
      clubVerified: u.clubVerified,
      tier: getClubTier(u.clubPoints),
    }));

    res.json({ leaderboard });
  } catch (err) {
    console.error('[CLUB] Erreur leaderboard:', err);
    res.status(500).json({ error: 'Erreur leaderboard' });
  }
});

// POST /api/club/verify — demander vérification
router.post('/verify', requireUser, async (req, res) => {
  try {
    const user = (req as any).baymoraUser;
    if (!user.email) {
      res.status(400).json({ error: 'Un email est requis pour la vérification Club' });
      return;
    }
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { clubVerified: true } });
    if (dbUser?.clubVerified) {
      res.json({ success: true, message: 'Déjà vérifié' });
      return;
    }
    // Pour l'instant : auto-vérification si email présent (KYC light)
    await prisma.user.update({ where: { id: user.id }, data: { clubVerified: true } });
    console.log(`[CLUB] Membre vérifié: ${user.pseudo}`);
    res.json({ success: true, message: 'Compte vérifié avec succès' });
  } catch (err) {
    console.error('[CLUB] Erreur verify:', err);
    res.status(500).json({ error: 'Erreur vérification' });
  }
});

// ─── Routes admin ─────────────────────────────────────────────────────────────

import { verifyToken } from '../services/auth';

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

// GET /api/club/admin/stats
router.get('/admin/stats', requireOwner, async (_req, res) => {
  try {
    const [totalMembers, totalVerified, pointsSum, invitesSum, topUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { clubVerified: true } }),
      prisma.user.aggregate({ _sum: { clubPoints: true } }),
      prisma.inviteCode.aggregate({ _sum: { usedCount: true } }),
      prisma.user.findMany({
        orderBy: { clubPoints: 'desc' },
        take: 20,
        select: { id: true, pseudo: true, prenom: true, email: true, clubPoints: true, clubVerified: true, circle: true },
      }),
    ]);

    res.json({
      totalMembers,
      totalVerified,
      totalPointsDistributed: pointsSum._sum.clubPoints ?? 0,
      totalInvitationsUsed: invitesSum._sum.usedCount ?? 0,
      topUsers,
    });
  } catch (err) {
    console.error('[CLUB] Erreur admin stats:', err);
    res.status(500).json({ error: 'Erreur stats admin' });
  }
});

// POST /api/club/admin/grant — accorder des points manuellement
router.post('/admin/grant', requireOwner, async (req, res) => {
  try {
    const { userId, points, description } = req.body;
    if (!userId || !points || !description) {
      res.status(400).json({ error: 'userId, points, description obligatoires' });
      return;
    }
    const pts = parseInt(points, 10);
    if (isNaN(pts)) { res.status(400).json({ error: 'points doit être un entier' }); return; }

    await addPoints(userId, 'admin_grant', pts, description);
    res.json({ success: true });
  } catch (err) {
    console.error('[CLUB] Erreur admin grant:', err);
    res.status(500).json({ error: 'Erreur grant points' });
  }
});

export { addPoints, generateInviteCode };
export default router;
