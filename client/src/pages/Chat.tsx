import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Sparkles, Loader2, Plus, ArrowLeft, MapPin, Star, Share2, Bookmark, Calendar, Navigation, ExternalLink, ChevronRight, X, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { getLoginUrl } from "@/const";
import { Streamdown } from "streamdown";
import { useRoute } from "wouter";
import { InteractiveMap, type MapEstablishment, type MapDay } from "@/components/InteractiveMap";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Establishment {
  name: string;
  type: string;
  city: string;
  country?: string;
  description: string;
  priceRange?: string;
  coordinates?: { lat: number; lng: number };
}

interface TripDay {
  day: number;
  title: string;
  steps: Array<{
    time: string;
    establishment: string;
    type: string;
    description: string;
    city: string;
    coordinates?: { lat: number; lng: number };
  }>;
}

interface TripSuggestion {
  title: string;
  duration: string;
  style: string;
  days: TripDay[];
}

interface ConciergeMsg {
  message: string;
  quickReplies: string[];
  establishments: Establishment[];
  tripSuggestion: TripSuggestion | null;
  action: string | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  parsed?: ConciergeMsg;
  createdAt?: Date;
}

function parseAssistantMessage(content: string): ConciergeMsg | undefined {
  try {
    const parsed = JSON.parse(content);
    if (parsed.message && parsed.quickReplies) return parsed as ConciergeMsg;
  } catch {
    // Not JSON, return undefined
  }
  return undefined;
}

// ─── Establishment Card ──────────────────────────────────────────
function EstablishmentCard({ est, onSelect, selected }: { est: Establishment; onSelect: (e: Establishment) => void; selected: boolean }) {
  const typeIcons: Record<string, string> = {
    restaurant: "🍽️", hotel: "🏨", activity: "🎭", transport: "✈️", bar: "🍸", spa: "💆",
  };
  return (
    <button
      onClick={() => onSelect(est)}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        selected
          ? "border-[#c8a94a] bg-[#c8a94a]/10"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{typeIcons[est.type] || "📍"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm truncate">{est.name}</h4>
            {est.priceRange && <span className="text-[10px] text-[#c8a94a]">{est.priceRange}</span>}
          </div>
          <p className="text-[11px] text-muted-foreground">{est.city}{est.country ? `, ${est.country}` : ""}</p>
          <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">{est.description}</p>
        </div>
      </div>
    </button>
  );
}

// ─── Quick Reply Buttons ─────────────────────────────────────────
function QuickReplies({ replies, onSelect, showInput, onShowInput }: {
  replies: string[];
  onSelect: (reply: string) => void;
  showInput: boolean;
  onShowInput: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 mt-3"
    >
      {replies.map((reply) => {
        const isOther = reply.includes("Autre");
        return (
          <button
            key={reply}
            onClick={() => isOther ? onShowInput() : onSelect(reply)}
            className={`text-xs px-4 py-2.5 rounded-full border transition-all font-medium ${
              isOther
                ? "border-white/20 text-white/60 hover:bg-white/5 hover:text-white"
                : "border-[#c8a94a]/30 text-[#c8a94a] hover:bg-[#c8a94a]/10 hover:border-[#c8a94a]/50"
            }`}
          >
            {reply}
          </button>
        );
      })}
    </motion.div>
  );
}

// ─── Right Panel: Fiche + Map + Récap ────────────────────────────
function RightPanel({
  selectedEstablishment,
  allEstablishments,
  tripSuggestion,
  onClose,
  onEstablishmentClick,
}: {
  selectedEstablishment: Establishment | null;
  allEstablishments: Establishment[];
  tripSuggestion: TripSuggestion | null;
  onClose: () => void;
  onEstablishmentClick?: (est: Establishment) => void;
}) {
  const [activeTab, setActiveTab] = useState(tripSuggestion ? "parcours" : "carte");

  // Convert to InteractiveMap types
  const mapEstablishments: MapEstablishment[] = useMemo(() =>
    allEstablishments.map(e => ({
      name: e.name,
      type: e.type,
      city: e.city,
      country: e.country,
      description: e.description,
      priceRange: e.priceRange,
      coordinates: e.coordinates,
    })),
    [allEstablishments]
  );

  const mapDays: MapDay[] | undefined = useMemo(() => {
    if (!tripSuggestion) return undefined;
    return tripSuggestion.days.map(d => ({
      day: d.day,
      title: d.title,
      steps: d.steps.map(s => ({
        time: s.time,
        establishment: s.establishment,
        type: s.type,
        description: s.description,
        city: s.city,
        coordinates: s.coordinates,
      })),
    }));
  }, [tripSuggestion]);

  const selectedMapEst: MapEstablishment | null = selectedEstablishment
    ? {
        name: selectedEstablishment.name,
        type: selectedEstablishment.type,
        city: selectedEstablishment.city,
        country: selectedEstablishment.country,
        description: selectedEstablishment.description,
        priceRange: selectedEstablishment.priceRange,
        coordinates: selectedEstablishment.coordinates,
      }
    : null;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="font-serif text-sm font-semibold">
          {selectedEstablishment ? selectedEstablishment.name : tripSuggestion ? tripSuggestion.title : "Votre parcours"}
        </h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-white">
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 bg-white/5">
          <TabsTrigger value="carte" className="text-xs">🗺️ Carte</TabsTrigger>
          {tripSuggestion && <TabsTrigger value="parcours" className="text-xs">📋 Parcours</TabsTrigger>}
          {selectedEstablishment && <TabsTrigger value="fiche" className="text-xs">📍 Fiche</TabsTrigger>}
          <TabsTrigger value="partage" className="text-xs">📤 Partager</TabsTrigger>
        </TabsList>

        {/* Map Tab — Interactive Map with pins, routes, transport, dark mode */}
        <TabsContent value="carte" className="flex-1 m-0 p-0">
          <InteractiveMap
            establishments={mapEstablishments}
            days={mapDays}
            selectedEstablishment={selectedMapEst}
            onEstablishmentClick={(est) => {
              if (onEstablishmentClick) {
                // Convert back to Chat's Establishment type
                onEstablishmentClick(est as unknown as Establishment);
              }
            }}
            showTransportOptions={true}
            showDayNavigation={!!tripSuggestion && !!mapDays && mapDays.length > 1}
            className="w-full h-full min-h-[300px]"
          />
        </TabsContent>

        {/* Parcours Tab */}
        {tripSuggestion && (
          <TabsContent value="parcours" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="border-[#c8a94a]/30 text-[#c8a94a] text-[10px]">{tripSuggestion.style}</Badge>
                  <Badge variant="outline" className="border-white/20 text-white/60 text-[10px]">{tripSuggestion.duration}</Badge>
                </div>
                {tripSuggestion.days.map((day) => (
                  <div key={day.day} className="space-y-2">
                    <h4 className="font-serif text-sm font-semibold text-[#c8a94a]">
                      Jour {day.day} — {day.title}
                    </h4>
                    {day.steps.map((step, si) => (
                      <div key={si} className="flex gap-3 pl-2 border-l-2 border-[#c8a94a]/20 ml-1">
                        <div className="text-[10px] text-muted-foreground w-10 shrink-0 pt-0.5">{step.time}</div>
                        <div className="flex-1 pb-3">
                          <p className="text-xs font-medium">{step.establishment}</p>
                          <p className="text-[11px] text-muted-foreground">{step.description}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">📍 {step.city}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Action buttons */}
                <div className="space-y-2 pt-4 border-t border-white/10">
                  <Button className="w-full bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none text-xs">
                    <Bookmark className="mr-2 h-3 w-3" /> Enregistrer ce parcours
                  </Button>
                  <Button variant="outline" className="w-full border-white/20 text-white rounded-none text-xs">
                    <Calendar className="mr-2 h-3 w-3" /> Synchroniser avec mon calendrier
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        )}

        {/* Fiche Tab */}
        {selectedEstablishment && (
          <TabsContent value="fiche" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* Hero placeholder */}
                <div className="w-full h-40 rounded-lg bg-gradient-to-br from-[#c8a94a]/20 to-[#080c14] flex items-center justify-center">
                  <MapPin size={40} className="text-[#c8a94a]/40" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-bold">{selectedEstablishment.name}</h3>
                    {selectedEstablishment.priceRange && (
                      <span className="text-xs text-[#c8a94a]">{selectedEstablishment.priceRange}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedEstablishment.city}{selectedEstablishment.country ? `, ${selectedEstablishment.country}` : ""}
                  </p>
                  <p className="text-sm mt-3 text-muted-foreground/80">{selectedEstablishment.description}</p>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <Button className="w-full bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-none text-xs">
                    <ExternalLink className="mr-2 h-3 w-3" /> Réserver en ligne
                  </Button>
                  <Button variant="outline" className="w-full border-white/20 text-white rounded-none text-xs">
                    <Star className="mr-2 h-3 w-3" /> Ajouter aux favoris
                  </Button>
                  <Button variant="outline" className="w-full border-white/20 text-white rounded-none text-xs">
                    <Navigation className="mr-2 h-3 w-3" /> Ajouter au parcours
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        )}

        {/* Partage Tab */}
        <TabsContent value="partage" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground mb-4">
                Partagez cette fiche ou ce parcours avec qui vous souhaitez.
              </p>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-[#c8a94a]/30 hover:bg-white/5 transition-all text-left">
                <span className="text-lg">👤</span>
                <div>
                  <p className="text-sm font-medium">Envoyer à un proche</p>
                  <p className="text-[10px] text-muted-foreground">Par email ou lien direct</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-[#c8a94a]/30 hover:bg-white/5 transition-all text-left">
                <span className="text-lg">🤖</span>
                <div>
                  <p className="text-sm font-medium">Envoyer à mon assistant</p>
                  <p className="text-[10px] text-muted-foreground">Votre assistant personnel prend le relais</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-[#c8a94a]/30 hover:bg-white/5 transition-all text-left">
                <span className="text-lg">🏛️</span>
                <div>
                  <p className="text-sm font-medium">Ma conciergerie préférée</p>
                  <p className="text-[10px] text-muted-foreground">Indiquez le contact, on négocie pour vous</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-[#c8a94a]/30 hover:bg-white/5 transition-all text-left">
                <span className="text-lg">🌍</span>
                <div>
                  <p className="text-sm font-medium">Conciergerie partenaire Baymora</p>
                  <p className="text-[10px] text-muted-foreground">Internationale ou locale selon votre destination</p>
                </div>
              </button>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Main Chat Component ─────────────────────────────────────────
export default function Chat() {
  const { user, isAuthenticated } = useAuth();
  const [, params] = useRoute("/chat/:id");
  const conversationId = params?.id ? parseInt(params.id) : null;

  const [input, setInput] = useState("");
  const [activeConversation, setActiveConversation] = useState<number | null>(conversationId);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Collect all establishments from conversation
  const allEstablishments = useMemo(() => {
    const ests: Establishment[] = [];
    localMessages.forEach(msg => {
      if (msg.parsed?.establishments) {
        msg.parsed.establishments.forEach(e => {
          if (!ests.find(ex => ex.name === e.name)) ests.push(e);
        });
      }
    });
    return ests;
  }, [localMessages]);

  // Latest trip suggestion
  const latestTrip = useMemo(() => {
    for (let i = localMessages.length - 1; i >= 0; i--) {
      if (localMessages[i].parsed?.tripSuggestion) return localMessages[i].parsed!.tripSuggestion;
    }
    return null;
  }, [localMessages]);

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
      const parsed: ConciergeMsg = data as any;
      setLocalMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: parsed.message,
          parsed,
          createdAt: new Date(),
        },
      ]);
      setIsTyping(false);
      // Auto-open right panel if establishments or trip
      if (parsed.establishments?.length > 0 || parsed.tripSuggestion) {
        setShowRightPanel(true);
      }
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
      setLocalMessages(serverMessages.map((m) => {
        const parsed = m.role === "assistant" ? parseAssistantMessage(m.content) : undefined;
        return {
          role: m.role as "user" | "assistant",
          content: parsed ? parsed.message : m.content,
          parsed,
          createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
        };
      }));
    }
  }, [serverMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, isTyping]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isTyping) return;
    setInput("");
    setShowCustomInput(false);

    // Free message limit for non-authenticated
    if (!isAuthenticated) {
      const freeCount = localMessages.filter((m) => m.role === "user").length;
      if (freeCount >= 3) {
        setLocalMessages((prev) => [
          ...prev,
          { role: "user", content: messageText },
          {
            role: "assistant",
            content: "Vous avez utilisé vos **3 messages gratuits**. Pour continuer, [créez votre compte](/pricing).",
            parsed: {
              message: "Vous avez utilisé vos **3 messages gratuits**. Pour continuer, créez votre compte.",
              quickReplies: ["💎 Voir les forfaits", "🔑 Se connecter"],
              establishments: [],
              tripSuggestion: null,
              action: "upgrade",
            },
          },
        ]);
        return;
      }
    }

    // Create conversation if needed
    let convId = activeConversation;
    if (!convId && isAuthenticated) {
      const result = await createConversation.mutateAsync({ title: messageText.substring(0, 50) });
      convId = result.id;
    }

    setLocalMessages((prev) => [...prev, { role: "user", content: messageText, createdAt: new Date() }]);
    setIsTyping(true);

    if (convId && isAuthenticated) {
      sendMessage.mutate({ conversationId: convId, content: messageText });
    } else {
      // Demo mode
      setTimeout(() => {
        const demoResponse: ConciergeMsg = {
          message: "Merci pour votre intérêt ! Pour profiter pleinement de votre concierge IA personnel et recevoir des recommandations sur-mesure, créez votre compte gratuit.",
          quickReplies: ["💎 Créer mon compte", "🔍 Explorer les destinations", "✏️ Autre"],
          establishments: [],
          tripSuggestion: null,
          action: null,
        };
        setLocalMessages((prev) => [
          ...prev,
          { role: "assistant", content: demoResponse.message, parsed: demoResponse, createdAt: new Date() },
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

  const handleQuickReply = (reply: string) => {
    // Handle special actions
    if (reply.includes("Voir les forfaits") || reply.includes("Créer mon compte")) {
      window.location.href = isAuthenticated ? "/pricing" : getLoginUrl();
      return;
    }
    if (reply.includes("Se connecter")) {
      window.location.href = getLoginUrl();
      return;
    }
    if (reply.includes("Explorer les destinations")) {
      window.location.href = "/discover";
      return;
    }
    // Strip emoji prefix for cleaner message
    const cleanReply = reply.replace(/^[^\w\s]+\s*/, "").trim() || reply;
    handleSend(cleanReply);
  };

  // Get last assistant message for quick replies
  const lastAssistantMsg = localMessages.filter(m => m.role === "assistant").pop();
  const showQuickReplies = lastAssistantMsg?.parsed?.quickReplies && !isTyping;

  return (
    <div className="flex h-screen pt-16">
      {/* ─── Left Panel: Conversation ─── */}
      <div className={`flex flex-col ${showRightPanel ? "w-1/2 border-r border-white/10" : "w-full"} transition-all duration-300`}>
        {/* Chat Header */}
        <header className="border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-background/80 backdrop-blur-sm">
          <Link href="/">
            <ArrowLeft size={20} className="text-muted-foreground hover:text-[#c8a94a] transition-colors" />
          </Link>
          <div className="w-8 h-8 rounded-full bg-[#c8a94a]/10 flex items-center justify-center">
            <Sparkles size={16} className="text-[#c8a94a]" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-semibold font-serif">Concierge Baymora</h1>
            <p className="text-[10px] text-muted-foreground">
              {isTyping ? "En train de préparer votre réponse..." : "En ligne — Prêt à vous inspirer"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {allEstablishments.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-[#c8a94a]"
                onClick={() => setShowRightPanel(!showRightPanel)}
              >
                <MapPin size={18} />
              </Button>
            )}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-[#c8a94a]"
                onClick={() => {
                  setActiveConversation(null);
                  setLocalMessages([]);
                  setShowRightPanel(false);
                  setSelectedEstablishment(null);
                }}
              >
                <Plus size={18} />
              </Button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-hide">
          {localMessages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-[#c8a94a]/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles size={28} className="text-[#c8a94a]" />
              </div>
              <h2 className="font-serif text-2xl font-bold mb-3">
                Bienvenue chez <span className="text-[#c8a94a]">Maison Baymora</span>
              </h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-2">
                Votre concierge IA personnel. Avant même que vous ne le demandiez, j'ai déjà quelques idées pour vous.
              </p>
              <p className="text-[#c8a94a]/80 text-sm font-medium mb-8">
                Que souhaitez-vous vivre ?
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                {[
                  "🌍 Planifier un voyage",
                  "🍽️ Restaurant d'exception",
                  "🎭 Organiser un événement",
                  "💼 Voyage d'affaires",
                  "🎁 Offrir une expérience",
                  "✏️ Autre",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      const isOther = suggestion.includes("Autre");
                      if (isOther) {
                        setShowCustomInput(true);
                        inputRef.current?.focus();
                      } else {
                        handleQuickReply(suggestion);
                      }
                    }}
                    className={`text-xs px-4 py-2.5 rounded-full border transition-all font-medium ${
                      suggestion.includes("Autre")
                        ? "border-white/20 text-white/60 hover:bg-white/5"
                        : "border-[#c8a94a]/30 text-[#c8a94a] hover:bg-[#c8a94a]/10 hover:border-[#c8a94a]/50"
                    }`}
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
                <div className={`max-w-[85%] md:max-w-[75%] ${msg.role === "user" ? "" : ""}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-[#c8a94a] text-[#080c14] rounded-br-sm"
                        : "bg-white/5 border border-white/10 rounded-bl-sm"
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

                  {/* Establishments inline */}
                  {msg.parsed?.establishments && msg.parsed.establishments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.parsed.establishments.map((est, ei) => (
                        <EstablishmentCard
                          key={ei}
                          est={est}
                          selected={selectedEstablishment?.name === est.name}
                          onSelect={(e) => {
                            setSelectedEstablishment(e);
                            setShowRightPanel(true);
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Quick replies for last message */}
                  {i === localMessages.length - 1 && msg.role === "assistant" && msg.parsed?.quickReplies && !isTyping && (
                    <QuickReplies
                      replies={msg.parsed.quickReplies}
                      onSelect={handleQuickReply}
                      showInput={showCustomInput}
                      onShowInput={() => {
                        setShowCustomInput(true);
                        inputRef.current?.focus();
                      }}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#c8a94a]/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[#c8a94a]/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[#c8a94a]/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 p-3 pb-[env(safe-area-inset-bottom,12px)] bg-background/80 backdrop-blur-sm">
          {showCustomInput && (
            <p className="text-[10px] text-[#c8a94a] mb-2 px-1">
              ✏️ Écrivez votre réponse ou votre besoin, envie...
            </p>
          )}
          <div className="flex items-end gap-2 max-w-3xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={showCustomInput ? "Décrivez votre envie..." : "Écrivez un message..."}
                rows={1}
                className="w-full resize-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#c8a94a]/50 focus:border-[#c8a94a]/30 placeholder:text-muted-foreground/50"
                style={{ maxHeight: "120px" }}
              />
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] h-11 w-11 rounded-xl shrink-0"
            >
              {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </Button>
          </div>
          {!isAuthenticated && (
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              {Math.max(0, 3 - localMessages.filter((m) => m.role === "user").length)} message(s) gratuit(s) restant(s) —{" "}
              <a href={getLoginUrl()} className="text-[#c8a94a] hover:underline">Connectez-vous</a> pour plus
            </p>
          )}
        </div>
      </div>

      {/* ─── Right Panel: Map + Fiches + Récap ─── */}
      <AnimatePresence>
        {showRightPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "50%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="hidden md:block overflow-hidden"
          >
            <RightPanel
              selectedEstablishment={selectedEstablishment}
              allEstablishments={allEstablishments}
              tripSuggestion={latestTrip}
              onClose={() => setShowRightPanel(false)}
              onEstablishmentClick={(est) => {
                setSelectedEstablishment(est);
                setShowRightPanel(true);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
