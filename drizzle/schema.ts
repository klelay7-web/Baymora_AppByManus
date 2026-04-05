import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, decimal, bigint, float } from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "team"]).default("user").notNull(),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "premium", "elite"]).default("free").notNull(),
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

  // Identité
  pseudo: varchar("pseudo", { length: 64 }),
  mode: mysqlEnum("mode", ["signature", "fantome"]).default("signature"),

  // Alimentation
  dietRegime: varchar("dietRegime", { length: 256 }), // JSON array: ["vegetarien","halal",...]
  dietAllergies: text("dietAllergies"), // JSON array: ["arachides","noix",...]
  dietOther: text("dietOther"), // texte libre

  // Voyage
  travelStyles: text("travelStyles"), // JSON array: ["detente","gastronomie","culture",...]
  travelBudget: mysqlEnum("travelBudget", ["economique", "confort", "premium", "luxe", "sans_limite"]).default("confort"),
  travelGroup: mysqlEnum("travelGroup", ["solo", "couple", "famille", "amis", "business"]).default("couple"),
  travelMobility: mysqlEnum("travelMobility", ["aucune", "pmr", "reduite", "poussette"]).default("aucune"),

  // Lifestyle
  languages: text("languages"), // JSON array: ["français","anglais",...]
  pet: mysqlEnum("pet", ["aucun", "chien", "chat", "autre"]).default("aucun"),
  smoking: mysqlEnum("smoking", ["non_fumeur", "fumeur", "cigare", "vape"]).default("non_fumeur"),
  dresscode: mysqlEnum("dresscode", ["casual", "smart_casual", "chic", "formel"]).default("smart_casual"),
  ecofriendly: boolean("ecofriendly").default(false),

  // Logistique
  homeCity: varchar("homeCity", { length: 128 }),
  homeAddress: text("homeAddress"),
  preferredAirport: varchar("preferredAirport", { length: 16 }), // CDG, ORY, etc.
  airportLounge: boolean("airportLounge").default(false),
  priorityLane: boolean("priorityLane").default(false),

  // Tailles & goûts
  clothingSize: varchar("clothingSize", { length: 16 }),
  shoeSize: varchar("shoeSize", { length: 8 }),
  favoriteAlcohol: varchar("favoriteAlcohol", { length: 128 }),
  favoriteCuisine: varchar("favoriteCuisine", { length: 256 }),
  sleepPreference: varchar("sleepPreference", { length: 128 }),
  tempPreference: varchar("tempPreference", { length: 64 }),

  // Notes libres
  freeNotes: text("freeNotes"),

  // Méta IA
  aiLastExtracted: timestamp("aiLastExtracted"),
  aiExtractionCount: int("aiExtractionCount").default(0),

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
