import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  conversationId: string;
  language?: 'en' | 'fr';
  onConversationCreated?: (id: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId: initialConversationId,
  language = 'fr',
  onConversationCreated,
}) => {
  const [conversationId, setConversationId] = useState(
    initialConversationId
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize conversation on mount
  useEffect(() => {
    const initializeChat = async () => {
      if (!conversationId) {
        try {
          const response = await fetch('/api/chat/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language }),
          });

          if (response.ok) {
            const data = await response.json();
            setConversationId(data.conversationId);
            onConversationCreated?.(data.conversationId);
          }
        } catch (error) {
          console.error('Erreur lors de l\'initialisation:', error);
        }
      }
      setIsInitializing(false);
    };

    initializeChat();
  }, [language, onConversationCreated]);

  // Load conversation if ID changed
  useEffect(() => {
    if (conversationId && !isInitializing) {
      loadConversation();
    }
  }, [conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async () => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(
          data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        );
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content: userMessage.content,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: data.messageId,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(data.timestamp),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      const errorMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content:
          language === 'fr'
            ? 'Désolé, une erreur s\'est produite. Veuillez réessayer.'
            : 'Sorry, an error occurred. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!conversationId) return;

    if (
      !confirm(
        language === 'fr'
          ? 'Êtes-vous sûr ? Cette action ne peut pas être annulée.'
          : 'Are you sure? This cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      setMessages([]);
      setInput('');

      // Create new conversation
      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversationId(data.conversationId);
        onConversationCreated?.(data.conversationId);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  if (isInitializing) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">
            {language === 'fr' ? 'Initialisation...' : 'Initializing...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-white rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">
            {language === 'fr' ? 'Baymora - Assistant' : 'Baymora - Assistant'}
          </h3>
          <p className="text-xs text-white/80">
            {language === 'fr'
              ? 'Votre assistant de voyage premium'
              : 'Your premium travel assistant'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearChat}
          className="text-white hover:bg-white/20"
          title={language === 'fr' ? 'Effacer la conversation' : 'Clear chat'}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="inline-block p-3 bg-primary/10 rounded-lg mb-3">
                <span className="text-2xl">✨</span>
              </div>
              <p className="text-muted-foreground text-sm">
                {language === 'fr'
                  ? 'Commencez votre conversation avec Baymora'
                  : 'Start your conversation with Baymora'}
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 animate-slide-up',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-semibold text-xs">
                  B
                </div>
              )}

              <div
                className={cn(
                  'max-w-xs px-4 py-2 rounded-lg',
                  message.role === 'user'
                    ? 'bg-primary text-white rounded-br-none'
                    : 'bg-white border border-border text-foreground rounded-bl-none'
                )}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
                <p
                  className={cn(
                    'text-xs mt-1 opacity-70',
                    message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
                  )}
                >
                  {message.timestamp.toLocaleTimeString(
                    language === 'fr' ? 'fr-FR' : 'en-US',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 text-secondary font-semibold text-xs">
                  👤
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 animate-slide-up">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            </div>
            <div className="bg-white border border-border text-foreground rounded-lg px-4 py-2">
              <p className="text-sm text-muted-foreground">
                {language === 'fr' ? 'Baymora répond...' : 'Baymora is responding...'}
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-white p-4">
        <div className="flex gap-2">
          <Input
            placeholder={
              language === 'fr'
                ? 'Dites-moi vos envies de voyage...'
                : 'Tell me your travel dreams...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            size="sm"
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {language === 'fr'
            ? 'Appuyez sur Entrée pour envoyer'
            : 'Press Enter to send'}
        </p>
      </div>
    </div>
  );
};
