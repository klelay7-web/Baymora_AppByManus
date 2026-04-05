/**
 * AGENT SCOUT — Recherche web en temps réel via Perplexity
 * Rôle : terrain, infos fraîches, actualités, disponibilités, tendances
 * Binôme de LÉNA pour la construction des fiches SEO
 * Manus fait le terrain, Claude (LÉNA) rédige
 */
import { ENV } from "../../_core/env";

export interface ScoutResult {
  query: string;
  answer: string;
  sources: string[];
  timestamp: Date;
}

/**
 * Recherche web via Perplexity API
 * Utilisé dans les scénarios EXPLORE et EXCELLENCE
 */
export async function agentScout(query: string, context?: string): Promise<ScoutResult> {
  const apiKey = ENV.perplexityApiKey;
  if (!apiKey) {
    return {
      query,
      answer: "",
      sources: [],
      timestamp: new Date(),
    };
  }

  try {
    const systemPrompt = `Tu es SCOUT, agent de terrain de Maison Baymora. 
Tu fournis des informations précises, actuelles et vérifiées sur les établissements, destinations et expériences de luxe.
Réponds en français. Sois factuel, précis, et mentionne les sources.
${context ? `Contexte : ${context}` : ""}`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        max_tokens: 800,
        temperature: 0.2,
        return_citations: true,
      }),
    });

    if (!response.ok) {
      console.error("[AgentScout] Erreur Perplexity:", response.status, response.statusText);
      return { query, answer: "", sources: [], timestamp: new Date() };
    }

    const data = await response.json() as any;
    const answer = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    return {
      query,
      answer,
      sources: citations.slice(0, 5),
      timestamp: new Date(),
    };
  } catch (err) {
    console.error("[AgentScout] Erreur:", err);
    return { query, answer: "", sources: [], timestamp: new Date() };
  }
}

/**
 * Recherche multi-requêtes en parallèle (pour EXCELLENCE)
 */
export async function agentScoutMulti(queries: string[]): Promise<ScoutResult[]> {
  return Promise.all(queries.map(q => agentScout(q)));
}

/**
 * Formater le briefing Scout pour Claude
 */
export function formatScoutBriefing(results: ScoutResult[]): string {
  const valid = results.filter(r => r.answer.length > 0);
  if (valid.length === 0) return "";

  const lines = valid.map(r => {
    const sources = r.sources.length > 0 ? `\n  Sources: ${r.sources.slice(0, 2).join(", ")}` : "";
    return `🔍 **${r.query}**\n${r.answer.slice(0, 300)}...${sources}`;
  });

  return `\n\n🌐 RECHERCHE TERRAIN SCOUT (données fraîches) :\n${lines.join("\n\n")}`;
}

/**
 * Briefing LÉNA+SCOUT pour construction de fiche SEO
 * SCOUT fait le terrain, LÉNA reçoit ce briefing pour rédiger
 */
export async function scoutForLena(establishmentName: string, city: string): Promise<string> {
  const queries = [
    `${establishmentName} ${city} avis récents 2024 2025 prix menu horaires`,
    `${establishmentName} ${city} photos ambiance style décoration`,
    `${establishmentName} ${city} chef propriétaire histoire anecdotes`,
  ];

  const results = await agentScoutMulti(queries);
  const valid = results.filter(r => r.answer.length > 0);

  if (valid.length === 0) return "";

  return `📋 BRIEFING SCOUT POUR LÉNA — ${establishmentName}, ${city}\n\n` +
    valid.map(r => `**${r.query}**\n${r.answer.slice(0, 400)}`).join("\n\n---\n\n");
}
