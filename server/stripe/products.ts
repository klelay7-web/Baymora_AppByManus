// ─── Plans Baymora ────────────────────────────────────────────────
// Découverte (gratuit) / Premium (14.90€/mois) / Privé (49.90€/mois)

export const PLANS = {
  decouverte: {
    id: "decouverte",
    name: "Découverte",
    price: 0,
    priceMonthly: 0,
    stripePriceId: null,
    credits: 15,
    rolloverCap: 45, // 3x quota
    description: "Découvrez Baymora gratuitement",
    features: [
      "15 crédits/mois",
      "3 messages gratuits sans compte",
      "Accès aux fiches établissements",
      "Carte interactive",
    ],
    limits: {
      opusMessages: 5, // 5 messages Opus max (3 crédits chacun = 15 crédits)
      sonnetMessages: 15,
      perplexitySearches: 0,
    },
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 1490, // en centimes
    priceMonthly: 14.90,
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM || "price_premium_monthly",
    credits: 200,
    rolloverCap: 600, // 3x quota
    description: "L'expérience complète Baymora",
    features: [
      "200 crédits/mois + rollover",
      "Claude Opus illimité",
      "Recherche Perplexity temps réel",
      "Parcours voyage complets",
      "Fiches établissements premium",
      "Partage & collaboration",
    ],
    limits: {
      opusMessages: 60, // 60 × 3 crédits = 180 crédits
      sonnetMessages: 200,
      perplexitySearches: 20,
    },
  },
  prive: {
    id: "prive",
    name: "Privé",
    price: 4990, // en centimes
    priceMonthly: 49.90,
    stripePriceId: process.env.STRIPE_PRICE_PRIVE || "price_prive_monthly",
    credits: -1, // illimité
    rolloverCap: -1,
    description: "Accès total, sans limites",
    features: [
      "Crédits illimités",
      "Claude Opus prioritaire",
      "Accès Off-Market",
      "Conciergerie humaine incluse",
      "Expériences VIP incluses",
      "Support dédié 24/7",
      "Accès anticipé nouvelles fonctionnalités",
    ],
    limits: {
      opusMessages: -1,
      sonnetMessages: -1,
      perplexitySearches: -1,
    },
  },
} as const;

// ─── Feature Unlocks (one-shot) ───────────────────────────────────
export const FEATURE_UNLOCKS = {
  vip_experiences: {
    id: "vip_experiences",
    name: "Expériences VIP",
    priceEur: 14.90,
    priceCents: 1490,
    durationDays: 30,
    pointsAlternative: 1500,
    stripePriceId: process.env.STRIPE_PRICE_VIP || "price_vip_oneshot",
    description: "Accès aux expériences exclusives pendant 30 jours",
    icon: "👑",
  },
  concierge_humain: {
    id: "concierge_humain",
    name: "Conciergerie Humaine",
    priceEur: 19.90,
    priceCents: 1990,
    durationDays: 7,
    pointsAlternative: 2000,
    stripePriceId: process.env.STRIPE_PRICE_CONCIERGE || "price_concierge_oneshot",
    description: "Un concierge humain dédié pendant 7 jours",
    icon: "🏛️",
  },
  off_market: {
    id: "off_market",
    name: "Accès Off-Market",
    priceEur: 9.90,
    priceCents: 990,
    durationDays: 30,
    pointsAlternative: 3000,
    stripePriceId: process.env.STRIPE_PRICE_OFFMARKET || "price_offmarket_oneshot",
    description: "Pépites secrètes et adresses confidentielles",
    icon: "🔐",
  },
} as const;

// ─── Coûts en crédits ─────────────────────────────────────────────
export const CREDIT_COSTS = {
  claude_opus: 3,
  claude_sonnet: 1,
  perplexity_search: 1,
  image_generation: 5,
  voice_transcription: 1,
} as const;

// ─── Programme Créateur (points) ──────────────────────────────────
export const CREATOR_POINTS = {
  publish_itinerary: 50,
  verify_with_photos: 200,
  verify_bonus_credits: 50, // crédits bonus en plus des points
  submit_venue: 25,
  submit_venue_accepted: 100,
  itinerary_used: 30,
  cashout_rate: 100, // 100 pts = 1€
  cashout_min: 1000, // minimum 1000 pts pour cashout
  cashout_max_monthly: 500, // max 500€/mois
} as const;

// ─── Tiers d'abonnement → plan ────────────────────────────────────
export function getTierFromPlan(plan: string): "free" | "premium" | "elite" {
  if (plan === "prive") return "elite";
  if (plan === "premium") return "premium";
  return "free";
}

export function getPlanFromTier(tier: string): keyof typeof PLANS {
  if (tier === "elite") return "prive";
  if (tier === "premium") return "premium";
  return "decouverte";
}

export function isUnlimited(plan: string): boolean {
  return plan === "prive";
}

export function getMonthlyCredits(plan: string): number {
  return PLANS[plan as keyof typeof PLANS]?.credits ?? 15;
}
