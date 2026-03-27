import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Send, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useChat } from '@/hooks/useChat';

const WELCOME_SUGGESTIONS = [
  "Je veux partir à St Tropez ce week-end",
  "Surprends-moi, propose-moi un voyage",
  "Séjour romantique pour deux, budget ouvert",
  "Escapade avec mon chien, 3 jours",
];

export default function Chat() {
  const [input, setInput] = useState('');
  const [started, setStarted] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    error,
    conversationId,
    startChat,
    sendMessage,
    deleteConversation,
  } = useChat();

  useEffect(() => {
    startChat('fr');
    setStarted(true);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input;
    setInput('');
    await sendMessage(msg);
  };

  const handleSuggestion = async (suggestion: string) => {
    setInput('');
    await sendMessage(suggestion);
  };

  const handleClear = async () => {
    if (!conversationId) return;
    await deleteConversation(conversationId);
    await startChat('fr');
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white gap-1.5 px-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center text-white font-bold text-sm">
              B
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-none">Baymora</p>
              <p className="text-white/40 text-xs mt-0.5">Assistant de voyage</p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={isLoading}
          className="text-white/40 hover:text-white/80"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-8 animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center mx-auto mb-4 border border-secondary/20">
                <span className="text-2xl font-bold text-secondary">B</span>
              </div>
              <h2 className="text-white text-xl font-semibold mb-2">Comment puis-je vous aider ?</h2>
              <p className="text-white/40 text-sm max-w-xs">
                Dites-moi où vous voulez aller, ou laissez-moi vous surprendre.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {WELCOME_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestion(suggestion)}
                  className="text-left px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white/70 text-sm hover:bg-white/10 hover:text-white hover:border-secondary/30 transition-all duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={msg.id || i}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 border border-secondary/20 flex items-center justify-center flex-shrink-0 text-secondary font-bold text-xs mt-1">
                B
              </div>
            )}
            <div
              className={`max-w-sm md:max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-white/8 border border-white/10 text-white/90 rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 border border-secondary/20 flex items-center justify-center flex-shrink-0">
              <Loader2 className="h-4 w-4 text-secondary animate-spin" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white/8 border border-white/10">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-red-400/80 text-xs py-2">{error}</div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-3 border-t border-white/10 bg-slate-950/80 backdrop-blur-sm">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <Input
            placeholder="Dites-moi vos envies..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={isLoading}
            className="flex-1 bg-white/8 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-secondary/50 focus-visible:border-secondary/50"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="sm"
            className="bg-secondary hover:bg-secondary/90 text-white px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-center text-white/20 text-xs mt-2">
          Baymora — Votre conciergerie de voyage
        </p>
      </div>
    </div>
  );
}
