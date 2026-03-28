import { Router, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { callLLM, type LLMMessage } from '../services/ai/llm';
import { getUserById } from './users';
import { conversationStore, userConversations } from '../stores';
import type { Message, Conversation } from '../types';

const router = Router();

// Re-export for consumers (users.ts previously imported this)
export { conversationStore };

// ─── Constantes de sécurité ───────────────────────────────────────────────────

const MAX_MESSAGE_LENGTH = 2000;  // Caractères max par message
const MAX_MESSAGES_PER_CONVERSATION = 200;

// ─── Handlers ─────────────────────────────────────────────────────────────────

/**
 * POST /api/chat/start
 */
export const handleStartChat: RequestHandler = async (req, res) => {
  try {
    const { language = 'fr', title } = req.body;
    const baymoraUser = (req as any).baymoraUser;
    const userId = baymoraUser?.id || 'guest-' + uuidv4();

    const conversationId = uuidv4();
    const conversation: Conversation = {
      id: conversationId,
      userId,
      title: title || `Conversation ${new Date().toLocaleDateString('fr-FR')}`,
      language: language as 'en' | 'fr',
      messages: [],
      pendingProfile: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    conversationStore.set(conversationId, conversation);

    if (!userConversations.has(userId)) {
      userConversations.set(userId, []);
    }
    userConversations.get(userId)!.push(conversationId);

    console.log(`[CHAT] Conversation créée: ${conversationId} pour user ${userId}`);

    res.status(201).json({
      conversationId,
      title: conversation.title,
      language: conversation.language,
      createdAt: conversation.createdAt,
    });
  } catch (error) {
    console.error('Erreur startChat:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la conversation', code: 'CHAT_ERROR' });
  }
};

/**
 * POST /api/chat/message
 */
export const handleSendMessage: RequestHandler = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    // ── Validation entrée
    if (!conversationId || !content) {
      res.status(400).json({ error: 'conversationId et content requis', code: 'VALIDATION_ERROR' });
      return;
    }

    if (typeof content !== 'string') {
      res.status(400).json({ error: 'content doit être une chaîne', code: 'VALIDATION_ERROR' });
      return;
    }

    const trimmed = content.trim();
    if (trimmed.length === 0) {
      res.status(400).json({ error: 'Le message ne peut pas être vide', code: 'VALIDATION_ERROR' });
      return;
    }

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({
        error: `Message trop long (max ${MAX_MESSAGE_LENGTH} caractères)`,
        code: 'MESSAGE_TOO_LONG',
      });
      return;
    }

    const conversation = conversationStore.get(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation non trouvée', code: 'NOT_FOUND' });
      return;
    }

    // ── Vérifier que la conversation appartient à l'utilisateur (ou est guest)
    const baymoraUser = (req as any).baymoraUser;
    const requestUserId = baymoraUser?.id;
    if (requestUserId && conversation.userId !== requestUserId && !conversation.userId.startsWith('guest-')) {
      res.status(403).json({ error: 'Accès non autorisé', code: 'FORBIDDEN' });
      return;
    }

    // ── Limite de messages par conversation (anti-abus)
    if (conversation.messages.length >= MAX_MESSAGES_PER_CONVERSATION) {
      res.status(429).json({
        error: 'Limite de messages atteinte pour cette conversation. Démarrez une nouvelle conversation.',
        code: 'CONVERSATION_LIMIT',
      });
      return;
    }

    // ── Ajouter le message utilisateur
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    conversation.messages.push(userMessage);

    // ── Préparer l'historique LLM
    const llmMessages: LLMMessage[] = conversation.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const userId = baymoraUser?.id || conversation.userId;
    const userRecord = userId ? getUserById(userId) : null;
    const llmResult = await callLLM(llmMessages, userId, conversation.language, userRecord);

    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: llmResult.content,
      timestamp: new Date(),
    };

    conversation.messages.push(assistantMessage);
    conversation.updatedAt = new Date();

    // ── Extraction silencieuse des signaux de profil
    const signals = extractProfileSignals(conversation.messages);
    conversation.pendingProfile = { ...conversation.pendingProfile, ...signals };

    console.log(`[CHAT] Message dans ${conversationId}: "${trimmed.substring(0, 50)}..."`);

    res.status(200).json({
      messageId: assistantMessage.id,
      response: assistantMessage.content,
      conversationId,
      timestamp: assistantMessage.timestamp,
    });
  } catch (error) {
    console.error('Erreur sendMessage:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message', code: 'CHAT_ERROR' });
  }
};

/**
 * GET /api/chat/conversations
 */
export const handleListConversations: RequestHandler = async (req, res) => {
  try {
    const baymoraUser = (req as any).baymoraUser;
    const userId = baymoraUser?.id || 'guest-default';

    const conversationIds = userConversations.get(userId) || [];
    const conversations = conversationIds
      .map((id) => conversationStore.get(id))
      .filter(Boolean) as Conversation[];

    const summary = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      language: conv.language,
      messageCount: conv.messages.length,
      lastMessage: conv.messages.length > 0
        ? conv.messages[conv.messages.length - 1].content.substring(0, 100)
        : null,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));

    res.status(200).json({ conversations: summary, total: summary.length });
  } catch (error) {
    console.error('Erreur listConversations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des conversations', code: 'CHAT_ERROR' });
  }
};

/**
 * GET /api/chat/conversations/:id
 * FIX: Ownership check ajouté (était absent)
 */
export const handleGetConversation: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const baymoraUser = (req as any).baymoraUser;
    const conversation = conversationStore.get(id);

    if (!conversation) {
      res.status(404).json({ error: 'Conversation non trouvée', code: 'NOT_FOUND' });
      return;
    }

    // Vérifier la propriété : authentifié doit être le propriétaire
    if (baymoraUser && conversation.userId !== baymoraUser.id && !conversation.userId.startsWith('guest-')) {
      res.status(403).json({ error: 'Accès non autorisé', code: 'FORBIDDEN' });
      return;
    }

    res.status(200).json({
      id: conversation.id,
      title: conversation.title,
      language: conversation.language,
      messages: conversation.messages,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });
  } catch (error) {
    console.error('Erreur getConversation:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la conversation', code: 'CHAT_ERROR' });
  }
};

/**
 * DELETE /api/chat/conversations/:id
 */
export const handleDeleteConversation: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const baymoraUser = (req as any).baymoraUser;
    const userId = baymoraUser?.id || 'guest-default';

    const conversation = conversationStore.get(id);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation non trouvée', code: 'NOT_FOUND' });
      return;
    }

    if (conversation.userId !== userId) {
      res.status(403).json({ error: 'Vous ne pouvez pas supprimer cette conversation', code: 'FORBIDDEN' });
      return;
    }

    conversationStore.delete(id);
    const userConvs = userConversations.get(userId) || [];
    userConversations.set(userId, userConvs.filter((cid) => cid !== id));

    console.log(`[CHAT] Conversation supprimée: ${id}`);
    res.status(200).json({ message: 'Conversation supprimée' });
  } catch (error) {
    console.error('Erreur deleteConversation:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression', code: 'CHAT_ERROR' });
  }
};

// ─── Extraction silencieuse des signaux de profil ─────────────────────────────

export function extractProfileSignals(messages: Message[]): Record<string, any> {
  const signals: Record<string, any> = {};
  const styles: string[] = [];
  const destinations: string[] = [];

  for (const msg of messages) {
    if (msg.role !== 'user') continue;
    const t = msg.content.toLowerCase();
    const raw = msg.content;

    // ── Régime alimentaire
    if (/vegan|végétalien/.test(t)) signals.diet = 'vegan';
    else if (/végétar/.test(t)) signals.diet = 'vegetarian';
    if (/sans gluten|celiac|cœliaque/.test(t)) signals.glutenFree = true;
    if (/allergi|intoléran/.test(t)) signals.dietaryRestrictions = true;

    // ── Animaux — regex plus précise (évite "chat" générique)
    if (/\b(mon chien|ma chienne|mon toutou|with my dog|avec mon chien)\b/.test(t)) signals.pets = true;
    if (/\b(mon chat|ma chatte|avec mon chat)\b/.test(t)) signals.pets = true;

    // ── Enfants
    if (/enfant|bébé|fils|fille|gamin|kid/.test(t)) signals.children = true;

    // ── Sensibilité écologique
    if (/écolog|durable|carbone|bilan co2|vert\b|green\b|sustainable|responsable/.test(t)) signals.ecoConscious = true;

    // ── Budget
    if (/sans limite|illimité|budget ouvert|peu importe le prix/.test(t)) signals.budgetTier = 'unlimited';
    else if (/luxe|palace|premium|haut de gamme|first class|business class/.test(t)) signals.budgetTier = 'premium';
    else if (/économ|budget serré|pas trop cher/.test(t)) signals.budgetTier = 'economy';

    // ── Compagnons
    if (/\bseul\b|\bsolo\b/.test(t)) signals.travelWith = 'solo';
    if (/en couple|avec (ma |mon )?(femme|mari|compagnon|compagne|partenaire|petit.?ami|grande?.?ami)/.test(t)) signals.travelWith = 'couple';
    if (/avec (mes |nos )?enfants|en famille/.test(t)) signals.travelWith = 'family';
    if (/entre amis|avec (mes )?(amis|potes|copains|copines)/.test(t)) signals.travelWith = 'friends';

    // ── Styles de voyage
    if (/fête|nightlife|club|soirée|discothèque/.test(t) && !styles.includes('nightlife')) styles.push('nightlife');
    if (/gastronomie|gourmet|étoil|restaurant/.test(t) && !styles.includes('gastronomy')) styles.push('gastronomy');
    if (/spa|chill|détente|repos|relax|ressource/.test(t) && !styles.includes('relaxation')) styles.push('relaxation');
    if (/culture|musée|patrimoine|histoire|art/.test(t) && !styles.includes('culture')) styles.push('culture');
    if (/nature|randonnée|montagne|forêt|trek/.test(t) && !styles.includes('nature')) styles.push('nature');
    if (/sport|adrénalin|surf|ski|plongée/.test(t) && !styles.includes('sport')) styles.push('sport');
    if (/romantiqu|amour|anniversaire de couple/.test(t) && !styles.includes('romantic')) styles.push('romantic');

    // ── Destinations mentionnées
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

  // ── Détection des personnes mentionnées (graphe social)
  const contacts: Record<string, any> = signals.contacts || {};

  for (const msg of messages) {
    if (msg.role !== 'user') continue;
    const raw = msg.content;

    const relationPatterns: Array<{ regex: RegExp; rel: string }> = [
      { regex: /ma\s+femme\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'femme' },
      { regex: /mon\s+mari\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'mari' },
      { regex: /mon\s+(?:petit.?ami|copain)\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'petit-ami' },
      { regex: /ma\s+(?:petite.?amie|copine)\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'petite-amie' },
      { regex: /mon\s+partenaire\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'partenaire' },
      { regex: /ma\s+partenaire\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'partenaire' },
      { regex: /mon\s+ami\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'ami' },
      { regex: /mon\s+amie\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'amie' },
      { regex: /mon\s+(?:fils|garçon)\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'fils' },
      { regex: /ma\s+fille\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'fille' },
      { regex: /mon\s+frère\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'frère' },
      { regex: /ma\s+sœur\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'sœur' },
      { regex: /mon\s+collègue\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'collègue' },
      { regex: /ma\s+collègue\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'collègue' },
      { regex: /mon\s+associé\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g, rel: 'associé' },
      { regex: /avec\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)(?:\s+et\s+([A-ZÀ-Ÿ][a-zà-ÿ]+))?/g, rel: 'inconnu' },
    ];

    for (const { regex, rel } of relationPatterns) {
      let match;
      regex.lastIndex = 0;
      while ((match = regex.exec(raw)) !== null) {
        const name = match[1];
        const STOP_WORDS = /^(moi|toi|lui|elle|nous|vous|eux|mon|ma|mes|le|la|les|un|une|des|ce|cet|cette|plaisir|plaisirs|joie|soin|soins)$/i;
        if (STOP_WORDS.test(name)) continue;
        if (name.length < 2 || name.length > 20) continue;

        if (!contacts[name]) {
          contacts[name] = { name, relationship: rel, firstMentionedAt: msg.timestamp };
        } else if (rel !== 'inconnu' && contacts[name].relationship === 'inconnu') {
          contacts[name].relationship = rel;
        }
        contacts[name].lastSeenWith = raw.substring(0, 80);
      }
    }

    // Âge mentionné : "Marie a 35 ans"
    const agePattern = /([A-ZÀ-Ÿ][a-zà-ÿ]+)\s+a\s+(\d{1,2})\s+ans/g;
    let ageMatch;
    while ((ageMatch = agePattern.exec(raw)) !== null) {
      const name = ageMatch[1];
      const age = parseInt(ageMatch[2]);
      if (age >= 1 && age <= 120 && contacts[name]) contacts[name].age = age;
    }

    // Anniversaire : "l'anniv de Marie c'est le 15 mars"
    const anniPattern = /anniv(?:ersaire)?\s+de\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)[^\d]*(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/gi;
    const months: Record<string, string> = {
      janvier:'01', février:'02', mars:'03', avril:'04', mai:'05', juin:'06',
      juillet:'07', août:'08', septembre:'09', octobre:'10', novembre:'11', décembre:'12'
    };
    let anniMatch;
    while ((anniMatch = anniPattern.exec(raw)) !== null) {
      const name = anniMatch[1];
      const day = anniMatch[2].padStart(2, '0');
      const month = months[anniMatch[3].toLowerCase()];
      if (month) {
        if (!contacts[name]) contacts[name] = { name, relationship: 'inconnu' };
        contacts[name].birthday = `${month}-${day}`;
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
