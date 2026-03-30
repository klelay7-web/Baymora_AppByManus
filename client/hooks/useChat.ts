import { useState, useCallback, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  language: 'en' | 'fr';
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// ─── Crédits ─────────────────────────────────────────────────────────────────

export interface CreditsInfo {
  used: number;
  limit: number;
  remaining: number;
  cost?: number;
  model?: 'opus' | 'sonnet' | 'fallback';
}

export interface UnlockTier {
  id: string;
  credits: number;
  priceEur: number;
  label: string;
}

export interface UpgradeOptions {
  nextPlan?: string;
  nextPlanPrice?: number;
  unlockTiers?: UnlockTier[];
  subscriptionHint?: string;
  creditPacks?: Array<{
    id: string;
    name: string;
    credits: number;
    priceEur: number;
    bonusLabel?: string;
  }>;
}

export function useChat(initialConversationId?: string) {
  const [conversationId, setConversationId] = useState(
    initialConversationId || ''
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // ─── État crédits ──────────────────────────────────────────────────────────
  const [credits, setCredits] = useState<CreditsInfo | null>(null);
  const [creditsExhausted, setCreditsExhausted] = useState(false);
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOptions | null>(null);

  /**
   * Démarrer une nouvelle conversation
   */
  const startChat = useCallback(
    async (language: 'en' | 'fr' = 'fr', title?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/chat/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language, title }),
        });

        if (!response.ok) {
          throw new Error('Failed to start chat');
        }

        const data = await response.json();
        setConversationId(data.conversationId);
        setMessages([]);
        setCreditsExhausted(false);
        setUpgradeOptions(null);
        return data.conversationId;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Envoyer un message — gère HTTP 402 (crédits épuisés)
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !content.trim()) {
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            content: content.trim(),
          }),
        });

        // ── Crédits épuisés → déclencher la porte dorée ──────────────────
        if (response.status === 402) {
          const data = await response.json();
          setCreditsExhausted(true);
          setCredits(data.credits || null);
          setUpgradeOptions(data.upgrade || null);
          return null;
        }

        if (!response.ok) {
          // Essayer de lire l'erreur serveur pour un message utile
          let serverError = 'Erreur lors de l\'envoi du message';
          try {
            const errData = await response.json();
            serverError = errData.error || serverError;
          } catch {}
          throw new Error(serverError);
        }

        const data = await response.json();

        // Mettre à jour les crédits si renvoyés par le serveur
        if (data.credits) {
          setCredits(data.credits);
          setCreditsExhausted(false);
        }

        // Add user message
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            role: 'user',
            content: content.trim(),
            timestamp: new Date().toISOString(),
          },
        ]);

        // Add assistant response
        setMessages((prev) => [
          ...prev,
          {
            id: data.messageId,
            role: 'assistant',
            content: data.response,
            timestamp: data.timestamp,
          },
        ]);

        return data.messageId;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );

  /**
   * Charger une conversation
   */
  const loadConversation = useCallback(
    async (convId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/chat/conversations/${convId}`
        );

        if (!response.ok) {
          throw new Error('Failed to load conversation');
        }

        const data = await response.json();
        setConversationId(convId);
        setMessages(data.messages);
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Lister les conversations
   */
  const listConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/conversations');

      if (!response.ok) {
        throw new Error('Failed to load conversations');
      }

      const data = await response.json();
      setConversations(data.conversations);
      return data.conversations;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Supprimer une conversation
   */
  const deleteConversation = useCallback(
    async (convId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/chat/conversations/${convId}`,
          { method: 'DELETE' }
        );

        if (!response.ok) {
          throw new Error('Failed to delete conversation');
        }

        if (conversationId === convId) {
          setConversationId('');
          setMessages([]);
        }

        setConversations((prev) =>
          prev.filter((c) => c.id !== convId)
        );

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );

  /** Réinitialiser l'état crédits (après un achat) */
  const resetCreditsGate = useCallback(() => {
    setCreditsExhausted(false);
    setUpgradeOptions(null);
  }, []);

  return {
    conversationId,
    messages,
    isLoading,
    error,
    conversations,
    credits,
    creditsExhausted,
    upgradeOptions,
    startChat,
    sendMessage,
    loadConversation,
    listConversations,
    deleteConversation,
    setConversationId,
    resetCreditsGate,
  };
}
