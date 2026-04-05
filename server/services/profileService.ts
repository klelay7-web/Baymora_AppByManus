/**
 * ─── Maison Baymora — Profile Service ────────────────────────────────────────
 * Helpers DB pour : clientProfiles, companions, userDestinations
 */
import { eq, and, or, desc } from "drizzle-orm";
import { getDb } from "../db";
import {
  clientProfiles, InsertClientProfile, ClientProfile,
  companions, InsertCompanion, Companion,
  userDestinations, InsertUserDestination, UserDestination,
  destinationSaves,
} from "../../drizzle/schema";

// ─── Client Profile ──────────────────────────────────────────────────────────

export async function getClientProfile(userId: number): Promise<ClientProfile | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(clientProfiles).where(eq(clientProfiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertClientProfile(userId: number, data: Partial<InsertClientProfile>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await getClientProfile(userId);
  if (existing) {
    await db.update(clientProfiles).set({ ...data, updatedAt: new Date() }).where(eq(clientProfiles.userId, userId));
  } else {
    await db.insert(clientProfiles).values({ userId, ...data });
  }
}

// ─── Companions (Cercle Proche) ──────────────────────────────────────────────

export async function listCompanions(userId: number): Promise<Companion[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companions)
    .where(and(eq(companions.userId, userId), eq(companions.isActive, true)))
    .orderBy(desc(companions.createdAt));
}

export async function getCompanion(id: number, userId: number): Promise<Companion | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(companions)
    .where(and(eq(companions.id, id), eq(companions.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createCompanion(userId: number, data: Omit<InsertCompanion, "userId">): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(companions).values({ userId, ...data });
  return (result as any)[0]?.insertId ?? 0;
}

export async function updateCompanion(id: number, userId: number, data: Partial<InsertCompanion>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(companions).set({ ...data, updatedAt: new Date() })
    .where(and(eq(companions.id, id), eq(companions.userId, userId)));
}

export async function deleteCompanion(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(companions).set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(companions.id, id), eq(companions.userId, userId)));
}

// ─── User Destinations (Parcours Personnels) ────────────────────────────────

export async function listMyDestinations(userId: number): Promise<UserDestination[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userDestinations)
    .where(eq(userDestinations.userId, userId))
    .orderBy(desc(userDestinations.updatedAt));
}

export async function listPublicDestinations(limit = 20): Promise<UserDestination[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userDestinations)
    .where(eq(userDestinations.visibility, "public"))
    .orderBy(desc(userDestinations.viewCount))
    .limit(limit);
}

export async function getDestination(id: number): Promise<UserDestination | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(userDestinations).where(eq(userDestinations.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createDestination(userId: number, data: Omit<InsertUserDestination, "userId">): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(userDestinations).values({ userId, ...data });
  return (result as any)[0]?.insertId ?? 0;
}

export async function updateDestination(id: number, userId: number, data: Partial<InsertUserDestination>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(userDestinations).set({ ...data, updatedAt: new Date() })
    .where(and(eq(userDestinations.id, id), eq(userDestinations.userId, userId)));
}

export async function deleteDestination(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(userDestinations)
    .where(and(eq(userDestinations.id, id), eq(userDestinations.userId, userId)));
}

export async function incrementDestinationView(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(userDestinations)
    .set({ viewCount: (await getDestination(id))?.viewCount ?? 0 + 1 })
    .where(eq(userDestinations.id, id));
}

export async function saveDestinationForUser(userId: number, destinationId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(destinationSaves).values({ userId, destinationId });
    const dest = await getDestination(destinationId);
    if (dest) {
      await db.update(userDestinations)
        .set({ saveCount: (dest.saveCount ?? 0) + 1 })
        .where(eq(userDestinations.id, destinationId));
    }
  } catch {
    // Already saved — ignore duplicate
  }
}
