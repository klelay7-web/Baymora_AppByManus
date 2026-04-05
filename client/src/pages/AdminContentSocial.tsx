import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar, Instagram, Youtube, Linkedin, Twitter, Plus,
  Image, Video, FileText, Sparkles, Send, Eye, Clock, CheckCircle2,
  Pen, Globe
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-400" },
  { id: "tiktok", label: "TikTok", icon: Video, color: "text-cyan-400" },
  { id: "youtube", label: "YouTube", icon: Youtube, color: "text-red-400" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-400" },
  { id: "twitter", label: "Twitter/X", icon: Twitter, color: "text-gray-300" },
  { id: "blog", label: "Blog", icon: Globe, color: "text-green-400" },
];

const CONTENT_TYPES = [
  { value: "instagram_post", label: "Post Instagram" },
  { value: "instagram_reel", label: "Reel Instagram" },
  { value: "tiktok_video", label: "Vidéo TikTok" },
  { value: "youtube_video", label: "Vidéo YouTube" },
  { value: "linkedin_post", label: "Post LinkedIn" },
  { value: "twitter_post", label: "Tweet/Post X" },
  { value: "blog_article", label: "Article Blog" },
];

export default function AdminContentSocial() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("calendar");

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
              <p className="text-primary text-sm tracking-widest uppercase mb-1">Administration</p>
              <h1 className="text-3xl font-serif text-foreground">Contenu & Social Media</h1>
            </div>
            <div className="flex items-center gap-2">
              {PLATFORMS.map(p => (
                <div key={p.id} className="w-8 h-8 rounded-full bg-card/30 border border-border/30 flex items-center justify-center" title={p.label}>
                  <p.icon className={`w-4 h-4 ${p.color}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50 mb-6">
            <TabsTrigger value="calendar">Calendrier</TabsTrigger>
            <TabsTrigger value="create">Créer du contenu</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <CalendarPanel />
          </TabsContent>
          <TabsContent value="create">
            <CreateContentPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CalendarPanel() {
  const { data: items, isLoading } = trpc.content.calendar.useQuery();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = items?.filter((item: any) =>
    filterStatus === "all" || item.status === filterStatus
  );

  const statusCounts = {
    all: items?.length || 0,
    idea: items?.filter((i: any) => i.status === "idea").length || 0,
    review: items?.filter((i: any) => i.status === "review").length || 0,
    scheduled: items?.filter((i: any) => i.status === "scheduled").length || 0,
    published: items?.filter((i: any) => i.status === "published").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Status Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: "all", label: "Tout", count: statusCounts.all },
          { key: "idea", label: "Idées", count: statusCounts.idea },
          { key: "review", label: "En revue", count: statusCounts.review },
          { key: "scheduled", label: "Planifié", count: statusCounts.scheduled },
          { key: "published", label: "Publié", count: statusCounts.published },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
              filterStatus === f.key
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-card/30 text-muted-foreground border border-border/30 hover:border-border/50"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm animate-pulse">Chargement du calendrier...</div>
      ) : !filtered || filtered.length === 0 ? (
        <div className="text-center py-12 bg-card/20 rounded-lg border border-border/30">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun contenu planifié</p>
          <p className="text-sm text-muted-foreground mt-1">Créez du contenu ou laissez l'IA générer automatiquement</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item: any) => {
            const platform = PLATFORMS.find(p => p.id === item.platform);
            return (
              <div key={item.id} className="bg-card/30 border border-border/30 rounded-lg p-4 flex items-center justify-between hover:border-border/50 transition-colors">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {platform && <platform.icon className={`w-5 h-5 ${platform.color} shrink-0`} />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{item.contentType}</span>
                      {item.scheduledDate && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.scheduledDate} {item.scheduledTime || ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                  item.status === "published" ? "bg-green-500/10 text-green-400" :
                  item.status === "scheduled" ? "bg-blue-500/10 text-blue-400" :
                  item.status === "review" ? "bg-orange-500/10 text-orange-400" :
                  item.status === "generating" ? "bg-purple-500/10 text-purple-400" :
                  "bg-gray-500/10 text-gray-400"
                }`}>
                  {item.status === "published" ? "Publié" :
                   item.status === "scheduled" ? "Planifié" :
                   item.status === "review" ? "En revue" :
                   item.status === "generating" ? "Génération..." :
                   item.status === "idea" ? "Idée" : item.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateContentPanel() {
  const [form, setForm] = useState({
    title: "",
    contentType: "instagram_post" as any,
    platform: "instagram" as any,
    topic: "",
    brief: "",
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTime: "10:00",
  });
  const [generatedPreview, setGeneratedPreview] = useState("");
  const createMutation = trpc.content.create.useMutation({
    onSuccess: () => { toast.success("Contenu ajouté au calendrier"); setForm(prev => ({ ...prev, title: "", topic: "", brief: "" })); setGeneratedPreview(""); },
  });

  const generateWithAI = () => {
    if (!form.topic) { toast.error("Indiquez un sujet"); return; }
    setGeneratedPreview("Génération en cours...");
    // Simulate AI generation
    setTimeout(() => {
      setGeneratedPreview(`✨ Contenu généré par l'IA pour "${form.topic}" :\n\nDécouvrez l'excellence de ${form.topic} avec Maison Baymora. Notre conciergerie premium vous ouvre les portes des expériences les plus exclusives.\n\n#MaisonBaymora #Luxe #Conciergerie #${form.topic.replace(/\s/g, "")}`);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Side */}
      <div className="space-y-5">
        <h3 className="text-lg font-serif text-foreground">Nouveau contenu</h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Titre</label>
            <Input value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Titre du contenu" className="bg-card/30 border-border/30" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Type</label>
              <select value={form.contentType} onChange={(e) => setForm(prev => ({ ...prev, contentType: e.target.value }))} className="w-full bg-card/30 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground">
                {CONTENT_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Plateforme</label>
              <select value={form.platform} onChange={(e) => setForm(prev => ({ ...prev, platform: e.target.value }))} className="w-full bg-card/30 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground">
                {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Sujet</label>
            <Input value={form.topic} onChange={(e) => setForm(prev => ({ ...prev, topic: e.target.value }))} placeholder="Ex: Yacht Côte d'Azur, Restaurant étoilé Paris..." className="bg-card/30 border-border/30" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Brief / Instructions</label>
            <Textarea value={form.brief} onChange={(e) => setForm(prev => ({ ...prev, brief: e.target.value }))} placeholder="Instructions pour la génération IA..." className="bg-card/30 border-border/30 min-h-[100px]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Date</label>
              <Input type="date" value={form.scheduledDate} onChange={(e) => setForm(prev => ({ ...prev, scheduledDate: e.target.value }))} className="bg-card/30 border-border/30" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Heure</label>
              <Input type="time" value={form.scheduledTime} onChange={(e) => setForm(prev => ({ ...prev, scheduledTime: e.target.value }))} className="bg-card/30 border-border/30" />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={generateWithAI} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 gap-2 flex-1">
              <Sparkles className="w-4 h-4" /> Générer avec l'IA
            </Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.title || createMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 flex-1"
            >
              <Send className="w-4 h-4" /> {createMutation.isPending ? "Ajout..." : "Ajouter au calendrier"}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Side */}
      <div className="bg-card/20 border border-border/30 rounded-lg p-6">
        <h3 className="text-lg font-serif text-foreground mb-4">Aperçu</h3>

        {!generatedPreview ? (
          <div className="text-center py-16">
            <Eye className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">L'aperçu apparaîtra ici</p>
            <p className="text-sm text-muted-foreground mt-1">Remplissez le sujet et cliquez sur "Générer avec l'IA"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mock phone preview */}
            <div className="bg-background border border-border/50 rounded-2xl p-4 max-w-[320px] mx-auto">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary text-xs font-serif font-bold">B</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">maisonbaymora</p>
                  <p className="text-[10px] text-muted-foreground">{form.platform}</p>
                </div>
              </div>
              <div className="bg-card/50 rounded-lg aspect-square flex items-center justify-center mb-3">
                <Image className="w-12 h-12 text-muted-foreground/30" />
              </div>
              <p className="text-xs text-foreground whitespace-pre-wrap">{generatedPreview}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
