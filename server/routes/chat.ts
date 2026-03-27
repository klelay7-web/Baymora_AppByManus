import { Router, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth';
import { callLLM, type LLMMessage } from '../services/ai/llm';

const router = Router();

// Types pour les conversations en mémoire (remplacer par DB en Phase 2.5)
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  userId: string;
  title: string;
  language: 'en' | 'fr';
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Store en mémoire (remplacer par PostgreSQL + Prisma)
const conversationStore = new Map<string, Conversation>();
const userConversations = new Map<string, string[]>();

/**
 * POST /api/chat/start
 * Démarrer une nouvelle conversation
 */
export const handleStartChat: RequestHandler = async (req, res) => {
  try {
    const { language = 'fr', title } = req.body;
    const userId = (req as any).admin?.userId || 'guest-' + uuidv4();

    const conversationId = uuidv4();
    const conversation: Conversation = {
      id: conversationId,
      userId,
      title: title || `Conversation ${new Date().toLocaleDateString('fr-FR')}`,
      language: language as 'en' | 'fr',
      messages: [],
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
    res.status(500).json({
      error: 'Erreur lors de la création de la conversation',
      code: 'CHAT_ERROR',
    });
  }
};

/**
 * POST /api/chat/message
 * Envoyer un message et obtenir une réponse
 */
export const handleSendMessage: RequestHandler = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    if (!conversationId || !content) {
      res.status(400).json({
        error: 'conversationId et content requis',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const conversation = conversationStore.get(conversationId);
    if (!conversation) {
      res.status(404).json({
        error: 'Conversation non trouvée',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Ajouter le message de l'utilisateur
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    conversation.messages.push(userMessage);

    // Construire l'historique pour le LLM
    const llmMessages: LLMMessage[] = conversation.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const userId = (req as any).admin?.userId || conversation.userId;
    const llmResult = await callLLM(llmMessages, userId, conversation.language);
    const assistantResponse = llmResult.content;

    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: assistantResponse,
      timestamp: new Date(),
    };

    conversation.messages.push(assistantMessage);
    conversation.updatedAt = new Date();

    console.log(
      `[CHAT] Message reçu dans ${conversationId}: ${content.substring(0, 50)}...`
    );

    res.status(200).json({
      messageId: assistantMessage.id,
      response: assistantMessage.content,
      conversationId,
      timestamp: assistantMessage.timestamp,
    });
  } catch (error) {
    console.error('Erreur sendMessage:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'envoi du message',
      code: 'CHAT_ERROR',
    });
  }
};

/**
 * GET /api/chat/conversations
 * Lister les conversations de l'utilisateur
 */
export const handleListConversations: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).admin?.userId || 'guest-default';

    const conversationIds = userConversations.get(userId) || [];
    const conversations = conversationIds
      .map((id) => conversationStore.get(id))
      .filter(Boolean) as Conversation[];

    const summary = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      language: conv.language,
      messageCount: conv.messages.length,
      lastMessage:
        conv.messages.length > 0
          ? conv.messages[conv.messages.length - 1].content.substring(0, 100)
          : null,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));

    res.status(200).json({
      conversations: summary,
      total: summary.length,
    });
  } catch (error) {
    console.error('Erreur listConversations:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des conversations',
      code: 'CHAT_ERROR',
    });
  }
};

/**
 * GET /api/chat/conversations/:id
 * Récupérer une conversation complète
 */
export const handleGetConversation: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = conversationStore.get(id);

    if (!conversation) {
      res.status(404).json({
        error: 'Conversation non trouvée',
        code: 'NOT_FOUND',
      });
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
    res.status(500).json({
      error: 'Erreur lors de la récupération de la conversation',
      code: 'CHAT_ERROR',
    });
  }
};

/**
 * DELETE /api/chat/conversations/:id
 * Supprimer une conversation
 */
export const handleDeleteConversation: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).admin?.userId || 'guest-default';

    const conversation = conversationStore.get(id);
    if (!conversation) {
      res.status(404).json({
        error: 'Conversation non trouvée',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Vérifier que c'est la conversation de l'utilisateur
    if (conversation.userId !== userId) {
      res.status(403).json({
        error: 'Vous ne pouvez pas supprimer cette conversation',
        code: 'FORBIDDEN',
      });
      return;
    }

    conversationStore.delete(id);

    const userConvs = userConversations.get(userId) || [];
    userConversations.set(
      userId,
      userConvs.filter((cid) => cid !== id)
    );

    console.log(`[CHAT] Conversation supprimée: ${id}`);

    res.status(200).json({ message: 'Conversation supprimée' });
  } catch (error) {
    console.error('Erreur deleteConversation:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression',
      code: 'CHAT_ERROR',
    });
  }
};

// Enregistrer les routes
router.post('/start', handleStartChat);
router.post('/message', handleSendMessage);
router.get('/conversations', handleListConversations);
router.get('/conversations/:id', handleGetConversation);
router.delete('/conversations/:id', handleDeleteConversation);

export default router;
