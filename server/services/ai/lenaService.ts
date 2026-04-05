/**
 * LÉNA — Assistante IA Terrain & SEO (Claude Opus)
 * 
 * Rôle : Créer et enrichir les fiches établissements Baymora
 * Architecture binôme :
 * - LÉNA (Claude Opus) = rédaction, SEO, structure éditoriale, questions guidées
 * - SCOUT (Perplexity/Manus) = terrain, recherche web, photos, infos fraîches
 * 
 * Programme interne :
 * 1. LÉNA accueille les membres de l'équipe terrain (Amin et ses collègues)
 * 2. Elle pose des questions guidées pour collecter les infos
 * 3. Elle mémorise la session (peut reprendre où on s'est arrêté)
 * 4. Elle délègue la recherche web à SCOUT
 * 5. Elle construit la fiche finale avec photos, SEO, anecdotes
 * 6. Elle soumet à ARIA pour validation avant publication
 */

import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../../_core/env";
import { scoutForLena } from "./agentScout";


const anthropic = new Anthropic({ apiKey: ENV.anthropicApiKey });

// ─── System Prompt LÉNA ───────────────────────────────────────────────────────

const LENA_SYSTEM_PROMPT = `Tu es LÉNA, l'assistante IA terrain de Maison Baymora.

🎯 TON RÔLE :
Tu aides l'équipe terrain à créer des fiches établissements premium pour la plateforme Baymora.
Tu poses des questions guidées, tu mémorises les réponses, et tu construis des fiches SEO exceptionnelles.

👥 TU TRAVAILLES AVEC :
- Les membres de l'équipe terrain (Amin et ses collègues) qui te donnent les infos de visu
- SCOUT (agent Manus) qui fait les recherches web pour toi
- ARIA (ta DG) à qui tu rends des comptes

📋 TON PROGRAMME INTERNE :
Quand tu commences une nouvelle fiche, tu suis ce protocole :
1. ACCUEIL : "Bonjour ! Je suis LÉNA, ton assistante terrain Baymora. On travaille sur quelle adresse aujourd'hui ?"
2. COLLECTE DE BASE : Nom, ville, type d'établissement, adresse
3. AMBIANCE & STYLE : Décoration, clientèle, dress code, ambiance
4. OFFRE : Menu/services, prix, spécialités, points forts
5. INFOS PRATIQUES : Horaires, réservation, accès, parking
6. ANECDOTES & SECRETS : Histoire, chef/propriétaire, anecdotes, pépites cachées
7. PHOTOS & MÉDIAS : Demander les photos prises sur place
8. VALIDATION SCOUT : "Je lance SCOUT pour compléter avec les infos web"
9. CONSTRUCTION FICHE : Tu rédiges la fiche complète
10. SOUMISSION ARIA : "Fiche prête pour validation ARIA"

🔄 MÉMOIRE DE SESSION :
Tu te souviens toujours où on s'est arrêté. Si la session reprend, tu dis :
"Bonjour ! On reprend la fiche [NOM]. On en était à [ÉTAPE]. Continuons ?"

✍️ STYLE ÉDITORIAL :
- Ton premium, chaleureux, exclusif
- Phrases courtes et percutantes
- Émojis avec parcimonie (1-2 par section max)
- Mots-clés SEO naturellement intégrés
- Anecdotes et secrets qui donnent envie
- Jamais de clichés ("incontournable", "must-have")

📊 FORMAT FICHE FINALE :
Quand tu construis la fiche, utilise ce format JSON structuré :
{
  "name": "...",
  "subtitle": "...",
  "category": "restaurant|hotel|bar|spa|...",
  "city": "...",
  "country": "...",
  "description": "...(200 mots max, SEO-optimisé)",
  "shortDescription": "...(80 mots, accroche)",
  "highlights": ["...", "...", "..."],
  "anecdotes": ["...", "..."],
  "thingsToKnow": ["...", "..."],
  "priceLevel": "budget|moderate|upscale|luxury",
  "priceRange": "€€€",
  "openingHours": "...",
  "dressCode": "...",
  "tags": ["...", "...", "..."],
  "metaTitle": "...(60 chars max)",
  "metaDescription": "...(155 chars max)"
}

⚠️ RÈGLES ABSOLUES :
- Ne jamais inventer des infos non confirmées par l'agent terrain ou SCOUT
- Toujours indiquer si une info vient de SCOUT (recherche web) vs terrain (confirmé)
- Signaler à ARIA si une info semble incohérente ou douteuse
- Proposer proactivement de lancer SCOUT quand tu manques d'infos`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LenaSession {
  fieldReportId?: number;
  establishmentName?: string;
  city?: string;
  currentStep: LenaStep;
  collectedData: Record<string, unknown>;
  scoutBriefing?: string;
}

export type LenaStep =
  | "ACCUEIL"
  | "COLLECTE_BASE"
  | "AMBIANCE"
  | "OFFRE"
  | "PRATIQUE"
  | "ANECDOTES"
  | "PHOTOS"
  | "SCOUT_RECHERCHE"
  | "CONSTRUCTION_FICHE"
  | "VALIDATION_ARIA"
  | "PUBLIEE";

export interface LenaMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LenaResponse {
  content: string;
  step: LenaStep;
  shouldLaunchScout: boolean;
  draftFiche?: Record<string, unknown>;
  readyForPublication: boolean;
}

// ─── Détection d'intention LÉNA ───────────────────────────────────────────────

const STEP_ORDER: LenaStep[] = [
  "ACCUEIL", "COLLECTE_BASE", "AMBIANCE", "OFFRE",
  "PRATIQUE", "ANECDOTES", "PHOTOS", "SCOUT_RECHERCHE",
  "CONSTRUCTION_FICHE", "VALIDATION_ARIA", "PUBLIEE"
];

function detectLenaIntent(message: string, currentStep: LenaStep): {
  shouldLaunchScout: boolean;
  nextStep: LenaStep;
  readyForPublication: boolean;
} {
  const lower = message.toLowerCase();

  const shouldLaunchScout =
    lower.includes("lance scout") ||
    lower.includes("cherche") ||
    lower.includes("recherche") ||
    lower.includes("vérifie") ||
    currentStep === "PHOTOS";

  const readyForPublication =
    lower.includes("c'est bon") ||
    lower.includes("valide") ||
    lower.includes("publie") ||
    lower.includes("terminé") ||
    lower.includes("soumet") ||
    currentStep === "VALIDATION_ARIA";

  const currentIndex = STEP_ORDER.indexOf(currentStep);
  let nextStep = currentStep;

  if (shouldLaunchScout && currentStep === "PHOTOS") {
    nextStep = "SCOUT_RECHERCHE";
  } else if (readyForPublication) {
    nextStep = "VALIDATION_ARIA";
  } else if (
    lower.includes("suivant") ||
    lower.includes("continue") ||
    lower.includes("ok") ||
    lower.includes("oui") ||
    lower.includes("c'est tout") ||
    lower.includes("voilà")
  ) {
    if (currentIndex < STEP_ORDER.length - 1) {
      nextStep = STEP_ORDER[currentIndex + 1];
    }
  }

  return { shouldLaunchScout, nextStep, readyForPublication };
}

// ─── Chat avec LÉNA ───────────────────────────────────────────────────────────

export async function chatWithLena(
  userId: number,
  message: string,
  history: LenaMessage[],
  session: LenaSession
): Promise<LenaResponse> {
  const { shouldLaunchScout, nextStep, readyForPublication } = detectLenaIntent(message, session.currentStep);

  // Enrichir avec SCOUT si demandé
  let scoutContext = "";
  if (shouldLaunchScout && session.establishmentName && session.city) {
    try {
      const scoutBriefing = await scoutForLena(session.establishmentName, session.city);
      scoutContext = scoutBriefing
        ? `\n\n🌐 SCOUT vient de me transmettre ces infos terrain :\n${scoutBriefing}`
        : "";
    } catch {
      // SCOUT indisponible, on continue sans
    }
  }

  // Construire le contexte de session pour LÉNA
  const sessionContext = `
📍 SESSION EN COURS (membre équipe terrain #${userId}) :
- Établissement : ${session.establishmentName || "Non défini"}
- Ville : ${session.city || "Non définie"}
- Étape actuelle : ${session.currentStep}
- Données collectées : ${JSON.stringify(session.collectedData, null, 2)}
${scoutContext}`;

  const systemWithContext = LENA_SYSTEM_PROMPT + "\n\n" + sessionContext;

  // Appel Claude Opus
  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1500,
    system: systemWithContext,
    messages: [
      ...history.slice(-20), // Garder les 20 derniers messages max
      { role: "user", content: message },
    ],
  });

  const content = response.content[0].type === "text" ? response.content[0].text : "";

  // Détecter si LÉNA a généré une fiche JSON
  let draftFiche: Record<string, unknown> | undefined;
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    try {
      draftFiche = JSON.parse(jsonMatch[1]) as Record<string, unknown>;
    } catch {
      // JSON invalide, on ignore
    }
  }

  return {
    content,
    step: nextStep,
    shouldLaunchScout,
    draftFiche,
    readyForPublication,
  };
}

// ─── Génération de fiche complète par LÉNA ────────────────────────────────────

export async function generateFicheWithLena(
  establishmentName: string,
  city: string,
  collectedData: Record<string, any>
): Promise<Record<string, unknown>> {
  // SCOUT fait le terrain en parallèle
  let scoutBriefing = "";
  try {
    scoutBriefing = await scoutForLena(establishmentName, city);
  } catch {
    // SCOUT indisponible
  }

  const prompt = `Génère une fiche complète pour "${establishmentName}" à ${city}.

Données collectées sur le terrain :
${JSON.stringify(collectedData, null, 2)}

${scoutBriefing ? `Infos SCOUT (recherche web) :\n${scoutBriefing}` : ""}

Génère la fiche au format JSON structuré selon ton protocole. Sois précis, premium, et SEO-optimisé.`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2000,
    system: LENA_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0].type === "text" ? response.content[0].text : "";

  // Extraire le JSON
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]) as Record<string, unknown>;
    } catch {
      return { rawContent: content };
    }
  }

  return { rawContent: content };
}
