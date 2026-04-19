/**
 * manusScoutService.ts
 * SEO intelligence — uses Claude (via Anthropic SDK) to analyze competitor sites.
 *
 * Claude doesn't browse the web. Instead, we leverage Claude's knowledge of
 * competitor site structures (Timeout, Le Fooding, TripAdvisor, etc.) to
 * generate plausible SEO page structures and search intents.
 *
 * Architecture: 1 API call per (site × city) combination for reliable output.
 */
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../_core/env";

const anthropic = new Anthropic({ apiKey: ENV.anthropicApiKey });
const MODEL = "claude-sonnet-4-20250514";

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

interface ContentPageResult {
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function extractJsonArray(text: string): any[] {
  // Try raw parse first
  try { const parsed = JSON.parse(text); if (Array.isArray(parsed)) return parsed; } catch {}
  // Try extracting from ```json fences
  const fenced = text.match(/```json?\s*([\s\S]*?)```/);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch {} }
  // Try extracting bare array
  const arrMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrMatch) { try { return JSON.parse(arrMatch[0]); } catch {} }
  return [];
}

export async function launchSeoAudit(
  targets: SeoTarget[],
  limit?: number
): Promise<{ findings: SeoFinding[]; processed: number; errors: string[] }> {
  const allFindings: SeoFinding[] = [];
  const errors: string[] = [];

  // Build flat list of (site, city) combinations
  const combos: { siteName: string; siteUrl: string; city: string }[] = [];
  for (const t of targets) {
    for (const city of t.cities) {
      combos.push({ siteName: t.siteName, siteUrl: t.siteUrl, city });
    }
  }
  const toProcess = limit ? combos.slice(0, limit) : combos;
  let processed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const { siteName, siteUrl, city } = toProcess[i];
    console.log(`[SEO Audit] ${i + 1}/${toProcess.length} — ${siteName} × ${city}`);

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 3000,
        system: "Tu es un expert SEO spécialisé en lifestyle et voyage. Tu réponds UNIQUEMENT en JSON array valide. Pas de markdown, pas de texte autour.",
        messages: [{
          role: "user",
          content: `Pour le site ${siteName} (${siteUrl}), génère les 8 pages les plus probables qu'ils ont pour la ville de ${city}, basé sur la structure typique de ce site.

Pour chaque page, donne en JSON :
- pageUrl: l'URL probable (structure réaliste du site)
- pageTitle: le titre probable de la page
- city: "${city}"
- category: une parmi (gastronomie, nightlife, culture, bien_etre, shopping, evenements, hotels, activites)
- searchIntent: la requête Google que cette page cible (en français)
- establishmentsMentioned: 3-5 noms d'établissements connus que cette page mentionne probablement

Retourne UNIQUEMENT un JSON array.`,
        }],
      });

      const content = response.content[0].type === "text" ? response.content[0].text : "";
      const parsed = extractJsonArray(content);

      for (const f of parsed) {
        allFindings.push({
          source: siteName,
          url: String(f.pageUrl || f.url || ""),
          title: String(f.pageTitle || f.title || ""),
          h1: f.h1,
          city: String(f.city || city),
          category: String(f.category || ""),
          searchIntent: String(f.searchIntent || ""),
          establishmentsMentioned: Array.isArray(f.establishmentsMentioned) ? f.establishmentsMentioned : [],
        });
      }
      processed++;
      console.log(`[SEO Audit]   → ${parsed.length} findings`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${siteName}×${city}: ${msg}`);
      console.error(`[SEO Audit]   → ERROR: ${msg}`);
    }

    if (i < toProcess.length - 1) await sleep(2000);
  }

  console.log(`[SEO Audit] Done: ${allFindings.length} findings, ${errors.length} errors`);
  return { findings: allFindings, processed, errors };
}

export async function generateContentPage(
  finding: SeoFinding,
  establishments: { slug: string; name: string; description?: string; category?: string; city?: string }[]
): Promise<ContentPageResult | null> {
  if (establishments.length < 3) {
    console.log(`[Content] Skipping "${finding.title}" — only ${establishments.length} establishments (need >= 3)`);
    return null;
  }

  const estContext = establishments.slice(0, 8)
    .map((e) => `- ${e.name} (${e.category || "lieu"}, ${e.city || finding.city}): ${(e.description || "").slice(0, 100)}`)
    .join("\n");

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: "Tu es le rédacteur en chef de Maison Baymora, Social Club Premium. Tu réponds UNIQUEMENT en JSON valide, sans fences markdown.",
      messages: [{
        role: "user",
        content: `Rédige un guide SEO pour surpasser la page concurrente.

Page concurrente : "${finding.title}" sur ${finding.source}
Requête cible : "${finding.searchIntent}"
Ville : ${finding.city}
Établissements concurrent : ${JSON.stringify(finding.establishmentsMentioned)}
Nos établissements :
${estContext}

STRATÉGIE : intègre 2-3 noms connus (crédibilité) + 2-3 pépites de notre base (différenciation).

Réponds en JSON :
{
  "slug": "string kebab-case sans accents",
  "title": "max 60 car incluant la ville",
  "metaTitle": "max 60 car incluant requête + Maison Baymora",
  "metaDescription": "max 155 car incitative",
  "type": "guide",
  "city": "${finding.city}",
  "category": "${finding.category}",
  "searchIntent": "${finding.searchIntent}",
  "introText": "2-3 phrases magazine premium tutoiement",
  "content": "markdown 800-1200 mots, 3-5 sections h2",
  "establishmentSlugs": ${JSON.stringify(establishments.slice(0, 6).map((e) => e.slug))},
  "season": "toute_annee"
}`,
      }],
    });

    const content = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as ContentPageResult;
    console.log(`[Content] Generated: "${parsed.title}" (${parsed.slug})`);
    return parsed;
  } catch (err: unknown) {
    console.error(`[Content] Error: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
