import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, Plus, ArrowLeft, Mic } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { getLoginUrl } from "@/const";
import { Streamdown } from "streamdown";
import { useRoute } from "wouter";

interface Message {
  id?: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
}

export default function Chat() {
  const { user, isAuthenticated } = useAuth();
  const [, params] = useRoute("/chat/:id");
  const conversationId = params?.id ? parseInt(params.id) : null;

  const [input, setInput] = useState("");
  const [activeConversation, setActiveConversation] = useState<number | null>(conversationId);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: conversations, refetch: refetchConversations } = trpc.chat.getConversations.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: serverMessages } = trpc.chat.getMessages.useQuery(
    { conversationId: activeConversation! },
    { enabled: !!activeConversation && isAuthenticated }
  );

  const createConversation = trpc.chat.createConversation.useMutation({
    onSuccess: (data) => {
      setActiveConversation(data.id);
      refetchConversations();
    },
  });

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setLocalMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content, createdAt: new Date() },
      ]);
      setIsTyping(false);
    },
    onError: (error) => {
      setLocalMessages((prev) => [
        ...prev,
        { role: "assistant", content: error.message, createdAt: new Date() },
      ]);
      setIsTyping(false);
    },
  });

  useEffect(() => {
    if (serverMessages) {
      setLocalMessages(serverMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
      })));
    }
  }, [serverMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");

    // If not authenticated, show login prompt after 3 messages
    if (!isAuthenticated) {
      const freeCount = localMessages.filter((m) => m.role === "user").length;
      if (freeCount >= 3) {
        setLocalMessages((prev) => [
          ...prev,
          { role: "user", content: userMessage },
          {
            role: "assistant",
            content: "Vous avez utilisé vos **3 messages gratuits**. Pour continuer à profiter de votre concierge IA personnel, [passez au plan Premium](/pricing) (90€/mois, sans engagement).",
          },
        ]);
        return;
      }
    }

    // Create conversation if needed
    let convId = activeConversation;
    if (!convId && isAuthenticated) {
      const result = await createConversation.mutateAsync({ title: userMessage.substring(0, 50) });
      convId = result.id;
    }

    setLocalMessages((prev) => [...prev, { role: "user", content: userMessage, createdAt: new Date() }]);
    setIsTyping(true);

    if (convId && isAuthenticated) {
      sendMessage.mutate({ conversationId: convId, content: userMessage });
    } else {
      // Demo mode for non-authenticated users
      setTimeout(() => {
        setLocalMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Bienvenue chez **Baymora** ! Je suis votre concierge IA personnel. Je peux vous aider à planifier des voyages d'exception, trouver les meilleurs restaurants étoilés, ou organiser des expériences uniques partout dans le monde.\n\nQue puis-je faire pour vous aujourd'hui ?",
          },
        ]);
        setIsTyping(false);
      }, 1500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Chat Header */}
      <header className="glass-card border-b border-gold/10 px-4 py-3 flex items-center gap-3 z-10">
        <Link href="/">
          <ArrowLeft size={20} className="text-muted-foreground hover:text-gold transition-colors md:hidden" />
        </Link>
        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
          <Sparkles size={16} className="text-gold" />
        </div>
        <div className="flex-1">
          <h1 className="text-sm font-semibold font-serif">Concierge Baymora</h1>
          <p className="text-[10px] text-muted-foreground">
            {isTyping ? "En train d'écrire..." : "En ligne — Prêt à vous inspirer"}
          </p>
        </div>
        {isAuthenticated && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-gold"
            onClick={() => {
              setActiveConversation(null);
              setLocalMessages([]);
            }}
          >
            <Plus size={18} />
          </Button>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-hide">
        {localMessages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles size={28} className="text-gold" />
            </div>
            <h2 className="font-serif text-2xl font-bold mb-3">
              Bienvenue chez <span className="text-gradient-gold">Baymora</span>
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-8">
              Votre concierge IA personnel pour des voyages d'exception. Dites-moi où vous rêvez d'aller.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Week-end romantique à Venise",
                "Meilleurs restaurants de Tokyo",
                "Safari de luxe en Tanzanie",
                "Spa & wellness à Bali",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                  className="text-xs px-3 py-2 rounded-full border border-gold/20 text-gold/80 hover:bg-gold/10 hover:text-gold transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {localMessages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-gold text-navy-dark rounded-br-sm"
                    : "glass-card rounded-bl-sm"
                }`}
              >
                <div className={`text-sm leading-relaxed ${msg.role === "user" ? "" : "prose prose-invert prose-sm max-w-none"}`}>
                  {msg.role === "assistant" ? (
                    <Streamdown>{msg.content}</Streamdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="glass-card rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="glass-card border-t border-gold/10 p-3 pb-[env(safe-area-inset-bottom,12px)]">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Où rêvez-vous d'aller ?"
              rows={1}
              className="w-full resize-none bg-secondary/50 border border-border rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/30 placeholder:text-muted-foreground/50"
              style={{ maxHeight: "120px" }}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            size="icon"
            className="bg-gold text-navy-dark hover:bg-gold-light h-11 w-11 rounded-xl shrink-0"
          >
            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </Button>
        </div>
        {!isAuthenticated && (
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            {3 - localMessages.filter((m) => m.role === "user").length} message(s) gratuit(s) restant(s) —{" "}
            <a href={getLoginUrl()} className="text-gold hover:underline">Connectez-vous</a> pour plus
          </p>
        )}
      </div>
    </div>
  );
}
