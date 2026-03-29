import { Router, RequestHandler } from 'express';
import { hashPassword, verifyPassword } from '../services/auth';
import { prisma } from '../db';
import jwt from 'jsonwebtoken';
import type { BaymoraUser, TravelCompanion, ImportantDate } from '../types';
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
    { expiresIn: '30d', algorithm: 'HS256' }
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
    messagesUsed: user.messagesUsed,
    messagesLimit: user.messagesLimit,
    passwordHash: user.passwordHash ?? undefined,
    googleId: user.googleId ?? undefined,
    preferences: (user.preferences as Record<string, any>) || {},
    clubPoints: user.clubPoints ?? 0,
    clubVerified: user.clubVerified ?? false,
    invitedById: user.invitedById ?? undefined,
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

    const user = await prisma.user.create({
      data: {
        pseudo: pseudo.trim(),
        prenom: prenom?.trim() || null,
        email: email?.trim().toLowerCase() || null,
        mode,
        passwordHash: passwordHash || null,
        preferences: {},
        invitedById: inviter?.id ?? null,
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

router.post('/register', handleRegister);
router.post('/login', handleLogin);
router.get('/me', handleGetMe);
router.patch('/me', handleUpdateMe);
router.get('/me/upcoming', handleUpcoming);
router.post('/me/companions', handleAddCompanion);
router.patch('/me/companions/:id', handleUpdateCompanion);
router.delete('/me/companions/:id', handleDeleteCompanion);
router.post('/me/dates', handleAddDate);
router.delete('/me/dates/:id', handleDeleteDate);

export default router;
