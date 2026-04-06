import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, FileText, MapPin, Phone, Camera, Send, ChevronRight, ChevronLeft,
  Star, Trash2, Upload, Plane, Car, Building2, Sparkles, Clock, Eye,
  CheckCircle2, AlertTriangle, Loader2, X, Mic, MicOff, MessageSquare,
  Bot, ArrowRight, RefreshCw, Zap, ArrowLeft, Route, Shield, Handshake,
  BadgeCheck, Crown, User, Mail, Calendar, Package
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const ESTABLISHMENT_TYPES = [
  { value: "hotel", label: "Hôtel / Resort", icon: "🏨" },
  { value: "restaurant", label: "Restaurant / Gastronomie", icon: "🍽️" },
  { value: "spa", label: "Spa / Wellness / Beauté", icon: "🧖" },
  { value: "bar", label: "Bar / Lounge / Rooftop", icon: "🍸" },
  { value: "plage", label: "Plage / Beach Club", icon: "🏖️" },
  { value: "activite", label: "Activité / Excursion", icon: "🎯" },
  { value: "culture", label: "Culture / Patrimoine / Musée", icon: "🏛️" },
  { value: "shopping", label: "Shopping / Boutique", icon: "🛍️" },
  { value: "experience", label: "Expérience unique / VIP", icon: "✨" },
  { value: "transport", label: "Transport / Transfert / Chauffeur", icon: "🚗" },
  { value: "prestataire", label: "Prestataire / Service local", icon: "🤝" },
  { value: "autre", label: "Autre", icon: "📋" },
];

const JOURNEY_STEP_TYPES = [
  { value: "depart", label: "Départ" },
  { value: "chauffeur", label: "Chauffeur / VTC" },
  { value: "avion", label: "Vol avion" },
  { value: "train", label: "Train" },
  { value: "taxi", label: "Taxi" },
  { value: "transfert", label: "Transfert" },
  { value: "arrivee", label: "Arrivée" },
  { value: "prise_en_charge", label: "Prise en charge" },
  { value: "prestation", label: "Prestation sur place" },
  { value: "autre", label: "Autre" },
];

const MEDIA_CATEGORIES = [
  { value: "facade", label: "Façade / Extérieur" },
  { value: "interieur", label: "Intérieur" },
  { value: "prestation", label: "Prestation / Soin" },
  { value: "equipement", label: "Équipement" },
  { value: "chambre", label: "Chambre / Suite" },
  { value: "transport", label: "Transport" },
  { value: "parcours", label: "Parcours" },
  { value: "equipe", label: "Équipe / Staff" },
  { value: "resultat", label: "Résultat / Avant-Après" },
  { value: "vue", label: "Vue / Paysage" },
  { value: "repas", label: "Repas / Cuisine" },
  { value: "autre", label: "Autre" },
];

type Step = "info" | "services" | "journey" | "contacts" | "media" | "advice" | "review";
const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "info", label: "Établissement", icon: <Building2 className="w-4 h-4" /> },
  { key: "services", label: "Prestations", icon: <FileText className="w-4 h-4" /> },
  { key: "journey", label: "Parcours", icon: <Plane className="w-4 h-4" /> },
  { key: "contacts", label: "Contacts", icon: <Phone className="w-4 h-4" /> },
  { key: "media", label: "Médias", icon: <Camera className="w-4 h-4" /> },
  { key: "advice", label: "Conseils", icon: <Star className="w-4 h-4" /> },
  { key: "review", label: "Résumé", icon: <Eye className="w-4 h-4" /> },
];

type MainTab = "overview" | "reports" | "routes" | "lena" | "messages";

export default function TeamDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [view, setView] = useState<"list" | "create" | "createRoute">("list");
  const [activeTab, setActiveTab] = useState<MainTab>("overview");

  const { data: unread } = trpc.team.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000,
    enabled: !!user,
  });

  if (!user || (user.role !== "team" && user.role !== "admin")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Accès réservé aux membres de l'équipe Baymora</p>
        </div>
      </div>
    );
  }

  const tierLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    free: { label: "Découverte", color: "text-gray-400", icon: <User className="w-3 h-3" /> },
    explorer: { label: "Explorer", color: "text-blue-400", icon: <Package className="w-3 h-3" /> },
    premium: { label: "Premium", color: "text-amber-400", icon: <Crown className="w-3 h-3" /> },
    elite: { label: "Élite", color: "text-purple-400", icon: <Crown className="w-3 h-3" /> },
  };
  const tier = tierLabels[(user as any).subscriptionTier || "free"] || tierLabels.free;

  const tabs: { key: MainTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "overview", label: "Mon Profil", icon: <User className="w-4 h-4" /> },
    { key: "reports", label: "Fiches Terrain", icon: <Building2 className="w-4 h-4" /> },
    { key: "routes", label: "Parcours", icon: <Route className="w-4 h-4" /> },
    { key: "lena", label: "LÉNA", icon: <Bot className="w-4 h-4" /> },
    { key: "messages", label: "Messages", icon: <MessageSquare className="w-4 h-4" />, badge: unread?.count },
  ];

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <div className="border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-start justify-between">
            <div>
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 mb-3 transition-colors"
              >
                <ArrowLeft size={12} /> Retour à l'accueil
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  {user.name?.charAt(0).toUpperCase() || "O"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-foreground">{user.name || "Opérateur"}</h1>
                    <span className="flex items-center gap-1 text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">
                      <BadgeCheck className="w-3 h-3" /> Profil validé
                    </span>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/5 ${tier.color}`}>
                      {tier.icon} {tier.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Opérateur Terrain Baymora · Membre depuis {new Date(user.createdAt || Date.now()).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === "reports" && view === "list" && (
                <Button onClick={() => setView("create")} className="gap-2 bg-primary hover:bg-primary/90 text-sm">
                  <Plus className="w-4 h-4" /> Nouvelle Fiche
                </Button>
              )}
              {activeTab === "routes" && view === "list" && (
                <Button onClick={() => setView("createRoute")} className="gap-2 bg-primary hover:bg-primary/90 text-sm">
                  <Plus className="w-4 h-4" /> Nouveau Parcours
                </Button>
              )}
              {view !== "list" && (
                <Button variant="outline" onClick={() => setView("list")} className="gap-2 text-sm">
                  <ChevronLeft className="w-4 h-4" /> Retour
                </Button>
              )}
            </div>
          </div>

          {/* Onglets */}
          <div className="flex gap-1 mt-5 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setView("list"); }}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-colors relative ${
                  activeTab === tab.key
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {tab.icon} {tab.label}
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{tab.badge}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === "overview" && <OperatorOverview user={user} />}
        {activeTab === "reports" && view === "list" && <ReportsList />}
        {activeTab === "reports" && view === "create" && <CreateReport onDone={() => setView("list")} />}
        {activeTab === "routes" && view === "list" && <RoutesList />}
        {activeTab === "routes" && view === "createRoute" && <CreateRoute onDone={() => setView("list")} />}
        {activeTab === "lena" && <LenaAssistant />}
        {activeTab === "messages" && <OperatorMessages user={user} />}
      </div>
    </div>
  );
}

// ─── Reports List ─────────────────────────────────────────────────────
function ReportsList() {
  const { data: reports, isLoading } = trpc.fieldReports.getMyReports.useQuery();
  const [expandedMediaId, setExpandedMediaId] = useState<number | null>(null);

  const statusColors: Record<string, string> = {
    draft: "bg-gray-500/10 text-gray-400",
    submitted: "bg-blue-500/10 text-blue-400",
    ai_processing: "bg-purple-500/10 text-purple-400",
    review: "bg-orange-500/10 text-orange-400",
    approved: "bg-green-500/10 text-green-400",
    published: "bg-emerald-500/10 text-emerald-400",
    rejected: "bg-red-500/10 text-red-400",
  };
  const statusLabels: Record<string, string> = {
    draft: "Brouillon",
    submitted: "Soumis",
    ai_processing: "Enrichissement IA",
    review: "En révision",
    approved: "Approuvé",
    published: "Publié",
    rejected: "Rejeté",
  };

  if (isLoading) return <div className="text-muted-foreground animate-pulse">Chargement...</div>;
  if (!reports || reports.length === 0) {
    return (
      <div className="text-center py-16 bg-card/20 rounded-lg border border-border/30">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg text-foreground mb-2">Aucun rapport terrain</p>
        <p className="text-sm text-muted-foreground">Créez votre premier rapport en cliquant sur "Nouveau Rapport"</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((r: any) => (
        <div key={r.id} className="bg-card/30 border border-border/30 rounded-lg p-5 hover:border-border/50 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-foreground">{r.establishmentName}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-primary">{r.establishmentType}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {r.city}, {r.country}
                </span>
                {r.specialty && <span className="text-xs text-muted-foreground">• {r.specialty}</span>}
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${statusColors[r.status] || statusColors.draft}`}>
              {statusLabels[r.status] || r.status}
            </span>
          </div>
          {r.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{r.description}</p>
          )}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {new Date(r.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </div>
            <button
              onClick={() => setExpandedMediaId(expandedMediaId === r.id ? null : r.id)}
              className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-full transition-colors"
            >
              <Camera className="w-3 h-3" />
              {expandedMediaId === r.id ? "Fermer médias" : "Photos & Vidéos"}
            </button>
          </div>
          {/* Panneau médias inline */}
          {expandedMediaId === r.id && (
            <div className="border-t border-border/30 bg-background/30 p-4">
              <ReportMediaPanel reportId={r.id} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Panneau médias inline pour une fiche existante ──────────────────
function ReportMediaPanel({ reportId }: { reportId: number }) {
  const utils = trpc.useUtils();
  const { data: mediaItems, isLoading } = trpc.fieldReports.getMedia.useQuery({ fieldReportId: reportId });
  const addMediaMutation = trpc.fieldReports.addMedia.useMutation({
    onSuccess: () => utils.fieldReports.getMedia.invalidate({ fieldReportId: reportId }),
  });
  const removeMediaMutation = trpc.fieldReports.removeMedia.useMutation({
    onSuccess: () => utils.fieldReports.getMedia.invalidate({ fieldReportId: reportId }),
  });

  const [pendingFiles, setPendingFiles] = useState<{ file: File; previewUrl: string; type: "photo" | "video"; caption: string; category: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [lightbox, setLightbox] = useState<{ url: string; type: "photo" | "video" } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const addPendingFiles = (files: FileList) => {
    const MAX_SIZE = 16 * 1024 * 1024;
    const newPending = Array.from(files)
      .filter(f => { if (f.size > MAX_SIZE) { toast.error(`${f.name} dépasse 16 Mo`); return false; } return true; })
      .map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
        type: (file.type.startsWith("video/") ? "video" : "photo") as "photo" | "video",
        caption: file.name.replace(/\.[^.]+$/, ""),
        category: "autre",
      }));
    setPendingFiles(prev => [...prev, ...newPending]);
  };

  const uploadAll = async () => {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    setUploadProgress({ done: 0, total: pendingFiles.length });
    for (let i = 0; i < pendingFiles.length; i++) {
      const pf = pendingFiles[i];
      try {
        const res = await fetch("/api/upload/field-report", {
          method: "POST",
          headers: { "Content-Type": pf.file.type, "x-file-name": encodeURIComponent(pf.file.name), "x-user-id": "operator" },
          body: pf.file,
          credentials: "include",
        });
        const { url } = await res.json();
        if (url) {
          await addMediaMutation.mutateAsync({ fieldReportId: reportId, type: pf.type, url, caption: pf.caption, category: pf.category as any });
        }
      } catch { toast.error(`Erreur lors de l'envoi de ${pf.file.name}`); }
      setUploadProgress(prev => ({ ...prev, done: i + 1 }));
    }
    pendingFiles.forEach(pf => URL.revokeObjectURL(pf.previewUrl));
    setPendingFiles([]);
    setUploadProgress({ done: 0, total: 0 });
    setUploading(false);
    toast.success("Médias ajoutés avec succès !");
  };

  if (isLoading) return <div className="text-xs text-muted-foreground animate-pulse py-2">Chargement des médias...</div>;

  return (
    <div className="space-y-4">
      {/* Zone de dépôt */}
      <label
        className={`block border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          dragOver ? "border-primary bg-primary/5" : "border-border/40 hover:border-primary/40"
        }`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) addPendingFiles(e.dataTransfer.files); }}
      >
        <input type="file" multiple accept="image/*,video/*" className="hidden"
          onChange={e => { if (e.target.files) addPendingFiles(e.target.files); (e.target as HTMLInputElement).value = ""; }}
        />
        <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Cliquez ou glissez vos photos & vidéos (max 16 Mo)</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">JPG, PNG, WebP, MP4, MOV, WebM</p>
      </label>

      {/* Fichiers en attente */}
      {pendingFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{pendingFiles.length} fichier{pendingFiles.length > 1 ? "s" : ""} en attente</span>
            <Button size="sm" onClick={uploadAll} disabled={uploading} className="h-7 text-xs gap-1">
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {uploading ? `${uploadProgress.done}/${uploadProgress.total}` : "Envoyer tout"}
            </Button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {pendingFiles.map((pf, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden bg-background/50 border border-border/30">
                <div className="h-24 relative">
                  {pf.type === "photo"
                    ? <img src={pf.previewUrl} className="w-full h-full object-cover" alt="" />
                    : <video src={pf.previewUrl} className="w-full h-full object-cover" muted />}
                  <span className={`absolute top-1 left-1 text-[9px] px-1 py-0.5 rounded font-medium ${
                    pf.type === "video" ? "bg-purple-500/80 text-white" : "bg-blue-500/80 text-white"
                  }`}>{pf.type === "video" ? "VIDÉO" : "PHOTO"}</span>
                  <button onClick={() => { URL.revokeObjectURL(pf.previewUrl); setPendingFiles(prev => prev.filter((_, idx) => idx !== i)); }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-1.5 space-y-1">
                  <input value={pf.caption} onChange={e => setPendingFiles(prev => { const u = [...prev]; u[i] = { ...u[i], caption: e.target.value }; return u; })}
                    placeholder="Légende" className="w-full h-6 px-1.5 rounded border border-border bg-background text-[10px] text-foreground" />
                  <select value={pf.category} onChange={e => setPendingFiles(prev => { const u = [...prev]; u[i] = { ...u[i], category: e.target.value }; return u; })}
                    className="w-full h-6 px-1 rounded border border-border bg-background text-[10px] text-foreground">
                    {MEDIA_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Galerie des médias déjà uploadés */}
      {mediaItems && mediaItems.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{mediaItems.length} média{mediaItems.length > 1 ? "s" : ""} enregistré{mediaItems.length > 1 ? "s" : ""}</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {(mediaItems as any[]).map((item: any) => (
              <div key={item.id} className="relative group rounded-lg overflow-hidden bg-background/50 border border-green-500/20">
                <div className="h-24 relative cursor-pointer" onClick={() => setLightbox({ url: item.url, type: item.type })}>
                  {item.type === "photo"
                    ? <img src={item.url} className="w-full h-full object-cover" alt={item.caption || ""} />
                    : <video src={item.url} className="w-full h-full object-cover" muted />}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="absolute top-1 left-1 text-[9px] px-1 py-0.5 rounded bg-green-500/80 text-white font-medium">✓</span>
                  <button onClick={e => { e.stopPropagation(); removeMediaMutation.mutate({ id: item.id }); }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {item.caption && <p className="text-[10px] text-muted-foreground px-1.5 py-1 truncate">{item.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : pendingFiles.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-3">Aucun média pour cette fiche. Ajoutez des photos ou vidéos ci-dessus.</p>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 z-10">
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-5xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
            {lightbox.type === "photo"
              ? <img src={lightbox.url} className="w-full h-full object-contain max-h-[85vh] rounded-lg" alt="" />
              : <video src={lightbox.url} controls className="w-full max-h-[85vh] rounded-lg" autoPlay />}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Create Report (Multi-Step Form) ──────────────────────────────────
function CreateReport({ onDone }: { onDone: () => void }) {
  const [currentStep, setCurrentStep] = useState<Step>("info");
  const [reportId, setReportId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  // Form state
  const [info, setInfo] = useState({
    establishmentName: "", establishmentType: "clinique" as string,
    specialty: "", city: "", country: "", region: "", address: "",
    googleMapsUrl: "", description: "", ambiance: "", highlights: "",
    languagesSpoken: "", website: "",
  });
  const [services, setServices] = useState<any[]>([]);
  const [journeySteps, setJourneySteps] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [advice, setAdvice] = useState({
    personalAdvice: "", overallRating: 5, wouldRecommend: true, targetClientele: "",
  });

  const createMutation = trpc.fieldReports.create.useMutation();
  const updateMutation = trpc.fieldReports.update.useMutation();
  const addServiceMutation = trpc.fieldReports.addService.useMutation();
  const addJourneyMutation = trpc.fieldReports.addJourneyStep.useMutation();
  const addContactMutation = trpc.fieldReports.addContact.useMutation();
  const addMediaMutation = trpc.fieldReports.addMedia.useMutation();
  const submitMutation = trpc.fieldReports.submit.useMutation();
  const enrichMutation = trpc.fieldReports.enrichWithAI.useMutation();

  const stepIndex = STEPS.findIndex(s => s.key === currentStep);

  async function handleCreateReport() {
    if (!info.establishmentName || !info.city || !info.country) {
      toast.error("Veuillez remplir le nom, la ville et le pays");
      return;
    }
    try {
      const result = await createMutation.mutateAsync({
        ...info,
        establishmentType: info.establishmentType as any,
      });
      if (result.id) {
        setReportId(result.id);
        toast.success("Rapport créé !");
        setCurrentStep("services");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleSaveServices() {
    if (!reportId) return;
    try {
      for (const svc of services.filter(s => !s.saved)) {
        await addServiceMutation.mutateAsync({ ...svc, fieldReportId: reportId });
        svc.saved = true;
      }
      toast.success("Prestations enregistrées");
      setCurrentStep("journey");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleSaveJourney() {
    if (!reportId) return;
    try {
      for (let i = 0; i < journeySteps.length; i++) {
        const step = journeySteps[i];
        if (!step.saved) {
          await addJourneyMutation.mutateAsync({ ...step, fieldReportId: reportId, stepOrder: i + 1 });
          step.saved = true;
        }
      }
      toast.success("Parcours enregistré");
      setCurrentStep("contacts");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleSaveContacts() {
    if (!reportId) return;
    try {
      for (const contact of contacts.filter(c => !c.saved)) {
        await addContactMutation.mutateAsync({ ...contact, fieldReportId: reportId });
        contact.saved = true;
      }
      toast.success("Contacts enregistrés");
      setCurrentStep("media");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleSaveMedia() {
    if (!reportId) return;
    try {
      for (const media of mediaItems.filter(m => !m.saved)) {
        await addMediaMutation.mutateAsync({ ...media, fieldReportId: reportId });
        media.saved = true;
      }
      toast.success("Médias enregistrés");
      setCurrentStep("advice");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleSaveAdvice() {
    if (!reportId) return;
    try {
      await updateMutation.mutateAsync({ id: reportId, data: advice });
      toast.success("Conseils enregistrés");
      setCurrentStep("review");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleSubmit() {
    if (!reportId) return;
    try {
      await submitMutation.mutateAsync({ id: reportId });
      toast.success("Rapport soumis pour révision !");
      utils.fieldReports.getMyReports.invalidate();
      onDone();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleEnrichAI() {
    if (!reportId) return;
    try {
      toast.info("Enrichissement IA en cours... Cela peut prendre quelques secondes.");
      await enrichMutation.mutateAsync({ id: reportId });
      toast.success("Rapport enrichi par l'IA !");
    } catch (err: any) {
      toast.error("Erreur d'enrichissement : " + err.message);
    }
  }

  async function handleUploadFile(file: File): Promise<string | null> {
    try {
      const response = await fetch("/api/upload/field-report", {
        method: "POST",
        headers: {
          "Content-Type": file.type,
          "X-File-Name": file.name,
          "X-User-Id": String(reportId || "0"),
        },
        body: file,
      });
      const result = await response.json();
      if (result.url) return result.url;
      throw new Error(result.error || "Upload échoué");
    } catch (err: any) {
      toast.error("Erreur upload : " + err.message);
      return null;
    }
  }

  return (
    <div>
      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center">
            <button
              onClick={() => {
                if (i === 0 || reportId) setCurrentStep(step.key);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
                currentStep === step.key
                  ? "bg-primary text-primary-foreground"
                  : i < stepIndex
                  ? "bg-primary/10 text-primary"
                  : "bg-card/30 text-muted-foreground"
              }`}
            >
              {step.icon}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground mx-1 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-card/20 border border-border/30 rounded-xl p-6">
        {currentStep === "info" && (
          <StepInfo info={info} setInfo={setInfo} onNext={handleCreateReport} isLoading={createMutation.isPending} />
        )}
        {currentStep === "services" && (
          <StepServices services={services} setServices={setServices} onNext={handleSaveServices} onPrev={() => setCurrentStep("info")} isLoading={addServiceMutation.isPending} />
        )}
        {currentStep === "journey" && (
          <StepJourney steps={journeySteps} setSteps={setJourneySteps} onNext={handleSaveJourney} onPrev={() => setCurrentStep("services")} isLoading={addJourneyMutation.isPending} />
        )}
        {currentStep === "contacts" && (
          <StepContacts contacts={contacts} setContacts={setContacts} onNext={handleSaveContacts} onPrev={() => setCurrentStep("journey")} isLoading={addContactMutation.isPending} />
        )}
        {currentStep === "media" && (
          <StepMedia items={mediaItems} setItems={setMediaItems} onUpload={handleUploadFile} onNext={handleSaveMedia} onPrev={() => setCurrentStep("contacts")} isLoading={addMediaMutation.isPending} />
        )}
        {currentStep === "advice" && (
          <StepAdvice advice={advice} setAdvice={setAdvice} onNext={handleSaveAdvice} onPrev={() => setCurrentStep("media")} isLoading={updateMutation.isPending} />
        )}
        {currentStep === "review" && (
          <StepReview
            info={info} services={services} journeySteps={journeySteps}
            contacts={contacts} mediaItems={mediaItems} advice={advice}
            onSubmit={handleSubmit} onEnrichAI={handleEnrichAI}
            isSubmitting={submitMutation.isPending} isEnriching={enrichMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Establishment Info ───────────────────────────────────────
function StepInfo({ info, setInfo, onNext, isLoading }: any) {
  const update = (key: string, value: string) => setInfo((prev: any) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif text-foreground mb-1">Informations de l'établissement</h2>
        <p className="text-sm text-muted-foreground">Décrivez l'établissement que vous avez visité</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-sm text-muted-foreground mb-1 block">Nom de l'établissement *</label>
          <Input value={info.establishmentName} onChange={e => update("establishmentName", e.target.value)} placeholder="Ex: Imed Medical Center" />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Type *</label>
          <select
            value={info.establishmentType}
            onChange={e => update("establishmentType", e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm"
          >
            {ESTABLISHMENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Spécialité</label>
          <Input value={info.specialty} onChange={e => update("specialty", e.target.value)} placeholder="Ex: Chirurgie esthétique, Dentaire..." />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Ville *</label>
          <Input value={info.city} onChange={e => update("city", e.target.value)} placeholder="Ex: Istanbul" />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Pays *</label>
          <Input value={info.country} onChange={e => update("country", e.target.value)} placeholder="Ex: Turquie" />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Région</label>
          <Input value={info.region} onChange={e => update("region", e.target.value)} placeholder="Ex: Marmara" />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Site web</label>
          <Input value={info.website} onChange={e => update("website", e.target.value)} placeholder="https://..." />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-muted-foreground mb-1 block">Adresse complète</label>
          <Input value={info.address} onChange={e => update("address", e.target.value)} placeholder="Adresse de l'établissement" />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-muted-foreground mb-1 block">Lien Google Maps</label>
          <Input value={info.googleMapsUrl} onChange={e => update("googleMapsUrl", e.target.value)} placeholder="https://maps.google.com/..." />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-muted-foreground mb-1 block">Description détaillée</label>
          <Textarea value={info.description} onChange={e => update("description", e.target.value)} placeholder="Décrivez l'établissement en détail : ce que vous avez vu, l'ambiance, les équipements, la qualité des soins/services..." rows={5} />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-muted-foreground mb-1 block">Ambiance & Premières impressions</label>
          <Textarea value={info.ambiance} onChange={e => update("ambiance", e.target.value)} placeholder="Décrivez l'atmosphère, le cadre, l'accueil..." rows={3} />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-muted-foreground mb-1 block">Points forts (séparés par des virgules)</label>
          <Input value={info.highlights} onChange={e => update("highlights", e.target.value)} placeholder="Équipement dernier cri, Personnel francophone, Tarifs compétitifs..." />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Langues parlées</label>
          <Input value={info.languagesSpoken} onChange={e => update("languagesSpoken", e.target.value)} placeholder="Français, Anglais, Turc..." />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={isLoading} className="gap-2 bg-primary hover:bg-primary/90">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          Suivant : Prestations
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: Services / Prestations ───────────────────────────────────
function StepServices({ services, setServices, onNext, onPrev, isLoading }: any) {
  const addService = () => setServices([...services, {
    serviceName: "", serviceCategory: "", description: "", priceFrom: "", priceTo: "",
    currency: "EUR", isOnQuote: false, duration: "", includes: "", notes: "", sortOrder: services.length,
  }]);

  const updateService = (i: number, key: string, value: any) => {
    const updated = [...services];
    updated[i] = { ...updated[i], [key]: value };
    setServices(updated);
  };

  const removeService = (i: number) => setServices(services.filter((_: any, idx: number) => idx !== i));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif text-foreground mb-1">Prestations & Services</h2>
          <p className="text-sm text-muted-foreground">Listez les prestations proposées avec les tarifs</p>
        </div>
        <Button variant="outline" onClick={addService} className="gap-2 border-primary/30 text-primary">
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Aucune prestation ajoutée. Cliquez sur "Ajouter" pour commencer.
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((svc: any, i: number) => (
            <div key={i} className="bg-background/50 border border-border/30 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-xs text-primary font-medium">Prestation #{i + 1}</span>
                <button onClick={() => removeService(i)} className="text-muted-foreground hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input value={svc.serviceName} onChange={e => updateService(i, "serviceName", e.target.value)} placeholder="Nom de la prestation *" />
                <Input value={svc.serviceCategory} onChange={e => updateService(i, "serviceCategory", e.target.value)} placeholder="Catégorie (ex: soins dentaires)" />
                <div className="md:col-span-2">
                  <Textarea value={svc.description} onChange={e => updateService(i, "description", e.target.value)} placeholder="Description de la prestation..." rows={2} />
                </div>
                <div className="flex gap-2 items-center">
                  <Input value={svc.priceFrom} onChange={e => updateService(i, "priceFrom", e.target.value)} placeholder="Prix min" type="number" />
                  <span className="text-muted-foreground">—</span>
                  <Input value={svc.priceTo} onChange={e => updateService(i, "priceTo", e.target.value)} placeholder="Prix max" type="number" />
                  <select value={svc.currency} onChange={e => updateService(i, "currency", e.target.value)} className="h-10 px-2 rounded border border-border bg-background text-sm text-foreground">
                    <option value="EUR">€</option><option value="USD">$</option><option value="TRY">₺</option><option value="GBP">£</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input type="checkbox" checked={svc.isOnQuote} onChange={e => updateService(i, "isOnQuote", e.target.checked)} className="rounded" />
                    Sur devis
                  </label>
                  <Input value={svc.duration} onChange={e => updateService(i, "duration", e.target.value)} placeholder="Durée (ex: 2h)" className="flex-1" />
                </div>
                <div className="md:col-span-2">
                  <Input value={svc.notes} onChange={e => updateService(i, "notes", e.target.value)} placeholder="Notes supplémentaires..." />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} className="gap-2"><ChevronLeft className="w-4 h-4" /> Retour</Button>
        <Button onClick={onNext} disabled={isLoading} className="gap-2 bg-primary hover:bg-primary/90">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          Suivant : Parcours
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: Journey / Parcours Transport ─────────────────────────────
function StepJourney({ steps, setSteps, onNext, onPrev, isLoading }: any) {
  const addStep = () => setSteps([...steps, {
    stepType: "depart", title: "", description: "", fromLocation: "", toLocation: "",
    companyName: "", flightNumber: "", vehicleType: "", departureTime: "", arrivalTime: "",
    durationMinutes: "", estimatedCost: "", currency: "EUR", isIncluded: false,
    affiliateLink: "", notes: "",
  }]);

  const updateStep = (i: number, key: string, value: any) => {
    const updated = [...steps];
    updated[i] = { ...updated[i], [key]: value };
    setSteps(updated);
  };

  const removeStep = (i: number) => setSteps(steps.filter((_: any, idx: number) => idx !== i));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif text-foreground mb-1">Parcours de Transport</h2>
          <p className="text-sm text-muted-foreground">Documentez le parcours complet : départ, vol, transferts, arrivée, prise en charge</p>
        </div>
        <Button variant="outline" onClick={addStep} className="gap-2 border-primary/30 text-primary">
          <Plus className="w-4 h-4" /> Ajouter une étape
        </Button>
      </div>

      {steps.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Aucune étape de parcours. Documentez le trajet complet du client.
        </div>
      ) : (
        <div className="space-y-4">
          {steps.map((step: any, i: number) => (
            <div key={i} className="bg-background/50 border border-border/30 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-xs text-primary font-medium">Étape #{i + 1}</span>
                <button onClick={() => removeStep(i)} className="text-muted-foreground hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select value={step.stepType} onChange={e => updateStep(i, "stepType", e.target.value)} className="h-10 px-3 rounded border border-border bg-background text-sm text-foreground">
                  {JOURNEY_STEP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <div className="md:col-span-2">
                  <Input value={step.title} onChange={e => updateStep(i, "title", e.target.value)} placeholder="Titre de l'étape *" />
                </div>
                <Input value={step.fromLocation} onChange={e => updateStep(i, "fromLocation", e.target.value)} placeholder="Lieu de départ" />
                <Input value={step.toLocation} onChange={e => updateStep(i, "toLocation", e.target.value)} placeholder="Lieu d'arrivée" />
                <Input value={step.companyName} onChange={e => updateStep(i, "companyName", e.target.value)} placeholder="Compagnie / Prestataire" />
                {step.stepType === "avion" && (
                  <Input value={step.flightNumber} onChange={e => updateStep(i, "flightNumber", e.target.value)} placeholder="N° de vol" />
                )}
                <Input value={step.departureTime} onChange={e => updateStep(i, "departureTime", e.target.value)} placeholder="Heure départ" type="time" />
                <Input value={step.arrivalTime} onChange={e => updateStep(i, "arrivalTime", e.target.value)} placeholder="Heure arrivée" type="time" />
                <div className="flex gap-2 items-center">
                  <Input value={step.estimatedCost} onChange={e => updateStep(i, "estimatedCost", e.target.value)} placeholder="Coût estimé" type="number" />
                  <select value={step.currency} onChange={e => updateStep(i, "currency", e.target.value)} className="h-10 px-2 rounded border border-border bg-background text-sm text-foreground">
                    <option value="EUR">€</option><option value="USD">$</option><option value="TRY">₺</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={step.isIncluded} onChange={e => updateStep(i, "isIncluded", e.target.checked)} className="rounded" />
                  Inclus dans le forfait
                </label>
                <div className="md:col-span-3">
                  <Textarea value={step.description} onChange={e => updateStep(i, "description", e.target.value)} placeholder="Description, notes..." rows={2} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} className="gap-2"><ChevronLeft className="w-4 h-4" /> Retour</Button>
        <Button onClick={onNext} disabled={isLoading} className="gap-2 bg-primary hover:bg-primary/90">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          Suivant : Contacts
        </Button>
      </div>
    </div>
  );
}

// ─── Step 4: Contacts ─────────────────────────────────────────────────
function StepContacts({ contacts, setContacts, onNext, onPrev, isLoading }: any) {
  const addContact = () => setContacts([...contacts, {
    contactName: "", role: "", phone: "", email: "", whatsapp: "",
    languages: "", notes: "", isMainContact: false,
  }]);

  const updateContact = (i: number, key: string, value: any) => {
    const updated = [...contacts];
    updated[i] = { ...updated[i], [key]: value };
    setContacts(updated);
  };

  const removeContact = (i: number) => setContacts(contacts.filter((_: any, idx: number) => idx !== i));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif text-foreground mb-1">Contacts sur place</h2>
          <p className="text-sm text-muted-foreground">Coordonnées des personnes clés de l'établissement</p>
        </div>
        <Button variant="outline" onClick={addContact} className="gap-2 border-primary/30 text-primary">
          <Plus className="w-4 h-4" /> Ajouter un contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Aucun contact ajouté. Ajoutez les coordonnées des personnes clés.
        </div>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact: any, i: number) => (
            <div key={i} className="bg-background/50 border border-border/30 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-xs text-primary font-medium">Contact #{i + 1}</span>
                <button onClick={() => removeContact(i)} className="text-muted-foreground hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input value={contact.contactName} onChange={e => updateContact(i, "contactName", e.target.value)} placeholder="Nom complet *" />
                <Input value={contact.role} onChange={e => updateContact(i, "role", e.target.value)} placeholder="Rôle (ex: Coordinatrice patients)" />
                <Input value={contact.phone} onChange={e => updateContact(i, "phone", e.target.value)} placeholder="Téléphone" />
                <Input value={contact.email} onChange={e => updateContact(i, "email", e.target.value)} placeholder="Email" />
                <Input value={contact.whatsapp} onChange={e => updateContact(i, "whatsapp", e.target.value)} placeholder="WhatsApp" />
                <Input value={contact.languages} onChange={e => updateContact(i, "languages", e.target.value)} placeholder="Langues (ex: Français, Anglais, Turc)" />
                <div className="md:col-span-2">
                  <Input value={contact.notes} onChange={e => updateContact(i, "notes", e.target.value)} placeholder="Notes (ex: disponible 24/7, très réactif...)" />
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={contact.isMainContact} onChange={e => updateContact(i, "isMainContact", e.target.checked)} className="rounded" />
                  Contact principal
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} className="gap-2"><ChevronLeft className="w-4 h-4" /> Retour</Button>
        <Button onClick={onNext} disabled={isLoading} className="gap-2 bg-primary hover:bg-primary/90">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          Suivant : Médias
        </Button>
      </div>
    </div>
  );
}

// ─── Step 5: Media Upload (avec prévisualisation) ─────────────────────
function StepMedia({ items, setItems, onUpload, onNext, onPrev, isLoading }: any) {
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState({ done: 0, total: 0 });
  const [pendingFiles, setPendingFiles] = useState<{ file: File; previewUrl: string; type: "photo" | "video"; caption: string; category: string }[]>([]);
  const [lightbox, setLightbox] = useState<{ url: string; type: "photo" | "video"; caption: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Créer une prévisualisation locale pour chaque fichier sélectionné
  const addPendingFiles = (files: FileList) => {
    const newPending = Array.from(files).map(file => {
      const isVideo = file.type.startsWith("video/");
      const previewUrl = URL.createObjectURL(file);
      return {
        file,
        previewUrl,
        type: (isVideo ? "video" : "photo") as "photo" | "video",
        caption: file.name.replace(/\.[^.]+$/, ""),
        category: "autre",
      };
    });
    setPendingFiles(prev => [...prev, ...newPending]);
  };

  const updatePending = (i: number, key: string, value: string) => {
    setPendingFiles(prev => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [key]: value };
      return updated;
    });
  };

  const removePending = (i: number) => {
    setPendingFiles(prev => {
      const removed = prev[i];
      URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  // Upload tous les fichiers en attente vers S3
  const handleUploadAll = async () => {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    setUploadCount({ done: 0, total: pendingFiles.length });
    const successfulItems: any[] = [];
    for (let i = 0; i < pendingFiles.length; i++) {
      const pf = pendingFiles[i];
      try {
        const url = await onUpload(pf.file);
        if (url) {
          successfulItems.push({
            type: pf.type,
            url,
            caption: pf.caption,
            category: pf.category,
          });
        }
      } catch {
        // skip failed
      }
      setUploadCount(prev => ({ ...prev, done: i + 1 }));
    }
    setItems((prev: any[]) => [...prev, ...successfulItems]);
    // Nettoyer les prévisualisations
    pendingFiles.forEach(pf => URL.revokeObjectURL(pf.previewUrl));
    setPendingFiles([]);
    setUploadCount({ done: 0, total: 0 });
    setUploading(false);
  };

  const updateItem = (i: number, key: string, value: any) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [key]: value };
    setItems(updated);
  };

  const removeItem = (i: number) => setItems(items.filter((_: any, idx: number) => idx !== i));

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addPendingFiles(e.dataTransfer.files);
  };

  const totalPending = pendingFiles.length;
  const totalUploaded = items.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif text-foreground mb-1">Photos & Vidéos</h2>
        <p className="text-sm text-muted-foreground">Sélectionnez vos fichiers, prévisualisez-les, puis envoyez-les en une seule fois</p>
      </div>

      {/* Drop zone */}
      <label
        className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border/50 hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={e => { if (e.target.files) addPendingFiles(e.target.files); e.target.value = ""; }}
        />
        <Upload className={`w-8 h-8 mx-auto mb-2 transition-colors ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
        <p className="text-sm text-muted-foreground">
          {dragOver ? "Relâchez pour ajouter" : "Cliquez ou glissez vos fichiers ici"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Photos (JPG, PNG, WebP) et vidéos (MP4, MOV) acceptées</p>
      </label>

      {/* Pending files - prévisualisation avant envoi */}
      {pendingFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Prévisualisation ({totalPending} fichier{totalPending > 1 ? "s" : ""} en attente)
            </h3>
            <Button
              onClick={handleUploadAll}
              disabled={uploading}
              size="sm"
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Envoi en cours..." : `Envoyer ${totalPending} fichier${totalPending > 1 ? "s" : ""}`}
            </Button>
          </div>

          {/* Upload progress bar */}
          {uploading && uploadCount.total > 0 && (
            <div className="bg-background/50 border border-border/30 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Progression de l'envoi</span>
                <span>{uploadCount.done} / {uploadCount.total}</span>
              </div>
              <div className="w-full h-2 bg-card rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${(uploadCount.done / uploadCount.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pendingFiles.map((pf, i) => (
              <div key={i} className="bg-background/50 border border-border/30 rounded-lg overflow-hidden group relative">
                {/* Prévisualisation */}
                <div
                  className="relative w-full h-40 cursor-pointer"
                  onClick={() => setLightbox({ url: pf.previewUrl, type: pf.type, caption: pf.caption })}
                >
                  {pf.type === "photo" ? (
                    <img src={pf.previewUrl} alt={pf.caption} className="w-full h-full object-cover" />
                  ) : (
                    <video src={pf.previewUrl} className="w-full h-full object-cover" muted />
                  )}
                  {/* Overlay au hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {/* Badge type */}
                  <span className={`absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    pf.type === "video" ? "bg-purple-500/80 text-white" : "bg-blue-500/80 text-white"
                  }`}>
                    {pf.type === "video" ? "VIDÉO" : "PHOTO"}
                  </span>
                  {/* Taille du fichier */}
                  <span className="absolute bottom-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">
                    {(pf.file.size / 1024 / 1024).toFixed(1)} Mo
                  </span>
                </div>

                {/* Bouton supprimer */}
                <button
                  onClick={() => removePending(i)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Métadonnées */}
                <div className="p-2 space-y-1">
                  <Input
                    value={pf.caption}
                    onChange={e => updatePending(i, "caption", e.target.value)}
                    placeholder="Légende"
                    className="text-xs h-7"
                  />
                  <select
                    value={pf.category}
                    onChange={e => updatePending(i, "category", e.target.value)}
                    className="w-full h-7 px-1 rounded border border-border bg-background text-xs text-foreground"
                  >
                    {MEDIA_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fichiers déjà uploadés */}
      {items.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            Envoyés ({totalUploaded} fichier{totalUploaded > 1 ? "s" : ""})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item: any, i: number) => (
              <div key={i} className="bg-background/50 border border-green-500/20 rounded-lg overflow-hidden group relative">
                <div
                  className="relative w-full h-36 cursor-pointer"
                  onClick={() => setLightbox({ url: item.url, type: item.type, caption: item.caption })}
                >
                  {item.type === "photo" ? (
                    <img src={item.url} alt={item.caption} className="w-full h-full object-cover" />
                  ) : (
                    <video src={item.url} className="w-full h-full object-cover" muted />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-green-500/80 text-white font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Envoyé
                  </span>
                </div>
                <button
                  onClick={() => removeItem(i)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="p-2 space-y-1">
                  <Input value={item.caption} onChange={e => updateItem(i, "caption", e.target.value)} placeholder="Légende" className="text-xs h-7" />
                  <select value={item.category} onChange={e => updateItem(i, "category", e.target.value)} className="w-full h-7 px-1 rounded border border-border bg-background text-xs text-foreground">
                    {MEDIA_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox plein écran */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-5xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
            {lightbox.type === "photo" ? (
              <img src={lightbox.url} alt={lightbox.caption} className="w-full h-full object-contain max-h-[85vh] rounded-lg" />
            ) : (
              <video src={lightbox.url} controls autoPlay className="w-full max-h-[85vh] rounded-lg" />
            )}
            {lightbox.caption && (
              <p className="text-center text-white/80 text-sm mt-3">{lightbox.caption}</p>
            )}
          </div>
        </div>
      )}

      {/* Compteur récapitulatif */}
      {(items.length > 0 || pendingFiles.length > 0) && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground bg-background/50 border border-border/30 rounded-lg px-4 py-2">
          <span className="flex items-center gap-1"><Camera className="w-3 h-3" /> {items.filter((m: any) => m.type === "photo").length + pendingFiles.filter(p => p.type === "photo").length} photos</span>
          <span className="flex items-center gap-1"><Camera className="w-3 h-3" /> {items.filter((m: any) => m.type === "video").length + pendingFiles.filter(p => p.type === "video").length} vidéos</span>
          {pendingFiles.length > 0 && <span className="text-orange-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {pendingFiles.length} en attente d'envoi</span>}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} className="gap-2"><ChevronLeft className="w-4 h-4" /> Retour</Button>
        <Button onClick={onNext} disabled={isLoading || pendingFiles.length > 0} className="gap-2 bg-primary hover:bg-primary/90">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          {pendingFiles.length > 0 ? "Envoyez d'abord les fichiers" : "Suivant : Conseils"}
        </Button>
      </div>
    </div>
  );
}

// ─── Step 6: Personal Advice ──────────────────────────────────────────
function StepAdvice({ advice, setAdvice, onNext, onPrev, isLoading }: any) {
  const update = (key: string, value: any) => setAdvice((prev: any) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif text-foreground mb-1">Vos conseils & évaluation</h2>
        <p className="text-sm text-muted-foreground">Partagez votre avis personnel et vos recommandations</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Votre note globale</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => update("overallRating", n)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  n <= advice.overallRating ? "bg-primary text-primary-foreground" : "bg-card/30 text-muted-foreground"
                }`}
              >
                <Star className="w-5 h-5" fill={n <= advice.overallRating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={advice.wouldRecommend} onChange={e => update("wouldRecommend", e.target.checked)} className="rounded" />
          <span className="text-foreground">Je recommande cet établissement pour les clients Baymora</span>
        </label>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Clientèle cible</label>
          <Input value={advice.targetClientele} onChange={e => update("targetClientele", e.target.value)} placeholder="Pour qui est cet établissement ? (ex: Couples 30-50 ans, budget premium, recherchant soins dentaires de qualité)" />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Vos conseils personnels</label>
          <Textarea
            value={advice.personalAdvice}
            onChange={e => update("personalAdvice", e.target.value)}
            placeholder="Quoi prévoir ? Quoi emporter ? Points d'attention ? Astuces ? Fonctionnement sur place ? Durée recommandée du séjour ? Ce qu'il faut savoir avant de partir..."
            rows={6}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} className="gap-2"><ChevronLeft className="w-4 h-4" /> Retour</Button>
        <Button onClick={onNext} disabled={isLoading} className="gap-2 bg-primary hover:bg-primary/90">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          Suivant : Résumé
        </Button>
      </div>
    </div>
  );
}

// ─── Step 7: Review & Submit ──────────────────────────────────────────
function StepReview({ info, services, journeySteps, contacts, mediaItems, advice, onSubmit, onEnrichAI, isSubmitting, isEnriching }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif text-foreground mb-1">Résumé du rapport</h2>
        <p className="text-sm text-muted-foreground">Vérifiez les informations avant de soumettre</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard title="Établissement" icon={<Building2 className="w-4 h-4" />}>
          <p className="font-medium text-foreground">{info.establishmentName}</p>
          <p className="text-xs text-muted-foreground">{info.establishmentType}{info.specialty ? ` — ${info.specialty}` : ""}</p>
          <p className="text-xs text-muted-foreground">{info.city}, {info.country}</p>
        </SummaryCard>

        <SummaryCard title={`${services.length} Prestation(s)`} icon={<FileText className="w-4 h-4" />}>
          {services.slice(0, 3).map((s: any, i: number) => (
            <p key={i} className="text-xs text-muted-foreground truncate">• {s.serviceName} {s.priceFrom ? `(${s.priceFrom}${s.priceTo ? `-${s.priceTo}` : ""} ${s.currency})` : s.isOnQuote ? "(sur devis)" : ""}</p>
          ))}
          {services.length > 3 && <p className="text-xs text-primary">+{services.length - 3} autres</p>}
        </SummaryCard>

        <SummaryCard title={`${journeySteps.length} Étape(s) de parcours`} icon={<Plane className="w-4 h-4" />}>
          {journeySteps.slice(0, 4).map((s: any, i: number) => (
            <p key={i} className="text-xs text-muted-foreground truncate">
              {i + 1}. {s.title} ({s.stepType})
            </p>
          ))}
        </SummaryCard>

        <SummaryCard title={`${contacts.length} Contact(s)`} icon={<Phone className="w-4 h-4" />}>
          {contacts.map((c: any, i: number) => (
            <p key={i} className="text-xs text-muted-foreground truncate">
              • {c.contactName} {c.role ? `(${c.role})` : ""} {c.isMainContact ? "⭐" : ""}
            </p>
          ))}
        </SummaryCard>

        <SummaryCard title={`${mediaItems.length} Média(s)`} icon={<Camera className="w-4 h-4" />}>
          <p className="text-xs text-muted-foreground">
            {mediaItems.filter((m: any) => m.type === "photo").length} photos, {mediaItems.filter((m: any) => m.type === "video").length} vidéos
          </p>
        </SummaryCard>

        <SummaryCard title="Évaluation" icon={<Star className="w-4 h-4" />}>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <Star key={n} className="w-3 h-3" fill={n <= advice.overallRating ? "#c8a55a" : "none"} stroke={n <= advice.overallRating ? "#c8a55a" : "currentColor"} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {advice.wouldRecommend ? "✅ Recommandé" : "❌ Non recommandé"}
          </p>
        </SummaryCard>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/30">
        <Button
          onClick={onEnrichAI}
          disabled={isEnriching}
          variant="outline"
          className="gap-2 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 flex-1"
        >
          {isEnriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Enrichir avec l'IA
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="gap-2 bg-primary hover:bg-primary/90 flex-1"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Soumettre pour révision
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-background/50 border border-border/30 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2 text-primary">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

// ─── LÉNA Assistant — Chat Vocal Guidé ────────────────────────────────────────

type LenaStep =
  | "ACCUEIL" | "COLLECTE_BASE" | "AMBIANCE" | "OFFRE"
  | "PRATIQUE" | "ANECDOTES" | "PHOTOS" | "SCOUT_RECHERCHE"
  | "CONSTRUCTION_FICHE" | "VALIDATION_ARIA" | "PUBLIEE";

interface LenaMessage {
  role: "user" | "assistant";
  content: string;
}

interface LenaSession {
  fieldReportId?: number;
  establishmentName?: string;
  city?: string;
  currentStep: LenaStep;
  collectedData: Record<string, unknown>;
}

const LENA_STEPS: { key: LenaStep; label: string; short: string }[] = [
  { key: "ACCUEIL", label: "Accueil", short: "1" },
  { key: "COLLECTE_BASE", label: "Infos de base", short: "2" },
  { key: "AMBIANCE", label: "Ambiance", short: "3" },
  { key: "OFFRE", label: "Offre & Prix", short: "4" },
  { key: "PRATIQUE", label: "Infos pratiques", short: "5" },
  { key: "ANECDOTES", label: "Anecdotes", short: "6" },
  { key: "PHOTOS", label: "Photos", short: "7" },
  { key: "SCOUT_RECHERCHE", label: "Recherche SCOUT", short: "8" },
  { key: "CONSTRUCTION_FICHE", label: "Fiche SEO", short: "9" },
  { key: "VALIDATION_ARIA", label: "Validation ARIA", short: "10" },
];

function LenaAssistant() {
  const [messages, setMessages] = useState<LenaMessage[]>([
    {
      role: "assistant",
      content: "Bonjour ! Je suis **LÉNA**, ton assistante terrain Baymora. 👋\n\nJe vais te guider étape par étape pour créer une fiche établissement complète et SEO-optimisée.\n\nOn travaille sur quelle adresse aujourd'hui ?",
    },
  ]);
  const [session, setSession] = useState<LenaSession>({
    currentStep: "ACCUEIL",
    collectedData: {},
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [draftFiche, setDraftFiche] = useState<Record<string, unknown> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const lenaChat = trpc.lena.chat.useMutation();
  const transcribeVoice = trpc.lena.transcribeForLena.useMutation();
  const generateFiche = trpc.lena.generateFiche.useMutation();
  const uploadMedia = trpc.fieldReports.getUploadUrl.useMutation();

  // Scroll automatique
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Envoyer un message texte
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: LenaMessage = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await lenaChat.mutateAsync({
        message: text,
        history: messages,
        session,
      });

      const assistantMsg: LenaMessage = { role: "assistant", content: result.content };
      setMessages(prev => [...prev, assistantMsg]);

      // Mettre à jour la session
      setSession(prev => ({
        ...prev,
        currentStep: result.step as LenaStep,
      }));

      // Si LÉNA a généré une fiche
      if (result.draftFiche) {
        setDraftFiche(result.draftFiche as Record<string, unknown>);
        toast.success("LÉNA a généré une fiche SEO !");
      }

      // Si SCOUT a été lancé
      if (result.shouldLaunchScout) {
        toast.info("SCOUT effectue des recherches web...", { duration: 3000 });
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error("Erreur LÉNA : " + (error?.message || "Réessayez"));
    } finally {
      setIsLoading(false);
    }
  }, [messages, session, lenaChat, isLoading]);

  // Enregistrement vocal
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        // Upload audio
        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "voice.webm");
          const uploadRes = await fetch("/api/upload/field-report", {
            method: "POST",
            headers: {
              "x-file-name": "voice.webm",
              "content-type": "audio/webm",
            },
            body: audioBlob,
          });
          const { url } = await uploadRes.json() as { url: string };

          // Transcrire
          const transcription = await transcribeVoice.mutateAsync({ audioUrl: url });
          if (transcription.text) {
            setInput(transcription.text);
            toast.success("Transcription : " + transcription.text.slice(0, 60) + "...");
          }
        } catch {
          toast.error("Erreur de transcription vocale");
        }
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Microphone non disponible");
    }
  }, [transcribeVoice]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  // Générer fiche complète
  const handleGenerateFiche = useCallback(async () => {
    if (!session.establishmentName || !session.city) {
      toast.error("Donnez d'abord le nom et la ville de l'établissement à LÉNA");
      return;
    }
    setIsLoading(true);
    try {
      const result = await generateFiche.mutateAsync({
        establishmentName: session.establishmentName,
        city: session.city,
        collectedData: session.collectedData,
      });
      setDraftFiche(result.fiche as Record<string, unknown>);
      toast.success("Fiche SEO générée par LÉNA + SCOUT !");
    } catch {
      toast.error("Erreur lors de la génération de fiche");
    } finally {
      setIsLoading(false);
    }
  }, [session, generateFiche]);

  const currentStepIndex = LENA_STEPS.findIndex(s => s.key === session.currentStep);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Colonne gauche : Chat LÉNA */}
      <div className="lg:col-span-2 flex flex-col">
        {/* En-tête LÉNA */}
        <div className="bg-gradient-to-r from-amber-950/40 to-amber-900/20 border border-amber-500/20 rounded-t-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-amber-300">LÉNA</span>
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Assistante Terrain</span>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  En ligne
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Binôme Claude Opus + SCOUT (Perplexity)</p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mt-3">
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {LENA_STEPS.map((step, idx) => (
                <div
                  key={step.key}
                  className={`flex items-center gap-1 flex-shrink-0 ${idx <= currentStepIndex ? "opacity-100" : "opacity-30"}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      idx < currentStepIndex
                        ? "bg-green-500/30 text-green-400 border border-green-500/30"
                        : idx === currentStepIndex
                        ? "bg-amber-500/30 text-amber-400 border border-amber-500/50"
                        : "bg-muted/20 text-muted-foreground border border-border/20"
                    }`}
                  >
                    {idx < currentStepIndex ? <CheckCircle2 className="w-3 h-3" /> : step.short}
                  </div>
                  {idx < LENA_STEPS.length - 1 && (
                    <div className={`w-3 h-px ${idx < currentStepIndex ? "bg-green-500/40" : "bg-border/20"}`} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-400/70 mt-1">
              Étape {currentStepIndex + 1}/{LENA_STEPS.length} — {LENA_STEPS[currentStepIndex]?.label}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 bg-card/20 border-x border-border/30 overflow-y-auto p-4 space-y-4" style={{ minHeight: "400px", maxHeight: "500px" }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-amber-400" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary/20 text-foreground border border-primary/20 ml-auto"
                    : "bg-amber-950/30 text-foreground border border-amber-500/10"
                }`}
              >
                {msg.content.split("\n").map((line, i) => (
                  <p key={i} className={line.startsWith("**") ? "font-semibold" : ""}>
                    {line.replace(/\*\*(.*?)\*\*/g, "$1")}
                  </p>
                ))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-amber-400" />
              </div>
              <div className="bg-amber-950/30 border border-amber-500/10 rounded-xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie */}
        <div className="bg-card/30 border border-border/30 rounded-b-xl p-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
              placeholder="Répondez à LÉNA ou parlez avec le micro..."
              className="flex-1 bg-background/50 border-border/30 text-sm"
              disabled={isLoading}
            />
            {/* Bouton micro */}
            <Button
              variant="outline"
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex-shrink-0 transition-colors ${
                isRecording
                  ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
                  : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              }`}
              disabled={isLoading}
              title={isRecording ? "Arrêter l'enregistrement" : "Parler à LÉNA"}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            {/* Bouton envoyer */}
            <Button
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              className="flex-shrink-0 bg-amber-600 hover:bg-amber-500 text-white"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          {isRecording && (
            <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              Enregistrement en cours... Cliquez sur le micro pour arrêter
            </p>
          )}
        </div>
      </div>

      {/* Colonne droite : Infos session + Fiche générée */}
      <div className="space-y-4">
        {/* Infos session */}
        <div className="bg-card/30 border border-border/30 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            Session en cours
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Établissement</span>
              <span className="text-foreground font-medium">{session.establishmentName || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ville</span>
              <span className="text-foreground">{session.city || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Étape</span>
              <span className="text-amber-400 text-xs font-medium">{session.currentStep}</span>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-card/30 border border-border/30 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Actions rapides
          </h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs border-amber-500/20 text-amber-400 hover:bg-amber-500/10"
              onClick={() => sendMessage("Lance SCOUT pour rechercher des infos sur cet établissement")}
              disabled={isLoading || !session.establishmentName}
            >
              <RefreshCw className="w-3 h-3" /> Lancer SCOUT
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs border-primary/20 text-primary hover:bg-primary/10"
              onClick={handleGenerateFiche}
              disabled={isLoading || !session.establishmentName}
            >
              <Sparkles className="w-3 h-3" /> Générer la fiche SEO
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs border-green-500/20 text-green-400 hover:bg-green-500/10"
              onClick={() => sendMessage("C'est bon, soumet la fiche à ARIA pour validation")}
              disabled={isLoading || !draftFiche}
            >
              <CheckCircle2 className="w-3 h-3" /> Soumettre à ARIA
            </Button>
          </div>
        </div>

        {/* Fiche générée */}
        {draftFiche && (
          <div className="bg-card/30 border border-green-500/20 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Fiche SEO générée
            </h3>
            <div className="space-y-2 text-xs">
              {Boolean(draftFiche.name) && (
                <div>
                  <span className="text-muted-foreground">Nom : </span>
                  <span className="text-foreground font-medium">{String(draftFiche.name ?? "")}</span>
                </div>
              )}
              {Boolean(draftFiche.category) && (
                <div>
                  <span className="text-muted-foreground">Catégorie : </span>
                  <span className="text-foreground">{String(draftFiche.category ?? "")}</span>
                </div>
              )}
              {Boolean(draftFiche.shortDescription) && (
                <div>
                  <span className="text-muted-foreground block mb-1">Accroche :</span>
                  <p className="text-foreground/80 italic">{String(draftFiche.shortDescription ?? "")}</p>
                </div>
              )}
              {Boolean(draftFiche.metaTitle) && (
                <div>
                  <span className="text-muted-foreground">Meta titre : </span>
                  <span className="text-foreground text-xs">{String(draftFiche.metaTitle ?? "")}</span>
                </div>
              )}
            </div>
            <Button
              size="sm"
              className="w-full mt-3 gap-2 bg-green-600 hover:bg-green-500 text-white text-xs"
              onClick={() => {
                const json = JSON.stringify(draftFiche, null, 2);
                navigator.clipboard.writeText(json);
                toast.success("Fiche copiée dans le presse-papiers !");
              }}
            >
              <ArrowRight className="w-3 h-3" /> Copier la fiche JSON
            </Button>
          </div>
        )}

        {/* Aide */}
        <div className="bg-card/20 border border-border/20 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">💡 Conseils</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Utilisez le micro pour dicter sans taper</li>
            <li>• LÉNA mémorise votre session</li>
            <li>• SCOUT cherche les infos web automatiquement</li>
            <li>• Dites "suivant" pour passer à l'étape suivante</li>
            <li>• Dites "lance SCOUT" pour une recherche web</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Operator Overview (Profil Validé) ────────────────────────────────
function OperatorOverview({ user }: { user: any }) {
  const { data: reports } = trpc.fieldReports.getMyReports.useQuery();
  const { data: routes } = trpc.team.getMyRoutes.useQuery();

  const stats = [
    { label: "Fiches soumises", value: reports?.length ?? 0, icon: <Building2 className="w-5 h-5 text-blue-400" />, color: "text-blue-400" },
    { label: "Fiches approuvées", value: reports?.filter((r: any) => r.status === "approved" || r.status === "published").length ?? 0, icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, color: "text-green-400" },
    { label: "Parcours créés", value: routes?.length ?? 0, icon: <Route className="w-5 h-5 text-amber-400" />, color: "text-amber-400" },
    { label: "Partenariats validés", value: reports?.filter((r: any) => r.partnershipValidated).length ?? 0, icon: <Handshake className="w-5 h-5 text-purple-400" />, color: "text-purple-400" },
  ];

  const tierInfo: Record<string, { label: string; desc: string; color: string }> = {
    free: { label: "Découverte", desc: "Accès limité — 15 messages IA", color: "text-gray-400" },
    explorer: { label: "Explorer — 9,90€/mois", desc: "Accès complet LÉNA + fiches illimitées", color: "text-blue-400" },
    premium: { label: "Premium — 29,90€/mois", desc: "Priorité IA + mémoire longue durée + SCOUT avancé", color: "text-amber-400" },
    elite: { label: "Élite — 89,90€/mois", desc: "Accès total + support dédié + agents autonomes", color: "text-purple-400" },
  };
  const currentTier = tierInfo[(user as any).subscriptionTier || "free"] || tierInfo.free;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-card/20 border border-border/30 rounded-xl p-4 text-center">
            <div className="flex justify-center mb-2">{s.icon}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Guide rapide */}
      <div className="bg-card/20 border border-border/30 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">🗺️ Votre mission terrain</h3>
        <div className="space-y-3">
          {[
            { icon: <Building2 className="w-4 h-4 text-blue-400" />, title: "Fiches Terrain", desc: "Documentez les établissements que vous visitez (hôtels, restaurants, spas, activités, plages, boutiques...)" },
            { icon: <Route className="w-4 h-4 text-amber-400" />, title: "Parcours Locaux", desc: "Créez des itinéraires thématiques dans une ville : découverte, gastronomie, plages, culture, shopping..." },
            { icon: <Handshake className="w-4 h-4 text-green-400" />, title: "Partenariats", desc: "Signalez les établissements prêts à s'affilier à Baymora pour des commissions sur réservations" },
            { icon: <Camera className="w-4 h-4 text-purple-400" />, title: "Photos & Médias", desc: "Ajoutez des photos de qualité pour enrichir les fiches et les parcours" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5">{item.icon}</div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Routes List (Parcours Locaux) ────────────────────────────────────
function RoutesList() {
  const { data: routes, isLoading } = trpc.team.getMyRoutes.useQuery();

  const categoryLabels: Record<string, { label: string; emoji: string }> = {
    decouverte: { label: "Découverte", emoji: "🗺️" },
    gastronomie: { label: "Gastronomie", emoji: "🍽️" },
    plages: { label: "Plages", emoji: "🏖️" },
    culture: { label: "Culture", emoji: "🏛️" },
    shopping: { label: "Shopping", emoji: "🛍️" },
    nature: { label: "Nature", emoji: "🌿" },
    nightlife: { label: "Vie nocturne", emoji: "🌙" },
    wellness: { label: "Bien-être", emoji: "🧖" },
    business: { label: "Business", emoji: "💼" },
    famille: { label: "Famille", emoji: "👨‍👩‍👧" },
    autre: { label: "Autre", emoji: "📋" },
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-500/10 text-gray-400",
    submitted: "bg-blue-500/10 text-blue-400",
    approved: "bg-green-500/10 text-green-400",
    published: "bg-emerald-500/10 text-emerald-400",
  };
  const statusLabels: Record<string, string> = {
    draft: "Brouillon", submitted: "Soumis", approved: "Approuvé", published: "Publié",
  };

  if (isLoading) return <div className="text-muted-foreground animate-pulse">Chargement...</div>;

  if (!routes || routes.length === 0) {
    return (
      <div className="text-center py-16">
        <Route className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Aucun parcours créé pour l'instant</p>
        <p className="text-xs text-muted-foreground mt-1">Créez votre premier itinéraire local en cliquant sur "Nouveau Parcours"</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {routes.map((route: any) => {
        const cat = categoryLabels[route.category] || { label: route.category, emoji: "📋" };
        const steps = route.steps ? JSON.parse(route.steps) : [];
        return (
          <div key={route.id} className="bg-card/30 border border-border/40 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg">{cat.emoji}</span>
                  <h3 className="font-semibold text-foreground">{route.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[route.status] || "bg-gray-500/10 text-gray-400"}`}>
                    {statusLabels[route.status] || route.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {route.city}, {route.country}</span>
                  <span>{cat.label}</span>
                  {route.durationMinutes && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.floor(route.durationMinutes / 60)}h{route.durationMinutes % 60 > 0 ? `${route.durationMinutes % 60}min` : ""}</span>}
                  <span>{steps.length} étape{steps.length > 1 ? "s" : ""}</span>
                </div>
                {route.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{route.description}</p>}
                {route.adminFeedback && (
                  <div className="mt-2 text-xs bg-amber-500/10 text-amber-400 px-3 py-2 rounded-lg">
                    💬 Retour admin : {route.adminFeedback}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Create Route (Nouveau Parcours) ──────────────────────────────────
const ROUTE_DRAFT_KEY = "baymora_route_draft";
function CreateRoute({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem(ROUTE_DRAFT_KEY);
      if (saved) { const p = JSON.parse(saved); return p.form || { title: "", description: "", city: "", country: "France", category: "decouverte" as const, durationMinutes: 120, notes: "" }; }
    } catch {}
    return { title: "", description: "", city: "", country: "France", category: "decouverte" as const, durationMinutes: 120, notes: "" };
  });
  const [steps, setSteps] = useState<Array<{ order: number; establishmentName: string; type: string; address: string; notes: string; durationMinutes: number }>>(() => {
    try {
      const saved = localStorage.getItem(ROUTE_DRAFT_KEY);
      if (saved) { const p = JSON.parse(saved); return p.steps || []; }
    } catch {}
    return [];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Auto-save on every change
  const saveDraft = useCallback((f = form, s = steps) => {
    try {
      localStorage.setItem(ROUTE_DRAFT_KEY, JSON.stringify({ form: f, steps: s }));
      setLastSaved(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    } catch {}
  }, [form, steps]);

  const setFormSave = (updater: (p: typeof form) => typeof form) =>
    setForm(prev => { const next = updater(prev); setTimeout(() => saveDraft(next, steps), 0); return next; });
  const setStepsSave = (updater: (p: typeof steps) => typeof steps) =>
    setSteps(prev => { const next = updater(prev); setTimeout(() => saveDraft(form, next), 0); return next; });

  const createMutation = trpc.team.createRoute.useMutation({
    onSuccess: () => {
      toast.success("Parcours créé avec succès !");
      localStorage.removeItem(ROUTE_DRAFT_KEY);
      onDone();
    },
    onError: (e) => toast.error(e.message),
  });

  const addStep = () => setSteps(prev => [...prev, { order: prev.length + 1, establishmentName: "", type: "lieu", address: "", notes: "", durationMinutes: 30 }]);
  const removeStep = (i: number) => setSteps(prev => prev.filter((_, idx) => idx !== i));
  const updateStep = (i: number, field: string, value: string | number) => setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  const handleSubmit = async () => {
    if (!form.title || !form.city) return toast.error("Titre et ville requis");
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync({ ...form, steps, durationMinutes: form.durationMinutes });
    } finally { setIsSubmitting(false); }
  };

  const categoryOptions = [
    { value: "decouverte", label: "🗺️ Découverte de la ville" },
    { value: "gastronomie", label: "🍽️ Circuit gastronomique" },
    { value: "plages", label: "🏖️ Plages & balnéaire" },
    { value: "culture", label: "🏛️ Culture & patrimoine" },
    { value: "shopping", label: "🛍️ Shopping & boutiques" },
    { value: "nature", label: "🌿 Nature & randonnée" },
    { value: "nightlife", label: "🌙 Vie nocturne" },
    { value: "wellness", label: "🧖 Bien-être & spa" },
    { value: "business", label: "💼 Parcours business" },
    { value: "famille", label: "👨‍👩‍👧 Famille & enfants" },
    { value: "autre", label: "📋 Autre" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Créer un parcours local</h2>
        <p className="text-sm text-muted-foreground">Composez un itinéraire thématique avec plusieurs étapes dans une ville</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Titre du parcours *</label>
          <Input placeholder="Ex : Les incontournables de Barcelone" value={form.title} onChange={e => setFormSave(p => ({ ...p, title: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Ville *</label>
            <Input placeholder="Ex : Barcelone" value={form.city} onChange={e => setFormSave(p => ({ ...p, city: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Pays</label>
            <Input placeholder="Ex : Espagne" value={form.country} onChange={e => setFormSave(p => ({ ...p, country: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Catégorie</label>
            <select
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              value={form.category}
              onChange={e => setFormSave(p => ({ ...p, category: e.target.value as any }))}
            >
              {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Durée estimée (minutes)</label>
            <Input type="number" min={30} max={1440} value={form.durationMinutes} onChange={e => setFormSave(p => ({ ...p, durationMinutes: parseInt(e.target.value) || 120 }))} />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
          <Textarea placeholder="Décrivez ce parcours en quelques phrases..." value={form.description} onChange={e => setFormSave(p => ({ ...p, description: e.target.value }))} rows={3} />
        </div>
      </div>

      {/* Étapes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Étapes du parcours ({steps.length})</h3>
          <Button variant="outline" size="sm" onClick={addStep} className="gap-1 text-xs">
            <Plus className="w-3 h-3" /> Ajouter une étape
          </Button>
        </div>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="bg-card/20 border border-border/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-primary">Étape {i + 1}</span>
                <button onClick={() => removeStep(i)} className="text-muted-foreground hover:text-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <Input placeholder="Nom du lieu *" value={step.establishmentName} onChange={e => updateStep(i, "establishmentName", e.target.value)} className="text-sm" />
                </div>
                <Input placeholder="Adresse" value={step.address} onChange={e => updateStep(i, "address", e.target.value)} className="text-sm" />
                <Input type="number" placeholder="Durée (min)" value={step.durationMinutes} onChange={e => updateStep(i, "durationMinutes", parseInt(e.target.value) || 30)} className="text-sm" />
                <div className="col-span-2">
                  <Input placeholder="Notes / conseils" value={step.notes} onChange={e => updateStep(i, "notes", e.target.value)} className="text-sm" />
                </div>
              </div>
            </div>
          ))}
          {steps.length === 0 && (
            <div className="text-center py-6 border border-dashed border-border/30 rounded-xl">
              <p className="text-xs text-muted-foreground">Cliquez sur "Ajouter une étape" pour composer votre parcours</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Notes internes (optionnel)</label>
        <Textarea placeholder="Remarques, conseils pour l'admin..." value={form.notes} onChange={e => setFormSave(p => ({ ...p, notes: e.target.value }))} rows={2} />
      </div>

      {lastSaved && <p className="text-xs text-muted-foreground text-center">Brouillon sauvegardé automatiquement à {lastSaved}</p>}
      <Button onClick={handleSubmit} disabled={isSubmitting || !form.title || !form.city} className="w-full gap-2 bg-primary hover:bg-primary/90">
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        Soumettre le parcours
      </Button>
    </div>
  );
}

// ─── Operator Messages (Messagerie Admin ↔ Opérateur) ─────────────────
function OperatorMessages({ user }: { user: any }) {
  // L'opérateur terrain parle avec l'admin (owner)
  const { data: adminUser } = trpc.team.getAdminUser.useQuery();
  const adminUserId = adminUser?.id ?? 0;
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, refetch } = trpc.team.getMessages.useQuery(
    { withUserId: adminUserId },
    { refetchInterval: 15000, enabled: adminUserId > 0 }
  );

  const replyMutation = trpc.team.replyMessage.useMutation({
    onSuccess: () => { setNewMsg(""); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMsg.trim()) return;
    replyMutation.mutate({ toUserId: adminUserId, content: newMsg.trim() });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
      <div className="bg-card/20 border border-border/30 rounded-t-xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">A</div>
        <div>
          <p className="text-sm font-medium text-foreground">Direction Baymora</p>
          <p className="text-xs text-muted-foreground">Directives & coordination terrain</p>
        </div>
        <button onClick={() => refetch()} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-card/10 border-x border-border/30 p-4 space-y-3">
        {!messages || messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun message pour l'instant</p>
            <p className="text-xs text-muted-foreground mt-1">La direction vous enverra des directives ici</p>
          </div>
        ) : (
          (messages as any[]).map((msg: any) => {
            const isFromMe = msg.fromUserId === user.id;
            return (
              <div key={msg.id} className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                  isFromMe
                    ? "bg-primary/20 text-foreground rounded-br-sm"
                    : "bg-card/40 border border-border/30 text-foreground rounded-bl-sm"
                }`}>
                  <p>{msg.content}</p>
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    {!isFromMe && !msg.isRead && <span className="ml-1 text-amber-400">●</span>}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-card/20 border border-border/30 border-t-0 rounded-b-xl p-3 flex gap-2">
        <Input
          placeholder="Répondre à la direction..."
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          className="flex-1 text-sm"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!newMsg.trim() || replyMutation.isPending}
          className="bg-primary hover:bg-primary/90 px-3"
        >
          {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
