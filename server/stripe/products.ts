// ⚠️ NE PAS MODIFIER — Tarifs validés par Kevin
// decouverte : Gratuit
// social : 9,90€/mois
// duo : 14,90€/mois
// annuel : 89€/an
// Le plan "prive" (49,90€) est SUPPRIMÉ.
// Utiliser les noms : social, duo, annuel (PAS premium, prive)

// ─── Plans Baymora ────────────────────────────────────────────────
export const PLANS = {
  decouverte: {
    id: "decouverte",
    name: "Découverte",
    price: 0,
    priceMonthly: 0,
    stripePriceId: null,
    credits: 3,
    rolloverCap: 9,
    description: "Découvrez Maya avec 3 messages gratuits",
    features: [
      "3 messages avec Maya",
      "Accès aux offres publiques",
      "Aperçu des bundles",
    ],
    limits: {
      opusMessages: 3,
      sonnetMessages: 3,
      perplexitySearches: 0,
    },
  },
  social: {
    id: "social",
    name: "Social Club",
    price: 990, // en centimes
    priceMonthly: 9.90,
    stripePriceId: process.env.STRIPE_PRICE_SOCIAL || "price_social_monthly",
    credits: 200,
    rolloverCap: 600,
    description: "L'accès complet à Maya et aux meilleures adresses négociées.",
    features: [
      "Conversations illimitées avec Maya",
      "Accès à toutes les offres négociées",
      "Bundles et parcours premium",
      "Sélections exclusives Baymora",
      "Mémoire de conversation conservée",
      "Alertes offres flash en temps réel",
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
    price: 1490, // en centimes
    priceMonthly: 14.90,
    stripePriceId: process.env.STRIPE_PRICE_DUO || "price_duo_monthly",
    credits: 400,
    rolloverCap: 1200,
    description: "Partagez l'accès avec votre partenaire ou un proche.",
    features: [
      "Tout le Social Club",
      "2 profils distincts",
      "Recommandations en couple",
      "Parcours duo personnalisés",
      "Partage de favoris",
    ],
    limits: {
      opusMessages: 120,
      sonnetMessages: 400,
      perplexitySearches: 40,
    },
  },
  annuel: {
    id: "annuel",
    name: "Annuel",
    price: 8900, // en centimes
    priceMonthly: 89,
    stripePriceId: process.env.STRIPE_PRICE_ANNUEL || "price_annuel_yearly",
    credits: 200,
    rolloverCap: 600,
    description: "Le Social Club pour toute l'année, avec deux mois offerts.",
    features: [
      "Tout le Social Club",
      "Économisez 30€ par an",
      "Accès prioritaire aux nouveautés",
      "Support dédié",
    ],
    limits: {
      opusMessages: 60,
      sonnetMessages: 200,
      perplexitySearches: 20,
    },
  },
} as const;

// ─── Packs Crédits One-Time (Sprint 5 V6) ────────────────────────
export const CREDIT_PACKS = {
  boost_10: {
    id: "boost_10",
    name: "Boost 10 crédits",
    credits: 10,
    priceEur: 1.99,
    priceCents: 199,
    stripePriceId: process.env.STRIPE_PRICE_CREDITS_10 || "price_credits_10",
    description: "10 crédits supplémentaires pour continuer avec Maya",
    icon: "⚡",
    popular: false,
  },
  boost_50: {
    id: "boost_50",
    name: "Pack 50 crédits",
    credits: 50,
    priceEur: 7.99,
    priceCents: 799,
    stripePriceId: process.env.STRIPE_PRICE_CREDITS_50 || "price_credits_50",
    description: "50 crédits — idéal pour planifier un voyage complet",
    icon: "✨",
    popular: true,
  },
  boost_200: {
    id: "boost_200",
    name: "Pack 200 crédits",
    credits: 200,
    priceEur: 24.99,
    priceCents: 2499,
    stripePriceId: process.env.STRIPE_PRICE_CREDITS_200 || "price_credits_200",
    description: "200 crédits — l'équivalent d'un mois Social Club",
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
  concierge_humain: {
    id: "concierge_humain",
    name: "Social Club Humaine",
    priceEur: 19.90,
    priceCents: 1990,
    durationDays: 7,
    pointsAlternative: 2000,
    stripePriceId: process.env.STRIPE_PRICE_CONCIERGE || "price_concierge_oneshot",
    description: "Un expert Maison Baymora dédié pendant 7 jours",
    icon: "🏛️",
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

// ─── Tiers d'abonnement → plan ────────────────────────────────────
export function getTierFromPlan(plan: string): "free" | "premium" | "elite" {
  if (plan === "duo" || plan === "annuel" || plan === "social") return "premium";
  return "free";
}

export function getPlanFromTier(tier: string): keyof typeof PLANS {
  if (tier === "premium" || tier === "elite") return "social";
  return "decouverte";
}

export function isUnlimited(_plan: string): boolean {
  return false;
}

export function getMonthlyCredits(plan: string): number {
  return PLANS[plan as keyof typeof PLANS]?.credits ?? 3;
}
