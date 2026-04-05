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
import { chatWithManus, delibererAriaEtManus, creerMission, MANUS_PROFILE, STRATEGIE_LANCEMENT } from "./services/ai/manusAgent";
import type { ManusMessage } from "./services/ai/manusAgent";
import { genererArticleBlog, genererPostSocial, genererCalendrierEditorial, rechercherVideoVirale } from "./services/ai/creativeAgent";
import { genererEmail, repondreCommentaire, gererMessagePrive, genererEmailProspection } from "./services/ai/communicationAgent";
import { rechercherPrestataires, genererStrategieAffiliation, analyserPartenaire, PROGRAMMES_AFFILIATION } from "./services/ai/affiliationAgent";

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
  const isAdmin = ctx.user.role === "admin";
  if (!isOwner && !isAdmin) {
    console.log("[ARIA] Access denied - user.openId:", ctx.user.openId, "ownerOpenId:", ENV.ownerOpenId, "role:", ctx.user.role);
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

        // Construire le system prompt dynamique avec profil client
        const systemPrompt = buildSystemPrompt(clientProfile);

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
  // ─── Pilotage (ARIA DG — Owner Only) ──────────────────────────────────────────
  pilotage: router({
    // Chat avec ARIA DG
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
        return chatWithDG(input.message, stats);
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
        dietRegime: z.string().optional(),
        dietAllergies: z.string().optional(),
        dietOther: z.string().optional(),
        travelStyles: z.string().optional(),
        travelBudget: z.enum(["economique", "confort", "premium", "luxe", "sans_limite"]).optional(),
        travelGroup: z.enum(["solo", "couple", "famille", "amis", "business"]).optional(),
        travelMobility: z.enum(["aucune", "pmr", "reduite", "poussette"]).optional(),
        languages: z.string().optional(),
        pet: z.enum(["aucun", "chien", "chat", "autre"]).optional(),
        smoking: z.enum(["non_fumeur", "fumeur", "cigare", "vape"]).optional(),
        dresscode: z.enum(["casual", "smart_casual", "chic", "formel"]).optional(),
        ecofriendly: z.boolean().optional(),
        homeCity: z.string().max(128).optional(),
        homeAddress: z.string().optional(),
        preferredAirport: z.string().max(16).optional(),
        airportLounge: z.boolean().optional(),
        priorityLane: z.boolean().optional(),
        clothingSize: z.string().max(16).optional(),
        shoeSize: z.string().max(8).optional(),
        favoriteAlcohol: z.string().max(128).optional(),
        favoriteCuisine: z.string().max(256).optional(),
        sleepPreference: z.string().max(128).optional(),
        tempPreference: z.string().max(64).optional(),
        freeNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertClientProfile(ctx.user.id, input);
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

  // ─── MANUS — Agent Directeur Technique (binôme ARIA) ─────────────────────────
  manus: router({
    // Chat avec MANUS
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
    // Délibération ARIA+MANUS
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

});
export type AppRouter = typeof appRouter;
