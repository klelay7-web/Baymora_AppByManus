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
  circle: 'decouverte' | 'voyageur' | 'explorateur' | 'prive' | 'fondateur';
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

export const PLANS: Record<BaymoraCircle, BaymoraPlan> = {
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
    historyDays: 0,             // session uniquement
  },
  voyageur: {
    name: 'Voyageur',
    circle: 'voyageur',
    priceEurCents: 990,         // 9.90 €
    creditsLimit: 100,
    perplexityLimit: 20,
    maxTrips: 3,
    maxCompanions: 3,
    hasConcierge: false,
    hasHumanConcierge: false,
    boutiqueTier: 'crystal',
    historyDays: 30,
  },
  explorateur: {
    name: 'Explorateur',
    circle: 'explorateur',
    priceEurCents: 2900,        // 29 €
    creditsLimit: 350,
    perplexityLimit: -1,        // illimité
    maxTrips: 10,
    maxCompanions: 10,
    hasConcierge: true,
    hasHumanConcierge: false,
    boutiqueTier: 'gold',
    historyDays: 365,
  },
  prive: {
    name: 'Cercle Privé',
    circle: 'prive',
    priceEurCents: 7900,        // 79 €
    creditsLimit: 1200,
    perplexityLimit: -1,
    maxTrips: -1,               // illimité
    maxCompanions: -1,
    hasConcierge: true,
    hasHumanConcierge: false,
    boutiqueTier: 'platinum',
    historyDays: -1,            // illimité
  },
  fondateur: {
    name: 'Fondateur',
    circle: 'fondateur',
    priceEurCents: 19900,       // 199 €
    creditsLimit: 4000,
    perplexityLimit: -1,
    maxTrips: -1,
    maxCompanions: -1,
    hasConcierge: true,
    hasHumanConcierge: true,
    boutiqueTier: 'diamond',
    historyDays: -1,
  },
};

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'pack_50',   name: 'Recharge',   credits: 50,   priceEurCents: 490,  pricePerCredit: 0.098 },
  { id: 'pack_150',  name: 'Standard',   credits: 150,  priceEurCents: 1290, pricePerCredit: 0.086 },
  { id: 'pack_500',  name: 'Maxi',       credits: 500,  priceEurCents: 3490, pricePerCredit: 0.070, bonusLabel: 'Accès Boutique Gold 1 mois' },
  { id: 'pack_1000', name: 'Ultra',      credits: 1000, priceEurCents: 5990, pricePerCredit: 0.060, bonusLabel: 'Accès Boutique Platinum 1 mois' },
];

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
