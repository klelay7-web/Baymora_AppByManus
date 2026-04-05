import { eq, desc, and, sql, asc, like, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  conversations, messages,
  seoCards, userPreferences, travelCompanions,
  affiliatePartners, affiliateClicks, affiliateConversions,
  creditTransactions, agentTasks, socialMediaPosts, travelItineraries,
  establishments, establishmentMedia, tripPlans, tripDays, tripSteps,
  favorites, collections, ambassadors, referrals, commissionPayments,
  serviceProviders, aiDirectives, aiDepartmentReports, bundles, contentCalendar,
  establishmentComments,
  fieldReports, fieldReportServices, fieldReportJourney, fieldReportContacts, fieldReportMedia,
  userDestinations, destinationSaves, clientProfiles, companions, pilotageMessages
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

// ─── Favorites ─────────────────────────────────────────────────────
export async function getUserFavorites(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(favorites).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt));
}
export async function addFavorite(userId: number, targetType: "establishment" | "seoCard" | "tripPlan" | "bundle", targetId: number, collectionId?: number) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(favorites).values({ userId, targetType, targetId, collectionId });
  return result[0].insertId;
}
export async function removeFavorite(userId: number, targetType: "establishment" | "seoCard" | "tripPlan" | "bundle", targetId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.targetType, targetType), eq(favorites.targetId, targetId)));
}

// ─── Collections ───────────────────────────────────────────────────
export async function getUserCollections(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(collections).where(eq(collections.userId, userId)).orderBy(desc(collections.createdAt));
}
export async function createCollection(userId: number, name: string, description?: string, coverImageUrl?: string) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(collections).values({ userId, name, description, coverImageUrl });
  return result[0].insertId;
}
export async function updateCollection(id: number, data: { name?: string; description?: string; coverImageUrl?: string; isPublic?: boolean }) {
  const db = await getDb(); if (!db) return;
  await db.update(collections).set(data).where(eq(collections.id, id));
}

// ─── Ambassadors ───────────────────────────────────────────────────
export async function getAmbassadorByUserId(userId: number) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(ambassadors).where(eq(ambassadors.userId, userId)).limit(1);
  return rows[0] || null;
}
export async function createAmbassador(userId: number, referralCode: string) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(ambassadors).values({ userId, referralCode, status: "pending", tier: "bronze" });
  return result[0].insertId;
}
export async function updateAmbassador(id: number, data: Partial<{ tier: "bronze" | "silver" | "gold" | "platinum"; totalReferrals: number; totalEarnings: string; pendingEarnings: string; status: "active" | "suspended" | "pending"; paypalEmail: string; iban: string }>) {
  const db = await getDb(); if (!db) return;
  await db.update(ambassadors).set(data).where(eq(ambassadors.id, id));
}
export async function getAllAmbassadors() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(ambassadors).orderBy(desc(ambassadors.totalEarnings));
}

// ─── Referrals ─────────────────────────────────────────────────────
export async function getReferralsByAmbassador(ambassadorId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(referrals).where(eq(referrals.ambassadorId, ambassadorId)).orderBy(desc(referrals.createdAt));
}
export async function createReferral(ambassadorId: number, referredUserId: number, referralCode: string) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(referrals).values({ ambassadorId, referredUserId, referralCode, status: "signed_up" });
  return result[0].insertId;
}

// ─── Commission Payments ───────────────────────────────────────────
export async function getCommissionPayments(recipientId?: number, recipientType?: string, limit = 50) {
  const db = await getDb(); if (!db) return [];
  if (recipientId && recipientType) {
    return db.select().from(commissionPayments).where(and(eq(commissionPayments.recipientId, recipientId), eq(commissionPayments.recipientType, recipientType as any))).orderBy(desc(commissionPayments.createdAt)).limit(limit);
  }
  return db.select().from(commissionPayments).orderBy(desc(commissionPayments.createdAt)).limit(limit);
}
export async function createCommissionPayment(data: { recipientType: "ambassador" | "partner" | "influencer" | "concierge"; recipientId: number; recipientName?: string; sourceType: "referral" | "booking" | "affiliation" | "subscription"; sourceId?: number; amount: string; currency?: string }) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(commissionPayments).values({ ...data, status: "pending" });
  return result[0].insertId;
}
export async function getAllCommissionStats() {
  const db = await getDb(); if (!db) return { totalPaid: 0, totalPending: 0, totalAmbassadors: 0, totalProviders: 0 };
  const [paid] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(10,2))), 0)` }).from(commissionPayments).where(eq(commissionPayments.status, "paid"));
  const [pending] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(10,2))), 0)` }).from(commissionPayments).where(eq(commissionPayments.status, "pending"));
  const [ambCount] = await db.select({ total: sql<number>`count(*)` }).from(ambassadors);
  const [provCount] = await db.select({ total: sql<number>`count(*)` }).from(serviceProviders);
  return { totalPaid: paid?.total || 0, totalPending: pending?.total || 0, totalAmbassadors: ambCount?.total || 0, totalProviders: provCount?.total || 0 };
}

// ─── Service Providers ─────────────────────────────────────────────
export async function getServiceProviders(status?: "active" | "pending" | "suspended" | "rejected", limit = 50) {
  const db = await getDb(); if (!db) return [];
  if (status) {
    return db.select().from(serviceProviders).where(eq(serviceProviders.status, status)).orderBy(desc(serviceProviders.createdAt)).limit(limit);
  }
  return db.select().from(serviceProviders).orderBy(desc(serviceProviders.createdAt)).limit(limit);
}
export async function createServiceProvider(data: { name: string; slug: string; category: "hotel" | "restaurant" | "yacht" | "chauffeur" | "spa" | "concierge_local" | "concierge_international" | "real_estate" | "luxury_goods" | "experience" | "transport"; contactName?: string; contactEmail?: string; contactPhone?: string; city?: string; country?: string; website?: string; description?: string; commissionRate?: string }) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(serviceProviders).values({ ...data, status: "pending" });
  return result[0].insertId;
}
export async function updateServiceProvider(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(serviceProviders).set({ ...data, updatedAt: new Date() }).where(eq(serviceProviders.id, id));
}

// ─── AI Directives ─────────────────────────────────────────────────
export async function getAiDirectives(department?: string) {
  const db = await getDb(); if (!db) return [];
  if (department) {
    return db.select().from(aiDirectives).where(and(eq(aiDirectives.department, department as any), eq(aiDirectives.status, "active"))).orderBy(desc(aiDirectives.priority));
  }
  return db.select().from(aiDirectives).where(eq(aiDirectives.status, "active")).orderBy(desc(aiDirectives.priority));
}
export async function createAiDirective(data: { department: "seo" | "content" | "acquisition" | "concierge" | "analytics" | "all"; directive: string; priority?: "low" | "normal" | "high" | "urgent"; authorId: number }) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(aiDirectives).values({ ...data, status: "active" });
  return result[0].insertId;
}
export async function updateAiDirective(id: number, data: { directive?: string; priority?: "low" | "normal" | "high" | "urgent"; status?: "active" | "completed" | "cancelled" | "expired"; aiResponse?: string; completedTasks?: number; totalTasks?: number }) {
  const db = await getDb(); if (!db) return;
  await db.update(aiDirectives).set(data).where(eq(aiDirectives.id, id));
}

// ─── AI Department Reports ─────────────────────────────────────────
export async function getAiDepartmentReports(department?: "seo" | "content" | "acquisition" | "concierge" | "analytics", limit = 20) {
  const db = await getDb(); if (!db) return [];
  if (department) {
    return db.select().from(aiDepartmentReports).where(eq(aiDepartmentReports.department, department)).orderBy(desc(aiDepartmentReports.createdAt)).limit(limit);
  }
  return db.select().from(aiDepartmentReports).orderBy(desc(aiDepartmentReports.createdAt)).limit(limit);
}
export async function createAiDepartmentReport(data: { department: "seo" | "content" | "acquisition" | "concierge" | "analytics"; reportDate: string; summary: string; metrics?: string; alerts?: string; status?: "healthy" | "attention" | "critical" }) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(aiDepartmentReports).values(data);
  return result[0].insertId;
}

// ─── Bundles ───────────────────────────────────────────────────────
export async function getPublishedBundles(limit = 20) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(bundles).where(eq(bundles.status, "published")).orderBy(desc(bundles.createdAt)).limit(limit);
}
export async function getAllBundles() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(bundles).orderBy(desc(bundles.createdAt));
}
export async function createBundle(data: any) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(bundles).values(data);
  return result[0].insertId;
}
export async function updateBundle(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(bundles).set({ ...data, updatedAt: new Date() }).where(eq(bundles.id, id));
}

// ─── Content Calendar ──────────────────────────────────────────────
export async function getContentCalendar(status?: "idea" | "generating" | "review" | "approved" | "scheduled" | "published" | "failed", limit = 50) {
  const db = await getDb(); if (!db) return [];
  if (status) {
    return db.select().from(contentCalendar).where(eq(contentCalendar.status, status)).orderBy(desc(contentCalendar.scheduledDate)).limit(limit);
  }
  return db.select().from(contentCalendar).orderBy(desc(contentCalendar.scheduledDate)).limit(limit);
}
export async function createContentCalendarItem(data: { title: string; contentType: "blog_article" | "instagram_post" | "instagram_reel" | "tiktok_video" | "linkedin_post" | "youtube_video" | "twitter_post"; platform: "instagram" | "tiktok" | "linkedin" | "twitter" | "youtube" | "blog"; topic?: string; brief?: string; generatedContent?: string; scheduledDate: string; scheduledTime?: string; status?: "idea" | "generating" | "review" | "approved" | "scheduled" | "published" | "failed" }) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(contentCalendar).values({ ...data, status: data.status || "idea" });
  return result[0].insertId;
}
export async function updateContentCalendarItem(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(contentCalendar).set({ ...data, updatedAt: new Date() }).where(eq(contentCalendar.id, id));
}


// ─── Establishment Comments ─────────────────────────────────────────
export async function getEstablishmentComments(establishmentId: number, limit = 20) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(establishmentComments)
    .where(and(eq(establishmentComments.establishmentId, establishmentId), eq(establishmentComments.status, "published")))
    .orderBy(desc(establishmentComments.helpfulCount), desc(establishmentComments.createdAt))
    .limit(limit);
}

export async function createEstablishmentComment(data: {
  establishmentId: number;
  authorName: string;
  authorAvatar?: string;
  authorCountry?: string;
  authorTravelStyle?: string;
  rating: number;
  title?: string;
  content: string;
  visitDate?: string;
  isAiGenerated?: boolean;
  isVerified?: boolean;
  language?: string;
}) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(establishmentComments).values({
    ...data,
    isAiGenerated: data.isAiGenerated ?? true,
    status: "published",
  });
  return result[0].insertId;
}

export async function incrementCommentHelpful(commentId: number) {
  const db = await getDb(); if (!db) return;
  await db.execute(sql`UPDATE establishmentComments SET helpfulCount = helpfulCount + 1 WHERE id = ${commentId}`);
}

export async function getEstablishmentCommentCount(establishmentId: number) {
  const db = await getDb(); if (!db) return 0;
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(establishmentComments)
    .where(and(eq(establishmentComments.establishmentId, establishmentId), eq(establishmentComments.status, "published")));
  return result[0]?.count || 0;
}

// ─── Field Reports (Rapports Terrain) ───────────────────────────────
export async function getFieldReportsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fieldReports).where(eq(fieldReports.userId, userId)).orderBy(desc(fieldReports.updatedAt));
}

export async function getAllFieldReports() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fieldReports).orderBy(desc(fieldReports.updatedAt));
}

export async function getFieldReportById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(fieldReports).where(eq(fieldReports.id, id));
  return rows[0] || null;
}

export async function createFieldReport(data: any): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(fieldReports).values(data);
  return result.insertId;
}

export async function updateFieldReport(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(fieldReports).set(data).where(eq(fieldReports.id, id));
}

// Services
export async function getFieldReportServices(reportId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fieldReportServices).where(eq(fieldReportServices.fieldReportId, reportId)).orderBy(fieldReportServices.sortOrder);
}

export async function addFieldReportService(data: any): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(fieldReportServices).values(data);
  return result.insertId;
}

export async function deleteFieldReportService(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(fieldReportServices).where(eq(fieldReportServices.id, id));
}

// Journey steps
export async function getFieldReportJourneySteps(reportId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fieldReportJourney).where(eq(fieldReportJourney.fieldReportId, reportId)).orderBy(fieldReportJourney.stepOrder);
}

export async function addFieldReportJourneyStep(data: any): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(fieldReportJourney).values(data);
  return result.insertId;
}

export async function deleteFieldReportJourneyStep(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(fieldReportJourney).where(eq(fieldReportJourney.id, id));
}

// Contacts
export async function getFieldReportContacts(reportId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fieldReportContacts).where(eq(fieldReportContacts.fieldReportId, reportId));
}

export async function addFieldReportContact(data: any): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(fieldReportContacts).values(data);
  return result.insertId;
}

export async function deleteFieldReportContact(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(fieldReportContacts).where(eq(fieldReportContacts.id, id));
}

// Media
export async function getFieldReportMediaItems(reportId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fieldReportMedia).where(eq(fieldReportMedia.fieldReportId, reportId)).orderBy(fieldReportMedia.sortOrder);
}

export async function addFieldReportMediaItem(data: any): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(fieldReportMedia).values(data);
  return result.insertId;
}

export async function deleteFieldReportMediaItem(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(fieldReportMedia).where(eq(fieldReportMedia.id, id));
}

// ─── Revenue & Analytics Stats ─────────────────────────────────────────────
export async function getRevenueStats() {
  const db = await getDb();
  if (!db) return {
    totalRevenue: 0, totalCosts: 0, netProfit: 0, margin: 0,
    subscriptionRevenue: 0, creditRevenue: 0, commissionRevenue: 0,
    aiCosts: 0, infraCosts: 0,
    newUsersThisMonth: 0, newUsersLastMonth: 0, userGrowthRate: 0,
    totalUsers: 0, premiumUsers: 0, eliteUsers: 0,
    monthlyData: [],
  };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Users stats
  const [userStats] = await db.select({
    total: sql<number>`count(*)`,
    premium: sql<number>`SUM(CASE WHEN subscriptionTier = 'premium' THEN 1 ELSE 0 END)`,
    elite: sql<number>`SUM(CASE WHEN subscriptionTier = 'elite' THEN 1 ELSE 0 END)`,
    newThisMonth: sql<number>`SUM(CASE WHEN createdAt >= ${startOfMonth.toISOString()} THEN 1 ELSE 0 END)`,
    newLastMonth: sql<number>`SUM(CASE WHEN createdAt >= ${startOfLastMonth.toISOString()} AND createdAt <= ${endOfLastMonth.toISOString()} THEN 1 ELSE 0 END)`,
  }).from(users);

  // Commission revenue
  const [commStats] = await db.select({
    total: sql<number>`COALESCE(SUM(amount), 0)`,
  }).from(commissionPayments);

  // Credit transactions revenue
  const [creditStats] = await db.select({
    total: sql<number>`COALESCE(SUM(CASE WHEN type = 'purchase' THEN amount ELSE 0 END), 0)`,
  }).from(creditTransactions);

  // Monthly data (last 6 months) — simulated based on real user growth
  const totalUsers = Number(userStats?.total || 0);
  const premiumUsers = Number(userStats?.premium || 0);
  const eliteUsers = Number(userStats?.elite || 0);
  const newThisMonth = Number(userStats?.newThisMonth || 0);
  const newLastMonth = Number(userStats?.newLastMonth || 0);

  // Revenue calculation based on subscriptions
  const subscriptionRevenue = (premiumUsers * 29.9) + (eliteUsers * 89.9);
  const creditRevenue = Number(creditStats?.total || 0);
  const commissionRevenue = Number(commStats?.total || 0);
  const totalRevenue = subscriptionRevenue + creditRevenue + commissionRevenue;

  // Cost estimation: ~0.02€ per AI message, ~50€/month infra
  const [msgStats] = await db.select({ total: sql<number>`count(*)` }).from(messages);
  const totalMessages = Number(msgStats?.total || 0);
  const aiCosts = totalMessages * 0.02;
  const infraCosts = 50;
  const totalCosts = aiCosts + infraCosts;
  const netProfit = totalRevenue - totalCosts;
  const margin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const userGrowthRate = newLastMonth > 0
    ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
    : newThisMonth > 0 ? 100 : 0;

  // Generate last 6 months data
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    // Simulate progressive growth
    const factor = (i + 1) / 6;
    return {
      month: label,
      revenue: Math.round(totalRevenue * factor * (0.8 + Math.random() * 0.4)),
      costs: Math.round(totalCosts * factor * (0.7 + Math.random() * 0.3)),
      users: Math.round(totalUsers * factor),
    };
  });

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCosts: Math.round(totalCosts * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    margin,
    subscriptionRevenue: Math.round(subscriptionRevenue * 100) / 100,
    creditRevenue: Math.round(creditRevenue * 100) / 100,
    commissionRevenue: Math.round(commissionRevenue * 100) / 100,
    aiCosts: Math.round(aiCosts * 100) / 100,
    infraCosts,
    newUsersThisMonth: newThisMonth,
    newUsersLastMonth: newLastMonth,
    userGrowthRate,
    totalUsers,
    premiumUsers,
    eliteUsers,
    monthlyData,
  };
}

// ─── Admin: gestion des utilisateurs ─────────────────────────────────────────
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    subscriptionTier: users.subscriptionTier,
    createdAt: users.createdAt,
  }).from(users).orderBy(users.createdAt);
}

export async function updateUserRoleById(userId: number, role: "user" | "team" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return { success: true };
}

// ─── LÉNA Workspace — Fiches SEO, Bundles, Parcours ─────────────────────────

export async function getAllSeoCardsAdmin() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(seoCards).orderBy(desc(seoCards.createdAt));
}

export async function createSeoCardFromLena(data: {
  slug: string; title: string; subtitle?: string;
  category: "restaurant" | "hotel" | "activity" | "bar" | "spa" | "guide" | "experience";
  city: string; country: string; region?: string;
  description: string; highlights?: string; practicalInfo?: string;
  metaTitle?: string; metaDescription?: string; tags?: string;
  rating?: string; imageUrl?: string; affiliateLinks?: string;
  fieldReportId?: number; sourceType?: string;
}) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(seoCards).values({
    ...data,
    status: "draft",
    generatedBy: "lena",
    lenaCreated: true,
    sourceType: (data.sourceType || "lena_generate") as any,
  });
  return result[0].insertId;
}

export async function updateSeoCardLenaDecision(id: number, data: {
  isVerified?: boolean; status?: "draft" | "published" | "archived"; fieldReportId?: number;
}) {
  const db = await getDb(); if (!db) return;
  await db.update(seoCards).set({ ...data, updatedAt: new Date() }).where(eq(seoCards.id, id));
}

export async function createBundleFromLena(data: {
  slug: string; title: string; subtitle?: string; description: string;
  category: "weekend" | "honeymoon" | "gastronomie" | "aventure" | "wellness" | "culture" | "business" | "family" | "seasonal";
  destination?: string; duration?: string; priceFrom?: string; priceTo?: string;
  includes?: string; establishmentIds?: string; seoCardIds?: string; fieldReportIds?: string;
  accessLevel?: "free" | "explorer" | "premium" | "elite";
  coverImageUrl?: string; sourceType?: string;
}) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(bundles).values({
    ...data,
    status: "draft",
    lenaCreated: true,
    sourceType: (data.sourceType || "lena_generate") as any,
    priceFrom: data.priceFrom as any,
    priceTo: data.priceTo as any,
  });
  return result[0].insertId;
}

export async function updateBundleLenaDecision(id: number, data: {
  isVerified?: boolean; status?: "draft" | "published" | "archived";
  seoCardIds?: string; fieldReportIds?: string;
}) {
  const db = await getDb(); if (!db) return;
  await db.update(bundles).set({ ...data, updatedAt: new Date() }).where(eq(bundles.id, id));
}

export async function getAllBundlesAdmin() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(bundles).orderBy(desc(bundles.createdAt));
}

// ─── Parcours (userDestinations) ─────────────────────────────────────────────

export async function createDestinationFromChat(userId: number, data: {
  title: string; description?: string; destination?: string; country?: string;
  tripType?: "leisure" | "business" | "romantic" | "family" | "staycation" | "adventure" | "wellness";
  budget?: "economique" | "confort" | "premium" | "luxe";
  duration?: number; steps?: string; highlights?: string; tips?: string;
  coverImageUrl?: string; tags?: string;
  sourceConversationId?: number; isLenaGenerated?: boolean; lenaSessionId?: string;
}) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(userDestinations).values({
    userId,
    ...data,
    visibility: "private",
    isLenaGenerated: data.isLenaGenerated ?? false,
    lenaDecision: "pending",
  });
  return result[0].insertId;
}

export async function getUserDestinations(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(userDestinations).where(eq(userDestinations.userId, userId)).orderBy(desc(userDestinations.createdAt));
}

export async function getDestinationById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(userDestinations).where(eq(userDestinations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteDestination(id: number, userId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(userDestinations).where(and(eq(userDestinations.id, id), eq(userDestinations.userId, userId)));
}

export async function updateDestinationLenaDecision(id: number, decision: {
  lenaDecision: "pending" | "keep" | "delete" | "convert_bundle" | "convert_seocard";
  lenaDecisionNotes?: string; isVerified?: boolean;
}) {
  const db = await getDb(); if (!db) return;
  await db.update(userDestinations).set({
    ...decision,
    lenaDecisionAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(userDestinations.id, id));
}

export async function getAllDestinationsAdmin(limit = 100) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(userDestinations).orderBy(desc(userDestinations.createdAt)).limit(limit);
}

export async function getDestinationSavesAdmin() {
  const db = await getDb(); if (!db) return [];
  return db.select({
    id: destinationSaves.id,
    userId: destinationSaves.userId,
    destinationId: destinationSaves.destinationId,
    createdAt: destinationSaves.createdAt,
  }).from(destinationSaves).orderBy(desc(destinationSaves.createdAt));
}

export async function saveDestination(userId: number, destinationId: number) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  // Check if already saved
  const existing = await db.select().from(destinationSaves)
    .where(and(eq(destinationSaves.userId, userId), eq(destinationSaves.destinationId, destinationId))).limit(1);
  if (existing.length > 0) return existing[0].id;
  const result = await db.insert(destinationSaves).values({ userId, destinationId });
  // Increment saveCount
  await db.update(userDestinations).set({ saveCount: sql`${userDestinations.saveCount} + 1` }).where(eq(userDestinations.id, destinationId));
  return result[0].insertId;
}

export async function unsaveDestination(userId: number, destinationId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(destinationSaves).where(and(eq(destinationSaves.userId, userId), eq(destinationSaves.destinationId, destinationId)));
  await db.update(userDestinations).set({ saveCount: sql`GREATEST(${userDestinations.saveCount} - 1, 0)` }).where(eq(userDestinations.id, destinationId));
}

export async function getUserSavedDestinations(userId: number) {
  const db = await getDb(); if (!db) return [];
  const saves = await db.select().from(destinationSaves).where(eq(destinationSaves.userId, userId));
  if (saves.length === 0) return [];
  const ids = saves.map(s => s.destinationId);
  return db.select().from(userDestinations).where(inArray(userDestinations.id, ids)).orderBy(desc(userDestinations.createdAt));
}

export async function getLenaCreatedContent() {
  const db = await getDb(); if (!db) return { fiches: [], bundles: [], parcours: [] };
  const [fiches, bundlesData, parcours] = await Promise.all([
    db.select().from(seoCards).where(eq(seoCards.lenaCreated, true)).orderBy(desc(seoCards.createdAt)),
    db.select().from(bundles).where(eq(bundles.lenaCreated, true)).orderBy(desc(bundles.createdAt)),
    db.select().from(userDestinations).where(eq(userDestinations.isLenaGenerated, true)).orderBy(desc(userDestinations.createdAt)),
  ]);
  return { fiches, bundles: bundlesData, parcours };
}

// ─── Client Profiles & Companions ────────────────────────────────────────────

export async function getClientProfile(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(clientProfiles).where(eq(clientProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertClientProfile(userId: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const existing = await db.select().from(clientProfiles).where(eq(clientProfiles.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(clientProfiles).set({ ...data, updatedAt: new Date() }).where(eq(clientProfiles.userId, userId));
  } else {
    await db.insert(clientProfiles).values({ userId, ...data });
  }
}

export async function getCompanions(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(companions).where(and(eq(companions.userId, userId), eq(companions.isActive, true)));
}

export async function createCompanion(userId: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const result = await db.insert(companions).values({ userId, ...data });
  return result[0].insertId;
}

export async function updateCompanion(id: number, userId: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.update(companions).set({ ...data, updatedAt: new Date() }).where(and(eq(companions.id, id), eq(companions.userId, userId)));
}

export async function deleteCompanion(id: number, userId: number) {
  const db = await getDb(); if (!db) return;
  await db.update(companions).set({ isActive: false, updatedAt: new Date() }).where(and(eq(companions.id, id), eq(companions.userId, userId)));
}

// ─── Pilotage Messages ────────────────────────────────────────────────────────

export async function getPilotageMessages(limit = 100) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(pilotageMessages).orderBy(asc(pilotageMessages.createdAt)).limit(limit);
}

export async function addPilotageMessage(data: {
  role: "user" | "assistant" | "system";
  content: string;
  actionType?: "chat" | "order_team" | "modify_app" | "analyze" | "report" | "alert";
  targetDepartment?: string;
  metadata?: string;
}) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.insert(pilotageMessages).values({
    role: data.role,
    content: data.content,
    actionType: data.actionType || "chat",
    targetDepartment: data.targetDepartment,
    metadata: data.metadata,
  });
}
