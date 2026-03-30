import { Router, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { callLLM, type LLMMessage } from '../services/ai/llm';
import { getUserById } from './users';
import { prisma } from '../db';
import type { Message } from '../types';
import { CREDIT_PACKS, UNLOCK_SINGLE_PRICE_CENTS } from '../types';
import { sendEmail } from '../services/email';
import {
  checkUserCredits, checkGuestCredits,
  deductUserCredits, deductGuestCredits,
  calculateCreditCost, buildGuestFingerprint,
  checkUserPerplexity, checkGuestPerplexity,
  checkGuestIPLimit,
} from '../services/credits';

const router = Router();

const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES_PER_CONVERSATION = 200;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// userId temporaire pour les guests (pas en DB, stocké en session)
const guestConvStore = new Map<string, string>(); // conversationId → guestId

async function getOrCreateGuestConversation(conversationId: string, guestId: string, language: string) {
  try {
    return await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  } catch {
    return null;
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const handleStartChat: RequestHandler = async (req, res) => {
  try {
    const { language = 'fr', title } = req.body;
    const baymoraUser = (req as any).baymoraUser;

    // Pour les guests : créer un user temporaire en DB ou utiliser un ID fictif
    let userId = baymoraUser?.id;
    if (!userId) {
      // Guest : on crée une conversation sans userId valide
      // On utilise un ID temporaire préfixé
      userId = 'guest-' + uuidv4();
    }

    // Pour les guests, on crée la conversation avec un userId "guest-xxx"
    // qui n'existe pas en DB — on la stocke en mémoire légère
    const conversationId = uuidv4();

    if (baymoraUser?.id) {
      // Utilisateur authentifié : conversation en base
      await prisma.conversation.create({
        data: {
          id: conversationId,
          userId: baymoraUser.id,
          title: title || `Conversation ${new Date().toLocaleDateString('fr-FR')}`,
          language,
          pendingProfile: {},
        },
      });
    } else {
      // Guest : conversation en mémoire (légère, pas critique)
      guestConvStore.set(conversationId, userId);
      guestConvMap.set(conversationId, {
        id: conversationId,
        userId,
        title: title || `Conversation ${new Date().toLocaleDateString('fr-FR')}`,
        language,
        messages: [],
        pendingProfile: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    console.log(`[CHAT] Conversation créée: ${conversationId}`);
    res.status(201).json({ conversationId, language, createdAt: new Date() });
  } catch (error) {
    console.error('Erreur startChat:', error);
    res.status(500).json({ error: 'Erreur création conversation', code: 'CHAT_ERROR' });
  }
};

export const handleSendMessage: RequestHandler = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    if (!conversationId || !content) {
      res.status(400).json({ error: 'conversationId et content requis', code: 'VALIDATION_ERROR' });
      return;
    }
    if (typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ error: 'Message invalide', code: 'VALIDATION_ERROR' });
      return;
    }
    if (content.trim().length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({ error: `Message trop long (max ${MAX_MESSAGE_LENGTH} chars)`, code: 'MESSAGE_TOO_LONG' });
      return;
    }

    const trimmed = content.trim();
    const baymoraUser = (req as any).baymoraUser;

    // ── Build guest fingerprint for credit tracking ─────────────────────────
    const guestFingerprint = !baymoraUser?.id
      ? buildGuestFingerprint(req.ip || 'unknown', req.headers['user-agent'] || 'unknown')
      : null;

    // ── Anti-abus : max 3 sessions guest par IP par jour ────────────────────
    if (guestFingerprint && !checkGuestIPLimit(req.ip || 'unknown')) {
      res.status(429).json({
        error: 'Trop de sessions depuis cette adresse. Créez un compte pour continuer.',
        code: 'GUEST_IP_LIMIT',
      });
      return;
    }

    // ── Vérification crédits AVANT l'appel IA ───────────────────────────────
    const creditCheck = baymoraUser?.id
      ? await checkUserCredits(baymoraUser.id)
      : await checkGuestCredits(guestFingerprint!);

    if (!creditCheck.allowed) {
      res.status(402).json({
        error: 'Crédits épuisés',
        code: 'CREDITS_EXHAUSTED',
        credits: {
          used: creditCheck.used,
          limit: creditCheck.limit,
          remaining: 0,
        },
        upgrade: creditCheck.upgradeOptions,
      });
      return;
    }

    // ── Vérification Perplexity disponible (pour gating côté LLM) ───────────
    const perplexityCheck = baymoraUser?.id
      ? await checkUserPerplexity(baymoraUser.id)
      : await checkGuestPerplexity(guestFingerprint!);

    // ── Conversation en base (utilisateur authentifié)
    if (baymoraUser?.id) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });

      if (!conversation) {
        res.status(404).json({ error: 'Conversation non trouvée', code: 'NOT_FOUND' });
        return;
      }
      if (conversation.userId !== baymoraUser.id) {
        res.status(403).json({ error: 'Accès non autorisé', code: 'FORBIDDEN' });
        return;
      }
      if (conversation.messages.length >= MAX_MESSAGES_PER_CONVERSATION) {
        res.status(429).json({ error: 'Limite de messages atteinte', code: 'CONVERSATION_LIMIT' });
        return;
      }

      // Sauvegarder message utilisateur
      await prisma.message.create({
        data: { conversationId, role: 'user', content: trimmed },
      });

      // Préparer historique LLM
      const llmMessages: LLMMessage[] = [
        ...conversation.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: trimmed },
      ];

      const userRecord = await getUserById(baymoraUser.id);
      const msgCount = llmMessages.filter(m => m.role === 'user').length;
      const llmResult = await callLLM(llmMessages, baymoraUser.id, conversation.language as 'fr' | 'en', userRecord, msgCount, perplexityCheck.allowed);

      // ── Décompte crédits après l'appel ────────────────────────────────────
      const deduction = calculateCreditCost(
        llmResult.model === 'fallback' ? 'fallback' : llmResult.model,
        llmResult.usedPerplexity ?? false,
      );
      if (deduction.totalCost > 0) {
        await deductUserCredits(baymoraUser.id, deduction);
      }

      // Sauvegarder réponse assistant
      const assistantMsg = await prisma.message.create({
        data: { conversationId, role: 'assistant', content: llmResult.content },
      });

      // Extraction silencieuse du profil
      const allMessages = [
        ...conversation.messages,
        { role: 'user', content: trimmed, timestamp: new Date() },
        { role: 'assistant', content: llmResult.content, timestamp: new Date() },
      ] as Message[];
      const signals = extractProfileSignals(allMessages);
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          pendingProfile: { ...(conversation.pendingProfile as object), ...signals },
          updatedAt: new Date(),
        },
      });

      // Récupérer le solde mis à jour
      const updatedCredits = await checkUserCredits(baymoraUser.id);

      res.status(200).json({
        messageId: assistantMsg.id,
        response: llmResult.content,
        conversationId,
        timestamp: assistantMsg.createdAt,
        credits: {
          used: updatedCredits.used,
          limit: updatedCredits.limit,
          remaining: updatedCredits.remaining,
          cost: deduction.totalCost,
          model: deduction.model,
        },
      });

    } else {
      // ── Guest : conversation en mémoire ───────────────────────────────────
      const conv = guestConvMap.get(conversationId);
      if (!conv) {
        res.status(404).json({ error: 'Conversation non trouvée', code: 'NOT_FOUND' });
        return;
      }
      if (conv.messages.length >= MAX_MESSAGES_PER_CONVERSATION) {
        res.status(429).json({ error: 'Limite de messages atteinte', code: 'CONVERSATION_LIMIT' });
        return;
      }

      const userMsg: Message = { id: uuidv4(), role: 'user', content: trimmed, timestamp: new Date() };
      conv.messages.push(userMsg);

      const llmMessages: LLMMessage[] = conv.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      const guestMsgCount = llmMessages.filter(m => m.role === 'user').length;
      const llmResult = await callLLM(llmMessages, conv.userId, conv.language as 'fr' | 'en', null, guestMsgCount, perplexityCheck.allowed);

      // ── Décompte crédits guest ────────────────────────────────────────────
      const deduction = calculateCreditCost(
        llmResult.model === 'fallback' ? 'fallback' : llmResult.model,
        llmResult.usedPerplexity ?? false,
      );
      if (deduction.totalCost > 0 && guestFingerprint) {
        await deductGuestCredits(guestFingerprint, deduction);
      }

      const assistantMsg: Message = { id: uuidv4(), role: 'assistant', content: llmResult.content, timestamp: new Date() };
      conv.messages.push(assistantMsg);
      conv.updatedAt = new Date();

      const signals = extractProfileSignals(conv.messages);
      conv.pendingProfile = { ...conv.pendingProfile, ...signals };

      // Récupérer solde guest mis à jour
      const updatedCredits = guestFingerprint
        ? await checkGuestCredits(guestFingerprint)
        : { used: 0, limit: 15, remaining: 15 };

      res.status(200).json({
        messageId: assistantMsg.id,
        response: llmResult.content,
        conversationId,
        timestamp: assistantMsg.timestamp,
        credits: {
          used: updatedCredits.used,
          limit: updatedCredits.limit,
          remaining: updatedCredits.remaining,
          cost: deduction.totalCost,
          model: deduction.model,
        },
      });
    }
  } catch (error) {
    console.error('Erreur sendMessage:', error);
    res.status(500).json({ error: 'Erreur envoi message', code: 'CHAT_ERROR' });
  }
};

export const handleGetConversation: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const baymoraUser = (req as any).baymoraUser;

    if (baymoraUser?.id) {
      const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
      if (!conversation) {
        res.status(404).json({ error: 'Conversation non trouvée', code: 'NOT_FOUND' });
        return;
      }
      if (conversation.userId !== baymoraUser.id) {
        res.status(403).json({ error: 'Accès non autorisé', code: 'FORBIDDEN' });
        return;
      }
      res.json({
        id: conversation.id,
        title: conversation.title,
        language: conversation.language,
        messages: conversation.messages.map(m => ({ id: m.id, role: m.role, content: m.content, timestamp: m.createdAt })),
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      });
    } else {
      const conv = guestConvMap.get(id);
      if (!conv) {
        res.status(404).json({ error: 'Conversation non trouvée', code: 'NOT_FOUND' });
        return;
      }
      res.json(conv);
    }
  } catch (error) {
    console.error('Erreur getConversation:', error);
    res.status(500).json({ error: 'Erreur récupération', code: 'CHAT_ERROR' });
  }
};

export const handleListConversations: RequestHandler = async (req, res) => {
  try {
    const baymoraUser = (req as any).baymoraUser;
    if (!baymoraUser?.id) {
      res.json({ conversations: [], total: 0 });
      return;
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId: baymoraUser.id },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      conversations: conversations.map(c => ({
        id: c.id,
        title: c.title,
        language: c.language,
        messageCount: c.messages.length,
        lastMessage: c.messages[0]?.content?.substring(0, 100) || null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      total: conversations.length,
    });
  } catch (error) {
    console.error('Erreur listConversations:', error);
    res.status(500).json({ error: 'Erreur liste conversations', code: 'CHAT_ERROR' });
  }
};

export const handleDeleteConversation: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const baymoraUser = (req as any).baymoraUser;

    if (baymoraUser?.id) {
      const conversation = await prisma.conversation.findUnique({ where: { id } });
      if (!conversation) {
        res.status(404).json({ error: 'Conversation non trouvée', code: 'NOT_FOUND' });
        return;
      }
      if (conversation.userId !== baymoraUser.id) {
        res.status(403).json({ error: 'Accès non autorisé', code: 'FORBIDDEN' });
        return;
      }
      await prisma.conversation.delete({ where: { id } });
    } else {
      guestConvMap.delete(id);
    }

    res.json({ message: 'Conversation supprimée' });
  } catch (error) {
    console.error('Erreur deleteConversation:', error);
    res.status(500).json({ error: 'Erreur suppression', code: 'CHAT_ERROR' });
  }
};

// ─── Store léger pour les guests (conversations non critiques) ────────────────

interface GuestConversation {
  id: string;
  userId: string;
  title: string;
  language: string;
  messages: Message[];
  pendingProfile: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const guestConvMap = new Map<string, GuestConversation>();

// Export pour absorption du profil guest lors de l'inscription
export function getGuestConversation(id: string): GuestConversation | undefined {
  return guestConvMap.get(id);
}

// ─── Extraction silencieuse des signaux de profil ─────────────────────────────

export function extractProfileSignals(messages: Message[]): Record<string, any> {
  const signals: Record<string, any> = {};
  const styles: string[] = [];
  const destinations: string[] = [];

  for (const msg of messages) {
    if (msg.role !== 'user') continue;
    const t = msg.content.toLowerCase();
    const raw = msg.content;

    if (/vegan|végétalien/.test(t)) signals.diet = 'vegan';
    else if (/végétar/.test(t)) signals.diet = 'vegetarian';
    if (/sans gluten|celiac|cœliaque/.test(t)) signals.glutenFree = true;
    if (/allergi|intoléran/.test(t)) signals.dietaryRestrictions = true;
    if (/\b(mon chien|ma chienne|avec mon chien)\b/.test(t)) signals.pets = true;
    if (/\b(mon chat|avec mon chat)\b/.test(t)) signals.pets = true;
    if (/enfant|bébé|fils|fille|gamin|kid/.test(t)) signals.children = true;
    if (/écolog|durable|carbone|bilan co2|sustainable/.test(t)) signals.ecoConscious = true;

    if (/sans limite|illimité|budget ouvert/.test(t)) signals.budgetTier = 'unlimited';
    else if (/luxe|palace|premium|haut de gamme|first class/.test(t)) signals.budgetTier = 'premium';
    else if (/économ|budget serré|pas trop cher/.test(t)) signals.budgetTier = 'economy';

    if (/\bseul\b|\bsolo\b/.test(t)) signals.travelWith = 'solo';
    if (/en couple|avec (ma |mon )?(femme|mari|compagnon|partenaire)/.test(t)) signals.travelWith = 'couple';
    if (/avec (mes |nos )?enfants|en famille/.test(t)) signals.travelWith = 'family';
    if (/entre amis|avec (mes )?(amis|potes|copains)/.test(t)) signals.travelWith = 'friends';

    if (/fête|nightlife|club|soirée/.test(t) && !styles.includes('nightlife')) styles.push('nightlife');
    if (/gastronomie|gourmet|étoil|restaurant/.test(t) && !styles.includes('gastronomy')) styles.push('gastronomy');
    if (/spa|chill|détente|repos|relax/.test(t) && !styles.includes('relaxation')) styles.push('relaxation');
    if (/culture|musée|patrimoine|histoire/.test(t) && !styles.includes('culture')) styles.push('culture');
    if (/nature|randonnée|montagne|forêt/.test(t) && !styles.includes('nature')) styles.push('nature');
    if (/romantiqu|amour/.test(t) && !styles.includes('romantic')) styles.push('romantic');

    const destMatches = raw.match(/(?:à|vers|pour|en|au)\s+([A-ZÀ-Ÿ][a-zà-ÿA-ZÀ-Ÿ\s-]{2,20})/g);
    if (destMatches) {
      for (const d of destMatches) {
        const clean = d.replace(/^(?:à|vers|pour|en|au)\s+/i, '').trim();
        if (clean.length > 2 && !destinations.includes(clean)) destinations.push(clean);
      }
    }
  }

  if (styles.length > 0) signals.travelStyle = styles;
  if (destinations.length > 0) signals.mentionedDestinations = destinations;

  // Détection contacts
  const contacts: Record<string, any> = {};
  for (const msg of messages) {
    if (msg.role !== 'user') continue;
    const raw = msg.content;
    const patterns = [
      { regex: /ma\s+femme\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'femme' },
      { regex: /mon\s+mari\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'mari' },
      { regex: /mon\s+ami\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'ami' },
      { regex: /mon\s+amie\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'amie' },
      { regex: /mon\s+(?:petit.?ami|copain)\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'petit-ami' },
      { regex: /ma\s+(?:petite.?amie|copine)\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'petite-amie' },
      { regex: /mon\s+frère\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'frère' },
      { regex: /ma\s+sœur\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'sœur' },
      { regex: /avec\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'inconnu' },
    ];
    const STOP = /^(moi|toi|lui|elle|nous|vous|eux|mon|ma|mes|le|la|les|un|une|des|ce|plaisir|joie)$/i;
    for (const { regex, rel } of patterns) {
      let match;
      regex.lastIndex = 0;
      while ((match = regex.exec(raw)) !== null) {
        const name = match[1];
        if (STOP.test(name) || name.length < 2 || name.length > 20) continue;
        if (!contacts[name]) contacts[name] = { name, relationship: rel };
        else if (rel !== 'inconnu' && contacts[name].relationship === 'inconnu') contacts[name].relationship = rel;
      }
    }
  }
  if (Object.keys(contacts).length > 0) signals.contacts = contacts;

  return signals;
}

// ─── Export plan ─────────────────────────────────────────────────────────────

function buildPlanEmailHtml(plan: any): string {
  const TRANSPORT_LABELS: Record<string, string> = {
    vtc: 'VTC', chauffeur: 'Chauffeur privé', metro: 'Transport en commun',
    self: 'Personnel', location: 'Location voiture', walk: 'À pied', same: 'Identique à l\'aller',
  };
  const tl = (mode?: string) => (mode ? TRANSPORT_LABELS[mode] || mode : 'À définir');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{background:#080c14;color:#e5e7eb;font-family:-apple-system,sans-serif;padding:32px;max-width:600px;margin:0 auto}
h1{color:#c8a94a;font-size:22px;margin-bottom:4px}
h2{color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:6px;margin-top:24px}
.item{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:10px 14px;margin:6px 0;font-size:13px}
.item b{color:#f3f4f6}.item p{color:#9ca3af;margin:3px 0 0;font-size:12px}
.badge{background:rgba(200,169,74,.15);color:#c8a94a;border-radius:99px;padding:2px 8px;font-size:11px;margin-left:8px}
.selected{border-color:rgba(34,197,94,.25);background:rgba(34,197,94,.04)}
a{color:#c8a94a;text-decoration:none}footer{margin-top:40px;padding-top:16px;border-top:1px solid rgba(255,255,255,.06);color:#4b5563;font-size:11px;text-align:center}
</style></head><body>
<h1>🌍 ${plan.destination || 'Votre voyage'}</h1>
${plan.dates ? `<p style="color:#9ca3af;font-size:13px">📅 ${plan.dates}${plan.duration ? ` · ${plan.duration}` : ''}</p>` : ''}
${plan.travelers ? `<p style="color:#9ca3af;font-size:13px">👥 ${plan.travelers} voyageur${plan.travelers > 1 ? 's' : ''}${plan.travelerNames?.length ? ` : ${plan.travelerNames.join(', ')}` : ''}</p>` : ''}
${plan.budget ? `<p style="font-size:13px"><span class="badge">${plan.budget}</span></p>` : ''}

${plan.flights?.length ? `<h2>✈️ Vols</h2>${plan.flights.map((f: any) => `<div class="item ${f.status === 'selected' ? 'selected' : ''}"><b>${f.from} → ${f.to}</b>${f.date ? ` · ${f.date}` : ''}${f.time ? ` ${f.time}` : ''}${f.operator ? `<span class="badge">${f.operator}</span>` : ''}${f.price ? `<span class="badge">${f.price}</span>` : ''}</div>`).join('')}` : ''}

${plan.transport ? `<h2>🚗 Logistique</h2>
${plan.transport.toAirport ? `<div class="item"><b>Aller aéroport</b><span class="badge">${tl(plan.transport.toAirport.mode)}</span>${plan.transport.toAirport.departureTime ? `<p>Départ : ${plan.transport.toAirport.departureTime}</p>` : ''}${plan.transport.toAirport.price ? `<p>${plan.transport.toAirport.price}</p>` : ''}</div>` : ''}
${plan.transport.eatAtAirport !== undefined ? `<div class="item"><b>Repas aéroport</b> : ${plan.transport.eatAtAirport ? 'Oui' : 'Non'}</div>` : ''}
${plan.transport.onSite ? `<div class="item"><b>Sur place</b><span class="badge">${tl(plan.transport.onSite.mode)}</span></div>` : ''}
${plan.transport.return ? `<div class="item"><b>Retour</b><span class="badge">${tl(plan.transport.return.mode)}</span></div>` : ''}` : ''}

${plan.hotels?.length ? `<h2>🏨 Hébergements</h2>${plan.hotels.map((h: any) => `<div class="item ${h.status === 'selected' ? 'selected' : ''}"><b>${h.name}</b>${h.price ? `<span class="badge">${h.price}</span>` : ''}${h.note ? `<p>${h.note}</p>` : ''}${h.bookingUrl ? `<p><a href="${h.bookingUrl}">Réserver →</a></p>` : ''}</div>`).join('')}` : ''}

${plan.restaurants?.length ? `<h2>🍽️ Restaurants</h2>${plan.restaurants.map((r: any) => `<div class="item ${r.status === 'selected' ? 'selected' : ''}"><b>${r.name}</b>${r.stars ? ` ${'★'.repeat(Math.min(r.stars, 3))}` : ''}${r.price ? `<span class="badge">${r.price}</span>` : ''}${r.note ? `<p>${r.note}</p>` : ''}${r.bookingUrl ? `<p><a href="${r.bookingUrl}">Réserver →</a></p>` : ''}</div>`).join('')}` : ''}

${plan.activities?.length ? `<h2>⚡ Activités</h2>${plan.activities.map((a: any) => `<div class="item ${a.status === 'selected' ? 'selected' : ''}"><b>${a.name}</b>${a.day ? `<span class="badge">${a.day}</span>` : ''}${a.price ? `<span class="badge">${a.price}</span>` : ''}${a.bookingUrl ? `<p><a href="${a.bookingUrl}">Réserver →</a></p>` : ''}</div>`).join('')}` : ''}

${plan.notes?.length ? `<h2>📋 Notes</h2>${plan.notes.map((n: string) => `<div class="item">${n}</div>`).join('')}` : ''}

<footer>Plan généré par <a href="https://baymora.com">Baymora</a> · La conciergerie de voyage premium</footer>
</body></html>`;
}

export const handleExportPlan: RequestHandler = async (req, res) => {
  try {
    const { email, plan } = req.body;
    if (!email || !plan) {
      res.status(400).json({ error: 'email et plan requis' });
      return;
    }
    const destination = plan.destination || 'Voyage';
    const html = buildPlanEmailHtml(plan);
    const ok = await sendEmail(email, `Votre plan Baymora — ${destination}`, html);
    res.json({ success: ok });
  } catch (error) {
    console.error('Erreur export plan:', error);
    res.status(500).json({ error: 'Erreur export', code: 'EXPORT_ERROR' });
  }
};

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post('/start', handleStartChat);
router.post('/message', handleSendMessage);
router.post('/export-plan', handleExportPlan);
router.get('/conversations', handleListConversations);
router.get('/conversations/:id', handleGetConversation);
router.delete('/conversations/:id', handleDeleteConversation);

export default router;
