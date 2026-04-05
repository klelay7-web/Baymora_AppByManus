/**
 * Bundle Pipeline Agent — Pipeline SEO → Bundle → Parcours
 * Génère automatiquement 3 bundles (budget/moyen/luxe) et leurs parcours
 * depuis les fiches SEO d'une ville.
 *
 * Logique :
 *   1. Récupère les fiches SEO publiées/brouillon d'une ville
 *   2. Groupe par catégorie et niveau de prix
 *   3. Génère 3 bundles thématiques (budget < 500€, moyen 500-2000€, luxe > 2000€)
 *   4. Pour chaque bundle, génère un parcours sur mesure (itinéraire jour par jour)
 *   5. Sauvegarde tout en base
 */

import { invokeLLM } from "../../_core/llm";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SeoCardSummary {
  id: number;
  title: string;
  category: string;
  city: string;
  country: string;
  priceLevel: string;
  rating?: number;
  description: string;
  highlights?: string;
  tags?: string;
}

export interface GeneratedBundle {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  destination: string;
  duration: string;
  priceFrom: number;
  priceTo: number;
  currency: string;
  includes: string[];
  budgetTarget: "budget" | "moderate" | "premium" | "luxury";
  cityFocus: string;
  seoCardIds: number[];
  accessLevel: "free" | "explorer" | "premium" | "elite";
  isVip: boolean;
  tags: string[];
  coverImageDescription: string;
}

export interface GeneratedParcours {
  title: string;
  subtitle: string;
  description: string;
  destination: string;
  duration: string;
  budgetTarget: "budget" | "moderate" | "premium" | "luxury";
  days: Array<{
    day: number;
    title: string;
    morning?: string;
    afternoon?: string;
    evening?: string;
    tips?: string;
    establishments: string[];
  }>;
  totalBudget: string;
  includes: string[];
  tags: string[];
}

// ─── Génération de 3 bundles pour une ville ───────────────────────────────────
export async function generateCityBundles(
  city: string,
  country: string,
  seoCards: SeoCardSummary[]
): Promise<GeneratedBundle[]> {
  if (seoCards.length === 0) return [];

  const cardsSummary = seoCards
    .slice(0, 20) // Limiter pour le prompt
    .map(c => `- [${c.id}] ${c.title} (${c.category}, ${c.priceLevel || "upscale"}, ⭐${c.rating || 4.5})`)
    .join("\n");

  const prompt = `Tu es LÉNA, curatrice de contenus premium pour Maison Baymora.

Voici les fiches SEO disponibles pour ${city}, ${country} :
${cardsSummary}

Génère 3 bundles thématiques pour cette ville, un par niveau de budget :
1. **Budget** (< 500€ / personne) — accessible, authentique, meilleur rapport qualité-prix
2. **Premium** (500-2000€ / personne) — confort, expériences sélectionnées, sans compromis
3. **Luxe** (> 2000€ / personne) — ultra-exclusif, privatisations, accès VIP

Pour chaque bundle, utilise les fiches SEO les plus adaptées au budget.

Retourne UNIQUEMENT ce JSON (sans markdown) :
[
  {
    "slug": "paris-weekend-budget",
    "title": "Paris Essentiel — Le Meilleur de Paris",
    "subtitle": "3 jours à Paris sans se ruiner",
    "description": "Description 100-150 mots, ton Baymora",
    "category": "weekend",
    "destination": "${city}, ${country}",
    "duration": "3 jours / 2 nuits",
    "priceFrom": 350,
    "priceTo": 500,
    "currency": "EUR",
    "includes": ["Hébergement sélectionné", "Restaurants recommandés", "Activités guidées"],
    "budgetTarget": "budget",
    "cityFocus": "${city}",
    "seoCardIds": [1, 2, 3],
    "accessLevel": "explorer",
    "isVip": false,
    "tags": ["paris", "budget", "weekend", "gastronomie"],
    "coverImageDescription": "Vue panoramique de Paris au coucher du soleil"
  },
  {
    "slug": "paris-weekend-premium",
    ...
    "budgetTarget": "premium",
    "accessLevel": "premium",
    "isVip": false
  },
  {
    "slug": "paris-weekend-luxe",
    ...
    "budgetTarget": "luxury",
    "accessLevel": "elite",
    "isVip": true
  }
]`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Tu es LÉNA, curatrice premium. Tu génères uniquement du JSON valide." },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content as string ?? "[]";
  try {
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]) as GeneratedBundle[];
  } catch {
    return [];
  }
}

// ─── Génération d'un parcours pour un bundle ──────────────────────────────────
export async function generateParcoursForBundle(
  bundle: GeneratedBundle,
  seoCards: SeoCardSummary[]
): Promise<GeneratedParcours> {
  const linkedCards = seoCards.filter(c => bundle.seoCardIds.includes(c.id));
  const cardsList = linkedCards.map(c => `- ${c.title} (${c.category})`).join("\n");

  const budgetLabels = {
    budget: "< 500€",
    moderate: "500-1000€",
    premium: "1000-2000€",
    luxury: "> 2000€",
  };

  const prompt = `Tu es LÉNA, experte en parcours de voyage luxe pour Maison Baymora.

Crée un parcours détaillé pour le bundle "${bundle.title}" à ${bundle.destination}.
Budget : ${budgetLabels[bundle.budgetTarget]} / personne
Durée : ${bundle.duration}

Établissements disponibles :
${cardsList || "À définir selon le budget"}

Génère un itinéraire jour par jour, réaliste et inspirant.

Retourne UNIQUEMENT ce JSON (sans markdown) :
{
  "title": "${bundle.title} — Parcours Complet",
  "subtitle": "Votre itinéraire sur mesure",
  "description": "Description du parcours 80-120 mots",
  "destination": "${bundle.destination}",
  "duration": "${bundle.duration}",
  "budgetTarget": "${bundle.budgetTarget}",
  "days": [
    {
      "day": 1,
      "title": "Titre de la journée",
      "morning": "Programme du matin avec établissements précis",
      "afternoon": "Programme de l'après-midi",
      "evening": "Programme du soir",
      "tips": "Conseil pratique du jour",
      "establishments": ["Nom établissement 1", "Nom établissement 2"]
    }
  ],
  "totalBudget": "Estimation totale réaliste",
  "includes": ["Ce qui est inclus 1", "Ce qui est inclus 2"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Tu es LÉNA, experte parcours Baymora. Tu génères uniquement du JSON valide." },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content as string ?? "{}";
  try {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    return JSON.parse(match[0]) as GeneratedParcours;
  } catch {
    return {
      title: bundle.title,
      subtitle: "Parcours à définir",
      description: bundle.description,
      destination: bundle.destination,
      duration: bundle.duration,
      budgetTarget: bundle.budgetTarget,
      days: [],
      totalBudget: "Sur devis",
      includes: bundle.includes,
      tags: bundle.tags,
    };
  }
}

// ─── Pipeline complet SEO → Bundle → Parcours ────────────────────────────────
export interface PipelineResult {
  city: string;
  bundles: Array<{
    bundle: GeneratedBundle;
    parcours: GeneratedParcours;
    bundleId?: number;
    parcoursId?: number;
  }>;
  totalDuration: number;
}

export async function runSeoBundlePipeline(
  city: string,
  country: string,
  seoCards: SeoCardSummary[],
  onProgress?: (msg: string) => void
): Promise<PipelineResult> {
  const start = Date.now();

  onProgress?.(`📦 Génération des 3 bundles pour ${city}...`);
  const bundles = await generateCityBundles(city, country, seoCards);
  onProgress?.(`✅ ${bundles.length} bundles générés`);

  const results: PipelineResult["bundles"] = [];

  for (const bundle of bundles) {
    onProgress?.(`🗺️  Parcours pour "${bundle.title}"...`);
    const parcours = await generateParcoursForBundle(bundle, seoCards);
    results.push({ bundle, parcours });
    onProgress?.(`✅ Parcours "${bundle.budgetTarget}" prêt`);
  }

  return {
    city,
    bundles: results,
    totalDuration: Date.now() - start,
  };
}

// ─── Génération d'un article blog SEO (sans révéler le payant) ───────────────
export async function generateBlogArticle(
  city: string,
  country: string,
  seoCards: SeoCardSummary[],
  targetKeywords: string[]
): Promise<{
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  content: string;
  keywords: string[];
  callToAction: string;
}> {
  const cardsList = seoCards
    .slice(0, 10)
    .map(c => `- ${c.title} (${c.category})`)
    .join("\n");

  const prompt = `Tu es MAYA, experte en content marketing et SEO pour Maison Baymora.

Écris un article de blog SEO sur "${city}" qui :
1. Attire les voyageurs aisés via Google/GEO
2. Donne des informations de valeur (top 10, guides, secrets)
3. NE révèle PAS les contenus payants du site (bundles, parcours détaillés, accès VIP)
4. Incite à s'inscrire sur Maison Baymora pour "découvrir l'expérience complète"
5. Utilise les mots-clés : ${targetKeywords.join(", ")}

Établissements à mentionner (sans tout révéler) :
${cardsList}

Retourne UNIQUEMENT ce JSON :
{
  "title": "Top 15 Expériences Luxe à ${city} en 2025 — Guide Exclusif",
  "slug": "guide-luxe-${city.toLowerCase().replace(/\s+/g, "-")}-2025",
  "metaTitle": "max 60 chars avec mot-clé principal",
  "metaDescription": "max 155 chars avec appel à l'action",
  "content": "Article complet en Markdown, 800-1200 mots, avec titres H2/H3, listes, anecdotes. Mentionne les établissements sans donner tous les détails. Termine par un CTA vers Maison Baymora.",
  "keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3", "mot-clé 4", "mot-clé 5"],
  "callToAction": "Texte du CTA final (1-2 phrases)"
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Tu es MAYA, experte SEO et content marketing. Tu génères uniquement du JSON valide." },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content as string ?? "{}";
  try {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    return JSON.parse(match[0]) as {
      title: string;
      slug: string;
      metaTitle: string;
      metaDescription: string;
      content: string;
      keywords: string[];
      callToAction: string;
    };
  } catch {
    return {
      title: `Guide Luxe ${city} 2025`,
      slug: `guide-luxe-${city.toLowerCase().replace(/\s+/g, "-")}-2025`,
      metaTitle: `Guide Luxe ${city} 2025 — Maison Baymora`,
      metaDescription: `Découvrez les meilleures expériences luxe à ${city}. Guide exclusif Maison Baymora.`,
      content: `# Guide Luxe ${city} 2025\n\nContenu en cours de génération...`,
      keywords: targetKeywords,
      callToAction: `Découvrez l'expérience complète sur Maison Baymora.`,
    };
  }
}
