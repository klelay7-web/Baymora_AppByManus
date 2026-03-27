import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  conversationId?: string;
  language?: 'en' | 'fr';
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId: initialConvId = '',
  language = 'fr',
}) => {
  const [conversationId, setConversationId] = useState(initialConvId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat
  useEffect(() => {
    const initChat = async () => {
      try {
        const response = await fetch('/api/chat/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language }),
        });

        const data = await response.json();
        setConversationId(data.conversationId);
        console.log('Chat started:', data.conversationId);
      } catch (err) {
        console.error('Error starting chat:', err);
        setError('Erreur d\'initialisation');
      }
    };

    if (!conversationId) {
      initChat();
    }
  }, [conversationId, language]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId || isLoading) return;

    const userMsg = input.trim();
    setInput('');

    // Add user message immediately
    const userMessage: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: userMsg,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content: userMsg,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        id: data.messageId,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(data.timestamp),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error sending message:', errMsg);
      setError('Erreur lors de l\'envoi');
      
      // Add error message
      const errorMessage: Message = {
        id: Math.random().toString(),
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
      setError(null);

      // Start new conversation
      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      });

      const data = await response.json();
      setConversationId(data.conversationId);
    } catch (err) {
      console.error('Error clearing chat:', err);
      setError('Erreur lors de la suppression');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-border overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Baymora - Assistant</h3>
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
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-4">✨</div>
              <p className="text-muted-foreground">
                {language === 'fr'
                  ? 'Commencez votre conversation avec Baymora'
                  : 'Start your conversation with Baymora'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs">
                    B
                  </div>
                )}

                <div
                  className={`max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-white border border-border text-foreground rounded-bl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 text-secondary font-bold text-xs">
                    👤
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                </div>
                <div className="bg-white border border-border rounded-lg px-4 py-2">
                  <p className="text-sm text-muted-foreground">
                    {language === 'fr' ? 'Baymora réfléchit...' : 'Baymora is thinking...'}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm text-center">
                {error}
              </div>
            )}
          </>
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
          >
            <Send className="h-4 w-4" />
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
