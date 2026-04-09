// ⚠️ Tarifs V7 validés — Maison Baymora Social Club Premium
// invité : Gratuit (3 conversations)
// membre : 9,90€/mois ou 99€/an
// duo : 14,90€/mois ou 149€/an
// cercle : 149€/an — Fondateur à vie (500 places)

// ─── Plans Baymora ────────────────────────────────────────────────
export const PLANS = {
  invite: {
    id: "invite",
    name: "Invité",
    price: 0,
    priceMonthly: 0,
    stripePriceId: null,
    credits: 3,
    rolloverCap: 9,
    description: "3 conversations avec Maya, accès aux adresses publiques",
    features: [
      "3 conversations avec Maya",
      "Accès aux adresses publiques",
      "Aperçu des privilèges",
    ],
    limits: {
      opusMessages: 3,
      sonnetMessages: 3,
      perplexitySearches: 0,
    },
  },
  membre: {
    id: "membre",
    name: "Membre",
    price: 990, // en centimes (mensuel)
    priceMonthly: 9.90,
    stripePriceId: process.env.STRIPE_PRICE_MEMBRE || "price_membre_monthly",
    stripePriceIdAnnual: process.env.STRIPE_PRICE_MEMBRE_ANNUAL || "price_membre_annual",
    credits: 200,
    rolloverCap: 600,
    description: "Maya illimitée, parcours & cartes illimités, privilèges partenaires.",
    features: [
      "Maya illimitée",
      "Parcours & cartes illimités",
      "Privilèges partenaires",
      "Feed local \"Ma position\"",
      "Mode Business",
      "Mémoire de conversation conservée",
    ],
    limits: {
      opusMessages: 60,
      sonnetMessages: 200,
      perplexitySearches: 20,
    },
  },
  duo: {
    id: "duo",
    name: "Duo",
    price: 1490, // en centimes (mensuel)
    priceMonthly: 14.90,
    stripePriceId: process.env.STRIPE_PRICE_DUO || "price_duo_monthly",
    stripePriceIdAnnual: process.env.STRIPE_PRICE_DUO_ANNUAL || "price_duo_annual",
    credits: 400,
    rolloverCap: 1200,
    description: "Tout Membre pour 2 profils, parcours en commun.",
    features: [
      "Tout Membre pour 2 profils",
      "Parcours en commun",
      "Préférences croisées",
      "Partage de favoris",
    ],
    limits: {
      opusMessages: 120,
      sonnetMessages: 400,
      perplexitySearches: 40,
    },
  },
  cercle: {
    id: "cercle",
    name: "Le Cercle",
    price: 14900, // en centimes (annuel)
    priceMonthly: 149,
    stripePriceId: process.env.STRIPE_PRICE_CERCLE || "price_cercle_annual",
    credits: 500,
    rolloverCap: 1500,
    description: "Adhésion Fondateur à vie — 500 premières places.",
    features: [
      "Tout Membre",
      "Maya mode Prestige",
      "Le Secret du Jour",
      "Événements privés Cercle",
      "2 invitations/mois",
      "Badge Fondateur (500 places)",
    ],
    limits: {
      opusMessages: 100,
      sonnetMessages: 500,
      perplexitySearches: 50,
    },
  },
} as const;

// ─── Packs Conversations One-Time (V7) ───────────────────────────
export const CREDIT_PACKS = {
  pack_5: {
    id: "pack_5",
    name: "5 conversations",
    credits: 5,
    priceEur: 4.99,
    priceCents: 499,
    stripePriceId: process.env.STRIPE_PRICE_PACK_5 || "price_pack_5",
    description: "5 conversations avec Maya",
    icon: "⚡",
    popular: false,
  },
  pack_15: {
    id: "pack_15",
    name: "15 conversations",
    credits: 15,
    priceEur: 9.99,
    priceCents: 999,
    stripePriceId: process.env.STRIPE_PRICE_PACK_15 || "price_pack_15",
    description: "15 conversations — idéal pour planifier un voyage complet",
    icon: "✨",
    popular: true,
  },
  pack_40: {
    id: "pack_40",
    name: "40 conversations",
    credits: 40,
    priceEur: 19.99,
    priceCents: 1999,
    stripePriceId: process.env.STRIPE_PRICE_PACK_40 || "price_pack_40",
    description: "40 conversations — l'équivalent d'un mois Membre",
    icon: "👑",
    popular: false,
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
  verify_bonus_credits: 50,
  submit_venue: 25,
  submit_venue_accepted: 100,
  itinerary_used: 30,
  cashout_rate: 100,
  cashout_min: 1000,
  cashout_max_monthly: 500,
} as const;

// ─── Tiers d'adhésion → plan ──────────────────────────────────────
export function getTierFromPlan(plan: string): "free" | "premium" | "elite" {
  if (plan === "cercle") return "elite";
  if (plan === "duo" || plan === "membre") return "premium";
  return "free";
}

export function getPlanFromTier(tier: string): keyof typeof PLANS {
  if (tier === "elite") return "cercle";
  if (tier === "premium") return "membre";
  return "invite";
}

export function isUnlimited(_plan: string): boolean {
  return false;
}

export function getMonthlyCredits(plan: string): number {
  return PLANS[plan as keyof typeof PLANS]?.credits ?? 3;
}
