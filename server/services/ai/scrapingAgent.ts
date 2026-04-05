/**
 * ─── MANUS Scraping Agent ────────────────────────────────────────────────────
 * Agent terrain de MANUS : recherche live via Perplexity + LLM pour enrichir
 * les fiches SEO avec des données réelles (photos, horaires, avis, vidéos virales).
 *
 * Pipeline pour chaque établissement :
 *   1. Recherche Perplexity → infos générales, horaires, téléphone, prix
 *   2. Recherche Perplexity → avis TripAdvisor / Google Maps (note, highlights)
 *   3. Recherche Perplexity → vidéos virales TikTok / Instagram / YouTube
 *   4. LLM → synthèse SEO (metaTitle, metaDescription, highlights, anecdotes)
 *   5. Sauvegarde en base → seoCards enrichie
 */

import { invokeLLM } from "../../_core/llm";

export interface EstablishmentInput {
  id: number;
  name: string;
  city: string;
  category: string;
  address?: string;
}

export interface ScrapedData {
  phone?: string;
  website?: string;
  hours?: string;
  priceRange?: string;
  rating?: number;
  reviewCount?: number;
  highlights?: string[];
  anecdotes?: string[];
  viralVideos?: { platform: string; url: string; description: string; views?: string }[];
  photos?: string[];
  instagramHandle?: string;
  tiktokHandle?: string;
  description?: string;
  atmosphere?: string;
  bestFor?: string[];
  tags?: string[];
}

export interface SeoFiche {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  city: string;
  country: string;
  region: string;
  description: string;
  highlights: string[];
  practicalInfo: Record<string, string>;
  metaTitle: string;
  metaDescription: string;
  imageUrl: string;
  galleryUrls: string[];
  rating: number;
  priceLevel: number;
  tags: string[];
  status: "draft" | "published";
  generatedBy: string;
  lenaCreated: boolean;
  sourceType: string;
  viralVideos?: { platform: string; url: string; description: string }[];
}

// ─── Recherche Perplexity via l'API ──────────────────────────────────────────
async function searchPerplexity(query: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.warn("[ScrapingAgent] PERPLEXITY_API_KEY manquante, utilisation LLM seul");
    return "";
  }
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "Tu es un assistant de recherche pour une agence de conciergerie de luxe. Réponds en français avec des informations précises et vérifiées. Inclus toujours les sources.",
          },
          { role: "user", content: query },
        ],
        max_tokens: 1500,
        temperature: 0.2,
        search_recency_filter: "month",
        return_citations: true,
      }),
    });
    if (!response.ok) {
      console.error("[ScrapingAgent] Perplexity error:", response.status);
      return "";
    }
    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    console.error("[ScrapingAgent] Perplexity fetch error:", err);
    return "";
  }
}

// ─── Étape 1 : Infos générales ────────────────────────────────────────────────
async function scrapeGeneralInfo(estab: EstablishmentInput): Promise<string> {
  const query = `Donne-moi les informations complètes sur "${estab.name}" à ${estab.city} :
- Numéro de téléphone officiel
- Site web officiel
- Horaires d'ouverture détaillés
- Fourchette de prix (€, €€, €€€, €€€€)
- Note moyenne (TripAdvisor ou Google)
- Nombre d'avis
- Description de l'ambiance et de l'expérience
- Ce pour quoi l'établissement est le plus connu
- Anecdotes ou faits marquants sur cet établissement
- Handle Instagram officiel si disponible`;
  return searchPerplexity(query);
}

// ─── Étape 2 : Avis et highlights ────────────────────────────────────────────
async function scrapeReviews(estab: EstablishmentInput): Promise<string> {
  const query = `Quels sont les meilleurs avis et points forts de "${estab.name}" à ${estab.city} selon TripAdvisor et Google ?
- Les 5 points forts les plus mentionnés dans les avis
- Ce que les clients adorent le plus
- Les plats/services/expériences signature
- Les moments les plus instagrammables
- Les conseils des habitués`;
  return searchPerplexity(query);
}

// ─── Étape 3 : Vidéos virales ─────────────────────────────────────────────────
async function scrapeViralVideos(estab: EstablishmentInput): Promise<string> {
  const query = `Trouve les vidéos TikTok, Instagram Reels et YouTube les plus virales sur "${estab.name}" à ${estab.city} :
- URLs ou descriptions des vidéos les plus populaires
- Nombre de vues approximatif
- Créateurs de contenu qui ont visité l'établissement
- Hashtags populaires associés
- Tendances visuelles (ce qui est le plus filmé/photographié)`;
  return searchPerplexity(query);
}

// ─── Étape 4 : Synthèse SEO via LLM ──────────────────────────────────────────
async function generateSeoContent(
  estab: EstablishmentInput,
  generalInfo: string,
  reviews: string,
  viralVideos: string
): Promise<SeoFiche> {
  const prompt = `Tu es LÉNA, experte SEO pour Maison Baymora, une agence de conciergerie de luxe.

À partir des données terrain collectées par MANUS, génère une fiche SEO complète et premium pour :
**${estab.name}** — ${estab.category} à ${estab.city}

## Données terrain collectées :

### Informations générales :
${generalInfo || "Non disponible — génère à partir de ta connaissance"}

### Avis et highlights :
${reviews || "Non disponible — génère à partir de ta connaissance"}

### Vidéos virales :
${viralVideos || "Non disponible — génère à partir de ta connaissance"}

## Instructions :
- Ton Baymora : luxe accessible, chaleureux, authentique, premium sans être snob
- SEO optimisé pour les recherches "meilleur [catégorie] [ville]", "expérience luxe [ville]"
- Highlights : 5 points forts uniques et précis (pas génériques)
- Tags : 8-12 mots-clés SEO pertinents
- metaTitle : max 60 caractères, inclut le nom et la ville
- metaDescription : max 160 caractères, accrocheur et informatif

Réponds UNIQUEMENT avec un JSON valide (pas de markdown, pas d'explication) :
{
  "slug": "nom-etablissement-ville",
  "title": "Nom officiel complet",
  "subtitle": "Tagline premium (max 80 chars)",
  "category": "${estab.category}",
  "city": "${estab.city}",
  "country": "France ou pays",
  "region": "Région ou arrondissement",
  "description": "Description premium 150-200 mots, ton Baymora",
  "highlights": ["Point fort 1", "Point fort 2", "Point fort 3", "Point fort 4", "Point fort 5"],
  "practicalInfo": {
    "phone": "+33...",
    "website": "https://...",
    "hours": "Lun-Dim : ...",
    "priceRange": "€€€",
    "address": "${estab.address || estab.city}",
    "reservationRequired": "Oui / Non recommandé",
    "dresscode": "Smart casual / Tenue de soirée / Décontracté"
  },
  "metaTitle": "max 60 chars",
  "metaDescription": "max 160 chars",
  "imageUrl": "",
  "galleryUrls": [],
  "rating": 4.5,
  "priceLevel": 3,
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"],
  "status": "draft",
  "generatedBy": "MANUS+LÉNA",
  "lenaCreated": true,
  "sourceType": "manus_scraping",
  "viralVideos": [
    {"platform": "TikTok", "url": "", "description": "Description de la vidéo virale"},
    {"platform": "Instagram", "url": "", "description": "Description du reel viral"}
  ]
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Tu es LÉNA, experte SEO de Maison Baymora. Tu génères uniquement du JSON valide, sans markdown ni explication." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "seo_fiche",
        strict: false,
        schema: {
          type: "object",
          properties: {
            slug: { type: "string" },
            title: { type: "string" },
            subtitle: { type: "string" },
            category: { type: "string" },
            city: { type: "string" },
            country: { type: "string" },
            region: { type: "string" },
            description: { type: "string" },
            highlights: { type: "array", items: { type: "string" } },
            practicalInfo: { type: "object" },
            metaTitle: { type: "string" },
            metaDescription: { type: "string" },
            imageUrl: { type: "string" },
            galleryUrls: { type: "array", items: { type: "string" } },
            rating: { type: "number" },
            priceLevel: { type: "number" },
            tags: { type: "array", items: { type: "string" } },
            status: { type: "string" },
            generatedBy: { type: "string" },
            lenaCreated: { type: "boolean" },
            sourceType: { type: "string" },
            viralVideos: { type: "array" },
          },
          required: ["slug", "title", "description", "highlights", "metaTitle", "metaDescription"],
          additionalProperties: true,
        },
      },
    },
  });

  const rawContent = response.choices?.[0]?.message?.content;
  if (!rawContent) throw new Error("LLM n'a pas retourné de contenu");
  const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);

  try {
    return JSON.parse(content) as SeoFiche;
  } catch {
    // Fallback : extraire le JSON du texte
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as SeoFiche;
    throw new Error("Impossible de parser le JSON de la fiche SEO");
  }
}

// ─── Fonction principale : enrichir un établissement ─────────────────────────
export async function enrichEstablishment(
  estab: EstablishmentInput,
  onProgress?: (step: string, progress: number) => void
): Promise<SeoFiche> {
  console.log(`[ScrapingAgent] Enrichissement de "${estab.name}" (${estab.city})`);

  onProgress?.("Recherche informations générales...", 10);
  const generalInfo = await scrapeGeneralInfo(estab);
  console.log(`[ScrapingAgent] Infos générales récupérées (${generalInfo.length} chars)`);

  onProgress?.("Analyse des avis et highlights...", 35);
  const reviews = await scrapeReviews(estab);
  console.log(`[ScrapingAgent] Avis récupérés (${reviews.length} chars)`);

  onProgress?.("Recherche vidéos virales...", 60);
  const viralVideos = await scrapeViralVideos(estab);
  console.log(`[ScrapingAgent] Vidéos virales récupérées (${viralVideos.length} chars)`);

  onProgress?.("Génération fiche SEO par LÉNA...", 80);
  const fiche = await generateSeoContent(estab, generalInfo, reviews, viralVideos);
  console.log(`[ScrapingAgent] Fiche SEO générée : "${fiche.title}"`);

  onProgress?.("Fiche complète ✓", 100);
  return fiche;
}

// ─── Campagne : enrichir plusieurs établissements ────────────────────────────
export interface CampaignResult {
  establishmentId: number;
  establishmentName: string;
  status: "success" | "error";
  fiche?: SeoFiche;
  error?: string;
  duration?: number;
}

export async function runSeoEnrichmentCampaign(
  establishments: EstablishmentInput[],
  onProgress?: (current: number, total: number, name: string, step: string) => void
): Promise<CampaignResult[]> {
  const results: CampaignResult[] = [];

  for (let i = 0; i < establishments.length; i++) {
    const estab = establishments[i];
    const start = Date.now();
    try {
      onProgress?.(i + 1, establishments.length, estab.name, "Démarrage...");
      const fiche = await enrichEstablishment(estab, (step) => {
        onProgress?.(i + 1, establishments.length, estab.name, step);
      });
      results.push({
        establishmentId: estab.id,
        establishmentName: estab.name,
        status: "success",
        fiche,
        duration: Date.now() - start,
      });
    } catch (err) {
      console.error(`[ScrapingAgent] Erreur pour "${estab.name}":`, err);
      results.push({
        establishmentId: estab.id,
        establishmentName: estab.name,
        status: "error",
        error: err instanceof Error ? err.message : "Erreur inconnue",
        duration: Date.now() - start,
      });
    }
  }

  return results;
}
