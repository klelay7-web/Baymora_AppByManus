import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Sparkles, Send, Mic, MicOff, RotateCcw, MapPin, Plus, Archive, Clock } from "lucide-react";
import MessageRenderer from "@/components/MessageRenderer";
import QuestionBlockGroup from "@/components/QuestionBlock";
import ParcourBar from "@/components/parcour/ParcourBar";
import ParcourSheet from "@/components/parcour/ParcourSheet";
import { useParcourStore } from "@/stores/parcourStore";

const GEOLOC_KEY = "baymora_geoloc_asked";
const GUEST_KEY = "baymora_guest_conversations";
const GUEST_FREE_LIMIT = 3;

function getGuestCount(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(GUEST_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return isNaN(n) ? 0 : n;
}

function incrementGuestCount(): number {
  const next = getGuestCount() + 1;
  localStorage.setItem(GUEST_KEY, String(next));
  return next;
}

function reverseGeocode(lat: number, lng: number): Promise<{ address: string; city: string }> {
  return fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`
  )
    .then((r) => r.json())
    .then((d) => ({
      address: d.display_name?.split(",").slice(0, 3).join(",").trim() || "",
      city: d.address?.city || d.address?.town || d.address?.village || "",
    }))
    .catch(() => ({ address: "", city: "" }));
}

const QUICK_CHOICES = [
  { icon: "🏨", title: "Escapade luxe à proximité", desc: "Hôtel premium avec privilèges, proche de chez vous", prompt: "Je cherche une escapade luxe à proximité avec un hôtel premium" },
  { icon: "✨", title: "Parcours sur-mesure", desc: "Maya crée votre voyage idéal de A à Z", prompt: "Je veux un parcours sur-mesure complet" },
  { icon: "🎯", title: "Découvrir les bons plans", desc: "Restos, bars, activités autour de vous", prompt: "Montre-moi les bons plans et activités" },
  { icon: "👑", title: "Déléguer totalement", desc: "Maison Baymora s'occupe de tout", prompt: "Je veux déléguer totalement mon voyage à votre équipe" },
];

const DESTINATIONS = ["Paris", "Côte d'Azur", "Reims", "Deauville", "New York", "Bali"];

const SESSION_KEY = "baymora_conv_id";

interface QuestionOption {
  label: string;
  type: "button" | "text";
  placeholder?: string;
}
interface QuestionBlockData {
  question: string;
  multi: boolean;
  options: QuestionOption[];
}

interface Message {
  id: string;
  role: "user" | "maya";
  content: string;
  timestamp: Date;
  questionBlocks?: QuestionBlockData[];
}

function timeAgo(date: any): string {
  if (!date) return "";
  const d = new Date(date);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 3600000) return `Il y a ${Math.max(1, Math.floor(diff / 60000))} min`;
  if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
  if (diff < 172800000) return "Hier";
  return `Il y a ${Math.floor(diff / 86400000)} jours`;
}

export default function Maya() {
  const { user } = useAuth();
  const parcourStore = useParcourStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState("Maya réfléchit…");
  const [isRecording, setIsRecording] = useState(false);
  const [showHub, setShowHub] = useState(true);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [showGpsPopup, setShowGpsPopup] = useState(false);
  const [answeredBlocks, setAnsweredBlocks] = useState<Set<string>>(new Set());
  const [guestCount, setGuestCount] = useState<number>(() => getGuestCount());
  const [showGuestUpgradeModal, setShowGuestUpgradeModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; address?: string; city?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateProfileMutation = trpc.profile.updateProfile.useMutation();

  const firstName = user?.name?.split(" ")[0] || "vous";

  // ─── Crédits backend ───────────────────────────────────────────────────────
  const { data: creditsData } = trpc.credits.getBalance.useQuery(undefined, {
    enabled: !!user,
  });

  const OWNER_EMAILS = ["k.lelay7@gmail.com", "klelay7@gmail.com"];
  const isOwner = user?.openId === import.meta.env.VITE_OWNER_OPEN_ID || OWNER_EMAILS.includes(user?.email || "") || user?.role === "admin";
  const isPaid = user?.subscriptionTier !== undefined && user?.subscriptionTier !== "free";
  const isUnlimited = isOwner || isPaid;
  const freeUsed = creditsData?.freeMessagesUsed ?? 0;
  const FREE_LIMIT = 3;
  const creditsLeft = isUnlimited
    ? 999
    : user
      ? Math.max(0, FREE_LIMIT - freeUsed)
      : Math.max(0, GUEST_FREE_LIMIT - guestCount);

  // ─── Recent conversations for hub ──────────────────────────────────────
  const { data: recentConversations, refetch: refetchRecent } = trpc.chat.listRecent.useQuery(undefined, { enabled: !!user });

  const createConvMutation = trpc.chat.createConversation.useMutation({
    onSuccess: (data) => {
      setConversationId(data.id);
      sessionStorage.setItem(SESSION_KEY, String(data.id));
      setShowHub(false);
    },
  });

  const handleNewConversation = () => {
    setMessages([]);
    sessionStorage.removeItem(SESSION_KEY);
    setConversationId(null);
    if (user) {
      createConvMutation.mutate({ title: "Nouvelle conversation" });
    } else {
      setShowHub(false);
    }
  };

  const handleResumeConversation = (convId: number) => {
    setConversationId(convId);
    sessionStorage.setItem(SESSION_KEY, String(convId));
    setMessages([]);
    setShowHub(false);
  };

  const handleBackToHub = () => {
    setShowHub(true);
    refetchRecent();
  };

  // ─── Popup GPS au premier contact ─────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem(GEOLOC_KEY)) {
      setShowGpsPopup(true);
    }
  }, []);

  const handleGpsAllow = () => {
    localStorage.setItem(GEOLOC_KEY, "true");
    setShowGpsPopup(false);
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const geo = await reverseGeocode(lat, lng);
        setUserLocation({ lat, lng, address: geo.address, city: geo.city });
        if (user && (geo.address || geo.city)) {
          updateProfileMutation.mutate({
            homeAddress: geo.address || undefined,
            homeCity: geo.city || undefined,
            homeLat: lat,
            homeLng: lng,
          });
        }
      },
      () => {}
    );
  };

  const handleGpsLater = () => {
    localStorage.setItem(GEOLOC_KEY, "true");
    setShowGpsPopup(false);
  };

  // ─── Envoyer un message ────────────────────────────────────────────────────
  const onMayaResponse = (data: any) => {
    const text = data?.rawContent || data?.cleanMessage;
    if (!text) return;
    const qb: QuestionBlockData[] | undefined = Array.isArray(data?.questionBlocks)
      ? data.questionBlocks
      : undefined;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString() + "_maya",
        role: "maya",
        content: text,
        timestamp: new Date(),
        questionBlocks: qb && qb.length > 0 ? qb : undefined,
      },
    ]);

    // Hydrate the Parcours store from any places Maya proposed
    const places = Array.isArray(data?.places) ? data.places : [];
    if (places.length > 0) {
      let added = 0;
      for (const p of places) {
        const slug: string | undefined = p?.slug || p?.name;
        if (!slug) continue;
        const step = {
          id: `step-${Date.now()}-${added}-${Math.random().toString(36).slice(2, 7)}`,
          establishmentSlug: String(slug),
          name: String(p?.name || slug),
          photo: String(p?.imageUrl || p?.photo || (Array.isArray(p?.photos) ? p.photos[0] : "") || ""),
          category: String(p?.type || p?.category || "lieu"),
          timeSlot: String(p?.timeSlot || ""),
          priceEstimate: Number(p?.priceEstimate ?? p?.price ?? 0) || 0,
          travelFromPrevious: String(p?.travelFromPrevious || ""),
          checked: true,
          lat: typeof p?.coordinates?.lat === "number" ? p.coordinates.lat : (typeof p?.lat === "number" ? p.lat : undefined),
          lng: typeof p?.coordinates?.lng === "number" ? p.coordinates.lng : (typeof p?.lng === "number" ? p.lng : undefined),
        };
        parcourStore.addStep(step);
        added++;
      }
      if (added > 0) parcourStore.setPhase("results");
    }
  };

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onMutate: () => {
      setIsTyping(true);
      parcourStore.setMayaSearching(true);
      if (parcourStore.phase === "idle") parcourStore.setPhase("questions");
    },
    onSettled: () => {
      setIsTyping(false);
      parcourStore.setMayaSearching(false);
    },
    onSuccess: (data) => onMayaResponse(data),
    onError: (err) => {
      const isUpgrade = err.message === "UPGRADE_REQUIRED";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_err",
          role: "maya",
          content: isUpgrade
            ? "Vous avez utilisé vos 3 messages gratuits. Rejoignez la Maison à 9,90€/mois pour continuer avec Maya illimitée.\n\n:::QR:::Voir les forfaits | Continuer gratuitement:::END:::"
            : "Désolée, une erreur est survenue. Réessayez dans un instant.",
          timestamp: new Date(),
        },
      ]);
    },
  });

  const sendMessageGuestMutation = trpc.chat.sendMessageGuest.useMutation({
    onMutate: () => {
      setIsTyping(true);
      parcourStore.setMayaSearching(true);
      if (parcourStore.phase === "idle") parcourStore.setPhase("questions");
    },
    onSettled: () => {
      setIsTyping(false);
      parcourStore.setMayaSearching(false);
    },
    onSuccess: (data) => {
      onMayaResponse(data);
      const next = incrementGuestCount();
      setGuestCount(next);
      if (next >= GUEST_FREE_LIMIT) {
        setTimeout(() => setShowGuestUpgradeModal(true), 800);
      }
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_err",
          role: "maya",
          content: "Désolée, une erreur est survenue. Réessayez dans un instant.",
          timestamp: new Date(),
        },
      ]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Dynamic typing message — rotates while Maya is thinking
  useEffect(() => {
    if (!isTyping) {
      setTypingMessage("Maya réfléchit…");
      return;
    }
    const startedAt = Date.now();
    setTypingMessage("Maya réfléchit…");
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      if (elapsed < 3000) {
        setTypingMessage("Maya réfléchit…");
      } else if (elapsed < 6000) {
        setTypingMessage("Maya explore les meilleures adresses…");
      } else if (elapsed < 10000) {
        setTypingMessage("Recherche approfondie en cours…");
      } else {
        setTypingMessage("Maya prépare quelque chose de spécial…");
      }
    }, 500);
    return () => window.clearInterval(interval);
  }, [isTyping]);

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    if (!user && guestCount >= GUEST_FREE_LIMIT) {
      setShowGuestUpgradeModal(true);
      return;
    }

    // BUG FIX 2 : toujours afficher le message du Membre immédiatement,
    // AVANT tout check ou mutation. Le Membre doit voir sa propre
    // saisie dès le clic, même si la conversation n'est pas encore prête.
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: msg,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // If no conversation exists yet, create one and send the message after
    if (!conversationId && user) {
      setShowHub(false);
      createConvMutation.mutate({ title: msg.slice(0, 60) }, {
        onSuccess: (data) => {
          const newId = data.id;
          sendMessageMutation.mutate({
            content: msg,
            conversationId: newId,
            userLocation: userLocation ? { lat: userLocation.lat, lng: userLocation.lng, city: userLocation.city || "", country: "France" } : undefined,
          });
        },
      });
      return;
    }

    if (user) {
      sendMessageMutation.mutate({
        content: msg,
        conversationId: conversationId ?? 0,
        userLocation: userLocation
          ? { lat: userLocation.lat, lng: userLocation.lng, city: userLocation.city || "", country: "France" }
          : undefined,
      });
    } else {
      const history = messages.map(m => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      }));
      sendMessageGuestMutation.mutate({
        content: msg,
        history,
        userLocation: userLocation
          ? { lat: userLocation.lat, lng: userLocation.lng, city: userLocation.city || "", country: "France" }
          : undefined,
      });
    }
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

  const isOnboarding = messages.length === 0 && !user;

  return (
    <div
      className="flex flex-col"
      style={{ background: "#070B14", color: "#F0EDE6", height: "100dvh", maxHeight: "100dvh", overflow: "hidden" }}
    >
      {/* Popup GPS élégante */}
      {showGpsPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(7, 11, 20, 0.85)", backdropFilter: "blur(12px)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col items-center text-center"
            style={{
              background: "rgba(13, 17, 23, 0.95)",
              border: "1px solid rgba(200, 169, 110, 0.35)",
              boxShadow: "0 0 40px rgba(200, 169, 110, 0.12)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}
            >
              <MapPin size={24} color="#070B14" />
            </div>
            <h3
              className="text-lg font-bold mb-2"
              style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
            >
              Maya peut vous recommander des adresses proches
            </h3>
            <p className="text-sm mb-6" style={{ color: "#8B8D94", lineHeight: 1.6 }}>
              Autorisez la localisation pour des suggestions personnalisées et un transport précis depuis chez vous.
            </p>
            <button
              className="w-full py-3 rounded-xl font-semibold text-sm mb-3"
              style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
              onClick={handleGpsAllow}
            >
              Autoriser
            </button>
            <button
              className="w-full py-3 rounded-xl text-sm"
              style={{ border: "1px solid rgba(139, 141, 148, 0.3)", color: "#8B8D94", background: "transparent" }}
              onClick={handleGpsLater}
            >
              Plus tard
            </button>
          </div>
        </div>
      )}
      {/* Modal upgrade pour invité après 3 conversations */}
      {showGuestUpgradeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(7, 11, 20, 0.9)", backdropFilter: "blur(12px)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 flex flex-col items-center text-center"
            style={{
              background: "rgba(13, 17, 23, 0.98)",
              border: "1px solid rgba(200, 169, 110, 0.4)",
              boxShadow: "0 0 50px rgba(200, 169, 110, 0.18)",
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}
            >
              <Sparkles size={28} color="#070B14" />
            </div>
            <h3
              className="text-xl font-bold mb-3"
              style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
            >
              Vous avez utilisé vos 3 conversations offertes
            </h3>
            <p className="text-sm mb-6" style={{ color: "#8B8D94", lineHeight: 1.6 }}>
              Rejoignez La Maison pour continuer avec Maya, accéder aux parcours sur-mesure et débloquer les privilèges partenaires.
            </p>
            <Link href="/auth">
              <button
                className="w-full py-3 rounded-xl font-semibold text-sm mb-3"
                style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
              >
                Créer un compte
              </button>
            </Link>
            <button
              className="w-full py-3 rounded-xl text-sm"
              style={{ border: "1px solid rgba(139, 141, 148, 0.3)", color: "#8B8D94", background: "transparent" }}
              onClick={() => setShowGuestUpgradeModal(false)}
            >
              Plus tard
            </button>
          </div>
        </div>
      )}

      {/* HUB — shown when no active conversation (logged in users) */}
      {showHub && user && (
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}>
                <Sparkles size={20} color="#070B14" />
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>Maya</h1>
                <p className="text-xs" style={{ color: "#8B8D94" }}>Ton concierge Maison Baymora</p>
              </div>
            </div>

            <button
              onClick={handleNewConversation}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold mb-6"
              style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14", minHeight: 48 }}
            >
              <Plus size={18} /> Nouvelle recherche
            </button>

            {(recentConversations as any[] || []).filter((c: any) => !c.isValidated && c.status !== "archived").length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8B8D94" }}>En cours</h2>
                <div className="space-y-2">
                  {(recentConversations as any[]).filter((c: any) => !c.isValidated && c.status !== "archived").map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => { setConversationId(c.id); sessionStorage.setItem(SESSION_KEY, String(c.id)); setMessages([]); setShowHub(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left"
                      style={{ background: "#1a1a1a", border: "1px solid #333", minHeight: 48 }}
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.status === "active" ? "#4ade80" : "#eab308" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{c.title || "Conversation"}</p>
                        <p className="text-[10px]" style={{ color: "#8B8D94" }}>{timeAgo(c.lastActivityAt || c.createdAt)} · {c.msgCount || 0} messages</p>
                      </div>
                      <Clock size={14} color="#8B8D94" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(recentConversations as any[] || []).filter((c: any) => c.isValidated).length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8B8D94" }}>Parcours validés</h2>
                <div className="space-y-2">
                  {(recentConversations as any[]).filter((c: any) => c.isValidated).map((c: any) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #333" }}>
                      <span className="text-sm">✅</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{c.title || "Parcours"}</p>
                        <p className="text-[10px]" style={{ color: "#8B8D94" }}>{timeAgo(c.lastActivityAt || c.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat view — shown when conversation is active or guest */}
      {(!showHub || !user) && <>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{
          background: "rgba(7, 11, 20, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(200, 169, 110, 0.1)",
        }}
      >
        <button className="p-2 -ml-2" onClick={user ? handleBackToHub : undefined}>
          {user ? <ArrowLeft size={20} color="#8B8D94" /> : <Link href="/maison"><ArrowLeft size={20} color="#8B8D94" /></Link>}
        </button>
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
                      <>
                        <MessageRenderer content={msg.content} onSend={handleSend} />
                        {msg.questionBlocks && msg.questionBlocks.length > 0 && (
                          <QuestionBlockGroup
                            blocks={msg.questionBlocks}
                            disabled={answeredBlocks.has(msg.id)}
                            onSubmitAll={(combined) => {
                              setAnsweredBlocks((prev) => {
                                const next = new Set(prev);
                                next.add(msg.id);
                                return next;
                              });
                              handleSend(combined);
                            }}
                          />
                        )}
                      </>
                    ) : (
                      <span className="text-sm" style={{ color: "#F0EDE6" }}>{msg.content}</span>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start animate-slide-up">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0 animate-pulse"
                    style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}
                  >
                    <Sparkles size={14} color="#070B14" />
                  </div>
                  <div
                    className="px-4 py-3 flex flex-col gap-1.5"
                    style={{
                      background: "rgba(200, 169, 110, 0.08)",
                      border: "1px solid rgba(200, 169, 110, 0.2)",
                      borderRadius: "1rem 1rem 1rem 0.25rem",
                    }}
                  >
                    <div className="flex gap-1 items-center">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full animate-typing-dot"
                          style={{ background: "#C8A96E", animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                    <p
                      className="text-[11px] transition-opacity duration-300"
                      style={{ color: "#C8A96E", opacity: 0.75 }}
                    >
                      {typingMessage}
                    </p>
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
            placeholder="Écrivez à Maya..."
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

      {/* Parcours Vivant : barre flottante + bottom sheet */}
      <ParcourBar />
      <ParcourSheet />
      </>}

      {/* Input bar — always visible (hub + chat) */}
      {showHub && user && (
        <div
          className="flex-shrink-0 px-4 py-3"
          style={{ background: "rgba(7, 11, 20, 0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(200, 169, 110, 0.1)", paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="flex items-end gap-2 rounded-2xl px-3 py-2" style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.2)" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez à Maya..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm py-2"
              style={{ color: "#F0EDE6", minHeight: "40px", maxHeight: "120px" }}
            />
            <button
              className="p-2 flex-shrink-0 self-end mb-0.5 rounded-xl transition-all"
              style={{ background: input.trim() ? "linear-gradient(135deg, #C8A96E, #E8D5A8)" : "rgba(200, 169, 110, 0.1)", opacity: input.trim() ? 1 : 0.5 }}
              onClick={() => handleSend()}
              disabled={!input.trim()}
            >
              <Send size={18} color={input.trim() ? "#070B14" : "#C8A96E"} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
