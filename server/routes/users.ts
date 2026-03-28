import { Router, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword, verifyPassword } from '../services/auth';
import jwt from 'jsonwebtoken';

const router = Router();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BaymoraUser {
  id: string;
  pseudo: string;
  prenom?: string;
  email?: string;
  mode: 'fantome' | 'signature';
  circle: 'decouverte' | 'essentiel' | 'elite' | 'prive' | 'fondateur';
  messagesUsed: number;
  messagesLimit: number;
  passwordHash?: string;
  googleId?: string;
  preferences: Record<string, any>;
  travelCompanions: TravelCompanion[];
  importantDates: ImportantDate[];
  createdAt: Date;
  updatedAt: Date;
}

interface TravelCompanion {
  id: string;
  name: string;
  relationship: string; // ami, conjoint, famille...
  birthday?: string; // ISO date
  preferences?: Record<string, any>;
}

interface ImportantDate {
  id: string;
  label: string;   // "Anniversaire Clara", "Noël"
  date: string;    // MM-DD (yearly) or YYYY-MM-DD (fixed)
  recurring: boolean;
  contactName?: string;
  notes?: string;
}

// ─── Store en mémoire (→ PostgreSQL Phase 2) ─────────────────────────────────

const userStore = new Map<string, BaymoraUser>();
const emailIndex = new Map<string, string>(); // email → userId
const pseudoIndex = new Map<string, string>(); // pseudo → userId

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
 * Créer un compte Baymora (pseudo obligatoire, email optionnel en mode fantôme)
 */
export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const { pseudo, prenom, email, password, mode = 'fantome' } = req.body;

    if (!pseudo || pseudo.trim().length < 2) {
      res.status(400).json({ error: 'Un pseudo d\'au moins 2 caractères est requis', code: 'VALIDATION_ERROR' });
      return;
    }

    // Vérifier unicité du pseudo
    const pseudoClean = pseudo.trim().toLowerCase();
    if (pseudoIndex.has(pseudoClean)) {
      res.status(409).json({ error: 'Ce pseudo est déjà pris', code: 'PSEUDO_TAKEN' });
      return;
    }

    // Vérifier unicité de l'email si fourni
    if (email) {
      const emailClean = email.trim().toLowerCase();
      if (emailIndex.has(emailClean)) {
        res.status(409).json({ error: 'Cet email est déjà utilisé', code: 'EMAIL_TAKEN' });
        return;
      }
    }

    // Mode Signature = email obligatoire
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
      messagesLimit: 20, // 20 messages/mois en compte gratuit
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

    const token = generateUserToken(userId, user.circle);

    console.log(`[USERS] Nouveau compte: ${user.pseudo} (${user.mode}) — ID: ${userId}`);

    res.status(201).json({
      token,
      user: safeUser(user),
    });
  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({ error: 'Erreur lors de la création du compte', code: 'SERVER_ERROR' });
  }
};

/**
 * POST /api/users/login
 * Connexion par email + password
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
 * Récupérer le profil de l'utilisateur connecté
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
 * Mettre à jour le profil (préférences, compagnons, dates importantes)
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
 * Ajouter un compagnon de voyage
 */
export const handleAddCompanion: RequestHandler = (req, res) => {
  const user = (req as any).baymoraUser as BaymoraUser;
  if (!user) {
    res.status(401).json({ error: 'Non authentifié', code: 'NOT_AUTHENTICATED' });
    return;
  }

  const { name, relationship, birthday, preferences } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Le nom est requis', code: 'VALIDATION_ERROR' });
    return;
  }

  const companion: TravelCompanion = {
    id: uuidv4(),
    name,
    relationship: relationship || 'ami',
    birthday,
    preferences,
  };

  user.travelCompanions.push(companion);
  user.updatedAt = new Date();

  res.status(201).json({ companion });
};

/**
 * POST /api/users/me/dates
 * Ajouter une date importante
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

// ─── Helper : données publiques (sans passwordHash) ───────────────────────────

function safeUser(user: BaymoraUser) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// ─── Middleware auth utilisateur ──────────────────────────────────────────────

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
