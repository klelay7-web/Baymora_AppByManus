import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Send, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const WELCOME_SUGGESTIONS = [
  "Je veux partir à St Tropez ce week-end",
  "Surprends-moi, propose-moi un voyage",
  "Séjour romantique pour deux, budget ouvert",
  "Escapade avec mon chien, 3 jours",
];

export default function Chat() {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Re-focus input after AI responds
    if (!isLoading) inputRef.current?.focus();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input;
    setInput('');
    await sendMessage(msg);
  };

  const handleSuggestion = async (suggestion: string) => {
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm flex-shrink-0">
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
                  disabled={isLoading}
                  className="text-left px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white/70 text-sm hover:bg-white/10 hover:text-white hover:border-secondary/30 transition-all duration-200 disabled:opacity-40"
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
              className={`max-w-sm md:max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-slate-800/60 border border-white/10 text-white/90 rounded-bl-sm'
              }`}
            >
              {msg.role === 'user' ? (
                msg.content
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-base font-bold text-white mb-2 mt-1">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm font-bold text-secondary mb-2 mt-3 first:mt-0">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold text-white/90 mb-1 mt-2">{children}</h3>,
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-none space-y-1 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="text-white/85">{children}</li>,
                    strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="text-white/70 italic">{children}</em>,
                    hr: () => <hr className="border-white/10 my-3" />,
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-2">
                        <table className="w-full text-xs border-collapse">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="border-b border-white/20">{children}</thead>,
                    th: ({ children }) => <th className="text-left py-1.5 px-2 text-white/60 font-medium">{children}</th>,
                    td: ({ children }) => <td className="py-1.5 px-2 border-b border-white/5 text-white/80">{children}</td>,
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-secondary underline underline-offset-2 hover:text-secondary/80">
                        {children}
                      </a>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-secondary/50 pl-3 my-2 text-white/60 italic">{children}</blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-white/10 rounded px-1 py-0.5 text-xs font-mono text-secondary">{children}</code>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 border border-secondary/20 flex items-center justify-center flex-shrink-0">
              <Loader2 className="h-4 w-4 text-secondary animate-spin" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-slate-800/60 border border-white/10">
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
      <div className="px-4 pb-6 pt-3 border-t border-white/10 bg-slate-950/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            placeholder="Dites-moi vos envies..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={isLoading}
            autoFocus
            className="flex-1 h-10 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-secondary/60 focus:ring-1 focus:ring-secondary/40 disabled:opacity-50 disabled:cursor-not-allowed"
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
