import { eq, desc, and, sql, asc, like, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  conversations, messages,
  seoCards, userPreferences, travelCompanions,
  affiliatePartners, affiliateClicks, affiliateConversions,
  creditTransactions, agentTasks, socialMediaPosts, travelItineraries,
  establishments, establishmentMedia, tripPlans, tripDays, tripSteps
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field]; if (value === undefined) return;
      const normalized = value ?? null; values[field] = normalized; updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUser(userId: number, data: Partial<InsertUser>) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function updateUserCredits(userId: number, amount: number, type: string, description: string) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  return await db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new Error("User not found");
    const newBalance = user.credits + amount;
    if (newBalance < 0) throw new Error("Insufficient credits");
    await tx.update(users).set({ credits: newBalance }).where(eq(users.id, userId));
    await tx.insert(creditTransactions).values({ userId, amount, type: type as any, description, balanceAfter: newBalance });
    return newBalance;
  });
}

export async function incrementFreeMessages(userId: number) {
  const db = await getDb(); if (!db) return;
  await db.update(users).set({ freeMessagesUsed: sql`${users.freeMessagesUsed} + 1` }).where(eq(users.id, userId));
}

// ─── Conversations & Messages ────────────────────────────────────────
export async function createConversation(userId: number, title?: string, tripType?: string) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const result = await db.insert(conversations).values({ userId, title: title || "Nouvelle conversation", tripType: tripType as any });
  return result[0].insertId;
}

export async function getUserConversations(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
}

export async function getConversationMessages(conversationId: number, limit = 50) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt)).limit(limit);
}

export async function addMessage(conversationId: number, role: "user" | "assistant" | "system", content: string, metadata?: string, isVoice = false, attachmentType?: string, attachmentData?: string) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.insert(messages).values({ conversationId, role, content, metadata, isVoice, attachmentType: (attachmentType || "none") as any, attachmentData });
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));
}

// ─── User Preferences (Mémoire Client) ──────────────────────────────
export async function getUserPreferences(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
}

export async function upsertPreference(userId: number, category: string, key: string, value: string, source: "explicit" | "inferred" | "conversation" = "conversation") {
  const db = await getDb(); if (!db) return;
  const existing = await db.select().from(userPreferences)
    .where(and(eq(userPreferences.userId, userId), eq(userPreferences.category, category), eq(userPreferences.key, key))).limit(1);
  if (existing.length > 0) {
    await db.update(userPreferences).set({ value, source, updatedAt: new Date() }).where(eq(userPreferences.id, existing[0].id));
  } else {
    await db.insert(userPreferences).values({ userId, category, key, value, source });
  }
}

// ─── Travel Companions ──────────────────────────────────────────────
export async function getUserCompanions(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(travelCompanions).where(eq(travelCompanions.userId, userId));
}

export async function addCompanion(userId: number, data: { name: string; relationship?: string; dietaryRestrictions?: string; preferences?: string; allergies?: string; birthDate?: string; passportCountry?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.insert(travelCompanions).values({ userId, ...data });
}

// ─── Establishments ─────────────────────────────────────────────────
export async function getPublishedEstablishments(limit = 20, offset = 0, category?: string, city?: string) {
  const db = await getDb(); if (!db) return [];
  const conditions = [eq(establishments.status, "published")];
  if (category) conditions.push(eq(establishments.category, category as any));
  if (city) conditions.push(eq(establishments.city, city));
  return db.select().from(establishments).where(and(...conditions)).orderBy(desc(establishments.publishedAt)).limit(limit).offset(offset);
}

export async function getEstablishmentBySlug(slug: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(establishments).where(eq(establishments.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getEstablishmentById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(establishments).where(eq(establishments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createEstablishment(data: any) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const result = await db.insert(establishments).values(data);
  return result[0].insertId;
}

export async function updateEstablishment(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.update(establishments).set(data).where(eq(establishments.id, id));
}

export async function incrementEstablishmentViews(id: number) {
  const db = await getDb(); if (!db) return;
  await db.update(establishments).set({ viewCount: sql`${establishments.viewCount} + 1` }).where(eq(establishments.id, id));
}

export async function getAllEstablishments() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(establishments).orderBy(desc(establishments.createdAt));
}

// ─── Establishment Media ────────────────────────────────────────────
export async function getEstablishmentMedia(establishmentId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(establishmentMedia).where(eq(establishmentMedia.establishmentId, establishmentId)).orderBy(asc(establishmentMedia.sortOrder));
}

export async function addEstablishmentMedia(data: any) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.insert(establishmentMedia).values(data);
}

// ─── Trip Plans ─────────────────────────────────────────────────────
export async function getUserTripPlans(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(tripPlans).where(eq(tripPlans.userId, userId)).orderBy(desc(tripPlans.updatedAt));
}

export async function getTripPlanById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(tripPlans).where(eq(tripPlans.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createTripPlan(data: any) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const result = await db.insert(tripPlans).values(data);
  return result[0].insertId;
}

export async function updateTripPlan(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.update(tripPlans).set(data).where(eq(tripPlans.id, id));
}

// ─── Trip Days ──────────────────────────────────────────────────────
export async function getTripDays(tripPlanId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(tripDays).where(eq(tripDays.tripPlanId, tripPlanId)).orderBy(asc(tripDays.dayNumber));
}

export async function createTripDay(data: any) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const result = await db.insert(tripDays).values(data);
  return result[0].insertId;
}

// ─── Trip Steps ─────────────────────────────────────────────────────
export async function getTripSteps(tripDayId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(tripSteps).where(eq(tripSteps.tripDayId, tripDayId)).orderBy(asc(tripSteps.stepOrder));
}

export async function createTripStep(data: any) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const result = await db.insert(tripSteps).values(data);
  return result[0].insertId;
}

export async function updateTripStep(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.update(tripSteps).set(data).where(eq(tripSteps.id, id));
}

// ─── SEO Cards (legacy) ────────────────────────────────────────────
export async function getPublishedSeoCards(limit = 20, offset = 0) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(seoCards).where(eq(seoCards.status, "published")).orderBy(desc(seoCards.publishedAt)).limit(limit).offset(offset);
}

export async function getSeoCardBySlug(slug: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(seoCards).where(eq(seoCards.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSeoCard(data: any) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const result = await db.insert(seoCards).values(data);
  return result[0].insertId;
}

export async function updateSeoCard(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.update(seoCards).set(data).where(eq(seoCards.id, id));
}

export async function incrementSeoCardViews(id: number) {
  const db = await getDb(); if (!db) return;
  await db.update(seoCards).set({ viewCount: sql`${seoCards.viewCount} + 1` }).where(eq(seoCards.id, id));
}

export async function getAllSeoCards() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(seoCards).orderBy(desc(seoCards.createdAt));
}

// ─── Affiliate ──────────────────────────────────────────────────────
export async function getActivePartners() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(affiliatePartners).where(eq(affiliatePartners.isActive, true));
}

export async function trackAffiliateClick(partnerId: number, clickedUrl: string, seoCardId?: number, userId?: number, referrer?: string, userAgent?: string, ipHash?: string, establishmentId?: number) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const result = await db.insert(affiliateClicks).values({ partnerId, seoCardId, establishmentId, userId, clickedUrl, referrer, userAgent, ipHash });
  return result[0].insertId;
}

export async function getAffiliateStats() {
  const db = await getDb();
  if (!db) return { totalClicks: 0, totalConversions: 0, totalCommission: 0, pendingCommission: 0 };
  const [clicks] = await db.select({ count: sql<number>`count(*)` }).from(affiliateClicks);
  const [convs] = await db.select({
    count: sql<number>`count(*)`,
    total: sql<string>`COALESCE(SUM(commission), 0)`,
    pending: sql<string>`COALESCE(SUM(CASE WHEN status = 'pending' THEN commission ELSE 0 END), 0)`
  }).from(affiliateConversions);
  return {
    totalClicks: clicks?.count || 0, totalConversions: convs?.count || 0,
    totalCommission: parseFloat(convs?.total || "0"), pendingCommission: parseFloat(convs?.pending || "0"),
  };
}

// ─── Agent Tasks ────────────────────────────────────────────────────
export async function createAgentTask(department: string, agentType: string, taskType: string, input: string, priority = 5) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const result = await db.insert(agentTasks).values({ department: department as any, agentType, taskType, input, priority });
  return result[0].insertId;
}

export async function getQueuedTasks(department?: string, limit = 10) {
  const db = await getDb(); if (!db) return [];
  const conditions = department
    ? and(eq(agentTasks.status, "queued"), eq(agentTasks.department, department as any))
    : eq(agentTasks.status, "queued");
  return db.select().from(agentTasks).where(conditions).orderBy(asc(agentTasks.priority), asc(agentTasks.createdAt)).limit(limit);
}

export async function updateAgentTask(id: number, data: { status?: string; output?: string; errorMessage?: string }) {
  const db = await getDb(); if (!db) return;
  const updateData: any = { ...data };
  if (data.status === "processing") updateData.startedAt = new Date();
  if (data.status === "completed" || data.status === "failed") updateData.completedAt = new Date();
  await db.update(agentTasks).set(updateData).where(eq(agentTasks.id, id));
}

// ─── Social Media Posts ─────────────────────────────────────────────
export async function createSocialPost(data: any) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const result = await db.insert(socialMediaPosts).values(data);
  return result[0].insertId;
}

export async function getSocialPosts(limit = 20) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(socialMediaPosts).orderBy(desc(socialMediaPosts.createdAt)).limit(limit);
}

// ─── Travel Itineraries (legacy) ────────────────────────────────────
export async function getUserItineraries(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(travelItineraries).where(eq(travelItineraries.userId, userId)).orderBy(desc(travelItineraries.updatedAt));
}

export async function createItinerary(data: any) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const result = await db.insert(travelItineraries).values(data);
  return result[0].insertId;
}

// ─── Credit Transactions ────────────────────────────────────────────
export async function getCreditHistory(userId: number, limit = 20) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(creditTransactions).where(eq(creditTransactions.userId, userId)).orderBy(desc(creditTransactions.createdAt)).limit(limit);
}

// ─── Admin Stats ────────────────────────────────────────────────────
export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, premiumUsers: 0, totalCards: 0, publishedCards: 0, totalTasks: 0, totalEstablishments: 0, totalTripPlans: 0 };
  const [userStats] = await db.select({
    total: sql<number>`count(*)`,
    premium: sql<number>`SUM(CASE WHEN subscriptionTier = 'premium' THEN 1 ELSE 0 END)`
  }).from(users);
  const [cardStats] = await db.select({
    total: sql<number>`count(*)`,
    published: sql<number>`SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END)`
  }).from(seoCards);
  const [taskStats] = await db.select({ total: sql<number>`count(*)` }).from(agentTasks);
  const [estabStats] = await db.select({ total: sql<number>`count(*)` }).from(establishments);
  const [tripStats] = await db.select({ total: sql<number>`count(*)` }).from(tripPlans);
  return {
    totalUsers: userStats?.total || 0, premiumUsers: userStats?.premium || 0,
    totalCards: cardStats?.total || 0, publishedCards: cardStats?.published || 0,
    totalTasks: taskStats?.total || 0, totalEstablishments: estabStats?.total || 0,
    totalTripPlans: tripStats?.total || 0,
  };
}
