import { z } from 'zod';

// ============================================================================
// AUTHENTICATION
// ============================================================================

export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthTokenSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.literal('Bearer'),
});

export type AuthToken = z.infer<typeof AuthTokenSchema>;

// ============================================================================
// CLIENT PROFILE
// ============================================================================

export const ClientPreferencesSchema = z.object({
  style: z.enum(['adventurous', 'relaxed', 'cultural', 'luxury', 'budget']).optional(),
  pace: z.enum(['slow', 'moderate', 'fast']).optional(),
  budgetRange: z.object({
    min: z.number().positive().optional(),
    max: z.number().positive().optional(),
  }).optional(),
  cuisines: z.array(z.string()).optional(),
  activities: z.array(z.string()).optional(),
  petFriendly: z.boolean().optional(),
  accessibility: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
});

export type ClientPreferences = z.infer<typeof ClientPreferencesSchema>;

export const ClientConstraintsSchema = z.object({
  mobilityIssues: z.boolean().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  childrenAges: z.array(z.number()).optional(),
  pets: z.array(z.object({
    type: z.string(),
    count: z.number(),
    specialNeeds: z.string().optional(),
  })).optional(),
});

export type ClientConstraints = z.infer<typeof ClientConstraintsSchema>;

// ============================================================================
// JOURNEY PLANS
// ============================================================================

export const PartyCompositionSchema = z.object({
  adults: z.number().nonnegative().default(1),
  children: z.number().nonnegative().default(0),
  elderly: z.number().nonnegative().default(0),
  pets: z.array(z.object({
    type: z.string(),
    count: z.number(),
  })).optional(),
});

export type PartyComposition = z.infer<typeof PartyCompositionSchema>;

export const JourneyPlanRequestSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  startDate: z.string().date(),
  endDate: z.string().date(),
  budgetUsd: z.number().positive('Budget must be positive'),
  partyComposition: PartyCompositionSchema,
  specialRequests: z.string().optional(),
});

export type JourneyPlanRequest = z.infer<typeof JourneyPlanRequestSchema>;

export const JourneyStatusEnum = z.enum([
  'draft',
  'generating',
  'generated',
  'published',
  'executing',
]);

export const ReliabilityStatusEnum = z.enum([
  'researched',
  'reviewed',
  'verified',
  'partner',
  'affiliate',
  'priority_partner',
  'bespoke_verified',
]);

export const JourneyPlanSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  destination: z.string(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  budgetUsd: z.number().positive(),
  budgetEur: z.number().positive().optional(),
  partyComposition: PartyCompositionSchema,
  status: JourneyStatusEnum,
  reliabilityStatus: ReliabilityStatusEnum.optional(),
  contentJson: z.record(z.any()).optional(),
  pdfUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
  publishedAt: z.string().datetime().optional(),
});

export type JourneyPlan = z.infer<typeof JourneyPlanSchema>;

// ============================================================================
// VENUES & RECOMMENDATIONS
// ============================================================================

export const VenueCategoryEnum = z.enum([
  'accommodation',
  'restaurant',
  'activity',
  'transport',
  'service',
  'shopping',
  'entertainment',
]);

export const VenueSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  category: VenueCategoryEnum,
  city: z.string(),
  country: z.string(),
  description: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewsCount: z.number().nonnegative().optional(),
  priceRangeUsd: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  petFriendly: z.boolean().optional(),
  accessibilityFeatures: z.array(z.string()).optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  reliabilityStatus: ReliabilityStatusEnum,
  affiliateProgram: z.object({
    enabled: z.boolean(),
    commission: z.number().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
});

export type Venue = z.infer<typeof VenueSchema>;

// ============================================================================
// CONCIERGE
// ============================================================================

export const ConciergeRequestSchema = z.object({
  journeyPlanId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(10),
  specialRequests: z.string().optional(),
});

export type ConciergeRequest = z.infer<typeof ConciergeRequestSchema>;

export const ConciergeRequestResponseSchema = z.object({
  id: z.string().uuid(),
  accessCode: z.string(),
  status: z.enum(['pending', 'quoted', 'approved', 'completed']),
  createdAt: z.string().datetime(),
});

export type ConciergeRequestResponse = z.infer<typeof ConciergeRequestResponseSchema>;

// ============================================================================
// CHAT
// ============================================================================

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatStartRequestSchema = z.object({
  language: z.enum(['en', 'fr']).default('en'),
  title: z.string().optional(),
});

export type ChatStartRequest = z.infer<typeof ChatStartRequestSchema>;

// ============================================================================
// ADMIN
// ============================================================================

export const AdminActionEnum = z.enum([
  'user_created',
  'user_deleted',
  'plan_unlocked',
  'complementary_access_granted',
  'admin_login',
  'payment_verified',
  'content_published',
  'venue_added',
  'partner_agreement',
]);

export type AdminAction = z.infer<typeof AdminActionEnum>;

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  actorId: z.string().uuid(),
  action: AdminActionEnum,
  resourceType: z.string(),
  resourceId: z.string().optional(),
  details: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  createdAt: z.string().datetime(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

// ============================================================================
// RESPONSES
// ============================================================================

export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.record(z.any()).optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export const DemoResponse = z.object({
  message: z.string(),
});

export type DemoResponse = z.infer<typeof DemoResponse>;
