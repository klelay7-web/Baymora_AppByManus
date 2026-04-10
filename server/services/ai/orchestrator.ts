/**
 * ORCHESTRATEUR MULTI-AGENTS BAYMORA
 * 
 * Architecture bi-cerveau :
 * - Claude (Manus DG, LÉNA, MAYA...) = éditorial, rédaction, SEO, conversation
 * - Manus/Scout (Perplexity) = terrain, recherche web, données fraîches, images
 * 
 * 3 scénarios selon complexité :
 * - FLASH (70%) : question simple → Atlas seul + Sonnet (3-5s)
 * - EXPLORE (25%) : planification → Scout + Atlas + Profil + Opus (8-12s)
 * - EXCELLENCE (5% VIP) : séjour complexe → Tous agents + Opus max (12-20s)
 */
import { agentAtlas, formatAtlasBriefing } from "./agentAtlas";
import { agentScout, agentScoutMulti, formatScoutBriefing } from "./agentScout";
import { ENV } from "../../_core/env";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: ENV.anthropicApiKey });

export type OrchestratorScenario = "FLASH" | "EXPLORE" | "EXCELLENCE";

export interface OrchestratorInput {
  userMessage: string;
  systemPrompt: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  subscriptionTier?: string;
  messageIndex?: number;
  userCity?: string;
}

export interface OrchestratorOutput {
  content: string;
  model: string;
  scenario: OrchestratorScenario;
  agentsUsed: string[];
  processingTime: number;
}

// ─── Détection du scénario ────────────────────────────────────────────────────

const EXCELLENCE_TRIGGERS = [
  "séjour complet", "voyage complet", "tout organiser", "lune de miel",
  "mariage", "anniversaire", "événement privé", "gala", "yacht", "villa",
  "jet privé", "privatiser", "off-market", "VIP", "ultra-luxe",
  "semaine entière", "2 semaines", "itinéraire complet", "programme détaillé"
];

const EXPLORE_TRIGGERS = [
  "plan", "itinéraire", "programme", "week-end", "weekend", "séjour",
  "voyage", "organise", "prépare", "réserve", "planifie", "propose",
  "recommande", "3 jours", "5 jours", "7 jours", "une semaine",
  "où aller", "que faire", "quoi faire", "meilleures adresses",
  "restaurant", "hôtel", "spa", "expérience", "activité", "sortie",
  "surprends-moi", "surprends moi", "idée", "suggestion"
];

export function detectScenario(
  userMessage: string,
  subscriptionTier?: string,
  messageIndex?: number
): OrchestratorScenario {
  const lower = userMessage.toLowerCase();

  // VIP Privé → toujours EXCELLENCE
  if (subscriptionTier === "elite") return "EXCELLENCE";

  // Triggers EXCELLENCE
  if (EXCELLENCE_TRIGGERS.some(t => lower.includes(t))) return "EXCELLENCE";

  // Triggers EXPLORE
  if (EXPLORE_TRIGGERS.some(t => lower.includes(t))) return "EXPLORE";

  // Message court ou question simple → FLASH
  if (userMessage.length < 60) return "FLASH";

  // Par défaut → EXPLORE pour les messages moyens
  return "EXPLORE";
}

// ─── Scénario FLASH ───────────────────────────────────────────────────────────

async function runFlash(input: OrchestratorInput): Promise<OrchestratorOutput> {
  const start = Date.now();

  // Atlas seul (DB locale)
  const atlasResults = await agentAtlas(input.userMessage, input.userCity);
  const atlasBriefing = formatAtlasBriefing(atlasResults);

  const enrichedSystem = input.systemPrompt + atlasBriefing;

  // Haiku pour les messages simples (Membre/Duo), Sonnet pour Cercle
  const flashModel = input.subscriptionTier === "elite" ? "claude-sonnet-4-5" : "claude-haiku-4-5";

  const response = await anthropic.messages.create({
    model: flashModel,
    max_tokens: 1200,
    system: enrichedSystem,
    messages: [...input.history, { role: "user", content: input.userMessage }],
  });

  const content = response.content[0].type === "text" ? response.content[0].text : "";

  return {
    content,
    model: flashModel,
    scenario: "FLASH",
    agentsUsed: atlasResults.length > 0 ? ["Atlas"] : [],
    processingTime: Date.now() - start,
  };
}

// ─── Scénario EXPLORE ─────────────────────────────────────────────────────────

async function runExplore(input: OrchestratorInput): Promise<OrchestratorOutput> {
  const start = Date.now();

  // Atlas + Scout en parallèle
  const [atlasResults, scoutResult] = await Promise.all([
    agentAtlas(input.userMessage, input.userCity),
    agentScout(input.userMessage, `Contexte voyage luxe, client Baymora`),
  ]);

  const atlasBriefing = formatAtlasBriefing(atlasResults);
  const scoutBriefing = formatScoutBriefing([scoutResult]);

  const enrichedSystem = input.systemPrompt + atlasBriefing + scoutBriefing;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1800,
    system: enrichedSystem,
    messages: [...input.history, { role: "user", content: input.userMessage }],
  });

  const content = response.content[0].type === "text" ? response.content[0].text : "";

  const agentsUsed = [];
  if (atlasResults.length > 0) agentsUsed.push("Atlas");
  if (scoutResult.answer.length > 0) agentsUsed.push("Scout");

  return {
    content,
    model: "claude-opus-4-5",
    scenario: "EXPLORE",
    agentsUsed,
    processingTime: Date.now() - start,
  };
}

// ─── Scénario EXCELLENCE ──────────────────────────────────────────────────────

async function runExcellence(input: OrchestratorInput): Promise<OrchestratorOutput> {
  const start = Date.now();

  // Tous agents en parallèle
  const scoutQueries = [
    input.userMessage,
    `meilleures adresses luxe ${input.userCity || "Paris"} 2025`,
    `expériences VIP exclusives ${input.userMessage.slice(0, 50)}`,
  ];

  const [atlasResults, scoutResults] = await Promise.all([
    agentAtlas(input.userMessage, input.userCity),
    agentScoutMulti(scoutQueries),
  ]);

  const atlasBriefing = formatAtlasBriefing(atlasResults);
  const scoutBriefing = formatScoutBriefing(scoutResults);

  const excellenceBoost = `\n\n⭐ MODE EXCELLENCE ACTIVÉ : Ce client est VIP. Dépasse-toi. Propose des expériences uniques, des accès privés, des adresses off-market. Sois proactif, anticipe, surprends.`;

  const enrichedSystem = input.systemPrompt + atlasBriefing + scoutBriefing + excellenceBoost;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2500,
    system: enrichedSystem,
    messages: [...input.history, { role: "user", content: input.userMessage }],
  });

  const content = response.content[0].type === "text" ? response.content[0].text : "";

  const agentsUsed = ["Atlas"];
  if (scoutResults.some(r => r.answer.length > 0)) agentsUsed.push("Scout", "OffMarket");

  return {
    content,
    model: "claude-opus-4-5",
    scenario: "EXCELLENCE",
    agentsUsed,
    processingTime: Date.now() - start,
  };
}

// ─── Point d'entrée principal ─────────────────────────────────────────────────

export async function orchestrate(input: OrchestratorInput): Promise<OrchestratorOutput> {
  const scenario = detectScenario(
    input.userMessage,
    input.subscriptionTier,
    input.messageIndex
  );

  console.log(`[Orchestrateur] Scénario: ${scenario} | Message: "${input.userMessage.slice(0, 50)}..."`);

  switch (scenario) {
    case "FLASH":
      return runFlash(input);
    case "EXPLORE":
      return runExplore(input);
    case "EXCELLENCE":
      return runExcellence(input);
  }
}
