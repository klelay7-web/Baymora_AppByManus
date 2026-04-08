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
  getAdminStats, getRevenueStats, getUserById, updateUser,
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
  getAllUsers, updateUserRoleById,
  // LÉNA Workspace
  getAllSeoCardsAdmin, createSeoCardFromLena, updateSeoCardLenaDecision,
  createBundleFromLena, updateBundleLenaDecision, getAllBundlesAdmin,
  createDestinationFromChat, getUserDestinations, getDestinationById,
  updateDestinationLenaDecision, getAllDestinationsAdmin, getDestinationSavesAdmin,
  saveDestination, unsaveDestination, getUserSavedDestinations, getLenaCreatedContent,
  getPilotageMessages, addPilotageMessage,
} from "./db";
import { generateConciergeResponse, getWelcomeResponse } from "./services/concierge";
import { PLANS } from "./stripe/products";
import { sendEmail, previewEmail, triggerPartnerProspection, triggerAffiliateWelcome, triggerTeamWeeklyReport, sendBulkWeeklyPlans } from "./services/emailService";
import type { EmailType } from "./services/emailService";
import { callClaude, buildSystemPrompt, parseStructuredTags, type ClaudeMessage } from "./services/claudeService";
import { orchestrate } from "./services/ai/orchestrator";
import type { User } from "../drizzle/schema";
import { generateSeoCard, generateSocialContent } from "./services/seoGenerator";
import { dispatchTask } from "./services/agentBus";
import { notifyOwner } from "./_core/notification";
import { chatWithDG, generateDailyReport, getCarnetsDebord, getDGHistory, ORGANIGRAMME, STRATEGIE, BUDGET_MENSUEL } from "./services/dgService";
import {
  getClientProfile, upsertClientProfile,
  listCompanions, getCompanion, createCompanion, updateCompanion, deleteCompanion,
  listMyDestinations, listPublicDestinations, getDestination, createDestination, updateDestination, deleteDestination, saveDestinationForUser,
} from "./services/profileService";
import { generateImage } from "./_core/imageGeneration";
import { extractProfileFromMessage } from "./services/profileExtractor";
import { transcribeAudio } from "./_core/voiceTranscription";
import { chatWithLena, generateFicheWithLena } from "./services/ai/lenaService";
import type { LenaMessage, LenaSession } from "./services/ai/lenaService";
import { enrichEstablishment, runSeoEnrichmentCampaign, PRIORITY_CITIES, SEO_CATEGORIES } from "./services/ai/scrapingAgent";
import type { EstablishmentInput } from "./services/ai/scrapingAgent";
import { runSeoBundlePipeline, generateBlogArticle } from "./services/ai/bundlePipelineAgent";
import { generateSocialContentFromCity } from "./services/ai/creativeAgent";
import { extractProfileFromConversation, addAriaInstruction, getAriaInstructions, removeAriaInstruction } from "./services/ai/profileExtractor";
import { chatWithManus, delibererAriaEtManus, creerMission, MANUS_PROFILE, STRATEGIE_LANCEMENT } from "./services/ai/manusAgent";
import type { ManusMessage } from "./services/ai/manusAgent";
import { genererArticleBlog, genererPostSocial, genererCalendrierEditorial, rechercherVideoVirale } from "./services/ai/creativeAgent";
import { genererEmail, repondreCommentaire, gererMessagePrive, genererEmailProspection } from "./services/ai/communicationAgent";
import { rechercherPrestataires, genererStrategieAffiliation, analyserPartenaire, PROGRAMMES_AFFILIATION } from "./services/ai/affiliationAgent";
import { createMission, getActiveMission, getMissionHistory, addMissionProgress, closeMission, buildMissionContext } from "./services/missionService";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
  return next({ ctx });
});

const teamProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "team" && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux membres de l'équipe" });
  return next({ ctx });
});

// Owner procedure — accepte role admin OU ownerOpenId (robuste même si OWNER_OPEN_ID est vide)
const ownerProcedure = protectedProcedure.use(({ ctx, next }) => {
  const isOwner = ENV.ownerOpenId && ctx.user.openId === ENV.ownerOpenId;
  const OWNER_EMAILS = ["k.lelay7@gmail.com", "klelay7@gmail.com"];
  const isOwnerByEmail = OWNER_EMAILS.includes(ctx.user.email || "");
  const isAdmin = ctx.user.role === "admin";
  if (!isOwner && !isOwnerByEmail && !isAdmin) {
    console.log("[Manus DG] Access denied - user.openId:", ctx.user.openId, "ownerOpenId:", ENV.ownerOpenId, "role:", ctx.user.role);
    throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé au propriétaire" });
  }
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
        userLocation: z.object({
          city: z.string().optional(),
          country: z.string().optional(),
          lat: z.number().optional(),
          lng: z.number().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Owner & admin bypass: accès illimité
        const isOwner = ctx.user.openId === ENV.ownerOpenId;
        // Bypass par email pour le fondateur
        const OWNER_EMAILS = ["k.lelay7@gmail.com", "klelay7@gmail.com"];
        const isOwnerByEmail = OWNER_EMAILS.includes(ctx.user.email || "");
        const isPrivileged = isOwner || isOwnerByEmail || ctx.user.role === "admin";
        if (!isPrivileged && ctx.user.subscriptionTier === "free") {
          // ⚠️ NE PAS MODIFIER : 3 messages gratuits (aligné avec le frontend)
          if (ctx.user.freeMessagesUsed >= 3) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "UPGRADE_REQUIRED",
            });
          }
          await incrementFreeMessages(ctx.user.id);
        }

        // Ajouter le message utilisateur
        await addMessage(input.conversationId, "user", input.content, undefined, input.isVoice);

        // Auto-remplissage IA silencieux du profil (fire & forget)
        extractProfileFromMessage(ctx.user.id, input.content).catch(() => {});

        // Récupérer l'historique complet
        const history = await getConversationMessages(input.conversationId, 30);
        const messageIndex = history.filter(m => m.role === "user").length;

        // Construire le profil client pour le system prompt
        const [preferences, companions] = await Promise.all([
          getUserPreferences(ctx.user.id),
          getUserCompanions(ctx.user.id),
        ]);
        const clientProfile = {
          name: ctx.user.name?.split(" ")[0],
          preferences: preferences.map(p => ({ category: p.category, key: p.key, value: p.value })),
          companions: companions.map(c => ({ name: c.name, relationship: c.relationship || undefined, dietaryRestrictions: c.dietaryRestrictions || undefined })),
          homeCity: ctx.user.homeCity || undefined,
          homeCountry: ctx.user.homeCountry || undefined,
        };

        // Construire le system prompt dynamique avec profil client + géoloc réelle
        const systemPrompt = buildSystemPrompt(clientProfile, new Date(), input.userLocation || undefined);

        // Formater l'historique pour Claude (exclure le dernier message user déjà ajouté)
        const claudeMessages: ClaudeMessage[] = history
          .slice(0, -1) // Exclure le message qu'on vient d'ajouter
          .map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));
        claudeMessages.push({ role: "user", content: input.content });

        // Orchestrateur multi-agents FLASH/EXPLORE/EXCELLENCE
        const orchestratorResult = await orchestrate({
          userMessage: input.content,
          systemPrompt,
          history: claudeMessages.slice(0, -1),
          subscriptionTier: ctx.user.subscriptionTier || "free",
          messageIndex,
          userCity: ctx.user.homeCity || undefined,
        });
        const claudeResponse = { content: orchestratorResult.content, model: orchestratorResult.model };

        // Parser les tags structurés dans la réponse
        const parsed = parseStructuredTags(claudeResponse.content);

        // Stocker la réponse complète (avec tags) pour le frontend
        await addMessage(input.conversationId, "assistant", claudeResponse.content);

        // Retourner la réponse parsée au frontend
        return {
          rawContent: claudeResponse.content,
          cleanMessage: parsed.cleanMessage,
          places: parsed.places || [],
          map: parsed.map || null,
          journey: parsed.journey || null,
          gcal: parsed.gcal || [],
          booking: parsed.booking || [],
          quickReplies: parsed.qr || [],
          plan: parsed.plan || null,
          scenarios: parsed.scenarios || null,
          model: claudeResponse.model,
          // Legacy compatibility
          message: parsed.cleanMessage,
          establishments: (parsed.places || []).map((p: any) => ({
            name: p.name,
            type: p.type,
            city: p.city,
            country: p.country,
            description: p.description,
            priceRange: p.priceRange,
            rating: p.rating,
            coordinates: p.coordinates,
            imageUrl: p.imageUrl,
          })),
          tripSuggestion: null,
          action: null,
        };
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
    getRevenueStats: adminProcedure.query(() => getRevenueStats()),
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
    // Admin: get pending reports for review
    getPendingReviews: adminProcedure.query(async () => {
      const { drizzle } = await import("drizzle-orm/mysql2");
      const { eq, or, desc } = await import("drizzle-orm");
      const mysql = await import("mysql2/promise");
      const schema = await import("../drizzle/schema");
      const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
      const db = drizzle(conn);
      const reports = await db.select().from(schema.fieldReports)
        .where(or(eq(schema.fieldReports.status, "submitted"), eq(schema.fieldReports.status, "review")))
        .orderBy(desc(schema.fieldReports.submittedAt))
        .limit(50);
      await conn.end();
      return reports;
    }),
    review: adminProcedure
      .input(z.object({
        id: z.number(),
        action: z.enum(["approve", "reject"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const status = input.action === "approve" ? "approved" : "rejected";
        const report = await getFieldReportById(input.id);
        if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Rapport non trouvé" });
        await updateFieldReport(input.id, {
          status,
          adminNotes: input.notes || null,
          reviewedAt: new Date(),
        });
        // Notification automatique à l'opérateur terrain
        if (report.userId) {
          const { drizzle } = await import("drizzle-orm/mysql2");
          const mysql = await import("mysql2/promise");
          const schema = await import("../drizzle/schema");
          const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
          const db = drizzle(conn);
          const notifContent = input.action === "approve"
            ? `✅ Votre fiche "${report.establishmentName}" a été approuvée et est maintenant publiée.${input.notes ? ` Note : ${input.notes}` : ""}`
            : `❌ Votre fiche "${report.establishmentName}" a été rejetée.${input.notes ? ` Motif : ${input.notes}` : " Veuillez la corriger et la soumettre à nouveau."}` ;
          await db.insert(schema.operatorMessages).values({
            fromUserId: ctx.user.id,
            toUserId: report.userId,
            content: notifContent,
            isRead: false,
          });
          await conn.end();
        }
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
    getMedia: teamProcedure
      .input(z.object({ fieldReportId: z.number() }))
      .query(async ({ input }) => {
        return getFieldReportMediaItems(input.fieldReportId);
      }),
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

  // ─── Email Center ─────────────────────────────────────────────────
  email: router({
    // Envoyer un email manuel (admin)
    send: adminProcedure
      .input(z.object({
        type: z.enum(["welcome", "subscription_confirmed", "subscription_reminder_3d", "subscription_reminder_7d", "weekly_plans", "partner_prospection", "affiliate_welcome", "client_followup_30d", "team_weekly_report", "feature_unlock_confirmed"]),
        recipientEmail: z.string().email(),
        recipientName: z.string().optional(),
        planName: z.string().optional(),
        city: z.string().optional(),
        companyName: z.string().optional(),
        partnerType: z.string().optional(),
        customData: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await sendEmail(input.type as EmailType, {
          recipientEmail: input.recipientEmail,
          recipientName: input.recipientName,
          planName: input.planName,
          city: input.city,
          companyName: input.companyName,
          partnerType: input.partnerType,
          customData: input.customData,
        });
        return result;
      }),

    // Prévisualiser un email (sans envoi)
    preview: adminProcedure
      .input(z.object({
        type: z.enum(["welcome", "subscription_confirmed", "subscription_reminder_3d", "subscription_reminder_7d", "weekly_plans", "partner_prospection", "affiliate_welcome", "client_followup_30d", "team_weekly_report", "feature_unlock_confirmed"]),
        recipientEmail: z.string().email().optional(),
        recipientName: z.string().optional(),
        planName: z.string().optional(),
        city: z.string().optional(),
        companyName: z.string().optional(),
        partnerType: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const content = await previewEmail(input.type as EmailType, {
          recipientEmail: input.recipientEmail || "preview@maisonbaymora.com",
          recipientName: input.recipientName || "Membre Baymora",
          planName: input.planName,
          city: input.city || "Paris",
          companyName: input.companyName,
          partnerType: input.partnerType,
        });
        return content;
      }),

    // Campagne bons plans (bulk)
    sendWeeklyPlans: adminProcedure
      .input(z.object({
        testMode: z.boolean().optional(),
        testEmail: z.string().email().optional(),
      }))
      .mutation(async ({ input }) => {
        if (input.testMode && input.testEmail) {
          const result = await sendEmail("weekly_plans", {
            recipientEmail: input.testEmail,
            recipientName: "Test",
            city: "Paris",
          });
          return { sent: result.success ? 1 : 0, failed: result.success ? 0 : 1 };
        }
        // En production : récupérer tous les membres actifs
        return { sent: 0, failed: 0, message: "Campagne planifiée" };
      }),

    // Prospection partenaire
    prospectPartner: adminProcedure
      .input(z.object({
        email: z.string().email(),
        companyName: z.string(),
        partnerType: z.string(),
      }))
      .mutation(async ({ input }) => {
        return triggerPartnerProspection(input);
      }),

    // Rapport équipe hebdo
    sendTeamReport: adminProcedure
      .input(z.object({
        teamEmail: z.string().email(),
        stats: z.record(z.string(), z.number()),
      }))
      .mutation(async ({ input }) => {
        return triggerTeamWeeklyReport(input.teamEmail, input.stats as Record<string, number>);
      }),
  }),
  // ─── Pilotage (Manus DG — Owner Only) ──────────────────────────────────────────
  pilotage: router({
    // Chat avec Manus DG
    chat: ownerProcedure
      .input(z.object({ message: z.string().min(1).max(4000) }))
      .mutation(async ({ input }) => {
        const adminStats = await getAdminStats();
        const stats = {
          totalUsers: adminStats.totalUsers,
          premiumUsers: adminStats.premiumUsers,
          eliteUsers: 0,
          totalCards: adminStats.totalCards,
          publishedCards: adminStats.publishedCards,
          totalEstablishments: adminStats.totalEstablishments,
          totalTripPlans: adminStats.totalTripPlans,
          recentConversations: 0,
        };
        // Injecter le contexte de la mission active dans le message
        const missionCtx = await buildMissionContext();
        const enrichedMessage = missionCtx
          ? `${missionCtx}\n\n---\n\nMessage du fondateur : ${input.message}`
          : input.message;
        return chatWithDG(enrichedMessage, stats);
      }),
    // Rapport journalier
    dailyReport: ownerProcedure
      .mutation(async () => {
        const adminStats = await getAdminStats();
        const stats = {
          totalUsers: adminStats.totalUsers,
          premiumUsers: adminStats.premiumUsers,
          eliteUsers: 0,
          totalCards: adminStats.totalCards,
          publishedCards: adminStats.publishedCards,
          totalEstablishments: adminStats.totalEstablishments,
          totalTripPlans: adminStats.totalTripPlans,
          recentConversations: 0,
        };
        return generateDailyReport(stats);
      }),
    // Historique des messages
    history: ownerProcedure
      .query(async () => getDGHistory(60)),
    // Carnet de bord (rapports + alertes)
    carnetsDebord: ownerProcedure
      .query(async () => getCarnetsDebord(20)),
    // Organigramme
    organigramme: ownerProcedure
      .query(async () => ORGANIGRAMME),
    // Stratégie
    strategie: ownerProcedure
      .query(async () => STRATEGIE),
    // Budget
    budget: ownerProcedure
      .query(async () => BUDGET_MENSUEL),
    // Stats consolidées
    stats: ownerProcedure
      .query(async () => {
        const adminStats = await getAdminStats();
        const revenueStats = await getRevenueStats();
        return { ...adminStats, ...revenueStats };
      }),
    // Liste tous les utilisateurs
    listUsers: ownerProcedure
      .query(async () => getAllUsers()),
    // Mettre à jour le rôle d'un utilisateur
    updateUserRole: ownerProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "team", "admin"]) }))
      .mutation(async ({ input }) => updateUserRoleById(input.userId, input.role)),

    // ─── Missions 24h ────────────────────────────────────────────────────
    // Créer une nouvelle mission
    createMission: ownerProcedure
      .input(z.object({
        title: z.string().min(1).max(256),
        content: z.string().min(10),
        priority: z.enum(["normal", "high", "urgent"]).default("normal"),
        durationHours: z.number().min(1).max(168).default(24),
      }))
      .mutation(async ({ ctx, input }) => {
        return createMission({ ...input, authorId: ctx.user.id });
      }),
    // Mission active
    activeMission: ownerProcedure
      .query(async () => getActiveMission()),
    // Historique des missions
    missionHistory: ownerProcedure
      .input(z.object({ limit: z.number().default(20) }).optional())
      .query(async ({ input }) => getMissionHistory(input?.limit ?? 20)),
    // Ajouter une note de progression
    addMissionProgress: ownerProcedure
      .input(z.object({
        missionId: z.number(),
        note: z.string().min(1),
        agent: z.string().optional(),
        completedTasks: z.number().optional(),
        totalTasks: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await addMissionProgress(input.missionId, input.note, input.agent, input.completedTasks, input.totalTasks);
        return { success: true };
      }),
    // Clôturer une mission avec compte-rendu Manus DG
    closeMission: ownerProcedure
      .input(z.object({
        missionId: z.number(),
        status: z.enum(["completed", "cancelled"]).default("completed"),
      }))
      .mutation(async ({ input }) => closeMission(input.missionId, input.status)),
  }),

  // ─── LÉNA — Assistante Terrain IA ──────────────────────────────────────────
  lena: router({
    // Chat guidé avec LÉNA (binôme Claude+Scout)
    chat: teamProcedure
      .input(z.object({
        message: z.string().min(1).max(5000),
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).default([]),
        session: z.object({
          fieldReportId: z.number().optional(),
          establishmentName: z.string().optional(),
          city: z.string().optional(),
          currentStep: z.enum(["ACCUEIL", "COLLECTE_BASE", "AMBIANCE", "OFFRE", "PRATIQUE", "ANECDOTES", "PHOTOS", "SCOUT_RECHERCHE", "CONSTRUCTION_FICHE", "VALIDATION_ARIA", "PUBLIEE"]).default("ACCUEIL"),
          collectedData: z.record(z.string(), z.any()).default({}),
          scoutBriefing: z.string().optional(),
        }).default({ currentStep: "ACCUEIL", collectedData: {} }),
      }))
      .mutation(async ({ ctx, input }) => {
        const response = await chatWithLena(
          ctx.user.id,
          input.message,
          input.history as LenaMessage[],
          input.session as LenaSession
        );
        return response;
      }),

    // Génération automatique de fiche complète
    generateFiche: teamProcedure
      .input(z.object({
        establishmentName: z.string().min(1),
        city: z.string().min(1),
        collectedData: z.record(z.string(), z.any()).default({}),
      }))
      .mutation(async ({ input }) => {
        const fiche = await generateFicheWithLena(
          input.establishmentName,
          input.city,
          input.collectedData
        );
        return { fiche };
      }),

    // Transcription vocale pour LÉNA (Amine parle, LÉNA transcrit)
    transcribeForLena: teamProcedure
      .input(z.object({ audioUrl: z.string() }))
      .mutation(async ({ input }) => {
        const result = await transcribeAudio({ audioUrl: input.audioUrl, language: "fr", prompt: "Rapport terrain établissement luxe" });
        if ('error' in result) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error });
        return { text: result.text };
      }),

    // ─── Sauvegarder une fiche SEO créée par LÉNA
    saveFiche: teamProcedure
      .input(z.object({
        slug: z.string().min(1),
        title: z.string().min(1),
        subtitle: z.string().optional(),
        category: z.enum(["restaurant", "hotel", "activity", "bar", "spa", "guide", "experience"]),
        city: z.string().min(1),
        country: z.string().min(1),
        region: z.string().optional(),
        description: z.string().min(1),
        highlights: z.string().optional(),
        practicalInfo: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        tags: z.string().optional(),
        rating: z.string().optional(),
        imageUrl: z.string().optional(),
        affiliateLinks: z.string().optional(),
        fieldReportId: z.number().optional(),
        sourceType: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createSeoCardFromLena(input);
        return { success: true, id };
      }),

    // ─── Décision LÉNA sur une fiche (vérifier, publier, archiver)
    decideFiche: adminProcedure
      .input(z.object({
        id: z.number(),
        isVerified: z.boolean().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        fieldReportId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateSeoCardLenaDecision(id, data);
        return { success: true };
      }),

    // ─── Sauvegarder un bundle créé par LÉNA
    saveBundle: teamProcedure
      .input(z.object({
        slug: z.string().min(1),
        title: z.string().min(1),
        subtitle: z.string().optional(),
        description: z.string().min(1),
        category: z.enum(["weekend", "honeymoon", "gastronomie", "aventure", "wellness", "culture", "business", "family", "seasonal"]),
        destination: z.string().optional(),
        duration: z.string().optional(),
        priceFrom: z.string().optional(),
        priceTo: z.string().optional(),
        includes: z.string().optional(),
        establishmentIds: z.string().optional(),
        seoCardIds: z.string().optional(),
        fieldReportIds: z.string().optional(),
        accessLevel: z.enum(["free", "explorer", "premium", "elite"]).optional(),
        coverImageUrl: z.string().optional(),
        sourceType: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createBundleFromLena(input);
        return { success: true, id };
      }),

    // ─── Décision LÉNA sur un bundle
    decideBundle: adminProcedure
      .input(z.object({
        id: z.number(),
        isVerified: z.boolean().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        seoCardIds: z.string().optional(),
        fieldReportIds: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateBundleLenaDecision(id, data);
        return { success: true };
      }),

    // ─── Sauvegarder un parcours depuis le chat IA
    saveParcours: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        destination: z.string().optional(),
        country: z.string().optional(),
        tripType: z.enum(["leisure", "business", "romantic", "family", "staycation", "adventure", "wellness"]).optional(),
        budget: z.enum(["economique", "confort", "premium", "luxe"]).optional(),
        duration: z.number().optional(),
        steps: z.string().optional(),
        highlights: z.string().optional(),
        tips: z.string().optional(),
        coverImageUrl: z.string().optional(),
        tags: z.string().optional(),
        sourceConversationId: z.number().optional(),
        isLenaGenerated: z.boolean().optional(),
        lenaSessionId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createDestinationFromChat(ctx.user.id, input);
        return { success: true, id };
      }),

    // ─── Mes parcours sauvegardés
    myParcours: protectedProcedure.query(async ({ ctx }) => {
      return getUserDestinations(ctx.user.id);
    }),

    // ─── Parcours sauvegardés par d'autres (enregistrements)
    savedParcours: protectedProcedure.query(async ({ ctx }) => {
      return getUserSavedDestinations(ctx.user.id);
    }),

    // ─── Enregistrer / désenregistrer un parcours
    toggleSave: protectedProcedure
      .input(z.object({ destinationId: z.number(), save: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        if (input.save) {
          await saveDestination(ctx.user.id, input.destinationId);
        } else {
          await unsaveDestination(ctx.user.id, input.destinationId);
        }
        return { success: true };
      }),

    // ─── Décision LÉNA sur un parcours (garder, supprimer, convertir)
    decideParcours: adminProcedure
      .input(z.object({
        id: z.number(),
        lenaDecision: z.enum(["pending", "keep", "delete", "convert_bundle", "convert_seocard"]),
        lenaDecisionNotes: z.string().optional(),
        isVerified: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...decision } = input;
        await updateDestinationLenaDecision(id, decision);
        return { success: true };
      }),

    // ─── Vue admin : tout le contenu LÉNA
    adminContent: adminProcedure.query(async () => {
      const [lenaContent, allFiches, allBundles, allParcours, saves] = await Promise.all([
        getLenaCreatedContent(),
        getAllSeoCardsAdmin(),
        getAllBundlesAdmin(),
        getAllDestinationsAdmin(),
        getDestinationSavesAdmin(),
      ]);
      return { lenaContent, allFiches, allBundles, allParcours, saves };
    }),
  }),
  // ─── Profile Enrichii ─────────────────────────────────────────────────────────
  profileEnriched: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getClientProfile(ctx.user.id);
    }),
    update: protectedProcedure
      .input(z.object({
        pseudo: z.string().max(64).optional(),
        mode: z.enum(["signature", "fantome"]).optional(),
        // Identité
        birthDate: z.string().max(10).optional(),
        gender: z.string().max(32).optional(),
        nationality: z.string().max(64).optional(),
        locale: z.string().max(8).optional(),
        // Morphologie
        height: z.number().optional(),
        weight: z.number().optional(),
        shoeSize: z.string().max(8).optional(),
        clothingSizeTop: z.string().max(16).optional(),
        clothingSizeBottom: z.string().max(16).optional(),
        clothingSizeDress: z.string().max(16).optional(),
        clothingSizeSuit: z.string().max(16).optional(),
        ringSize: z.string().max(8).optional(),
        // Permis
        drivingLicenses: z.string().optional(),
        drivingSide: z.string().max(16).optional(),
        transmissionPref: z.string().max(16).optional(),
        carPrefLuxury: z.string().optional(),
        carPrefDaily: z.string().optional(),
        // Logement
        homeCity: z.string().max(128).optional(),
        homeAddress: z.string().optional(),
        lodgingTypes: z.string().optional(),
        lodgingSettings: z.string().optional(),
        lodgingAmenities: z.string().optional(),
        lodgingLocation: z.string().optional(),
        transportPref: z.string().optional(),
        // Aéroport
        preferredAirport: z.string().max(16).optional(),
        airportLounge: z.boolean().optional(),
        priorityLane: z.boolean().optional(),
        passportCountry: z.string().max(64).optional(),
        seatPreference: z.string().max(32).optional(),
        cabinClass: z.string().max(32).optional(),
        frequentFlyerPrograms: z.string().optional(),
        // Style
        favoriteColors: z.string().optional(),
        favoriteBrands: z.string().optional(),
        favoriteShops: z.string().optional(),
        dresscode: z.enum(["casual", "smart_casual", "chic", "formel"]).optional(),
        smoking: z.enum(["non_fumeur", "fumeur", "cigare", "vape"]).optional(),
        ecofriendly: z.boolean().optional(),
        // Gastronomie
        favoriteCuisines: z.string().optional(),
        favoriteDishes: z.string().optional(),
        dietRegime: z.string().optional(),
        dietAllergies: z.string().optional(),
        dietOther: z.string().optional(),
        favoriteAlcohol: z.string().optional(),
        favoriteWines: z.string().optional(),
        coffeeTea: z.string().max(64).optional(),
        // Santé
        visionStatus: z.string().max(64).optional(),
        visionDetails: z.string().optional(),
        healthConditions: z.string().optional(),
        handicap: z.string().optional(),
        travelMobility: z.string().max(32).optional(),
        sleepPreference: z.string().max(128).optional(),
        tempPreference: z.string().max(64).optional(),
        wellnessPrefs: z.string().optional(),
        // Animaux
        pets: z.string().optional(),
        // Famille
        relationshipStatus: z.string().max(32).optional(),
        partnerGender: z.string().max(32).optional(),
        partnerName: z.string().max(128).optional(),
        partnerBirthDate: z.string().max(10).optional(),
        children: z.string().optional(),
        closeFriends: z.string().optional(),
        // Religion
        religiousConsiderations: z.string().max(128).optional(),
        // Clubs
        clubMemberships: z.string().optional(),
        privateAviation: z.string().optional(),
        yachtBoat: z.string().optional(),
        conciergePreference: z.string().max(128).optional(),
        // Lieux
        favoriteCities: z.string().optional(),
        favoritePlaces: z.string().optional(),
        favoriteQuotes: z.string().optional(),
        bucketList: z.string().optional(),
        // Voyage
        travelStyles: z.string().optional(),
        travelBudget: z.string().max(32).optional(),
        travelGroup: z.string().max(32).optional(),
        languages: z.string().optional(),
        // Notes
        freeNotes: z.string().optional(),
        // Gamification
        profileCompletionPct: z.number().optional(),
        profilePointsEarned: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertClientProfile(ctx.user.id, input as any);
        return { success: true };
      }),
  }),

  // ─── Companions (Cercle Proche) ───────────────────────────────────────────────
  companions: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return listCompanions(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getCompanion(input.id, ctx.user.id);
      }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(128),
        relationship: z.enum(["conjoint", "enfant", "parent", "ami", "collegue", "autre"]).optional(),
        birthDate: z.string().max(10).optional(),
        avatarUrl: z.string().optional(),
        dietRegime: z.string().optional(),
        dietAllergies: z.string().optional(),
        dietOther: z.string().optional(),
        travelStyles: z.string().optional(),
        travelBudget: z.enum(["economique", "confort", "premium", "luxe", "sans_limite"]).optional(),
        travelMobility: z.enum(["aucune", "pmr", "reduite", "poussette"]).optional(),
        languages: z.string().optional(),
        pet: z.enum(["aucun", "chien", "chat", "autre"]).optional(),
        smoking: z.enum(["non_fumeur", "fumeur", "cigare", "vape"]).optional(),
        clothingSize: z.string().max(16).optional(),
        shoeSize: z.string().max(8).optional(),
        favoriteAlcohol: z.string().max(128).optional(),
        favoriteCuisine: z.string().max(256).optional(),
        freeNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createCompanion(ctx.user.id, input);
        return { success: true, id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(128).optional(),
        relationship: z.enum(["conjoint", "enfant", "parent", "ami", "collegue", "autre"]).optional(),
        birthDate: z.string().max(10).optional(),
        avatarUrl: z.string().optional(),
        dietRegime: z.string().optional(),
        dietAllergies: z.string().optional(),
        dietOther: z.string().optional(),
        travelStyles: z.string().optional(),
        travelBudget: z.enum(["economique", "confort", "premium", "luxe", "sans_limite"]).optional(),
        travelMobility: z.enum(["aucune", "pmr", "reduite", "poussette"]).optional(),
        languages: z.string().optional(),
        pet: z.enum(["aucun", "chien", "chat", "autre"]).optional(),
        smoking: z.enum(["non_fumeur", "fumeur", "cigare", "vape"]).optional(),
        clothingSize: z.string().max(16).optional(),
        shoeSize: z.string().max(8).optional(),
        favoriteAlcohol: z.string().max(128).optional(),
        favoriteCuisine: z.string().max(256).optional(),
        freeNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateCompanion(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteCompanion(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── User Destinations (Parcours Personnels) ──────────────────────────────────
  destinations: router({
    listMine: protectedProcedure.query(async ({ ctx }) => {
      return listMyDestinations(ctx.user.id);
    }),
    listPublic: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
      .query(async ({ input }) => {
        return listPublicDestinations(input?.limit ?? 20);
      }),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getDestination(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(256),
        description: z.string().optional(),
        coverImageUrl: z.string().optional(),
        tags: z.string().optional(),
        tripType: z.enum(["leisure", "business", "romantic", "family", "staycation", "adventure", "wellness"]).optional(),
        budget: z.enum(["economique", "confort", "premium", "luxe"]).optional(),
        duration: z.number().optional(),
        destination: z.string().max(256).optional(),
        country: z.string().max(128).optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        steps: z.string().optional(),
        highlights: z.string().optional(),
        tips: z.string().optional(),
        visibility: z.enum(["private", "family", "public"]).default("private"),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createDestination(ctx.user.id, input);
        return { success: true, id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(256).optional(),
        description: z.string().optional(),
        coverImageUrl: z.string().optional(),
        tags: z.string().optional(),
        tripType: z.enum(["leisure", "business", "romantic", "family", "staycation", "adventure", "wellness"]).optional(),
        budget: z.enum(["economique", "confort", "premium", "luxe"]).optional(),
        duration: z.number().optional(),
        destination: z.string().max(256).optional(),
        country: z.string().max(128).optional(),
        steps: z.string().optional(),
        highlights: z.string().optional(),
        tips: z.string().optional(),
        visibility: z.enum(["private", "family", "public"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateDestination(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteDestination(input.id, ctx.user.id);
        return { success: true };
      }),
    save: protectedProcedure
      .input(z.object({ destinationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await saveDestinationForUser(ctx.user.id, input.destinationId);
        return { success: true };
      }),
  }),
  // ─── CAMPAGNE SEO — Enrichissement MANUS+LÉNA ─────────────────────────────
  campaign: router({
    // Enrichir un seul établissement
    enrichOne: ownerProcedure
      .input(z.object({ establishmentId: z.number() }))
      .mutation(async ({ input }) => {
        const estab = await getEstablishmentById(input.establishmentId);
        if (!estab) throw new TRPCError({ code: "NOT_FOUND", message: "\u00c9tablissement introuvable" });
        const ficheInput: EstablishmentInput = { id: estab.id, name: estab.name, city: estab.city, category: estab.category, address: estab.address ?? undefined };
        const fiche = await enrichEstablishment(ficheInput);
        const id = await createSeoCard({
          slug: fiche.slug, title: fiche.title, subtitle: fiche.subtitle ?? null,
          category: fiche.category, city: fiche.city, country: fiche.country ?? "France",
          region: fiche.region ?? null, description: fiche.description,
          highlights: JSON.stringify(fiche.highlights), practicalInfo: JSON.stringify(fiche.practicalInfo),
          metaTitle: fiche.metaTitle, metaDescription: fiche.metaDescription,
          imageUrl: fiche.imageUrl ?? null, galleryUrls: JSON.stringify(fiche.galleryUrls ?? []),
          rating: fiche.rating ?? null, priceLevel: fiche.priceLevel ?? null,
          tags: JSON.stringify(fiche.tags ?? []), status: "draft",
          generatedBy: "MANUS+L\u00c9NA", isVerified: false, lenaCreated: true,
          sourceType: "manus_scraping", schemaOrg: null, affiliateLinks: null,
          viewCount: 0, publishedAt: null, fieldReportId: null,
        });
        return { success: true, id, fiche };
      }),

    // Lancer la campagne sur plusieurs établissements
    runCampaign: ownerProcedure
      .input(z.object({ establishmentIds: z.array(z.number()).min(1).max(10) }))
      .mutation(async ({ input }) => {
        const establishments: EstablishmentInput[] = [];
        for (const eid of input.establishmentIds) {
          const estab = await getEstablishmentById(eid);
          if (estab) establishments.push({ id: estab.id, name: estab.name, city: estab.city, category: estab.category, address: estab.address ?? undefined });
        }
        const results = await runSeoEnrichmentCampaign(establishments);
        const saved: { id: number; name: string; ficheId?: number; status: string }[] = [];
        for (const result of results) {
          if (result.status === "success" && result.fiche) {
            try {
              const ficheId = await createSeoCard({
                slug: result.fiche.slug, title: result.fiche.title, subtitle: result.fiche.subtitle ?? null,
                category: result.fiche.category, city: result.fiche.city, country: result.fiche.country ?? "France",
                region: result.fiche.region ?? null, description: result.fiche.description,
                highlights: JSON.stringify(result.fiche.highlights), practicalInfo: JSON.stringify(result.fiche.practicalInfo),
                metaTitle: result.fiche.metaTitle, metaDescription: result.fiche.metaDescription,
                imageUrl: result.fiche.imageUrl ?? null, galleryUrls: JSON.stringify(result.fiche.galleryUrls ?? []),
                rating: result.fiche.rating ?? null, priceLevel: result.fiche.priceLevel ?? null,
                tags: JSON.stringify(result.fiche.tags ?? []), status: "draft",
                generatedBy: "MANUS+L\u00c9NA", isVerified: false, lenaCreated: true,
                sourceType: "manus_scraping", schemaOrg: null, affiliateLinks: null,
                viewCount: 0, publishedAt: null, fieldReportId: null,
              });
              saved.push({ id: result.establishmentId, name: result.establishmentName, ficheId, status: "success" });
            } catch { saved.push({ id: result.establishmentId, name: result.establishmentName, status: "error_save" }); }
          } else {
            saved.push({ id: result.establishmentId, name: result.establishmentName, status: result.status });
          }
        }
        return { results, saved, total: results.length, success: saved.filter(s => s.status === "success").length };
      }),

    // Liste des établissements disponibles
    listEstablishments: ownerProcedure.query(async () => getAllEstablishments()),

    // Liste des villes prioritaires
    listCities: ownerProcedure.query(async () => PRIORITY_CITIES),

    // Liste des catégories SEO
    listCategories: ownerProcedure.query(async () => SEO_CATEGORIES),

    // Pipeline complet par ville : SEO → Bundle → Parcours
    runCityPipeline: ownerProcedure
      .input(z.object({
        city: z.string().min(1),
        country: z.string().min(1),
        region: z.string().default(""),
        maxFichesPerCategory: z.number().min(1).max(5).default(2),
        selectedCategories: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const categories = input.selectedCategories
          ? SEO_CATEGORIES.filter(c => input.selectedCategories!.includes(c.key))
          : SEO_CATEGORIES.slice(0, 6);

        const savedFiches: Array<{ id: number; title: string; category: string }> = [];

        for (const cat of categories) {
          const ficheCount = Math.min(cat.count, input.maxFichesPerCategory);
          for (let i = 0; i < ficheCount; i++) {
            try {
              const estab: EstablishmentInput = {
                id: 0,
                name: `${cat.label} — ${input.city} #${i + 1}`,
                city: input.city,
                category: cat.key,
              };
              const fiche = await enrichEstablishment(estab);
              const ficheId = await createSeoCard({
                slug: fiche.slug + `-${Date.now()}`,
                title: fiche.title,
                subtitle: fiche.subtitle ?? null,
                category: fiche.category,
                city: input.city,
                country: input.country,
                region: input.region || null,
                description: fiche.description,
                highlights: JSON.stringify(fiche.highlights),
                practicalInfo: JSON.stringify(fiche.practicalInfo),
                metaTitle: fiche.metaTitle,
                metaDescription: fiche.metaDescription,
                imageUrl: fiche.imageUrl ?? null,
                galleryUrls: JSON.stringify(fiche.galleryUrls ?? []),
                rating: fiche.rating ?? null,
                priceLevel: fiche.priceLevel ?? null,
                tags: JSON.stringify(fiche.tags ?? []),
                status: "draft",
                generatedBy: "lena",
                isVerified: false,
                lenaCreated: true,
                sourceType: "ai_auto",
                schemaOrg: null,
                affiliateLinks: null,
                viewCount: 0,
                publishedAt: null,
                fieldReportId: null,
              });
              savedFiches.push({ id: ficheId, title: fiche.title, category: cat.key });
            } catch (err) {
              console.error(`[Pipeline] Erreur fiche ${cat.key}:`, err);
            }
          }
        }

        const allSeoCards = await getAllSeoCards();
        const citySeoCards = allSeoCards
          .filter(c => c.city?.toLowerCase() === input.city.toLowerCase())
          .map(c => ({
            id: c.id,
            title: c.title,
            category: c.category,
            city: c.city,
            country: c.country,
            priceLevel: String(c.priceLevel ?? "upscale"),
            rating: c.rating != null ? Number(c.rating) : undefined,
            description: c.description,
            highlights: c.highlights ?? undefined,
            tags: c.tags ?? undefined,
          }));

        const bundlePipeline = await runSeoBundlePipeline(input.city, input.country, citySeoCards);
        const savedBundles: Array<{ title: string; budgetTarget: string; bundleId?: number }> = [];

        for (const { bundle } of bundlePipeline.bundles) {
          try {
            const bundleId = await createBundle({
              slug: bundle.slug + `-${Date.now()}`,
              title: bundle.title,
              subtitle: bundle.subtitle ?? null,
              description: bundle.description,
              category: bundle.category,
              destination: bundle.destination,
              duration: bundle.duration,
              priceFrom: bundle.priceFrom,
              priceTo: bundle.priceTo,
              currency: bundle.currency,
              includes: JSON.stringify(bundle.includes),
              status: "draft",
              isVip: bundle.isVip,
              accessLevel: bundle.accessLevel,
              tags: JSON.stringify(bundle.tags),
              coverImage: null,
              seoCardIds: JSON.stringify(bundle.seoCardIds),
              cityFocus: bundle.cityFocus,
              lenaCreated: true,
              isVerified: false,
              budgetTarget: bundle.budgetTarget,
            });
            savedBundles.push({ title: bundle.title, budgetTarget: bundle.budgetTarget, bundleId: bundleId ?? undefined });
          } catch (err) {
            console.error(`[Pipeline] Erreur bundle ${bundle.budgetTarget}:`, err);
            savedBundles.push({ title: bundle.title, budgetTarget: bundle.budgetTarget });
          }
        }

        return {
          success: true,
          city: input.city,
          fichesCreated: savedFiches.length,
          bundlesCreated: savedBundles.filter(b => b.bundleId).length,
          savedFiches,
          savedBundles,
          totalDuration: bundlePipeline.totalDuration,
        };
      }),

    // Générer un article blog SEO pour une ville
    generateBlogForCity: ownerProcedure
      .input(z.object({ city: z.string(), country: z.string() }))
      .mutation(async ({ input }) => {
        const allSeoCards = await getAllSeoCards();
        const citySeoCards = allSeoCards
          .filter(c => c.city?.toLowerCase() === input.city.toLowerCase())
          .map(c => ({ id: c.id, title: c.title, category: c.category, city: c.city, country: c.country, priceLevel: String(c.priceLevel ?? "upscale"), rating: c.rating != null ? Number(c.rating) : undefined, description: c.description, highlights: c.highlights ?? undefined, tags: c.tags ?? undefined }));
        const article = await generateBlogArticle(
          input.city, input.country, citySeoCards,
          [`expériences luxe ${input.city}`, `meilleurs restaurants ${input.city}`, `hôtels luxe ${input.city}`, `guide ${input.city} premium`, `que faire ${input.city}`]
        );
        return { success: true, article };
      }),

    // Générer le contenu social pour une ville
    generateSocialForCity: ownerProcedure
      .input(z.object({ city: z.string(), country: z.string() }))
      .mutation(async ({ input }) => {
        const allSeoCards = await getAllSeoCards();
        const citySeoCards = allSeoCards
          .filter(c => c.city?.toLowerCase() === input.city.toLowerCase())
          .map(c => ({ nom: c.title, ville: c.city, type: c.category, description: c.description }));
        const allBundles = await getAllBundles();
        const cityBundles = allBundles
          .filter(b => b.cityFocus?.toLowerCase() === input.city.toLowerCase())
          .map(b => b.title);
        const content = await generateSocialContentFromCity(input.city, input.country, citySeoCards, cityBundles);
        return { success: true, content };
      }),
  }),
  // ─── MANUSS — Agent Directeur Technique (binôme Manus DG) ─────────────────────────────
  manus: router({  // Chat avec MANUS
    chat: ownerProcedure
      .input(z.object({
        message: z.string().min(1).max(4000),
        history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).default([]),
      }))
      .mutation(async ({ input }) => {
        const stats = await getAdminStats();
        return chatWithManus(input.message, input.history as ManusMessage[], {
          totalUsers: stats.totalUsers,
          totalFiches: stats.totalCards,
          totalBundles: 0,
          totalParcours: stats.totalTripPlans,
        });
      }),
    // Délibération Manus DG+MANUS
    deliberer: ownerProcedure
      .input(z.object({
        sujet: z.string().min(1),
        contexte: z.string().default(""),
      }))
      .mutation(async ({ input }) => {
        const stats = await getAdminStats();
        return delibererAriaEtManus(input.sujet, input.contexte, {
          totalUsers: stats.totalUsers,
          totalCards: stats.totalCards,
        });
      }),
    // Profil MANUS
    profil: ownerProcedure.query(() => MANUS_PROFILE),
    // Stratégie de lancement
    strategie: ownerProcedure.query(() => STRATEGIE_LANCEMENT),
    // Créer une mission
    creerMission: ownerProcedure
      .input(z.object({
        titre: z.string(),
        agent: z.string(),
        type: z.enum(["scraping", "design", "seo", "social", "affiliation", "creative", "communication", "recherche"]),
        description: z.string(),
        priorite: z.enum(["critique", "haute", "normale", "basse"]).default("normale"),
      }))
      .mutation(async ({ input }) => creerMission(input.titre, input.agent, input.type, input.description, input.priorite)),
  }),

  // ─── MAYA — Agente Creative ────────────────────────────────────────────────
  maya: router({
    // Générer un article de blog
    genererBlog: ownerProcedure
      .input(z.object({
        sujet: z.string().min(1),
        motsCles: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => genererArticleBlog(input.sujet, undefined, input.motsCles)),
    // Générer un post social
    genererPost: ownerProcedure
      .input(z.object({
        sujet: z.string().min(1),
        plateforme: z.enum(["instagram", "tiktok", "linkedin", "facebook", "twitter"]),
        type: z.enum(["carrousel", "reel", "story", "post", "editorial"]),
        ficheNom: z.string().optional(),
        ficheVille: z.string().optional(),
        ficheDescription: z.string().optional(),
      }))
      .mutation(async ({ input }) => genererPostSocial(
        input.sujet,
        input.plateforme,
        input.type,
        input.ficheNom ? { nom: input.ficheNom, ville: input.ficheVille ?? "", description: input.ficheDescription ?? "" } : undefined
      )),
    // Générer un calendrier éditorial
    genererCalendrier: ownerProcedure
      .input(z.object({ dureeJours: z.number().default(30) }))
      .mutation(async ({ input }) => genererCalendrierEditorial(input.dureeJours)),
    // Rechercher vidéos virales
    rechercherVideos: ownerProcedure
      .input(z.object({ etablissement: z.string(), ville: z.string() }))
      .mutation(async ({ input }) => rechercherVideoVirale(input.etablissement, input.ville)),
  }),

  // ─── NOVA — Agente Communication ──────────────────────────────────────────
  nova: router({
    // Générer un email
    genererEmail: ownerProcedure
      .input(z.object({
        type: z.enum(["bienvenue", "newsletter", "relance", "prospection", "confirmation", "rapport"]),
        prenom: z.string(),
        email: z.string(),
        tier: z.string().optional(),
        contexte: z.string().optional(),
      }))
      .mutation(async ({ input }) => genererEmail(
        input.type,
        { prenom: input.prenom, email: input.email, tier: input.tier },
        input.contexte
      )),
    // Répondre à un commentaire
    repondreCommentaire: ownerProcedure
      .input(z.object({
        commentaire: z.string(),
        plateforme: z.string(),
        etablissement: z.string().optional(),
      }))
      .mutation(async ({ input }) => repondreCommentaire(input.commentaire, input.plateforme, input.etablissement)),
    // Gérer un message privé
    gererMessage: ownerProcedure
      .input(z.object({ expediteur: z.string(), message: z.string() }))
      .mutation(async ({ input }) => gererMessagePrive(input.expediteur, input.message)),
    // Email prospection partenaire
    emailProspection: ownerProcedure
      .input(z.object({
        nom: z.string(),
        type: z.string(),
        ville: z.string(),
        contexte: z.string().optional(),
      }))
      .mutation(async ({ input }) => genererEmailProspection(
        { nom: input.nom, type: input.type, ville: input.ville },
        input.contexte
      )),
  }),

  // ─── Manus DG — Commandes dynamiques & profil intelligent ─────────────────────
  aria: router({
    // Ajouter une instruction Manus DG pour un client
    addInstruction: ownerProcedure
      .input(z.object({
        userId: z.number(),
        instruction: z.string().min(1).max(500),
        addedBy: z.enum(["aria", "manus", "owner"]).default("aria"),
      }))
      .mutation(async ({ input }) => {
        const result = await addAriaInstruction(input.userId, input.instruction, input.addedBy);
        return { success: true, instruction: result };
      }),

    // Voir les instructions Manus DG actives pour un client
    getInstructions: ownerProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const instructions = await getAriaInstructions(input.userId);
        return { instructions };
      }),

    // Désactiver une instruction Manus DG
    removeInstruction: ownerProcedure
      .input(z.object({ userId: z.number(), instructionId: z.string() }))
      .mutation(async ({ input }) => {
        await removeAriaInstruction(input.userId, input.instructionId);
        return { success: true };
      }),

    // Extraire le profil depuis une conversation (déclenché manuellement par Manus DG)
    extractProfile: ownerProcedure
      .input(z.object({
        userId: z.number(),
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        const extracted = await extractProfileFromConversation(input.userId, input.messages);
        return { success: true, extracted };
      }),

    // Voir le profil enrichi d'un client (pour Manus DG)
    getClientProfile: ownerProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const profile = await getClientProfile(input.userId);
        const instructions = await getAriaInstructions(input.userId);
        return { profile, ariaInstructions: instructions };
      }),

    // ─── ACCÈS TOTAL Manus DG EN ÉCRITURE ─────────────────────────────────────────
    // Manus DG peut lire toutes les fiches SEO
    getAllSeoCardsAria: ownerProcedure.query(async () => {
      const { drizzle } = await import("drizzle-orm/mysql2");
      const { desc } = await import("drizzle-orm");
      const mysql = await import("mysql2/promise");
      const schema = await import("../drizzle/schema");
      const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
      const db = drizzle(conn);
      const cards = await db.select({
        id: schema.seoCards.id,
        title: schema.seoCards.title,
        slug: schema.seoCards.slug,
        city: schema.seoCards.city,
        category: schema.seoCards.category,
        status: schema.seoCards.status,
        viewCount: schema.seoCards.viewCount,
        publishedAt: schema.seoCards.publishedAt,
        rating: schema.seoCards.rating,
        description: schema.seoCards.description,
        highlights: schema.seoCards.highlights,
        metaTitle: schema.seoCards.metaTitle,
        metaDescription: schema.seoCards.metaDescription,
        tags: schema.seoCards.tags,
        imageUrl: schema.seoCards.imageUrl,
      }).from(schema.seoCards).orderBy(desc(schema.seoCards.createdAt));
      await conn.end();
      return cards;
    }),

    // Manus DG peut lire tous les établissements
    getAllEstablishmentsAria: ownerProcedure.query(async () => {
      const { drizzle } = await import("drizzle-orm/mysql2");
      const { desc } = await import("drizzle-orm");
      const mysql = await import("mysql2/promise");
      const schema = await import("../drizzle/schema");
      const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
      const db = drizzle(conn);
      const rows = await db.select({
        id: schema.establishments.id,
        name: schema.establishments.name,
        slug: schema.establishments.slug,
        city: schema.establishments.city,
        country: schema.establishments.country,
        category: schema.establishments.category,
        status: schema.establishments.status,
        rating: schema.establishments.rating,
        viewCount: schema.establishments.viewCount,
        description: schema.establishments.description,
        shortDescription: schema.establishments.shortDescription,
        address: schema.establishments.address,
        website: schema.establishments.website,
        phone: schema.establishments.phone,
      }).from(schema.establishments).orderBy(desc(schema.establishments.createdAt));
      await conn.end();
      return rows;
    }),

    // Manus DG peut enrichir une fiche SEO existante directement
    enrichSeoCard: ownerProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        excerpt: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        tags: z.string().optional(),
        imageUrl: z.string().optional(),
        galleryUrls: z.string().optional(),
        viralVideos: z.string().optional(),
        affiliateLinks: z.string().optional(),
        rating: z.string().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const { eq } = await import("drizzle-orm");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        const { id, ...updates } = input;
        const cleanUpdates: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (v !== undefined) cleanUpdates[k] = v;
        }
        if (cleanUpdates.status === "published") {
          cleanUpdates.publishedAt = new Date();
        }
        await db.update(schema.seoCards).set(cleanUpdates).where(eq(schema.seoCards.id, id));
        const [updated] = await db.select().from(schema.seoCards).where(eq(schema.seoCards.id, id));
        await conn.end();
        return { success: true, card: updated };
      }),

    // Manus DG peut créer une fiche SEO complète
    createSeoCardAria: ownerProcedure
      .input(z.object({
        establishmentId: z.number().optional(),
        title: z.string(),
        slug: z.string(),
        city: z.string(),
        country: z.string(),
        category: z.string(),
        content: z.string(),
        excerpt: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        imageUrl: z.string().optional(),
        tags: z.string().optional(),
        rating: z.string().optional(),
        priceLevel: z.enum(["budget", "moderate", "upscale", "luxury"]).default("luxury"),
        status: z.enum(["draft", "published", "archived"]).default("draft"),
        affiliateLinks: z.string().optional(),
        viralVideos: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        const insertData = {
          ...input,
          generatedBy: "ai" as const,
          publishedAt: input.status === "published" ? new Date() : undefined,
        };
        const [result] = await db.insert(schema.seoCards).values(insertData as any);
        await conn.end();
        return { success: true, id: (result as any).insertId };
      }),

    // Manus DG peut créer un établissement directement
    createEstablishmentAria: ownerProcedure
      .input(z.object({
        name: z.string(),
        slug: z.string(),
        category: z.enum(["restaurant", "hotel", "bar", "spa", "museum", "park", "beach", "nightclub", "shopping", "transport", "activity", "experience", "wellness"]),
        city: z.string(),
        country: z.string(),
        description: z.string(),
        shortDescription: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        priceRange: z.string().optional(),
        priceLevel: z.enum(["budget", "moderate", "upscale", "luxury"]).default("upscale"),
        rating: z.string().optional(),
        heroImageUrl: z.string().optional(),
        tags: z.string().optional(),
        highlights: z.string().optional(),
        anecdotes: z.string().optional(),
        thingsToKnow: z.string().optional(),
        affiliateLinks: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        status: z.enum(["draft", "published", "archived"]).default("draft"),
        subcategory: z.string().optional(),
        region: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        const [result] = await db.insert(schema.establishments).values({ ...input, generatedBy: "ai" } as any);
        await conn.end();
        return { success: true, id: (result as any).insertId };
      }),

    // Manus DG peut mettre à jour un établissement existant
    updateEstablishmentAria: ownerProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        priceRange: z.string().optional(),
        rating: z.string().optional(),
        heroImageUrl: z.string().optional(),
        tags: z.string().optional(),
        highlights: z.string().optional(),
        anecdotes: z.string().optional(),
        thingsToKnow: z.string().optional(),
        affiliateLinks: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        viralVideos: z.string().optional(),
        openingHours: z.string().optional(),
        reviews: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const { eq } = await import("drizzle-orm");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        const { id, ...updates } = input;
        const cleanUpdates: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (v !== undefined) cleanUpdates[k] = v;
        }
        if (cleanUpdates.status === "published") {
          cleanUpdates.publishedAt = new Date();
        }
        await db.update(schema.establishments).set(cleanUpdates).where(eq(schema.establishments.id, id));
        const [updated] = await db.select().from(schema.establishments).where(eq(schema.establishments.id, id));
        await conn.end();
        return { success: true, establishment: updated };
      }),

    // Manus DG peut enregistrer un post social media (script vidéo, carrousel, reel...)
    saveSocialPostAria: ownerProcedure
      .input(z.object({
        seoCardId: z.number().optional(),
        establishmentId: z.number().optional(),
        platform: z.enum(["instagram", "tiktok", "linkedin", "twitter"]),
        contentType: z.enum(["carousel", "reel", "story", "post", "script"]),
        title: z.string().optional(),
        content: z.string(),
        hashtags: z.string().optional(),
        mediaUrls: z.string().optional(),
        status: z.enum(["draft", "scheduled", "published", "failed"]).default("draft"),
      }))
      .mutation(async ({ input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        const [result] = await db.insert(schema.socialMediaPosts).values(input as any);
        await conn.end();
        return { success: true, id: (result as any).insertId };
      }),

    // Manus DG peut créer un contenu dans le calendrier éditorial
    createContentItemAria: ownerProcedure
      .input(z.object({
        title: z.string(),
        contentType: z.enum(["instagram_post", "instagram_reel", "instagram_story", "instagram_carousel", "tiktok_video", "linkedin_post", "youtube_video", "twitter_post"]),
        platform: z.enum(["instagram", "tiktok", "linkedin", "twitter", "youtube", "blog"]),
        topic: z.string().optional(),
        brief: z.string().optional(),
        generatedContent: z.string().optional(),
        scheduledDate: z.string(),
        scheduledTime: z.string().optional(),
        status: z.enum(["idea", "generating", "review", "approved", "scheduled", "published", "failed"]).default("review"),
        linkedSeoCardIds: z.string().optional(),
        blogContent: z.string().optional(),
        blogSeoCity: z.string().optional(),
        blogKeywords: z.string().optional(),
        blogSlug: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        const [result] = await db.insert(schema.contentCalendar).values(input as any);
        await conn.end();
        return { success: true, id: (result as any).insertId };
      }),

    // Manus DG peut lire le calendrier éditorial complet
    getContentCalendarAria: ownerProcedure.query(async () => {
      const { drizzle } = await import("drizzle-orm/mysql2");
      const { desc } = await import("drizzle-orm");
      const mysql = await import("mysql2/promise");
      const schema = await import("../drizzle/schema");
      const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
      const db = drizzle(conn);
      const rows = await db.select().from(schema.contentCalendar).orderBy(desc(schema.contentCalendar.scheduledDate));
      await conn.end();
      return rows;
    }),

    // Manus DG peut mettre à jour le statut d'un contenu calendrier
    updateContentStatusAria: ownerProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["idea", "generating", "review", "approved", "scheduled", "published", "failed"]),
        generatedContent: z.string().optional(),
        performance: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const { eq } = await import("drizzle-orm");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        const { id, ...updates } = input;
        const cleanUpdates: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (v !== undefined) cleanUpdates[k] = v;
        }
        await db.update(schema.contentCalendar).set(cleanUpdates).where(eq(schema.contentCalendar.id, id));
        await conn.end();
        return { success: true };
      }),
  }),

  // ─── ATLAS — Agent Affiliation & Partenariats ──────────────────────────────
  atlas: router({
    // Programmes d'affiliation disponibles
    programmes: ownerProcedure.query(() => PROGRAMMES_AFFILIATION),
    // Rechercher des prestataires
    rechercherPrestataires: ownerProcedure
      .input(z.object({
        type: z.enum(["staycation", "restaurant", "chauffeur", "location_voiture", "location_voiture_luxe", "avion", "train", "hotel", "spa", "activite", "yacht", "jet_prive", "villa", "experience", "guide", "photographe"]),
        ville: z.string(),
        pays: z.string().default("France"),
      }))
      .mutation(async ({ input }) => rechercherPrestataires(input.type, input.ville, input.pays)),
    // Stratégie d'affiliation
    strategie: ownerProcedure
      .input(z.object({ budget: z.number().default(0), priorites: z.array(z.string()).default([]) }))
      .mutation(async ({ input }) => genererStrategieAffiliation(input.budget, input.priorites)),
    // Analyser un partenaire
    analyserPartenaire: ownerProcedure
      .input(z.object({ nom: z.string(), type: z.string(), siteWeb: z.string() }))
      .mutation(async ({ input }) => analyserPartenaire(input.nom, input.type, input.siteWeb)),
  }),

  // ─── Team Invitations ────────────────────────────────────────────────────────
  team: router({
    // Créer une invitation (fondateur seulement)
    invite: ownerProcedure
      .input(z.object({
        recipientName: z.string().min(1, "Nom requis"),
        recipientEmail: z.string().email().optional(),
        recipientPhone: z.string().optional(),
        message: z.string().optional(),
        role: z.enum(["team", "admin"]).default("team"),
        grantedTier: z.enum(["free", "explorer", "premium"]).default("explorer"),
      }).refine(d => d.recipientEmail || d.recipientPhone, { message: "Email ou téléphone requis" }))
      .mutation(async ({ ctx, input }) => {
        const crypto = await import("crypto");
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const { drizzle } = await import("drizzle-orm/mysql2");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        await db.insert(schema.teamInvitations).values({
          token,
          invitedBy: ctx.user.id,
          recipientName: input.recipientName,
          recipientEmail: input.recipientEmail,
          recipientPhone: input.recipientPhone,
          role: input.role,
          grantedTier: input.grantedTier,
          message: input.message,
          expiresAt,
          status: "pending",
        });
        await conn.end();
        return { token, expiresAt };
      }),

    // Lister les invitations envoyées
    listInvitations: ownerProcedure.query(async () => {
      const { drizzle } = await import("drizzle-orm/mysql2");
      const { desc } = await import("drizzle-orm");
      const mysql = await import("mysql2/promise");
      const schema = await import("../drizzle/schema");
      const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
      const db = drizzle(conn);
      const rows = await db.select().from(schema.teamInvitations).orderBy(desc(schema.teamInvitations.createdAt));
      await conn.end();
      return rows;
    }),

    // Lister les membres de l'équipe actifs
    // Récupérer l'admin principal (pour la messagerie terrain)
    getAdminUser: teamProcedure.query(async () => {
      const { drizzle } = await import("drizzle-orm/mysql2");
      const { eq } = await import("drizzle-orm");
      const mysql = await import("mysql2/promise");
      const schema = await import("../drizzle/schema");
      const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
      const db = drizzle(conn);
      const [admin] = await db.select({ id: schema.users.id, name: schema.users.name })
        .from(schema.users).where(eq(schema.users.role, "admin")).limit(1);
      await conn.end();
      return admin || null;
    }),
    listMembers: ownerProcedure.query(async () => {
      const { drizzle } = await import("drizzle-orm/mysql2");
      const { or, eq } = await import("drizzle-orm");
      const mysql = await import("mysql2/promise");
      const schema = await import("../drizzle/schema");
      const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
      const db = drizzle(conn);
      const rows = await db.select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        subscriptionTier: schema.users.subscriptionTier,
        createdAt: schema.users.createdAt,
      }).from(schema.users).where(
        or(eq(schema.users.role, "team"), eq(schema.users.role, "admin"))
      );
      await conn.end();
      return rows;
    }),

    // Valider une invitation (public — accessible via le lien token)
    acceptInvite: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const { eq } = await import("drizzle-orm");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        const [inv] = await db.select().from(schema.teamInvitations).where(eq(schema.teamInvitations.token, input.token));
        await conn.end();
        if (!inv) throw new TRPCError({ code: "NOT_FOUND", message: "Invitation introuvable" });
        if (inv.status === "accepted") return { status: "already_accepted" as const, invitation: inv };
        if (inv.status === "cancelled") return { status: "cancelled" as const, invitation: inv };
        if (inv.expiresAt < new Date()) return { status: "expired" as const, invitation: inv };
        return { status: "valid" as const, invitation: inv };
      }),

    // Confirmer l'acceptation après connexion OAuth
    confirmAccept: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const { eq } = await import("drizzle-orm");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        const [inv] = await db.select().from(schema.teamInvitations).where(eq(schema.teamInvitations.token, input.token));
        if (!inv) { await conn.end(); throw new TRPCError({ code: "NOT_FOUND" }); }
        if (inv.status !== "pending" || inv.expiresAt < new Date()) {
          await conn.end();
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation expirée ou déjà utilisée" });
        }
        // Activer le rôle + forfait explorer gratuit pour les membres terrain
        await db.update(schema.users).set({
          role: inv.role,
          subscriptionTier: inv.role === "team" ? "explorer" : undefined,
        }).where(eq(schema.users.id, ctx.user.id));
        // Marquer l'invitation comme acceptée
        await db.update(schema.teamInvitations).set({
          status: "accepted",
          acceptedByUserId: ctx.user.id,
          acceptedAt: new Date(),
        }).where(eq(schema.teamInvitations.token, input.token));
        await conn.end();
        return { success: true, role: inv.role };
      }),

    // Envoyer l'email d'invitation directement
    sendInviteEmail: ownerProcedure
      .input(z.object({
        token: z.string(),
        origin: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const { eq } = await import("drizzle-orm");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        const [inv] = await db.select().from(schema.teamInvitations).where(eq(schema.teamInvitations.token, input.token));
        await conn.end();
        if (!inv) throw new TRPCError({ code: "NOT_FOUND", message: "Invitation introuvable" });
        if (!inv.recipientEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "Pas d'email pour cette invitation" });
        const origin = input.origin || "https://maisonbaymora.com";
        const inviteUrl = `${origin}/invite/${input.token}`;
        const { triggerTeamInvite } = await import("./services/emailService");
        const result = await triggerTeamInvite({
          recipientEmail: inv.recipientEmail,
          recipientName: inv.recipientName || "Opérateur",
          inviteUrl,
          message: inv.message || undefined,
        });
        if (!result.success) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error || "Erreur envoi email" });
        return { success: true };
      }),

    // Annuler une invitation
    cancelInvite: ownerProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const { eq } = await import("drizzle-orm");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        await db.update(schema.teamInvitations).set({ status: "cancelled" }).where(eq(schema.teamInvitations.token, input.token));
        await conn.end();
        return { success: true };
      }),

    // Attribuer un forfait à un opérateur terrain
    grantTier: ownerProcedure
      .input(z.object({
        userId: z.number(),
        tier: z.enum(["free", "explorer", "premium", "elite"]),
      }))
      .mutation(async ({ input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const { eq } = await import("drizzle-orm");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        await db.update(schema.users)
          .set({ subscriptionTier: input.tier as any })
          .where(eq(schema.users.id, input.userId));
        await conn.end();
        return { success: true };
      }),

    // Envoyer un message à un opérateur terrain
    sendMessage: ownerProcedure
      .input(z.object({
        toUserId: z.number(),
        content: z.string().min(1).max(2000),
      }))
      .mutation(async ({ ctx, input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        await db.insert(schema.operatorMessages).values({
          fromUserId: ctx.user.id,
          toUserId: input.toUserId,
          content: input.content,
          isRead: false,
        });
        await conn.end();
        return { success: true };
      }),

    // Répondre à un message (opérateur terrain)
    replyMessage: protectedProcedure
      .input(z.object({
        toUserId: z.number(),
        content: z.string().min(1).max(2000),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "team" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { drizzle } = await import("drizzle-orm/mysql2");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        await db.insert(schema.operatorMessages).values({
          fromUserId: ctx.user.id,
          toUserId: input.toUserId,
          content: input.content,
          isRead: false,
        });
        await conn.end();
        return { success: true };
      }),

    // Récupérer les messages entre admin et un opérateur
    getMessages: protectedProcedure
      .input(z.object({ withUserId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const { or, and, eq, desc } = await import("drizzle-orm");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        const msgs = await db.select().from(schema.operatorMessages)
          .where(
            or(
              and(eq(schema.operatorMessages.fromUserId, ctx.user.id), eq(schema.operatorMessages.toUserId, input.withUserId)),
              and(eq(schema.operatorMessages.fromUserId, input.withUserId), eq(schema.operatorMessages.toUserId, ctx.user.id))
            )
          )
          .orderBy(desc(schema.operatorMessages.createdAt))
          .limit(100);
        // Marquer comme lus les messages reçus
        await db.update(schema.operatorMessages)
          .set({ isRead: true })
          .where(
            and(eq(schema.operatorMessages.fromUserId, input.withUserId), eq(schema.operatorMessages.toUserId, ctx.user.id))
          );
        await conn.end();
        return msgs.reverse();
      }),

    // Compter les messages non lus pour l'opérateur connecté
    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      const { drizzle } = await import("drizzle-orm/mysql2");
      const { eq, and } = await import("drizzle-orm");
      const mysql = await import("mysql2/promise");
      const schema = await import("../drizzle/schema");
      const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
      const db = drizzle(conn);
      const rows = await db.select().from(schema.operatorMessages)
        .where(and(eq(schema.operatorMessages.toUserId, ctx.user.id), eq(schema.operatorMessages.isRead, false)));
      await conn.end();
       return { count: rows.length };
    }),
    // Récupérer les dernières notifications (messages reçus)
    getRecentNotifications: protectedProcedure.query(async ({ ctx }) => {
      const { drizzle } = await import("drizzle-orm/mysql2");
      const { eq, desc } = await import("drizzle-orm");
      const mysql = await import("mysql2/promise");
      const schema = await import("../drizzle/schema");
      const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
      const db = drizzle(conn);
      const msgs = await db.select().from(schema.operatorMessages)
        .where(eq(schema.operatorMessages.toUserId, ctx.user.id))
        .orderBy(desc(schema.operatorMessages.createdAt))
        .limit(20);
      await conn.end();
      return msgs;
    }),
    // Marquer toutes les notifications comme lues
    markAllNotificationsRead: protectedProcedure.mutation(async ({ ctx }) => {
      const { drizzle } = await import("drizzle-orm/mysql2");
      const { eq } = await import("drizzle-orm");
      const mysql = await import("mysql2/promise");
      const schema = await import("../drizzle/schema");
      const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
      const db = drizzle(conn);
      await db.update(schema.operatorMessages)
        .set({ isRead: true })
        .where(eq(schema.operatorMessages.toUserId, ctx.user.id));
      await conn.end();
      return { success: true };
    }),
    // Créer un parcours local
    createRoute: protectedProcedure
      .input(z.object({
        title: z.string().min(2).max(256),
        description: z.string().optional(),
        city: z.string().min(1).max(128),
        country: z.string().default("France"),
        category: z.enum(["decouverte","gastronomie","plages","culture","shopping","nature","nightlife","wellness","business","famille","autre"]),
        durationMinutes: z.number().optional(),
        steps: z.array(z.object({
          order: z.number(),
          establishmentName: z.string(),
          type: z.string(),
          address: z.string().optional(),
          notes: z.string().optional(),
          durationMinutes: z.number().optional(),
        })).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "team" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { drizzle } = await import("drizzle-orm/mysql2");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        const [result] = await db.insert(schema.operatorRoutes).values({
          createdByUserId: ctx.user.id,
          title: input.title,
          description: input.description,
          city: input.city,
          country: input.country,
          category: input.category,
          durationMinutes: input.durationMinutes,
          steps: input.steps ? JSON.stringify(input.steps) : null,
          notes: input.notes,
          status: "draft",
        });
        await conn.end();
        return { success: true, id: (result as any).insertId };
      }),

    // Lister les parcours de l'opérateur connecté
    getMyRoutes: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "team" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { drizzle } = await import("drizzle-orm/mysql2");
      const { eq, desc } = await import("drizzle-orm");
      const mysql = await import("mysql2/promise");
      const schema = await import("../drizzle/schema");
      const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
      const db = drizzle(conn);
      const routes = await db.select().from(schema.operatorRoutes)
        .where(eq(schema.operatorRoutes.createdByUserId, ctx.user.id))
        .orderBy(desc(schema.operatorRoutes.createdAt));
      await conn.end();
      return routes;
    }),

    // Lister tous les parcours (admin)
    getAllRoutes: ownerProcedure.query(async () => {
      const { drizzle } = await import("drizzle-orm/mysql2");
      const { desc } = await import("drizzle-orm");
      const mysql = await import("mysql2/promise");
      const schema = await import("../drizzle/schema");
      const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
      const db = drizzle(conn);
      const routes = await db.select().from(schema.operatorRoutes)
        .orderBy(desc(schema.operatorRoutes.createdAt));
      await conn.end();
      return routes;
    }),

    // Approuver/rejeter un parcours (admin)
    reviewRoute: ownerProcedure
      .input(z.object({
        routeId: z.number(),
        status: z.enum(["approved", "published", "draft"]),
        feedback: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const { eq } = await import("drizzle-orm");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        await db.update(schema.operatorRoutes)
          .set({ status: input.status, adminFeedback: input.feedback })
          .where(eq(schema.operatorRoutes.id, input.routeId));
        await conn.end();
        return { success: true };
      }),
  }),

  // ─── Discount Offers (Offres avec Réductions Premium) ─────────────────────
  offers: router({
    list: publicProcedure
      .input(z.object({
        sector: z.string().optional(),
        priceTier: z.enum(["tier1", "tier2", "tier3", "tier4"]).optional(),
        city: z.string().optional(),
        isFeatured: z.boolean().optional(),
        isFlash: z.boolean().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }).optional())
      .query(async ({ input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const { eq, and, desc } = await import("drizzle-orm");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        const conditions: any[] = [eq(schema.discountOffers.status, "published")];
        if (input?.sector) conditions.push(eq(schema.discountOffers.sector, input.sector as any));
        if (input?.priceTier) conditions.push(eq(schema.discountOffers.priceTier, input.priceTier));
        if (input?.city) conditions.push(eq(schema.discountOffers.city, input.city));
        if (input?.isFeatured) conditions.push(eq(schema.discountOffers.isFeatured, true));
        if (input?.isFlash) conditions.push(eq(schema.discountOffers.isFlashOffer, true));
        const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
        const offers = await db.select().from(schema.discountOffers)
          .where(whereClause)
          .orderBy(desc(schema.discountOffers.isFeatured), desc(schema.discountOffers.sortOrder), desc(schema.discountOffers.createdAt))
          .limit(input?.limit ?? 50)
          .offset(input?.offset ?? 0);
        await conn.end();
        return offers;
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const { eq } = await import("drizzle-orm");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        const [offer] = await db.select().from(schema.discountOffers)
          .where(eq(schema.discountOffers.slug, input.slug));
        if (offer) {
          await db.update(schema.discountOffers)
            .set({ viewCount: (offer.viewCount ?? 0) + 1 })
            .where(eq(schema.discountOffers.id, offer.id));
        }
        await conn.end();
        return offer ?? null;
      }),

    create: ownerProcedure
      .input(z.object({
        slug: z.string(),
        title: z.string(),
        subtitle: z.string().optional(),
        tagline: z.string().optional(),
        establishmentName: z.string(),
        establishmentCategory: z.enum(["hotel","villa","restaurant","spa","experience","transport","wellness","yacht","chalet"]),
        city: z.string(),
        country: z.string(),
        region: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        originalPricePerNight: z.number().optional(),
        discountedPricePerNight: z.number().optional(),
        originalPriceTotal: z.number().optional(),
        discountedPriceTotal: z.number().optional(),
        discountPercent: z.number().optional(),
        packageType: z.enum(["1_night","2_nights","3_nights","weekend","week","custom"]).default("2_nights"),
        durationNights: z.number().default(2),
        maxGuests: z.number().optional(),
        priceTier: z.enum(["tier1","tier2","tier3","tier4"]),
        sector: z.enum(["hotelerie","gastronomie","experiences","villas","transport","bienetre","yachting","ski"]),
        heroImageUrl: z.string().optional(),
        galleryImages: z.string().optional(),
        coverImageUrl: z.string().optional(),
        description: z.string(),
        shortDescription: z.string().optional(),
        highlights: z.string().optional(),
        included: z.string().optional(),
        notIncluded: z.string().optional(),
        conditions: z.string().optional(),
        insiderTip: z.string().optional(),
        bookingUrl: z.string().optional(),
        accessLevel: z.enum(["free","premium_only"]).default("free"),
        isFeatured: z.boolean().default(false),
        isFlashOffer: z.boolean().default(false),
        status: z.enum(["draft","published","expired","sold_out"]).default("draft"),
      }))
      .mutation(async ({ input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        await db.insert(schema.discountOffers).values(input as any);
        await conn.end();
        return { success: true };
      }),

    update: ownerProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const { eq } = await import("drizzle-orm");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        await db.update(schema.discountOffers).set(input.data).where(eq(schema.discountOffers.id, input.id));
        await conn.end();
        return { success: true };
      }),

    toggleSave: protectedProcedure
      .input(z.object({ offerId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { drizzle } = await import("drizzle-orm/mysql2");
        const { eq, and } = await import("drizzle-orm");
        const mysql = await import("mysql2/promise");
        const schema = await import("../drizzle/schema");
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const db = drizzle(conn);
        const [existing] = await db.select().from(schema.discountOfferSaves)
          .where(and(eq(schema.discountOfferSaves.userId, ctx.user.id), eq(schema.discountOfferSaves.offerId, input.offerId)));
        if (existing) {
          await db.delete(schema.discountOfferSaves).where(eq(schema.discountOfferSaves.id, existing.id));
          await conn.end();
          return { saved: false };
        } else {
          await db.insert(schema.discountOfferSaves).values({ userId: ctx.user.id, offerId: input.offerId });
          await conn.end();
          return { saved: true };
        }
      }),

    getSaved: protectedProcedure.query(async ({ ctx }) => {
      const { drizzle } = await import("drizzle-orm/mysql2");
      const { eq, desc } = await import("drizzle-orm");
      const mysql = await import("mysql2/promise");
      const schema = await import("../drizzle/schema");
      const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
      const db = drizzle(conn);
      const saves = await db.select().from(schema.discountOfferSaves)
        .where(eq(schema.discountOfferSaves.userId, ctx.user.id))
        .orderBy(desc(schema.discountOfferSaves.createdAt));
      await conn.end();
      return saves.map(s => s.offerId);
    }),

    seed: ownerProcedure.mutation(async () => {
      const { drizzle } = await import("drizzle-orm/mysql2");
      const mysql = await import("mysql2/promise");
      const schema = await import("../drizzle/schema");
      const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
      const db = drizzle(conn);
      const seedOffers = [
        { slug: "hotel-de-paris-monaco-weekend", title: "H\u00f4tel de Paris Monte-Carlo", subtitle: "Suite Deluxe avec vue mer \u2014 Weekend d'exception", tagline: "L'adresse mythique de la Principaut\u00e9", establishmentName: "H\u00f4tel de Paris Monte-Carlo", establishmentCategory: "hotel" as const, city: "Monaco", country: "Monaco", region: "C\u00f4te d'Azur", lat: 43.7396, lng: 7.4278, originalPricePerNight: 2800, discountedPricePerNight: 1960, originalPriceTotal: 5600, discountedPriceTotal: 3920, discountPercent: 30, currency: "EUR", packageType: "weekend" as const, durationNights: 2, maxGuests: 2, priceTier: "tier3" as const, sector: "hotelerie" as const, heroImageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=90", description: "Symbole absolu du luxe mon\u00e9gasque depuis 1864, l'H\u00f4tel de Paris incarne l'excellence \u00e0 la fran\u00e7aise sur la Place du Casino.", shortDescription: "Suite Deluxe vue mer, petit-d\u00e9jeuner Ducasse, spa Thermes Marins inclus.", highlights: JSON.stringify(["Vue panoramique sur la M\u00e9diterran\u00e9e","Petit-d\u00e9jeuner au Louis XV d'Alain Ducasse","Acc\u00e8s spa Thermes Marins Monte-Carlo","Service conciergerie 24h/24","Parking voiturier inclus"]), included: JSON.stringify(["2 nuits en Suite Deluxe","Petit-d\u00e9jeuner gastronomique x2","Acc\u00e8s spa illimit\u00e9","Bouteille de champagne \u00e0 l'arriv\u00e9e","Late check-out 14h"]), insiderTip: "Demandez la Suite M\u00e9diterran\u00e9e au 5\u00e8me \u00e9tage \u2014 la vue sur le port de Monaco au coucher du soleil est \u00e0 couper le souffle.", accessLevel: "free" as const, status: "published" as const, isFeatured: true, isFlashOffer: false, sortOrder: 10 },
        { slug: "villa-saint-tropez-semaine", title: "Villa Priv\u00e9e Saint-Tropez", subtitle: "Villa 5 chambres avec piscine \u00e0 d\u00e9bordement \u2014 Semaine prestige", tagline: "L'art de vivre trop\u00e9zien dans votre villa priv\u00e9e", establishmentName: "Villa Les Palmiers", establishmentCategory: "villa" as const, city: "Saint-Tropez", country: "France", region: "Provence-Alpes-C\u00f4te d'Azur", lat: 43.2677, lng: 6.6402, originalPriceTotal: 35000, discountedPriceTotal: 24500, originalPricePerNight: 5000, discountedPricePerNight: 3500, discountPercent: 30, currency: "EUR", packageType: "week" as const, durationNights: 7, maxGuests: 10, priceTier: "tier4" as const, sector: "villas" as const, heroImageUrl: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1600&q=90", description: "Nich\u00e9e dans les hauteurs de Saint-Tropez avec vue \u00e0 180\u00b0 sur la baie, cette villa d'exception de 600m\u00b2 dispose de 5 suites.", shortDescription: "Villa 600m\u00b2, 5 suites, piscine \u00e0 d\u00e9bordement, vue mer 180\u00b0, chef priv\u00e9 disponible.", highlights: JSON.stringify(["Vue panoramique 180\u00b0 sur la baie","Piscine \u00e0 d\u00e9bordement chauff\u00e9e","5 suites avec salle de bain privative","Chef priv\u00e9 sur demande","Acc\u00e8s plage de Pampelonne"]), included: JSON.stringify(["7 nuits en villa priv\u00e9e","Service de m\u00e9nage quotidien","Voiturier","Accueil champagne","Conciergerie Baymora d\u00e9di\u00e9e"]), insiderTip: "R\u00e9servez le chef priv\u00e9 d\u00e8s l'arriv\u00e9e pour un d\u00eener sur la terrasse au coucher du soleil.", accessLevel: "free" as const, status: "published" as const, isFeatured: true, isFlashOffer: false, sortOrder: 9 },
        { slug: "le-bristol-paris-suite", title: "Le Bristol Paris", subtitle: "Suite Royale \u2014 3 nuits au c\u0153ur du Triangle d'Or", tagline: "Le palace parisien par excellence", establishmentName: "Le Bristol Paris", establishmentCategory: "hotel" as const, city: "Paris", country: "France", region: "\u00cele-de-France", lat: 48.8706, lng: 2.3116, originalPricePerNight: 3500, discountedPricePerNight: 2450, originalPriceTotal: 10500, discountedPriceTotal: 7350, discountPercent: 30, currency: "EUR", packageType: "3_nights" as const, durationNights: 3, maxGuests: 2, priceTier: "tier4" as const, sector: "hotelerie" as const, heroImageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600&q=90", description: "\u00c9rig\u00e9 en 1925 rue du Faubourg Saint-Honor\u00e9, Le Bristol Paris est le seul palace parisien \u00e0 poss\u00e9der une piscine en plein air.", shortDescription: "Suite Royale 200m\u00b2, Epicure 3 \u00e9toiles, spa Sisley, shopping priv\u00e9 inclus.", highlights: JSON.stringify(["Suite Royale 200m\u00b2 vue jardins","Petit-d\u00e9jeuner Epicure 3 \u00e9toiles Michelin","Acc\u00e8s spa Sisley Paris","Piscine en plein air","Service shopping priv\u00e9 rue du Faubourg"]), included: JSON.stringify(["3 nuits en Suite Royale","Petit-d\u00e9jeuner gastronomique x3","Acc\u00e8s spa illimit\u00e9","Transfert a\u00e9roport en berline","Bouteille de Krug \u00e0 l'arriv\u00e9e"]), insiderTip: "Demandez une table au jardin pour le brunch du dimanche.", accessLevel: "free" as const, status: "published" as const, isFeatured: true, isFlashOffer: false, sortOrder: 8 },
        { slug: "four-seasons-george-v-paris", title: "Four Seasons George V Paris", subtitle: "Chambre Sup\u00e9rieure \u2014 2 nuits avec d\u00eener au Cinq", tagline: "L'avenue George V, l'adresse de l\u00e9gende", establishmentName: "Four Seasons Hotel George V", establishmentCategory: "hotel" as const, city: "Paris", country: "France", region: "\u00cele-de-France", lat: 48.8698, lng: 2.3025, originalPricePerNight: 1800, discountedPricePerNight: 1260, originalPriceTotal: 3600, discountedPriceTotal: 2520, discountPercent: 30, currency: "EUR", packageType: "2_nights" as const, durationNights: 2, maxGuests: 2, priceTier: "tier3" as const, sector: "hotelerie" as const, heroImageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600&q=90", description: "Inaugur\u00e9 en 1928 sur l'avenue George V, ce palace iconique est c\u00e9l\u00e8bre pour ses compositions florales spectaculaires.", shortDescription: "2 nuits, d\u00eener au Cinq 3 \u00e9toiles, spa, conciergerie Paris inclus.", highlights: JSON.stringify(["D\u00eener gastronomique au Cinq 3 \u00e9toiles","Compositions florales iconiques","Spa avec piscine int\u00e9rieure","Vue sur cour int\u00e9rieure","Acc\u00e8s VIP galeries d'art"]), included: JSON.stringify(["2 nuits en Chambre Sup\u00e9rieure","Petit-d\u00e9jeuner continental x2","D\u00eener au Cinq pour 2 personnes","Acc\u00e8s spa","Bouteille de champagne"]), insiderTip: "Les arrangements floraux changent chaque semaine \u2014 demandez \u00e0 rencontrer Jeff Leatham.", accessLevel: "free" as const, status: "published" as const, isFeatured: false, isFlashOffer: true, sortOrder: 7 },
        { slug: "burj-al-arab-dubai-suite", title: "Burj Al Arab Jumeirah", subtitle: "Suite Deluxe \u2014 2 nuits dans l'h\u00f4tel le plus luxueux du monde", tagline: "L'ic\u00f4ne de Dubai, votre suite dans les nuages", establishmentName: "Burj Al Arab Jumeirah", establishmentCategory: "hotel" as const, city: "Dubai", country: "\u00c9mirats Arabes Unis", region: "Dubai", lat: 25.1412, lng: 55.1853, originalPricePerNight: 4500, discountedPricePerNight: 3150, originalPriceTotal: 9000, discountedPriceTotal: 6300, discountPercent: 30, currency: "EUR", packageType: "2_nights" as const, durationNights: 2, maxGuests: 2, priceTier: "tier4" as const, sector: "hotelerie" as const, heroImageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=90", description: "\u00c9rig\u00e9 sur une \u00eele artificielle en forme de voile, le Burj Al Arab est le symbole absolu du luxe \u00e0 Dubai.", shortDescription: "Suite duplex 170m\u00b2, majordome priv\u00e9, transfert Rolls-Royce, d\u00eener Al Muntaha.", highlights: JSON.stringify(["Suite duplex 170m\u00b2 minimum","Majordome priv\u00e9 24h/24","Transfert en Rolls-Royce ou h\u00e9licopt\u00e8re","D\u00eener au Al Muntaha 27\u00e8me \u00e9tage","Beach club priv\u00e9 exclusif"]), included: JSON.stringify(["2 nuits en Suite Deluxe","Petit-d\u00e9jeuner gastronomique x2","Transfert a\u00e9roport Rolls-Royce","D\u00eener Al Muntaha pour 2","Acc\u00e8s beach club"]), insiderTip: "R\u00e9servez l'h\u00e9licopt\u00e8re pour l'arriv\u00e9e \u2014 atterrir sur le h\u00e9lipad est unique au monde.", accessLevel: "free" as const, status: "published" as const, isFeatured: true, isFlashOffer: false, sortOrder: 6 },
        { slug: "experience-gastronomique-monaco", title: "Louis XV \u2014 Alain Ducasse \u00e0 Monaco", subtitle: "D\u00eener priv\u00e9 pour 2 + suite au M\u00e9tropole \u2014 Package Prestige", tagline: "La table des tables sur la C\u00f4te d'Azur", establishmentName: "Le Louis XV \u2014 Alain Ducasse", establishmentCategory: "restaurant" as const, city: "Monaco", country: "Monaco", region: "C\u00f4te d'Azur", lat: 43.7396, lng: 7.4278, originalPriceTotal: 2800, discountedPriceTotal: 1960, discountPercent: 30, currency: "EUR", packageType: "1_night" as const, durationNights: 1, maxGuests: 2, priceTier: "tier3" as const, sector: "gastronomie" as const, heroImageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=90", description: "Le Louis XV d'Alain Ducasse \u00e0 l'H\u00f4tel de Paris est la table la plus mythique de la M\u00e9diterran\u00e9e. 3 \u00e9toiles Michelin depuis 1990.", shortDescription: "D\u00eener 3 \u00e9toiles Michelin pour 2, accord vins, suite M\u00e9tropole, berline priv\u00e9e.", highlights: JSON.stringify(["3 \u00e9toiles Michelin depuis 1990","Menu d\u00e9gustation 8 services","Cave \u00e0 vins exceptionnelle","Nuit en suite au M\u00e9tropole","Vue sur la Place du Casino"]), included: JSON.stringify(["D\u00eener gastronomique 8 services pour 2","Accord mets-vins","1 nuit en suite M\u00e9tropole","Transfert berline priv\u00e9e","Champagne de bienvenue"]), insiderTip: "Demandez la table 12 \u2014 vue directe sur les jardins et la mer.", accessLevel: "free" as const, status: "published" as const, isFeatured: true, isFlashOffer: false, sortOrder: 5 },
        { slug: "spa-cheval-blanc-paris", title: "Spa Cheval Blanc Paris", subtitle: "Journ\u00e9e Spa Prestige \u2014 Soins signature + d\u00e9jeuner gastronomique", tagline: "Le spa le plus exclusif de Paris", establishmentName: "Spa Cheval Blanc Paris", establishmentCategory: "spa" as const, city: "Paris", country: "France", region: "\u00cele-de-France", lat: 48.8566, lng: 2.3522, originalPriceTotal: 1200, discountedPriceTotal: 840, discountPercent: 30, currency: "EUR", packageType: "1_night" as const, durationNights: 1, maxGuests: 2, priceTier: "tier2" as const, sector: "bienetre" as const, heroImageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&q=90", description: "Nich\u00e9 au c\u0153ur du Cheval Blanc Paris (palace LVMH), le spa Guerlain de 1400m\u00b2 est consid\u00e9r\u00e9 comme le plus beau spa de Paris.", shortDescription: "Soin Guerlain 90min, piscine 25m, acc\u00e8s aquatique, d\u00e9jeuner Limbar inclus.", highlights: JSON.stringify(["Spa Guerlain 1400m\u00b2","Piscine int\u00e9rieure 25m","Soin signature 90 minutes","D\u00e9jeuner au Limbar","Vue sur la Seine"]), included: JSON.stringify(["Soin signature Guerlain 90min","Acc\u00e8s spa illimit\u00e9","D\u00e9jeuner au Limbar pour 2","Peignoir et chaussons","Produits Guerlain offerts"]), insiderTip: "Arrivez \u00e0 10h pour profiter de la piscine avant l'affluence.", accessLevel: "free" as const, status: "published" as const, isFeatured: false, isFlashOffer: false, sortOrder: 4 },
        { slug: "yacht-cannes-journee", title: "Yacht Priv\u00e9 \u2014 C\u00f4te d'Azur", subtitle: "Journ\u00e9e en mer de Cannes \u00e0 Monaco \u2014 Yacht 24m avec \u00e9quipage", tagline: "La M\u00e9diterran\u00e9e comme terrain de jeu", establishmentName: "Baymora Yachting", establishmentCategory: "yacht" as const, city: "Cannes", country: "France", region: "Provence-Alpes-C\u00f4te d'Azur", lat: 43.5528, lng: 7.0174, originalPriceTotal: 8500, discountedPriceTotal: 5950, discountPercent: 30, currency: "EUR", packageType: "1_night" as const, durationNights: 1, maxGuests: 8, priceTier: "tier4" as const, sector: "yachting" as const, heroImageUrl: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1600&q=90", description: "Embarquez pour une journ\u00e9e inoubliable \u00e0 bord d'un yacht de 24m avec \u00e9quipage complet. D\u00e9part de Cannes, escale aux \u00celes de L\u00e9rins.", shortDescription: "Yacht 24m, \u00e9quipage 3 personnes, d\u00e9jeuner \u00e0 bord, Cannes-Monaco, criques secr\u00e8tes.", highlights: JSON.stringify(["Yacht 24m avec \u00e9quipage complet","D\u00e9jeuner gastronomique \u00e0 bord","Criques secr\u00e8tes et baignade","Itin\u00e9raire Cannes-Monaco","Champagne et open bar"]), included: JSON.stringify(["Journ\u00e9e compl\u00e8te (10h-20h)","\u00c9quipage 3 personnes","D\u00e9jeuner gastronomique","Open bar champagne et vins","\u00c9quipements nautiques"]), insiderTip: "Demandez \u00e0 stopper \u00e0 la Calanque de l'Esterel au coucher du soleil.", accessLevel: "free" as const, status: "published" as const, isFeatured: true, isFlashOffer: false, sortOrder: 3 },
        { slug: "chalet-courchevel-1850-ski", title: "Chalet Priv\u00e9 Courchevel 1850", subtitle: "Chalet 6 chambres \u2014 Semaine ski prestige avec chef et spa", tagline: "Le sommet du ski de luxe dans les Alpes", establishmentName: "Chalet Les Neiges \u00c9ternelles", establishmentCategory: "chalet" as const, city: "Courchevel", country: "France", region: "Savoie", lat: 45.4152, lng: 6.6337, originalPriceTotal: 42000, discountedPriceTotal: 29400, originalPricePerNight: 6000, discountedPricePerNight: 4200, discountPercent: 30, currency: "EUR", packageType: "week" as const, durationNights: 7, maxGuests: 12, priceTier: "tier4" as const, sector: "ski" as const, heroImageUrl: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1600&q=90", description: "Au c\u0153ur de Courchevel 1850, station la plus exclusive des Alpes, ce chalet de 700m\u00b2 dispose de 6 suites avec vue sur les pistes.", shortDescription: "Chalet 700m\u00b2, ski-in/ski-out, chef \u00e9toil\u00e9, spa, moniteur priv\u00e9, 6 suites.", highlights: JSON.stringify(["Ski-in/ski-out direct sur les pistes","Chef \u00e9toil\u00e9 r\u00e9sidentiel","Spa avec hammam et sauna","Moniteur de ski priv\u00e9","Cave \u00e0 vins 500 bouteilles"]), included: JSON.stringify(["7 nuits en chalet priv\u00e9","Chef \u00e9toil\u00e9 3 repas/jour","Spa et bien-\u00eatre illimit\u00e9","Moniteur ski 5 jours","Transfert a\u00e9roport en h\u00e9licopt\u00e8re"]), insiderTip: "R\u00e9servez une sortie hors-piste vers la Combe de la Saulire \u2014 inaccessible sans guide.", accessLevel: "free" as const, status: "published" as const, isFeatured: true, isFlashOffer: false, sortOrder: 2 },
        { slug: "experience-bali-villa-ubud", title: "Villa Priv\u00e9e Ubud \u2014 Bali", subtitle: "Villa avec piscine \u00e0 d\u00e9bordement sur jungle \u2014 5 nuits retraite", tagline: "La s\u00e9r\u00e9nit\u00e9 absolue au c\u0153ur de la jungle balinaise", establishmentName: "Villa Karma Kandara Ubud", establishmentCategory: "villa" as const, city: "Ubud", country: "Indon\u00e9sie", region: "Bali", lat: -8.5069, lng: 115.2625, originalPricePerNight: 1200, discountedPricePerNight: 840, originalPriceTotal: 6000, discountedPriceTotal: 4200, discountPercent: 30, currency: "EUR", packageType: "custom" as const, durationNights: 5, maxGuests: 4, priceTier: "tier2" as const, sector: "villas" as const, heroImageUrl: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=1600&q=90", description: "Perch\u00e9e au-dessus de la vall\u00e9e de l'Ayung \u00e0 Ubud, cette villa de 3 pavillons dispose d'une piscine \u00e0 d\u00e9bordement avec vue sur la jungle tropicale.", shortDescription: "3 pavillons, piscine jungle, yoga quotidien, massages, cuisine v\u00e9g\u00e9tarienne gastronomique.", highlights: JSON.stringify(["Piscine \u00e0 d\u00e9bordement vue jungle","Cours de yoga quotidiens","Massages balinais inclus","Cuisine v\u00e9g\u00e9tarienne gastronomique","Excursions culturelles priv\u00e9es"]), included: JSON.stringify(["5 nuits en villa priv\u00e9e","Petits-d\u00e9jeuners et d\u00eeners","Cours de yoga x5","Massages x5","Excursion temple et rizi\u00e8res"]), insiderTip: "R\u00e9veillez-vous \u00e0 5h30 pour le yoga au lever du soleil \u2014 la brume matinale sur la jungle est magique.", accessLevel: "free" as const, status: "published" as const, isFeatured: false, isFlashOffer: true, sortOrder: 1 },
      ];
      let inserted = 0;
      for (const offer of seedOffers) {
        try { await db.insert(schema.discountOffers).values(offer as any); inserted++; }
        catch (e: any) { if (!e.message?.includes('Duplicate')) throw e; }
      }
      await conn.end();
      return { success: true, inserted };
    }),
  }),

  // ─── Notifications Router ────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(20), unreadOnly: z.boolean().default(false) }))
      .query(async ({ ctx, input }) => {
        const mysql = await import('mysql2/promise');
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const query = input.unreadOnly
          ? 'SELECT * FROM notifications WHERE userId = ? AND readAt IS NULL ORDER BY createdAt DESC LIMIT ?'
          : 'SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT ?';
        const [rows] = await conn.execute(query, [ctx.user.id, input.limit]) as any;
        await conn.end();
        return rows as any[];
      }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const mysql = await import('mysql2/promise');
      const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
      const [rows] = await conn.execute(
        'SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND readAt IS NULL',
        [ctx.user.id]
      ) as any;
      await conn.end();
      return Number(rows[0]?.count || 0);
    }),
    markRead: protectedProcedure
      .input(z.object({ id: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const mysql = await import('mysql2/promise');
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        if (input.id) {
          await conn.execute('UPDATE notifications SET readAt = NOW() WHERE id = ? AND userId = ?', [input.id, ctx.user.id]);
        } else {
          await conn.execute('UPDATE notifications SET readAt = NOW() WHERE userId = ? AND readAt IS NULL', [ctx.user.id]);
        }
        await conn.end();
        return { success: true };
      }),
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      const mysql = await import('mysql2/promise');
      const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
      const [rows] = await conn.execute('SELECT * FROM notificationSettings WHERE userId = ?', [ctx.user.id]) as any;
      await conn.end();
      if (rows.length === 0) return { activeTripNotifs: true, discoveryNotifs: true, emailNotifs: true, emailFrequency: 'daily' };
      return rows[0] as any;
    }),
    updateSettings: protectedProcedure
      .input(z.object({
        activeTripNotifs: z.boolean().optional(),
        discoveryNotifs: z.boolean().optional(),
        emailNotifs: z.boolean().optional(),
        emailFrequency: z.enum(['instant', 'daily', 'weekly']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const mysql = await import('mysql2/promise');
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        await conn.execute(
          `INSERT INTO notificationSettings (userId, activeTripNotifs, discoveryNotifs, emailNotifs, emailFrequency) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE activeTripNotifs = COALESCE(?, activeTripNotifs), discoveryNotifs = COALESCE(?, discoveryNotifs), emailNotifs = COALESCE(?, emailNotifs), emailFrequency = COALESCE(?, emailFrequency)`,
          [ctx.user.id, input.activeTripNotifs ?? true, input.discoveryNotifs ?? true, input.emailNotifs ?? true, input.emailFrequency ?? 'daily', input.activeTripNotifs ?? null, input.discoveryNotifs ?? null, input.emailNotifs ?? null, input.emailFrequency ?? null]
        );
        await conn.end();
        return { success: true };
      }),
  }),

  // ─── My Space Router (Espace Intérieur Client) ───────────────────────────────
  mySpace: router({
    getTrips: protectedProcedure
      .input(z.object({ status: z.enum(['draft', 'proposed', 'accepted', 'confirmed', 'completed', 'cancelled', 'all']).default('all') }))
      .query(async ({ ctx, input }) => {
        const mysql = await import('mysql2/promise');
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        const where = input.status === 'all' ? 'userId = ?' : 'userId = ? AND status = ?';
        const params: any[] = input.status === 'all' ? [ctx.user.id] : [ctx.user.id, input.status];
        const [rows] = await conn.execute(`SELECT * FROM tripPlans WHERE ${where} ORDER BY updatedAt DESC LIMIT 50`, params) as any;
        await conn.end();
        return rows as any[];
      }),
    getActiveTrip: protectedProcedure.query(async ({ ctx }) => {
      const mysql = await import('mysql2/promise');
      const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
      const [rows] = await conn.execute(
        'SELECT ats.*, tp.title, tp.destinationCity, tp.destinationCountry, tp.startDate, tp.endDate FROM activeTripSessions ats JOIN tripPlans tp ON ats.tripPlanId = tp.id WHERE ats.userId = ? AND ats.isActive = 1 ORDER BY ats.startedAt DESC LIMIT 1',
        [ctx.user.id]
      ) as any;
      await conn.end();
      return (rows[0] || null) as any;
    }),
    activateTrip: protectedProcedure
      .input(z.object({ tripPlanId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const mysql = await import('mysql2/promise');
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        await conn.execute('UPDATE activeTripSessions SET isActive = 0 WHERE userId = ?', [ctx.user.id]);
        await conn.execute('INSERT INTO activeTripSessions (tripPlanId, userId, isActive) VALUES (?, ?, 1)', [input.tripPlanId, ctx.user.id]);
        await conn.execute('UPDATE tripPlans SET status = "confirmed" WHERE id = ? AND userId = ?', [input.tripPlanId, ctx.user.id]);
        await conn.execute('INSERT INTO notifications (userId, type, title, body, data) VALUES (?, "trip_reminder", ?, ?, ?)', [ctx.user.id, '\uD83D\uDDFA\uFE0F Votre parcours est activ\u00e9 !', 'MAYA vous accompagne tout au long de votre voyage. Bon voyage !', JSON.stringify({ tripPlanId: input.tripPlanId })]);
        await conn.end();
        return { success: true };
      }),
    deactivateTrip: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const mysql = await import('mysql2/promise');
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        await conn.execute('UPDATE activeTripSessions SET isActive = 0, completedAt = NOW() WHERE id = ? AND userId = ?', [input.sessionId, ctx.user.id]);
        await conn.end();
        return { success: true };
      }),
    getCompanions: protectedProcedure.query(async ({ ctx }) => {
      const mysql = await import('mysql2/promise');
      const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
      const [rows] = await conn.execute('SELECT * FROM travelCompanions WHERE userId = ? ORDER BY name ASC', [ctx.user.id]) as any;
      await conn.end();
      return rows as any[];
    }),
    addCompanion: protectedProcedure
      .input(z.object({ name: z.string().min(1), relationship: z.string().optional(), dietaryRestrictions: z.string().optional(), preferences: z.string().optional(), birthDate: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const mysql = await import('mysql2/promise');
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        await conn.execute('INSERT INTO travelCompanions (userId, name, relationship, dietaryRestrictions, preferences, birthDate) VALUES (?, ?, ?, ?, ?, ?)', [ctx.user.id, input.name, input.relationship || null, input.dietaryRestrictions || null, input.preferences || null, input.birthDate || null]);
        await conn.end();
        return { success: true };
      }),
    deleteCompanion: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const mysql = await import('mysql2/promise');
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        await conn.execute('DELETE FROM travelCompanions WHERE id = ? AND userId = ?', [input.id, ctx.user.id]);
        await conn.end();
        return { success: true };
      }),
    deleteTrip: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const mysql = await import('mysql2/promise');
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        await conn.execute('DELETE FROM tripPlans WHERE id = ? AND userId = ?', [input.id, ctx.user.id]);
        await conn.end();
         return { success: true };
      }),
  }),

  // ─── Share Router ─────────────────────────────────────────────────────────
  share: router({
    generateLink: protectedProcedure
      .input(z.object({
        type: z.enum(['trip', 'offer', 'destination']),
        resourceId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        coverImage: z.string().optional(),
        expiresInDays: z.number().min(1).max(365).optional().default(30),
      }))
      .mutation(async ({ ctx, input }) => {
        const mysql = await import('mysql2/promise');
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        try {
          const [existing] = await conn.execute(
            'SELECT token FROM shareLinks WHERE userId = ? AND type = ? AND resourceId = ? AND (expiresAt IS NULL OR expiresAt > NOW()) LIMIT 1',
            [ctx.user.id, input.type, input.resourceId]
          ) as any[];
          if (existing.length > 0) return { token: existing[0].token, isNew: false };
          const crypto = await import('crypto');
          const token = crypto.default.randomBytes(16).toString('hex');
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays ?? 30));
          await conn.execute(
            'INSERT INTO shareLinks (token, type, resourceId, userId, title, description, coverImage, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [token, input.type, input.resourceId, ctx.user.id, input.title ?? null, input.description ?? null, input.coverImage ?? null, expiresAt]
          );
          return { token, isNew: true };
        } finally { await conn.end(); }
      }),

    getSharedContent: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const mysql = await import('mysql2/promise');
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        try {
          const [links] = await conn.execute(
            'SELECT * FROM shareLinks WHERE token = ? AND (expiresAt IS NULL OR expiresAt > NOW()) LIMIT 1',
            [input.token]
          ) as any[];
          if (!links.length) return null;
          const link = links[0];
          await conn.execute('UPDATE shareLinks SET viewCount = viewCount + 1 WHERE token = ?', [input.token]);
          if (link.type === 'trip') {
            const [trips] = await conn.execute(
              'SELECT id, title, destination, startDate, totalDays, tripType, status, coverImage, summary FROM tripPlans WHERE id = ? LIMIT 1',
              [link.resourceId]
            ) as any[];
            return { link, resource: trips[0] || null };
          } else if (link.type === 'offer') {
            const [offers] = await conn.execute(
              'SELECT id, name, category, location, originalPrice, discountedPrice, discountPercent, coverImage, shortDescription FROM discountOffers WHERE id = ? LIMIT 1',
              [link.resourceId]
            ) as any[];
            return { link, resource: offers[0] || null };
          }
          return { link, resource: null };
        } finally { await conn.end(); }
      }),

    getMyLinks: protectedProcedure
      .query(async ({ ctx }) => {
        const mysql = await import('mysql2/promise');
        const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
        try {
          const [rows] = await conn.execute(
            'SELECT * FROM shareLinks WHERE userId = ? ORDER BY createdAt DESC LIMIT 50',
            [ctx.user.id]
          ) as any[];
          return rows;
        } finally { await conn.end(); }
      }),
  }),

  // ─── Stripe Checkout ───────────────────────────────────────────────────────────
  stripe: router({
    createCheckoutSession: protectedProcedure
      .input(z.object({
        planId: z.enum(["social", "duo", "annuel"]),
        origin: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const StripeLib = (await import("stripe")).default;
        const stripe = new StripeLib(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" as any });
        const plan = PLANS[input.planId];
        if (!plan || !plan.stripePriceId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Plan invalide ou gratuit" });
        }
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          customer_email: ctx.user.email ?? undefined,
          line_items: [{ price: plan.stripePriceId ?? "", quantity: 1 }],
          allow_promotion_codes: true,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email || "",
            customer_name: ctx.user.name || "",
            plan_id: input.planId,
          },
          success_url: `${input.origin}/profil?upgrade=success`,
          cancel_url: `${input.origin}/premium?cancelled=true`,
        });
        return { url: session.url };
      }),
  }),
});
export type AppRouter = typeof appRouter;
