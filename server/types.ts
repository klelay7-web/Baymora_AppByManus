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
 *   5 crédits = 9.90€  vs  Premium = 14.90€/mois pour 200 crédits
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

// ─── Système d'accès par feature ─────────────────────────────────────────────
//
// Chaque plan a un set de features incluses.
// Les features non-incluses peuvent être débloquées :
//   - One-shot (paiement ponctuel, accès temporaire ou permanent)
//   - Par les points Club (gagner puis dépenser)
//
// Privé a TOUT par défaut (sauf certains bonus points-only).
// Premium a accès aux fiches Baymora + Échappées mais PAS aux Expériences VIP.
// Découverte n'a que l'IA de base.

export type FeatureKey =
  | 'curated_guides'        // Fiches & parcours Baymora curatés
  | 'echappees'             // Offres partenaires Échappées
  | 'experiences_vip'       // Expériences Privées VIP
  | 'human_concierge'       // Conciergerie humaine
  | 'baymora_booking'       // Réservation par Baymora
  | 'family_circle'         // Cercle familial complet (>5 proches)
  | 'unlimited_trips'       // Plans de voyage illimités
  | 'priority_ai'           // IA prioritaire (file d'attente réduite)
  | 'boutique_premium';     // Boutique articles exclusifs

/** Features incluses par plan */
export const PLAN_FEATURES: Record<string, FeatureKey[]> = {
  decouverte: [],
  premium: ['curated_guides', 'echappees'],
  prive: ['curated_guides', 'echappees', 'experiences_vip', 'human_concierge', 'baymora_booking', 'family_circle', 'unlimited_trips', 'priority_ai', 'boutique_premium'],
};

/** Déblocage one-shot : prix pour accéder à une feature sans changer de plan */
export interface FeatureUnlock {
  feature: FeatureKey;
  name: string;
  description: string;
  priceEurCents: number;
  duration: 'permanent' | '30days' | '7days' | '24h' | 'one_use';
  pointsCost?: number;        // alternative : payer en points Club
  minPlan: 'decouverte' | 'premium';  // plan minimum pour pouvoir acheter
}

export const FEATURE_UNLOCKS: FeatureUnlock[] = [
  // Découverte → peut acheter ces features
  { feature: 'curated_guides',    name: 'Fiches Baymora',         description: 'Accès aux guides et parcours curatés par Baymora', priceEurCents: 490,  duration: '30days',  pointsCost: 500,  minPlan: 'decouverte' },
  { feature: 'echappees',         name: 'Échappées Baymora',      description: 'Accès aux offres partenaires exclusives',          priceEurCents: 290,  duration: '30days',  pointsCost: 300,  minPlan: 'decouverte' },

  // Premium → peut acheter ces features (incluses dans Privé)
  { feature: 'experiences_vip',   name: 'Expériences VIP',        description: 'Accès aux expériences privées et privilèges VIP',  priceEurCents: 1490, duration: '30days',  pointsCost: 1500, minPlan: 'premium' },
  { feature: 'human_concierge',   name: 'Conciergerie humaine',   description: 'Un concierge humain pour vos demandes complexes',  priceEurCents: 1990, duration: '7days',   pointsCost: 2000, minPlan: 'premium' },
  { feature: 'baymora_booking',   name: 'Réservation Baymora',    description: 'Baymora réserve pour vous (1 réservation)',        priceEurCents: 990,  duration: 'one_use', pointsCost: 1000, minPlan: 'premium' },
  { feature: 'family_circle',     name: 'Cercle familial élargi', description: 'Plus de 5 proches + fiches croisées complètes',    priceEurCents: 990,  duration: '30days',  pointsCost: 800,  minPlan: 'premium' },

  // Points-only (pour tous, débloquable uniquement avec des points)
  { feature: 'boutique_premium',  name: 'Boutique exclusive',     description: 'Accès aux articles et cadeaux premium',           priceEurCents: 0,    duration: '30days',  pointsCost: 2000, minPlan: 'decouverte' },
  { feature: 'priority_ai',      name: 'IA prioritaire',         description: 'Réponses IA en priorité, temps d\'attente réduit', priceEurCents: 0,    duration: '7days',   pointsCost: 500,  minPlan: 'decouverte' },
];

/** Vérifie si un user a accès à une feature (plan inclus OU débloqué) */
export function hasFeatureAccess(circle: string, unlockedFeatures: string[], feature: FeatureKey): boolean {
  const normalized = normalizeCircle(circle);
  // Privé a tout
  if (normalized === 'prive') return true;
  // Feature incluse dans le plan ?
  if (PLAN_FEATURES[normalized]?.includes(feature)) return true;
  // Feature débloquée (one-shot ou points) ?
  if (unlockedFeatures.includes(feature)) return true;
  return false;
}

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
