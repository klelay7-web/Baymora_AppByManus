/**
 * affiliateService.ts
 * Service de matching affiliation — appelé à chaque création de fiche établissement.
 * Cherche le programme affilié actif qui correspond au type d'établissement,
 * génère le lien affilié et retourne les données pour mise à jour de la fiche.
 */
import { getDb } from "../db";
import { affiliatePrograms } from "../../drizzle/schema";
import { and, eq, inArray, asc } from "drizzle-orm";

// Mapping type établissement → catégorie programme affilié
const categoryMap: Record<string, string[]> = {
  hotel: ["hotel"],
  restaurant: ["restaurant"],
  bar: ["restaurant"], // TheFork couvre aussi certains bars
  activite: ["activite"],
  activity: ["activite"],
  spa: ["activite"],
  wellness: ["activite"],
  club: ["activite"],
  nightclub: ["activite"],
  lieu: ["activite"],
  experience: ["activite"],
  transport: ["transport", "vol", "location_voiture"],
  service: ["transport", "location_voiture"],
  museum: ["activite"],
  park: ["activite"],
  beach: ["activite"],
  shopping: ["activite"],
};

export interface AffiliateMatchResult {
  isAffiliated: boolean;
  affiliateSource?: string;
  affiliateUrl?: string;
  affiliateCommission?: string;
}

export async function matchAffiliation(establishment: {
  name: string;
  city: string;
  type: string;
}): Promise<AffiliateMatchResult> {
  try {
    const db = await getDb();

    const categories = categoryMap[establishment.type.toLowerCase()] || ["activite"];

    if (!db) return { isAffiliated: false };

    // Chercher le programme actif avec la meilleure priorité (numéro le plus bas)
    const rows = await db
      .select()
      .from(affiliatePrograms)
      .where(and(
        inArray(affiliatePrograms.category, categories),
        eq(affiliatePrograms.isActive, true),
      ))
      .orderBy(asc(affiliatePrograms.priority))
      .limit(1);
    const program = rows[0];

        if (!program || !(program as any).affiliateId) {
      return { isAffiliated: false };
    }

    // Générer le lien affilié
    const searchQuery = encodeURIComponent(`${establishment.name} ${establishment.city}`);
    let url = (program as any).urlTemplate || program.baseUrl || "";
    url = url
      .replace("{query}", searchQuery)
      .replace("{affiliateId}", (program as any).affiliateId);

    return {
      isAffiliated: true,
      affiliateSource: program.slug,
      affiliateUrl: url,
      affiliateCommission: program.commissionRate || undefined,
    };
  } catch (e) {
    console.error("[affiliateService] matchAffiliation error:", e);
    return { isAffiliated: false };
  }
}

/**
 * Retourne tous les programmes actifs pour un type donné
 */
export async function getActivePrograms(type: string) {
  try {
    const db = await getDb();
    const categories = categoryMap[type.toLowerCase()] || ["activite"];
    if (!db) return [];
    return await db
      .select()
      .from(affiliatePrograms)
      .where(and(
        inArray(affiliatePrograms.category, categories),
        eq(affiliatePrograms.isActive, true),
      ))
      .orderBy(asc(affiliatePrograms.priority));
  } catch (e) {
    console.error("[affiliateService] getActivePrograms error:", e);
    return [];
  }
}
