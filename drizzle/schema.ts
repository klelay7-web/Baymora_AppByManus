import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, decimal, bigint, float } from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "team"]).default("user").notNull(),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "explorer", "premium", "elite"]).default("free").notNull(),
  credits: int("credits").default(15).notNull(),
  creditsRollover: int("creditsRollover").default(0).notNull(),
  points: int("points").default(0).notNull(),
  pointsLifetime: int("pointsLifetime").default(0).notNull(),
  featureVipExpiry: timestamp("featureVipExpiry"),
  featureConciergeExpiry: timestamp("featureConciergeExpiry"),
  featureOffMarketExpiry: timestamp("featureOffMarketExpiry"),
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
  category: mysqlEnum("category", [
    "restaurant", "hotel", "activity", "bar", "spa", "guide", "experience",
    "transport", "cityGuide", "rooftop", "vip", "event", "boutique", "airport",
    "spa_wellness", "park_garden", "beach", "viewpoint", "secret_spot",
    "nightlife", "shopping_luxury", "concierge", "villa", "private_jet"
  ]).notNull(),
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
  viralVideos: text("viralVideos"), // JSON: [{platform:'tiktok'|'instagram'|'youtube', url, title, views, thumbnail, embedId}]
  affiliateLinks: text("affiliateLinks"),
  rating: decimal("rating", { precision: 2, scale: 1 }),
  priceLevel: mysqlEnum("priceLevel", ["budget", "moderate", "upscale", "luxury"]).default("upscale"),
  tags: text("tags"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  viewCount: int("viewCount").default(0),
  generatedBy: mysqlEnum("generatedBy", ["ai", "manual", "lena"]).default("ai").notNull(),
  // LÉNA enrichment
  isVerified: boolean("isVerified").default(false).notNull(),
  lenaCreated: boolean("lenaCreated").default(false).notNull(),
  fieldReportId: int("fieldReportId"), // linked field report
  sourceType: mysqlEnum("sourceType", ["manual", "lena_chat", "lena_generate", "field_report", "ai_auto"]).default("manual"),
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
  affiliateId: varchar("affiliateId", { length: 256 }),
  signupUrl: text("signupUrl"),
  status: mysqlEnum("status", ["pending", "active", "rejected"]).default("pending").notNull(),
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

// ─── Favorites (Favoris Utilisateur) ───────────────────────────────
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targetType: mysqlEnum("targetType", ["establishment", "seoCard", "tripPlan", "bundle"]).notNull(),
  targetId: int("targetId").notNull(),
  collectionId: int("collectionId"), // optional grouping
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Collections (Groupes de Favoris) ──────────────────────────────
export const collections = mysqlTable("collections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  coverImageUrl: text("coverImageUrl"),
  isPublic: boolean("isPublic").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Ambassador Program (Programme Ambassadeur) ────────────────────
export const ambassadors = mysqlTable("ambassadors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  referralCode: varchar("referralCode", { length: 32 }).notNull().unique(),
  tier: mysqlEnum("tier", ["bronze", "silver", "gold", "platinum"]).default("bronze").notNull(),
  totalReferrals: int("totalReferrals").default(0),
  activeReferrals: int("activeReferrals").default(0),
  totalEarnings: decimal("totalEarnings", { precision: 10, scale: 2 }).default("0.00"),
  pendingEarnings: decimal("pendingEarnings", { precision: 10, scale: 2 }).default("0.00"),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).default("10.00"), // %
  paypalEmail: varchar("paypalEmail", { length: 320 }),
  iban: varchar("iban", { length: 64 }),
  status: mysqlEnum("status", ["active", "suspended", "pending"]).default("pending").notNull(),
  activatedAt: timestamp("activatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Referrals (Parrainages) ───────────────────────────────────────
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  ambassadorId: int("ambassadorId").notNull(),
  referredUserId: int("referredUserId").notNull(),
  referralCode: varchar("referralCode", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["signed_up", "subscribed", "churned"]).default("signed_up").notNull(),
  subscriptionTier: varchar("subscriptionTier", { length: 32 }),
  commissionEarned: decimal("commissionEarned", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  convertedAt: timestamp("convertedAt"),
});

// ─── Commission Payments (Paiements de Commissions) ────────────────
export const commissionPayments = mysqlTable("commissionPayments", {
  id: int("id").autoincrement().primaryKey(),
  recipientType: mysqlEnum("recipientType", ["ambassador", "partner", "influencer", "concierge"]).notNull(),
  recipientId: int("recipientId").notNull(),
  recipientName: varchar("recipientName", { length: 256 }),
  sourceType: mysqlEnum("sourceType", ["referral", "booking", "affiliation", "subscription"]).notNull(),
  sourceId: int("sourceId"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  status: mysqlEnum("status", ["pending", "processing", "paid", "failed", "cancelled"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 64 }),
  transactionRef: varchar("transactionRef", { length: 256 }),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Service Providers (Prestataires Enrichis) ─────────────────────
export const serviceProviders = mysqlTable("serviceProviders", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  category: mysqlEnum("category", [
    "hotel", "restaurant", "yacht", "chauffeur", "spa", "concierge_local",
    "concierge_international", "real_estate", "luxury_goods", "experience", "transport"
  ]).notNull(),
  contactName: varchar("contactName", { length: 256 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 32 }),
  city: varchar("city", { length: 128 }),
  country: varchar("country", { length: 128 }),
  website: text("website"),
  logoUrl: text("logoUrl"),
  description: text("description"),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).default("10.00"),
  contractType: mysqlEnum("contractType", ["standard", "premium", "exclusive"]).default("standard"),
  contractExpiry: varchar("contractExpiry", { length: 10 }),
  totalReservations: int("totalReservations").default(0),
  totalRevenue: decimal("totalRevenue", { precision: 10, scale: 2 }).default("0.00"),
  rating: decimal("rating", { precision: 2, scale: 1 }),
  linkedEstablishments: int("linkedEstablishments").default(0),
  status: mysqlEnum("status", ["active", "pending", "suspended", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── AI Directives (Directives pour les Départements IA) ───────────
export const aiDirectives = mysqlTable("aiDirectives", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(), // admin who issued the directive
  department: mysqlEnum("department", ["seo", "content", "acquisition", "concierge", "analytics", "all"]).notNull(),
  directive: text("directive").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  status: mysqlEnum("status", ["active", "completed", "cancelled", "expired"]).default("active").notNull(),
  completedTasks: int("completedTasks").default(0),
  totalTasks: int("totalTasks").default(0),
  aiResponse: text("aiResponse"), // AI's acknowledgment / execution plan
  completedAt: timestamp("completedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── AI Department Reports (Compte-Rendus Quotidiens IA) ───────────
export const aiDepartmentReports = mysqlTable("aiDepartmentReports", {
  id: int("id").autoincrement().primaryKey(),
  department: mysqlEnum("department", ["seo", "content", "acquisition", "concierge", "analytics"]).notNull(),
  reportDate: varchar("reportDate", { length: 10 }).notNull(), // "2026-04-05"
  summary: text("summary").notNull(),
  metrics: text("metrics"), // JSON { tasksCompleted, errors, kpis... }
  alerts: text("alerts"), // JSON array of alerts
  status: mysqlEnum("status", ["healthy", "attention", "critical"]).default("healthy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Bundles (Collections Curatées) ────────────────────────────────
export const bundles = mysqlTable("bundles", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  title: varchar("title", { length: 256 }).notNull(),
  subtitle: varchar("subtitle", { length: 256 }),
  description: text("description").notNull(),
  coverImageUrl: text("coverImageUrl"),
  category: mysqlEnum("category", ["weekend", "honeymoon", "gastronomie", "aventure", "wellness", "culture", "business", "family", "seasonal"]).notNull(),
  destination: varchar("destination", { length: 256 }),
  duration: varchar("duration", { length: 64 }), // "3 jours / 2 nuits"
  priceFrom: decimal("priceFrom", { precision: 10, scale: 2 }),
  priceTo: decimal("priceTo", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  includes: text("includes"), // JSON array of what's included
  establishmentIds: text("establishmentIds"), // JSON array of linked establishment IDs
  accessLevel: mysqlEnum("accessLevel", ["free", "explorer", "premium", "elite"]).default("explorer").notNull(),
  isVip: boolean("isVip").default(false),
  isFeatured: boolean("isFeatured").default(false),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  viewCount: int("viewCount").default(0),
  bookingCount: int("bookingCount").default(0),
  // Budget cible (pour pipeline SEO→Bundle→Parcours)
  budgetTarget: mysqlEnum("budgetTarget", ["budget", "moderate", "premium", "luxury"]).default("moderate"),
  cityFocus: varchar("cityFocus", { length: 128 }), // ville principale du bundle
  seoCardCount: int("seoCardCount").default(0), // nombre de fiches SEO liées
  // LÉNA enrichment
  isVerified: boolean("isVerified").default(false).notNull(),
  lenaCreated: boolean("lenaCreated").default(false).notNull(),
  seoCardIds: text("seoCardIds"), // JSON array of linked seoCard IDs
  fieldReportIds: text("fieldReportIds"), // JSON array of linked field report IDs
  sourceType: mysqlEnum("sourceType", ["manual", "lena_chat", "lena_generate", "field_report", "ai_auto"]).default("manual"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Content Calendar (Calendrier Éditorial) ───────────────────────
export const contentCalendar = mysqlTable("contentCalendar", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  contentType: mysqlEnum("contentType", ["blog_article", "instagram_post", "instagram_reel", "tiktok_video", "linkedin_post", "youtube_video", "twitter_post"]).notNull(),
  topic: text("topic"),
  brief: text("brief"),
  generatedContent: text("generatedContent"),
  generatedMediaUrls: text("generatedMediaUrls"), // JSON array
  scheduledDate: varchar("scheduledDate", { length: 10 }).notNull(),
  scheduledTime: varchar("scheduledTime", { length: 5 }),
  platform: mysqlEnum("platform", ["instagram", "tiktok", "linkedin", "twitter", "youtube", "blog"]).notNull(),
  status: mysqlEnum("status", ["idea", "generating", "review", "approved", "scheduled", "published", "failed"]).default("idea").notNull(),
  performance: text("performance"), // JSON { impressions, likes, shares, comments }
  // Blog SEO (article complet, ne révèle pas le payant)
  blogContent: text("blogContent"), // HTML/Markdown de l'article complet
  blogSeoCity: varchar("blogSeoCity", { length: 128 }), // ville cible de l'article
  blogKeywords: text("blogKeywords"), // JSON array de mots-clés cibles
  blogSlug: varchar("blogSlug", { length: 256 }), // slug URL de l'article
  linkedSeoCardIds: text("linkedSeoCardIds"), // JSON array de fiches SEO liées
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Establishment Comments (Commentaires IA Engagement) ──────────
export const establishmentComments = mysqlTable("establishmentComments", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  // Persona IA
  authorName: varchar("authorName", { length: 128 }).notNull(),
  authorAvatar: varchar("authorAvatar", { length: 16 }), // emoji avatar
  authorCountry: varchar("authorCountry", { length: 64 }),
  authorTravelStyle: varchar("authorTravelStyle", { length: 64 }), // "couple", "solo", "famille", "business"
  // Content
  rating: int("rating").notNull(), // 1-5
  title: varchar("title", { length: 256 }),
  content: text("content").notNull(),
  visitDate: varchar("visitDate", { length: 32 }), // "Mars 2026", "Décembre 2025"
  // Engagement
  helpfulCount: int("helpfulCount").default(0),
  replyCount: int("replyCount").default(0),
  // Metadata
  isAiGenerated: boolean("isAiGenerated").default(true),
  isVerified: boolean("isVerified").default(false),
  language: varchar("language", { length: 8 }).default("fr"),
  status: mysqlEnum("status", ["published", "hidden", "flagged"]).default("published").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Field Reports (Rapports Terrain — Membres Équipe) ──────────────
export const fieldReports = mysqlTable("fieldReports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // team member who created it
  // Establishment info
  establishmentName: varchar("establishmentName", { length: 256 }).notNull(),
  establishmentType: mysqlEnum("establishmentType", [
    "clinique", "hotel", "restaurant", "spa", "bar", "activite", "experience", "transport", "autre"
  ]).notNull(),
  specialty: varchar("specialty", { length: 256 }), // e.g. "chirurgie esthétique", "dentaire"
  // Location
  city: varchar("city", { length: 128 }).notNull(),
  country: varchar("country", { length: 128 }).notNull(),
  region: varchar("region", { length: 128 }),
  address: text("address"),
  lat: float("lat"),
  lng: float("lng"),
  googleMapsUrl: text("googleMapsUrl"),
  // Description
  description: text("description"), // detailed description by team member
  ambiance: text("ambiance"), // atmosphere, feel, first impressions
  highlights: text("highlights"), // JSON array of key highlights
  // Practical info
  languagesSpoken: text("languagesSpoken"), // JSON array ["français", "anglais", "turc"]
  paymentMethods: text("paymentMethods"), // JSON array
  openingHours: text("openingHours"), // JSON
  website: text("website"),
  // Team member's personal assessment
  personalAdvice: text("personalAdvice"), // what to prepare, tips, warnings
  overallRating: int("overallRating"), // 1-5 personal rating
  wouldRecommend: boolean("wouldRecommend").default(true),
  targetClientele: text("targetClientele"), // who is this best for?
  // AI enrichment
  aiEnrichedDescription: text("aiEnrichedDescription"),
  aiResearchNotes: text("aiResearchNotes"), // JSON: AI research findings
  aiRecommendation: text("aiRecommendation"), // AI-generated recommendation
  aiSeoData: text("aiSeoData"), // JSON: generated SEO metadata
  // Conversion to establishment
  convertedEstablishmentId: int("convertedEstablishmentId"), // linked establishment once published
  // Status
  status: mysqlEnum("status", ["draft", "submitted", "ai_processing", "review", "approved", "published", "rejected"]).default("draft").notNull(),
  adminNotes: text("adminNotes"),
  submittedAt: timestamp("submittedAt"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Field Report Services (Prestations) ────────────────────────────
export const fieldReportServices = mysqlTable("fieldReportServices", {
  id: int("id").autoincrement().primaryKey(),
  fieldReportId: int("fieldReportId").notNull(),
  serviceName: varchar("serviceName", { length: 256 }).notNull(),
  serviceCategory: varchar("serviceCategory", { length: 128 }), // "soins dentaires", "chirurgie", "hébergement"
  description: text("description"),
  priceFrom: decimal("priceFrom", { precision: 10, scale: 2 }),
  priceTo: decimal("priceTo", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  isOnQuote: boolean("isOnQuote").default(false), // "sur devis"
  duration: varchar("duration", { length: 64 }), // "2 heures", "3 jours"
  includes: text("includes"), // JSON array of what's included
  notes: text("notes"),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Field Report Journey (Parcours Transport Complet) ──────────────
export const fieldReportJourney = mysqlTable("fieldReportJourney", {
  id: int("id").autoincrement().primaryKey(),
  fieldReportId: int("fieldReportId").notNull(),
  stepOrder: int("stepOrder").notNull(), // 1, 2, 3...
  stepType: mysqlEnum("stepType", [
    "chauffeur", "avion", "train", "taxi", "transfert", "arrivee", "prise_en_charge", "prestation", "depart", "autre"
  ]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  // Location
  fromLocation: varchar("fromLocation", { length: 256 }),
  toLocation: varchar("toLocation", { length: 256 }),
  // Transport details
  companyName: varchar("companyName", { length: 256 }), // airline, car service, etc.
  flightNumber: varchar("flightNumber", { length: 32 }),
  vehicleType: varchar("vehicleType", { length: 128 }),
  // Timing
  departureTime: varchar("departureTime", { length: 16 }),
  arrivalTime: varchar("arrivalTime", { length: 16 }),
  durationMinutes: int("durationMinutes"),
  // Cost
  estimatedCost: decimal("estimatedCost", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  isIncluded: boolean("isIncluded").default(false), // included in package?
  // Affiliation
  affiliateLink: text("affiliateLink"),
  bookingReference: varchar("bookingReference", { length: 128 }),
  // Notes
  notes: text("notes"),
  photoUrl: text("photoUrl"), // photo of this step
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Pilotage Messages (Conversation Privée Owner ↔ IA DG) ───────────
export const pilotageMessages = mysqlTable("pilotageMessages", {
  id: int("id").autoincrement().primaryKey(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  // Métadonnées de la DG
  actionType: mysqlEnum("actionType", [
    "chat", "order_team", "modify_app", "analyze", "report", "alert"
  ]).default("chat"),
  targetDepartment: varchar("targetDepartment", { length: 64 }), // "seo", "email", "equipe", "all"
  orderStatus: mysqlEnum("orderStatus", ["pending", "in_progress", "done", "cancelled"]).default("pending"),
  metadata: text("metadata"), // JSON : actions déclenchées, résultats
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Field Report Contacts (Contacts Sur Place) ─────────────────────
export const fieldReportContacts = mysqlTable("fieldReportContacts", {
  id: int("id").autoincrement().primaryKey(),
  fieldReportId: int("fieldReportId").notNull(),
  contactName: varchar("contactName", { length: 256 }).notNull(),
  role: varchar("role", { length: 128 }), // "directeur", "chirurgien", "coordinatrice patients"
  phone: varchar("phone", { length: 64 }),
  email: varchar("email", { length: 320 }),
  whatsapp: varchar("whatsapp", { length: 64 }),
  languages: text("languages"), // JSON array ["français", "anglais", "turc"]
  notes: text("notes"),
  isMainContact: boolean("isMainContact").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Field Report Media (Photos & Vidéos Terrain) ───────────────────
export const fieldReportMedia = mysqlTable("fieldReportMedia", {
  id: int("id").autoincrement().primaryKey(),
  fieldReportId: int("fieldReportId").notNull(),
  type: mysqlEnum("type", ["photo", "video"]).notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  caption: varchar("caption", { length: 256 }),
  category: mysqlEnum("category", [
    "facade", "interieur", "prestation", "equipement", "chambre", "transport",
    "parcours", "equipe", "resultat", "vue", "repas", "autre"
  ]).default("autre").notNull(),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Client Profile (Fiche Profil Enrichie) ─────────────────────────
// Table dédiée au profil détaillé du client (séparée de users pour éviter les colonnes trop nombreuses)
export const clientProfiles = mysqlTable("clientProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),

  // ===== IDENTITÉ =====
  pseudo: varchar("pseudo", { length: 64 }),
  mode: mysqlEnum("mode", ["signature", "fantome"]).default("signature"),
  birthDate: varchar("birthDate", { length: 10 }), // YYYY-MM-DD
  age: int("age"),
  gender: varchar("gender", { length: 32 }), // homme, femme, non-binaire, autre
  nationality: varchar("nationality", { length: 64 }),
  locale: varchar("locale", { length: 8 }).default("fr"), // fr, en, es...

  // ===== MORPHOLOGIE & TAILLES =====
  height: int("height"), // en cm
  weight: int("weight"), // en kg
  shoeSize: varchar("shoeSize", { length: 8 }),
  clothingSizeTop: varchar("clothingSizeTop", { length: 16 }), // S, M, L, XL, 38, 40...
  clothingSizeBottom: varchar("clothingSizeBottom", { length: 16 }),
  clothingSizeDress: varchar("clothingSizeDress", { length: 16 }),
  clothingSizeSuit: varchar("clothingSizeSuit", { length: 16 }), // pour tailleur
  ringSize: varchar("ringSize", { length: 8 }),

  // ===== PERMIS & CONDUITE =====
  drivingLicenses: text("drivingLicenses"), // JSON: ["B","A","bateau","helico","jet_ski"]
  drivingSide: mysqlEnum("drivingSide", ["droite", "gauche", "les_deux"]).default("droite"),
  transmissionPref: mysqlEnum("transmissionPref", ["auto", "manuel", "indifferent"]).default("auto"),
  carPrefLuxury: text("carPrefLuxury"), // JSON: ["Mercedes","BMW","Porsche",...]
  carPrefDaily: text("carPrefDaily"), // JSON: ["SUV","berline","citadine",...]

  // ===== LOGEMENT & HÉBERGEMENT =====
  homeCity: varchar("homeCity", { length: 128 }),
  homeAddress: text("homeAddress"),
  lodgingTypes: text("lodgingTypes"), // JSON: ["hotel","villa","appartement","palace",...]
  lodgingSettings: text("lodgingSettings"), // JSON: ["ville","campagne","balneaire","montagne",...]
  lodgingAmenities: text("lodgingAmenities"), // JSON: ["piscine","spa","jacuzzi","salle_sport","plage","vue_mer",...]
  lodgingLocation: text("lodgingLocation"), // JSON: ["pied_plage","centre_ville","proche_transport","calme",...]
  transportPref: text("transportPref"), // JSON: ["chauffeur","uber","transport_public","autonome","mix"]

  // ===== AÉROPORT & VOYAGE =====
  preferredAirport: varchar("preferredAirport", { length: 16 }),
  airportLounge: boolean("airportLounge").default(false),
  priorityLane: boolean("priorityLane").default(false),
  passportCountry: varchar("passportCountry", { length: 64 }),
  frequentFlyerPrograms: text("frequentFlyerPrograms"), // JSON: [{"airline":"Air France","number":"...","tier":"Gold"}]
  seatPreference: varchar("seatPreference", { length: 32 }), // fenetre, couloir, milieu
  cabinClass: varchar("cabinClass", { length: 32 }), // economie, business, premiere

  // ===== STYLE & GOÛTS =====
  favoriteColors: text("favoriteColors"), // JSON: ["noir","bleu marine","or",...]
  favoriteBrands: text("favoriteBrands"), // JSON: ["Hermès","Louis Vuitton",...]
  favoriteShops: text("favoriteShops"), // JSON: ["Le Bon Marché","Harrods",...]
  dresscode: mysqlEnum("dresscode", ["casual", "smart_casual", "chic", "formel"]).default("smart_casual"),
  smoking: mysqlEnum("smoking", ["non_fumeur", "fumeur", "cigare", "vape"]).default("non_fumeur"),
  ecofriendly: boolean("ecofriendly").default(false),

  // ===== GASTRONOMIE =====
  favoriteCuisines: text("favoriteCuisines"), // JSON: ["française","japonaise","italienne",...]
  favoriteDishes: text("favoriteDishes"), // JSON: ["risotto","sushi","foie gras",...]
  dietRegime: varchar("dietRegime", { length: 256 }), // JSON: ["vegetarien","halal","casher",...]
  dietAllergies: text("dietAllergies"), // JSON: ["arachides","gluten","lactose",...]
  dietOther: text("dietOther"),
  favoriteAlcohol: text("favoriteAlcohol"), // JSON: ["champagne","vin rouge","whisky",...]
  favoriteWines: text("favoriteWines"), // JSON: ["Bordeaux","Bourgogne",...]
  coffeeTea: varchar("coffeeTea", { length: 64 }), // café noir, latte, thé vert...

  // ===== SANTÉ & BIEN-ÊTRE =====
  visionStatus: varchar("visionStatus", { length: 64 }), // bonne, lentilles, lunettes, les_deux
  visionDetails: text("visionDetails"), // correction, marque de lunettes...
  healthConditions: text("healthConditions"), // JSON: ["asthme","diabète",...]
  handicap: text("handicap"), // JSON: {"type":"...","details":"...","pmr":true}
  travelMobility: mysqlEnum("travelMobility", ["aucune", "pmr", "reduite", "poussette"]).default("aucune"),
  sleepPreference: varchar("sleepPreference", { length: 128 }),
  tempPreference: varchar("tempPreference", { length: 64 }),
  wellnessPrefs: text("wellnessPrefs"), // JSON: ["yoga","meditation","massage","fitness",...]

  // ===== ANIMAUX =====
  pets: text("pets"), // JSON: [{"type":"chien","race":"Labrador","name":"Max","weight":30,"age":5,"habits":"...","vet":{"name":"Dr Dupont","phone":"+33..."}}]

  // ===== FAMILLE & PROCHES =====
  relationshipStatus: varchar("relationshipStatus", { length: 32 }), // célibataire, couple, marié(e), pacsé(e)
  partnerGender: varchar("partnerGender", { length: 32 }), // homme, femme, non-binaire
  partnerName: varchar("partnerName", { length: 128 }),
  partnerBirthDate: varchar("partnerBirthDate", { length: 10 }),
  children: text("children"), // JSON: [{"name":"...","age":8,"schoolLevel":"CE2","allergies":[],"interests":[]}]
  closeFriends: text("closeFriends"), // JSON: [{"name":"...","relation":"meilleur ami","invited":false}]

  // ===== RELIGION & CROYANCES =====
  religiousConsiderations: varchar("religiousConsiderations", { length: 128 }), // halal, casher, aucun, autre

  // ===== CLUBS & VIP =====
  clubMemberships: text("clubMemberships"), // JSON: ["Soho House","Club Med VIP",...]
  privateAviation: text("privateAviation"), // JSON: {"hasJet":true,"type":"Citation","provider":"NetJets"}
  yachtBoat: text("yachtBoat"), // JSON: {"hasYacht":true,"name":"...","type":"voilier","length":"15m"}
  conciergePreference: varchar("conciergePreference", { length: 128 }), // Quintessentially, John Paul...

  // ===== LIEUX & PRÉFÉRENCES =====
  favoriteCities: text("favoriteCities"), // JSON: ["Paris","New York","Tokyo",...]
  favoritePlaces: text("favoritePlaces"), // JSON: [{"name":"Café de Flore","city":"Paris","why":"..."}]
  favoriteQuotes: text("favoriteQuotes"), // JSON: ["La vie est belle","..."]
  bucketList: text("bucketList"), // JSON: ["Voir les aurores boréales","..."]

  // ===== VOYAGE =====
  travelStyles: text("travelStyles"), // JSON: ["detente","gastronomie","culture",...]
  travelBudget: mysqlEnum("travelBudget", ["economique", "confort", "premium", "luxe", "sans_limite"]).default("confort"),
  travelGroup: mysqlEnum("travelGroup", ["solo", "couple", "famille", "amis", "business"]).default("couple"),
  languages: text("languages"), // JSON: ["français","anglais",...]

  // ===== GAMIFICATION =====
  profileCompletionPct: int("profileCompletionPct").default(0), // 0-100
  profilePointsEarned: int("profilePointsEarned").default(0), // points gagnés en remplissant
  lastFieldFilledAt: timestamp("lastFieldFilledAt"),

  // ===== NOTES LIBRES =====
  freeNotes: text("freeNotes"),
  // Commandes ARIA — instructions dynamiques injectées dans le prompt système
  ariaInstructions: text("ariaInstructions"), // JSON array: [{id, instruction, addedAt, addedBy}]
  ariaInstructionsUpdatedAt: timestamp("ariaInstructionsUpdatedAt"),
  // Méta IA
  aiLastExtracted: timestamp("aiLastExtracted"),
  aiExtractionCount: int("aiExtractionCount").default(0),
  profileExtractedFields: text("profileExtractedFields"), // JSON: champs extraits automatiquement de la conversation

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientProfile = typeof clientProfiles.$inferSelect;
export type InsertClientProfile = typeof clientProfiles.$inferInsert;

// ─── Travel Companions Enrichis (Cercle Proche) ──────────────────────
// Remplace l'ancienne table travelCompanions avec tous les champs demandés
export const companions = mysqlTable("companions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),

  // Identité
  name: varchar("name", { length: 128 }).notNull(),
  relationship: mysqlEnum("relationship", [
    "conjoint", "enfant", "parent", "ami", "collegue", "autre"
  ]).default("autre"),
  birthDate: varchar("birthDate", { length: 10 }),
  avatarUrl: text("avatarUrl"),

  // Alimentation
  dietRegime: varchar("dietRegime", { length: 256 }), // JSON array
  dietAllergies: text("dietAllergies"), // JSON array
  dietOther: text("dietOther"),

  // Voyage
  travelStyles: text("travelStyles"), // JSON array
  travelBudget: mysqlEnum("travelBudget", ["economique", "confort", "premium", "luxe", "sans_limite"]).default("confort"),
  travelMobility: mysqlEnum("travelMobility", ["aucune", "pmr", "reduite", "poussette"]).default("aucune"),

  // Lifestyle
  languages: text("languages"), // JSON array
  pet: mysqlEnum("pet", ["aucun", "chien", "chat", "autre"]).default("aucun"),
  smoking: mysqlEnum("smoking", ["non_fumeur", "fumeur", "cigare", "vape"]).default("non_fumeur"),

  // Tailles & goûts
  clothingSize: varchar("clothingSize", { length: 16 }),
  shoeSize: varchar("shoeSize", { length: 8 }),
  favoriteAlcohol: varchar("favoriteAlcohol", { length: 128 }),
  favoriteCuisine: varchar("favoriteCuisine", { length: 256 }),

  // Notes libres
  freeNotes: text("freeNotes"),

  // Méta
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Companion = typeof companions.$inferSelect;
export type InsertCompanion = typeof companions.$inferInsert;

// ─── User Destinations (Parcours Personnels Partageables) ────────────
export const userDestinations = mysqlTable("userDestinations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),

  // Contenu
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  coverImageUrl: text("coverImageUrl"),
  tags: text("tags"), // JSON array: ["gastronomie","week-end","romantique",...]
  tripType: mysqlEnum("tripType", ["leisure", "business", "romantic", "family", "staycation", "adventure", "wellness"]).default("leisure"),
  budget: mysqlEnum("budget", ["economique", "confort", "premium", "luxe"]).default("confort"),
  duration: int("duration"), // nombre de jours
  destination: varchar("destination", { length: 256 }), // "Paris", "Côte d'Azur", etc.
  country: varchar("country", { length: 128 }),
  lat: float("lat"),
  lng: float("lng"),

  // Contenu riche (JSON)
  steps: text("steps"), // JSON array de {day, title, places[], notes}
  highlights: text("highlights"), // JSON array de points forts
  tips: text("tips"), // JSON array de conseils

  // Visibilité
  visibility: mysqlEnum("visibility", ["private", "family", "public"]).default("private"),
  isVerified: boolean("isVerified").default(false), // vérifié par Baymora
  isFeatured: boolean("isFeatured").default(false), // mis en avant par Baymora

  // Stats
  viewCount: int("viewCount").default(0),
  saveCount: int("saveCount").default(0),
  likeCount: int("likeCount").default(0),

  // LÉNA / IA source
  isLenaGenerated: boolean("isLenaGenerated").default(false).notNull(),
  lenaSessionId: varchar("lenaSessionId", { length: 64 }), // LÉNA session reference
  sourceFieldReportId: int("sourceFieldReportId"), // linked field report
  sourceConversationId: int("sourceConversationId"), // linked chat conversation
  // Décision LÉNA
  lenaDecision: mysqlEnum("lenaDecision", ["pending", "keep", "delete", "convert_bundle", "convert_seocard"]).default("pending"),
  lenaDecisionAt: timestamp("lenaDecisionAt"),
  lenaDecisionNotes: text("lenaDecisionNotes"),
  // Méta
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserDestination = typeof userDestinations.$inferSelect;
export type InsertUserDestination = typeof userDestinations.$inferInsert;

// ─── Destination Saves (Sauvegardes de parcours par d'autres users) ──
export const destinationSaves = mysqlTable("destinationSaves", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  destinationId: int("destinationId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── ARIA Missions (Directives 24h du fondateur) ─────────────────────────────
export const ariaMissions = mysqlTable("ariaMissions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  status: mysqlEnum("status", ["active", "completed", "cancelled", "expired"]).default("active").notNull(),
  priority: mysqlEnum("priority", ["normal", "high", "urgent"]).default("normal").notNull(),
  authorId: int("authorId").notNull(),
  startsAt: timestamp("startsAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  completedAt: timestamp("completedAt"),
  ariaAck: text("ariaAck"),           // Accusé de réception ARIA (résumé compréhension)
  ariaAckAt: timestamp("ariaAckAt"),
  progressNotes: text("progressNotes"), // JSON array de notes de progression
  // Compte-rendu final
  finalReport: text("finalReport"),     // Rapport de clôture rédigé par ARIA
  finalReportAt: timestamp("finalReportAt"),
  successScore: int("successScore"),    // Score 0-100 calculé par ARIA
  completedTasks: int("completedTasks").default(0),
  totalTasks: int("totalTasks").default(0),
  // Méta
  durationHours: int("durationHours").default(24), // Durée de la mission (défaut 24h)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AriaMission = typeof ariaMissions.$inferSelect;
export type InsertAriaMission = typeof ariaMissions.$inferInsert;

// ─── LÉNA Sessions (Persistance cross-device) ────────────────────────────────
export const lenaSessions = mysqlTable("lenaSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionKey: varchar("sessionKey", { length: 64 }).notNull(),
  establishmentName: varchar("establishmentName", { length: 256 }),
  city: varchar("city", { length: 128 }),
  currentStep: varchar("currentStep", { length: 64 }).default("ACCUEIL").notNull(),
  collectedData: text("collectedData"),  // JSON
  history: text("history"),              // JSON array of messages
  scoutBriefing: text("scoutBriefing"),
  fieldReportId: int("fieldReportId"),
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LenaSessionDB = typeof lenaSessions.$inferSelect;
export type InsertLenaSessionDB = typeof lenaSessions.$inferInsert;

// ─── Agent Task Orders (Ordres traçables ARIA → Agents) ──────────────────────
export const agentTaskOrders = mysqlTable("agentTaskOrders", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  agent: varchar("agent", { length: 64 }).notNull(),
  requestedBy: varchar("requestedBy", { length: 64 }).default("fondateur").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  progressPercent: int("progressPercent").default(0),
  progressNotes: text("progressNotes"), // JSON array [{at, note, by}]
  result: text("result"),
  linkedMissionId: int("linkedMissionId"),
  linkedFieldReportId: int("linkedFieldReportId"),
  linkedSeoCardId: int("linkedSeoCardId"),
  dueAt: timestamp("dueAt"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AgentTaskOrder = typeof agentTaskOrders.$inferSelect;
export type InsertAgentTaskOrder = typeof agentTaskOrders.$inferInsert;

// ─── Team Invitations (Invitations opérateurs terrain) ───────────────────────
export const teamInvitations = mysqlTable("teamInvitations", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  invitedBy: int("invitedBy").notNull(), // userId du fondateur
  recipientName: varchar("recipientName", { length: 128 }),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  recipientPhone: varchar("recipientPhone", { length: 32 }),
  role: mysqlEnum("role", ["team", "admin"]).default("team").notNull(),
  grantedTier: mysqlEnum("grantedTier", ["free", "explorer", "premium"]).default("explorer").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "expired", "cancelled"]).default("pending").notNull(),
  acceptedByUserId: int("acceptedByUserId"),
  message: text("message"), // message personnalisé du fondateur
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type InsertTeamInvitation = typeof teamInvitations.$inferInsert;

// ─── Operator Messages (Messagerie Admin ↔ Opérateur Terrain) ────────
export const operatorMessages = mysqlTable("operatorMessages", {
  id: int("id").autoincrement().primaryKey(),
  fromUserId: int("fromUserId").notNull(),   // admin ou opérateur
  toUserId: int("toUserId").notNull(),        // opérateur ou admin
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  attachmentUrl: text("attachmentUrl"),       // lien photo/doc optionnel
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OperatorMessage = typeof operatorMessages.$inferSelect;

// ─── Operator Routes (Parcours Locaux Créés par les Opérateurs) ──────
export const operatorRoutes = mysqlTable("operatorRoutes", {
  id: int("id").autoincrement().primaryKey(),
  createdByUserId: int("createdByUserId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  city: varchar("city", { length: 128 }).notNull(),
  country: varchar("country", { length: 128 }).default("France").notNull(),
  category: mysqlEnum("category", [
    "decouverte",   // Découverte de la ville
    "gastronomie",  // Circuit gastronomique
    "plages",       // Plages & balnéaire
    "culture",      // Culture & patrimoine
    "shopping",     // Shopping & boutiques
    "nature",       // Nature & randonnée
    "nightlife",    // Vie nocturne
    "wellness",     // Bien-être & spa
    "business",     // Parcours business
    "famille",      // Famille & enfants
    "autre"         // Autre
  ]).default("decouverte").notNull(),
  durationMinutes: int("durationMinutes"),    // durée estimée en minutes
  status: mysqlEnum("status", ["draft", "submitted", "approved", "published"]).default("draft").notNull(),
  coverImageUrl: text("coverImageUrl"),
  establishmentIds: text("establishmentIds"), // JSON array d'IDs d'établissements
  steps: text("steps"),                       // JSON array des étapes du parcours
  notes: text("notes"),                       // Notes internes de l'opérateur
  adminFeedback: text("adminFeedback"),       // Retour de l'admin
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OperatorRoute = typeof operatorRoutes.$inferSelect;

// ─── Discount Offers (Offres avec Réductions Premium) ────────────────
export const discountOffers = mysqlTable("discountOffers", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  title: varchar("title", { length: 256 }).notNull(),
  subtitle: varchar("subtitle", { length: 512 }),
  tagline: varchar("tagline", { length: 256 }),
  establishmentId: int("establishmentId"),
  establishmentName: varchar("establishmentName", { length: 256 }).notNull(),
  establishmentCategory: mysqlEnum("establishmentCategory", [
    "hotel", "villa", "restaurant", "spa", "experience", "transport", "wellness", "yacht", "chalet"
  ]).notNull(),
  city: varchar("city", { length: 128 }).notNull(),
  country: varchar("country", { length: 128 }).notNull(),
  region: varchar("region", { length: 128 }),
  lat: float("lat"),
  lng: float("lng"),
  isPremiumDestination: boolean("isPremiumDestination").default(true).notNull(),
  originalPricePerNight: int("originalPricePerNight"),
  discountedPricePerNight: int("discountedPricePerNight"),
  originalPriceTotal: int("originalPriceTotal"),
  discountedPriceTotal: int("discountedPriceTotal"),
  discountPercent: int("discountPercent"),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  packageType: mysqlEnum("packageType", ["1_night", "2_nights", "3_nights", "weekend", "week", "custom"]).default("2_nights").notNull(),
  durationNights: int("durationNights").default(2).notNull(),
  maxGuests: int("maxGuests").default(2),
  priceTier: mysqlEnum("priceTier", ["tier1", "tier2", "tier3", "tier4"]).notNull(),
  sector: mysqlEnum("sector", [
    "hotelerie", "gastronomie", "experiences", "villas", "transport", "bienetre", "yachting", "ski"
  ]).notNull(),
  heroImageUrl: text("heroImageUrl"),
  galleryImages: text("galleryImages"),
  coverImageUrl: text("coverImageUrl"),
  description: text("description").notNull(),
  shortDescription: varchar("shortDescription", { length: 500 }),
  highlights: text("highlights"),
  included: text("included"),
  notIncluded: text("notIncluded"),
  conditions: text("conditions"),
  insiderTip: text("insiderTip"),
  availableFrom: timestamp("availableFrom"),
  availableTo: timestamp("availableTo"),
  isFlashOffer: boolean("isFlashOffer").default(false).notNull(),
  flashExpiresAt: timestamp("flashExpiresAt"),
  totalSlots: int("totalSlots"),
  bookedSlots: int("bookedSlots").default(0),
  bookingUrl: text("bookingUrl"),
  affiliateCode: varchar("affiliateCode", { length: 128 }),
  commissionPercent: decimal("commissionPercent", { precision: 5, scale: 2 }),
  accessLevel: mysqlEnum("accessLevel", ["free", "premium_only"]).default("free").notNull(),
  status: mysqlEnum("status", ["draft", "published", "expired", "sold_out"]).default("draft").notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  sortOrder: int("sortOrder").default(0),
  viewCount: int("viewCount").default(0),
  bookingCount: int("bookingCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DiscountOffer = typeof discountOffers.$inferSelect;
export type InsertDiscountOffer = typeof discountOffers.$inferInsert;

// ─── Discount Offer Saves (Favoris Offres) ───────────────────────────
export const discountOfferSaves = mysqlTable("discountOfferSaves", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  offerId: int("offerId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DiscountOfferSave = typeof discountOfferSaves.$inferSelect;
