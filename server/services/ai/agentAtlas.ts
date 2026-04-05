/**
 * AGENT ATLAS — Recherche dans la base de données locale (fiches établissements)
 * Rôle : fournir les fiches curatées Baymora pour enrichir les réponses IA
 */
import { getDb } from "../../db";
import { establishments } from "../../../drizzle/schema";
import { like, or, desc } from "drizzle-orm";

export interface AtlasResult {
  id: number;
  name: string;
  category: string;
  city: string;
  country: string;
  description: string;
  priceLevel: number;
  priceFrom: number | null;
  currency: string;
  rating: number | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  heroImageUrl: string | null;
  tags: string[];
  openingHours: string | null;
}

/**
 * Recherche des fiches Atlas selon la requête utilisateur
 * Utilisé dans les scénarios FLASH et EXPLORE
 */
export async function agentAtlas(query: string, city?: string): Promise<AtlasResult[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/).filter(w => w.length > 3);

    // Construire les conditions de recherche
    const conditions = [];

    // Recherche par ville si spécifiée
    if (city) {
      conditions.push(like(establishments.city, `%${city}%`));
    }

    // Recherche par mots-clés dans le nom et la description
    for (const word of words.slice(0, 3)) {
      conditions.push(
        or(
          like(establishments.name, `%${word}%`),
          like(establishments.city, `%${word}%`),
          like(establishments.category, `%${word}%`)
        )
      );
    }

    let rows: any[] = [];

    if (conditions.length > 0) {
      rows = await db
        .select()
        .from(establishments)
        .where(or(...conditions))
        .orderBy(desc(establishments.rating))
        .limit(8);
    } else {
      rows = await db
        .select()
        .from(establishments)
        .orderBy(desc(establishments.rating))
        .limit(5);
    }

    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      city: r.city,
      country: r.country || "France",
      description: r.description || "",
      priceLevel: r.priceLevel || "moderate",
      priceFrom: null,
      currency: "€",
      rating: r.rating ? parseFloat(r.rating) : null,
      address: r.address,
      phone: r.phone,
      website: r.website,
      heroImageUrl: r.heroImageUrl,
      tags: r.tags ? (Array.isArray(r.tags) ? r.tags : (() => { try { return JSON.parse(r.tags); } catch { return []; } })()) : [],
      openingHours: r.openingHours,
    }));
  } catch (err) {
    console.error("[AgentAtlas] Erreur:", err);
    return [];
  }
}

/**
 * Formater les résultats Atlas en briefing pour Claude
 */
export function formatAtlasBriefing(results: AtlasResult[]): string {
  if (results.length === 0) return "";

  const lines = results.map(r => {
    const price = r.priceLevel ? `Gamme ${r.priceLevel}` : "";
    const rating = r.rating ? `⭐ ${r.rating}/5` : "";
    const tags = r.tags.length > 0 ? `[${r.tags.slice(0, 3).join(", ")}]` : "";
    return `• **${r.name}** (${r.category}, ${r.city}) — ${price} ${rating} ${tags}\n  ${r.description.slice(0, 120)}...`;
  });

  return `\n\n📚 FICHES ATLAS BAYMORA (utilise ces données en priorité) :\n${lines.join("\n\n")}`;
}
