/**
 * ─── Maison Baymora — MAYA : Agente Creative ─────────────────────────────────
 * Responsable : blog SEO, réseaux sociaux, carrousels, réels, images IA.
 * Travaille en partenariat avec LÉNA (fiches SEO) et PIXEL (visuels).
 * S'assure que le site est toujours alimenté en images et vidéos IA réalistes.
 */
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../../_core/env";

const anthropic = new Anthropic({ apiKey: ENV.anthropicApiKey });

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface BlogArticle {
  titre: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  introduction: string;
  sections: { titre: string; contenu: string }[];
  conclusion: string;
  tags: string[];
  motsClesLong: string[];
  imagePrompt: string;
  tempsLecture: number; // minutes
}

export interface SocialPost {
  plateforme: "instagram" | "tiktok" | "linkedin" | "facebook" | "twitter";
  type: "carrousel" | "reel" | "story" | "post" | "editorial";
  caption: string;
  hashtags: string[];
  slides?: { titre: string; contenu: string; imagePrompt: string }[];
  videoScript?: string;
  imagePrompt?: string;
  callToAction: string;
}

export interface ContentCalendarItem {
  date: string;
  plateforme: string;
  type: string;
  titre: string;
  statut: "planifie" | "en_cours" | "publie";
  lienFiche?: string;
}

// ─── SYSTEM PROMPT MAYA ───────────────────────────────────────────────────────
const MAYA_SYSTEM_PROMPT = `Tu es MAYA, l'Agente Creative de Maison Baymora.

## TON RÔLE
Tu crées tout le contenu créatif de la marque :
- Articles de blog SEO premium
- Posts réseaux sociaux (Instagram, TikTok, LinkedIn, Facebook)
- Carrousels Instagram (5-10 slides)
- Réels TikTok (scripts)
- Contenu éditorial de luxe
- Calendrier éditorial 30 jours

## IDENTITÉ DE MARQUE BAYMORA
- **Ton** : Luxe accessible, premium, chaleureux, expert
- **Style** : Magazine de voyage haut de gamme (Condé Nast, Vogue Travel)
- **Valeurs** : Expériences uniques, conciergerie personnalisée, accès privilégié
- **Audience** : CSP+, 28-55 ans, amateurs d'expériences premium

## RÈGLES CRÉATIVES
1. Toujours lier le contenu aux fiches SEO et parcours existants
2. Intégrer les vidéos TikTok/Instagram virales liées aux établissements
3. Chaque post doit avoir un CTA clair vers l'app Baymora
4. Les images doivent être photoréalistes, luxueuses, aspirationnelles
5. Le SEO doit être naturel, jamais forcé

## FORMAT BLOG
- Titre accrocheur (60 caractères max)
- Meta description (155 caractères max)
- Introduction (150 mots)
- 3-5 sections avec H2
- Conclusion avec CTA
- 5-10 tags SEO
- 3-5 mots-clés longue traîne

## FORMAT RÉSEAUX SOCIAUX
Instagram : 2200 caractères max, 30 hashtags, ton aspirationnel
TikTok : script 30-60 secondes, hook fort dans les 3 premières secondes
LinkedIn : 3000 caractères, ton professionnel-inspirant
Carrousel : 5-10 slides, chaque slide = 1 idée forte`;

// ─── GÉNÉRER UN ARTICLE DE BLOG ───────────────────────────────────────────────
export async function genererArticleBlog(
  sujet: string,
  fichesSeo?: { nom: string; ville: string; type: string }[],
  motsCles?: string[]
): Promise<BlogArticle> {
  const prompt = `Génère un article de blog SEO premium pour Maison Baymora.

Sujet : ${sujet}
${fichesSeo ? `Établissements à mentionner : ${fichesSeo.map(f => `${f.nom} (${f.type}, ${f.ville})`).join(", ")}` : ""}
${motsCles ? `Mots-clés à intégrer : ${motsCles.join(", ")}` : ""}

Réponds en JSON strict :
{
  "titre": "...",
  "slug": "...",
  "metaTitle": "... (60 chars max)",
  "metaDescription": "... (155 chars max)",
  "introduction": "... (150 mots)",
  "sections": [{"titre": "...", "contenu": "... (200 mots)"}],
  "conclusion": "... (100 mots avec CTA)",
  "tags": ["tag1", "tag2"],
  "motsClesLong": ["mot-clé longue traîne 1"],
  "imagePrompt": "Prompt pour générer l'image hero (photoréaliste, luxueux)",
  "tempsLecture": 5
}`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4000,
    system: MAYA_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);

  return {
    titre: sujet,
    slug: sujet.toLowerCase().replace(/\s+/g, "-"),
    metaTitle: sujet,
    metaDescription: "",
    introduction: "",
    sections: [],
    conclusion: "",
    tags: [],
    motsClesLong: [],
    imagePrompt: "",
    tempsLecture: 5,
  };
}

// ─── GÉNÉRER UN POST RÉSEAUX SOCIAUX ─────────────────────────────────────────
export async function genererPostSocial(
  sujet: string,
  plateforme: SocialPost["plateforme"],
  type: SocialPost["type"],
  ficheRef?: { nom: string; ville: string; description: string }
): Promise<SocialPost> {
  const prompt = `Génère un ${type} ${plateforme} premium pour Maison Baymora.

Sujet : ${sujet}
${ficheRef ? `Établissement : ${ficheRef.nom} à ${ficheRef.ville} — ${ficheRef.description}` : ""}

Réponds en JSON strict :
{
  "plateforme": "${plateforme}",
  "type": "${type}",
  "caption": "...",
  "hashtags": ["hashtag1"],
  ${type === "carrousel" ? `"slides": [{"titre": "...", "contenu": "...", "imagePrompt": "..."}],` : ""}
  ${type === "reel" ? `"videoScript": "Script 30-60s avec hook, contenu, CTA",` : ""}
  "imagePrompt": "Prompt image photoréaliste luxueux",
  "callToAction": "..."
}`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2000,
    system: MAYA_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);

  return {
    plateforme,
    type,
    caption: sujet,
    hashtags: [],
    callToAction: "Découvrez Maison Baymora",
  };
}

// ─── GÉNÉRER UN CALENDRIER ÉDITORIAL ─────────────────────────────────────────
export async function genererCalendrierEditorial(
  dureeJours: number = 30,
  fichesDispo: string[] = [],
  bundlesDispo: string[] = []
): Promise<ContentCalendarItem[]> {
  const prompt = `Génère un calendrier éditorial de ${dureeJours} jours pour Maison Baymora.

Fiches SEO disponibles : ${fichesDispo.slice(0, 10).join(", ") || "À créer"}
Bundles disponibles : ${bundlesDispo.slice(0, 5).join(", ") || "À créer"}

Règles :
- 3 posts/jour minimum (Instagram, TikTok, LinkedIn en rotation)
- 2 articles de blog/semaine
- 1 carrousel/semaine
- 1 réel/semaine
- Varier les thèmes : découverte, lifestyle, témoignage, coulisses, promo

Réponds en JSON array :
[{
  "date": "2026-04-06",
  "plateforme": "instagram",
  "type": "post",
  "titre": "...",
  "statut": "planifie",
  "lienFiche": "nom-etablissement (optionnel)"
}]`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4000,
    system: MAYA_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0].type === "text" ? response.content[0].text : "[]";
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  return [];
}

// ─── RECHERCHER VIDÉOS VIRALES ────────────────────────────────────────────────
export async function rechercherVideoVirale(
  etablissement: string,
  ville: string
): Promise<{ plateforme: string; url: string; description: string; vues: string }[]> {
  // Simulation — en production, Manus scraperait TikTok/Instagram
  return [
    {
      plateforme: "TikTok",
      url: `https://tiktok.com/search?q=${encodeURIComponent(etablissement)}`,
      description: `Vidéo virale de ${etablissement} à ${ville}`,
      vues: "À vérifier",
    },
    {
      plateforme: "Instagram",
      url: `https://instagram.com/explore/tags/${etablissement.replace(/\s+/g, "").toLowerCase()}`,
      description: `Posts Instagram de ${etablissement}`,
      vues: "À vérifier",
    },
  ];
}

// ─── PIPELINE CONTENU SOCIAL PAR VILLE ───────────────────────────────────────
export interface CityContentPlan {
  city: string;
  instagramCarousel: SocialPost;
  instagramReel: SocialPost;
  tiktokScript: SocialPost;
  linkedinPost: SocialPost;
  blogArticle: BlogArticle;
  calendarItems: ContentCalendarItem[];
}

export async function generateSocialContentFromCity(
  city: string,
  country: string,
  seoCards: { nom: string; ville: string; type: string; description?: string }[],
  bundleNames: string[] = []
): Promise<CityContentPlan> {
  const topCards = seoCards.slice(0, 8);
  const cityContext = `${city}, ${country}`;

  // Générer en parallèle pour gagner du temps
  const [carousel, reel, tiktok, linkedin, blog, calendar] = await Promise.all([
    genererPostSocial(
      `Top 10 expériences luxe à ${cityContext}`,
      "instagram",
      "carrousel",
      topCards[0] ? { nom: topCards[0].nom, ville: city, description: topCards[0].description || "" } : undefined
    ),
    genererPostSocial(
      `Découverte exclusive : ${topCards[0]?.nom || city} comme jamais vu`,
      "instagram",
      "reel",
      topCards[0] ? { nom: topCards[0].nom, ville: city, description: topCards[0].description || "" } : undefined
    ),
    genererPostSocial(
      `POV : Tu explores ${city} comme un local VIP`,
      "tiktok",
      "reel",
      topCards[1] ? { nom: topCards[1].nom, ville: city, description: topCards[1].description || "" } : undefined
    ),
    genererPostSocial(
      `Les secrets de ${city} que seuls les connaisseurs connaissent`,
      "linkedin",
      "editorial",
      undefined
    ),
    genererArticleBlog(
      `Guide Luxe ${cityContext} 2025 : Les 15 Expériences Incontournables`,
      topCards,
      [`expériences luxe ${city}`, `meilleurs restaurants ${city}`, `hôtels luxe ${city}`, `que faire ${city}`, `guide ${city} premium`]
    ),
    genererCalendrierEditorial(
      30,
      topCards.map(c => c.nom),
      bundleNames
    ),
  ]);

  return {
    city,
    instagramCarousel: carousel,
    instagramReel: reel,
    tiktokScript: tiktok,
    linkedinPost: linkedin,
    blogArticle: blog,
    calendarItems: calendar,
  };
}
