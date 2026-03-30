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

export const CREDIT_PACKS_BY_PLAN: Record<string, CreditPack[]> = {
  voyageur: [
    { id: 'voyageur_30',   name: 'Recharge',  credits: 30,   priceEurCents: 390,   pricePerCredit: 0.130 },
    { id: 'voyageur_80',   name: 'Standard',  credits: 80,   priceEurCents: 890,   pricePerCredit: 0.111 },
    { id: 'voyageur_200',  name: 'Maxi',      credits: 200,  priceEurCents: 1990,  pricePerCredit: 0.100 },
  ],
  explorateur: [
    { id: 'explorateur_100',  name: 'Recharge',  credits: 100,  priceEurCents: 990,   pricePerCredit: 0.099 },
    { id: 'explorateur_300',  name: 'Standard',  credits: 300,  priceEurCents: 2490,  pricePerCredit: 0.083 },
    { id: 'explorateur_700',  name: 'Maxi',      credits: 700,  priceEurCents: 4990,  pricePerCredit: 0.071 },
  ],
  prive: [
    { id: 'prive_300',   name: 'Recharge',  credits: 300,   priceEurCents: 2490,  pricePerCredit: 0.083 },
    { id: 'prive_800',   name: 'Standard',  credits: 800,   priceEurCents: 5990,  pricePerCredit: 0.075 },
    { id: 'prive_2000',  name: 'Maxi',      credits: 2000,  priceEurCents: 12990, pricePerCredit: 0.065 },
    { id: 'prive_5000',  name: 'Ultra',     credits: 5000,  priceEurCents: 34990, pricePerCredit: 0.070, bonusLabel: 'Accès Boutique Diamond 1 mois' },
  ],
  fondateur: [
    { id: 'fondateur_500',   name: 'Recharge',  credits: 500,   priceEurCents: 4490,  pricePerCredit: 0.090 },
    { id: 'fondateur_2000',  name: 'Standard',  credits: 2000,  priceEurCents: 14990, pricePerCredit: 0.075 },
    { id: 'fondateur_5000',  name: 'Maxi',      credits: 5000,  priceEurCents: 34990, pricePerCredit: 0.070 },
    { id: 'fondateur_10000', name: 'Élite',     credits: 10000, priceEurCents: 64990, pricePerCredit: 0.065, bonusLabel: 'Conciergerie prioritaire 1 mois' },
  ],
};

/** @deprecated — utiliser CREDIT_PACKS_BY_PLAN. Conservé pour backward compat API. */
export const CREDIT_PACKS: CreditPack[] = CREDIT_PACKS_BY_PLAN.voyageur;

/** Retourne les packs adaptés au plan du user */
export function getPacksForPlan(circle: BaymoraCircle): CreditPack[] {
  if (circle === 'decouverte') return []; // pas de packs pour le plan gratuit
  return CREDIT_PACKS_BY_PLAN[circle] || CREDIT_PACKS_BY_PLAN.voyageur;
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
