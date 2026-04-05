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
  getAdminStats, getUserById,
} from "./db";
import { generateConciergeResponse } from "./services/concierge";
import type { User } from "../drizzle/schema";
import { generateSeoCard, generateSocialContent } from "./services/seoGenerator";
import { dispatchTask } from "./services/agentBus";
import { notifyOwner } from "./_core/notification";
import { generateImage } from "./_core/imageGeneration";
import { transcribeAudio } from "./_core/voiceTranscription";

// Admin guard
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  // ─── Auth ──────────────────────────────────────────────────────────
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
    getConversations: protectedProcedure.query(({ ctx }) =>
      getUserConversations(ctx.user.id)
    ),

    createConversation: protectedProcedure
      .input(z.object({ title: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const id = await createConversation(ctx.user.id, input.title);
        return { id };
      }),

    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(({ input }) =>
        getConversationMessages(input.conversationId)
      ),

    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string().min(1).max(5000),
        isVoice: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check credits / free messages
        if (ctx.user.subscriptionTier === "free") {
          if (ctx.user.freeMessagesUsed >= 3) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Vous avez utilisé vos 3 messages gratuits. Passez au plan Premium (90€/mois) pour un accès illimité.",
            });
          }
          await incrementFreeMessages(ctx.user.id);
        }

        // Save user message
        await addMessage(input.conversationId, "user", input.content, undefined, input.isVoice);

        // Get conversation history
        const history = await getConversationMessages(input.conversationId, 20);
        const formattedHistory = history.map(m => ({ role: m.role, content: m.content }));

        // Generate AI response
        const aiResponse = await generateConciergeResponse(ctx.user.id, formattedHistory, input.content);

        // Save AI response
        await addMessage(input.conversationId, "assistant", aiResponse);

        return { content: aiResponse };
      }),

    transcribeVoice: protectedProcedure
      .input(z.object({ audioUrl: z.string() }))
      .mutation(async ({ input }) => {
        const result = await transcribeAudio({ audioUrl: input.audioUrl, language: "fr" });
        if ('error' in result) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error });
        }
        return { text: result.text };
      }),
  }),

  // ─── User Profile & Memory ────────────────────────────────────────
  profile: router({
    getPreferences: protectedProcedure.query(({ ctx }) =>
      getUserPreferences(ctx.user.id)
    ),

    updatePreference: protectedProcedure
      .input(z.object({
        category: z.string(),
        key: z.string(),
        value: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertPreference(ctx.user.id, input.category, input.key, input.value, "explicit");
        return { success: true };
      }),

    getCompanions: protectedProcedure.query(({ ctx }) =>
      getUserCompanions(ctx.user.id)
    ),

    addCompanion: protectedProcedure
      .input(z.object({
        name: z.string(),
        relationship: z.string().optional(),
        dietaryRestrictions: z.string().optional(),
        preferences: z.string().optional(),
        birthDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await addCompanion(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ─── SEO Cards (Public + Admin) ───────────────────────────────────
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
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id;
        const clickId = await trackAffiliateClick(input.partnerId, input.clickedUrl, input.seoCardId, userId);
        return { clickId };
      }),

    getDashboard: adminProcedure.query(async () => {
      const stats = await getAffiliateStats();
      return stats;
    }),
  }),

  // ─── Credits & Subscription ───────────────────────────────────────
  credits: router({
    getBalance: protectedProcedure.query(({ ctx }) => ({
      credits: ctx.user.credits,
      rollover: ctx.user.creditsRollover,
      tier: ctx.user.subscriptionTier,
      freeMessagesUsed: ctx.user.freeMessagesUsed,
    })),

    getHistory: protectedProcedure.query(({ ctx }) =>
      getCreditHistory(ctx.user.id)
    ),

    recharge: protectedProcedure
      .input(z.object({ amount: z.number().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const newBalance = await updateUserCredits(ctx.user.id, input.amount, "recharge", `Recharge de ${input.amount} crédits`);
        return { newBalance };
      }),
  }),

  // ─── Travel Itineraries ───────────────────────────────────────────
  itineraries: router({
    list: protectedProcedure.query(({ ctx }) =>
      getUserItineraries(ctx.user.id)
    ),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        destination: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        travelers: z.number().optional(),
        budget: z.string().optional(),
        conversationId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createItinerary({ userId: ctx.user.id, ...input });
        return { id };
      }),
  }),

  // ─── Social Media ─────────────────────────────────────────────────
  social: router({
    getPosts: adminProcedure.query(() => getSocialPosts()),

    generatePost: adminProcedure
      .input(z.object({
        seoCardId: z.number(),
        platform: z.enum(["instagram", "tiktok", "linkedin", "twitter"]),
        contentType: z.enum(["carousel", "reel", "story", "post", "script"]),
      }))
      .mutation(async ({ input }) => {
        const card = await getSeoCardBySlug(""); // We'll get by ID in a real impl
        const taskId = await dispatchTask("acquisition", "social_media", "generate_post", {
          platform: input.platform,
          contentType: input.contentType,
          cardId: input.seoCardId,
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
