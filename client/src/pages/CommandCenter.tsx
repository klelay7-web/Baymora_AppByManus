import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect } from "react";
import {
  BrainCircuit, Users, Send, Loader2, Sparkles, ArrowLeft,
  MessageCircle, CheckCircle2, Clock, AlertCircle, ChevronRight,
  Cpu, Zap, Target, TrendingUp, Euro, BarChart3, Plus,
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import BackNav from "@/components/BackNav";
import { Streamdown } from "streamdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Types ────────────────────────────────────────────────────────
interface TeamMember {
  id: number;
  name: string;
  role: string;
  avatar?: string;
  status: "online" | "busy" | "offline";
  currentTask?: string;
  completedToday?: number;
}

interface Directive {
  id: string;
  from: "owner" | "ai";
  to: string;
  content: string;
  status: "pending" | "in_progress" | "done";
  createdAt: Date;
  priority: "low" | "medium" | "high" | "urgent";
}

interface BrigadeMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

// ─── Mock Team Data (à remplacer par tRPC) ────────────────────────
const MOCK_TEAM: TeamMember[] = [
  { id: 1, name: "Sophie M.", role: "Concierge Senior", status: "online", currentTask: "Réservation yacht Saint-Tropez", completedToday: 7 },
  { id: 2, name: "Lucas B.", role: "Scout Terrain", status: "busy", currentTask: "Visite Hôtel Particulier Paris 8e", completedToday: 4 },
  { id: 3, name: "Emma R.", role: "Conciergerie Digitale", status: "online", currentTask: "Suivi client VIP #247", completedToday: 12 },
  { id: 4, name: "Théo K.", role: "Logistique & Transport", status: "offline", currentTask: undefined, completedToday: 3 },
  { id: 5, name: "Jade L.", role: "Relations Partenaires", status: "online", currentTask: "Négociation Maison Baccarat", completedToday: 5 },
];

// ─── Status Badge ─────────────────────────────────────────────────
function StatusDot({ status }: { status: TeamMember["status"] }) {
  return (
    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
      status === "online" ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" :
      status === "busy" ? "bg-amber-400 shadow-[0_0_6px_#fbbf24]" :
      "bg-white/20"
    }`} />
  );
}

// ─── Team Member Card ─────────────────────────────────────────────
function TeamCard({ member, onSendDirective }: { member: TeamMember; onSendDirective: (name: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border border-white/10 bg-white/3 hover:border-[#c8a94a]/20 transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c8a94a]/20 to-[#c8a94a]/5 flex items-center justify-center shrink-0 border border-[#c8a94a]/20">
          <span className="text-sm font-semibold text-[#c8a94a]">
            {member.name.split(" ").map(n => n[0]).join("")}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{member.name}</p>
            <StatusDot status={member.status} />
          </div>
          <p className="text-[10px] text-muted-foreground">{member.role}</p>

          {member.currentTask && (
            <div className="mt-2 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#c8a94a]/60 animate-pulse shrink-0" />
              <p className="text-[10px] text-white/60 truncate">{member.currentTask}</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1">
              <CheckCircle2 size={10} className="text-emerald-400" />
              <span className="text-[10px] text-muted-foreground">{member.completedToday || 0} tâches aujourd'hui</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSendDirective(member.name)}
              className="h-6 px-2 text-[10px] text-[#c8a94a]/70 hover:text-[#c8a94a] hover:bg-[#c8a94a]/5"
            >
              <Send size={9} className="mr-1" /> Directive
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Directive Item ───────────────────────────────────────────────
function DirectiveItem({ directive }: { directive: Directive }) {
  const priorityColor = {
    low: "border-white/20 text-white/40",
    medium: "border-blue-500/30 text-blue-400",
    high: "border-amber-500/30 text-amber-400",
    urgent: "border-red-500/30 text-red-400",
  }[directive.priority];

  const statusIcon = {
    pending: <Clock size={12} className="text-white/40" />,
    in_progress: <Loader2 size={12} className="text-[#c8a94a] animate-spin" />,
    done: <CheckCircle2 size={12} className="text-emerald-400" />,
  }[directive.status];

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-white/8 bg-white/2 hover:bg-white/4 transition-all">
      <div className="mt-0.5">{statusIcon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-muted-foreground">
            {directive.from === "owner" ? "👤 Vous" : "🤖 IA"} → {directive.to}
          </span>
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${priorityColor}`}>
            {directive.priority}
          </Badge>
        </div>
        <p className="text-xs text-white/80">{directive.content}</p>
        <p className="text-[9px] text-muted-foreground/50 mt-1">
          {directive.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

// ─── Profitability Panel ──────────────────────────────────────────
function ProfitabilityPanel() {
  const { data: revenueStats } = trpc.admin.getRevenueStats.useQuery();

  const forfaits = [
    { name: "Essentiel", price: 90, cost: 22, clients: 12, color: "bg-blue-500/20 border-blue-500/30" },
    { name: "Premium", price: 190, cost: 45, clients: 8, color: "bg-[#c8a94a]/20 border-[#c8a94a]/30" },
    { name: "Elite", price: 490, cost: 95, clients: 4, color: "bg-purple-500/20 border-purple-500/30" },
    { name: "Platinum", price: 990, cost: 180, clients: 2, color: "bg-emerald-500/20 border-emerald-500/30" },
  ];

  const totalRevenue = forfaits.reduce((sum, f) => sum + f.price * f.clients, 0);
  const totalCost = forfaits.reduce((sum, f) => sum + f.cost * f.clients, 0);
  const totalMargin = totalRevenue - totalCost;
  const marginPct = Math.round((totalMargin / totalRevenue) * 100);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "CA Mensuel", value: `${totalRevenue.toLocaleString("fr-FR")} €`, icon: Euro, color: "text-[#c8a94a]" },
          { label: "Marge Nette", value: `${totalMargin.toLocaleString("fr-FR")} €`, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Marge %", value: `${marginPct}%`, icon: BarChart3, color: "text-blue-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="p-3 rounded-xl border border-white/10 bg-white/3 text-center">
            <kpi.icon size={16} className={`${kpi.color} mx-auto mb-1`} />
            <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Forfaits détail */}
      <div className="space-y-2">
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Rentabilité par forfait</p>
        {forfaits.map((f) => {
          const revenue = f.price * f.clients;
          const cost = f.cost * f.clients;
          const margin = revenue - cost;
          const marginPct = Math.round((margin / revenue) * 100);
          return (
            <div key={f.name} className={`p-3 rounded-xl border ${f.color} bg-white/2`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold">{f.name}</p>
                  <p className="text-[10px] text-muted-foreground">{f.clients} clients · {f.price}€/mois</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">+{margin.toLocaleString("fr-FR")} €</p>
                  <p className="text-[10px] text-muted-foreground">marge {marginPct}%</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400/60 rounded-full"
                  style={{ width: `${marginPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-muted-foreground">Coût: {cost.toLocaleString("fr-FR")} €</span>
                <span className="text-[9px] text-muted-foreground">CA: {revenue.toLocaleString("fr-FR")} €</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function CommandCenter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("equipe");
  const [messages, setMessages] = useState<BrigadeMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [directives, setDirectives] = useState<Directive[]>([
    {
      id: "1", from: "owner", to: "Sophie M.", content: "Préparer le dossier yacht pour le client Moreau — départ vendredi 18h",
      status: "in_progress", createdAt: new Date(Date.now() - 3600000), priority: "high",
    },
    {
      id: "2", from: "ai", to: "Lucas B.", content: "Vérifier disponibilité suite prestige Hôtel Costes pour le 12 mai",
      status: "pending", createdAt: new Date(Date.now() - 1800000), priority: "medium",
    },
    {
      id: "3", from: "owner", to: "Emma R.", content: "Appeler Mme Dupont pour confirmer réservation Arpège",
      status: "done", createdAt: new Date(Date.now() - 7200000), priority: "urgent",
    },
  ]);
  const [directiveTarget, setDirectiveTarget] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: (data: any) => {
      const content = data.cleanMessage || data.message || "";
      setMessages(prev => [...prev, { role: "assistant", content, createdAt: new Date() }]);
      setIsTyping(false);
    },
    onError: () => setIsTyping(false),
  });

  const createConversation = trpc.chat.createConversation.useMutation();
  const [convId, setConvId] = useState<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const text = input.trim();
    setInput("");

    setMessages(prev => [...prev, { role: "user", content: text, createdAt: new Date() }]);
    setIsTyping(true);

    let id = convId;
    if (!id) {
      const result = await createConversation.mutateAsync({ title: "Salle de Réunion" });
      id = result.id;
      setConvId(id);
    }

    sendMessage.mutate({ conversationId: id, content: text });
  };

  const handleSendDirective = (memberName: string) => {
    setDirectiveTarget(memberName);
    setActiveTab("directives");
  };

  const handleAddDirective = (content: string, target: string) => {
    const newDirective: Directive = {
      id: Date.now().toString(),
      from: "owner",
      to: target,
      content,
      status: "pending",
      createdAt: new Date(),
      priority: "medium",
    };
    setDirectives(prev => [newDirective, ...prev]);
  };

  const handleAIDirective = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");

    // L'IA traduit l'instruction en directives pour l'équipe
    setIsTyping(true);
    setMessages(prev => [...prev, {
      role: "user",
      content: `[Instruction pour l'équipe] ${text}`,
      createdAt: new Date(),
    }]);

    let id = convId;
    if (!id) {
      const result = await createConversation.mutateAsync({ title: "Directives IA" });
      id = result.id;
      setConvId(id);
    }

    sendMessage.mutate({
      conversationId: id,
      content: `Tu es le coordinateur IA de Maison Baymora. L'owner te donne une instruction : "${text}". Traduis-la en directives précises pour chaque membre de l'équipe concerné (Sophie M. - Concierge Senior, Lucas B. - Scout Terrain, Emma R. - Conciergerie Digitale, Théo K. - Logistique, Jade L. - Relations Partenaires). Sois concis et actionnable.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <BackNav
        title="Salle de Réunion"
        icon={<BrainCircuit size={16} />}
        backHref="/admin"
        backLabel="Dashboard"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Salle de Réunion" },
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Status bar */}
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-emerald-400 font-medium">
              {MOCK_TEAM.filter(m => m.status === "online").length} en ligne
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Left: Tabs ─── */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white/5 w-full">
                <TabsTrigger value="equipe" className="flex-1 text-xs">
                  <Users size={12} className="mr-1.5" /> Mon Équipe
                </TabsTrigger>
                <TabsTrigger value="directives" className="flex-1 text-xs">
                  <Target size={12} className="mr-1.5" /> Directives
                </TabsTrigger>
                <TabsTrigger value="rentabilite" className="flex-1 text-xs">
                  <Euro size={12} className="mr-1.5" /> Rentabilité
                </TabsTrigger>
              </TabsList>

              {/* Équipe */}
              <TabsContent value="equipe" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {MOCK_TEAM.map(member => (
                    <TeamCard key={member.id} member={member} onSendDirective={handleSendDirective} />
                  ))}
                </div>
              </TabsContent>

              {/* Directives */}
              <TabsContent value="directives" className="mt-4">
                <div className="space-y-4">
                  {/* Formulaire directive manuelle */}
                  <div className="p-4 rounded-xl border border-white/10 bg-white/3">
                    <p className="text-xs font-semibold mb-3">📋 Nouvelle directive manuelle</p>
                    <div className="space-y-2">
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c8a94a]/50"
                        value={directiveTarget || ""}
                        onChange={e => setDirectiveTarget(e.target.value)}
                      >
                        <option value="">Choisir un membre...</option>
                        {MOCK_TEAM.map(m => (
                          <option key={m.id} value={m.name}>{m.name} — {m.role}</option>
                        ))}
                        <option value="Toute l'équipe">📢 Toute l'équipe</option>
                      </select>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Votre instruction..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c8a94a]/50"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && directiveTarget && e.currentTarget.value) {
                              handleAddDirective(e.currentTarget.value, directiveTarget);
                              e.currentTarget.value = "";
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] rounded-lg"
                          onClick={(e) => {
                            const input = (e.currentTarget.previousSibling as HTMLInputElement);
                            if (directiveTarget && input.value) {
                              handleAddDirective(input.value, directiveTarget);
                              input.value = "";
                            }
                          }}
                        >
                          <Send size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Liste directives */}
                  <ScrollArea className="h-80">
                    <div className="space-y-2">
                      {directives.map(d => (
                        <DirectiveItem key={d.id} directive={d} />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Rentabilité */}
              <TabsContent value="rentabilite" className="mt-4">
                <ScrollArea className="h-[500px] pr-2">
                  <ProfitabilityPanel />
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* ─── Right: IA Chat ─── */}
          <div className="flex flex-col rounded-xl border border-white/10 bg-white/2 overflow-hidden" style={{ height: "600px" }}>
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 shrink-0">
              <Cpu size={14} className="text-[#c8a94a]" />
              <div>
                <p className="text-xs font-semibold">IA Coordinatrice</p>
                <p className="text-[9px] text-muted-foreground">Claude Opus · Directives automatiques</p>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-3 py-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles size={24} className="text-[#c8a94a]/30 mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground">
                    Donnez une instruction à l'IA — elle la traduit en directives pour votre équipe.
                  </p>
                  <div className="flex flex-col gap-2 mt-4">
                    {[
                      "📊 Résumé de la journée",
                      "🎯 Prioriser les tâches urgentes",
                      "📞 Qui rappeler aujourd'hui ?",
                    ].map(s => (
                      <button
                        key={s}
                        onClick={() => { setInput(s); }}
                        className="text-[11px] px-3 py-2 rounded-lg border border-white/10 hover:border-[#c8a94a]/30 hover:bg-white/5 transition-all text-white/60 hover:text-white text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                        msg.role === "user"
                          ? "bg-[#c8a94a] text-[#080c14]"
                          : "bg-white/5 border border-white/10"
                      }`}>
                        {msg.role === "assistant" ? (
                          <div className="prose prose-invert prose-xs max-w-none">
                            <Streamdown>{msg.content}</Streamdown>
                          </div>
                        ) : msg.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                      <div className="flex gap-1">
                        {[0, 150, 300].map(d => (
                          <div key={d} className="w-1.5 h-1.5 rounded-full bg-[#c8a94a]/60 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-white/10 p-3 shrink-0">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="Instruction pour l'IA..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#c8a94a]/50 placeholder:text-muted-foreground/50"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  size="icon"
                  className="bg-[#c8a94a] text-[#080c14] hover:bg-[#d4b85a] h-8 w-8 rounded-lg shrink-0"
                >
                  {isTyping ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                </Button>
              </div>
              <div className="flex gap-1 mt-2">
                <button
                  onClick={handleAIDirective}
                  className="flex-1 text-[9px] px-2 py-1.5 rounded-lg border border-[#c8a94a]/20 text-[#c8a94a]/70 hover:bg-[#c8a94a]/5 transition-all"
                >
                  <Zap size={9} className="inline mr-1" /> IA → Directives équipe
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 text-[9px] px-2 py-1.5 rounded-lg border border-white/10 text-white/50 hover:bg-white/5 transition-all"
                >
                  <MessageCircle size={9} className="inline mr-1" /> Mode manuel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
