/**
 * ─── Maison Baymora — PILOTAGE ──────────────────────────────────────────────
 * Centre de contrôle exclusif du fondateur.
 * ARIA (DG IA Claude Opus) à gauche + 5 onglets à droite :
 *   Dashboard | Salle de Réunion | Terrain | Carnet de Bord | Accès
 */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Shield, ExternalLink, Users, ChevronRight, Zap, Megaphone, Mail, Globe, UserPlus, Copy, Check, X, Phone, AtSign, Clock, CheckCircle2, XCircle, Crown, Package, User, MessageSquare, Send, BadgeCheck, Loader2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

interface Message {
  role: "user" | "assistant";
  content: string;
  actionType?: string;
  panelType?: string | null;
  panelData?: unknown;
  timestamp?: Date;
}

// ─── Les 7 vrais agents IA de Maison Baymora ─────────────────────────────────
const AGENTS_IA = [
  {
    id: "aria",
    nom: "ARIA",
    emoji: "🧠",
    couleur: "amber",
    modele: "Claude Opus",
    role: "Directrice Générale IA",
    description: "Supervise toutes les équipes, carnet de bord, rapports, budget, stratégie. Seule IA à qui vous parlez directement.",
    fonctions: [
      "Rapports journaliers datés",
      "Carnet de bord archivé",
      "Ordres aux 6 autres agents",
      "Alertes et surveillance",
      "Budget et objectifs",
    ],
    statut: "active",
    acces: "Pilotage uniquement (vous seul)",
  },
  {
    id: "lena",
    nom: "LÉNA",
    emoji: "📍",
    couleur: "blue",
    modele: "Claude Sonnet",
    role: "Agente Terrain & SEO",
    description: "Assistante vocale pour les membres terrain. Pose des questions guidées, mémorise les sessions, construit les fiches SEO automatiquement.",
    fonctions: [
      "Questions guidées pour fiches établissements",
      "Mémoire de session (reprend où on s'est arrêté)",
      "Recherche web Perplexity pour compléter",
      "Construction fiche SEO finale (photos, textes, mots-clés)",
      "Accessible aux membres rôle 'terrain'",
    ],
    statut: "active",
    acces: "Page Terrain (membres terrain + vous)",
  },
  {
    id: "maya",
    nom: "MAYA",
    emoji: "💬",
    couleur: "purple",
    modele: "Claude Opus / Sonnet",
    role: "Concierge IA Client",
    description: "L'IA conversationnelle que les clients utilisent. Connaît le profil de chaque client, ses préférences, son cercle familial. Propose des expériences sur mesure.",
    fonctions: [
      "Conversations clients 24h/24",
      "Recommandations personnalisées",
      "Extraction silencieuse du profil client",
      "Réservations et parcours",
      "Mémoire long-terme par client",
    ],
    statut: "active",
    acces: "Page Chat (tous les membres connectés)",
  },
  {
    id: "nova",
    nom: "NOVA",
    emoji: "📧",
    couleur: "green",
    modele: "Claude Sonnet",
    role: "Agente Email & CRM",
    description: "Rédige et envoie tous les emails automatiques via Resend. Séquences de bienvenue, relances abonnement, newsletters, prospection partenaires.",
    fonctions: [
      "Email bienvenue à l'inscription",
      "Relance abonnement J+3, J+7",
      "Newsletter hebdomadaire bons plans",
      "Prospection partenaires et affiliés",
      "Rapports hebdomadaires équipe",
    ],
    statut: "active",
    acces: "Automatique (triggers) + Pilotage Email Center",
  },
  {
    id: "atlas",
    nom: "ATLAS",
    emoji: "🗺️",
    couleur: "cyan",
    modele: "Claude Sonnet",
    role: "Agent Parcours & Bundles",
    description: "Construit les itinéraires et bundles de voyage. Calcule les trajets depuis le domicile du client, propose des options selon le budget et les préférences.",
    fonctions: [
      "Itinéraires sur mesure",
      "Bundles hébergement + activités",
      "Calcul trajet depuis domicile client",
      "Intégration Google Maps",
      "Partenariats Staycation / affiliés",
    ],
    statut: "en développement",
    acces: "Page Chat (via MAYA) + Destinations",
  },
  {
    id: "jade",
    nom: "JADE",
    emoji: "🤝",
    couleur: "emerald",
    modele: "Claude Sonnet",
    role: "Agente Partenaires & Affiliations",
    description: "Gère la prospection des partenaires et affiliés premium. Rédige les emails de contact, suit les négociations, intègre les offres dans l'application.",
    fonctions: [
      "Prospection Staycation, Tablet Hotels, Mr & Mrs Smith",
      "Emails de contact personnalisés",
      "Suivi des négociations",
      "Intégration des offres affiliées",
      "Commissions et reporting",
    ],
    statut: "en développement",
    acces: "Pilotage Email Center + automatique",
  },
  {
    id: "pixel",
    nom: "PIXEL",
    emoji: "📱",
    couleur: "pink",
    modele: "Claude Haiku",
    role: "Agent Social & Contenu",
    description: "Crée le contenu pour les réseaux sociaux et les publications marketing. Adapte le ton Baymora (luxe accessible, chaleureux, premium).",
    fonctions: [
      "Posts Instagram / LinkedIn",
      "Descriptions établissements",
      "Campagnes marketing",
      "Contenu newsletter",
      "Tone of voice Baymora",
    ],
    statut: "en développement",
    acces: "Pilotage Campagnes (à venir)",
  },
];

const COULEUR_MAP: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/30",   badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  blue:    { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/30",    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  purple:  { bg: "bg-purple-500/10",  text: "text-purple-400",  border: "border-purple-500/30",  badge: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  green:   { bg: "bg-green-500/10",   text: "text-green-400",   border: "border-green-500/30",   badge: "bg-green-500/20 text-green-300 border-green-500/30" },
  cyan:    { bg: "bg-cyan-500/10",    text: "text-cyan-400",    border: "border-cyan-500/30",    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  pink:    { bg: "bg-pink-500/10",    text: "text-pink-400",    border: "border-pink-500/30",    badge: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
};

export default function Pilotage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [ariaPanelOverride, setAriaPanelOverride] = useState<{ type: string; data: unknown } | null>(null);
  const [mobileView, setMobileView] = useState<"chat" | "panel">("panel");
  const [selectedAgent, setSelectedAgent] = useState<typeof AGENTS_IA[0] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: stats } = trpc.pilotage.stats.useQuery(undefined, { refetchInterval: 30000 });
  const { data: organigramme } = trpc.pilotage.organigramme.useQuery();
  const { data: budget } = trpc.pilotage.budget.useQuery();
  const { data: carnets } = trpc.pilotage.carnetsDebord.useQuery();
  const { data: history } = trpc.pilotage.history.useQuery();
  const { data: allUsers } = trpc.pilotage.listUsers.useQuery();
  const chatMutation = trpc.pilotage.chat.useMutation();
  const reportMutation = trpc.pilotage.dailyReport.useMutation();
  const updateRoleMutation = trpc.pilotage.updateUserRole.useMutation();

  // ─── Missions 24h ─────────────────────────────────────────────────────
  const [missionTitle, setMissionTitle] = useState("");
  const [missionContent, setMissionContent] = useState("");
  const [missionPriority, setMissionPriority] = useState<"normal"|"high"|"urgent">("normal");
  const [missionDuration, setMissionDuration] = useState(24);
  const [missionView, setMissionView] = useState<"create"|"active"|"history">("active");
  const [selectedHistoryMission, setSelectedHistoryMission] = useState<number|null>(null);
  const { data: activeMission, refetch: refetchActiveMission } = trpc.pilotage.activeMission.useQuery(undefined, { refetchInterval: 60000 });
  const { data: missionHistory, refetch: refetchMissionHistory } = trpc.pilotage.missionHistory.useQuery({ limit: 20 });
  const createMissionMutation = trpc.pilotage.createMission.useMutation();
  const closeMissionMutation = trpc.pilotage.closeMission.useMutation();

  // ─── Invitations Terrain ─────────────────────────────────────────────
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ recipientName: "", recipientEmail: "", recipientPhone: "", message: "", role: "team" as "team" | "admin" });
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const { data: invitations, refetch: refetchInvitations } = trpc.team.listInvitations.useQuery();
  const { data: teamMembers, refetch: refetchTeamMembers } = trpc.team.listMembers.useQuery();
  const inviteMutation = trpc.team.invite.useMutation({
    onSuccess: (data) => {
      const link = `${window.location.origin}/invite/${data.token}`;
      setInviteLink(link);
      refetchInvitations();
      toast.success("Invitation créée avec succès !");
    },
    onError: (err) => toast.error(err.message),
  });
  const cancelInviteMutation = trpc.team.cancelInvite.useMutation({
    onSuccess: () => { refetchInvitations(); toast.success("Invitation annulée"); },
  });
  const sendInviteEmailMutation = trpc.team.sendInviteEmail.useMutation({
    onSuccess: () => toast.success("Email d'invitation envoyé !"),
    onError: (err) => toast.error(err.message),
  });
  const grantTierMutation = trpc.team.grantTier.useMutation({
    onSuccess: () => { toast.success("Forfait attribué !"); refetchTeamMembers(); },
    onError: (err) => toast.error(err.message),
  });
  const sendOperatorMessageMutation = trpc.team.sendMessage.useMutation({
    onSuccess: () => { toast.success("Message envoyé !"); setOperatorMsgContent(""); setSelectedOperatorId(null); },
    onError: (err) => toast.error(err.message),
  });
  const [selectedOperatorId, setSelectedOperatorId] = useState<number | null>(null);
  const [operatorMsgContent, setOperatorMsgContent] = useState("");
  const [grantTierUserId, setGrantTierUserId] = useState<number | null>(null);
  // ─── Validation fiches terrain ────────────────────────────────────────
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const { data: pendingReports, refetch: refetchPendingReports } = trpc.fieldReports.getPendingReviews.useQuery();
  const reviewMutation = trpc.fieldReports.review.useMutation({
    onSuccess: (_data, vars) => {
      toast.success(vars.action === "approve" ? "✅ Fiche approuvée — opérateur notifié" : "❌ Fiche rejetée — opérateur notifié");
      refetchPendingReports();
      setReviewingId(null);
      setReviewNotes(n => { const c = { ...n }; delete c[vars.id]; return c; });
    },
    onError: (err) => toast.error(err.message),
  });
  const copyInviteLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success("Lien copié !");
  };

  // ─── Mutations accès total ARIA en écriture ───────────────────────────────────────────────────────────────────────
  const createSeoCardMutation = trpc.aria.createSeoCardAria.useMutation({
    onSuccess: (d) => toast.success(`✅ Fiche SEO créée en base (ID: ${d.id})`),
    onError: (e) => toast.error(e.message),
  });
  const saveSocialPostMutation = trpc.aria.saveSocialPostAria.useMutation({
    onSuccess: (d) => toast.success(`✅ Post social enregistré (ID: ${d.id})`),
    onError: (e) => toast.error(e.message),
  });
  const createContentItemMutation = trpc.aria.createContentItemAria.useMutation({
    onSuccess: (d) => toast.success(`✅ Contenu calendrier enregistré (ID: ${d.id})`),
    onError: (e) => toast.error(e.message),
  });
  const [savingMsgIdx, setSavingMsgIdx] = useState<number | null>(null);

  // Sauvegarde intelligente : détecte le type de contenu ARIA et enregistre en base
  const saveAriaOutput = async (msgContent: string, msgIdx: number) => {
    setSavingMsgIdx(msgIdx);
    try {
      const lower = msgContent.toLowerCase();
      const today = new Date().toISOString().split("T")[0];
      const titleLine = msgContent.split("\n")[0].replace(/[#*]/g, "").replace(/[\uD800-\uDFFF]/g, "").trim().slice(0, 80) || "Contenu ARIA";
      if (lower.includes("reel") || lower.includes("tiktok") || lower.includes("script") || lower.includes("vidéo")) {
        const platform = lower.includes("tiktok") ? "tiktok" : "instagram";
        const contentType = lower.includes("reel") ? "reel" : "script";
        await saveSocialPostMutation.mutateAsync({ platform, contentType, title: titleLine, content: msgContent, status: "draft" });
      } else if (lower.includes("fiche seo") || lower.includes("meta title") || lower.includes("meta description") || lower.includes("slug")) {
        const slugBase = titleLine.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        await createSeoCardMutation.mutateAsync({
          title: titleLine, slug: slugBase + "-" + Date.now(),
          city: "Paris", country: "France", category: "hotel",
          content: msgContent, status: "draft",
        });
      } else {
        // Par défaut : calendrier éditorial
        await createContentItemMutation.mutateAsync({
          title: titleLine, contentType: "instagram_post", platform: "instagram",
          generatedContent: msgContent, scheduledDate: today, status: "review",
        });
      }
    } finally {
      setSavingMsgIdx(null);
    }
  };

  useEffect(() => {
    if (history && history.length > 0 && messages.length === 0) {
      setMessages(history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content, timestamp: new Date() })));
    } else if (!history && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `👋 Bonjour, je suis **ARIA**\nDirectrice Générale IA de Maison Baymora. Je supervise vos **7 agents IA** et l'ensemble des opérations.\n\nJe suis ici pour :\n📊 Vous présenter les rapports et métriques\n📋 Donner des ordres aux agents\n💡 Proposer des stratégies et améliorations\n🔴 Vous alerter en cas de problème\n💰 Gérer les budgets et les objectifs\n\nQue souhaitez-vous faire aujourd'hui ?\n— **ARIA, DG Maison Baymora**`,
        actionType: undefined,
        timestamp: new Date(),
      }]);
    }
  }, [history]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg, timestamp: new Date() }]);
    setIsLoading(true);
    try {
      const res = await chatMutation.mutateAsync({ message: userMsg });
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: res.content,
        actionType: res.actionType ?? undefined,
        panelType: res.panelType,
        panelData: res.panelData,
        timestamp: new Date(),
      }]);
      if (res.panelType) {
        setAriaPanelOverride({ type: res.panelType, data: res.panelData });
        const tabMap: Record<string, string> = {
          teams: "salle",
          budget: "dashboard",
          strategy: "dashboard",
          alerts: "dashboard",
          tasks: "salle",
          report: "carnet",
        };
        if (tabMap[res.panelType]) setActiveTab(tabMap[res.panelType]);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(`ARIA : ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const report = await reportMutation.mutateAsync();
      setMessages((prev) => [...prev, { role: "assistant", content: report, actionType: "report", timestamp: new Date() }]);
      setActiveTab("carnet");
      toast.success("Rapport généré par ARIA");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(`Erreur : ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRole = async (userId: number, newRole: string) => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role: newRole as "user" | "team" | "admin" });
      toast.success(`Rôle mis à jour : ${newRole}`);
    } catch {
      toast.error("Erreur lors de la mise à jour du rôle");
    }
  };

  const actionBadge = (type?: string) => {
    const map: Record<string, { label: string; color: string }> = {
      report:     { label: "Rapport",     color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
      alert:      { label: "Alerte",      color: "bg-red-500/20 text-red-300 border-red-500/30" },
      order_team: { label: "Ordre agent", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
      modify_app: { label: "Ordre Dev",   color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
      analyze:    { label: "Analyse",     color: "bg-green-500/20 text-green-300 border-green-500/30" },
    };
    if (!type || !map[type]) return null;
    const { label, color } = map[type];
    return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${color}`}>{label}</span>;
  };

  const statsCards = [
    { label: "Membres total",    value: stats?.totalUsers ?? "—",       icon: "👥", color: "text-blue-400" },
    { label: "Abonnés Premium",  value: stats?.premiumUsers ?? "—",     icon: "⭐", color: "text-amber-400" },
    { label: "Fiches publiées",  value: stats?.publishedCards ?? "—",   icon: "📄", color: "text-green-400" },
    { label: "Établissements",   value: stats?.totalEstablishments ?? "—", icon: "🏨", color: "text-purple-400" },
    { label: "Plans de voyage",  value: stats?.totalTripPlans ?? "—",   icon: "🗺️", color: "text-cyan-400" },
    { label: "CA estimé/mois",   value: stats ? `${((stats.premiumUsers ?? 0) * 14.9).toFixed(0)}€` : "—", icon: "💰", color: "text-emerald-400" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="border-b border-white/10 bg-[#0d0d14] px-3 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/">
            <button className="text-white/40 hover:text-white/70 transition-colors flex items-center gap-1 text-xs md:text-sm">
              ←
            </button>
          </Link>
          <div className="flex items-center gap-1.5 md:gap-2">
            <Shield size={14} className="text-amber-400" />
            <span className="text-amber-400 font-semibold text-xs md:text-sm uppercase tracking-wider">Pilotage</span>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs hidden md:inline-flex">Accès exclusif</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle mobile chat/panel */}
          <div className="flex md:hidden gap-1">
            <button onClick={() => setMobileView("chat")} className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${mobileView === "chat" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-white/5 text-white/50 border-white/10"}`}>💬 ARIA</button>
            <button onClick={() => setMobileView("panel")} className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${mobileView === "panel" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-white/5 text-white/50 border-white/10"}`}>📊 Panneaux</button>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-white/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            ARIA active · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
      </div>

      {/* ─── Corps principal ───────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col md:flex-row" style={{ height: "calc(100vh - 57px)", overflow: "hidden" }}>

        {/* ─── Chat ARIA (gauche) ─────────────────────────────────────── */}
        <div className={`${mobileView === "chat" ? "flex" : "hidden"} md:flex w-full md:w-[400px] md:min-w-[360px] md:max-w-[400px] border-r border-white/10 flex-col bg-[#0d0d14] h-full overflow-hidden`}>
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-xs font-bold text-black">A</div>
              <div>
                <span className="text-sm font-semibold text-amber-400">ARIA</span>
                <span className="text-xs text-white/30 ml-2">Claude Opus · DG IA</span>
              </div>
            </div>
            <Button size="sm" variant="outline"
              className="text-xs h-7 border-white/20 text-white/70 hover:text-white hover:border-amber-400/50 bg-transparent"
              onClick={generateReport} disabled={isLoading}
            >
              📊 Rapport
            </Button>
          </div>

          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[92%] min-w-0 overflow-hidden">
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-xs font-bold text-black">A</div>
                        <span className="text-xs text-amber-400 font-medium">ARIA</span>
                        {actionBadge(msg.actionType)}
                        {msg.timestamp && <span className="text-xs text-white/30">{msg.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>}
                      </div>
                    )}
                    <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-amber-500/20 text-white border border-amber-500/30"
                        : "bg-white/5 text-white/90 border border-white/10"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 break-words overflow-wrap-anywhere">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                    {/* Bouton Enregistrer en base — uniquement sur les messages ARIA longs */}
                    {msg.role === "assistant" && msg.content.length > 200 && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <button
                          onClick={() => saveAriaOutput(msg.content, i)}
                          disabled={savingMsgIdx === i}
                          className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 transition-all disabled:opacity-50"
                        >
                          {savingMsgIdx === i ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Enregistrement...</>
                          ) : (
                            <><BadgeCheck className="w-3 h-3" /> Enregistrer en base</>
                          )}
                        </button>
                        <button
                          onClick={() => { navigator.clipboard.writeText(msg.content); toast.success("Copié !"); }}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 border border-white/10 transition-all"
                        >
                          <Copy className="w-3 h-3" /> Copier
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <div className="flex gap-1 items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      <span className="text-xs text-white/40 ml-2">ARIA réfléchit...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Suggestions rapides */}
          <div className="px-4 py-2 border-t border-white/10 flex flex-wrap gap-1.5">
            {["📊 Rapport du jour", "👥 Mes 7 agents", "🔴 Alertes", "💰 Budget", "🎯 Priorités", "📋 Ordres"].map((s) => (
              <button key={s} onClick={() => setInput(s)}
                className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 hover:border-amber-400/30 transition-all"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/10">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Parlez à ARIA... (Entrée pour envoyer)"
                className="min-h-[60px] max-h-[120px] bg-white/5 border-white/20 text-white placeholder:text-white/30 resize-none text-sm focus:border-amber-400/50"
                disabled={isLoading}
              />
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-3 self-end"
              >
                ↑
              </Button>
            </div>
          </div>
        </div>

              {/* ─── Panneau droit (5 onglets) ──────────────────────────── */}
        <div className={`${mobileView === "panel" ? "flex" : "hidden"} md:flex flex-1 flex-col overflow-hidden h-full`}>
          {ariaPanelOverride && (
            <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs flex-shrink-0">
              <span className="text-amber-400">📌 ARIA a mis à jour ce panneau</span>
              <button onClick={() => setAriaPanelOverride(null)} className="text-white/40 hover:text-white/70 ml-4">✕</button>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setAriaPanelOverride(null); }} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-white/10 bg-[#0d0d14] px-2 md:px-4 flex-shrink-0 overflow-x-auto scrollbar-hide">
              <TabsList className="bg-transparent border-0 h-10 md:h-12 gap-1 flex-nowrap min-w-max">
                {[
                  { value: "dashboard",   label: "📊 Dashboard" },
                  { value: "salle",       label: "🧠 Salle de Réunion" },
                  { value: "manus",       label: "⚡ MANUS DG" },
                  { value: "terrain",     label: "📍 Terrain" },
                  { value: "creative",    label: "🎨 Creative" },
                  { value: "comms",       label: "📣 Comms" },
                  { value: "affiliation", label: "🤝 Affiliation" },
                  { value: "carnet",      label: "📔 Carnet de Bord" },
                  { value: "missions",    label: "🎯 Missions" },
                  { value: "acces",       label: "🔑 Accès" },
                ].map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}
                    className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 data-[state=active]:border-amber-500/30 text-white/50 hover:text-white/80 border border-transparent rounded-lg px-3 h-8"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto p-3 md:p-6">

              {/* ── DASHBOARD ─────────────────────────────────────────── */}
              <TabsContent value="dashboard" className="mt-0 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">Tableau de bord</h2>
                    <p className="text-sm text-white/50">{new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/admin">
                      <Button variant="outline" size="sm" className="text-xs border-white/20 text-white/60 hover:text-white bg-transparent gap-1">
                        <ExternalLink size={12} /> Dashboard complet
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {statsCards.map((card) => (
                    <div key={card.label} className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{card.icon}</span>
                        <span className={`text-2xl font-bold ${card.color}`}>{card.value}</span>
                      </div>
                      <p className="text-xs text-white/50">{card.label}</p>
                    </div>
                  ))}
                </div>

                {/* Seuil de rentabilité */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-emerald-400">💡 Seuil de rentabilité</h3>
                    <span className={`text-sm font-bold ${(stats?.premiumUsers ?? 0) >= 15 ? "text-emerald-400" : "text-red-400"}`}>
                      {(stats?.premiumUsers ?? 0) >= 15 ? "✅ Rentable" : `🔴 ${15 - (stats?.premiumUsers ?? 0)} abonnés manquants`}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-white/60 mb-1">
                    <span>{stats?.premiumUsers ?? 0} / 15 abonnés Premium</span>
                    <span>Objectif : 223.50€/mois</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(((stats?.premiumUsers ?? 0) / 15) * 100, 100)}%` }} />
                  </div>
                  <p className="text-xs text-white/40 mt-2">Marge estimée : {stats ? `${(((stats.premiumUsers ?? 0) * 14.9) - 222).toFixed(2)}€` : "-222€"}/mois</p>
                </div>

                {/* Alertes */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-red-400 mb-3">🔴 Actions urgentes</h3>
                  <div className="space-y-2">
                    {[
                      { label: "Stripe Checkout non configuré", priority: "critique", action: "Configurer Stripe" },
                      { label: "0 fiche établissement publiée", priority: "haute", action: "Lancer LÉNA" },
                      { label: "Séquences email non activées", priority: "haute", action: "Activer NOVA" },
                      { label: "Aucun partenaire affilié", priority: "moyenne", action: "Contacter Staycation" },
                    ].map((alert) => (
                      <div key={alert.label} className="flex items-center justify-between bg-red-500/5 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${alert.priority === "critique" ? "bg-red-500" : alert.priority === "haute" ? "bg-orange-500" : "bg-yellow-500"}`} />
                          <span className="text-xs md:text-sm text-white/80 truncate">{alert.label}</span>
                        </div>
                        <button onClick={() => { setInput(`ARIA, ${alert.action}`); }} className="text-xs text-amber-400 hover:text-amber-300 underline flex-shrink-0 ml-2">{alert.action} →</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Budget résumé */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-green-400 mb-3">📈 Revenus</h3>
                    {budget && Object.entries(budget.revenus).map(([key, rev]) => (
                      <div key={key} className="flex justify-between text-xs py-1 border-b border-white/5">
                        <span className="text-white/60">{(rev as { label: string }).label}</span>
                        <span className="text-white/40">{(rev as { unite: string }).unite}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-semibold mt-3 pt-2 border-t border-white/10">
                      <span className="text-white/70">CA estimé</span>
                      <span className="text-green-400">{stats ? `${((stats.premiumUsers ?? 0) * 14.9).toFixed(2)}€` : "0€"}</span>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-red-400 mb-3">📉 Dépenses fixes</h3>
                    {budget && Object.entries(budget.depenses).map(([key, dep]) => (
                      <div key={key} className="flex justify-between text-xs py-1 border-b border-white/5">
                        <span className="text-white/60">{(dep as { label: string }).label}</span>
                        <span className="text-white/80">{(dep as { estimeMensuel: number }).estimeMensuel > 0 ? `${(dep as { estimeMensuel: number }).estimeMensuel}€` : "Var."}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-semibold mt-3 pt-2 border-t border-white/10">
                      <span className="text-white/70">Total</span>
                      <span className="text-red-400">{budget?.totalDepensesFixesMensuel ?? 222}€/mois</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── SALLE DE RÉUNION ──────────────────────────────────── */}
              <TabsContent value="salle" className="mt-0 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Salle de Réunion — Agents IA</h2>
                  <p className="text-sm text-white/50">7 agents IA spécialisés · Tous sous la direction d'ARIA · Aucun humain fictif</p>
                </div>

                {/* ARIA en chef */}
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-xl font-bold text-black">A</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-amber-400 text-lg">ARIA</span>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">Directrice Générale IA</Badge>
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">Claude Opus</Badge>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-xs text-emerald-400">Active</span>
                      </div>
                      <p className="text-xs text-white/50 mt-1">Supervise les 6 autres agents · Carnet de bord · Rapports · Budget · Stratégie · Accessible via ce chat uniquement</p>
                    </div>
                    <button onClick={() => setSelectedAgent(selectedAgent?.id === "aria" ? null : AGENTS_IA[0])}
                      className="text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-lg px-3 py-1.5"
                    >
                      {selectedAgent?.id === "aria" ? "Fermer" : "Détails"}
                    </button>
                  </div>
                </div>

                {/* 6 autres agents */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {AGENTS_IA.slice(1).map((agent) => {
                    const c = COULEUR_MAP[agent.couleur] || COULEUR_MAP.blue;
                    const isSelected = selectedAgent?.id === agent.id;
                    return (
                      <div key={agent.id} className={`border rounded-xl p-4 cursor-pointer transition-all ${isSelected ? `${c.bg} ${c.border}` : "bg-white/5 border-white/10 hover:border-white/20"}`}
                        onClick={() => setSelectedAgent(isSelected ? null : agent)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{agent.emoji}</span>
                            <span className={`font-bold text-sm ${isSelected ? c.text : "text-white"}`}>{agent.nom}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${agent.statut === "active" ? "bg-emerald-400" : "bg-yellow-400"}`} />
                            <span className="text-xs text-white/40">{agent.statut === "active" ? "Actif" : "Dev"}</span>
                          </div>
                        </div>
                        <Badge className={`${c.badge} text-xs mb-2`}>{agent.role}</Badge>
                        <p className="text-xs text-white/50 mb-2 line-clamp-2">{agent.description}</p>
                        <div className="text-xs text-white/30 flex items-center gap-1">
                          <span>🔑</span>
                          <span>{agent.acces}</span>
                        </div>
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                            <p className={`text-xs font-semibold ${c.text} mb-1`}>Fonctions :</p>
                            {agent.fonctions.map((f) => (
                              <div key={f} className="flex items-start gap-1 text-xs text-white/60">
                                <ChevronRight size={10} className={`mt-0.5 flex-shrink-0 ${c.text}`} />
                                <span>{f}</span>
                              </div>
                            ))}
                            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                              <span className="text-xs text-white/30">Modèle : {agent.modele}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); setInput(`ARIA, donne un ordre à ${agent.nom} :`); }}
                                className={`text-xs px-2 py-1 rounded-lg ${c.bg} ${c.text} border ${c.border} hover:opacity-80`}
                              >
                                Ordonner via ARIA →
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Organigramme depuis DB */}
                {organigramme && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">📋 Tâches urgentes par agent</h3>
                    <div className="space-y-3">
                      {organigramme.equipes.map((equipe) => (
                        <div key={equipe.id} className="flex items-start gap-3">
                          <span className="text-lg flex-shrink-0">{equipe.emoji}</span>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-white/80 mb-1">{equipe.nom}</p>
                            {equipe.tachesUrgentes.slice(0, 2).map((t) => (
                              <div key={t} className="flex items-center gap-2 text-xs text-white/50">
                                <span className="w-1 h-1 rounded-full bg-white/30 flex-shrink-0" />
                                <span className="flex-1">{t}</span>
                                <button onClick={() => setInput(`ARIA, donne l'ordre : ${t}`)} className="text-amber-400/60 hover:text-amber-400 underline flex-shrink-0">→</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ── TERRAIN ───────────────────────────────────────────── */}
              <TabsContent value="terrain" className="mt-0 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Terrain — LÉNA & Fiches SEO</h2>
                  <p className="text-sm text-white/50">Accès rapide à l'espace terrain · LÉNA vous assiste pour les fiches établissements</p>
                </div>

                {/* Accès rapide LÉNA */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-600 flex items-center justify-center text-lg font-bold text-black">L</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-400">LÉNA</span>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">Agente Terrain & SEO</Badge>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                      <p className="text-xs text-white/50">Claude Sonnet · Pose des questions guidées · Mémorise les sessions · Construit les fiches SEO</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/70 mb-4">
                    LÉNA est votre assistante terrain. Elle vous pose des questions pour remplir les fiches établissements, 
                    se souvient où vous en êtes, et construit automatiquement la fiche SEO finale avec photos et descriptions.
                  </p>
                  <Link href="/terrain">
                    <Button className="bg-blue-500 hover:bg-blue-400 text-white font-semibold gap-2">
                      📍 Ouvrir l'espace Terrain avec LÉNA
                      <ExternalLink size={14} />
                    </Button>
                  </Link>
                </div>

                {/* Stats terrain */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-400">{stats?.totalEstablishments ?? 0}</p>
                    <p className="text-xs text-white/50 mt-1">Établissements créés</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{stats?.publishedCards ?? 0}</p>
                    <p className="text-xs text-white/50 mt-1">Fiches publiées</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-amber-400">{allUsers?.filter((u) => u.role === "team").length ?? 0}</p>
                    <p className="text-xs text-white/50 mt-1">Membres terrain</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-400">{stats?.totalCards ?? 0}</p>
                    <p className="text-xs text-white/50 mt-1">Fiches en cours</p>
                  </div>
                </div>

                {/* ─── Inviter un opérateur terrain ─── */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <UserPlus size={14} className="text-amber-400" />
                      Inviter un opérateur terrain
                    </h3>
                    <Button
                      size="sm"
                      onClick={() => { setShowInviteForm(!showInviteForm); setInviteLink(null); }}
                      className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold h-7 px-3"
                    >
                      {showInviteForm ? "Annuler" : "+ Inviter"}
                    </Button>
                  </div>

                  {/* Formulaire d'invitation */}
                  {showInviteForm && !inviteLink && (
                    <div className="bg-white/5 border border-amber-500/20 rounded-xl p-4 mb-4 space-y-3">
                      <p className="text-xs text-amber-400 font-medium mb-2">Créer un lien d'invitation (valable 7 jours)</p>
                      <div>
                        <label className="text-xs text-white/50 mb-1 block">Nom de l'opérateur *</label>
                        <input
                          type="text"
                          placeholder="Ex: Amin Dupont"
                          value={inviteForm.recipientName}
                          onChange={(e) => setInviteForm(f => ({ ...f, recipientName: e.target.value }))}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-white/50 mb-1 flex items-center gap-1"><AtSign size={10} /> Email</label>
                          <input
                            type="email"
                            placeholder="email@exemple.com"
                            value={inviteForm.recipientEmail}
                            onChange={(e) => setInviteForm(f => ({ ...f, recipientEmail: e.target.value }))}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/50 mb-1 flex items-center gap-1"><Phone size={10} /> Téléphone</label>
                          <input
                            type="tel"
                            placeholder="+33 6 12 34 56 78"
                            value={inviteForm.recipientPhone}
                            onChange={(e) => setInviteForm(f => ({ ...f, recipientPhone: e.target.value }))}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-white/50 mb-1 block">Message personnalisé (optionnel)</label>
                        <textarea
                          placeholder="Bienvenue dans l'équipe Baymora ! Ce lien vous donne accès à LÉNA et au dashboard terrain."
                          value={inviteForm.message}
                          onChange={(e) => setInviteForm(f => ({ ...f, message: e.target.value }))}
                          rows={2}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/50 mb-1 block">Rôle</label>
                        <select
                          value={inviteForm.role}
                          onChange={(e) => setInviteForm(f => ({ ...f, role: e.target.value as "team" | "admin" }))}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50"
                        >
                          <option value="team">Opérateur Terrain</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      </div>
                      <Button
                        onClick={() => inviteMutation.mutate({
                          recipientName: inviteForm.recipientName,
                          recipientEmail: inviteForm.recipientEmail || undefined,
                          recipientPhone: inviteForm.recipientPhone || undefined,
                          message: inviteForm.message || undefined,
                          role: inviteForm.role,
                        })}
                        disabled={inviteMutation.isPending || !inviteForm.recipientName || (!inviteForm.recipientEmail && !inviteForm.recipientPhone)}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                      >
                        {inviteMutation.isPending ? "Génération..." : "Générer le lien d'invitation"}
                      </Button>
                    </div>
                  )}

                  {/* Lien généré */}
                  {inviteLink && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 size={16} className="text-green-400" />
                        <p className="text-sm font-semibold text-green-400">Lien d'invitation créé !</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 mb-3">
                        <p className="text-xs text-white/40 mb-1">Lien à partager :</p>
                        <p className="text-xs text-white/80 break-all font-mono">{inviteLink}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => copyInviteLink(inviteLink)}
                          className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs gap-1"
                        >
                          {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                          {copiedLink ? "Copié !" : "Copier le lien"}
                        </Button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`Bonjour ! Voici votre invitation pour rejoindre l'équipe Baymora : ${inviteLink}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs font-medium rounded-md px-3 py-2 border border-green-500/30"
                        >
                          <Phone size={12} /> WhatsApp
                        </a>
                      </div>
                      <button
                        onClick={() => { setInviteLink(null); setShowInviteForm(false); setInviteForm({ recipientName: "", recipientEmail: "", recipientPhone: "", message: "", role: "team" }); }}
                        className="text-xs text-white/30 hover:text-white/50 mt-2 w-full text-center"
                      >
                        Créer une autre invitation
                      </button>
                    </div>
                  )}

                  {/* Membres actifs */}
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Users size={14} />
                    Membres avec accès Terrain ({teamMembers?.length ?? 0})
                  </h3>
                  {!teamMembers || teamMembers.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-xs text-white/40 mb-2">Aucun membre terrain actif.</p>
                      <p className="text-xs text-white/30">Invitez des opérateurs pour qu'ils puissent utiliser LÉNA.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 mb-4">
                      {(teamMembers as any[]).map((u: any) => {
                        const tierMap: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
                          free: { label: "Découverte", icon: <User className="w-3 h-3" />, color: "text-gray-400" },
                          explorer: { label: "Explorer", icon: <Package className="w-3 h-3" />, color: "text-blue-400" },
                          premium: { label: "Premium", icon: <Crown className="w-3 h-3" />, color: "text-amber-400" },
                          elite: { label: "Élite", icon: <Crown className="w-3 h-3" />, color: "text-purple-400" },
                        };
                        const t = tierMap[u.subscriptionTier || "free"] || tierMap.free;
                        return (
                          <div key={u.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-400">
                                  {(u.name || u.email || "?").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-sm text-white font-medium">{u.name || u.email}</p>
                                    <span className="flex items-center gap-1 text-xs bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded-full">
                                      <BadgeCheck className="w-2.5 h-2.5" /> Validé
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-xs text-white/40">{u.role === "admin" ? "Admin" : "Opérateur Terrain"}</p>
                                    <span className={`flex items-center gap-1 text-xs ${t.color}`}>{t.icon} {t.label}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" title="LÉNA disponible" />
                              </div>
                            </div>
                            {/* Actions admin */}
                            {u.role !== "admin" && (
                              <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-white/5">
                                {/* Attribuer forfait */}
                                {grantTierUserId === u.id ? (
                                  <div className="flex items-center gap-1 flex-1">
                                    <select
                                      className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs text-foreground"
                                      defaultValue={u.subscriptionTier || "free"}
                                      onChange={(e) => {
                                        grantTierMutation.mutate({ userId: u.id, tier: e.target.value as any });
                                        setGrantTierUserId(null);
                                      }}
                                    >
                                      <option value="free">Découverte (gratuit)</option>
                                      <option value="explorer">Explorer — 9,90€/mois</option>
                                      <option value="premium">Premium — 29,90€/mois</option>
                                      <option value="elite">Élite — 89,90€/mois</option>
                                    </select>
                                    <button onClick={() => setGrantTierUserId(null)} className="text-white/40 hover:text-white/70 p-1">
                                      <X size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setGrantTierUserId(u.id)}
                                    className="flex items-center gap-1 text-xs text-amber-400/70 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded transition-colors"
                                  >
                                    <Crown size={10} /> Forfait
                                  </button>
                                )}
                                {/* Envoyer un message */}
                                {selectedOperatorId === u.id ? (
                                  <div className="flex items-center gap-1 flex-1">
                                    <Input
                                      placeholder="Directive..."
                                      value={operatorMsgContent}
                                      onChange={e => setOperatorMsgContent(e.target.value)}
                                      onKeyDown={e => {
                                        if (e.key === "Enter" && operatorMsgContent.trim()) {
                                          sendOperatorMessageMutation.mutate({ toUserId: u.id, content: operatorMsgContent.trim() });
                                        }
                                      }}
                                      className="flex-1 h-7 text-xs"
                                    />
                                    <button
                                      onClick={() => {
                                        if (operatorMsgContent.trim()) {
                                          sendOperatorMessageMutation.mutate({ toUserId: u.id, content: operatorMsgContent.trim() });
                                        }
                                      }}
                                      disabled={!operatorMsgContent.trim() || sendOperatorMessageMutation.isPending}
                                      className="text-blue-400 hover:text-blue-300 p-1 disabled:opacity-40"
                                    >
                                      {sendOperatorMessageMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                    </button>
                                    <button onClick={() => setSelectedOperatorId(null)} className="text-white/40 hover:text-white/70 p-1">
                                      <X size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setSelectedOperatorId(u.id)}
                                    className="flex items-center gap-1 text-xs text-blue-400/70 hover:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded transition-colors"
                                  >
                                    <MessageSquare size={10} /> Message
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Invitations en attente */}
                  {invitations && invitations.filter(i => i.status === "pending").length > 0 && (
                    <>
                      <h3 className="text-sm font-semibold text-white/60 mb-2 flex items-center gap-2">
                        <Clock size={13} className="text-amber-400" />
                        Invitations en attente ({invitations.filter(i => i.status === "pending").length})
                      </h3>
                      <div className="space-y-2">
                        {invitations.filter(i => i.status === "pending").map((inv) => (
                          <div key={inv.id} className="flex items-center justify-between bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-medium truncate">{inv.recipientName || "Opérateur"}</p>
                              <p className="text-xs text-white/40 truncate">
                                {inv.recipientEmail || inv.recipientPhone} · expire {new Date(inv.expiresAt).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              {/* Envoyer par email */}
                              {inv.recipientEmail && (
                                <button
                                  onClick={() => sendInviteEmailMutation.mutate({ token: inv.token, origin: window.location.origin })}
                                  disabled={sendInviteEmailMutation.isPending}
                                  className="text-blue-400/60 hover:text-blue-400 p-1"
                                  title={`Envoyer par email à ${inv.recipientEmail}`}
                                >
                                  <Mail size={12} />
                                </button>
                              )}
                              {/* Envoyer par WhatsApp */}
                              {inv.recipientPhone && (
                                <button
                                  onClick={() => {
                                    const phone = inv.recipientPhone!.replace(/[^0-9]/g, "");
                                    const intlPhone = phone.startsWith("0") ? "33" + phone.slice(1) : phone;
                                    const link = `${window.location.origin}/invite/${inv.token}`;
                                    const msg = encodeURIComponent(`Bonjour ${inv.recipientName} ! Vous êtes invité(e) à rejoindre l'équipe Baymora. Cliquez ici pour activer votre accès : ${link}`);
                                    window.open(`https://wa.me/${intlPhone}?text=${msg}`, "_blank");
                                  }}
                                  className="text-green-400/60 hover:text-green-400 p-1"
                                  title={`Envoyer par WhatsApp à ${inv.recipientPhone}`}
                                >
                                  <Phone size={12} />
                                </button>
                              )}
                              {/* Copier le lien */}
                              <button
                                onClick={() => copyInviteLink(`${window.location.origin}/invite/${inv.token}`)}
                                className="text-white/40 hover:text-white/70 p-1"
                                title="Copier le lien"
                              >
                                <Copy size={12} />
                              </button>
                              <button
                                onClick={() => cancelInviteMutation.mutate({ token: inv.token })}
                                className="text-red-400/60 hover:text-red-400 p-1"
                                title="Annuler l'invitation"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <p className="text-xs text-white/30 mt-3">Tous les membres terrain ont accès à LÉNA et au micro vocal</p>
                </div>

                {/* Architecture LÉNA */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Architecture LÉNA (Binôme IA)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🧠</span>
                        <span className="text-sm font-semibold text-amber-300">LÉNA (Claude Opus)</span>
                      </div>
                      <ul className="text-xs text-white/60 space-y-1">
                        <li>• Rédaction fiches SEO</li>
                        <li>• Questions guidées terrain</li>
                        <li>• Mémoire de session</li>
                        <li>• Structure éditoriale</li>
                      </ul>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🔍</span>
                        <span className="text-sm font-semibold text-blue-300">SCOUT (Perplexity)</span>
                      </div>
                      <ul className="text-xs text-white/60 space-y-1">
                        <li>• Recherche web temps réel</li>
                        <li>• Infos complémentaires</li>
                        <li>• Photos et médias</li>
                        <li>• Vérification des données</li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-xs text-white/30 mt-3">
                    LÉNA guide les membres terrain (Amin et collègues) à travers 10 étapes structurées pour créer des fiches complètes et SEO-optimisées.
                  </p>
                </div>

                {/* ─── Validation fiches terrain ─────────────────────────────────────────────── */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-amber-400" />
                      Fiches à valider
                      {pendingReports && pendingReports.length > 0 && (
                        <span className="bg-amber-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {pendingReports.length}
                        </span>
                      )}
                    </h3>
                    <button onClick={() => refetchPendingReports()} className="text-white/30 hover:text-white/60 transition-colors">
                      <RefreshCw size={12} />
                    </button>
                  </div>
                  {!pendingReports || pendingReports.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle2 size={24} className="text-emerald-400/40 mx-auto mb-2" />
                      <p className="text-xs text-white/30">Aucune fiche en attente de validation</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingReports.map((report) => (
                        <div key={report.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{report.establishmentName}</p>
                              <p className="text-xs text-white/40 mt-0.5">{report.city}, {report.country} · {report.establishmentType}</p>
                              {report.submittedAt && (
                                <p className="text-xs text-amber-400/60 mt-0.5">
                                  Soumis le {new Date(report.submittedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full shrink-0">
                              En attente
                            </span>
                          </div>
                          {report.description && (
                            <p className="text-xs text-white/50 line-clamp-2 mb-3">{report.description}</p>
                          )}
                          {/* Zone notes + actions */}
                          {reviewingId === report.id ? (
                            <div className="space-y-2">
                              <Input
                                placeholder="Note pour l'opérateur (optionnel)..."
                                value={reviewNotes[report.id] || ""}
                                onChange={e => setReviewNotes(n => ({ ...n, [report.id]: e.target.value }))}
                                className="h-8 text-xs bg-white/5 border-white/10"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => reviewMutation.mutate({ id: report.id, action: "approve", notes: reviewNotes[report.id] })}
                                  disabled={reviewMutation.isPending}
                                  className="flex-1 flex items-center justify-center gap-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium py-2 rounded-xl border border-emerald-500/30 transition-colors disabled:opacity-50"
                                >
                                  {reviewMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                                  Approuver
                                </button>
                                <button
                                  onClick={() => reviewMutation.mutate({ id: report.id, action: "reject", notes: reviewNotes[report.id] })}
                                  disabled={reviewMutation.isPending}
                                  className="flex-1 flex items-center justify-center gap-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium py-2 rounded-xl border border-red-500/30 transition-colors disabled:opacity-50"
                                >
                                  <XCircle size={10} />
                                  Rejeter
                                </button>
                                <button
                                  onClick={() => setReviewingId(null)}
                                  className="text-white/30 hover:text-white/60 px-2"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReviewingId(report.id)}
                              className="w-full flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-medium py-2 rounded-xl border border-amber-500/20 transition-colors"
                            >
                              <Shield size={11} /> Examiner cette fiche
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── MANUS DG ───────────────────────────────────────────────────────────── */}
              <TabsContent value="manus" className="mt-0 space-y-5">
                <ManusPanel setInput={setInput} />
              </TabsContent>

              {/* ── CREATIVE (MAYA) ──────────────────────────────────────────────── */}
              <TabsContent value="creative" className="mt-0 space-y-5">
                <CreativePanel />
              </TabsContent>

              {/* ── COMMS (NOVA) ───────────────────────────────────────────────────────────── */}
              <TabsContent value="comms" className="mt-0 space-y-5">
                <CommsPanel />
              </TabsContent>

              {/* ── AFFILIATION (ATLAS) ──────────────────────────────────────────────────── */}
              <TabsContent value="affiliation" className="mt-0 space-y-5">
                <AffiliationPanel />
              </TabsContent>

              {/* ── CARNET DE BORD ──────────────────────────────────────────────────────── */}           <TabsContent value="carnet" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">Carnet de Bord ARIA</h2>
                    <p className="text-sm text-white/50">Rapports datés et alertes archivés par ARIA</p>
                  </div>
                  <Button onClick={generateReport} disabled={isLoading} className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold">
                    📊 Générer rapport
                  </Button>
                </div>
                {carnets && carnets.length > 0 ? (
                  <div className="space-y-4">
                    {carnets.map((carnet) => (
                      <div key={carnet.id} className={`border rounded-xl p-4 ${carnet.actionType === "alert" ? "bg-red-500/10 border-red-500/20" : "bg-white/5 border-white/10"}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-white/40">{new Date(carnet.createdAt).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          {actionBadge(carnet.actionType ?? undefined)}
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none text-white/70">
                          <ReactMarkdown>{carnet.content}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                    <p className="text-4xl mb-3">📔</p>
                    <p className="text-white/60 text-sm">Aucun rapport dans le carnet de bord.</p>
                    <p className="text-white/40 text-xs mt-1">Cliquez sur "Générer rapport" pour créer le premier rapport journalier d'ARIA.</p>
                    <Button onClick={generateReport} disabled={isLoading} className="mt-4 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold">
                      📊 Premier rapport ARIA
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* ── MISSIONS 24H ─────────────────────────────────────────────── */}
              <TabsContent value="missions" className="mt-0 h-full">
                <MissionsPanel
                  activeMission={activeMission ?? null}
                  missionHistory={missionHistory ?? []}
                  missionView={missionView}
                  setMissionView={setMissionView}
                  missionTitle={missionTitle}
                  setMissionTitle={setMissionTitle}
                  missionContent={missionContent}
                  setMissionContent={setMissionContent}
                  missionPriority={missionPriority}
                  setMissionPriority={setMissionPriority}
                  missionDuration={missionDuration}
                  setMissionDuration={setMissionDuration}
                  selectedHistoryMission={selectedHistoryMission}
                  setSelectedHistoryMission={setSelectedHistoryMission}
                  onCreateMission={async () => {
                    if (!missionTitle.trim() || !missionContent.trim()) { toast.error("Titre et contenu requis"); return; }
                    try {
                      const res = await createMissionMutation.mutateAsync({ title: missionTitle, content: missionContent, priority: missionPriority, durationHours: missionDuration });
                      toast.success("🎯 Mission lancée ! ARIA a pris connaissance.");
                      setMissionTitle(""); setMissionContent(""); setMissionView("active");
                      await refetchActiveMission(); await refetchMissionHistory();
                      // Afficher l'accusé de réception dans le chat ARIA
                      if (res.ariaAck) setMessages(prev => [...prev, { role: "assistant", content: res.ariaAck, actionType: "mission", timestamp: new Date() }]);
                    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erreur"); }
                  }}
                  onCloseMission={async (id, status) => {
                    try {
                      const res = await closeMissionMutation.mutateAsync({ missionId: id, status });
                      toast.success(status === "completed" ? "✅ Mission clôturée avec compte-rendu" : "❌ Mission annulée");
                      await refetchActiveMission(); await refetchMissionHistory();
                      if (res.report) setMessages(prev => [...prev, { role: "assistant", content: res.report, actionType: "report", timestamp: new Date() }]);
                    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erreur"); }
                  }}
                  isCreating={createMissionMutation.isPending}
                  isClosing={closeMissionMutation.isPending}
                />
              </TabsContent>

              {/* ── ACCÈS ───────────────────────────────────────────────────── */}
              <TabsContent value="acces" className="mt-0 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Gestion des Accès</h2>
                  <p className="text-sm text-white/50">Vous seul pouvez modifier les rôles · Pilotage = accès exclusif fondateur</p>
                </div>

                {/* Tableau des rôles */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">📋 Niveaux d'accès</h3>
                  <div className="space-y-2">
                    {[
                      { role: "admin", label: "Admin / Fondateur", desc: "Accès Pilotage complet + toutes les pages", color: "text-amber-400", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
                      { role: "team",  label: "Membre Terrain",    desc: "Accès Terrain + LÉNA + forfait mini inclus", color: "text-blue-400",  badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
                      { role: "user",  label: "Membre Client",     desc: "Accès Chat + Mon Espace + Destinations",   color: "text-white/60", badge: "bg-white/10 text-white/50 border-white/20" },
                    ].map((r) => (
                      <div key={r.role} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <Badge className={`${r.badge} text-xs flex-shrink-0`}>{r.label}</Badge>
                        <p className="text-xs text-white/50 flex-1">{r.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Liste des utilisateurs */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Users size={14} />
                    Tous les membres ({allUsers?.length ?? 0})
                  </h3>
                  {!allUsers || allUsers.length === 0 ? (
                    <p className="text-xs text-white/40">Aucun membre pour l'instant.</p>
                  ) : (
                    <div className="space-y-2">
                      {allUsers.map((u) => (
                        <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white/70 flex-shrink-0">
                              {(u.name || u.email || "?")[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-white/80 font-medium truncate">{u.name || "Sans nom"}</p>
                              <p className="text-xs text-white/40 truncate">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-11 sm:ml-0">
                            <select
                              value={u.role}
                              onChange={(e) => updateRole(u.id, e.target.value)}
                              className="text-xs bg-white/10 border border-white/20 text-white rounded-lg px-2 py-1.5 focus:border-amber-400/50 focus:outline-none"
                            >
                              <option value="user">Client</option>
                              <option value="team">Terrain</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Note de sécurité */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                  <p className="text-xs text-amber-400/80">
                    ⚠️ <strong>Note :</strong> Seul vous (fondateur) pouvez accéder à cette page. 
                    Les membres "Terrain" ont accès à la page /terrain et à LÉNA. 
                    Les "Admin" ont accès au Pilotage complet — ne donnez cet accès qu'à des personnes de confiance absolue.
                  </p>
                </div>
              </TabsContent>

            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// ─── MANUS DG Panel ───────────────────────────────────────────────────────────
function ManusPanel({ setInput }: { setInput: (v: string) => void }) {
  const [manusHistory, setManusHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [manusInput, setManusInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeManusTab, setActiveManusTab] = useState<"chat" | "strategie" | "missions">("chat");
  const manusChatMutation = trpc.manus.chat.useMutation();
  const manusDelibererMutation = trpc.manus.deliberer.useMutation();
  const { data: strategie } = trpc.manus.strategie.useQuery();

  const sendToManus = async () => {
    if (!manusInput.trim() || isLoading) return;
    const msg = manusInput.trim();
    setManusInput("");
    setManusHistory((prev) => [...prev, { role: "user", content: msg }]);
    setIsLoading(true);
    try {
      const res = await manusChatMutation.mutateAsync({ message: msg, history: manusHistory });
      setManusHistory((prev) => [...prev, { role: "assistant", content: res.content }]);
    } catch (err: unknown) {
      toast.error("Erreur MANUS : " + (err instanceof Error ? err.message : "Inconnue"));
    } finally {
      setIsLoading(false);
    }
  };

  const deliberer = async () => {
    setIsLoading(true);
    try {
      const res = await manusDelibererMutation.mutateAsync({
        sujet: "Prochaines priorités de Maison Baymora",
        contexte: "Analyser l'état actuel et proposer les 3 actions les plus urgentes",
      });
      const summary = `**Délibération ARIA+MANUS**\n\n**ARIA :** ${res.analyseAria}\n\n**MANUS :** ${res.analyseManus}\n\n**Décision commune :** ${res.decision}\n\n**Actions ARIA :** ${res.actionsAria.join(", ")}\n\n**Actions MANUS :** ${res.actionsManus.join(", ")}\n\n**Délai :** ${res.delai}`;
      setManusHistory((prev) => [...prev, { role: "assistant", content: summary }]);
      setActiveManusTab("chat");
      if (res.messageFoundateur) {
        setInput(`ARIA, MANUS dit : ${res.messageFoundateur}`);
      }
    } catch (err: unknown) {
      toast.error("Erreur délibération : " + (err instanceof Error ? err.message : "Inconnue"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap size={18} className="text-yellow-400" />
            MANUS — Agent Directeur Technique
          </h2>
          <p className="text-sm text-white/50">Binôme d'ARIA · Décisions partagées · Accès total</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveManusTab("chat")}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${activeManusTab === "chat" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" : "bg-white/5 text-white/50 border-white/10 hover:text-white/80"}`}
          >💬 Chat</button>
          <button
            onClick={() => setActiveManusTab("strategie")}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${activeManusTab === "strategie" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" : "bg-white/5 text-white/50 border-white/10 hover:text-white/80"}`}
          >🗺️ Stratégie</button>
          <button
            onClick={deliberer}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 rounded-lg border bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30 disabled:opacity-50"
          >⚡ Délibérer</button>
        </div>
      </div>

      {/* Profil MANUS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Design UI/UX", desc: "Niveau magazine luxe", icon: "🎨", color: "text-pink-400" },
          { label: "Web Scraping", desc: "TripAdvisor, Maps, Instagram", icon: "🔍", color: "text-blue-400" },
          { label: "Orchestration", desc: "Agents, missions, code", icon: "⚙️", color: "text-yellow-400" },
        ].map((c) => (
          <div key={c.label} className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{c.icon}</span>
              <span className={`text-xs font-semibold ${c.color}`}>{c.label}</span>
            </div>
            <p className="text-xs text-white/50">{c.desc}</p>
          </div>
        ))}
      </div>

      {activeManusTab === "chat" && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xs font-bold text-black">M</div>
            <span className="text-sm font-semibold text-yellow-400">MANUS</span>
            <span className="text-xs text-white/30">Agent Directeur Technique</span>
          </div>
          <div className="h-64 overflow-auto p-4 space-y-3">
            {manusHistory.length === 0 && (
              <div className="text-center py-8">
                <p className="text-white/40 text-sm">Parlez directement à MANUS</p>
                <p className="text-white/25 text-xs mt-1">Il vous répond depuis son angle technique et opérationnel</p>
              </div>
            )}
            {manusHistory.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-yellow-500/20 text-white border border-yellow-500/30" : "bg-white/5 text-white/90 border border-white/10"}`}>
                  <div className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 break-words overflow-wrap-anywhere">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>
          <div className="px-4 py-3 border-t border-white/10 flex gap-2">
            <input
              value={manusInput}
              onChange={(e) => setManusInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendToManus(); }}
              placeholder="Parlez à MANUS..."
              className="flex-1 bg-white/5 border border-white/20 text-white placeholder:text-white/30 rounded-lg px-3 py-2 text-sm focus:border-yellow-400/50 focus:outline-none"
            />
            <button onClick={sendToManus} disabled={isLoading || !manusInput.trim()}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-3 py-2 rounded-lg disabled:opacity-50 text-sm"
            >↑</button>
          </div>
        </div>
      )}

      {activeManusTab === "strategie" && strategie && (
        <div className="space-y-4">
          {Object.entries(strategie).map(([key, phase]) => {
            const p = phase as { titre: string; objectif: string; agents: string[]; actions: string[] };
            return (
              <div key={key} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-yellow-400">{p.titre}</h3>
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">{p.objectif}</Badge>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {p.agents.map((a) => <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">{a}</span>)}
                </div>
                <ul className="space-y-1">
                  {p.actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                      <ChevronRight size={10} className="mt-0.5 flex-shrink-0 text-yellow-400" />
                      <span>{action}</span>
                      <button onClick={() => setInput(`ARIA, lance cette action : ${action}`)} className="ml-auto text-yellow-400/50 hover:text-yellow-400 flex-shrink-0">→ ARIA</button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── CREATIVE Panel (MAYA) ────────────────────────────────────────────────────
function CreativePanel() {
  const [sujet, setSujet] = useState("");
  const [plateforme, setPlateforme] = useState<"instagram" | "tiktok" | "linkedin">("instagram");
  const [type, setType] = useState<"post" | "carrousel" | "reel">("post");
  const [result, setResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"post" | "blog" | "calendrier">("post");
  const genererPostMutation = trpc.maya.genererPost.useMutation();
  const genererBlogMutation = trpc.maya.genererBlog.useMutation();
  const genererCalendrierMutation = trpc.maya.genererCalendrier.useMutation();

  const genererPost = async () => {
    if (!sujet.trim()) return;
    setIsLoading(true);
    try {
      const res = await genererPostMutation.mutateAsync({ sujet, plateforme, type });
      setResult(JSON.stringify(res, null, 2));
      toast.success("Post généré par MAYA !");
    } catch (err: unknown) {
      toast.error("Erreur MAYA : " + (err instanceof Error ? err.message : "Inconnue"));
    } finally {
      setIsLoading(false);
    }
  };

  const genererBlog = async () => {
    if (!sujet.trim()) return;
    setIsLoading(true);
    try {
      const res = await genererBlogMutation.mutateAsync({ sujet });
      setResult(JSON.stringify(res, null, 2));
      toast.success("Article blog généré par MAYA !");
    } catch (err: unknown) {
      toast.error("Erreur MAYA : " + (err instanceof Error ? err.message : "Inconnue"));
    } finally {
      setIsLoading(false);
    }
  };

  const genererCalendrier = async () => {
    setIsLoading(true);
    try {
      const res = await genererCalendrierMutation.mutateAsync({ dureeJours: 30 });
      setResult(JSON.stringify(res, null, 2));
      toast.success("Calendrier éditorial 30 jours généré !");
    } catch (err: unknown) {
      toast.error("Erreur MAYA : " + (err instanceof Error ? err.message : "Inconnue"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Megaphone size={18} className="text-purple-400" />
          MAYA — Agente Creative
        </h2>
        <p className="text-sm text-white/50">Blog SEO · Réseaux sociaux · Carrousels · Réels · Calendrier éditorial</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Blog SEO", desc: "Articles premium", icon: "✍️", color: "text-purple-400" },
          { label: "Instagram", desc: "Posts & Carrousels", icon: "📸", color: "text-pink-400" },
          { label: "TikTok", desc: "Scripts Réels", icon: "🎬", color: "text-red-400" },
          { label: "Calendrier", desc: "30 jours planifiés", icon: "📅", color: "text-blue-400" },
        ].map((c) => (
          <div key={c.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <span className="text-2xl">{c.icon}</span>
            <p className={`text-xs font-semibold ${c.color} mt-1`}>{c.label}</p>
            <p className="text-xs text-white/40">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["post", "blog", "calendrier"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${activeTab === t ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : "bg-white/5 text-white/50 border-white/10 hover:text-white/80"}`}
          >{t === "post" ? "📱 Post Social" : t === "blog" ? "✍️ Article Blog" : "📅 Calendrier"}</button>
        ))}
      </div>

      {activeTab !== "calendrier" && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <input
            value={sujet}
            onChange={(e) => setSujet(e.target.value)}
            placeholder={activeTab === "post" ? "Sujet du post (ex: Staycation romantique à Paris)" : "Sujet de l'article (ex: Les meilleurs hôtels boutique de Lyon)"}
            className="w-full bg-white/5 border border-white/20 text-white placeholder:text-white/30 rounded-lg px-3 py-2 text-sm focus:border-purple-400/50 focus:outline-none"
          />
          {activeTab === "post" && (
            <div className="flex gap-2">
              <select value={plateforme} onChange={(e) => setPlateforme(e.target.value as typeof plateforme)}
                className="flex-1 bg-white/5 border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="linkedin">LinkedIn</option>
              </select>
              <select value={type} onChange={(e) => setType(e.target.value as typeof type)}
                className="flex-1 bg-white/5 border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value="post">Post</option>
                <option value="carrousel">Carrousel</option>
                <option value="reel">Réel</option>
              </select>
            </div>
          )}
          <button onClick={activeTab === "post" ? genererPost : genererBlog} disabled={isLoading || !sujet.trim()}
            className="w-full bg-purple-500 hover:bg-purple-400 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50"
          >{isLoading ? "Génération en cours..." : activeTab === "post" ? "🎨 Générer le post" : "✍️ Générer l'article"}</button>
        </div>
      )}

      {activeTab === "calendrier" && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-white/60 mb-3">Génère un calendrier éditorial complet de 30 jours avec 3 posts/jour sur Instagram, TikTok et LinkedIn.</p>
          <button onClick={genererCalendrier} disabled={isLoading}
            className="w-full bg-purple-500 hover:bg-purple-400 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50"
          >{isLoading ? "Génération en cours..." : "📅 Générer le calendrier 30 jours"}</button>
        </div>
      )}

      {result && (
        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-400">Résultat MAYA</span>
            <button onClick={() => { navigator.clipboard.writeText(result); toast.success("Copié !"); }}
              className="text-xs text-white/40 hover:text-white/70">📋 Copier</button>
          </div>
          <pre className="text-xs text-white/70 overflow-auto max-h-64 whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
}

// ─── COMMS Panel (NOVA) ───────────────────────────────────────────────────────
function CommsPanel() {
  const [commentaire, setCommentaire] = useState("");
  const [plateforme, setPlateforme] = useState("Instagram");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"commentaires" | "email" | "message">("commentaires");
  const repondreCommentaireMutation = trpc.nova.repondreCommentaire.useMutation();
  const genererEmailMutation = trpc.nova.genererEmail.useMutation();
  const gererMessageMutation = trpc.nova.gererMessage.useMutation();

  const repondre = async () => {
    if (!commentaire.trim()) return;
    setIsLoading(true);
    try {
      const res = await repondreCommentaireMutation.mutateAsync({ commentaire, plateforme });
      setResult(res.reponse);
      toast.success("Réponse générée par NOVA !");
    } catch (err: unknown) {
      toast.error("Erreur NOVA : " + (err instanceof Error ? err.message : "Inconnue"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Mail size={18} className="text-green-400" />
          NOVA — Agente Communication
        </h2>
        <p className="text-sm text-white/50">Emails · Commentaires · Messages privés · CRM · Newsletter</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Commentaires", desc: "Instagram, TikTok, Google", icon: "💬", color: "text-green-400" },
          { label: "Emails", desc: "Bienvenue, relance, promo", icon: "📧", color: "text-blue-400" },
          { label: "Messages privés", desc: "DM, WhatsApp, email", icon: "📩", color: "text-purple-400" },
        ].map((c) => (
          <div key={c.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <span className="text-2xl">{c.icon}</span>
            <p className={`text-xs font-semibold ${c.color} mt-1`}>{c.label}</p>
            <p className="text-xs text-white/40">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["commentaires", "email", "message"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${activeTab === t ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-white/5 text-white/50 border-white/10 hover:text-white/80"}`}
          >{t === "commentaires" ? "💬 Commentaires" : t === "email" ? "📧 Emails" : "📩 Messages"}</button>
        ))}
      </div>

      {activeTab === "commentaires" && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <select value={plateforme} onChange={(e) => setPlateforme(e.target.value)}
            className="w-full bg-white/5 border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none">
            <option>Instagram</option>
            <option>TikTok</option>
            <option>Google</option>
            <option>Site web</option>
          </select>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Collez le commentaire à traiter..."
            rows={3}
            className="w-full bg-white/5 border border-white/20 text-white placeholder:text-white/30 rounded-lg px-3 py-2 text-sm focus:border-green-400/50 focus:outline-none resize-none"
          />
          <button onClick={repondre} disabled={isLoading || !commentaire.trim()}
            className="w-full bg-green-500 hover:bg-green-400 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50"
          >{isLoading ? "Génération..." : "💬 Générer la réponse"}</button>
          {result && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-400 mb-1">Réponse NOVA :</p>
              <p className="text-sm text-white/80">{result}</p>
              <button onClick={() => { navigator.clipboard.writeText(result); toast.success("Copié !"); }}
                className="text-xs text-green-400 hover:text-green-300 mt-2">📋 Copier</button>
            </div>
          )}
        </div>
      )}

      {activeTab === "email" && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-white/60 mb-3">Génération d'emails automatiques via NOVA. Configurez les triggers dans les paramètres.</p>
          <div className="space-y-2">
            {["bienvenue", "newsletter", "relance", "prospection"].map((type) => (
              <div key={type} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-sm text-white capitalize">{type}</p>
                  <p className="text-xs text-white/40">{type === "bienvenue" ? "À l'inscription" : type === "newsletter" ? "Hebdomadaire" : type === "relance" ? "J+3, J+7" : "Partenaires"}</p>
                </div>
                <button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const res = await genererEmailMutation.mutateAsync({ type: type as "bienvenue" | "newsletter" | "relance" | "prospection" | "confirmation" | "rapport", prenom: "Client", email: "client@example.com" });
                      setResult(res.corps);
                      toast.success(`Email ${type} généré !`);
                    } catch { toast.error("Erreur"); } finally { setIsLoading(false); }
                  }}
                  disabled={isLoading}
                  className="text-xs px-2 py-1 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50"
                >Générer</button>
              </div>
            ))}
          </div>
          {result && (
            <div className="mt-3 bg-black/40 border border-white/10 rounded-lg p-3 max-h-48 overflow-auto">
              <p className="text-xs text-white/70 whitespace-pre-wrap">{result}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "message" && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <textarea
            placeholder="Collez le message privé reçu..."
            rows={4}
            onChange={(e) => setCommentaire(e.target.value)}
            className="w-full bg-white/5 border border-white/20 text-white placeholder:text-white/30 rounded-lg px-3 py-2 text-sm focus:border-green-400/50 focus:outline-none resize-none"
          />
          <button
            onClick={async () => {
              if (!commentaire.trim()) return;
              setIsLoading(true);
              try {
                const res = await gererMessageMutation.mutateAsync({ expediteur: "Client", message: commentaire });
                setResult(res.reponse);
                toast.success("Réponse générée !");
              } catch { toast.error("Erreur"); } finally { setIsLoading(false); }
            }}
            disabled={isLoading || !commentaire.trim()}
            className="w-full bg-green-500 hover:bg-green-400 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50"
          >{isLoading ? "Génération..." : "📩 Générer la réponse"}</button>
          {result && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-sm text-white/80">{result}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AFFILIATION Panel (ATLAS) ────────────────────────────────────────────────
function AffiliationPanel() {
  const [type, setType] = useState<"staycation" | "restaurant" | "chauffeur" | "location_voiture_luxe" | "spa" | "activite" | "avion" | "train">("staycation");
  const [ville, setVille] = useState("");
  const [result, setResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"programmes" | "prestataires" | "strategie">("programmes");
  const { data: programmes } = trpc.atlas.programmes.useQuery();
  const rechercherMutation = trpc.atlas.rechercherPrestataires.useMutation();
  const strategieMutation = trpc.atlas.strategie.useMutation();

  const rechercher = async () => {
    if (!ville.trim()) return;
    setIsLoading(true);
    try {
      const res = await rechercherMutation.mutateAsync({ type, ville });
      setResult(JSON.stringify(res, null, 2));
      toast.success(`${res.length} prestataires trouvés !`);
    } catch (err: unknown) {
      toast.error("Erreur ATLAS : " + (err instanceof Error ? err.message : "Inconnue"));
    } finally {
      setIsLoading(false);
    }
  };

  const genererStrategie = async () => {
    setIsLoading(true);
    try {
      const res = await strategieMutation.mutateAsync({ budget: 0, priorites: [] });
      setResult(JSON.stringify(res, null, 2));
      toast.success("Stratégie d'affiliation générée !");
    } catch (err: unknown) {
      toast.error("Erreur : " + (err instanceof Error ? err.message : "Inconnue"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Globe size={18} className="text-cyan-400" />
          ATLAS — Agent Affiliation & Partenariats
        </h2>
        <p className="text-sm text-white/50">Staycation · Restaurants · Chauffeurs · Location voiture · Avions · Trains · Spas</p>
      </div>

      <div className="flex gap-2">
        {(["programmes", "prestataires", "strategie"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${activeTab === t ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" : "bg-white/5 text-white/50 border-white/10 hover:text-white/80"}`}
          >{t === "programmes" ? "🔗 Programmes" : t === "prestataires" ? "🔍 Prestataires" : "📊 Stratégie"}</button>
        ))}
      </div>

      {activeTab === "programmes" && programmes && (
        <div className="space-y-3">
          {programmes.map((p) => (
            <div key={p.nom} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-white">{p.nom}</p>
                  <p className="text-xs text-white/40">{p.plateforme}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-cyan-400">{p.commission}</p>
                  <p className="text-xs text-white/40">Cookie : {p.cookie}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {p.categories.map((c) => <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">{c}</span>)}
              </div>
              <p className="text-xs text-white/50">{p.notes}</p>
              <a href={p.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 mt-2">
                <ExternalLink size={10} /> S'inscrire au programme
              </a>
            </div>
          ))}
        </div>
      )}

      {activeTab === "prestataires" && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex gap-2">
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)}
              className="flex-1 bg-white/5 border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none">
              <option value="staycation">Staycation</option>
              <option value="restaurant">Restaurant</option>
              <option value="chauffeur">Chauffeur VTC</option>
              <option value="location_voiture_luxe">Location voiture luxe</option>
              <option value="spa">Spa & Bien-être</option>
              <option value="activite">Activité & Expérience</option>
              <option value="avion">Avion</option>
              <option value="train">Train</option>
            </select>
            <input value={ville} onChange={(e) => setVille(e.target.value)}
              placeholder="Ville (ex: Paris)"
              className="flex-1 bg-white/5 border border-white/20 text-white placeholder:text-white/30 rounded-lg px-3 py-2 text-sm focus:border-cyan-400/50 focus:outline-none"
            />
          </div>
          <button onClick={rechercher} disabled={isLoading || !ville.trim()}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50"
          >{isLoading ? "Recherche en cours..." : "🔍 Rechercher des prestataires"}</button>
          {result && (
            <div className="bg-black/40 border border-white/10 rounded-lg p-3 max-h-64 overflow-auto">
              <pre className="text-xs text-white/70 whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </div>
      )}

      {activeTab === "strategie" && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <p className="text-sm text-white/60">Génère une stratégie d'affiliation complète avec les programmes recommandés, le plan d'action et les revenus estimés.</p>
          <button onClick={genererStrategie} disabled={isLoading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50"
          >{isLoading ? "Génération..." : "📊 Générer la stratégie"}</button>
          {result && (
            <div className="bg-black/40 border border-white/10 rounded-lg p-3 max-h-64 overflow-auto">
              <pre className="text-xs text-white/70 whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MissionsPanel — Système de missions 24h ─────────────────────────────────
interface MissionRecord {
  id: number;
  title: string;
  content: string;
  status: "active" | "completed" | "cancelled" | "expired";
  priority: "normal" | "high" | "urgent";
  startsAt: Date;
  expiresAt: Date;
  completedAt: Date | null;
  ariaAck: string | null;
  ariaAckAt: Date | null;
  progressNotes: string | null;
  finalReport: string | null;
  finalReportAt: Date | null;
  successScore: number | null;
  completedTasks: number | null;
  totalTasks: number | null;
  durationHours: number | null;
  createdAt: Date;
}

interface MissionsPanelProps {
  activeMission: MissionRecord | null;
  missionHistory: MissionRecord[];
  missionView: "create" | "active" | "history";
  setMissionView: (v: "create" | "active" | "history") => void;
  missionTitle: string;
  setMissionTitle: (v: string) => void;
  missionContent: string;
  setMissionContent: (v: string) => void;
  missionPriority: "normal" | "high" | "urgent";
  setMissionPriority: (v: "normal" | "high" | "urgent") => void;
  missionDuration: number;
  setMissionDuration: (v: number) => void;
  selectedHistoryMission: number | null;
  setSelectedHistoryMission: (v: number | null) => void;
  onCreateMission: () => Promise<void>;
  onCloseMission: (id: number, status: "completed" | "cancelled") => Promise<void>;
  isCreating: boolean;
  isClosing: boolean;
}

function MissionsPanel({
  activeMission, missionHistory, missionView, setMissionView,
  missionTitle, setMissionTitle, missionContent, setMissionContent,
  missionPriority, setMissionPriority, missionDuration, setMissionDuration,
  selectedHistoryMission, setSelectedHistoryMission,
  onCreateMission, onCloseMission, isCreating, isClosing,
}: MissionsPanelProps) {
  const priorityConfig = {
    normal: { label: "Normal", color: "text-white/60", bg: "bg-white/10 border-white/20" },
    high: { label: "Haute", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
    urgent: { label: "Urgente", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
  };

  const statusConfig = {
    active: { label: "Active", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
    completed: { label: "Terminée", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
    cancelled: { label: "Annulée", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
    expired: { label: "Expirée", color: "text-white/40", bg: "bg-white/5 border-white/10" },
  };

  function getRemainingTime(expiresAt: Date): string {
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) return "Expirée";
    const h = Math.floor(remaining / (1000 * 60 * 60));
    const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m restants`;
  }

  function getElapsedPercent(startsAt: Date, expiresAt: Date): number {
    const total = new Date(expiresAt).getTime() - new Date(startsAt).getTime();
    const elapsed = Date.now() - new Date(startsAt).getTime();
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  }

  const historyMission = selectedHistoryMission
    ? missionHistory.find(m => m.id === selectedHistoryMission) ?? null
    : null;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header + Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">🎯 Missions ARIA</h2>
          <p className="text-xs text-white/50">Directives 24h · ARIA les intègre automatiquement</p>
        </div>
        <div className="flex gap-1">
          {(["active", "create", "history"] as const).map(v => (
            <button key={v} onClick={() => setMissionView(v)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${missionView === v ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-white/5 text-white/50 border-white/10 hover:text-white/80"}`}
            >
              {v === "active" ? "🟢 Active" : v === "create" ? "✏️ Nouvelle" : "📋 Historique"}
            </button>
          ))}
        </div>
      </div>

      {/* ── VUE : MISSION ACTIVE ─── */}
      {missionView === "active" && (
        <div className="space-y-4">
          {activeMission ? (
            <>
              {/* Carte mission active */}
              <div className={`border rounded-xl p-4 ${priorityConfig[activeMission.priority].bg}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${priorityConfig[activeMission.priority].bg} ${priorityConfig[activeMission.priority].color}`}>
                        {priorityConfig[activeMission.priority].label}
                      </span>
                      <span className="text-xs text-emerald-400 font-semibold">● EN COURS</span>
                    </div>
                    <h3 className="text-white font-bold text-base">{activeMission.title}</h3>
                    <p className="text-xs text-white/50 mt-1">
                      Lancée le {new Date(activeMission.startsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-400 font-bold text-sm">{getRemainingTime(activeMission.expiresAt)}</p>
                    <p className="text-xs text-white/40">{activeMission.durationHours ?? 24}h total</p>
                  </div>
                </div>

                {/* Barre de progression temporelle */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-white/40 mb-1">
                    <span>Progression</span>
                    <span>{getElapsedPercent(activeMission.startsAt, activeMission.expiresAt)}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className="bg-amber-400 h-1.5 rounded-full transition-all"
                      style={{ width: `${getElapsedPercent(activeMission.startsAt, activeMission.expiresAt)}%` }}
                    />
                  </div>
                </div>

                {/* Tâches */}
                {(activeMission.totalTasks ?? 0) > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-white/40 mb-1">
                      <span>Tâches</span>
                      <span>{activeMission.completedTasks ?? 0}/{activeMission.totalTasks}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div
                        className="bg-emerald-400 h-1.5 rounded-full"
                        style={{ width: `${Math.round(((activeMission.completedTasks ?? 0) / (activeMission.totalTasks ?? 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Accusé de réception ARIA */}
                {activeMission.ariaAck && (
                  <div className="bg-black/30 border border-amber-500/20 rounded-lg p-3 mb-3">
                    <p className="text-xs text-amber-400 font-semibold mb-1">✅ Accusé de réception ARIA</p>
                    <div className="prose prose-invert prose-xs max-w-none text-white/70 text-xs">
                      <ReactMarkdown>{activeMission.ariaAck}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Directive (collapsible) */}
                <details className="group">
                  <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60 select-none">
                    📄 Voir la directive complète
                  </summary>
                  <div className="mt-2 bg-black/20 border border-white/10 rounded-lg p-3 max-h-48 overflow-auto">
                    <pre className="text-xs text-white/60 whitespace-pre-wrap font-mono">{activeMission.content}</pre>
                  </div>
                </details>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => onCloseMission(activeMission.id, "completed")}
                    disabled={isClosing}
                    className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg py-2 text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    {isClosing ? "Génération compte-rendu..." : "✅ Clôturer"}
                  </button>
                  <button
                    onClick={() => {
                      setMissionTitle(activeMission.title + " (relance)");
                      setMissionContent(activeMission.content);
                      setMissionPriority(activeMission.priority);
                      setMissionDuration(activeMission.durationHours ?? 24);
                      setMissionView("create");
                    }}
                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-lg px-3 py-2 text-xs font-semibold transition-all"
                  >
                    🔄 Relancer
                  </button>
                  <button
                    onClick={() => onCloseMission(activeMission.id, "cancelled")}
                    disabled={isClosing}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg px-3 py-2 text-xs transition-all disabled:opacity-50"
                  >
                    ✕ Annuler
                  </button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-xs text-white/40">ARIA intègre cette mission dans chaque réponse automatiquement.</p>
                <p className="text-xs text-white/30 mt-0.5">Pour lancer une nouvelle mission, clôturez d'abord celle-ci.</p>
              </div>
            </>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
              <p className="text-4xl mb-3">🎯</p>
              <p className="text-white/60 text-sm font-semibold">Aucune mission active</p>
              <p className="text-white/40 text-xs mt-1 mb-4">Créez une directive pour qu'ARIA et toute l'équipe travaillent dessus pendant 24h.</p>
              <button onClick={() => setMissionView("create")}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-lg text-sm"
              >
                ✏️ Créer une mission
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── VUE : CRÉER UNE MISSION ─── */}
      {missionView === "create" && (
        <div className="space-y-4">
          {activeMission && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2">
              <span className="text-amber-400 text-sm">⚠️</span>
              <p className="text-xs text-amber-300">Une mission est déjà active. La créer en remplacera une nouvelle et expirera l'ancienne.</p>
            </div>
          )}

          {/* Titre */}
          <div>
            <label className="text-xs text-white/50 mb-1 block">Titre de la mission</label>
            <input
              value={missionTitle}
              onChange={e => setMissionTitle(e.target.value)}
              placeholder="Ex: Mission SEO Paris — 24h"
              className="w-full bg-white/5 border border-white/20 text-white placeholder:text-white/30 rounded-lg px-3 py-2 text-sm focus:border-amber-400/50 focus:outline-none"
            />
          </div>

          {/* Priorité + Durée */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-white/50 mb-1 block">Priorité</label>
              <div className="flex gap-1">
                {(["normal", "high", "urgent"] as const).map(p => (
                  <button key={p} onClick={() => setMissionPriority(p)}
                    className={`flex-1 text-xs py-1.5 rounded-lg border transition-all ${missionPriority === p ? priorityConfig[p].bg + " " + priorityConfig[p].color : "bg-white/5 text-white/40 border-white/10"}`}
                  >
                    {priorityConfig[p].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-32">
              <label className="text-xs text-white/50 mb-1 block">Durée (heures)</label>
              <input
                type="number"
                min={1} max={168}
                value={missionDuration}
                onChange={e => setMissionDuration(parseInt(e.target.value) || 24)}
                className="w-full bg-white/5 border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:border-amber-400/50 focus:outline-none text-center"
              />
            </div>
          </div>

          {/* Contenu — zone principale */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-white/50">Directive complète</label>
              <span className="text-xs text-white/30">{missionContent.length} caractères</span>
            </div>
            <textarea
              value={missionContent}
              onChange={e => setMissionContent(e.target.value)}
              placeholder="Collez ici votre directive complète pour ARIA et les agents...&#10;&#10;Exemple :&#10;MISSION : Créer 15 fiches SEO Paris ce soir&#10;AGENTS : LÉNA, MANUS&#10;OBJECTIFS : ...&#10;DEADLINES : ..."
              rows={14}
              className="w-full bg-white/5 border border-white/20 text-white placeholder:text-white/30 rounded-lg px-3 py-2 text-sm focus:border-amber-400/50 focus:outline-none resize-none font-mono"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onCreateMission}
              disabled={isCreating || !missionTitle.trim() || !missionContent.trim()}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-lg text-sm disabled:opacity-50 transition-all"
            >
              {isCreating ? "🔄 ARIA prend connaissance..." : "🚀 Lancer la mission"}
            </button>
            <button onClick={() => setMissionView("active")}
              className="bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 rounded-lg px-4 py-2 text-sm"
            >
              Annuler
            </button>
          </div>

          <p className="text-xs text-white/30 text-center">
            ARIA génèrera un accusé de réception et intégrera cette directive dans toutes ses réponses pendant {missionDuration}h.
          </p>
        </div>
      )}

      {/* ── VUE : HISTORIQUE ─── */}
      {missionView === "history" && (
        <div className="space-y-3">
          {historyMission ? (
            // Détail d'une mission
            <div className="space-y-3">
              <button onClick={() => setSelectedHistoryMission(null)}
                className="text-xs text-white/50 hover:text-white flex items-center gap-1"
              >
                ← Retour à l'historique
              </button>
              <div className={`border rounded-xl p-4 ${statusConfig[historyMission.status].bg}`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-bold">{historyMission.title}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusConfig[historyMission.status].bg} ${statusConfig[historyMission.status].color}`}>
                    {statusConfig[historyMission.status].label}
                  </span>
                </div>
                <p className="text-xs text-white/40 mb-3">
                  {new Date(historyMission.startsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  {" · "}{historyMission.durationHours ?? 24}h
                </p>

                {/* Score de succès */}
                {historyMission.successScore !== null && (
                  <div className="bg-black/30 border border-white/10 rounded-lg p-3 mb-3 flex items-center gap-3">
                    <div className={`text-3xl font-black ${getScoreColor(historyMission.successScore)}`}>
                      {historyMission.successScore}/100
                    </div>
                    <div>
                      <p className="text-xs text-white/60 font-semibold">Score de succès ARIA</p>
                      {(historyMission.totalTasks ?? 0) > 0 && (
                        <p className="text-xs text-white/40">{historyMission.completedTasks ?? 0}/{historyMission.totalTasks} tâches</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Compte-rendu final */}
                {historyMission.finalReport && (
                  <div className="bg-black/20 border border-white/10 rounded-lg p-3 mb-3">
                    <p className="text-xs text-white/60 font-semibold mb-2">📊 Compte-rendu ARIA</p>
                    <div className="prose prose-invert prose-xs max-w-none text-white/70 text-xs max-h-64 overflow-auto">
                      <ReactMarkdown>{historyMission.finalReport}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Directive originale */}
                <details>
                  <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60 select-none">
                    📄 Directive originale
                  </summary>
                  <div className="mt-2 bg-black/20 border border-white/10 rounded-lg p-3 max-h-40 overflow-auto">
                    <pre className="text-xs text-white/50 whitespace-pre-wrap font-mono">{historyMission.content}</pre>
                  </div>
                </details>

                {/* Bouton Relancer */}
                <button
                  onClick={() => {
                    setMissionTitle(historyMission.title + " (relance)");
                    setMissionContent(historyMission.content);
                    setMissionPriority(historyMission.priority);
                    setMissionDuration(historyMission.durationHours ?? 24);
                    setSelectedHistoryMission(null);
                    setMissionView("create");
                  }}
                  className="mt-3 w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-lg py-2 text-xs font-semibold transition-all"
                >
                  🔄 Relancer cette mission
                </button>
              </div>
            </div>
          ) : (
            // Liste des missions
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/60">{missionHistory.length} mission{missionHistory.length > 1 ? "s" : ""} au total</p>
                <div className="flex items-center gap-3 text-xs text-white/30">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Terminée</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/20 inline-block" />Expirée</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Annulée</span>
                </div>
              </div>

              {missionHistory.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-white/50 text-sm">Aucune mission dans l'historique</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {missionHistory.map(m => (
                    <button key={m.id} onClick={() => setSelectedHistoryMission(m.id)}
                      className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-3 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${m.status === "completed" ? "bg-emerald-400" : m.status === "active" ? "bg-amber-400 animate-pulse" : m.status === "cancelled" ? "bg-red-400" : "bg-white/20"}`} />
                            <span className="text-white text-sm font-semibold truncate">{m.title}</span>
                          </div>
                          <p className="text-xs text-white/40 ml-4">
                            {new Date(m.startsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                            {" · "}{m.durationHours ?? 24}h
                            {m.completedAt && ` · Clôturée ${new Date(m.completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          {m.successScore !== null && (
                            <span className={`text-sm font-black ${getScoreColor(m.successScore)}`}>{m.successScore}%</span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusConfig[m.status].bg} ${statusConfig[m.status].color}`}>
                            {statusConfig[m.status].label}
                          </span>
                          <span className="text-white/30 text-xs">→</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
