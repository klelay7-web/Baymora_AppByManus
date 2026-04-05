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
import { Shield, ExternalLink, Users, ChevronRight } from "lucide-react";
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
      <div className="border-b border-white/10 bg-[#0d0d14] px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="text-white/40 hover:text-white/70 transition-colors flex items-center gap-1 text-sm">
              ← Accueil
            </button>
          </Link>
          <span className="text-white/20">/</span>
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-amber-400" />
            <span className="text-amber-400 font-semibold text-sm uppercase tracking-wider">Pilotage</span>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">Accès exclusif</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          ARIA active · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      {/* ─── Corps principal ─────────────────────────────────────────────── */}
      <div className="flex flex-1" style={{ height: "calc(100vh - 57px)", overflow: "hidden" }}>

        {/* ─── Chat ARIA (gauche) ───────────────────────────────────────── */}
        <div className="w-[400px] min-w-[360px] border-r border-white/10 flex flex-col bg-[#0d0d14]">
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
                  <div className="max-w-[92%]">
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
                        <div className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
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

        {/* ─── Panneau droit (5 onglets) ────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {ariaPanelOverride && (
            <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs flex-shrink-0">
              <span className="text-amber-400">📌 ARIA a mis à jour ce panneau</span>
              <button onClick={() => setAriaPanelOverride(null)} className="text-white/40 hover:text-white/70 ml-4">✕</button>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setAriaPanelOverride(null); }} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-white/10 bg-[#0d0d14] px-4 flex-shrink-0">
              <TabsList className="bg-transparent border-0 h-12 gap-1">
                {[
                  { value: "dashboard", label: "📊 Dashboard" },
                  { value: "salle",     label: "🧠 Salle de Réunion" },
                  { value: "terrain",   label: "📍 Terrain" },
                  { value: "carnet",    label: "📔 Carnet de Bord" },
                  { value: "acces",     label: "🔑 Accès" },
                ].map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}
                    className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 data-[state=active]:border-amber-500/30 text-white/50 hover:text-white/80 border border-transparent rounded-lg px-3 h-8"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto p-6">

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

                <div className="grid grid-cols-3 gap-4">
                  {statsCards.map((card) => (
                    <div key={card.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
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
                          <span className="text-sm text-white/80">{alert.label}</span>
                        </div>
                        <button onClick={() => { setInput(`ARIA, ${alert.action}`); }} className="text-xs text-amber-400 hover:text-amber-300 underline flex-shrink-0 ml-2">{alert.action} →</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Budget résumé */}
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-400">{stats?.totalEstablishments ?? 0}</p>
                    <p className="text-xs text-white/50 mt-1">Établissements créés</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{stats?.publishedCards ?? 0}</p>
                    <p className="text-xs text-white/50 mt-1">Fiches publiées</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-amber-400">0</p>
                    <p className="text-xs text-white/50 mt-1">Sessions LÉNA actives</p>
                  </div>
                </div>

                {/* Membres terrain */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Users size={14} />
                    Membres avec accès Terrain
                  </h3>
                  {allUsers?.filter((u) => u.role === "team").length === 0 ? (
                    <p className="text-xs text-white/40">Aucun membre terrain pour l'instant. Ajoutez-en dans l'onglet Accès.</p>
                  ) : (
                    <div className="space-y-2">
                      {allUsers?.filter((u) => u.role === "team").map((u) => (
                        <div key={u.id} className="flex items-center justify-between text-xs">
                          <span className="text-white/70">{u.name || u.email}</span>
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">Terrain</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setActiveTab("acces")} className="text-xs text-amber-400 hover:text-amber-300 mt-3 underline">
                    Gérer les accès →
                  </button>
                </div>
              </TabsContent>

              {/* ── CARNET DE BORD ────────────────────────────────────── */}
              <TabsContent value="carnet" className="mt-0 space-y-4">
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

              {/* ── ACCÈS ─────────────────────────────────────────────── */}
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
                        <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white/70">
                              {(u.name || u.email || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm text-white/80 font-medium">{u.name || "Sans nom"}</p>
                              <p className="text-xs text-white/40">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={u.role}
                              onChange={(e) => updateRole(u.id, e.target.value)}
                              className="text-xs bg-white/10 border border-white/20 text-white rounded-lg px-2 py-1 focus:border-amber-400/50 focus:outline-none"
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
