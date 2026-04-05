import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, decimal, bigint } from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "premium"]).default("free").notNull(),
  credits: int("credits").default(3).notNull(),
  creditsRollover: int("creditsRollover").default(0).notNull(),
  freeMessagesUsed: int("freeMessagesUsed").default(0).notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── User Preferences (Mémoire Client) ──────────────────────────────
export const userPreferences = mysqlTable("userPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: varchar("category", { length: 64 }).notNull(), // dietary, travel_style, budget, accommodation, etc.
  key: varchar("key", { length: 128 }).notNull(),
  value: text("value").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.80"),
  source: mysqlEnum("source", ["explicit", "inferred", "conversation"]).default("conversation").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Travel Companions ──────────────────────────────────────────────
export const travelCompanions = mysqlTable("travelCompanions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  relationship: varchar("relationship", { length: 64 }),
  dietaryRestrictions: text("dietaryRestrictions"),
  preferences: text("preferences"),
  birthDate: varchar("birthDate", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Conversations ──────────────────────────────────────────────────
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 256 }).default("Nouvelle conversation"),
  status: mysqlEnum("status", ["active", "archived", "closed"]).default("active").notNull(),
  context: text("context"), // JSON summary for LLM context window
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Messages ───────────────────────────────────────────────────────
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON: agent used, tokens, cost, etc.
  isVoice: boolean("isVoice").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── SEO Cards (Fiches Locales) ─────────────────────────────────────
export const seoCards = mysqlTable("seoCards", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  title: varchar("title", { length: 256 }).notNull(),
  subtitle: varchar("subtitle", { length: 256 }),
  category: mysqlEnum("category", ["restaurant", "hotel", "activity", "bar", "spa", "guide", "experience"]).notNull(),
  city: varchar("city", { length: 128 }).notNull(),
  country: varchar("country", { length: 128 }).notNull(),
  region: varchar("region", { length: 128 }),
  description: text("description").notNull(), // Rich markdown content
  highlights: text("highlights"), // JSON array of key highlights
  practicalInfo: text("practicalInfo"), // JSON: address, phone, hours, price range
  schemaOrg: text("schemaOrg"), // JSON-LD structured data
  metaTitle: varchar("metaTitle", { length: 160 }),
  metaDescription: varchar("metaDescription", { length: 320 }),
  imageUrl: text("imageUrl"),
  imageAlt: varchar("imageAlt", { length: 256 }),
  galleryUrls: text("galleryUrls"), // JSON array of image URLs
  affiliateLinks: text("affiliateLinks"), // JSON: { booking: url, thefork: url, ... }
  rating: decimal("rating", { precision: 2, scale: 1 }),
  priceLevel: mysqlEnum("priceLevel", ["budget", "moderate", "upscale", "luxury"]).default("upscale"),
  tags: text("tags"), // JSON array of tags
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  viewCount: int("viewCount").default(0),
  generatedBy: mysqlEnum("generatedBy", ["ai", "manual"]).default("ai").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Affiliate Partners ─────────────────────────────────────────────
export const affiliatePartners = mysqlTable("affiliatePartners", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  category: varchar("category", { length: 64 }).notNull(), // booking, restaurant, activity, flight
  apiEndpoint: text("apiEndpoint"),
  apiKey: text("apiKey"),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).notNull(), // percentage
  trackingParam: varchar("trackingParam", { length: 64 }).default("ref"),
  baseUrl: text("baseUrl"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Affiliate Clicks ───────────────────────────────────────────────
export const affiliateClicks = mysqlTable("affiliateClicks", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  seoCardId: int("seoCardId"),
  userId: int("userId"),
  clickedUrl: text("clickedUrl").notNull(),
  referrer: text("referrer"),
  userAgent: text("userAgent"),
  ipHash: varchar("ipHash", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Affiliate Conversions ──────────────────────────────────────────
export const affiliateConversions = mysqlTable("affiliateConversions", {
  id: int("id").autoincrement().primaryKey(),
  clickId: int("clickId").notNull(),
  partnerId: int("partnerId").notNull(),
  userId: int("userId"),
  orderValue: decimal("orderValue", { precision: 10, scale: 2 }),
  commission: decimal("commission", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  status: mysqlEnum("status", ["pending", "confirmed", "paid", "rejected"]).default("pending").notNull(),
  externalOrderId: varchar("externalOrderId", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  confirmedAt: timestamp("confirmedAt"),
});

// ─── Credit Transactions ────────────────────────────────────────────
export const creditTransactions = mysqlTable("creditTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(), // positive = credit, negative = debit
  type: mysqlEnum("type", ["subscription", "recharge", "usage", "rollover", "bonus", "refund"]).notNull(),
  description: text("description"),
  balanceAfter: int("balanceAfter").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Agent Tasks (Multi-Agent Event Bus) ────────────────────────────
export const agentTasks = mysqlTable("agentTasks", {
  id: int("id").autoincrement().primaryKey(),
  department: mysqlEnum("department", ["acquisition", "concierge", "logistics", "quality"]).notNull(),
  agentType: varchar("agentType", { length: 64 }).notNull(), // seo_writer, trend_spotter, social_media, profiler, etc.
  taskType: varchar("taskType", { length: 64 }).notNull(),
  input: text("input"), // JSON input payload
  output: text("output"), // JSON output result
  status: mysqlEnum("status", ["queued", "processing", "completed", "failed", "cancelled"]).default("queued").notNull(),
  priority: int("priority").default(5),
  retryCount: int("retryCount").default(0),
  maxRetries: int("maxRetries").default(3),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Social Media Posts ─────────────────────────────────────────────
export const socialMediaPosts = mysqlTable("socialMediaPosts", {
  id: int("id").autoincrement().primaryKey(),
  seoCardId: int("seoCardId"),
  platform: mysqlEnum("platform", ["instagram", "tiktok", "linkedin", "twitter"]).notNull(),
  contentType: mysqlEnum("contentType", ["carousel", "reel", "story", "post", "script"]).notNull(),
  title: varchar("title", { length: 256 }),
  content: text("content").notNull(), // The actual post content / script
  hashtags: text("hashtags"), // JSON array
  mediaUrls: text("mediaUrls"), // JSON array of media URLs
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  status: mysqlEnum("status", ["draft", "scheduled", "published", "failed"]).default("draft").notNull(),
  engagement: text("engagement"), // JSON: likes, comments, shares, views
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Travel Itineraries (Dossier Voyage) ────────────────────────────
export const travelItineraries = mysqlTable("travelItineraries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conversationId: int("conversationId"),
  title: varchar("title", { length: 256 }).notNull(),
  destination: varchar("destination", { length: 256 }),
  startDate: varchar("startDate", { length: 10 }),
  endDate: varchar("endDate", { length: 10 }),
  travelers: int("travelers").default(1),
  budget: varchar("budget", { length: 64 }),
  status: mysqlEnum("status", ["planning", "confirmed", "completed", "cancelled"]).default("planning").notNull(),
  itineraryData: text("itineraryData"), // JSON: full structured itinerary
  affiliateLinksUsed: text("affiliateLinksUsed"), // JSON array of affiliate links included
  totalEstimatedCost: decimal("totalEstimatedCost", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
