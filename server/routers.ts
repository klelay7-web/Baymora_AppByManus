import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getUserConversations, createConversation, getConversationMessages, addMessage,
  getUserPreferences, upsertPreference, getUserCompanions, addCompanion,
  getPublishedSeoCards, getSeoCardBySlug, getAllSeoCards, createSeoCard, updateSeoCard, incrementSeoCardViews,
  getActivePartners, trackAffiliateClick, getAffiliateStats,
  updateUserCredits, getCreditHistory, incrementFreeMessages,
  getUserItineraries, createItinerary,
  getSocialPosts, createSocialPost,
  getAdminStats, getUserById, updateUser,
  getPublishedEstablishments, getEstablishmentBySlug, getEstablishmentById, getAllEstablishments,
  createEstablishment, updateEstablishment, incrementEstablishmentViews,
  getEstablishmentMedia, addEstablishmentMedia,
  getUserTripPlans, getTripPlanById, createTripPlan, updateTripPlan,
  getTripDays, createTripDay, getTripSteps, createTripStep, updateTripStep,
  getUserFavorites, addFavorite, removeFavorite,
  getUserCollections, createCollection, updateCollection,
  getAmbassadorByUserId, createAmbassador, updateAmbassador, getAllAmbassadors,
  getReferralsByAmbassador, createReferral,
  getCommissionPayments, createCommissionPayment, getAllCommissionStats,
  getServiceProviders, createServiceProvider, updateServiceProvider,
  getAiDirectives, createAiDirective, updateAiDirective,
  getAiDepartmentReports, createAiDepartmentReport,
  getPublishedBundles, getAllBundles, createBundle, updateBundle,
  getContentCalendar, createContentCalendarItem, updateContentCalendarItem,
  getEstablishmentComments, createEstablishmentComment, incrementCommentHelpful, getEstablishmentCommentCount,
  getFieldReportsByUser, getAllFieldReports, getFieldReportById, createFieldReport, updateFieldReport,
  getFieldReportServices, addFieldReportService, deleteFieldReportService,
  getFieldReportJourneySteps, addFieldReportJourneyStep, deleteFieldReportJourneyStep,
  getFieldReportContacts, addFieldReportContact, deleteFieldReportContact,
  getFieldReportMediaItems, addFieldReportMediaItem, deleteFieldReportMediaItem,
} from "./db";
import { generateConciergeResponse, getWelcomeResponse } from "./services/concierge";
import type { User } from "../drizzle/schema";
import { generateSeoCard, generateSocialContent } from "./services/seoGenerator";
import { dispatchTask } from "./services/agentBus";
import { notifyOwner } from "./_core/notification";
import { generateImage } from "./_core/imageGeneration";
import { transcribeAudio } from "./_core/voiceTranscription";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
  return next({ ctx });
});

const teamProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "team" && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux membres de l'équipe" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Chat Concierge ───────────────────────────────────────────────
  chat: router({
    getConversations: protectedProcedure.query(({ ctx }) => getUserConversations(ctx.user.id)),

    createConversation: protectedProcedure
      .input(z.object({ title: z.string().optional(), tripType: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const id = await createConversation(ctx.user.id, input.title, input.tripType);
        return { id };
      }),

    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(({ input }) => getConversationMessages(input.conversationId)),

    getWelcome: publicProcedure.query(() => getWelcomeResponse()),

    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string().min(1).max(5000),
        isVoice: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Owner & admin bypass: accès illimité
        const isOwner = ctx.user.openId === ENV.ownerOpenId;
        const isPrivileged = isOwner || ctx.user.role === "admin";
        if (!isPrivileged && ctx.user.subscriptionTier === "free") {
          if (ctx.user.freeMessagesUsed >= 3) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Vous avez utilisé vos 3 messages gratuits. Passez au plan Premium (90€/mois) pour un accès illimité.",
            });
          }
          await incrementFreeMessages(ctx.user.id);
        }
        await addMessage(input.conversationId, "user", input.content, undefined, input.isVoice);
        const history = await getConversationMessages(input.conversationId, 20);
        const formattedHistory = history.map(m => ({ role: m.role, content: m.content }));
        const aiResponse = await generateConciergeResponse(ctx.user.id, formattedHistory, input.content);
        // Store the full JSON as the message content
        await addMessage(input.conversationId, "assistant", JSON.stringify(aiResponse));
        return aiResponse;
      }),

    transcribeVoice: protectedProcedure
      .input(z.object({ audioUrl: z.string() }))
      .mutation(async ({ input }) => {
        const result = await transcribeAudio({ audioUrl: input.audioUrl, language: "fr" });
        if ('error' in result) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error });
        return { text: result.text };
      }),
  }),

  // ─── User Profile & Memory ────────────────────────────────────────
  profile: router({
    getPreferences: protectedProcedure.query(({ ctx }) => getUserPreferences(ctx.user.id)),

    updatePreference: protectedProcedure
      .input(z.object({ category: z.string(), key: z.string(), value: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await upsertPreference(ctx.user.id, input.category, input.key, input.value, "explicit");
        return { success: true };
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        phone: z.string().optional(),
        homeCity: z.string().optional(),
        homeCountry: z.string().optional(),
        homeAddress: z.string().optional(),
        homeLat: z.number().optional(),
        homeLng: z.number().optional(),
        budgetPreference: z.enum(["economy", "moderate", "premium", "ultra_premium"]).optional(),
        travelStyle: z.enum(["adventure", "relaxation", "cultural", "business", "romantic", "family"]).optional(),
        language: z.string().optional(),
        currency: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUser(ctx.user.id, input);
        return { success: true };
      }),

    getCompanions: protectedProcedure.query(({ ctx }) => getUserCompanions(ctx.user.id)),

    addCompanion: protectedProcedure
      .input(z.object({
        name: z.string(),
        relationship: z.string().optional(),
        dietaryRestrictions: z.string().optional(),
        preferences: z.string().optional(),
        allergies: z.string().optional(),
        birthDate: z.string().optional(),
        passportCountry: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await addCompanion(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ─── Establishments ───────────────────────────────────────────────
  establishments: router({
    getPublished: publicProcedure
      .input(z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
        category: z.string().optional(),
        city: z.string().optional(),
      }))
      .query(({ input }) => getPublishedEstablishments(input.limit, input.offset, input.category, input.city)),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const estab = await getEstablishmentBySlug(input.slug);
        if (!estab) throw new TRPCError({ code: "NOT_FOUND", message: "Établissement non trouvé" });
        await incrementEstablishmentViews(estab.id);
        const media = await getEstablishmentMedia(estab.id);
        return { ...estab, media };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const estab = await getEstablishmentById(input.id);
        if (!estab) throw new TRPCError({ code: "NOT_FOUND", message: "Établissement non trouvé" });
        const media = await getEstablishmentMedia(estab.id);
        return { ...estab, media };
      }),

    getAll: adminProcedure.query(() => getAllEstablishments()),

    create: adminProcedure
      .input(z.object({
        name: z.string(),
        category: z.string(),
        city: z.string(),
        country: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + input.city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const id = await createEstablishment({
          ...input,
          slug,
          description: input.description || `Découvrez ${input.name} à ${input.city}`,
          status: "draft",
        });
        return { id };
      }),

    publish: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updateEstablishment(input.id, { status: "published", publishedAt: new Date() });
        return { success: true };
      }),
  }),

  // ─── Establishment Comments (Engagement IA) ─────────────────────
  comments: router({
    getByEstablishment: publicProcedure
      .input(z.object({ establishmentId: z.number(), limit: z.number().default(20) }))
      .query(({ input }) => getEstablishmentComments(input.establishmentId, input.limit)),

    getCount: publicProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(({ input }) => getEstablishmentCommentCount(input.establishmentId)),

    markHelpful: publicProcedure
      .input(z.object({ commentId: z.number() }))
      .mutation(async ({ input }) => {
        await incrementCommentHelpful(input.commentId);
        return { success: true };
      }),

    generateAI: adminProcedure
      .input(z.object({ establishmentId: z.number(), count: z.number().default(5) }))
      .mutation(async ({ input }) => {
        const estab = await getEstablishmentById(input.establishmentId);
        if (!estab) throw new TRPCError({ code: "NOT_FOUND", message: "Établissement non trouvé" });
        const { generateAIComments } = await import("./services/commentGenerator");
        const comments = await generateAIComments(estab, input.count);
        const ids: number[] = [];
        for (const comment of comments) {
          const id = await createEstablishmentComment({ ...comment, establishmentId: estab.id });
          if (id) ids.push(id);
        }
        return { generated: ids.length, ids };
      }),
  }),

  // ─── Trip Plans ───────────────────────────────────────────────────
  trips: router({
    getMyPlans: protectedProcedure.query(({ ctx }) => getUserTripPlans(ctx.user.id)),

    getPlan: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const plan = await getTripPlanById(input.id);
        if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan de voyage non trouvé" });
        const days = await getTripDays(plan.id);
        const daysWithSteps = await Promise.all(
          days.map(async (day) => {
            const steps = await getTripSteps(day.id);
            return { ...day, steps };
          })
        );
        return { ...plan, days: daysWithSteps };
      }),

    createPlan: protectedProcedure
      .input(z.object({
        title: z.string(),
        tripType: z.enum(["leisure", "business", "romantic", "family", "staycation", "adventure", "wellness"]),
        budgetLevel: z.enum(["economy", "moderate", "premium", "ultra_premium"]),
        destinationCity: z.string(),
        destinationCountry: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        travelers: z.number().default(1),
        conversationId: z.number().optional(),
        originCity: z.string().optional(),
        originCountry: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createTripPlan({ userId: ctx.user.id, ...input });
        return { id };
      }),

    updatePlan: protectedProcedure
      .input(z.object({ id: z.number(), status: z.string().optional(), estimatedTotal: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateTripPlan(id, data);
        return { success: true };
      }),

    addDay: protectedProcedure
      .input(z.object({
        tripPlanId: z.number(),
        dayNumber: z.number(),
        date: z.string(),
        title: z.string().optional(),
        summary: z.string().optional(),
        centerLat: z.number().optional(),
        centerLng: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createTripDay(input);
        return { id };
      }),

    addStep: protectedProcedure
      .input(z.object({
        tripDayId: z.number(),
        stepOrder: z.number(),
        title: z.string(),
        stepType: z.string(),
        description: z.string().optional(),
        establishmentId: z.number().optional(),
        locationName: z.string().optional(),
        address: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        durationMinutes: z.number().optional(),
        transportMode: z.string().optional(),
        transportDurationMinutes: z.number().optional(),
        estimatedCost: z.string().optional(),
        affiliateLink: z.string().optional(),
        tips: z.string().optional(),
        photoUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createTripStep(input);
        return { id };
      }),

    updateStep: protectedProcedure
      .input(z.object({ id: z.number(), confirmed: z.boolean().optional() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateTripStep(id, data);
        return { success: true };
      }),
  }),

  // ─── SEO Cards (legacy feed) ──────────────────────────────────────
  seo: router({
    getPublishedCards: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(({ input }) => getPublishedSeoCards(input.limit, input.offset)),

    getCardBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const card = await getSeoCardBySlug(input.slug);
        if (!card) throw new TRPCError({ code: "NOT_FOUND", message: "Fiche non trouvée" });
        await incrementSeoCardViews(card.id);
        return card;
      }),

    getAllCards: adminProcedure.query(() => getAllSeoCards()),

    generateCard: adminProcedure
      .input(z.object({
        name: z.string(),
        category: z.enum(["restaurant", "hotel", "activity", "bar", "spa", "guide", "experience"]),
        city: z.string(),
        country: z.string(),
        region: z.string().optional(),
        additionalContext: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const cardId = await generateSeoCard(input);
        return { cardId };
      }),

    publishCard: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updateSeoCard(input.id, { status: "published", publishedAt: new Date() });
        return { success: true };
      }),

    generateCardImage: adminProcedure
      .input(z.object({ cardId: z.number(), prompt: z.string() }))
      .mutation(async ({ input }) => {
        const result = await generateImage({ prompt: input.prompt });
        await updateSeoCard(input.cardId, { imageUrl: result.url });
        return { imageUrl: result.url };
      }),
  }),

  // ─── Affiliation ──────────────────────────────────────────────────
  affiliate: router({
    getPartners: adminProcedure.query(() => getActivePartners()),

    trackClick: publicProcedure
      .input(z.object({
        partnerId: z.number(),
        clickedUrl: z.string(),
        seoCardId: z.number().optional(),
        establishmentId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id;
        const clickId = await trackAffiliateClick(input.partnerId, input.clickedUrl, input.seoCardId, userId, undefined, undefined, undefined, input.establishmentId);
        return { clickId };
      }),

    getDashboard: adminProcedure.query(() => getAffiliateStats()),
  }),

  // ─── Credits & Subscription ───────────────────────────────────────
  credits: router({
    getBalance: protectedProcedure.query(({ ctx }) => ({
      credits: ctx.user.credits,
      rollover: ctx.user.creditsRollover,
      tier: ctx.user.subscriptionTier,
      freeMessagesUsed: ctx.user.freeMessagesUsed,
    })),
    getHistory: protectedProcedure.query(({ ctx }) => getCreditHistory(ctx.user.id)),
    recharge: protectedProcedure
      .input(z.object({ amount: z.number().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const newBalance = await updateUserCredits(ctx.user.id, input.amount, "recharge", `Recharge de ${input.amount} crédits`);
        return { newBalance };
      }),
  }),

  // ─── Social Media ─────────────────────────────────────────────────
  social: router({
    getPosts: adminProcedure.query(() => getSocialPosts()),
    generatePost: adminProcedure
      .input(z.object({
        seoCardId: z.number().optional(),
        establishmentId: z.number().optional(),
        platform: z.enum(["instagram", "tiktok", "linkedin", "twitter"]),
        contentType: z.enum(["carousel", "reel", "story", "post", "script"]),
      }))
      .mutation(async ({ input }) => {
        const taskId = await dispatchTask("acquisition", "social_media", "generate_post", {
          platform: input.platform, contentType: input.contentType,
          cardId: input.seoCardId, establishmentId: input.establishmentId,
        });
        return { taskId };
      }),
  }),

  // ─── Agent Tasks ──────────────────────────────────────────────────
  agents: router({
    dispatch: adminProcedure
      .input(z.object({
        department: z.enum(["acquisition", "concierge", "logistics", "quality"]),
        agentType: z.string(),
        taskType: z.string(),
        input: z.any(),
        priority: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const taskId = await dispatchTask(input.department, input.agentType, input.taskType, input.input, input.priority);
        return { taskId };
      }),
  }),

  // ─── Admin Dashboard ──────────────────────────────────────────────
  admin: router({
    getStats: adminProcedure.query(() => getAdminStats()),
    notifyOwner: adminProcedure
      .input(z.object({ title: z.string(), content: z.string() }))
      .mutation(async ({ input }) => {
        const success = await notifyOwner(input);
        return { success };
      }),
   }),

  // ─── Favorites & Collections ────────────────────────────────────────
  favorites: router({
    list: protectedProcedure.query(({ ctx }) => getUserFavorites(ctx.user.id)),
    add: protectedProcedure
      .input(z.object({ targetType: z.enum(["establishment", "seoCard", "tripPlan", "bundle"]), targetId: z.number(), collectionId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const id = await addFavorite(ctx.user.id, input.targetType, input.targetId, input.collectionId);
        return { id };
      }),
    remove: protectedProcedure
      .input(z.object({ targetType: z.enum(["establishment", "seoCard", "tripPlan", "bundle"]), targetId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await removeFavorite(ctx.user.id, input.targetType, input.targetId);
        return { success: true };
      }),
  }),

  collections: router({
    list: protectedProcedure.query(({ ctx }) => getUserCollections(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({ name: z.string(), description: z.string().optional(), coverImageUrl: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const id = await createCollection(ctx.user.id, input.name, input.description, input.coverImageUrl);
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), coverImageUrl: z.string().optional(), isPublic: z.boolean().optional() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCollection(id, data);
        return { success: true };
      }),
  }),

  // ─── Ambassador Program ─────────────────────────────────────────────
  ambassador: router({
    me: protectedProcedure.query(({ ctx }) => getAmbassadorByUserId(ctx.user.id)),
    join: protectedProcedure.mutation(async ({ ctx }) => {
      const existing = await getAmbassadorByUserId(ctx.user.id);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Déjà ambassadeur" });
      const code = `BAY-${ctx.user.id}-${Date.now().toString(36).toUpperCase()}`;
      const id = await createAmbassador(ctx.user.id, code);
      return { id, referralCode: code };
    }),
    referrals: protectedProcedure.query(async ({ ctx }) => {
      const amb = await getAmbassadorByUserId(ctx.user.id);
      if (!amb) return [];
      return getReferralsByAmbassador(amb.id);
    }),
    commissions: protectedProcedure.query(async ({ ctx }) => {
      const amb = await getAmbassadorByUserId(ctx.user.id);
      if (!amb) return [];
      return getCommissionPayments(amb.id, "ambassador");
    }),
    updatePayment: protectedProcedure
      .input(z.object({ paypalEmail: z.string().optional(), iban: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const amb = await getAmbassadorByUserId(ctx.user.id);
        if (!amb) throw new TRPCError({ code: "NOT_FOUND" });
        await updateAmbassador(amb.id, input);
        return { success: true };
      }),
    // Admin
    all: adminProcedure.query(() => getAllAmbassadors()),
  }),

  // ─── Commissions (Admin) ────────────────────────────────────────────
  commissions: router({
    list: adminProcedure
      .input(z.object({ recipientId: z.number().optional(), recipientType: z.string().optional() }).optional())
      .query(({ input }) => getCommissionPayments(input?.recipientId, input?.recipientType)),
    stats: adminProcedure.query(() => getAllCommissionStats()),
    create: adminProcedure
      .input(z.object({
        recipientType: z.enum(["ambassador", "partner", "influencer", "concierge"]),
        recipientId: z.number(), recipientName: z.string().optional(),
        sourceType: z.enum(["referral", "booking", "affiliation", "subscription"]),
        sourceId: z.number().optional(), amount: z.string(), currency: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createCommissionPayment(input);
        return { id };
      }),
  }),

  // ─── Service Providers (Prestataires) ───────────────────────────────
  providers: router({
    list: adminProcedure
      .input(z.object({ status: z.enum(["active", "pending", "suspended", "rejected"]).optional() }).optional())
      .query(({ input }) => getServiceProviders(input?.status)),
    create: adminProcedure
      .input(z.object({
        name: z.string(), slug: z.string(),
        category: z.enum(["hotel", "restaurant", "yacht", "chauffeur", "spa", "concierge_local", "concierge_international", "real_estate", "luxury_goods", "experience", "transport"]),
        contactName: z.string().optional(), contactEmail: z.string().optional(), contactPhone: z.string().optional(),
        city: z.string().optional(), country: z.string().optional(), website: z.string().optional(),
        description: z.string().optional(), commissionRate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createServiceProvider(input);
        return { id };
      }),
    update: adminProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input }) => {
        await updateServiceProvider(input.id, input.data);
        return { success: true };
      }),
  }),

  // ─── AI Command Center (Salle de Réunion) ──────────────────────────
  aiCommand: router({
    directives: adminProcedure
      .input(z.object({ department: z.string().optional() }).optional())
      .query(({ input }) => getAiDirectives(input?.department)),
    createDirective: adminProcedure
      .input(z.object({
        department: z.enum(["seo", "content", "acquisition", "concierge", "analytics", "all"]),
        directive: z.string(),
        priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createAiDirective({ ...input, authorId: ctx.user.id });
        return { id };
      }),
    updateDirective: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["active", "completed", "cancelled", "expired"]).optional(),
        aiResponse: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateAiDirective(id, data);
        return { success: true };
      }),
    reports: adminProcedure
      .input(z.object({ department: z.enum(["seo", "content", "acquisition", "concierge", "analytics"]).optional() }).optional())
      .query(({ input }) => getAiDepartmentReports(input?.department)),
    createReport: adminProcedure
      .input(z.object({
        department: z.enum(["seo", "content", "acquisition", "concierge", "analytics"]),
        reportDate: z.string(), summary: z.string(),
        metrics: z.string().optional(), alerts: z.string().optional(),
        status: z.enum(["healthy", "attention", "critical"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createAiDepartmentReport(input);
        return { id };
      }),
  }),

  // ─── Bundles ────────────────────────────────────────────────────────
  bundles: router({
    published: publicProcedure.query(() => getPublishedBundles()),
    all: adminProcedure.query(() => getAllBundles()),
    create: adminProcedure
      .input(z.object({
        slug: z.string(), title: z.string(), subtitle: z.string().optional(),
        description: z.string(), coverImageUrl: z.string().optional(),
        category: z.enum(["weekend", "honeymoon", "gastronomie", "aventure", "wellness", "culture", "business", "family", "seasonal"]),
        destination: z.string().optional(), duration: z.string().optional(),
        priceFrom: z.string().optional(), priceTo: z.string().optional(),
        includes: z.string().optional(), establishmentIds: z.string().optional(),
        accessLevel: z.enum(["free", "explorer", "premium", "elite"]).optional(),
        isVip: z.boolean().optional(), isFeatured: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createBundle({ ...input, status: "draft" });
        return { id };
      }),
    update: adminProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input }) => {
        await updateBundle(input.id, input.data);
        return { success: true };
      }),
  }),

  // ─── Content Calendar ──────────────────────────────────────────────
  content: router({
    calendar: adminProcedure
      .input(z.object({ status: z.enum(["idea", "generating", "review", "approved", "scheduled", "published", "failed"]).optional() }).optional())
      .query(({ input }) => getContentCalendar(input?.status)),
    create: adminProcedure
      .input(z.object({
        title: z.string(),
        contentType: z.enum(["blog_article", "instagram_post", "instagram_reel", "tiktok_video", "linkedin_post", "youtube_video", "twitter_post"]),
        platform: z.enum(["instagram", "tiktok", "linkedin", "twitter", "youtube", "blog"]),
        topic: z.string().optional(), brief: z.string().optional(),
        scheduledDate: z.string(), scheduledTime: z.string().optional(),
        status: z.enum(["idea", "generating", "review", "approved", "scheduled", "published", "failed"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createContentCalendarItem(input);
        return { id };
      }),
    update: adminProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input }) => {
        await updateContentCalendarItem(input.id, input.data);
        return { success: true };
      }),
  }),

  // ─── Field Reports (Rapports Terrain — Équipe) ──────────────────────
  fieldReports: router({
    // List reports for current team member
    getMyReports: teamProcedure.query(({ ctx }) => getFieldReportsByUser(ctx.user.id)),

    // Admin: list all reports
    getAll: adminProcedure.query(() => getAllFieldReports()),

    // Get full report with sub-data
    getById: teamProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const report = await getFieldReportById(input.id);
        if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Rapport non trouvé" });
        // Team members can only see their own reports, admins can see all
        if (ctx.user.role === "team" && report.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Accès non autorisé" });
        }
        const [services, journey, contacts, media] = await Promise.all([
          getFieldReportServices(report.id),
          getFieldReportJourneySteps(report.id),
          getFieldReportContacts(report.id),
          getFieldReportMediaItems(report.id),
        ]);
        return { ...report, services, journey, contacts, media };
      }),

    // Create new report
    create: teamProcedure
      .input(z.object({
        establishmentName: z.string().min(1),
        establishmentType: z.enum(["clinique", "hotel", "restaurant", "spa", "bar", "activite", "experience", "transport", "autre"]),
        specialty: z.string().optional(),
        city: z.string().min(1),
        country: z.string().min(1),
        region: z.string().optional(),
        address: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        googleMapsUrl: z.string().optional(),
        description: z.string().optional(),
        ambiance: z.string().optional(),
        highlights: z.string().optional(),
        languagesSpoken: z.string().optional(),
        paymentMethods: z.string().optional(),
        openingHours: z.string().optional(),
        website: z.string().optional(),
        personalAdvice: z.string().optional(),
        overallRating: z.number().min(1).max(5).optional(),
        wouldRecommend: z.boolean().optional(),
        targetClientele: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createFieldReport({ ...input, userId: ctx.user.id });
        return { id };
      }),

    // Update report
    update: teamProcedure
      .input(z.object({
        id: z.number(),
        data: z.record(z.string(), z.any()),
      }))
      .mutation(async ({ ctx, input }) => {
        const report = await getFieldReportById(input.id);
        if (!report) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role === "team" && report.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await updateFieldReport(input.id, input.data);
        return { success: true };
      }),

    // Submit for review
    submit: teamProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const report = await getFieldReportById(input.id);
        if (!report) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role === "team" && report.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await updateFieldReport(input.id, { status: "submitted", submittedAt: new Date() });
        await notifyOwner({ title: "Nouveau rapport terrain", content: `${ctx.user.name} a soumis un rapport pour ${report.establishmentName} à ${report.city}, ${report.country}` });
        return { success: true };
      }),

    // Admin: review report
    review: adminProcedure
      .input(z.object({
        id: z.number(),
        action: z.enum(["approve", "reject"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const status = input.action === "approve" ? "approved" : "rejected";
        await updateFieldReport(input.id, {
          status,
          adminNotes: input.notes || null,
          reviewedAt: new Date(),
        });
        return { success: true };
      }),

    // ─── Services (Prestations) ─────────────────────────────────────
    addService: teamProcedure
      .input(z.object({
        fieldReportId: z.number(),
        serviceName: z.string().min(1),
        serviceCategory: z.string().optional(),
        description: z.string().optional(),
        priceFrom: z.string().optional(),
        priceTo: z.string().optional(),
        currency: z.string().default("EUR"),
        isOnQuote: z.boolean().default(false),
        duration: z.string().optional(),
        includes: z.string().optional(),
        notes: z.string().optional(),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        const id = await addFieldReportService(input);
        return { id };
      }),

    removeService: teamProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteFieldReportService(input.id);
        return { success: true };
      }),

    // ─── Journey Steps (Parcours Transport) ─────────────────────────
    addJourneyStep: teamProcedure
      .input(z.object({
        fieldReportId: z.number(),
        stepOrder: z.number(),
        stepType: z.enum(["chauffeur", "avion", "train", "taxi", "transfert", "arrivee", "prise_en_charge", "prestation", "depart", "autre"]),
        title: z.string().min(1),
        description: z.string().optional(),
        fromLocation: z.string().optional(),
        toLocation: z.string().optional(),
        companyName: z.string().optional(),
        flightNumber: z.string().optional(),
        vehicleType: z.string().optional(),
        departureTime: z.string().optional(),
        arrivalTime: z.string().optional(),
        durationMinutes: z.number().optional(),
        estimatedCost: z.string().optional(),
        currency: z.string().default("EUR"),
        isIncluded: z.boolean().default(false),
        affiliateLink: z.string().optional(),
        bookingReference: z.string().optional(),
        notes: z.string().optional(),
        photoUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await addFieldReportJourneyStep(input);
        return { id };
      }),

    removeJourneyStep: teamProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteFieldReportJourneyStep(input.id);
        return { success: true };
      }),

    // ─── Contacts ───────────────────────────────────────────────────
    addContact: teamProcedure
      .input(z.object({
        fieldReportId: z.number(),
        contactName: z.string().min(1),
        role: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        whatsapp: z.string().optional(),
        languages: z.string().optional(),
        notes: z.string().optional(),
        isMainContact: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        const id = await addFieldReportContact(input);
        return { id };
      }),

    removeContact: teamProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteFieldReportContact(input.id);
        return { success: true };
      }),

    // ─── Media (Photos & Vidéos) ────────────────────────────────────
    addMedia: teamProcedure
      .input(z.object({
        fieldReportId: z.number(),
        type: z.enum(["photo", "video"]),
        url: z.string(),
        thumbnailUrl: z.string().optional(),
        caption: z.string().optional(),
        category: z.enum(["facade", "interieur", "prestation", "equipement", "chambre", "transport", "parcours", "equipe", "resultat", "vue", "repas", "autre"]).default("autre"),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        const id = await addFieldReportMediaItem(input);
        return { id };
      }),

    removeMedia: teamProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteFieldReportMediaItem(input.id);
        return { success: true };
      }),

    // ─── AI Enrichment ──────────────────────────────────────────────
    enrichWithAI: teamProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const report = await getFieldReportById(input.id);
        if (!report) throw new TRPCError({ code: "NOT_FOUND" });
        await updateFieldReport(input.id, { status: "ai_processing" });
        try {
          const { enrichFieldReport } = await import("./services/fieldReportEnricher");
          const enriched = await enrichFieldReport(report);
          await updateFieldReport(input.id, {
            aiEnrichedDescription: enriched.description,
            aiResearchNotes: JSON.stringify(enriched.research),
            aiRecommendation: enriched.recommendation,
            aiSeoData: JSON.stringify(enriched.seoData),
            status: "review",
          });
          return { success: true, enriched };
        } catch (err: any) {
          await updateFieldReport(input.id, { status: "submitted" });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
        }
      }),

    // ─── Upload endpoint ────────────────────────────────────────────
    getUploadUrl: teamProcedure
      .input(z.object({
        fileName: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import("./storage");
        const key = `field-reports/${ctx.user.id}/${Date.now()}-${input.fileName}`;
        // Return the key for client to use with direct upload
        return { key, uploadPath: `/api/upload/field-report` };
      }),
  }),
});
export type AppRouter = typeof appRouter;
