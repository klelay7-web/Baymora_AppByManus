import { Router, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword, verifyPassword } from '../services/auth';
import { conversationStore, userStore, emailIndex, pseudoIndex } from '../stores';
import jwt from 'jsonwebtoken';
import type { BaymoraUser, TravelCompanion, ImportantDate } from '../types';

// Re-export types for consumers
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

export function getUserFromToken(token: string): BaymoraUser | null {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return null;
  try {
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as any;
    if (decoded.role !== 'user') return null;
    return userStore.get(decoded.userId) || null;
  } catch {
    return null;
  }
}

export function getUserById(id: string): BaymoraUser | null {
  return userStore.get(id) || null;
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

/**
 * POST /api/users/register
 */
export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const { pseudo, prenom, email, password, mode = 'fantome', conversationId } = req.body;

    if (!pseudo || pseudo.trim().length < 2) {
      res.status(400).json({ error: 'Un pseudo d\'au moins 2 caractères est requis', code: 'VALIDATION_ERROR' });
      return;
    }

    const pseudoClean = pseudo.trim().toLowerCase();
    if (pseudoIndex.has(pseudoClean)) {
      res.status(409).json({ error: 'Ce pseudo est déjà pris', code: 'PSEUDO_TAKEN' });
      return;
    }

    if (email) {
      const emailClean = email.trim().toLowerCase();
      if (emailIndex.has(emailClean)) {
        res.status(409).json({ error: 'Cet email est déjà utilisé', code: 'EMAIL_TAKEN' });
        return;
      }
    }

    if (mode === 'signature' && !email) {
      res.status(400).json({ error: 'L\'email est requis en mode Signature', code: 'VALIDATION_ERROR' });
      return;
    }

    const userId = uuidv4();
    const passwordHash = password ? await hashPassword(password) : undefined;

    const user: BaymoraUser = {
      id: userId,
      pseudo: pseudo.trim(),
      prenom: prenom?.trim(),
      email: email?.trim().toLowerCase(),
      mode,
      circle: 'decouverte',
      messagesUsed: 0,
      messagesLimit: 20,
      passwordHash,
      preferences: {},
      travelCompanions: [],
      importantDates: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userStore.set(userId, user);
    pseudoIndex.set(pseudoClean, userId);
    if (email) emailIndex.set(email.trim().toLowerCase(), userId);

    // Absorber le profil pré-rempli depuis la conversation invité
    if (conversationId) {
      const conversation = conversationStore.get(conversationId);
      if (conversation?.pendingProfile && Object.keys(conversation.pendingProfile).length > 0) {
        user.preferences = { ...user.preferences, ...conversation.pendingProfile };
        conversation.userId = userId;
        console.log(`[USERS] Profil pré-rempli absorbé pour ${user.pseudo}:`, conversation.pendingProfile);
      }
    }

    const token = generateUserToken(userId, user.circle);
    console.log(`[USERS] Nouveau compte: ${user.pseudo} (${user.mode}) — ID: ${userId}`);

    res.status(201).json({ token, user: safeUser(user) });
  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({ error: 'Erreur lors de la création du compte', code: 'SERVER_ERROR' });
  }
};

/**
 * POST /api/users/login
 */
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password, pseudo } = req.body;

    let user: BaymoraUser | undefined;

    if (email) {
      const userId = emailIndex.get(email.trim().toLowerCase());
      user = userId ? userStore.get(userId) : undefined;
    } else if (pseudo) {
      const userId = pseudoIndex.get(pseudo.trim().toLowerCase());
      user = userId ? userStore.get(userId) : undefined;
    }

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
    res.json({ token, user: safeUser(user) });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur connexion', code: 'SERVER_ERROR' });
  }
};

/**
 * GET /api/users/me
 */
export const handleGetMe: RequestHandler = (req, res) => {
  const user = (req as any).baymoraUser as BaymoraUser;
  if (!user) {
    res.status(401).json({ error: 'Non authentifié', code: 'NOT_AUTHENTICATED' });
    return;
  }
  res.json({ user: safeUser(user) });
};

/**
 * PATCH /api/users/me
 */
export const handleUpdateMe: RequestHandler = (req, res) => {
  const user = (req as any).baymoraUser as BaymoraUser;
  if (!user) {
    res.status(401).json({ error: 'Non authentifié', code: 'NOT_AUTHENTICATED' });
    return;
  }

  const { prenom, preferences, travelCompanions, importantDates } = req.body;

  if (prenom !== undefined) user.prenom = prenom;
  if (preferences) user.preferences = { ...user.preferences, ...preferences };
  if (travelCompanions) user.travelCompanions = travelCompanions;
  if (importantDates) user.importantDates = importantDates;
  user.updatedAt = new Date();

  res.json({ user: safeUser(user) });
};

/**
 * POST /api/users/me/companions
 */
export const handleAddCompanion: RequestHandler = (req, res) => {
  const user = (req as any).baymoraUser as BaymoraUser;
  if (!user) {
    res.status(401).json({ error: 'Non authentifié', code: 'NOT_AUTHENTICATED' });
    return;
  }

  const { name, relationship, birthday, diet, age, clothingSize, shoeSize, notes } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Le nom est requis', code: 'VALIDATION_ERROR' });
    return;
  }

  const companion: TravelCompanion = {
    id: uuidv4(),
    name: name.trim(),
    relationship: relationship || 'ami',
    birthday,
    diet,
    age,
    clothingSize,
    shoeSize,
    notes,
    firstMentionedAt: new Date(),
  };

  user.travelCompanions.push(companion);
  user.updatedAt = new Date();

  res.status(201).json({ companion });
};

/**
 * POST /api/users/me/dates
 */
export const handleAddDate: RequestHandler = (req, res) => {
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

  const importantDate: ImportantDate = {
    id: uuidv4(),
    label,
    date,
    recurring,
    contactName,
    notes,
  };

  user.importantDates.push(importantDate);
  user.updatedAt = new Date();

  res.status(201).json({ date: importantDate });
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function safeUser(user: BaymoraUser) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export const userAuthMiddleware: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const user = getUserFromToken(token);
    (req as any).baymoraUser = user;
  }
  next();
};

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post('/register', handleRegister);
router.post('/login', handleLogin);
router.get('/me', handleGetMe);
router.patch('/me', handleUpdateMe);
router.post('/me/companions', handleAddCompanion);
router.post('/me/dates', handleAddDate);

export default router;
