/**
 * radarService.ts
 * Service Radar — recommandations géolocalisées autour de la position du Membre.
 * Accès : Invité (1 jour gratuit/mois), Membre/Duo/Cercle (trial 30j ou subscription).
 */
import { getDb } from "../db";
import { users, establishments } from "../../drizzle/schema";
import { eq, and, between, gt, desc } from "drizzle-orm";

/**
 * Quota mensuel de recherches radar selon le tier d'abonnement.
 * - Invité (free) : 3
 * - Membre (explorer) : 5
 * - Duo (premium) : 8
 * - Le Cercle (elite ou isCercle=true) : illimité
 * Retourne `null` quand le quota est illimité.
 */
export function getRadarMaxSearches(
  subscriptionTier: string | null | undefined,
  isCercle: boolean | null | undefined
): number | null {
  if (isCercle || subscriptionTier === "elite") return null;
  if (subscriptionTier === "premium") return 8;
  if (subscriptionTier === "explorer") return 5;
  return 3;
}

export interface RadarCategory {
  icon: string;
  title: string;
  items: any[];
}

export interface RadarResult {
  locked: boolean;
  message?: string;
  city?: string;
  categories?: RadarCategory[];
}

function checkRadarAccess(user: any): boolean {
  const now = new Date();
  // Invité : déblocage 24h (1x/mois max)
  if (!user.isCercle && !user.stripeSubscriptionId) {
    return !!(user.radarUnlockedUntil && new Date(user.radarUnlockedUntil) > now);
  }
  // Membre/Duo/Cercle : trial ou subscription
  if (user.radarSubscribed) return true;
  if (user.radarTrialEnd && new Date(user.radarTrialEnd) > now) return true;
  return false;
}

function isThisMonth(date: Date | null): boolean {
  if (!date) return false;
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function filterByType(items: any[], types: string[]) {
  return items.filter(e => types.includes(e.category?.toLowerCase() || ""));
}

function filterByEvents(items: any[]) {
  // Retourne les établissements recommandés récemment (timesRecommended > 0)
  return items.filter(e => (e.timesRecommended || 0) > 0).slice(0, 5);
}

export async function getRadarForPosition(
  lat: number,
  lng: number,
  city: string,
  userId: number
): Promise<RadarResult> {
  try {
    const db = await getDb();
    if (!db) return { locked: true, message: "Service temporairement indisponible." };

    // 1. Vérifier accès
    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userRows[0];
    if (!user) return { locked: true, message: "Membre introuvable." };

    const hasAccess = checkRadarAccess(user);
    if (!hasAccess) {
      return {
        locked: true,
        message: "Débloquez votre Radar pour découvrir ce qui se passe autour de vous.",
      };
    }

    // 2. Chercher les fiches existantes dans un rayon de ~15km et < 7 jours
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let existingEstablishments: any[] = [];

    if (lat !== 0 && lng !== 0) {
      existingEstablishments = await db
        .select()
        .from(establishments)
        .where(
          and(
            between(establishments.lat, lat - 0.15, lat + 0.15),
            between(establishments.lng, lng - 0.15, lng + 0.15),
            gt(establishments.updatedAt, sevenDaysAgo),
          )
        )
        .orderBy(desc(establishments.rating))
        .limit(30);
    } else {
      // Recherche par ville
      existingEstablishments = await db
        .select()
        .from(establishments)
        .where(
          and(
            eq(establishments.city, city),
            eq(establishments.status, "published"),
          )
        )
        .orderBy(desc(establishments.rating))
        .limit(30);
    }

    // 3. Catégoriser les résultats
    return {
      locked: false,
      city,
      categories: [
        { icon: "🔥", title: "Ce soir / Ce week-end", items: filterByEvents(existingEstablishments) },
        { icon: "🍽️", title: "Restaurants & Bars", items: filterByType(existingEstablishments, ["restaurant", "bar"]) },
        { icon: "🏨", title: "Hôtels & Hébergements", items: filterByType(existingEstablishments, ["hotel"]) },
        { icon: "💆", title: "Bien-être & Spa", items: filterByType(existingEstablishments, ["spa", "wellness"]) },
        { icon: "🎭", title: "Culture & Activités", items: filterByType(existingEstablishments, ["activity", "museum", "park", "experience"]) },
        { icon: "🎉", title: "Sorties & Nightlife", items: filterByType(existingEstablishments, ["nightclub", "bar", "club"]) },
      ],
    };
  } catch (e) {
    console.error("[radarService] getRadarForPosition error:", e);
    return { locked: true, message: "Erreur lors du chargement du Radar." };
  }
}

export async function unlockRadarForUser(userId: number): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false, message: "Service indisponible." };

    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userRows[0];
    if (!user) return { success: false, message: "Membre introuvable." };

    const isPaid = !!(user.isCercle || user.stripeSubscriptionId);

    if (!isPaid) {
      // Invité : 1 déblocage gratuit par mois (24h)
      if (user.radarUnlockedUntil && isThisMonth(new Date(user.radarUnlockedUntil))) {
        return { success: false, message: "Vous avez déjà utilisé votre déblocage gratuit ce mois. Passez Membre pour un accès continu." };
      }
      await db.update(users).set({
        radarUnlockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      } as any).where(eq(users.id, userId));
      return { success: true, message: "Radar débloqué pour 24h !" };
    } else {
      // Membre/Duo/Cercle : trial 30 jours
      if (user.radarTrialEnd) {
        return { success: false, message: "Votre essai a déjà été utilisé." };
      }
      await db.update(users).set({
        radarTrialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      } as any).where(eq(users.id, userId));
      return { success: true, message: "Radar activé ! 1 mois offert." };
    }
  } catch (e) {
    console.error("[radarService] unlockRadarForUser error:", e);
    return { success: false, message: "Erreur lors du déblocage." };
  }
}

export async function searchCityRadar(
  city: string,
  userId: number
): Promise<{ success: boolean; message?: string; results?: RadarResult; searchesRemaining?: number }> {
  try {
    const db = await getDb();
    if (!db) return { success: false, message: "Service indisponible." };

    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userRows[0];
    if (!user) return { success: false, message: "Membre introuvable." };

    const maxSearches = getRadarMaxSearches((user as any).subscriptionTier, (user as any).isCercle);
    const searchesUsed = user.radarSearchesUsed || 0;

    if (maxSearches !== null && searchesUsed >= maxSearches) {
      return {
        success: false,
        message: `Vous avez utilisé vos ${maxSearches} recherches du mois. Utilisez 1 crédit pour une recherche supplémentaire.`,
      };
    }

    // Incrémenter le compteur
    await db.update(users).set({
      radarSearchesUsed: searchesUsed + 1,
    } as any).where(eq(users.id, userId));

    const results = await getRadarForPosition(0, 0, city, userId);
    return {
      success: true,
      results,
      searchesRemaining: maxSearches === null ? undefined : maxSearches - searchesUsed - 1,
    };
  } catch (e) {
    console.error("[radarService] searchCityRadar error:", e);
    return { success: false, message: "Erreur lors de la recherche." };
  }
}
