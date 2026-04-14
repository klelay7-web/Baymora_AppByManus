/**
 * ─── Maison Baymora — Profile Service ────────────────────────────────────────
 * Helpers DB pour : clientProfiles, companions, userDestinations, memberProfiles
 */
import { eq, and, or, desc } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { getDb, getMysqlConnOpts } from "../db";
import {
  clientProfiles, InsertClientProfile, ClientProfile,
  companions, InsertCompanion, Companion,
  userDestinations, InsertUserDestination, UserDestination,
  destinationSaves,
  memberProfiles,
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

// ─── Member Profile (table member_profiles) ─────────────────────────────────
// Profil dynamique enrichi par Maya à chaque conversation.

const MEMBER_PROFILE_CLAUDE_MODEL = "claude-sonnet-4-5";

export interface MemberCompanion {
  name: string;
  relation: string;
}

export interface MemberProfileDoc {
  id: number;
  userId: number;
  preferences: Record<string, unknown>;
  habits: Record<string, unknown>;
  companions: MemberCompanion[];
  visitedSlugs: string[];
  favoriteCities: string[];
  conversationCount: number;
  lastConversationAt: Date | null;
  creatorStatus: "member" | "creator" | "eclaireur";
  walletCredits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberProfilePatch {
  preferences?: Record<string, unknown>;
  habits?: Record<string, unknown>;
  companions?: MemberCompanion[];
  visitedSlugs?: string[];
  favoriteCities?: string[];
  conversationCount?: number;
  lastConversationAt?: Date;
  creatorStatus?: "member" | "creator" | "eclaireur";
  walletCredits?: number;
}

// ─── Auto-migration (idempotent) ────────────────────────────────────────────
let memberProfilesSchemaEnsured = false;

async function ensureMemberProfilesSchema(): Promise<void> {
  if (memberProfilesSchemaEnsured) return;
  const url = process.env.DATABASE_URL;
  if (!url) return;

  const mysql = await import("mysql2/promise");
  const conn = await mysql.default.createConnection(getMysqlConnOpts());
  try {
    const dbNameMatch = url.match(/\/([^/?]+)(?:\?|$)/);
    const dbName = dbNameMatch ? dbNameMatch[1] : "baymora";
    const [rows] = (await conn.execute(
      `SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'member_profiles'`,
      [dbName]
    )) as any[];
    if (!rows || rows[0].c === 0) {
      console.log("[profileService] Creating member_profiles table…");
      await conn.query(`CREATE TABLE IF NOT EXISTS \`member_profiles\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`userId\` int NOT NULL,
        \`preferences\` json DEFAULT (JSON_OBJECT()),
        \`habits\` json DEFAULT (JSON_OBJECT()),
        \`companions\` json DEFAULT (JSON_ARRAY()),
        \`visitedSlugs\` json DEFAULT (JSON_ARRAY()),
        \`favoriteCities\` json DEFAULT (JSON_ARRAY()),
        \`conversationCount\` int DEFAULT 0,
        \`lastConversationAt\` timestamp NULL,
        \`creatorStatus\` enum('member','creator','eclaireur') DEFAULT 'member',
        \`walletCredits\` int DEFAULT 0,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`member_profiles_userId_unique\` (\`userId\`),
        KEY \`idx_user\` (\`userId\`)
      )`);
    }
    memberProfilesSchemaEnsured = true;
  } finally {
    await conn.end();
  }
}

// ─── Normalization helpers ──────────────────────────────────────────────────
function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch { /* ignore */ }
  }
  return {};
}

function asTypedArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch { /* ignore */ }
  }
  return [];
}

function normalizeMemberProfile(row: any): MemberProfileDoc {
  return {
    id: row.id,
    userId: row.userId,
    preferences: asObject(row.preferences),
    habits: asObject(row.habits),
    companions: asTypedArray<MemberCompanion>(row.companions),
    visitedSlugs: asTypedArray<string>(row.visitedSlugs),
    favoriteCities: asTypedArray<string>(row.favoriteCities),
    conversationCount: row.conversationCount ?? 0,
    lastConversationAt: row.lastConversationAt ?? null,
    creatorStatus: row.creatorStatus ?? "member",
    walletCredits: row.walletCredits ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────
export async function getOrCreateMemberProfile(userId: number): Promise<MemberProfileDoc | null> {
  await ensureMemberProfilesSchema();
  const db = await getDb();
  if (!db) return null;

  const existing = await db
    .select()
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, userId))
    .limit(1);

  if (existing.length > 0) return normalizeMemberProfile(existing[0]);

  await db.insert(memberProfiles).values({
    userId,
    preferences: {},
    habits: {},
    companions: [],
    visitedSlugs: [],
    favoriteCities: [],
  } as any);

  const created = await db
    .select()
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, userId))
    .limit(1);
  return created.length > 0 ? normalizeMemberProfile(created[0]) : null;
}

// Deep merge : arrays are unioned (dedupe by JSON), objects merged recursively.
function deepMergeMember<T extends Record<string, any>>(base: T, patch: Partial<T>): T {
  const out: any = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === null) continue;
    const existing = out[k];
    if (Array.isArray(existing) && Array.isArray(v)) {
      const seen = new Set<string>(existing.map((x: any) => (typeof x === "object" ? JSON.stringify(x) : String(x))));
      const merged = [...existing];
      for (const item of v) {
        const key = typeof item === "object" ? JSON.stringify(item) : String(item);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      }
      out[k] = merged;
    } else if (
      existing &&
      typeof existing === "object" &&
      !Array.isArray(existing) &&
      v &&
      typeof v === "object" &&
      !Array.isArray(v)
    ) {
      out[k] = deepMergeMember(existing, v as any);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

export async function updateMemberProfile(
  userId: number,
  patch: MemberProfilePatch
): Promise<MemberProfileDoc | null> {
  const current = await getOrCreateMemberProfile(userId);
  if (!current) return null;

  const mergedPreferences = patch.preferences
    ? deepMergeMember(current.preferences, patch.preferences)
    : current.preferences;
  const mergedHabits = patch.habits ? deepMergeMember(current.habits, patch.habits) : current.habits;

  const unionArray = <T>(base: T[], next: T[] | undefined): T[] => {
    if (!next) return base;
    const seen = new Set<string>(base.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))));
    const out = [...base];
    for (const item of next) {
      const key = typeof item === "object" ? JSON.stringify(item) : String(item);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(item);
      }
    }
    return out;
  };

  const mergedCompanions = unionArray<MemberCompanion>(current.companions, patch.companions);
  const mergedVisitedSlugs = unionArray<string>(current.visitedSlugs, patch.visitedSlugs);
  const mergedFavoriteCities = unionArray<string>(current.favoriteCities, patch.favoriteCities);

  const db = await getDb();
  if (!db) return null;

  await db
    .update(memberProfiles)
    .set({
      preferences: mergedPreferences as any,
      habits: mergedHabits as any,
      companions: mergedCompanions as any,
      visitedSlugs: mergedVisitedSlugs as any,
      favoriteCities: mergedFavoriteCities as any,
      conversationCount: patch.conversationCount ?? current.conversationCount,
      lastConversationAt: (patch.lastConversationAt ?? current.lastConversationAt ?? undefined) as any,
      creatorStatus: (patch.creatorStatus ?? current.creatorStatus) as any,
      walletCredits: patch.walletCredits ?? current.walletCredits,
    } as any)
    .where(eq(memberProfiles.userId, userId));

  return getOrCreateMemberProfile(userId);
}

// ─── Conversation enrichment via Claude ─────────────────────────────────────
interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ExtractedSignals {
  cuisine?: string[];
  ambiance?: string[];
  budget?: string;
  companions?: MemberCompanion[];
  villes?: string[];
  transport?: string;
}

export async function enrichProfileFromConversation(
  userId: number,
  messages: ConversationMessage[]
): Promise<void> {
  if (!messages || messages.length === 0) return;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    console.warn("[profileService] ANTHROPIC_API_KEY missing, skipping profile enrichment");
    return;
  }

  const recent = messages.filter((m) => m.role !== "system").slice(-20);
  if (recent.length === 0) return;

  const transcript = recent
    .map((m) => `${m.role === "user" ? "Membre" : "Maya"}: ${m.content}`)
    .join("\n");

  const prompt = `Tu es un extracteur de préférences client. Analyse la conversation suivante entre un Membre et Maya (assistante voyage de Maison Baymora). Extrais UNIQUEMENT les préférences explicitement mentionnées par le Membre. N'invente rien. Si rien n'est dit sur un champ, omets-le.

Conversation :
${transcript}

Retourne UNIQUEMENT un JSON strict (pas de markdown, pas de préambule) avec uniquement les champs détectés :

{
  "cuisine": ["liste des types de cuisine mentionnés : italien, japonais, méditerranéen, libanais, gastronomie, etc."],
  "ambiance": ["liste des ambiances : romantique, festif, calme, design, rooftop, bistrot, palace, etc."],
  "budget": "une valeur parmi : economique, confort, premium, luxe, sans_limite",
  "companions": [{ "name": "prénom", "relation": "conjoint|enfant|ami|parent|collegue" }],
  "villes": ["villes où le Membre veut aller ou qu'il aime"],
  "transport": "une valeur parmi : chauffeur, uber, taxi, train, avion, voiture, marche"
}

Réponds uniquement avec le JSON, sans commentaire. Si rien n'est détecté, réponds {}.`;

  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const response = await anthropic.messages.create({
      model: MEMBER_PROFILE_CLAUDE_MODEL,
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b: any) => b.type === "text") as any;
    const raw = textBlock?.text?.trim() || "";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();

    let signals: ExtractedSignals = {};
    try {
      signals = JSON.parse(cleaned);
    } catch {
      console.warn("[profileService] enrichment returned invalid JSON:", cleaned.substring(0, 200));
      return;
    }

    const patch: MemberProfilePatch = {};
    const preferencesPatch: Record<string, unknown> = {};
    const habitsPatch: Record<string, unknown> = {};

    if (Array.isArray(signals.cuisine) && signals.cuisine.length > 0) {
      preferencesPatch.cuisine = signals.cuisine;
    }
    if (Array.isArray(signals.ambiance) && signals.ambiance.length > 0) {
      preferencesPatch.ambiance = signals.ambiance;
    }
    if (typeof signals.budget === "string" && signals.budget.length > 0) {
      habitsPatch.budgetHabituel = signals.budget;
    }
    if (typeof signals.transport === "string" && signals.transport.length > 0) {
      habitsPatch.transportPreferred = signals.transport;
    }

    if (Object.keys(preferencesPatch).length > 0) patch.preferences = preferencesPatch;
    if (Object.keys(habitsPatch).length > 0) patch.habits = habitsPatch;
    if (Array.isArray(signals.companions) && signals.companions.length > 0) {
      patch.companions = signals.companions.filter((c) => c && typeof c.name === "string");
    }
    if (Array.isArray(signals.villes) && signals.villes.length > 0) {
      patch.favoriteCities = signals.villes.filter((v) => typeof v === "string");
    }

    // Always bump conversationCount + timestamp
    const currentDoc = await getOrCreateMemberProfile(userId);
    patch.conversationCount = (currentDoc?.conversationCount ?? 0) + 1;
    patch.lastConversationAt = new Date();

    await updateMemberProfile(userId, patch);
    const enrichedFields = Object.keys(patch).filter((k) => !["conversationCount", "lastConversationAt"].includes(k));
    console.log(
      `[profileService] enriched profile for user ${userId} — fields: ${enrichedFields.length > 0 ? enrichedFields.join(", ") : "(counters only)"}`
    );
  } catch (err) {
    console.error("[profileService] enrichProfileFromConversation error:", err);
  }
}
