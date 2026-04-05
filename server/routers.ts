import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
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
} from "./db";
import { generateConciergeResponse } from "./services/concierge";
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

    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string().min(1).max(5000),
        isVoice: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.subscriptionTier === "free") {
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
        await addMessage(input.conversationId, "assistant", aiResponse);
        return { content: aiResponse };
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
});

export type AppRouter = typeof appRouter;
