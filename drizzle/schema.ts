import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, decimal, bigint, float } from "drizzle-orm/mysql-core";

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
  // Enriched profile
  phone: varchar("phone", { length: 32 }),
  avatarUrl: text("avatarUrl"),
  language: varchar("language", { length: 8 }).default("fr"),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  homeCity: varchar("homeCity", { length: 128 }),
  homeCountry: varchar("homeCountry", { length: 128 }),
  homeAddress: text("homeAddress"),
  homeLat: float("homeLat"),
  homeLng: float("homeLng"),
  budgetPreference: mysqlEnum("budgetPreference", ["economy", "moderate", "premium", "ultra_premium"]).default("moderate"),
  travelStyle: mysqlEnum("travelStyle", ["adventure", "relaxation", "cultural", "business", "romantic", "family"]).default("cultural"),
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
  category: varchar("category", { length: 64 }).notNull(),
  key: varchar("key", { length: 128 }).notNull(),
  value: text("value").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.80"),
  source: mysqlEnum("source", ["explicit", "inferred", "conversation"]).default("conversation").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Travel Companions (Cercle Proche) ──────────────────────────────
export const travelCompanions = mysqlTable("travelCompanions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  relationship: varchar("relationship", { length: 64 }),
  dietaryRestrictions: text("dietaryRestrictions"),
  preferences: text("preferences"),
  allergies: text("allergies"),
  birthDate: varchar("birthDate", { length: 10 }),
  passportCountry: varchar("passportCountry", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Conversations ──────────────────────────────────────────────────
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 256 }).default("Nouvelle conversation"),
  tripType: mysqlEnum("tripType", ["leisure", "business", "romantic", "family", "staycation", "adventure", "wellness"]),
  status: mysqlEnum("status", ["active", "archived", "closed"]).default("active").notNull(),
  context: text("context"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Messages ───────────────────────────────────────────────────────
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"),
  isVoice: boolean("isVoice").default(false),
  // Rich content: the assistant can attach structured data (trip plans, cards, maps)
  attachmentType: mysqlEnum("attachmentType", ["none", "trip_plan", "establishment", "map_route", "offer"]).default("none"),
  attachmentData: text("attachmentData"), // JSON structured data for rich widgets
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Establishments (Fiches Établissements Premium) ─────────────────
export const establishments = mysqlTable("establishments", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  subtitle: varchar("subtitle", { length: 256 }),
  category: mysqlEnum("category", [
    "restaurant", "hotel", "bar", "spa", "museum", "park", "beach",
    "nightclub", "shopping", "transport", "activity", "experience", "wellness"
  ]).notNull(),
  subcategory: varchar("subcategory", { length: 128 }),
  // Location
  city: varchar("city", { length: 128 }).notNull(),
  country: varchar("country", { length: 128 }).notNull(),
  region: varchar("region", { length: 128 }),
  address: text("address"),
  lat: float("lat"),
  lng: float("lng"),
  // Content
  heroImageUrl: text("heroImageUrl"),
  description: text("description").notNull(),
  shortDescription: varchar("shortDescription", { length: 500 }),
  anecdotes: text("anecdotes"), // JSON array of fun facts / secrets
  thingsToKnow: text("thingsToKnow"), // JSON array of insider tips
  highlights: text("highlights"), // JSON array of key highlights
  // Practical
  phone: varchar("phone", { length: 32 }),
  website: text("website"),
  openingHours: text("openingHours"), // JSON { mon: "12:00-23:00", ... }
  priceRange: varchar("priceRange", { length: 64 }),
  priceLevel: mysqlEnum("priceLevel", ["budget", "moderate", "upscale", "luxury"]).default("upscale"),
  cuisineType: varchar("cuisineType", { length: 128 }),
  dressCode: varchar("dressCode", { length: 128 }),
  // SEO
  metaTitle: varchar("metaTitle", { length: 160 }),
  metaDescription: varchar("metaDescription", { length: 320 }),
  schemaOrg: text("schemaOrg"),
  tags: text("tags"),
  // Social proof
  rating: decimal("rating", { precision: 2, scale: 1 }),
  reviewCount: int("reviewCount").default(0),
  reviews: text("reviews"), // JSON array of curated reviews
  viralVideos: text("viralVideos"), // JSON array of { platform, url, title, thumbnail }
  // Affiliation
  affiliateLinks: text("affiliateLinks"), // JSON { booking: url, thefork: url, ... }
  // Status
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  viewCount: int("viewCount").default(0),
  generatedBy: mysqlEnum("generatedBy", ["ai", "manual"]).default("ai").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Establishment Media (Photos, Vidéos) ───────────────────────────
export const establishmentMedia = mysqlTable("establishmentMedia", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  type: mysqlEnum("type", ["photo", "video", "tiktok", "instagram_reel"]).notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  caption: varchar("caption", { length: 256 }),
  alt: varchar("alt", { length: 256 }),
  source: varchar("source", { length: 128 }), // unsplash, pexels, tiktok, instagram, user
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Trip Plans (Plans de Voyage Complets) ──────────────────────────
export const tripPlans = mysqlTable("tripPlans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conversationId: int("conversationId"),
  title: varchar("title", { length: 256 }).notNull(),
  tripType: mysqlEnum("tripType", ["leisure", "business", "romantic", "family", "staycation", "adventure", "wellness"]).notNull(),
  budgetLevel: mysqlEnum("budgetLevel", ["economy", "moderate", "premium", "ultra_premium"]).notNull(),
  // Destination
  originCity: varchar("originCity", { length: 128 }),
  originCountry: varchar("originCountry", { length: 128 }),
  originLat: float("originLat"),
  originLng: float("originLng"),
  destinationCity: varchar("destinationCity", { length: 128 }).notNull(),
  destinationCountry: varchar("destinationCountry", { length: 128 }).notNull(),
  destinationLat: float("destinationLat"),
  destinationLng: float("destinationLng"),
  // Dates
  startDate: varchar("startDate", { length: 10 }).notNull(),
  endDate: varchar("endDate", { length: 10 }).notNull(),
  travelers: int("travelers").default(1),
  companionIds: text("companionIds"), // JSON array of travelCompanion IDs
  // Costs
  estimatedTotal: decimal("estimatedTotal", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  // Transport
  outboundTransport: text("outboundTransport"), // JSON { type: "flight", details: {...}, affiliateLink: "..." }
  returnTransport: text("returnTransport"),
  // Status
  status: mysqlEnum("status", ["draft", "proposed", "accepted", "confirmed", "completed", "cancelled"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Trip Days (Jours de Voyage) ────────────────────────────────────
export const tripDays = mysqlTable("tripDays", {
  id: int("id").autoincrement().primaryKey(),
  tripPlanId: int("tripPlanId").notNull(),
  dayNumber: int("dayNumber").notNull(), // 1, 2, 3...
  date: varchar("date", { length: 10 }).notNull(),
  title: varchar("title", { length: 256 }),
  summary: text("summary"),
  weatherForecast: text("weatherForecast"), // JSON
  centerLat: float("centerLat"),
  centerLng: float("centerLng"),
  zoomLevel: int("zoomLevel").default(13),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Trip Steps (Étapes Individuelles avec Géolocalisation) ─────────
export const tripSteps = mysqlTable("tripSteps", {
  id: int("id").autoincrement().primaryKey(),
  tripDayId: int("tripDayId").notNull(),
  stepOrder: int("stepOrder").notNull(), // 1, 2, 3...
  // What
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  stepType: mysqlEnum("stepType", [
    "transport_departure", "flight", "checkin", "meal", "activity",
    "sightseeing", "shopping", "relaxation", "meeting", "transfer",
    "checkout", "transport_return", "free_time", "walk"
  ]).notNull(),
  // Where
  establishmentId: int("establishmentId"), // Link to establishment if applicable
  locationName: varchar("locationName", { length: 256 }),
  address: text("address"),
  lat: float("lat"),
  lng: float("lng"),
  // When
  startTime: varchar("startTime", { length: 5 }), // "09:00"
  endTime: varchar("endTime", { length: 5 }),
  durationMinutes: int("durationMinutes"),
  // Transport to this step
  transportMode: mysqlEnum("transportMode", [
    "walk", "car", "taxi", "uber", "chauffeur", "bus", "metro",
    "train", "flight", "boat", "bike", "scooter"
  ]),
  transportDurationMinutes: int("transportDurationMinutes"),
  transportDistanceKm: decimal("transportDistanceKm", { precision: 8, scale: 2 }),
  transportNotes: text("transportNotes"), // parking info, which exit, etc.
  // Cost
  estimatedCost: decimal("estimatedCost", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  affiliateLink: text("affiliateLink"),
  // Extras
  tips: text("tips"), // JSON array of pro tips
  photoUrl: text("photoUrl"),
  confirmed: boolean("confirmed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── SEO Cards (Fiches Locales - legacy, kept for feed) ─────────────
export const seoCards = mysqlTable("seoCards", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  title: varchar("title", { length: 256 }).notNull(),
  subtitle: varchar("subtitle", { length: 256 }),
  category: mysqlEnum("category", ["restaurant", "hotel", "activity", "bar", "spa", "guide", "experience"]).notNull(),
  city: varchar("city", { length: 128 }).notNull(),
  country: varchar("country", { length: 128 }).notNull(),
  region: varchar("region", { length: 128 }),
  description: text("description").notNull(),
  highlights: text("highlights"),
  practicalInfo: text("practicalInfo"),
  schemaOrg: text("schemaOrg"),
  metaTitle: varchar("metaTitle", { length: 160 }),
  metaDescription: varchar("metaDescription", { length: 320 }),
  imageUrl: text("imageUrl"),
  imageAlt: varchar("imageAlt", { length: 256 }),
  galleryUrls: text("galleryUrls"),
  affiliateLinks: text("affiliateLinks"),
  rating: decimal("rating", { precision: 2, scale: 1 }),
  priceLevel: mysqlEnum("priceLevel", ["budget", "moderate", "upscale", "luxury"]).default("upscale"),
  tags: text("tags"),
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
  category: varchar("category", { length: 64 }).notNull(),
  apiEndpoint: text("apiEndpoint"),
  apiKey: text("apiKey"),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).notNull(),
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
  establishmentId: int("establishmentId"),
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
  amount: int("amount").notNull(),
  type: mysqlEnum("type", ["subscription", "recharge", "usage", "rollover", "bonus", "refund"]).notNull(),
  description: text("description"),
  balanceAfter: int("balanceAfter").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Agent Tasks (Multi-Agent Event Bus) ────────────────────────────
export const agentTasks = mysqlTable("agentTasks", {
  id: int("id").autoincrement().primaryKey(),
  department: mysqlEnum("department", ["acquisition", "concierge", "logistics", "quality"]).notNull(),
  agentType: varchar("agentType", { length: 64 }).notNull(),
  taskType: varchar("taskType", { length: 64 }).notNull(),
  input: text("input"),
  output: text("output"),
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
  establishmentId: int("establishmentId"),
  platform: mysqlEnum("platform", ["instagram", "tiktok", "linkedin", "twitter"]).notNull(),
  contentType: mysqlEnum("contentType", ["carousel", "reel", "story", "post", "script"]).notNull(),
  title: varchar("title", { length: 256 }),
  content: text("content").notNull(),
  hashtags: text("hashtags"),
  mediaUrls: text("mediaUrls"),
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  status: mysqlEnum("status", ["draft", "scheduled", "published", "failed"]).default("draft").notNull(),
  engagement: text("engagement"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Travel Itineraries (Legacy - kept for backward compat) ─────────
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
  itineraryData: text("itineraryData"),
  affiliateLinksUsed: text("affiliateLinksUsed"),
  totalEstimatedCost: decimal("totalEstimatedCost", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
