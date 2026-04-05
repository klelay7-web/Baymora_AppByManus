import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain, Search, Megaphone, HeadphonesIcon, BarChart3,
  Send, AlertTriangle, CheckCircle2, Clock, ChevronRight,
  Zap, Target, FileText, Plus, Filter
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const DEPARTMENTS = [
  { id: "all" as const, label: "Tous", icon: Brain, color: "text-primary" },
  { id: "seo" as const, label: "SEO", icon: Search, color: "text-blue-400" },
  { id: "content" as const, label: "Contenu", icon: FileText, color: "text-purple-400" },
  { id: "acquisition" as const, label: "Acquisition", icon: Megaphone, color: "text-green-400" },
  { id: "concierge" as const, label: "Concierge", icon: HeadphonesIcon, color: "text-primary" },
  { id: "analytics" as const, label: "Analytics", icon: BarChart3, color: "text-cyan-400" },
];

type DepartmentId = typeof DEPARTMENTS[number]["id"];

export default function AdminCommandCenter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("reunion");
  const [selectedDept, setSelectedDept] = useState<DepartmentId>("all");

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary text-sm tracking-widest uppercase mb-1">Centre de Commande</p>
              <h1 className="text-3xl font-serif text-foreground">Salle de Réunion IA</h1>
            </div>
            <div className="flex items-center gap-2">
              {DEPARTMENTS.filter(d => d.id !== "all").map(dept => (
                <DeptStatusBadge key={dept.id} dept={dept} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50 mb-6">
            <TabsTrigger value="reunion">Salle de Réunion</TabsTrigger>
            <TabsTrigger value="directives">Directives</TabsTrigger>
            <TabsTrigger value="reports">Rapports</TabsTrigger>
          </TabsList>

          <TabsContent value="reunion">
            <MeetingRoom selectedDept={selectedDept} setSelectedDept={setSelectedDept} />
          </TabsContent>
          <TabsContent value="directives">
            <DirectivesPanel />
          </TabsContent>
          <TabsContent value="reports">
            <ReportsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function DeptStatusBadge({ dept }: { dept: typeof DEPARTMENTS[number] }) {
  return (
    <div className="flex items-center gap-1.5 bg-card/30 border border-border/30 rounded-full px-3 py-1">
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <dept.icon className={`w-3 h-3 ${dept.color}`} />
      <span className="text-xs text-muted-foreground">{dept.label}</span>
    </div>
  );
}

function MeetingRoom({ selectedDept, setSelectedDept }: { selectedDept: DepartmentId; setSelectedDept: (d: DepartmentId) => void }) {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "ai"; dept: string; text: string; time: string }>>([
    { role: "ai", dept: "all", text: "Bonjour Directeur. Tous les départements sont opérationnels. L'équipe SEO a publié 12 fiches cette nuit. Le département Contenu prépare 8 publications pour demain. L'Acquisition a identifié 3 nouveaux segments à cibler. Que souhaitez-vous examiner ?", time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const createDirective = trpc.aiCommand.createDirective.useMutation({
    onSuccess: () => toast.success("Directive envoyée à l'équipe IA"),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatHistory]);

  const sendMessage = () => {
    if (!message.trim()) return;
    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    setChatHistory(prev => [...prev, { role: "user", dept: selectedDept, text: message, time: now }]);

    // Create directive from message
    createDirective.mutate({
      department: selectedDept,
      directive: message,
      priority: "normal",
    });

    // Simulate AI response
    setTimeout(() => {
      const deptLabel = DEPARTMENTS.find(d => d.id === selectedDept)?.label || "Tous";
      setChatHistory(prev => [...prev, {
        role: "ai",
        dept: selectedDept,
        text: `Bien reçu, Directeur. Directive transmise au département ${deptLabel}. L'équipe va traiter votre demande et vous rendra compte des résultats dans le prochain rapport.`,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      }]);
    }, 1500);

    setMessage("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Department Selector */}
      <div className="lg:col-span-1 space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Départements</h3>
        {DEPARTMENTS.map(dept => (
          <button
            key={dept.id}
            onClick={() => setSelectedDept(dept.id)}
            className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 transition-all text-left ${
              selectedDept === dept.id
                ? "bg-primary/10 border border-primary/30 text-primary"
                : "bg-card/20 border border-border/20 text-foreground hover:border-border/50"
            }`}
          >
            <dept.icon className={`w-5 h-5 ${dept.color}`} />
            <div>
              <p className="text-sm font-medium">{dept.label}</p>
              <p className="text-xs text-muted-foreground">
                {dept.id === "all" ? "Vue globale" :
                 dept.id === "seo" ? "Fiches & Référencement" :
                 dept.id === "content" ? "Création & Publication" :
                 dept.id === "acquisition" ? "Croissance & Leads" :
                 dept.id === "concierge" ? "Service Client IA" :
                 "Données & Insights"}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-3 bg-card/20 border border-border/30 rounded-lg flex flex-col" style={{ height: "600px" }}>
        {/* Chat Header */}
        <div className="border-b border-border/30 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-sm font-medium text-foreground">
              {DEPARTMENTS.find(d => d.id === selectedDept)?.label || "Tous les départements"}
            </span>
            <span className="text-xs text-muted-foreground">— En ligne</span>
          </div>
          <span className="text-xs text-muted-foreground">24/7 Autonome</span>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {chatHistory.filter(m => selectedDept === "all" || m.dept === "all" || m.dept === selectedDept).map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary/20 border border-primary/30"
                  : "bg-card/50 border border-border/30"
              }`}>
                {msg.role === "ai" && (
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-3 h-3 text-primary" />
                    <span className="text-xs text-primary font-medium">IA Baymora</span>
                  </div>
                )}
                <p className="text-sm text-foreground">{msg.text}</p>
                <p className="text-xs text-muted-foreground mt-1">{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-border/30 p-4">
          <div className="flex gap-3">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Donner une directive à ${DEPARTMENTS.find(d => d.id === selectedDept)?.label || "tous les départements"}...`}
              className="bg-background border-border/50 resize-none min-h-[44px] max-h-[120px]"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            />
            <Button
              onClick={sendMessage}
              disabled={!message.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DirectivesPanel() {
  const { data: directives, isLoading } = trpc.aiCommand.directives.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [newDirective, setNewDirective] = useState({ department: "all" as DepartmentId, directive: "", priority: "normal" as const });
  const createMutation = trpc.aiCommand.createDirective.useMutation({
    onSuccess: () => { toast.success("Directive créée"); setShowForm(false); setNewDirective({ department: "all", directive: "", priority: "normal" }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-serif text-foreground">Directives Actives</h2>
        <Button onClick={() => setShowForm(!showForm)} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 gap-2">
          <Plus className="w-4 h-4" /> Nouvelle directive
        </Button>
      </div>

      {showForm && (
        <div className="bg-card/30 border border-primary/30 rounded-lg p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <select
              value={newDirective.department}
              onChange={(e) => setNewDirective(prev => ({ ...prev, department: e.target.value as DepartmentId }))}
              className="bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground"
            >
              {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
            <select
              value={newDirective.priority}
              onChange={(e) => setNewDirective(prev => ({ ...prev, priority: e.target.value as any }))}
              className="bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground"
            >
              <option value="low">Basse</option>
              <option value="normal">Normale</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          <Textarea
            value={newDirective.directive}
            onChange={(e) => setNewDirective(prev => ({ ...prev, directive: e.target.value }))}
            placeholder="Décrivez votre directive..."
            className="bg-background border-border/50"
          />
          <Button
            onClick={() => createMutation.mutate(newDirective)}
            disabled={!newDirective.directive.trim() || createMutation.isPending}
            className="bg-primary text-primary-foreground"
          >
            {createMutation.isPending ? "Envoi..." : "Envoyer la directive"}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-muted-foreground text-sm animate-pulse">Chargement...</div>
      ) : !directives || directives.length === 0 ? (
        <div className="text-center py-8 bg-card/20 rounded-lg border border-border/30">
          <Target className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucune directive active</p>
        </div>
      ) : (
        <div className="space-y-3">
          {directives.map((dir: any) => (
            <div key={dir.id} className="bg-card/30 border border-border/30 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      dir.priority === "urgent" ? "bg-red-500/10 text-red-400" :
                      dir.priority === "high" ? "bg-orange-500/10 text-orange-400" :
                      dir.priority === "normal" ? "bg-blue-500/10 text-blue-400" :
                      "bg-gray-500/10 text-gray-400"
                    }`}>
                      {dir.priority}
                    </span>
                    <span className="text-xs text-primary">{dir.department}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(dir.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{dir.directive}</p>
                  {dir.aiResponse && (
                    <div className="mt-2 bg-primary/5 rounded px-3 py-2">
                      <p className="text-xs text-primary mb-1">Réponse IA :</p>
                      <p className="text-sm text-muted-foreground">{dir.aiResponse}</p>
                    </div>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded shrink-0 ml-3 ${
                  dir.status === "completed" ? "bg-green-500/10 text-green-400" :
                  dir.status === "active" ? "bg-primary/10 text-primary" :
                  "bg-gray-500/10 text-gray-400"
                }`}>
                  {dir.status === "active" ? "En cours" : dir.status === "completed" ? "Terminé" : dir.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportsPanel() {
  const { data: reports, isLoading } = trpc.aiCommand.reports.useQuery();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-serif text-foreground">Rapports des Départements</h2>

      {isLoading ? (
        <div className="text-muted-foreground text-sm animate-pulse">Chargement...</div>
      ) : !reports || reports.length === 0 ? (
        <div className="text-center py-8 bg-card/20 rounded-lg border border-border/30">
          <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun rapport disponible</p>
          <p className="text-sm text-muted-foreground mt-1">Les rapports seront générés automatiquement par les équipes IA</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report: any) => {
            const dept = DEPARTMENTS.find(d => d.id === report.department);
            return (
              <div key={report.id} className="bg-card/30 border border-border/30 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {dept && <dept.icon className={`w-5 h-5 ${dept.color}`} />}
                    <div>
                      <p className="font-medium text-foreground">{dept?.label || report.department}</p>
                      <p className="text-xs text-muted-foreground">{report.reportDate}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                    report.status === "healthy" ? "bg-green-500/10 text-green-400" :
                    report.status === "attention" ? "bg-orange-500/10 text-orange-400" :
                    "bg-red-500/10 text-red-400"
                  }`}>
                    {report.status === "healthy" ? <CheckCircle2 className="w-3 h-3" /> :
                     report.status === "attention" ? <Clock className="w-3 h-3" /> :
                     <AlertTriangle className="w-3 h-3" />}
                    {report.status === "healthy" ? "Sain" : report.status === "attention" ? "Attention" : "Critique"}
                  </span>
                </div>
                <p className="text-sm text-foreground">{report.summary}</p>
                {report.metrics && (
                  <div className="mt-3 bg-card/30 rounded px-3 py-2">
                    <p className="text-xs text-muted-foreground">{report.metrics}</p>
                  </div>
                )}
                {report.alerts && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-orange-400">
                    <AlertTriangle className="w-3 h-3" />
                    {report.alerts}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
