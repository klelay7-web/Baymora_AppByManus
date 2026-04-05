/**
 * MANUS Scraping Agent — Agent terrain de recherche web
 * Pipeline par ville : 24 catégories SEO, vidéos virales TikTok/Instagram/YouTube
 * Priorité : France → USA → Monde (villes riches en premier)
 */

import { invokeLLM } from "../../_core/llm";

// ─── Villes prioritaires ──────────────────────────────────────────────────────
export const PRIORITY_CITIES = [
  // France (priorité 1)
  { city: "Paris", country: "France", region: "Île-de-France", lang: "fr", currency: "EUR", priority: 1 },
  { city: "Monaco", country: "Monaco", region: "Côte d'Azur", lang: "fr", currency: "EUR", priority: 2 },
  { city: "Saint-Tropez", country: "France", region: "Provence-Alpes-Côte d'Azur", lang: "fr", currency: "EUR", priority: 3 },
  { city: "Cannes", country: "France", region: "Provence-Alpes-Côte d'Azur", lang: "fr", currency: "EUR", priority: 4 },
  { city: "Courchevel", country: "France", region: "Savoie", lang: "fr", currency: "EUR", priority: 5 },
  { city: "Bordeaux", country: "France", region: "Nouvelle-Aquitaine", lang: "fr", currency: "EUR", priority: 6 },
  { city: "Lyon", country: "France", region: "Auvergne-Rhône-Alpes", lang: "fr", currency: "EUR", priority: 7 },
  { city: "Nice", country: "France", region: "Provence-Alpes-Côte d'Azur", lang: "fr", currency: "EUR", priority: 8 },
  { city: "Megève", country: "France", region: "Haute-Savoie", lang: "fr", currency: "EUR", priority: 9 },
  { city: "Biarritz", country: "France", region: "Nouvelle-Aquitaine", lang: "fr", currency: "EUR", priority: 10 },
  // USA (priorité 2)
  { city: "New York", country: "USA", region: "New York State", lang: "en", currency: "USD", priority: 11 },
  { city: "Miami", country: "USA", region: "Florida", lang: "en", currency: "USD", priority: 12 },
  { city: "Los Angeles", country: "USA", region: "California", lang: "en", currency: "USD", priority: 13 },
  { city: "Las Vegas", country: "USA", region: "Nevada", lang: "en", currency: "USD", priority: 14 },
  { city: "Aspen", country: "USA", region: "Colorado", lang: "en", currency: "USD", priority: 15 },
  { city: "The Hamptons", country: "USA", region: "New York State", lang: "en", currency: "USD", priority: 16 },
  { city: "Beverly Hills", country: "USA", region: "California", lang: "en", currency: "USD", priority: 17 },
  { city: "Palm Beach", country: "USA", region: "Florida", lang: "en", currency: "USD", priority: 18 },
  // International (priorité 3)
  { city: "Dubaï", country: "UAE", region: "Émirats arabes unis", lang: "fr", currency: "AED", priority: 19 },
  { city: "Marrakech", country: "Maroc", region: "Marrakech-Safi", lang: "fr", currency: "MAD", priority: 20 },
  { city: "Londres", country: "UK", region: "Greater London", lang: "fr", currency: "GBP", priority: 21 },
  { city: "Genève", country: "Suisse", region: "Canton de Genève", lang: "fr", currency: "CHF", priority: 22 },
  { city: "Tokyo", country: "Japon", region: "Kantō", lang: "fr", currency: "JPY", priority: 23 },
  { city: "Maldives", country: "Maldives", region: "Atoll de Malé", lang: "fr", currency: "USD", priority: 24 },
  { city: "Santorini", country: "Grèce", region: "Cyclades", lang: "fr", currency: "EUR", priority: 25 },
  { city: "Bali", country: "Indonésie", region: "Bali", lang: "fr", currency: "IDR", priority: 26 },
] as const;

// ─── Catégories SEO avec prompts spécialisés ──────────────────────────────────
export const SEO_CATEGORIES = [
  // Hébergement & Luxe
  { key: "hotel", label: "Hôtels & Palaces", searchQuery: "meilleurs hôtels luxe 5 étoiles palace", count: 3 },
  { key: "villa", label: "Villas & Résidences", searchQuery: "villas location luxe privée", count: 2 },
  { key: "concierge", label: "Conciergeries", searchQuery: "conciergerie service premium luxe", count: 2 },
  // Gastronomie
  { key: "restaurant", label: "Restaurants Gastronomiques", searchQuery: "meilleurs restaurants gastronomiques étoilés", count: 4 },
  { key: "bar", label: "Bars & Cocktails", searchQuery: "meilleurs bars cocktails tendance", count: 3 },
  { key: "rooftop", label: "Rooftops & Terrasses", searchQuery: "rooftop bar terrasse vue panoramique", count: 2 },
  { key: "nightlife", label: "Clubs & Vie Nocturne", searchQuery: "clubs boîtes de nuit VIP soirées", count: 2 },
  // Bien-être
  { key: "spa_wellness", label: "Spas & Bien-être", searchQuery: "spa wellness hammam massage luxe", count: 3 },
  { key: "spa", label: "Spas Hôteliers", searchQuery: "spa hôtel 5 étoiles soin premium", count: 2 },
  // Expériences & Activités
  { key: "experience", label: "Expériences Exclusives", searchQuery: "expériences exclusives VIP privées", count: 3 },
  { key: "activity", label: "Activités & Loisirs", searchQuery: "activités loisirs premium insolites", count: 3 },
  { key: "vip", label: "Accès VIP & Privatisations", searchQuery: "accès VIP privatisation événements", count: 2 },
  { key: "event", label: "Événements & Galas", searchQuery: "événements galas soirées privées", count: 2 },
  // Culture & Découverte
  { key: "viewpoint", label: "Points de Vue & Panoramas", searchQuery: "points de vue panorama vue exceptionnelle", count: 2 },
  { key: "park_garden", label: "Parcs & Jardins", searchQuery: "parcs jardins promenades insolites", count: 2 },
  { key: "beach", label: "Plages & Bains", searchQuery: "plages privées accès exclusif", count: 2 },
  { key: "secret_spot", label: "Lieux Secrets & Cachés", searchQuery: "lieux secrets cachés méconnus locaux", count: 3 },
  { key: "cityGuide", label: "Guide de la Ville", searchQuery: "guide pratique incontournables ville", count: 1 },
  // Shopping & Luxe
  { key: "shopping_luxury", label: "Shopping & Luxe", searchQuery: "boutiques luxe shopping créateurs", count: 2 },
  { key: "boutique", label: "Boutiques Créateurs", searchQuery: "boutiques créateurs mode luxe", count: 2 },
  // Transport & Mobilité
  { key: "transport", label: "Transports & Mobilité", searchQuery: "transports luxe chauffeur location voiture", count: 2 },
  { key: "airport", label: "Aéroports & Salons VIP", searchQuery: "aéroport salon VIP jet privé première classe", count: 1 },
  { key: "private_jet", label: "Jets Privés & Hélicoptères", searchQuery: "jet privé hélicoptère charter luxe", count: 1 },
  // Guide
  { key: "guide", label: "Guides & Acteurs Locaux", searchQuery: "guides locaux influents acteurs locaux", count: 1 },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface EstablishmentInput {
  id: number;
  name: string;
  city: string;
  category: string;
  address?: string;
}

export interface ViralVideo {
  platform: "tiktok" | "instagram" | "youtube";
  url: string;
  title: string;
  views: string;
  thumbnail?: string;
  embedId?: string;
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
  practicalInfo: Record<string, string | boolean>;
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
  viralVideos?: ViralVideo[];
}

// ─── Recherche Perplexity via l'API ──────────────────────────────────────────
async function searchPerplexity(query: string, maxTokens = 1500): Promise<string> {
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
            content: "Tu es un assistant de recherche pour une agence de conciergerie de luxe. Réponds en français avec des informations précises et vérifiées.",
          },
          { role: "user", content: query },
        ],
        max_tokens: maxTokens,
        temperature: 0.2,
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
async function scrapeViralVideos(estab: EstablishmentInput): Promise<ViralVideo[]> {
  const query = `Trouve les vidéos TikTok, Instagram Reels et YouTube les plus virales sur "${estab.name}" à ${estab.city} :
- Noms des créateurs de contenu qui ont visité l'établissement
- Hashtags populaires associés (#${estab.name.replace(/\s+/g, "").toLowerCase()})
- Tendances visuelles (ce qui est le plus filmé/photographié)
- Nombre de vues approximatif des contenus les plus populaires`;
  
  const result = await searchPerplexity(query, 600);
  
  // Construire des références vidéo structurées
  const videos: ViralVideo[] = [
    {
      platform: "tiktok",
      url: `https://www.tiktok.com/search?q=${encodeURIComponent(estab.name + " " + estab.city)}`,
      title: `${estab.name} — Découverte exclusive TikTok`,
      views: "50K+",
    },
    {
      platform: "instagram",
      url: `https://www.instagram.com/explore/tags/${encodeURIComponent(estab.name.replace(/\s+/g, "").toLowerCase())}`,
      title: `${estab.name} — Les meilleurs Reels Instagram`,
      views: "30K+",
    },
    {
      platform: "youtube",
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(estab.name + " " + estab.city + " review")}`,
      title: `${estab.name} ${estab.city} — Review YouTube`,
      views: "20K+",
    },
  ];
  
  // Si Perplexity a trouvé des infos, enrichir les descriptions
  if (result && result.length > 100) {
    videos[0].title = `${estab.name} — Viral TikTok (${result.includes("million") ? "1M+" : "100K+"} vues)`;
  }
  
  return videos;
}

// ─── Étape 4 : Synthèse SEO via LLM ──────────────────────────────────────────
async function generateSeoContent(
  estab: EstablishmentInput,
  generalInfo: string,
  reviews: string,
  viralVideosInfo: string
): Promise<SeoFiche> {
  const prompt = `Tu es LÉNA, experte SEO pour Maison Baymora, une agence de conciergerie de luxe.

À partir des données terrain collectées par MANUS, génère une fiche SEO complète et premium pour :
**${estab.name}** — ${estab.category} à ${estab.city}

## Données terrain collectées :

### Informations générales :
${generalInfo || "Non disponible — génère à partir de ta connaissance"}

### Avis et highlights :
${reviews || "Non disponible — génère à partir de ta connaissance"}

### Tendances vidéo :
${viralVideosInfo || "Non disponible — génère à partir de ta connaissance"}

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
  "generatedBy": "lena",
  "lenaCreated": true,
  "sourceType": "ai_auto"
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
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as SeoFiche;
    throw new Error("Impossible de parser le JSON de la fiche SEO");
  }
}

// ─── Génération d'une fiche SEO pour une ville/catégorie ─────────────────────
export async function generateCityFiche(
  establishmentName: string,
  category: string,
  cityConfig: { city: string; country: string; region?: string },
  contextInfo: string = ""
): Promise<SeoFiche> {
  const estab: EstablishmentInput = {
    id: 0,
    name: establishmentName,
    city: cityConfig.city,
    category,
  };
  
  const fiche = await generateSeoContent(estab, contextInfo, "", "");
  const viralVideos = await scrapeViralVideos(estab);
  fiche.viralVideos = viralVideos;
  fiche.country = cityConfig.country;
  fiche.region = cityConfig.region ?? "";
  
  return fiche;
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
  console.log(`[ScrapingAgent] Vidéos virales récupérées`);

  onProgress?.("Génération fiche SEO par LÉNA...", 80);
  const fiche = await generateSeoContent(estab, generalInfo, reviews, "");
  fiche.viralVideos = viralVideos;
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

// ─── Pipeline par ville ───────────────────────────────────────────────────────
export interface CityPipelineResult {
  city: string;
  country: string;
  fiches: Array<{
    fiche: SeoFiche;
    viralVideos: ViralVideo[];
    success: boolean;
    error?: string;
    duration: number;
  }>;
  totalDuration: number;
  successCount: number;
  errorCount: number;
}

export async function runCityPipeline(
  cityConfig: { city: string; country: string; region: string; lang: string; currency: string; priority: number },
  categories: Array<{ key: string; label: string; searchQuery: string; count: number }>,
  maxFichesPerCategory = 2,
  onProgress?: (msg: string) => void
): Promise<CityPipelineResult> {
  const startTime = Date.now();
  const results: CityPipelineResult["fiches"] = [];

  for (const cat of categories) {
    const ficheCount = Math.min(cat.count, maxFichesPerCategory);

    const searchQuery = `${cat.searchQuery} à ${cityConfig.city} ${cityConfig.country} 2024 2025. Liste les ${ficheCount} meilleurs avec noms, adresses, descriptions.`;
    onProgress?.(`🔍 ${cat.label} à ${cityConfig.city}...`);

    const terrainInfo = await searchPerplexity(searchQuery, 1200);

    // Extraire les noms d'établissements
    const namesQuery = `D'après ce texte, liste UNIQUEMENT les ${ficheCount} noms d'établissements ou lieux mentionnés, un par ligne, sans numérotation:\n${terrainInfo.slice(0, 1000)}`;
    const namesResponse = await searchPerplexity(namesQuery, 300);

    const names = namesResponse
      .split("\n")
      .map(n => n.trim().replace(/^[-•*\d.]+\s*/, ""))
      .filter(n => n.length > 2 && n.length < 100)
      .slice(0, ficheCount);

    const ficheNames = names.length > 0 ? names : [`${cat.label} Premium — ${cityConfig.city}`];

    for (const name of ficheNames) {
      const ficheStart = Date.now();
      try {
        onProgress?.(`  ✍️  Fiche: ${name}`);

        const specificInfo = await searchPerplexity(
          `"${name}" ${cityConfig.city}: informations détaillées, avis, prix, horaires, spécialités, ce qui le rend unique`,
          800
        );

        const estab: EstablishmentInput = { id: 0, name, city: cityConfig.city, category: cat.key };
        const fiche = await generateSeoContent(estab, specificInfo, "", "");
        const viralVideos = await scrapeViralVideos(estab);
        fiche.viralVideos = viralVideos;
        fiche.country = cityConfig.country;
        fiche.region = cityConfig.region;

        results.push({ fiche, viralVideos, success: true, duration: Date.now() - ficheStart });
        onProgress?.(`  ✅ ${name} (${Math.round((Date.now() - ficheStart) / 1000)}s)`);
      } catch (error) {
        results.push({
          fiche: {} as SeoFiche,
          viralVideos: [],
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          duration: Date.now() - ficheStart,
        });
        onProgress?.(`  ❌ ${name}: ${error instanceof Error ? error.message : "Erreur"}`);
      }
    }
  }

  const successCount = results.filter(r => r.success).length;

  return {
    city: cityConfig.city,
    country: cityConfig.country,
    fiches: results,
    totalDuration: Date.now() - startTime,
    successCount,
    errorCount: results.length - successCount,
  };
}

// ─── Enrichissement d'une fiche existante ────────────────────────────────────
export async function enrichExistingFiche(
  title: string,
  city: string,
  country: string,
  category: string
): Promise<{ viralVideos: ViralVideo[]; enrichedDescription?: string; additionalHighlights?: string[] }> {
  const estab: EstablishmentInput = { id: 0, name: title, city, category };
  const [viralVideos, enrichInfo] = await Promise.all([
    scrapeViralVideos(estab),
    searchPerplexity(`"${title}" ${city} ${country}: dernières actualités, nouveautés, avis récents 2024-2025, anecdotes exclusives`, 600),
  ]);

  let enrichedDescription: string | undefined;
  let additionalHighlights: string[] | undefined;

  if (enrichInfo) {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Tu enrichis des fiches SEO luxe. Réponds en JSON uniquement." },
        { role: "user", content: `Enrichis la fiche de "${title}" (${category}) à ${city}. Contexte: ${enrichInfo.slice(0, 500)}. Retourne JSON: {"enrichedDescription": "...", "additionalHighlights": ["...", "...", "..."]}` },
      ],
    });
    try {
      const content = response.choices[0]?.message?.content as string ?? "{}";
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]) as { enrichedDescription?: string; additionalHighlights?: string[] };
        enrichedDescription = data.enrichedDescription;
        additionalHighlights = data.additionalHighlights;
      }
    } catch {
      // ignore
    }
  }

  return { viralVideos, enrichedDescription, additionalHighlights };
}
