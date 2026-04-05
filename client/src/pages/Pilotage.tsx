/**
 * ─── Maison Baymora — Page Pilotage ──────────────────────────────────────────
 * Centre de contrôle exclusif du fondateur.
 * ARIA (DG IA) à gauche + Dashboard 6 onglets à droite.
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
import BackNav from "@/components/BackNav";
import { Shield } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  actionType?: string;
  panelType?: string | null;
  panelData?: any;
  timestamp?: Date;
}

export default function Pilotage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [ariaPanelOverride, setAriaPanelOverride] = useState<{ type: string; data: any } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: stats } = trpc.pilotage.stats.useQuery(undefined, { refetchInterval: 30000 });
  const { data: organigramme } = trpc.pilotage.organigramme.useQuery();
  const { data: strategie } = trpc.pilotage.strategie.useQuery();
  const { data: budget } = trpc.pilotage.budget.useQuery();
  const { data: carnets } = trpc.pilotage.carnetsDebord.useQuery();
  const { data: history } = trpc.pilotage.history.useQuery();
  const chatMutation = trpc.pilotage.chat.useMutation();
  const reportMutation = trpc.pilotage.dailyReport.useMutation();

  useEffect(() => {
    if (history && history.length > 0 && messages.length === 0) {
      setMessages(history.map((m) => ({ role: m.role, content: m.content, timestamp: new Date() })));
    } else if (!history && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `## 👋 Bonjour, je suis **ARIA**\n\nDirectrice Générale IA de Maison Baymora. Je supervise vos **7 équipes** et **17 agents**.\n\nJe suis ici pour :\n- 📊 Vous présenter les rapports et métriques\n- 📋 Donner des ordres aux équipes\n- 💡 Proposer des stratégies et améliorations\n- 🔴 Vous alerter en cas de problème\n- 💰 Gérer le budget et les objectifs\n\nQue souhaitez-vous faire aujourd'hui ?\n\n**— ARIA, DG Maison Baymora**`,
        timestamp: new Date(),
      }]);
    }
  }, [history]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg, timestamp: new Date() }]);
    setIsLoading(true);
    try {
      const result = await chatMutation.mutateAsync({ message: userMsg });
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: result.content,
        actionType: result.actionType,
        panelType: result.panelType,
        panelData: result.panelData,
        timestamp: new Date(),
      }]);
      // Basculer le panneau droit si ARIA a détecté une intention
      if (result.panelType) {
        const panelToTab: Record<string, string> = {
          teams: "teams",
          budget: "budget",
          strategy: "strategy",
          alerts: "overview",
          tasks: "tasks",
          report: "logbook",
          overview: "overview",
        };
        const tab = panelToTab[result.panelType];
        if (tab) setActiveTab(tab);
        setAriaPanelOverride({ type: result.panelType, data: result.panelData });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(`Erreur ARIA : ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const report = await reportMutation.mutateAsync();
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: report,
        actionType: "report",
        timestamp: new Date(),
      }]);
      toast.success("Rapport généré par ARIA");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
       toast.error(`Erreur : ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const actionBadge = (type?: string) => {
    const map: Record<string, { label: string; color: string }> = {
      report: { label: "Rapport", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
      alert: { label: "Alerte", color: "bg-red-500/20 text-red-300 border-red-500/30" },
      order_team: { label: "Ordre équipe", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
      modify_app: { label: "Ordre Dev", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
      analyze: { label: "Analyse", color: "bg-green-500/20 text-green-300 border-green-500/30" },
    };
    if (!type || !map[type]) return null;
    const { label, color } = map[type];
    return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${color}`}>{label}</span>;
  };

  const statsCards = [
    { label: "Membres total", value: stats?.totalUsers ?? "—", icon: "👥", color: "text-blue-400" },
    { label: "Abonnés Premium", value: stats?.premiumUsers ?? "—", icon: "⭐", color: "text-amber-400" },
    { label: "Fiches publiées", value: stats?.publishedCards ?? "—", icon: "📄", color: "text-green-400" },
    { label: "Établissements", value: stats?.totalEstablishments ?? "—", icon: "🏨", color: "text-purple-400" },
    { label: "Plans de voyage", value: stats?.totalTripPlans ?? "—", icon: "🗺️", color: "text-cyan-400" },
    { label: "CA estimé/mois", value: stats ? `${((stats.premiumUsers ?? 0) * 14.9).toFixed(0)}€` : "—", icon: "💰", color: "text-emerald-400" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <BackNav
        title="Centre de Pilotage — ARIA"
        icon={<Shield size={16} />}
        backHref="/admin"
        backLabel="Dashboard"
        breadcrumb={[
          { label: "Accueil", href: "/" },
          { label: "Dashboard", href: "/admin" },
          { label: "Pilotage ARIA" },
        ]}
      />

      {/* Corps principal */}
      <div className="flex flex-1" style={{ height: "calc(100vh - 73px)", overflow: "hidden" }}>
        {/* ─── Chat ARIA DG ─────────────────────────────────────────────── */}
        <div className="w-[420px] min-w-[380px] border-r border-white/10 flex flex-col bg-[#0d0d14]">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-amber-400">ARIA</span>
              <span className="text-xs text-white/40">Claude Opus · Exclusif</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 border-white/20 text-white/70 hover:text-white hover:border-amber-400/50 bg-transparent"
              onClick={generateReport}
              disabled={isLoading}
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
            {["📊 Rapport du jour", "🔴 Alertes actives", "📋 Ordres du jour", "💰 Budget", "👥 État équipes", "🎯 Priorités"].map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
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
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-3 self-end"
              >
                ↑
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Dashboard ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {ariaPanelOverride && (
            <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs">
              <span className="text-amber-400">📌 ARIA a mis à jour ce panneau</span>
              <button onClick={() => setAriaPanelOverride(null)} className="text-white/40 hover:text-white/70 ml-4">✕ Fermer</button>
            </div>
          )}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setAriaPanelOverride(null); }} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-white/10 bg-[#0d0d14] px-6 flex-shrink-0">
              <TabsList className="bg-transparent border-0 h-12 gap-1">
                {[
                  { value: "overview", label: "📊 Vue Générale" },
                  { value: "teams", label: "👥 Équipes" },
                  { value: "strategy", label: "🎯 Stratégie" },
                  { value: "budget", label: "💰 Budget" },
                  { value: "logbook", label: "📔 Carnet de Bord" },
                  { value: "tasks", label: "✅ Tâches" },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 data-[state=active]:border-amber-500/30 text-white/50 hover:text-white/80 border border-transparent rounded-lg px-3 h-8"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {/* Vue Générale */}
              <TabsContent value="overview" className="mt-0 space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-white mb-0.5">Tableau de bord</h2>
                  <p className="text-sm text-white/50">{new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
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

                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-red-400 mb-3">🔴 Actions urgentes</h3>
                  <div className="space-y-2">
                    {[
                      { label: "Stripe Checkout non configuré", priority: "critique", action: "Configurer Stripe" },
                      { label: "0 fiche établissement publiée", priority: "haute", action: "Lancer équipe SEO" },
                      { label: "Séquences email non activées", priority: "haute", action: "Activer Resend" },
                      { label: "Aucun partenaire affilié", priority: "moyenne", action: "Contacter Staycation" },
                    ].map((alert) => (
                      <div key={alert.label} className="flex items-center justify-between bg-red-500/5 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${alert.priority === "critique" ? "bg-red-500" : alert.priority === "haute" ? "bg-orange-500" : "bg-yellow-500"}`} />
                          <span className="text-sm text-white/80">{alert.label}</span>
                        </div>
                        <button onClick={() => { setInput(`ARIA, ${alert.action}`); setActiveTab("overview"); }} className="text-xs text-amber-400 hover:text-amber-300 underline flex-shrink-0 ml-2">{alert.action} →</button>
                      </div>
                    ))}
                  </div>
                </div>

                {carnets && carnets.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">📔 Dernier rapport ARIA</h3>
                    <div className="prose prose-invert prose-sm max-w-none text-white/70">
                      <ReactMarkdown>{carnets[0].content.slice(0, 500) + (carnets[0].content.length > 500 ? "..." : "")}</ReactMarkdown>
                    </div>
                    <button onClick={() => setActiveTab("logbook")} className="text-xs text-amber-400 hover:text-amber-300 mt-2">Voir tout le carnet →</button>
                  </div>
                )}
              </TabsContent>

              {/* Équipes */}
              <TabsContent value="teams" className="mt-0 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white mb-0.5">Organigramme Baymora</h2>
                  <p className="text-sm text-white/50">7 équipes · 17 agents · Sous la direction d'ARIA</p>
                </div>
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-xl font-bold text-black">A</div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-amber-400 text-lg">ARIA</span>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">Directrice Générale IA</Badge>
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">Claude Opus</Badge>
                      </div>
                      <p className="text-xs text-white/50 mt-0.5">Supervise toutes les équipes · Carnet de bord · Rapports · Budget · Stratégie</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {organigramme?.equipes.map((equipe) => (
                    <div key={equipe.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{equipe.emoji}</span>
                          <span className="font-semibold text-white text-sm">{equipe.nom}</span>
                        </div>
                        <Badge className="bg-white/10 text-white/60 text-xs">{equipe.effectif} agents</Badge>
                      </div>
                      <div className="space-y-1 mb-3">
                        {equipe.agents.map((agent) => (
                          <div key={agent.nom} className="text-xs text-white/60">
                            <span className="text-white/80 font-medium">{agent.nom}</span> — {agent.tache}
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-white/10 pt-2 mb-3">
                        <p className="text-xs text-amber-400 font-medium mb-1">Tâches urgentes :</p>
                        {equipe.tachesUrgentes.slice(0, 2).map((t) => (
                          <p key={t} className="text-xs text-white/50">→ {t}</p>
                        ))}
                      </div>
                      <button
                        onClick={() => { setInput(`ARIA, donne un ordre à l'équipe ${equipe.nom}`); }}
                        className="w-full text-xs py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all"
                      >
                        Donner un ordre →
                      </button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Stratégie */}
              <TabsContent value="strategy" className="mt-0 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white mb-0.5">Plan Stratégique 30/60/90 jours</h2>
                  <p className="text-sm text-white/50">Feuille de route vers la rentabilité</p>
                </div>
                {strategie && Object.entries(strategie).map(([key, phase]) => {
                  const phaseData = phase as { titre: string; objectif: string; budget: number; taches: string[]; kpi: string };
                  const styles: Record<string, { grad: string; text: string }> = {
                    phase1: { grad: "from-blue-500/20 to-blue-500/5 border-blue-500/30", text: "text-blue-400" },
                    phase2: { grad: "from-purple-500/20 to-purple-500/5 border-purple-500/30", text: "text-purple-400" },
                    phase3: { grad: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30", text: "text-emerald-400" },
                  };
                  const s = styles[key] || styles.phase1;
                  return (
                    <div key={key} className={`bg-gradient-to-r ${s.grad} border rounded-xl p-5`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`font-bold ${s.text}`}>{phaseData.titre}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-white/10 ${s.text}`}>Budget : {phaseData.budget.toLocaleString("fr-FR")}€</span>
                      </div>
                      <p className="text-sm text-white/70 mb-3">🎯 {phaseData.objectif}</p>
                      <div className="grid grid-cols-2 gap-1.5 mb-3">
                        {phaseData.taches.map((t: string) => (
                          <div key={t} className="text-xs text-white/60 flex items-start gap-1">
                            <span className="flex-shrink-0">{t.startsWith("✅") ? "✅" : t.startsWith("🔄") ? "🔄" : "○"}</span>
                            <span>{t.replace(/^[✅🔄○]\s*/, "")}</span>
                          </div>
                        ))}
                      </div>
                      <div className={`text-xs font-semibold ${s.text} bg-white/5 rounded-lg px-3 py-2`}>KPI cible : {phaseData.kpi}</div>
                    </div>
                  );
                })}
              </TabsContent>

              {/* Budget */}
              <TabsContent value="budget" className="mt-0 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white mb-0.5">Budget & Rentabilité</h2>
                  <p className="text-sm text-white/50">Suivi des revenus et dépenses mensuels</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-emerald-400 mb-2">💡 Seuil de rentabilité</h3>
                  <p className="text-2xl font-bold text-white">15 abonnés Premium</p>
                  <p className="text-sm text-white/50 mt-1">15 × 14.90€ = 223.50€ &gt; 222€ dépenses fixes</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                      <span>Actuellement : {stats?.premiumUsers ?? 0} abonnés</span>
                      <span>Objectif : 15</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(((stats?.premiumUsers ?? 0) / 15) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
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
                <div className={`border rounded-xl p-4 ${(stats?.premiumUsers ?? 0) >= 15 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Marge mensuelle estimée</span>
                    <span className={`text-2xl font-bold ${(stats?.premiumUsers ?? 0) >= 15 ? "text-emerald-400" : "text-red-400"}`}>
                      {stats ? `${(((stats.premiumUsers ?? 0) * 14.9) - 222).toFixed(2)}€` : "-222€"}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    {(stats?.premiumUsers ?? 0) >= 15 ? "✅ Rentable" : `🔴 Il manque ${15 - (stats?.premiumUsers ?? 0)} abonnés Premium pour atteindre la rentabilité`}
                  </p>
                </div>
              </TabsContent>

              {/* Carnet de Bord */}
              <TabsContent value="logbook" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-0.5">Carnet de Bord ARIA</h2>
                    <p className="text-sm text-white/50">Rapports datés et alertes archivés</p>
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
                  </div>
                )}
              </TabsContent>

              {/* Tâches */}
              <TabsContent value="tasks" className="mt-0 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white mb-0.5">Tâches & Priorités par équipe</h2>
                  <p className="text-sm text-white/50">Cliquez sur "Ordonner" pour donner l'instruction via ARIA</p>
                </div>
                {organigramme?.equipes.map((equipe) => (
                  <div key={equipe.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{equipe.emoji}</span>
                      <span className="font-semibold text-white text-sm">{equipe.nom}</span>
                      <Badge className="bg-white/10 text-white/50 text-xs ml-auto">{equipe.tachesUrgentes.length} tâches</Badge>
                    </div>
                    <div className="space-y-2">
                      {equipe.tachesUrgentes.map((t) => (
                        <div key={t} className="flex items-center gap-2 text-xs">
                          <span className="w-4 h-4 rounded border border-white/20 flex items-center justify-center text-white/30 flex-shrink-0">○</span>
                          <span className="text-white/70 flex-1">{t}</span>
                          <button
                            onClick={() => setInput(`ARIA, donne l'ordre à ${equipe.nom} : ${t}`)}
                            className="text-amber-400/60 hover:text-amber-400 text-xs underline flex-shrink-0"
                          >
                            Ordonner →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
