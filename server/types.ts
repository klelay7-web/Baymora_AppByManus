/**
 * SHARED TYPES — Baymora
 * Shared between routes to avoid circular imports.
 */

export interface TravelCompanion {
  id: string;
  name: string;
  relationship: string;
  birthday?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  clothingSize?: string;
  shoeSize?: number;
  diet?: string;
  preferences?: Record<string, any>;
  notes?: string;
  firstMentionedAt?: Date;
  lastSeenWith?: string;
}

export interface ImportantDate {
  id: string;
  label: string;
  date: string;
  recurring: boolean;
  contactName?: string;
  notes?: string;
}

export interface BaymoraUser {
  id: string;
  pseudo: string;
  prenom?: string;
  email?: string;
  mode: 'fantome' | 'signature';
  circle: 'decouverte' | 'premium' | 'prive' | 'voyageur' | 'explorateur' | 'fondateur';
  // Système de crédits
  creditsUsed: number;
  creditsLimit: number;
  creditsResetAt: Date;
  perplexityUsed: number;
  perplexityLimit: number;
  // Legacy
  messagesUsed: number;
  messagesLimit: number;
  passwordHash?: string;
  googleId?: string;
  preferences: Record<string, any>;
  travelCompanions: TravelCompanion[];
  importantDates: ImportantDate[];
  // Baymora Club
  clubPoints: number;
  clubVerified: boolean;
  invitedById?: string;
  // Stripe
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Plans & Crédits ────────────────────────────────────────────────────────

export type BaymoraCircle = BaymoraUser['circle'];

/** Normalise les anciens cercles vers les 3 nouveaux */
export function normalizeCircle(circle: string): 'decouverte' | 'premium' | 'prive' {
  switch (circle) {
    case 'voyageur':
    case 'explorateur':
    case 'premium':
      return 'premium';
    case 'prive':
    case 'fondateur':
      return 'prive';
    default:
      return 'decouverte';
  }
}

export interface BaymoraPlan {
  name: string;
  circle: BaymoraCircle;
  priceEurCents: number;        // 0 = gratuit
  creditsLimit: number;
  perplexityLimit: number;
  maxTrips: number;             // plans de voyage sauvegardés
  maxCompanions: number;
  hasConcierge: boolean;
  hasHumanConcierge: boolean;
  boutiqueTier: 'none' | 'crystal' | 'gold' | 'platinum' | 'diamond';
  historyDays: number;          // durée de conservation des conversations
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceEurCents: number;
  pricePerCredit: number;       // pour affichage
  bonusLabel?: string;          // ex: "Accès Gold 1 mois"
}

/**
 * 3 PLANS BAYMORA (simplifié depuis 5)
 *
 * Découverte : gratuit, 15 crédits, tester le produit
 * Premium    : 14.90€/mois, 200 crédits + rollover, mémoire + proches + plans
 * Privé      : 49.90€/mois, illimité, conciergerie + expériences VIP
 */
export const PLANS: Record<string, BaymoraPlan> = {
  decouverte: {
    name: 'Découverte',
    circle: 'decouverte',
    priceEurCents: 0,
    creditsLimit: 15,
    perplexityLimit: 3,
    maxTrips: 0,
    maxCompanions: 1,
    hasConcierge: false,
    hasHumanConcierge: false,
    boutiqueTier: 'none',
    historyDays: 0,
  },
  premium: {
    name: 'Premium',
    circle: 'premium',
    priceEurCents: 1490,        // 14.90 €
    creditsLimit: 200,
    perplexityLimit: -1,        // illimité
    maxTrips: 5,
    maxCompanions: 5,
    hasConcierge: true,
    hasHumanConcierge: false,
    boutiqueTier: 'gold',
    historyDays: 365,
  },
  prive: {
    name: 'Privé',
    circle: 'prive',
    priceEurCents: 4990,        // 49.90 €
    creditsLimit: 9999,         // quasi-illimité
    perplexityLimit: -1,
    maxTrips: -1,
    maxCompanions: -1,
    hasConcierge: true,
    hasHumanConcierge: true,
    boutiqueTier: 'diamond',
    historyDays: -1,
  },
  // ── Legacy (backward compat pour users existants en DB) ──
  voyageur: {
    name: 'Premium',
    circle: 'premium',
    priceEurCents: 1490,
    creditsLimit: 200,
    perplexityLimit: -1,
    maxTrips: 5,
    maxCompanions: 5,
    hasConcierge: true,
    hasHumanConcierge: false,
    boutiqueTier: 'gold',
    historyDays: 365,
  },
  explorateur: {
    name: 'Premium',
    circle: 'premium',
    priceEurCents: 1490,
    creditsLimit: 200,
    perplexityLimit: -1,
    maxTrips: 5,
    maxCompanions: 5,
    hasConcierge: true,
    hasHumanConcierge: false,
    boutiqueTier: 'gold',
    historyDays: 365,
  },
  fondateur: {
    name: 'Privé',
    circle: 'prive',
    priceEurCents: 4990,
    creditsLimit: 9999,
    perplexityLimit: -1,
    maxTrips: -1,
    maxCompanions: -1,
    hasConcierge: true,
    hasHumanConcierge: true,
    boutiqueTier: 'diamond',
    historyDays: -1,
  },
};

export const CREDIT_PACKS_BY_PLAN: Record<string, CreditPack[]> = {
  premium: [
    { id: 'premium_50',   name: 'Recharge',  credits: 50,   priceEurCents: 490,   pricePerCredit: 0.098 },
    { id: 'premium_150',  name: 'Standard',  credits: 150,  priceEurCents: 1290,  pricePerCredit: 0.086 },
    { id: 'premium_400',  name: 'Maxi',      credits: 400,  priceEurCents: 2990,  pricePerCredit: 0.075 },
  ],
  prive: [
    { id: 'prive_500',   name: 'Recharge',  credits: 500,   priceEurCents: 3490,  pricePerCredit: 0.070 },
    { id: 'prive_1500',  name: 'Standard',  credits: 1500,  priceEurCents: 8990,  pricePerCredit: 0.060 },
    { id: 'prive_5000',  name: 'Ultra',     credits: 5000,  priceEurCents: 24990, pricePerCredit: 0.050 },
  ],
};

/** @deprecated — conservé pour backward compat */
export const CREDIT_PACKS: CreditPack[] = CREDIT_PACKS_BY_PLAN.premium;

/** Retourne les packs adaptés au plan du user */
export function getPacksForPlan(circle: BaymoraCircle): CreditPack[] {
  const normalized = normalizeCircle(circle);
  if (normalized === 'decouverte') return [];
  return CREDIT_PACKS_BY_PLAN[normalized] || CREDIT_PACKS_BY_PLAN.premium;
}

/**
 * Déblocages ponctuels (guest ou abonné à court de crédits)
 * Prix volontairement élevés pour rendre l'abonnement évident :
 *   5 crédits = 9.90€  vs  Voyageur = 9.90€/mois pour 100 crédits
 */
export interface UnlockTier {
  id: string;
  credits: number;
  priceEurCents: number;
  label: string;
}

export const UNLOCK_TIERS: UnlockTier[] = [
  { id: 'unlock_5',  credits: 5,  priceEurCents: 990,  label: '5 crédits — 9,90 €' },
  { id: 'unlock_10', credits: 10, priceEurCents: 1590, label: '10 crédits — 15,90 €' },
  { id: 'unlock_20', credits: 20, priceEurCents: 1990, label: '20 crédits — 19,90 €' },
];

/**
 * Rollover : les crédits non utilisés s'additionnent au mois suivant.
 * Plafond d'accumulation = 3x le quota mensuel (évite accumulation infinie).
 */
export const ROLLOVER_MAX_MULTIPLIER = 3;

/** Coût en crédits par type d'action */
export const CREDIT_COSTS = {
  message_sonnet: 1,
  message_opus: 3,
  perplexity_search: 1,   // en plus du coût message
} as const;

/**
 * Récompenses de partage de trip
 * Créer un trip coûte ~5-15 crédits (3-5 messages Opus)
 * Un parrainage rapporte 30 crédits → créateur toujours gagnant dès la 1ère conversion
 */
export const SHARING_REWARDS = {
  /** Crédits offerts au shareur quand un ami s'inscrit via son lien */
  signupCredits: 30,
  /** Points Club offerts au shareur quand un ami s'inscrit */
  signupPoints: 100,
  /** % de commission partenaire reversée au shareur quand un ami réserve */
  bookingCommissionPercent: 5,
} as const;

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  language: 'en' | 'fr';
  messages: Message[];
  pendingProfile: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
