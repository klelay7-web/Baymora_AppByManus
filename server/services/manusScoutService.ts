/**
 * manusScoutService.ts
 * SEO intelligence — uses Claude (via Anthropic SDK) to analyze competitor sites.
 *
 * Integration pattern: The "Manus" agent in this codebase is NOT an external Manus API.
 * It's an internal Claude agent (see server/services/ai/manusAgent.ts) that uses
 * the Anthropic SDK directly. Missions are in-memory objects created via creerMission().
 *
 * For SEO scouting, we use Claude Sonnet directly to analyze competitor URL structures
 * and generate structured findings — no web scraping, just LLM-based competitive analysis.
 */
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../_core/env";

const anthropic = new Anthropic({ apiKey: ENV.anthropicApiKey });

const CLAUDE_SONNET_MODEL = "claude-sonnet-4-20250514";

// ─── INTERFACES ──────────────────────────────────────────────────────────────

export interface SeoTarget {
  siteUrl: string;
  siteName: string;
  cities: string[];
}

export interface SeoFinding {
  source: string;
  url: string;
  title: string;
  h1?: string;
  city: string;
  category: string;
  searchIntent: string;
  establishmentsMentioned: string[];
}

interface ContentPage {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  type: string;
  city: string;
  category: string;
  searchIntent: string;
  introText: string;
  content: string;
  establishmentSlugs: string[];
  season: string;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractJsonArray(text: string): SeoFinding[] {
  // Try to find a JSON array in the response
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return JSON.parse(arrayMatch[0]) as SeoFinding[];
  }
  throw new Error("No JSON array found in Claude response");
}

// ─── SEO AUDIT ───────────────────────────────────────────────────────────────

export async function launchSeoAudit(
  targets: SeoTarget[]
): Promise<SeoFinding[]> {
  const allFindings: SeoFinding[] = [];

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    console.log(
      `[SEO Audit] Analyzing ${target.siteName} (${i + 1}/${targets.length})...`
    );

    try {
      const response = await anthropic.messages.create({
        model: CLAUDE_SONNET_MODEL,
        max_tokens: 4096,
        system:
          "You are an SEO analyst specializing in French luxury lifestyle, gastronomy, nightlife, and travel platforms. You respond with valid JSON only, no markdown fences, no explanations.",
        messages: [
          {
            role: "user",
            content: `You are an SEO analyst. For the site ${target.siteName} (${target.siteUrl}), generate a list of content pages they likely have or should have for each city in ${JSON.stringify(target.cities)}. For each page, provide: url (plausible URL structure), title, h1, city, category (gastronomie/nightlife/culture/bien-etre/shopping/evenements/hotels/activites), searchIntent (the Google query this page targets), establishmentsMentioned (5 well-known establishments for that city+category). Return JSON array only.`,
          },
        ],
      });

      const content =
        response.content[0].type === "text" ? response.content[0].text : "";

      const findings = extractJsonArray(content);

      // Tag each finding with the source
      const taggedFindings: SeoFinding[] = findings.map((f) => ({
        source: target.siteName,
        url: f.url ?? "",
        title: f.title ?? "",
        h1: f.h1,
        city: f.city ?? "",
        category: f.category ?? "",
        searchIntent: f.searchIntent ?? "",
        establishmentsMentioned: f.establishmentsMentioned ?? [],
      }));

      allFindings.push(...taggedFindings);
      console.log(
        `[SEO Audit] Found ${taggedFindings.length} pages for ${target.siteName}`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[SEO Audit] Error analyzing ${target.siteName}: ${message}`
      );
    }

    // Rate limit: wait 2 seconds between API calls
    if (i < targets.length - 1) {
      await sleep(2000);
    }
  }

  console.log(`[SEO Audit] Total findings: ${allFindings.length}`);
  return allFindings;
}

// ─── CONTENT PAGE GENERATION ─────────────────────────────────────────────────

export async function generateContentPage(
  finding: SeoFinding,
  establishments: { slug: string; name: string; description?: string; category?: string; city?: string }[]
): Promise<ContentPage | null> {
  // Only generate if we have enough establishments
  if (establishments.length < 3) {
    console.log(
      `[Content] Skipping "${finding.title}" — only ${establishments.length} establishments (need >= 3)`
    );
    return null;
  }

  const establishmentContext = establishments
    .map(
      (e) =>
        `- ${e.name} (${e.category ?? "unknown"}, ${e.city ?? finding.city}): ${e.description ?? "Etablissement de qualite"}`
    )
    .join("\n");

  const prompt = `Tu es le redacteur en chef de Maison Baymora, plateforme premium de lifestyle et conciergerie de luxe en France.

Genere une page de contenu SEO complete pour :
- Ville : ${finding.city}
- Categorie : ${finding.category}
- Intention de recherche cible : "${finding.searchIntent}"
- Titre concurrent : "${finding.title}"

## Etablissements a mettre en avant :
${establishmentContext}

## Consignes :
- Ton : luxueux mais accessible, chaleureux, authentique — esprit Maison Baymora
- Le contenu doit surpasser le concurrent en qualite et profondeur
- Integrer naturellement les etablissements mentionnes
- Optimiser pour le SEO et les LLM (ChatGPT, Perplexity, Claude)
- Le slug doit etre en francais, sans accents, kebab-case
- Le contenu principal doit faire 800-1200 mots en markdown
- L'intro doit faire 2-3 phrases accrocheuses

Reponds UNIQUEMENT en JSON valide (pas de fences markdown) :
{
  "slug": "meilleurs-restaurants-gastronomiques-paris",
  "title": "Titre SEO optimise",
  "metaTitle": "Max 60 chars",
  "metaDescription": "Max 155 chars",
  "type": "guide|inspiration|parcours|evenement|secret",
  "city": "${finding.city}",
  "category": "${finding.category}",
  "searchIntent": "${finding.searchIntent}",
  "introText": "2-3 phrases d'intro accrocheuses",
  "content": "Contenu markdown complet 800-1200 mots",
  "establishmentSlugs": ${JSON.stringify(establishments.map((e) => e.slug))},
  "season": "toute_annee|printemps|ete|automne|hiver"
}`;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_SONNET_MODEL,
      max_tokens: 4096,
      system:
        "Tu es un redacteur SEO expert specialise dans le tourisme et le lifestyle de luxe en France. Tu reponds uniquement en JSON valide, sans fences markdown ni explications.",
      messages: [{ role: "user", content: prompt }],
    });

    const content =
      response.content[0].type === "text" ? response.content[0].text : "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in Claude response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as ContentPage;

    console.log(`[Content] Generated page: "${parsed.title}" (${parsed.slug})`);
    return parsed;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[Content] Error generating page for "${finding.title}": ${message}`
    );
    return null;
  }
}
