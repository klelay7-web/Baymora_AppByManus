import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, FileText, MapPin, Phone, Camera, Send, ChevronRight, ChevronLeft,
  Star, Trash2, Upload, Plane, Car, Building2, Sparkles, Clock, Eye,
  CheckCircle2, AlertTriangle, Loader2, X
} from "lucide-react";
import { toast } from "sonner";

const ESTABLISHMENT_TYPES = [
  { value: "clinique", label: "Clinique / Centre médical", icon: "🏥" },
  { value: "hotel", label: "Hôtel / Resort", icon: "🏨" },
  { value: "restaurant", label: "Restaurant", icon: "🍽️" },
  { value: "spa", label: "Spa / Wellness", icon: "🧖" },
  { value: "bar", label: "Bar / Lounge", icon: "🍸" },
  { value: "activite", label: "Activité / Excursion", icon: "🎯" },
  { value: "experience", label: "Expérience unique", icon: "✨" },
  { value: "transport", label: "Transport / Transfert", icon: "🚗" },
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

export default function TeamDashboard() {
  const { user } = useAuth();
  const [view, setView] = useState<"list" | "create">("list");

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

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary text-sm tracking-widest uppercase mb-1">Espace Équipe</p>
              <h1 className="text-3xl font-serif text-foreground">Rapports Terrain</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Documentez vos visites d'établissements pour enrichir le catalogue Baymora
              </p>
            </div>
            {view === "list" ? (
              <Button onClick={() => setView("create")} className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" /> Nouveau Rapport
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setView("list")} className="gap-2">
                <ChevronLeft className="w-4 h-4" /> Retour à la liste
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {view === "list" ? <ReportsList /> : <CreateReport onDone={() => setView("list")} />}
      </div>
    </div>
  );
}

// ─── Reports List ─────────────────────────────────────────────────────
function ReportsList() {
  const { data: reports, isLoading } = trpc.fieldReports.getMyReports.useQuery();

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
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {new Date(r.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
      ))}
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
