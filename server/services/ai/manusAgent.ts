/**
 * ─── Maison Baymora — MANUS : Agent Directeur Technique ──────────────────────
 * Binôme d'Manus DG pour la direction de l'entreprise.
 * Manus est le bras opérationnel : terrain, scraping, images, UI/UX, code.
 * Manus DG est le cerveau éditorial : stratégie, rédaction, coordination.
 * Ensemble, ils décident avant de remonter au fondateur.
 */
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../../_core/env";

const anthropic = new Anthropic({ apiKey: ENV.anthropicApiKey });

// ─── RÔLES & COMPÉTENCES MANUS ────────────────────────────────────────────────
export const MANUS_PROFILE = {
  name: "MANUS",
  role: "Agent Directeur Technique & Opérationnel",
  model: "Claude Opus",
  competences: [
    "Design UI/UX premium (glassmorphism, animations, gradients)",
    "Frontend craft — Tailwind, React, composants réutilisables",
    "Web scraping & recherche live (TripAdvisor, Google Maps, Instagram)",
    "Assets visuels — sélection photos/vidéos cohérentes",
    "Génération d'images IA réalistes",
    "Prototypage rapide de pages complètes",
    "Architecture backend (Drizzle, tRPC, auth, Stripe)",
    "Orchestration multi-agents",
    "Debugging et résolution d'erreurs",
  ],
  binome: "Manus DG (Directeur Général IA)",
  acces: "TOTAL — peut modifier toutes les pages, créer des agents, lancer des missions",
};

// ─── SYSTÈME DE DÉLIBÉRATION Manus DG+MANUS ──────────────────────────────────────
export interface ManusDecision {
  sujet: string;
  analyseAria: string;
  analyseManus: string;
  decision: string;
  actionsAria: string[];
  actionsManus: string[];
  priorite: "critique" | "haute" | "normale" | "basse";
  delai: string;
  messageFoundateur?: string;
}

export interface ManusMission {
  id: string;
  titre: string;
  agent: string;
  type: "scraping" | "design" | "seo" | "social" | "affiliation" | "creative" | "communication" | "recherche";
  statut: "en_attente" | "en_cours" | "termine" | "echec";
  priorite: "critique" | "haute" | "normale" | "basse";
  description: string;
  resultat?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── SYSTEM PROMPT MANUS ─────────────────────────────────────────────────────
const MANUS_SYSTEM_PROMPT = `Tu es MANUS, l'Agent Directeur Technique & Opérationnel de Maison Baymora.

## TON RÔLE
Tu es le binôme d'Manus DG (Directeur Général IA). Ensemble vous dirigez l'entreprise.
- **Manus DG** : cerveau éditorial, stratégie, rédaction, coordination des agents
- **MANUS** : bras opérationnel, terrain, design, code, scraping, images, missions

## TES COMPÉTENCES ÉLITE
1. **Design UI/UX** — Niveau magazine de luxe. Glassmorphism, animations fluides, gradients premium
2. **Frontend craft** — React 19, Tailwind 4, composants réutilisables, micro-interactions
3. **Web scraping** — TripAdvisor, Google Maps, Instagram, extraction de données live
4. **Assets visuels** — Photos cohérentes, génération d'images IA réalistes
5. **Backend** — Drizzle, tRPC, auth, Stripe, architecture robuste
6. **Orchestration** — Créer et gérer des agents, lancer des missions, coordonner l'équipe

## PROCESSUS DE DÉCISION Manus DG+MANUS
Quand une décision importante doit être prise :
1. Tu analyses la situation depuis ton angle technique/opérationnel
2. Tu anticipes ce qu'Manus DG dirait depuis son angle éditorial/stratégique
3. Vous vous mettez d'accord sur une décision commune
4. Seulement alors, vous remontez l'info au fondateur avec une recommandation claire

## ACCÈS TOTAL
Tu as accès à TOUTES les pages, données, agents et fonctions de Maison Baymora.
Tu peux : modifier des pages, créer des agents, lancer des missions, donner des ordres.

## ÉQUIPE SOUS TA COORDINATION
- **LÉNA** (Claude) + **SCOUT** (Manus) : fiches SEO, bundles, parcours
- **MAYA** (Creative) : blog, réseaux sociaux, carrousels, réels
- **NOVA** (Communication) : emails, commentaires, messages privés
- **ATLAS** (Affiliation) : partenaires, staycation, prestataires
- **JADE** (Parcours) : itinéraires, bundles premium
- **PIXEL** (Visual) : images, vidéos, TikTok/Instagram viraux

## FORMAT DE RÉPONSE
Réponds toujours en JSON structuré avec :
- analyseAria : ce qu'Manus DG penserait (éditorial/stratégique)
- analyseManus : ta propre analyse (technique/opérationnel)
- decision : la décision commune
- actionsAria : ce qu'Manus DG doit faire
- actionsManus : ce que MANUS doit faire
- priorite : critique/haute/normale/basse
- delai : délai estimé
- messageFoundateur : message synthétique pour le fondateur (si nécessaire)`;

// ─── CHAT AVEC MANUS ──────────────────────────────────────────────────────────
export interface ManusMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithManus(
  message: string,
  history: ManusMessage[] = [],
  context?: {
    totalFiches?: number;
    totalBundles?: number;
    totalParcours?: number;
    totalUsers?: number;
    missionsEnCours?: number;
  }
): Promise<{ content: string; decision?: ManusDecision }> {
  const contextStr = context ? `
## CONTEXTE ACTUEL BAYMORA
- Fiches SEO créées : ${context.totalFiches ?? 0}
- Bundles actifs : ${context.totalBundles ?? 0}
- Parcours générés : ${context.totalParcours ?? 0}
- Utilisateurs : ${context.totalUsers ?? 0}
- Missions en cours : ${context.missionsEnCours ?? 0}
` : "";

  const messages = [
    ...history.slice(-20),
    { role: "user" as const, content: message },
  ];

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 3000,
    system: MANUS_SYSTEM_PROMPT + contextStr,
    messages,
  });

  const content = response.content[0].type === "text" ? response.content[0].text : "";

  // Tenter de parser une décision JSON
  let decision: ManusDecision | undefined;
  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      decision = JSON.parse(jsonMatch[1]);
    }
  } catch {
    // Pas de JSON structuré, réponse libre
  }

  return { content, decision };
}

// ─── DÉLIBÉRATION Manus DG+MANUS ──────────────────────────────────────────────────
export async function delibererAriaEtManus(
  sujet: string,
  contexte: string,
  statsApp: Record<string, number>
): Promise<ManusDecision> {
  const prompt = `
## SUJET DE DÉLIBÉRATION
${sujet}

## CONTEXTE
${contexte}

## STATS APP
${JSON.stringify(statsApp, null, 2)}

Délibère avec Manus DG et fournis une décision commune au format JSON strict :
{
  "sujet": "...",
  "analyseAria": "Analyse d'Manus DG (éditorial/stratégique, 2-3 phrases)",
  "analyseManus": "Analyse de MANUS (technique/opérationnel, 2-3 phrases)",
  "decision": "Décision commune claire et actionnable",
  "actionsAria": ["action1", "action2"],
  "actionsManus": ["action1", "action2"],
  "priorite": "haute",
  "delai": "48h",
  "messageFoundateur": "Message synthétique pour le fondateur"
}`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2000,
    system: MANUS_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0].type === "text" ? response.content[0].text : "{}";

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fallback
  }

  return {
    sujet,
    analyseAria: "Manus DG analyse la situation stratégiquement.",
    analyseManus: "MANUS analyse la situation techniquement.",
    decision: "Décision en cours de traitement.",
    actionsAria: [],
    actionsManus: [],
    priorite: "normale",
    delai: "À définir",
    messageFoundateur: content,
  };
}

// ─── CRÉER UNE MISSION ────────────────────────────────────────────────────────
export function creerMission(
  titre: string,
  agent: string,
  type: ManusMission["type"],
  description: string,
  priorite: ManusMission["priorite"] = "normale"
): ManusMission {
  return {
    id: `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    titre,
    agent,
    type,
    statut: "en_attente",
    priorite,
    description,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ─── STRATÉGIE DE LANCEMENT CONTENU ──────────────────────────────────────────
export const STRATEGIE_LANCEMENT = {
  phase1_contenu: {
    titre: "Phase 1 — Construction du corpus (Semaines 1-4)",
    objectif: "50 fiches SEO, 20 bundles, 30 parcours",
    agents: ["LÉNA+SCOUT", "MANUS scraping"],
    actions: [
      "SCOUT scrape TripAdvisor/Google Maps pour 50 établissements cibles",
      "LÉNA génère les fiches SEO avec meta, description, highlights",
      "MANUS intègre les photos et vidéos TikTok/Instagram viraux",
      "Manus DG valide et publie les fiches prioritaires",
      "JADE crée 30 parcours thématiques (romantique, famille, business, luxe)",
      "ATLAS identifie et contacte 20 partenaires staycation",
    ],
  },
  phase2_creative: {
    titre: "Phase 2 — Production créative (Semaines 3-6)",
    objectif: "Blog actif, 3 posts/jour réseaux sociaux",
    agents: ["MAYA", "PIXEL", "NOVA"],
    actions: [
      "MAYA crée 20 articles de blog SEO basés sur les fiches",
      "PIXEL génère des images IA premium pour chaque fiche",
      "MAYA produit carrousels Instagram et réels TikTok",
      "NOVA configure les templates email (bienvenue, newsletter, relance)",
      "MAYA crée le calendrier éditorial 30 jours",
    ],
  },
  phase3_affiliation: {
    titre: "Phase 3 — Affiliation & Partenariats (Semaines 5-8)",
    objectif: "50 partenaires affiliés, 10 prestataires exclusifs",
    agents: ["ATLAS", "Manus DG+MANUS"],
    actions: [
      "ATLAS recherche tous les prestataires staycation en ligne",
      "ATLAS ajoute restaurants, chauffeurs, location voiture luxe",
      "ATLAS intègre avions/trains monde entier (APIs)",
      "Manus DG+MANUS négocient les conditions d'affiliation",
      "ATLAS configure les liens d'affiliation dans l'app",
    ],
  },
  phase4_prospection: {
    titre: "Phase 4 — Prospection (Semaines 7-12)",
    objectif: "100 partenaires actifs, 500 utilisateurs premium",
    agents: ["Manus DG+MANUS", "NOVA", "ATLAS"],
    actions: [
      "Lancement campagne email prospection partenaires",
      "Activation réseaux sociaux avec contenu premium",
      "Programme ambassadeur pour les premiers membres",
      "Intégration Stripe pour les abonnements",
    ],
  },
};


