import { Router, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { callLLM, type LLMMessage } from '../services/ai/llm';
import { getUserById } from './users';
import { prisma } from '../db';
import type { Message } from '../types';

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
      const llmResult = await callLLM(llmMessages, baymoraUser.id, conversation.language as 'fr' | 'en', userRecord, msgCount);

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

      res.status(200).json({
        messageId: assistantMsg.id,
        response: llmResult.content,
        conversationId,
        timestamp: assistantMsg.createdAt,
      });

    } else {
      // ── Guest : conversation en mémoire
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
      const llmResult = await callLLM(llmMessages, conv.userId, conv.language as 'fr' | 'en', null, guestMsgCount);

      const assistantMsg: Message = { id: uuidv4(), role: 'assistant', content: llmResult.content, timestamp: new Date() };
      conv.messages.push(assistantMsg);
      conv.updatedAt = new Date();

      const signals = extractProfileSignals(conv.messages);
      conv.pendingProfile = { ...conv.pendingProfile, ...signals };

      res.status(200).json({
        messageId: assistantMsg.id,
        response: llmResult.content,
        conversationId,
        timestamp: assistantMsg.timestamp,
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

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post('/start', handleStartChat);
router.post('/message', handleSendMessage);
router.get('/conversations', handleListConversations);
router.get('/conversations/:id', handleGetConversation);
router.delete('/conversations/:id', handleDeleteConversation);

export default router;
