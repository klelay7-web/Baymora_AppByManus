import { Router, RequestHandler } from 'express';
import { hashPassword, verifyPassword } from '../services/auth';
import { prisma } from '../db';
import jwt from 'jsonwebtoken';
import type { BaymoraUser, TravelCompanion, ImportantDate } from '../types';
import { PLANS } from '../types';
import { getUpcomingForUser } from '../services/birthdayCron';
import { sendWelcomeEmail } from '../services/email';
import { addPoints, generateInviteCode } from './club';

export type { BaymoraUser, TravelCompanion, ImportantDate };

const router = Router();

// ─── Token utilisateur ────────────────────────────────────────────────────────

export function generateUserToken(userId: string, circle: string): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET not configured');
  return jwt.sign(
    { userId, role: 'user', circle, iat: Math.floor(Date.now() / 1000) },
    jwtSecret,
    { expiresIn: '90d', algorithm: 'HS256' }
  );
}

export function getUserFromToken(token: string): Promise<BaymoraUser | null> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return Promise.resolve(null);
  try {
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as any;
    if (decoded.role !== 'user') return Promise.resolve(null);
    return getUserById(decoded.userId);
  } catch {
    return Promise.resolve(null);
  }
}

export async function getUserById(id: string): Promise<BaymoraUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { companions: true, dates: true },
    });
    if (!user) return null;
    return dbUserToBaymora(user);
  } catch {
    return null;
  }
}

// ─── Conversion DB → BaymoraUser ─────────────────────────────────────────────

function dbUserToBaymora(user: any): BaymoraUser {
  return {
    id: user.id,
    pseudo: user.pseudo,
    prenom: user.prenom ?? undefined,
    email: user.email ?? undefined,
    mode: user.mode as 'fantome' | 'signature',
    circle: user.circle as BaymoraUser['circle'],
    // Crédits
    creditsUsed: user.creditsUsed ?? 0,
    creditsLimit: user.creditsLimit ?? 15,
    creditsResetAt: user.creditsResetAt ?? new Date(),
    perplexityUsed: user.perplexityUsed ?? 0,
    perplexityLimit: user.perplexityLimit ?? 3,
    // Legacy
    messagesUsed: user.messagesUsed,
    messagesLimit: user.messagesLimit,
    passwordHash: user.passwordHash ?? undefined,
    googleId: user.googleId ?? undefined,
    preferences: (user.preferences as Record<string, any>) || {},
    clubPoints: user.clubPoints ?? 0,
    clubVerified: user.clubVerified ?? false,
    invitedById: user.invitedById ?? undefined,
    stripeCustomerId: user.stripeCustomerId ?? undefined,
    stripeSubscriptionId: user.stripeSubscriptionId ?? undefined,
    travelCompanions: (user.companions || []).map((c: any): TravelCompanion => ({
      id: c.id,
      name: c.name,
      relationship: c.relationship,
      birthday: c.birthday ?? undefined,
      age: c.age ?? undefined,
      heightCm: c.heightCm ?? undefined,
      weightKg: c.weightKg ?? undefined,
      clothingSize: c.clothingSize ?? undefined,
      shoeSize: c.shoeSize ?? undefined,
      diet: c.diet ?? undefined,
      notes: c.notes ?? undefined,
      preferences: (c.preferences as Record<string, any>) || {},
      firstMentionedAt: c.firstMentionedAt,
      lastSeenWith: c.lastSeenWith ?? undefined,
    })),
    importantDates: (user.dates || []).map((d: any): ImportantDate => ({
      id: d.id,
      label: d.label,
      date: d.date,
      recurring: d.recurring,
      contactName: d.contactName ?? undefined,
      notes: d.notes ?? undefined,
    })),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const { pseudo, prenom, email, password, mode = 'fantome', conversationId, inviteCode } = req.body;

    if (!pseudo || pseudo.trim().length < 2) {
      res.status(400).json({ error: 'Un pseudo d\'au moins 2 caractères est requis', code: 'VALIDATION_ERROR' });
      return;
    }

    if (mode === 'signature' && !email) {
      res.status(400).json({ error: 'L\'email est requis en mode Signature', code: 'VALIDATION_ERROR' });
      return;
    }

    // Vérifier le code d'invitation (si fourni)
    let inviter: { id: string; pseudo: string } | null = null;
    if (inviteCode) {
      const invite = await prisma.inviteCode.findFirst({
        where: { code: inviteCode.trim().toUpperCase(), isActive: true },
        include: { user: { select: { id: true, pseudo: true } } },
      });
      if (invite) inviter = invite.user;
    }

    const passwordHash = password ? await hashPassword(password) : undefined;

    const plan = PLANS.decouverte;

    const user = await prisma.user.create({
      data: {
        pseudo: pseudo.trim(),
        prenom: prenom?.trim() || null,
        email: email?.trim().toLowerCase() || null,
        mode,
        passwordHash: passwordHash || null,
        preferences: {},
        invitedById: inviter?.id ?? null,
        // Initialisation crédits (plan Découverte)
        creditsUsed: 0,
        creditsLimit: plan.creditsLimit,
        perplexityUsed: 0,
        perplexityLimit: plan.perplexityLimit,
        creditsResetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      },
      include: { companions: true, dates: true },
    });

    // Créer le code d'invitation de ce nouvel utilisateur
    let code = generateInviteCode(user.pseudo);
    while (await prisma.inviteCode.findUnique({ where: { code } })) {
      code = generateInviteCode(user.pseudo);
    }
    await prisma.inviteCode.create({ data: { userId: user.id, code } });

    // Points Club : inscription
    await addPoints(user.id, 'registration', 50, 'Bienvenue au Baymora Club !');

    // Si parrainé : bonus pour le nouvel inscrit + bonus pour l'inviteur
    if (inviter) {
      await addPoints(user.id, 'invitation_received', 100, `Invité par ${inviter.pseudo}`);
      await addPoints(inviter.id, 'invitation_sent', 150, `${user.pseudo} a rejoint via votre invitation`);
      // Incrémenter usedCount du code
      await prisma.inviteCode.updateMany({
        where: { userId: inviter.id },
        data: { usedCount: { increment: 1 } },
      });
      console.log(`[CLUB] Parrainage: ${user.pseudo} invité par ${inviter.pseudo}`);
    }

    // Absorber le profil pré-rempli depuis la conversation invité
    if (conversationId) {
      const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (conversation?.pendingProfile && Object.keys(conversation.pendingProfile as object).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            preferences: { ...(user.preferences as object), ...(conversation.pendingProfile as object) },
          },
        });
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { userId: user.id },
        });
        console.log(`[USERS] Profil absorbé pour ${user.pseudo}`);
      }
    }

    const token = generateUserToken(user.id, user.circle);
    console.log(`[USERS] Nouveau compte: ${user.pseudo} (${mode})`);

    // Email de bienvenue (async, ne bloque pas la réponse)
    if (email) {
      sendWelcomeEmail(email, user.prenom ?? undefined).catch(() => {});
    }

    res.status(201).json({ token, user: safeUser(dbUserToBaymora(user)) });
  } catch (error: any) {
    if (error.code === 'P2002') {
      const field = error.meta?.target?.includes('email') ? 'email' : 'pseudo';
      res.status(409).json({ error: `Ce ${field} est déjà utilisé`, code: `${field.toUpperCase()}_TAKEN` });
      return;
    }
    console.error('Erreur register:', error);
    res.status(500).json({ error: 'Erreur lors de la création du compte', code: 'SERVER_ERROR' });
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password, pseudo } = req.body;

    const user = await prisma.user.findFirst({
      where: email
        ? { email: email.trim().toLowerCase() }
        : { pseudo: pseudo?.trim() },
      include: { companions: true, dates: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Identifiants incorrects', code: 'INVALID_CREDENTIALS' });
      return;
    }

    if (password && user.passwordHash) {
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: 'Identifiants incorrects', code: 'INVALID_CREDENTIALS' });
        return;
      }
    }

    const token = generateUserToken(user.id, user.circle);
    res.json({ token, user: safeUser(dbUserToBaymora(user)) });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur connexion', code: 'SERVER_ERROR' });
  }
};

export const handleGetMe: RequestHandler = (req, res) => {
  const user = (req as any).baymoraUser as BaymoraUser;
  if (!user) {
    res.status(401).json({ error: 'Non authentifié', code: 'NOT_AUTHENTICATED' });
    return;
  }
  res.json({ user: safeUser(user) });
};

export const handleUpdateMe: RequestHandler = async (req, res) => {
  const user = (req as any).baymoraUser as BaymoraUser;
  if (!user) {
    res.status(401).json({ error: 'Non authentifié', code: 'NOT_AUTHENTICATED' });
    return;
  }

  const { prenom, preferences } = req.body;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      prenom: prenom ?? user.prenom,
      preferences: preferences ? { ...(user.preferences as object), ...preferences } : user.preferences,
    },
    include: { companions: true, dates: true },
  });

  res.json({ user: safeUser(dbUserToBaymora(updated)) });
};

export const handleAddCompanion: RequestHandler = async (req, res) => {
  const user = (req as any).baymoraUser as BaymoraUser;
  if (!user) {
    res.status(401).json({ error: 'Non authentifié', code: 'NOT_AUTHENTICATED' });
    return;
  }

  const { name, relationship, birthday, diet, age, clothingSize, shoeSize, notes, preferences: compPrefs } = req.body;
  if (!name?.trim()) {
    res.status(400).json({ error: 'Le nom est requis', code: 'VALIDATION_ERROR' });
    return;
  }

  const companion = await prisma.travelCompanion.create({
    data: {
      userId: user.id,
      name: name.trim(),
      relationship: relationship || 'ami',
      birthday: birthday || null,
      diet: diet || null,
      age: age || null,
      clothingSize: clothingSize || null,
      shoeSize: shoeSize || null,
      notes: notes || null,
      preferences: compPrefs || {},
    },
  });

  res.status(201).json({ companion });
};

export const handleUpdateCompanion: RequestHandler = async (req, res) => {
  const user = (req as any).baymoraUser as BaymoraUser;
  if (!user) { res.status(401).json({ error: 'Non authentifié' }); return; }

  const { id } = req.params;
  const existing = await prisma.travelCompanion.findFirst({ where: { id, userId: user.id } });
  if (!existing) { res.status(404).json({ error: 'Proche introuvable' }); return; }

  const { name, relationship, birthday, diet, age, clothingSize, shoeSize, notes, preferences: compPrefs } = req.body;

  const updated = await prisma.travelCompanion.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      relationship: relationship ?? existing.relationship,
      birthday: birthday !== undefined ? birthday || null : existing.birthday,
      diet: diet !== undefined ? diet || null : existing.diet,
      age: age !== undefined ? age || null : existing.age,
      clothingSize: clothingSize !== undefined ? clothingSize || null : existing.clothingSize,
      shoeSize: shoeSize !== undefined ? shoeSize || null : existing.shoeSize,
      notes: notes !== undefined ? notes || null : existing.notes,
      preferences: compPrefs ? { ...(existing.preferences as object), ...compPrefs } : existing.preferences,
    },
  });

  res.json({ companion: updated });
};

export const handleDeleteCompanion: RequestHandler = async (req, res) => {
  const user = (req as any).baymoraUser as BaymoraUser;
  if (!user) { res.status(401).json({ error: 'Non authentifié' }); return; }

  const { id } = req.params;
  const existing = await prisma.travelCompanion.findFirst({ where: { id, userId: user.id } });
  if (!existing) { res.status(404).json({ error: 'Proche introuvable' }); return; }

  await prisma.travelCompanion.delete({ where: { id } });
  res.json({ ok: true });
};

export const handleDeleteDate: RequestHandler = async (req, res) => {
  const user = (req as any).baymoraUser as BaymoraUser;
  if (!user) { res.status(401).json({ error: 'Non authentifié' }); return; }

  const { id } = req.params;
  const existing = await prisma.importantDate.findFirst({ where: { id, userId: user.id } });
  if (!existing) { res.status(404).json({ error: 'Date introuvable' }); return; }

  await prisma.importantDate.delete({ where: { id } });
  res.json({ ok: true });
};

export const handleAddDate: RequestHandler = async (req, res) => {
  const user = (req as any).baymoraUser as BaymoraUser;
  if (!user) {
    res.status(401).json({ error: 'Non authentifié', code: 'NOT_AUTHENTICATED' });
    return;
  }

  const { label, date, recurring = true, contactName, notes } = req.body;
  if (!label || !date) {
    res.status(400).json({ error: 'label et date requis', code: 'VALIDATION_ERROR' });
    return;
  }

  const importantDate = await prisma.importantDate.create({
    data: { userId: user.id, label, date, recurring, contactName: contactName || null, notes: notes || null },
  });

  res.status(201).json({ date: importantDate });
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function safeUser(user: BaymoraUser) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export const userAuthMiddleware: RequestHandler = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const user = await getUserFromToken(token);
    (req as any).baymoraUser = user;
  }
  next();
};

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/users/me/upcoming — prochaines dates dans les 30 jours
const handleUpcoming: RequestHandler = async (req, res) => {
  const user = (req as any).baymoraUser as BaymoraUser;
  if (!user) { res.status(401).json({ error: 'Non authentifié' }); return; }
  try {
    const upcoming = await getUpcomingForUser(user.id);
    res.json({ upcoming });
  } catch {
    res.status(500).json({ error: 'Erreur' });
  }
};

// ─── Password Reset ──────────────────────────────────────────────────────────

const handleForgotPassword: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: 'Email requis' }); return; }

    const user = await prisma.user.findFirst({
      where: { email: email.trim().toLowerCase() },
    });

    // Toujours répondre succès (ne pas révéler si l'email existe)
    if (!user) {
      res.json({ success: true, message: 'Si ce compte existe, un lien de réinitialisation a été envoyé.' });
      return;
    }

    // Générer un token de reset (valide 1h)
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Stocker dans preferences (pas de champ dédié — pragmatique)
    const prefs = (user.preferences as Record<string, any>) || {};
    prefs._resetToken = resetToken;
    prefs._resetExpiry = resetExpiry.toISOString();
    await prisma.user.update({
      where: { id: user.id },
      data: { preferences: prefs },
    });

    const resetUrl = `${process.env.CORS_ORIGIN || 'https://baymora.com'}/auth?reset=${resetToken}`;
    const name = user.prenom || 'Voyageur';

    await sendWelcomeEmail(email, name); // Temporary — TODO: create dedicated reset email template
    // For now, use a simple email:
    const { sendEmail } = await import('../services/email');
    await sendEmail(email, 'Réinitialisation de votre mot de passe Baymora', `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,sans-serif;background:#f5f3ef;margin:0;padding:0;">
<div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #e8e3da;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#1a1e2e,#0f1420);padding:32px;text-align:center;">
    <span style="font-weight:800;font-size:24px;color:#c8a94a;">B</span>
  </div>
  <div style="padding:32px;">
    <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 12px;">Réinitialisation du mot de passe</h1>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Bonjour ${name}, cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable 1 heure.
    </p>
    <div style="text-align:center;margin-bottom:12px;">
      <a href="${resetUrl}" style="display:inline-block;background:#c8a94a;color:#000;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">Réinitialiser mon mot de passe →</a>
    </div>
    <p style="color:#999;font-size:12px;text-align:center;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
  </div>
</div></body></html>`);

    console.log(`[AUTH] Reset password email envoyé à ${email}`);
    res.json({ success: true, message: 'Si ce compte existe, un lien de réinitialisation a été envoyé.' });
  } catch (error) {
    console.error('Erreur forgot-password:', error);
    res.status(500).json({ error: 'Erreur envoi email' });
  }
};

const handleResetPassword: RequestHandler = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ error: 'Token et mot de passe requis' }); return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }); return;
    }

    // Chercher l'utilisateur par token
    const users = await prisma.user.findMany({
      where: { preferences: { path: ['_resetToken'], equals: token } },
    });

    const user = users[0];
    if (!user) {
      res.status(400).json({ error: 'Lien invalide ou expiré' }); return;
    }

    const prefs = (user.preferences as Record<string, any>) || {};
    if (!prefs._resetExpiry || new Date(prefs._resetExpiry) < new Date()) {
      res.status(400).json({ error: 'Lien expiré. Demandez un nouveau lien.' }); return;
    }

    // Mettre à jour le mot de passe
    const newHash = await hashPassword(password);
    delete prefs._resetToken;
    delete prefs._resetExpiry;

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash, preferences: prefs },
    });

    console.log(`[AUTH] Mot de passe réinitialisé pour ${user.email}`);
    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Erreur reset-password:', error);
    res.status(500).json({ error: 'Erreur réinitialisation' });
  }
};

router.post('/register', handleRegister);
router.post('/login', handleLogin);
router.post('/forgot-password', handleForgotPassword);
router.post('/reset-password', handleResetPassword);
router.get('/me', handleGetMe);
router.patch('/me', handleUpdateMe);
router.get('/me/upcoming', handleUpcoming);
router.post('/me/companions', handleAddCompanion);
router.patch('/me/companions/:id', handleUpdateCompanion);
router.delete('/me/companions/:id', handleDeleteCompanion);
router.post('/me/dates', handleAddDate);
router.delete('/me/dates/:id', handleDeleteDate);

// ═══════════════════════════════════════════════════════════════════════════════
// CERCLE FAMILIAL — Inviter un proche à rejoindre Baymora
// ═══════════════════════════════════════════════════════════════════════════════

import crypto from 'crypto';
import { sendEmail } from '../services/email';

// POST /api/users/me/companions/:id/invite — Générer un lien d'invitation pour un proche
router.post('/me/companions/:id/invite', async (req, res) => {
  try {
    const baymoraUser = (req as any).baymoraUser;
    if (!baymoraUser?.id) { res.status(401).json({ error: 'Non authentifié' }); return; }

    const companion = await prisma.travelCompanion.findFirst({
      where: { id: req.params.id, userId: baymoraUser.id },
    });
    if (!companion) { res.status(404).json({ error: 'Proche non trouvé' }); return; }

    // Générer un token d'invitation unique
    const inviteToken = crypto.randomBytes(24).toString('hex');
    await prisma.travelCompanion.update({
      where: { id: companion.id },
      data: { inviteToken, inviteSentAt: new Date() },
    });

    const appUrl = process.env.APP_URL || 'https://www.baymora.com';
    const inviteLink = `${appUrl}/join?invite=${inviteToken}&from=${baymoraUser.id}`;

    // Envoyer par email si le proche a un email dans ses préférences
    const companionEmail = (companion.preferences as any)?.email;
    if (companionEmail) {
      const senderName = baymoraUser.prenom || baymoraUser.pseudo || 'Quelqu\'un';
      await sendEmail(
        companionEmail,
        `${senderName} vous invite sur Baymora`,
        `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;background:#ffffff;">
          <h1 style="color:#1a1a2e;font-size:22px;">Vous avez été invité(e) !</h1>
          <p style="color:#444;font-size:14px;line-height:1.6;">
            ${senderName} vous a ajouté comme ${companion.relationship} sur Baymora, la conciergerie de voyage premium.
          </p>
          <p style="color:#444;font-size:14px;">
            Votre profil est déjà pré-rempli avec les infos que ${senderName} connaît de vous. Cliquez pour compléter :
          </p>
          <a href="${inviteLink}" style="display:inline-block;background:#c8a94a;color:#1a1a2e;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:14px;margin:24px 0;">
            Rejoindre Baymora
          </a>
          <p style="color:#999;font-size:11px;margin-top:30px;">
            Gratuit · 15 échanges offerts · Vos données restent privées
          </p>
        </div>`,
      );
    }

    console.log(`[CIRCLE] Invitation envoyée: ${companion.name} par ${baymoraUser.id}`);
    res.json({ success: true, inviteLink, inviteToken });
  } catch (error) {
    console.error('[CIRCLE] Invite error:', error);
    res.status(500).json({ error: 'Erreur invitation' });
  }
});

// GET /api/users/join?invite=TOKEN — Accepter une invitation (pré-remplir le signup)
router.get('/join', async (req, res) => {
  try {
    const { invite } = req.query as Record<string, string>;
    if (!invite) { res.status(400).json({ error: 'Token requis' }); return; }

    const companion = await prisma.travelCompanion.findFirst({
      where: { inviteToken: invite },
      include: { user: { select: { id: true, pseudo: true, prenom: true } } },
    });

    if (!companion) { res.status(404).json({ error: 'Invitation invalide ou expirée' }); return; }

    // Retourner les infos pré-remplies
    res.json({
      prefilled: {
        name: companion.name,
        relationship: companion.relationship,
        birthday: companion.birthday,
        diet: companion.diet,
        preferences: companion.preferences,
      },
      invitedBy: {
        name: companion.user.prenom || companion.user.pseudo,
        relationship: companion.relationship,
      },
      inviteToken: invite,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur invitation' });
  }
});

// POST /api/users/join — Créer le compte du proche invité
router.post('/join', async (req, res) => {
  try {
    const { inviteToken, pseudo, email, password } = req.body;
    if (!inviteToken || !pseudo) { res.status(400).json({ error: 'Token et pseudo requis' }); return; }

    const companion = await prisma.travelCompanion.findFirst({
      where: { inviteToken },
    });
    if (!companion) { res.status(404).json({ error: 'Invitation invalide' }); return; }
    if (companion.inviteAccepted) { res.status(409).json({ error: 'Invitation déjà acceptée' }); return; }

    // Créer le compte
    const passwordHash = password ? await hashPassword(password) : undefined;
    const newUser = await prisma.user.create({
      data: {
        pseudo,
        prenom: companion.name,
        email: email || undefined,
        passwordHash,
        mode: 'signature',
        circle: 'decouverte',
        creditsUsed: 0,
        creditsLimit: PLANS.decouverte.creditsLimit,
        perplexityUsed: 0,
        perplexityLimit: PLANS.decouverte.perplexityLimit,
        messagesUsed: 0,
        messagesLimit: PLANS.decouverte.creditsLimit,
        creditsResetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        preferences: {
          diet: companion.diet || undefined,
          ...(companion.preferences as object || {}),
        },
        invitedById: companion.userId,
      },
    });

    // Marquer l'invitation comme acceptée + lier les comptes
    await prisma.travelCompanion.update({
      where: { id: companion.id },
      data: { inviteAccepted: true, linkedUserId: newUser.id },
    });

    // Créer une fiche réciproque (le nouveau user a aussi le créateur dans ses proches)
    const creator = await prisma.user.findUnique({
      where: { id: companion.userId },
      select: { prenom: true, pseudo: true },
    });
    if (creator) {
      const reverseRelation: Record<string, string> = {
        ami: 'ami', frere: 'frere', soeur: 'soeur', maman: 'enfant', papa: 'enfant',
        conjoint: 'conjoint', enfant: 'parent', collegue: 'collegue',
      };
      await prisma.travelCompanion.create({
        data: {
          userId: newUser.id,
          name: creator.prenom || creator.pseudo,
          relationship: reverseRelation[companion.relationship] || 'ami',
          linkedUserId: companion.userId,
        },
      });
    }

    // Récompense pour l'inviteur : 30 crédits + 100 points
    await prisma.user.update({
      where: { id: companion.userId },
      data: {
        creditsLimit: { increment: 30 },
        clubPoints: { increment: 100 },
      },
    });

    const token = generateUserToken(newUser.id, 'decouverte');

    console.log(`[CIRCLE] Proche inscrit: ${companion.name} → ${newUser.id} (invité par ${companion.userId})`);
    res.json({
      success: true,
      user: { id: newUser.id, pseudo: newUser.pseudo, prenom: newUser.prenom },
      token,
    });
  } catch (error) {
    console.error('[CIRCLE] Join error:', error);
    res.status(500).json({ error: 'Erreur inscription' });
  }
});

export default router;
