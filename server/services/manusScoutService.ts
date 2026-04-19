/**
 * manusScoutService.ts
 * SEO intelligence via the real Manus API (https://api.manus.ai/v1/tasks).
 *
 * Manus is ASYNCHRONOUS:
 *   POST /v1/tasks → { task_id, task_title, task_url }
 *   GET  /v1/tasks/{id} → { status, output, credit_usage }
 *   Statuses: pending → running → completed | failed
 *
 * Auth header: API_KEY (not Authorization/Bearer)
 *
 * Content generation (generateContentPage) still uses Claude Sonnet
 * since it doesn't need web browsing — just editorial writing.
 */
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../_core/env";

const MANUS_API_URL = "https://api.manus.ai/v1/tasks";
const CLAUDE_MODEL = "claude-sonnet-4-20250514";

const anthropic = new Anthropic({ apiKey: ENV.anthropicApiKey });

if (!ENV.manusApiKey) {
  console.warn("[Manus] MANUS_API_KEY not set — SEO audit will not work. Set it on Railway.");
}

// ─── Types ──────────────────────────────────────────────────────────────

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

interface ManusTask {
  task_id: string;
  task_title: string;
  task_url: string;
}

interface ManusTaskResult {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  output?: Array<{
    role: string;
    content: Array<{ type: string; text?: string }>;
  }>;
  credit_usage?: number;
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

// ─── Helpers ────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function extractJsonArray(text: string): any[] {
  try { const p = JSON.parse(text); if (Array.isArray(p)) return p; } catch {}
  const fenced = text.match(/```json?\s*([\s\S]*?)```/);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch {} }
  const arrMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrMatch) { try { return JSON.parse(arrMatch[0]); } catch {} }
  return [];
}

// ─── Manus API ──────────────────────────────────────────────────────────

export async function createManusTask(prompt: string, profile?: string): Promise<ManusTask> {
  if (!ENV.manusApiKey) throw new Error("MANUS_API_KEY not configured");

  const resp = await fetch(MANUS_API_URL, {
    method: "POST",
    headers: {
      "API_KEY": ENV.manusApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, agentProfile: profile || "manus-1.6" }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Manus API POST failed: ${resp.status} ${resp.statusText} — ${body}`);
  }

  return resp.json() as Promise<ManusTask>;
}

export async function getManusTaskResult(taskId: string): Promise<ManusTaskResult> {
  if (!ENV.manusApiKey) throw new Error("MANUS_API_KEY not configured");

  const resp = await fetch(`${MANUS_API_URL}/${taskId}`, {
    method: "GET",
    headers: { "API_KEY": ENV.manusApiKey },
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Manus API GET failed: ${resp.status} ${resp.statusText} — ${body}`);
  }

  return resp.json() as Promise<ManusTaskResult>;
}

export async function waitForManusTask(taskId: string, maxWaitMs: number = 300000): Promise<string> {
  const startedAt = Date.now();
  const pollInterval = 10000;

  while (Date.now() - startedAt < maxWaitMs) {
    const result = await getManusTaskResult(taskId);

    if (result.status === "completed") {
      const texts: string[] = [];
      if (result.output) {
        for (const msg of result.output) {
          if (msg.content) {
            for (const block of msg.content) {
              if ((block.type === "output_text" || block.type === "text") && block.text) {
                texts.push(block.text);
              }
            }
          }
        }
      }
      return texts.join("\n");
    }

    if (result.status === "failed") {
      throw new Error(`Manus task ${taskId} failed`);
    }

    console.log(`[Manus] Task ${taskId}: ${result.status} — waiting...`);
    await sleep(pollInterval);
  }

  throw new Error(`Manus task ${taskId} timeout after ${maxWaitMs / 1000}s`);
}

// ─── SEO Audit ──────────────────────────────────────────────────────────

export async function launchSeoAudit(
  targets: SeoTarget[],
  limit?: number
): Promise<{ findings: SeoFinding[]; processed: number; errors: string[]; creditsUsed: number }> {
  if (!ENV.manusApiKey) {
    return { findings: [], processed: 0, errors: ["MANUS_API_KEY not configured"], creditsUsed: 0 };
  }

  const allFindings: SeoFinding[] = [];
  const errors: string[] = [];
  let totalCredits = 0;

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
      const prompt = `Va sur ${siteUrl} et trouve toutes les pages de type guide, classement, "meilleur", "top", "où sortir", "que faire" pour la ville de ${city}.

Pour chaque page trouvée, extrais :
- url: URL complète de la page
- title: titre de la page
- city: "${city}"
- category: une parmi (gastronomie, nightlife, culture, bien_etre, shopping, evenements, hotels, activites)
- searchIntent: la requête Google probable que cette page cible
- establishmentsMentioned: les 5 premiers noms d'établissements mentionnés dans la page

Retourne UNIQUEMENT un JSON array valide. Pas de texte autour, pas de markdown.`;

      const task = await createManusTask(prompt, "manus-1.6");
      console.log(`[SEO Audit]   Task created: ${task.task_id}`);

      const output = await waitForManusTask(task.task_id);
      const parsed = extractJsonArray(output);

      const taskResult = await getManusTaskResult(task.task_id);
      if (taskResult.credit_usage) totalCredits += taskResult.credit_usage;

      for (const f of parsed) {
        allFindings.push({
          source: siteName,
          url: String(f.url || f.pageUrl || ""),
          title: String(f.title || f.pageTitle || ""),
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
  }

  console.log(`[SEO Audit] Done: ${allFindings.length} findings, ${errors.length} errors, ${totalCredits} credits`);
  return { findings: allFindings, processed, errors, creditsUsed: totalCredits };
}

// ─── Content generation (Claude, not Manus — no web needed) ─────────────

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
      model: CLAUDE_MODEL,
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
