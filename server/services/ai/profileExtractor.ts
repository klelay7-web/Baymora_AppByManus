/**
 * profileExtractor.ts — Service d'extraction intelligente du profil client
 * 
 * Deux fonctions principales :
 * 1. extractProfileFromConversation — analyse les messages et enrichit le profil silencieusement
 * 2. injectAriaInstructions — ARIA peut ajouter/modifier des instructions dynamiques dans le prompt
 */

import { invokeLLM } from "../../_core/llm";
import { getDb } from "../../db";
import { clientProfiles } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface AriaInstruction {
  id: string;
  instruction: string;
  addedAt: string;
  addedBy: "aria" | "manus" | "owner";
  active: boolean;
}

export interface ExtractedProfile {
  homeCity?: string;
  travelGroup?: "solo" | "couple" | "famille" | "amis" | "business";
  travelBudget?: "economique" | "confort" | "premium" | "luxe" | "sans_limite";
  travelMobility?: "aucune" | "pmr" | "reduite" | "poussette";
  pet?: "aucun" | "chien" | "chat" | "autre";
  dietRegime?: string;
  dietAllergies?: string;
  favoriteCuisine?: string;
  travelStyles?: string;
  freeNotes?: string;
  languages?: string;
}

/**
 * Analyse les derniers messages d'une conversation pour extraire des infos profil
 * Appelé silencieusement après chaque message utilisateur
 */
export async function extractProfileFromConversation(
  userId: number,
  recentMessages: Array<{ role: string; content: string }>
): Promise<ExtractedProfile | null> {
  try {
    const userMessages = recentMessages
      .filter(m => m.role === "user")
      .slice(-5)
      .map(m => m.content)
      .join("\n");

    if (userMessages.length < 20) return null;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Tu es un extracteur de profil silencieux. Analyse les messages utilisateur et extrait UNIQUEMENT les informations explicitement mentionnées sur la personne.
          
Retourne un JSON avec UNIQUEMENT les champs trouvés (ne pas inventer) :
{
  "homeCity": "ville de résidence si mentionnée",
  "travelGroup": "solo|couple|famille|amis|business si mentionné",
  "travelBudget": "economique|confort|premium|luxe|sans_limite si mentionné",
  "travelMobility": "aucune|pmr|reduite|poussette si mentionné",
  "pet": "aucun|chien|chat|autre si mentionné",
  "dietRegime": "régimes alimentaires si mentionnés",
  "dietAllergies": "allergies si mentionnées",
  "favoriteCuisine": "cuisines préférées si mentionnées",
  "travelStyles": "styles de voyage si mentionnés",
  "freeNotes": "autres infos pertinentes (enfants, handicap, préférences spéciales)"
}

Si aucune info n'est trouvée, retourne {}.`
        },
        {
          role: "user",
          content: `Messages à analyser :\n${userMessages}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "profile_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              homeCity: { type: "string" },
              travelGroup: { type: "string" },
              travelBudget: { type: "string" },
              travelMobility: { type: "string" },
              pet: { type: "string" },
              dietRegime: { type: "string" },
              dietAllergies: { type: "string" },
              favoriteCuisine: { type: "string" },
              travelStyles: { type: "string" },
              freeNotes: { type: "string" }
            },
            required: [],
            additionalProperties: false
          }
        }
      }
    });

    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent) return null;
    const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
    const extracted: ExtractedProfile = JSON.parse(content);;
    
    // Si des infos ont été trouvées, mettre à jour le profil
    if (Object.keys(extracted).length > 0) {
      await updateProfileFromExtraction(userId, extracted);
    }

    return extracted;
  } catch (err) {
    console.error("[ProfileExtractor] Erreur extraction:", err);
    return null;
  }
}

/**
 * Met à jour le profil client avec les données extraites
 */
async function updateProfileFromExtraction(userId: number, extracted: ExtractedProfile) {
  try {
    const db = await getDb();
    if (!db) return;
    const existing = await db.select().from(clientProfiles).where(eq(clientProfiles.userId, userId)).limit(1);
    
    const updateData: Record<string, unknown> = {
      aiLastExtracted: new Date(),
      profileExtractedFields: JSON.stringify(extracted)
    };

    // Mapper les champs extraits vers les colonnes DB
    if (extracted.homeCity) updateData.homeCity = extracted.homeCity;
    if (extracted.travelGroup && ["solo","couple","famille","amis","business"].includes(extracted.travelGroup)) {
      updateData.travelGroup = extracted.travelGroup as "solo" | "couple" | "famille" | "amis" | "business";
    }
    if (extracted.travelBudget && ["economique","confort","premium","luxe","sans_limite"].includes(extracted.travelBudget)) {
      updateData.travelBudget = extracted.travelBudget as "economique" | "confort" | "premium" | "luxe" | "sans_limite";
    }
    if (extracted.travelMobility && ["aucune","pmr","reduite","poussette"].includes(extracted.travelMobility)) {
      updateData.travelMobility = extracted.travelMobility as "aucune" | "pmr" | "reduite" | "poussette";
    }
    if (extracted.pet && ["aucun","chien","chat","autre"].includes(extracted.pet)) {
      updateData.pet = extracted.pet as "aucun" | "chien" | "chat" | "autre";
    }
    if (extracted.dietRegime) updateData.dietRegime = extracted.dietRegime;
    if (extracted.dietAllergies) updateData.dietAllergies = extracted.dietAllergies;
    if (extracted.favoriteCuisine) updateData.favoriteCuisine = extracted.favoriteCuisine;
    if (extracted.travelStyles) updateData.travelStyles = extracted.travelStyles;
    if (extracted.freeNotes) updateData.freeNotes = extracted.freeNotes;

    if (existing.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.update(clientProfiles).set(updateData as any).where(eq(clientProfiles.userId, userId));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.insert(clientProfiles).values({ userId, ...updateData } as any);
    }
  } catch (err) {
    console.error("[ProfileExtractor] Erreur mise à jour profil:", err);
  }
}

/**
 * ARIA ajoute une instruction dynamique dans le prompt d'un client spécifique
 * ou dans le prompt global (userId = null)
 */
export async function addAriaInstruction(
  userId: number,
  instruction: string,
  addedBy: "aria" | "manus" | "owner" = "aria"
): Promise<AriaInstruction> {
  const newInstruction: AriaInstruction = {
    id: `aria_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    instruction,
    addedAt: new Date().toISOString(),
    addedBy,
    active: true
  };

  try {
    const db = await getDb();
    if (!db) return newInstruction;
    const existing = await db.select().from(clientProfiles).where(eq(clientProfiles.userId, userId)).limit(1);
    
    let currentInstructions: AriaInstruction[] = [];
    if (existing.length > 0 && existing[0].ariaInstructions) {
      try { currentInstructions = JSON.parse(existing[0].ariaInstructions); } catch {}
    }
    
    currentInstructions.push(newInstruction);
    
    const updateData = {
      ariaInstructions: JSON.stringify(currentInstructions),
      ariaInstructionsUpdatedAt: new Date()
    };

    if (existing.length > 0) {
      await db.update(clientProfiles).set(updateData).where(eq(clientProfiles.userId, userId));
    } else {
      await db.insert(clientProfiles).values({ userId, ...updateData });
    }
  } catch (err) {
    console.error("[ProfileExtractor] Erreur ajout instruction ARIA:", err);
  }

  return newInstruction;
}

/**
 * Récupère les instructions ARIA actives pour un client
 */
export async function getAriaInstructions(userId: number): Promise<AriaInstruction[]> {
  try {
    const db = await getDb();
    if (!db) return [];
    const profile = await db.select({ ariaInstructions: clientProfiles.ariaInstructions })
      .from(clientProfiles)
      .where(eq(clientProfiles.userId, userId))
      .limit(1);
    
    if (!profile.length || !profile[0].ariaInstructions) return [];
    
    const instructions: AriaInstruction[] = JSON.parse(profile[0].ariaInstructions);
    return instructions.filter(i => i.active);
  } catch {
    return [];
  }
}

/**
 * Désactive une instruction ARIA
 */
export async function removeAriaInstruction(userId: number, instructionId: string): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    const profile = await db.select({ ariaInstructions: clientProfiles.ariaInstructions })
      .from(clientProfiles)
      .where(eq(clientProfiles.userId, userId))
      .limit(1);
    
    if (!profile.length || !profile[0].ariaInstructions) return;
    
    const instructions: AriaInstruction[] = JSON.parse(profile[0].ariaInstructions);
    const updated = instructions.map(i => i.id === instructionId ? { ...i, active: false } : i);
    
    await db.update(clientProfiles)
      .set({ ariaInstructions: JSON.stringify(updated) })
      .where(eq(clientProfiles.userId, userId));
  } catch (err) {
    console.error("[ProfileExtractor] Erreur suppression instruction:", err);
  }
}

/**
 * Génère les questions discrètes à poser selon les champs manquants du profil
 */
export function getProfileGapQuestions(profile: Partial<{
  homeCity: string | null;
  travelGroup: string | null;
  pet: string | null;
  travelMobility: string | null;
  dietAllergies: string | null;
}>): string[] {
  const questions: string[] = [];
  
  if (!profile.homeCity) {
    questions.push("D'où partez-vous ? (pour optimiser les trajets et horaires)");
  }
  if (!profile.travelGroup) {
    questions.push("Vous voyagez seul(e), en couple, en famille ou entre amis ?");
  }
  if (profile.pet === null || profile.pet === undefined) {
    questions.push("Voyagez-vous avec un animal de compagnie ?");
  }
  
  return questions.slice(0, 1); // Une seule question à la fois, discrètement
}
