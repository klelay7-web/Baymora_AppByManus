import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Sparkles, Send, Mic, MicOff, RotateCcw } from "lucide-react";
import MessageRenderer from "@/components/MessageRenderer";

const QUICK_CHOICES = [
  { icon: "🏨", title: "Escapade luxe à proximité", desc: "Hôtel premium avec remise, proche de chez vous", prompt: "Je cherche une escapade luxe à proximité avec un hôtel premium" },
  { icon: "✨", title: "Parcours sur-mesure", desc: "Maya crée votre voyage idéal de A à Z", prompt: "Je veux un parcours sur-mesure complet" },
  { icon: "🎯", title: "Découvrir les bons plans", desc: "Restos, bars, activités autour de vous", prompt: "Montre-moi les bons plans et activités" },
  { icon: "👑", title: "Déléguer totalement", desc: "Notre conciergerie s'occupe de tout", prompt: "Je veux déléguer totalement mon voyage à votre équipe" },
];

const DESTINATIONS = ["Paris", "Côte d'Azur", "Reims", "Deauville", "New York", "Bali"];

const SESSION_KEY = "baymora_conv_id";

interface Message {
  id: string;
  role: "user" | "maya";
  content: string;
  timestamp: Date;
}

export default function Maya() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? parseInt(stored, 10) : null;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const firstName = user?.name?.split(" ")[0] || "vous";

  // ─── Crédits backend ───────────────────────────────────────────────────────
  const { data: creditsData } = trpc.credits.getBalance.useQuery(undefined, {
    enabled: !!user,
  });

  const isOwner = user?.openId === import.meta.env.VITE_OWNER_OPEN_ID;
  const isPaid = user?.subscriptionTier !== "free";
  const isUnlimited = isOwner || isPaid;
  const freeUsed = creditsData?.freeMessagesUsed ?? 0;
  const FREE_LIMIT = 3;
  const creditsLeft = isUnlimited ? 999 : Math.max(0, FREE_LIMIT - freeUsed);

  // ─── Créer une conversation au mount si pas de session ─────────────────────
  const createConvMutation = trpc.chat.createConversation.useMutation({
    onSuccess: (data) => {
      setConversationId(data.id);
      sessionStorage.setItem(SESSION_KEY, String(data.id));
    },
  });

  useEffect(() => {
    if (user && !conversationId) {
      createConvMutation.mutate({ title: "Conversation Maya" });
    }
  }, [user]);

  // ─── Envoyer un message ────────────────────────────────────────────────────
  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onMutate: () => setIsTyping(true),
    onSettled: () => setIsTyping(false),
    onSuccess: (data) => {
      const text = data?.rawContent || data?.cleanMessage;
      if (text) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "_maya",
            role: "maya",
            content: text,
            timestamp: new Date(),
          },
        ]);
      }
    },
    onError: (err) => {
      const isUpgrade = err.message === "UPGRADE_REQUIRED";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_err",
          role: "maya",
          content: isUpgrade
            ? "Vous avez utilisé vos 3 messages gratuits. Rejoignez le Social Club à 9,90€/mois pour continuer avec Maya illimitée.\n\n:::QR:::Voir les forfaits | Continuer gratuitement:::END:::"
            : "Désolée, une erreur est survenue. Réessayez dans un instant.",
          timestamp: new Date(),
        },
      ]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    if (!user && creditsLeft <= 0) return;
    if (!conversationId && user) return; // Attendre la création de la conv

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: msg,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    sendMessageMutation.mutate({
      content: msg,
      conversationId: conversationId ?? 0,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    sessionStorage.removeItem(SESSION_KEY);
    setConversationId(null);
    if (user) {
      createConvMutation.mutate({ title: "Nouvelle conversation" });
    }
  };

  const isOnboarding = messages.length === 0;

  return (
    <div
      className="flex flex-col"
      style={{ background: "#070B14", color: "#F0EDE6", height: "100dvh", maxHeight: "100dvh", overflow: "hidden" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{
          background: "rgba(7, 11, 20, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(200, 169, 110, 0.1)",
        }}
      >
        <Link href="/maison">
          <button className="p-2 -ml-2">
            <ArrowLeft size={20} color="#8B8D94" />
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}
          >
            <Sparkles size={14} color="#070B14" />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "#F0EDE6" }}>Maya</div>
            <div className="text-[10px]" style={{ color: "#C8A96E" }}>Assistante Maison Baymora</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: isUnlimited ? "#C8A96E" : "#8B8D94" }}>
            {isUnlimited ? "Accès illimité" : `${creditsLeft} crédit${creditsLeft > 1 ? "s" : ""}`}
          </span>
          <button className="p-2" onClick={handleNewConversation} title="Nouvelle conversation">
            <RotateCcw size={16} color="#8B8D94" />
          </button>
        </div>
      </div>

      {/* Zone messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollBehavior: "smooth" }}>
        <div className="max-w-[700px] mx-auto space-y-4">
          {isOnboarding ? (
            <div className="flex flex-col items-center pt-4 pb-2">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4 animate-float"
                style={{
                  background: "linear-gradient(135deg, #C8A96E, #E8D5A8)",
                  boxShadow: "0 0 30px rgba(200, 169, 110, 0.3)",
                }}
              >
                <Sparkles size={32} color="#070B14" />
              </div>
              <h2
                className="text-xl font-bold text-center mb-2"
                style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
              >
                Bonjour {firstName} !
              </h2>
              <p className="text-sm text-center mb-6 max-w-xs" style={{ color: "#8B8D94", whiteSpace: "pre-line" }}>
Je connais les meilleures adresses du monde.
Et bientôt, je connaîtrai les vôtres.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 w-full max-w-lg mb-6" style={{ gap: 12 }}>
                {QUICK_CHOICES.map((choice, i) => (
                  <button
                    key={i}
                    className="text-left p-4 rounded-xl card-hover"
                    style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.15)" }}
                    onClick={() => handleSend(choice.prompt)}
                  >
                    <div className="text-2xl mb-2">{choice.icon}</div>
                    <div className="text-sm font-semibold mb-1" style={{ color: "#F0EDE6" }}>{choice.title}</div>
                    <div className="text-xs" style={{ color: "#8B8D94" }}>{choice.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap justify-center" style={{ gap: 8 }}>
                {DESTINATIONS.map((dest) => (
                  <button key={dest} className="pill-item" onClick={() => handleSend(`Je veux explorer ${dest}`)}>
                    {dest}
                  </button>
                ))}
              </div>
              {!user && (
                <p className="text-xs mt-6 text-center" style={{ color: "#8B8D94" }}>
                  {creditsLeft} messages gratuits ·{" "}
                  <Link href="/auth">
                    <span style={{ color: "#C8A96E" }}>Créer un compte pour continuer</span>
                  </Link>
                </p>
              )}
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
                >
                  {msg.role === "maya" && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0 self-end"
                      style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}
                    >
                      <Sparkles size={14} color="#070B14" />
                    </div>
                  )}
                  <div
                    className="max-w-[85%] px-4 py-3"
                    style={{
                      background: msg.role === "user" ? "#161B26" : "rgba(200, 169, 110, 0.06)",
                      border: msg.role === "maya" ? "1px solid rgba(200, 169, 110, 0.15)" : "none",
                      borderRadius: msg.role === "user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                    }}
                  >
                    {msg.role === "maya" ? (
                      <MessageRenderer content={msg.content} onSend={handleSend} />
                    ) : (
                      <span className="text-sm" style={{ color: "#F0EDE6" }}>{msg.content}</span>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start animate-slide-up">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}
                  >
                    <Sparkles size={14} color="#070B14" />
                  </div>
                  <div
                    className="px-4 py-3 flex gap-1 items-center"
                    style={{
                      background: "rgba(200, 169, 110, 0.08)",
                      border: "1px solid rgba(200, 169, 110, 0.2)",
                      borderRadius: "1rem 1rem 1rem 0.25rem",
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full animate-typing-dot"
                        style={{ background: "#C8A96E", animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div
        className="flex-shrink-0 px-4 py-3"
        style={{
          background: "rgba(7, 11, 20, 0.95)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(200, 169, 110, 0.1)",
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div
          className="flex items-end gap-2 rounded-2xl px-3 py-2"
          style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.2)" }}
        >
          <button className="p-2 flex-shrink-0 self-end mb-0.5" onClick={() => setIsRecording((r) => !r)}>
            {isRecording ? <MicOff size={20} color="#ef4444" /> : <Mic size={20} color="#8B8D94" />}
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Dites à Maya ce dont vous rêvez..."
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm py-2"
            style={{ color: "#F0EDE6", minHeight: "40px", maxHeight: "120px" }}
          />
          <button
            className="p-2 flex-shrink-0 self-end mb-0.5 rounded-xl transition-all"
            style={{
              background: input.trim() ? "linear-gradient(135deg, #C8A96E, #E8D5A8)" : "rgba(200, 169, 110, 0.1)",
              opacity: input.trim() ? 1 : 0.5,
            }}
            onClick={() => handleSend()}
            disabled={!input.trim()}
          >
            <Send size={18} color={input.trim() ? "#070B14" : "#C8A96E"} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-[10px]" style={{ color: isUnlimited ? "#C8A96E" : "#8B8D94" }}>
            {isUnlimited
              ? "Conversations illimitées"
              : creditsLeft === 0
              ? "Plus de messages gratuits"
              : creditsLeft === 1
              ? "1 message gratuit restant"
              : `${creditsLeft} messages gratuits restants`}
          </span>
          {!user && (
            <Link href="/auth">
              <span className="text-[10px]" style={{ color: "#C8A96E" }}>Créer un compte</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
