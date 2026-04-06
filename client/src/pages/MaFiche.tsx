import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  User, Heart, Car, Home, Plane, Palette, UtensilsCrossed,
  Eye, PawPrint, Users, Church, Crown, MapPin, Sparkles,
  ChevronRight, ChevronDown, Save, Trophy, Star, Check
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────
interface ProfileData {
  // Identité
  pseudo?: string;
  birthDate?: string;
  gender?: string;
  nationality?: string;
  locale?: string;
  // Morphologie
  height?: number;
  weight?: number;
  shoeSize?: string;
  clothingSizeTop?: string;
  clothingSizeBottom?: string;
  clothingSizeDress?: string;
  clothingSizeSuit?: string;
  ringSize?: string;
  // Permis
  drivingLicenses?: string[];
  drivingSide?: string;
  transmissionPref?: string;
  carPrefLuxury?: string[];
  carPrefDaily?: string[];
  // Logement
  homeCity?: string;
  homeAddress?: string;
  lodgingTypes?: string[];
  lodgingSettings?: string[];
  lodgingAmenities?: string[];
  lodgingLocation?: string[];
  transportPref?: string[];
  // Aéroport
  preferredAirport?: string;
  airportLounge?: boolean;
  priorityLane?: boolean;
  passportCountry?: string;
  seatPreference?: string;
  cabinClass?: string;
  frequentFlyerPrograms?: any[];
  // Style
  favoriteColors?: string[];
  favoriteBrands?: string[];
  favoriteShops?: string[];
  dresscode?: string;
  smoking?: string;
  ecofriendly?: boolean;
  // Gastronomie
  favoriteCuisines?: string[];
  favoriteDishes?: string[];
  dietRegime?: string[];
  dietAllergies?: string[];
  dietOther?: string;
  favoriteAlcohol?: string[];
  favoriteWines?: string[];
  coffeeTea?: string;
  // Santé
  visionStatus?: string;
  visionDetails?: string;
  healthConditions?: string[];
  handicap?: any;
  travelMobility?: string;
  sleepPreference?: string;
  tempPreference?: string;
  wellnessPrefs?: string[];
  // Animaux
  pets?: any[];
  // Famille
  relationshipStatus?: string;
  partnerGender?: string;
  partnerName?: string;
  partnerBirthDate?: string;
  children?: any[];
  closeFriends?: any[];
  // Religion
  religiousConsiderations?: string;
  // Clubs
  clubMemberships?: string[];
  privateAviation?: any;
  yachtBoat?: any;
  conciergePreference?: string;
  // Lieux
  favoriteCities?: string[];
  favoritePlaces?: any[];
  favoriteQuotes?: string[];
  bucketList?: string[];
  // Voyage
  travelStyles?: string[];
  travelBudget?: string;
  travelGroup?: string;
  languages?: string[];
  // Notes
  freeNotes?: string;
  // Gamification
  profileCompletionPct?: number;
  profilePointsEarned?: number;
}

// ─── Multi-Select Chip Component ────────────────────────────────────
function ChipSelect({ options, selected, onChange, label }: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  label: string;
}) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };
  return (
    <div className="space-y-2">
      <label className="text-sm text-white/60">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selected.includes(opt)
                ? "bg-amber-600/30 text-amber-400 border border-amber-500/50"
                : "bg-white/5 text-white/50 border border-white/10 hover:border-white/30"
            }`}
          >
            {selected.includes(opt) && <Check className="w-3 h-3 inline mr-1" />}
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Section Accordion ──────────────────────────────────────────────
function Section({ icon: Icon, title, children, completedFields, totalFields }: {
  icon: any;
  title: string;
  children: React.ReactNode;
  completedFields: number;
  totalFields: number;
}) {
  const [open, setOpen] = useState(false);
  const pct = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${pct === 100 ? 'bg-green-600/20 text-green-400' : 'bg-amber-600/20 text-amber-400'}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="font-medium text-white">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40">{pct}%</span>
          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
          </div>
          {open ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/40" />}
        </div>
      </button>
      {open && (
        <div className="p-4 pt-0 space-y-4 border-t border-white/5">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Input Field ────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-white/60">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
      />
    </div>
  );
}

// ─── Select Field ───────────────────────────────────────────────────
function SelectField({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-white/60">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white text-sm"
      >
        <option value="">Non renseigné</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Helper: parse JSON safely ──────────────────────────────────────
function parseJson(val: any, fallback: any = []) {
  if (!val) return fallback;
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

function countFilled(...values: any[]): number {
  return values.filter(v => {
    if (v === null || v === undefined || v === "" || v === false) return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  }).length;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function MaFiche() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ProfileData>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Load profile
  const { data: serverProfile, isLoading } = trpc.profileEnriched.get.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Save mutation
  const saveProfile = trpc.profileEnriched.update.useMutation({
    onSuccess: () => {
      toast.success("Fiche sauvegardée !");
      setHasChanges(false);
    },
    onError: () => {
      toast.error("Impossible de sauvegarder.");
    },
  });

  // Hydrate from server
  useEffect(() => {
    if (serverProfile) {
      setProfile({
        pseudo: serverProfile.pseudo || "",
        birthDate: serverProfile.birthDate || "",
        gender: serverProfile.gender || "",
        nationality: serverProfile.nationality || "",
        locale: serverProfile.locale || "fr",
        height: serverProfile.height || undefined,
        weight: serverProfile.weight || undefined,
        shoeSize: serverProfile.shoeSize || "",
        clothingSizeTop: serverProfile.clothingSizeTop || "",
        clothingSizeBottom: serverProfile.clothingSizeBottom || "",
        clothingSizeDress: serverProfile.clothingSizeDress || "",
        clothingSizeSuit: serverProfile.clothingSizeSuit || "",
        ringSize: serverProfile.ringSize || "",
        drivingLicenses: parseJson(serverProfile.drivingLicenses),
        drivingSide: serverProfile.drivingSide || "droite",
        transmissionPref: serverProfile.transmissionPref || "auto",
        carPrefLuxury: parseJson(serverProfile.carPrefLuxury),
        carPrefDaily: parseJson(serverProfile.carPrefDaily),
        homeCity: serverProfile.homeCity || "",
        homeAddress: serverProfile.homeAddress || "",
        lodgingTypes: parseJson(serverProfile.lodgingTypes),
        lodgingSettings: parseJson(serverProfile.lodgingSettings),
        lodgingAmenities: parseJson(serverProfile.lodgingAmenities),
        lodgingLocation: parseJson(serverProfile.lodgingLocation),
        transportPref: parseJson(serverProfile.transportPref),
        preferredAirport: serverProfile.preferredAirport || "",
        airportLounge: serverProfile.airportLounge || false,
        priorityLane: serverProfile.priorityLane || false,
        passportCountry: serverProfile.passportCountry || "",
        seatPreference: serverProfile.seatPreference || "",
        cabinClass: serverProfile.cabinClass || "",
        favoriteColors: parseJson(serverProfile.favoriteColors),
        favoriteBrands: parseJson(serverProfile.favoriteBrands),
        favoriteShops: parseJson(serverProfile.favoriteShops),
        dresscode: serverProfile.dresscode || "smart_casual",
        smoking: serverProfile.smoking || "non_fumeur",
        ecofriendly: serverProfile.ecofriendly || false,
        favoriteCuisines: parseJson(serverProfile.favoriteCuisines),
        favoriteDishes: parseJson(serverProfile.favoriteDishes),
        dietRegime: parseJson(serverProfile.dietRegime),
        dietAllergies: parseJson(serverProfile.dietAllergies),
        dietOther: serverProfile.dietOther || "",
        favoriteAlcohol: parseJson(serverProfile.favoriteAlcohol),
        favoriteWines: parseJson(serverProfile.favoriteWines),
        coffeeTea: serverProfile.coffeeTea || "",
        visionStatus: serverProfile.visionStatus || "",
        visionDetails: serverProfile.visionDetails || "",
        healthConditions: parseJson(serverProfile.healthConditions),
        travelMobility: serverProfile.travelMobility || "aucune",
        sleepPreference: serverProfile.sleepPreference || "",
        tempPreference: serverProfile.tempPreference || "",
        wellnessPrefs: parseJson(serverProfile.wellnessPrefs),
        pets: parseJson(serverProfile.pets),
        relationshipStatus: serverProfile.relationshipStatus || "",
        partnerGender: serverProfile.partnerGender || "",
        partnerName: serverProfile.partnerName || "",
        partnerBirthDate: serverProfile.partnerBirthDate || "",
        children: parseJson(serverProfile.children),
        closeFriends: parseJson(serverProfile.closeFriends),
        religiousConsiderations: serverProfile.religiousConsiderations || "",
        clubMemberships: parseJson(serverProfile.clubMemberships),
        conciergePreference: serverProfile.conciergePreference || "",
        favoriteCities: parseJson(serverProfile.favoriteCities),
        favoriteQuotes: parseJson(serverProfile.favoriteQuotes),
        bucketList: parseJson(serverProfile.bucketList),
        travelStyles: parseJson(serverProfile.travelStyles),
        travelBudget: serverProfile.travelBudget || "confort",
        travelGroup: serverProfile.travelGroup || "couple",
        languages: parseJson(serverProfile.languages),
        freeNotes: serverProfile.freeNotes || "",
        profileCompletionPct: serverProfile.profileCompletionPct || 0,
        profilePointsEarned: serverProfile.profilePointsEarned || 0,
      });
    }
  }, [serverProfile]);

  // Update helper
  const update = (key: string, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Calculate completion
  const totalSections = 12;
  const identityFilled = countFilled(profile.pseudo, profile.birthDate, profile.gender, profile.nationality);
  const morphoFilled = countFilled(profile.height, profile.weight, profile.shoeSize, profile.clothingSizeTop, profile.clothingSizeBottom);
  const permisFilled = countFilled(profile.drivingLicenses, profile.drivingSide, profile.transmissionPref);
  const logementFilled = countFilled(profile.homeCity, profile.lodgingTypes, profile.lodgingAmenities, profile.transportPref);
  const aeroFilled = countFilled(profile.preferredAirport, profile.passportCountry, profile.seatPreference, profile.cabinClass);
  const styleFilled = countFilled(profile.favoriteColors, profile.favoriteBrands, profile.dresscode);
  const gastroFilled = countFilled(profile.favoriteCuisines, profile.favoriteDishes, profile.dietRegime, profile.favoriteAlcohol);
  const santeFilled = countFilled(profile.visionStatus, profile.healthConditions, profile.wellnessPrefs);
  const animauxFilled = countFilled(profile.pets);
  const familleFilled = countFilled(profile.relationshipStatus, profile.partnerName, profile.children);
  const clubsFilled = countFilled(profile.clubMemberships, profile.conciergePreference);
  const lieuxFilled = countFilled(profile.favoriteCities, profile.favoriteQuotes, profile.bucketList);

  const totalPct = Math.round(
    ((identityFilled / 4) + (morphoFilled / 5) + (permisFilled / 3) + (logementFilled / 4) +
     (aeroFilled / 4) + (styleFilled / 3) + (gastroFilled / 4) + (santeFilled / 3) +
     (animauxFilled / 1) + (familleFilled / 3) + (clubsFilled / 2) + (lieuxFilled / 3)) / totalSections * 100
  );

  const handleSave = () => {
    // Serialize arrays to JSON strings for the backend
    const payload: any = { ...profile };
    const jsonFields = [
      'drivingLicenses', 'carPrefLuxury', 'carPrefDaily', 'lodgingTypes', 'lodgingSettings',
      'lodgingAmenities', 'lodgingLocation', 'transportPref', 'favoriteColors', 'favoriteBrands',
      'favoriteShops', 'favoriteCuisines', 'favoriteDishes', 'dietRegime', 'dietAllergies',
      'favoriteAlcohol', 'favoriteWines', 'healthConditions', 'wellnessPrefs', 'pets',
      'children', 'closeFriends', 'clubMemberships', 'favoriteCities', 'favoritePlaces',
      'favoriteQuotes', 'bucketList', 'travelStyles', 'languages', 'frequentFlyerPrograms'
    ];
    for (const f of jsonFields) {
      if (Array.isArray(payload[f])) {
        payload[f] = JSON.stringify(payload[f]);
      }
    }
    payload.profileCompletionPct = totalPct;
    saveProfile.mutate(payload);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-pulse text-white/40">Chargement de votre fiche...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <User className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Connectez-vous</h2>
          <p className="text-white/60">Pour accéder à votre fiche personnelle</p>
          <Button onClick={() => window.location.href = getLoginUrl()} className="bg-amber-600 hover:bg-amber-700">
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-24 lg:pb-8">
      {/* Header avec gamification */}
      <div className="sticky top-0 z-20 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-white/10 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Ma Fiche</h1>
            <p className="text-xs text-white/40">Plus vous remplissez, mieux ARIA vous connaît</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Points badge */}
            <div className="flex items-center gap-1 bg-amber-600/20 px-3 py-1 rounded-full">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-amber-400">+{totalPct} pts</span>
            </div>
            {/* Save button */}
            {hasChanges && (
              <Button
                onClick={handleSave}
                disabled={saveProfile.isPending}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Save className="w-4 h-4 mr-1" />
                {saveProfile.isPending ? "..." : "Sauver"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar global */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${totalPct}%` }}
            />
          </div>
          <span className="text-sm font-bold text-amber-400">{totalPct}%</span>
        </div>
        <p className="text-xs text-white/40 mb-4">
          {totalPct < 30 ? "Commencez à remplir votre fiche pour gagner des Baymora Points !" :
           totalPct < 70 ? "Beau travail ! Continuez pour débloquer des recommandations ultra-personnalisées." :
           totalPct < 100 ? "Presque complet ! ARIA va pouvoir vous surprendre." :
           "Fiche complète ! ARIA vous connaît parfaitement."}
        </p>
      </div>

      {/* Sections */}
      <div className="max-w-2xl mx-auto px-4 space-y-3">

        {/* 1. IDENTITÉ */}
        <Section icon={User} title="Identité" completedFields={identityFilled} totalFields={4}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pseudo" value={profile.pseudo || ""} onChange={v => update("pseudo", v)} placeholder="Votre pseudo" />
            <Field label="Date de naissance" value={profile.birthDate || ""} onChange={v => update("birthDate", v)} type="date" />
            <SelectField label="Genre" value={profile.gender || ""} onChange={v => update("gender", v)} options={[
              { value: "homme", label: "Homme" }, { value: "femme", label: "Femme" },
              { value: "non-binaire", label: "Non-binaire" }, { value: "autre", label: "Autre" }
            ]} />
            <Field label="Nationalité" value={profile.nationality || ""} onChange={v => update("nationality", v)} placeholder="Française" />
          </div>
          <ChipSelect label="Langues parlées" options={["Français", "Anglais", "Espagnol", "Italien", "Allemand", "Portugais", "Arabe", "Mandarin", "Japonais", "Russe"]}
            selected={profile.languages || []} onChange={v => update("languages", v)} />
        </Section>

        {/* 2. MORPHOLOGIE */}
        <Section icon={User} title="Morphologie & Tailles" completedFields={morphoFilled} totalFields={5}>
          <p className="text-xs text-amber-400/80 bg-amber-600/10 p-2 rounded">
            <Star className="w-3 h-3 inline mr-1" />
            Ces infos permettent à ARIA de réserver chez un tailleur ou commander pour vous.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Taille (cm)" value={profile.height?.toString() || ""} onChange={v => update("height", parseInt(v) || undefined)} type="number" placeholder="175" />
            <Field label="Poids (kg)" value={profile.weight?.toString() || ""} onChange={v => update("weight", parseInt(v) || undefined)} type="number" placeholder="75" />
            <Field label="Pointure" value={profile.shoeSize || ""} onChange={v => update("shoeSize", v)} placeholder="43" />
            <Field label="Taille haut" value={profile.clothingSizeTop || ""} onChange={v => update("clothingSizeTop", v)} placeholder="M, L, 40..." />
            <Field label="Taille bas" value={profile.clothingSizeBottom || ""} onChange={v => update("clothingSizeBottom", v)} placeholder="40, 42..." />
            <Field label="Taille robe/costume" value={profile.clothingSizeDress || ""} onChange={v => update("clothingSizeDress", v)} placeholder="38, 40..." />
            <Field label="Taille costume tailleur" value={profile.clothingSizeSuit || ""} onChange={v => update("clothingSizeSuit", v)} placeholder="50, 52..." />
            <Field label="Tour de doigt (bague)" value={profile.ringSize || ""} onChange={v => update("ringSize", v)} placeholder="54" />
          </div>
        </Section>

        {/* 3. PERMIS & CONDUITE */}
        <Section icon={Car} title="Permis & Conduite" completedFields={permisFilled} totalFields={3}>
          <ChipSelect label="Permis possédés" options={["B (voiture)", "A (moto)", "Bateau", "Jet-ski", "Hélicoptère", "Avion (PPL)", "Poids lourd"]}
            selected={profile.drivingLicenses || []} onChange={v => update("drivingLicenses", v)} />
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Conduite" value={profile.drivingSide || ""} onChange={v => update("drivingSide", v)} options={[
              { value: "droite", label: "Droite" }, { value: "gauche", label: "Gauche" }, { value: "les_deux", label: "Les deux" }
            ]} />
            <SelectField label="Boîte de vitesses" value={profile.transmissionPref || ""} onChange={v => update("transmissionPref", v)} options={[
              { value: "auto", label: "Automatique" }, { value: "manuel", label: "Manuel" }, { value: "indifferent", label: "Indifférent" }
            ]} />
          </div>
          <ChipSelect label="Voitures luxe préférées" options={["Mercedes", "BMW", "Porsche", "Ferrari", "Lamborghini", "Bentley", "Rolls-Royce", "Aston Martin", "Maserati", "Tesla"]}
            selected={profile.carPrefLuxury || []} onChange={v => update("carPrefLuxury", v)} />
          <ChipSelect label="Type de véhicule au quotidien" options={["SUV", "Berline", "Citadine", "Coupé", "Cabriolet", "Monospace", "Pick-up", "Électrique"]}
            selected={profile.carPrefDaily || []} onChange={v => update("carPrefDaily", v)} />
        </Section>

        {/* 4. LOGEMENT & HÉBERGEMENT */}
        <Section icon={Home} title="Logement & Hébergement" completedFields={logementFilled} totalFields={4}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ville de résidence" value={profile.homeCity || ""} onChange={v => update("homeCity", v)} placeholder="Bordeaux" />
            <Field label="Adresse" value={profile.homeAddress || ""} onChange={v => update("homeAddress", v)} placeholder="Optionnel" />
          </div>
          <ChipSelect label="Types d'hébergement préférés" options={["Hôtel", "Villa", "Appartement", "Palace", "Boutique hôtel", "Maison d'hôtes", "Chalet", "Riad", "Yacht"]}
            selected={profile.lodgingTypes || []} onChange={v => update("lodgingTypes", v)} />
          <ChipSelect label="Cadre préféré" options={["Ville", "Campagne", "Balnéaire", "Montagne", "Île", "Désert", "Forêt"]}
            selected={profile.lodgingSettings || []} onChange={v => update("lodgingSettings", v)} />
          <ChipSelect label="Équipements souhaités" options={["Piscine", "Spa", "Jacuzzi", "Salle de sport", "Plage privée", "Vue mer", "Terrasse", "Jardin", "Cuisine équipée", "Parking", "Ascenseur"]}
            selected={profile.lodgingAmenities || []} onChange={v => update("lodgingAmenities", v)} />
          <ChipSelect label="Emplacement" options={["Pied de plage", "Centre-ville", "Proche transports", "Calme / isolé", "Proche restaurants", "Vue panoramique"]}
            selected={profile.lodgingLocation || []} onChange={v => update("lodgingLocation", v)} />
          <ChipSelect label="Transport sur place" options={["Chauffeur privé", "Uber / VTC", "Transports en commun", "Location voiture", "Autonome (à pied)", "Un peu de tout"]}
            selected={profile.transportPref || []} onChange={v => update("transportPref", v)} />
        </Section>

        {/* 5. AÉROPORT & VOYAGE */}
        <Section icon={Plane} title="Aéroport & Voyage" completedFields={aeroFilled} totalFields={4}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Aéroport préféré" value={profile.preferredAirport || ""} onChange={v => update("preferredAirport", v)} placeholder="CDG, BOD, ORY..." />
            <Field label="Pays du passeport" value={profile.passportCountry || ""} onChange={v => update("passportCountry", v)} placeholder="France" />
            <SelectField label="Siège avion" value={profile.seatPreference || ""} onChange={v => update("seatPreference", v)} options={[
              { value: "fenetre", label: "Fenêtre" }, { value: "couloir", label: "Couloir" }, { value: "indifferent", label: "Indifférent" }
            ]} />
            <SelectField label="Classe" value={profile.cabinClass || ""} onChange={v => update("cabinClass", v)} options={[
              { value: "economie", label: "Économie" }, { value: "premium_eco", label: "Premium Éco" },
              { value: "business", label: "Business" }, { value: "premiere", label: "Première" }
            ]} />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-white/60">
              <input type="checkbox" checked={profile.airportLounge || false} onChange={e => update("airportLounge", e.target.checked)} className="accent-amber-500" />
              Salon VIP aéroport
            </label>
            <label className="flex items-center gap-2 text-sm text-white/60">
              <input type="checkbox" checked={profile.priorityLane || false} onChange={e => update("priorityLane", e.target.checked)} className="accent-amber-500" />
              File prioritaire
            </label>
          </div>
          <ChipSelect label="Style de voyage" options={["Détente", "Gastronomie", "Culture", "Aventure", "Romantique", "Business", "Wellness", "Shopping", "Fête", "Nature"]}
            selected={profile.travelStyles || []} onChange={v => update("travelStyles", v)} />
          <SelectField label="Budget voyage" value={profile.travelBudget || ""} onChange={v => update("travelBudget", v)} options={[
            { value: "economique", label: "Économique" }, { value: "confort", label: "Confort" },
            { value: "premium", label: "Premium" }, { value: "luxe", label: "Luxe" }, { value: "sans_limite", label: "Sans limite" }
          ]} />
        </Section>

        {/* 6. STYLE & GOÛTS */}
        <Section icon={Palette} title="Style & Goûts" completedFields={styleFilled} totalFields={3}>
          <ChipSelect label="Couleurs préférées" options={["Noir", "Blanc", "Bleu marine", "Or", "Bordeaux", "Vert", "Beige", "Gris", "Rose", "Rouge"]}
            selected={profile.favoriteColors || []} onChange={v => update("favoriteColors", v)} />
          <ChipSelect label="Marques préférées" options={["Hermès", "Louis Vuitton", "Chanel", "Gucci", "Dior", "Prada", "Balenciaga", "Rolex", "Cartier", "Brunello Cucinelli", "Loro Piana", "Tom Ford"]}
            selected={profile.favoriteBrands || []} onChange={v => update("favoriteBrands", v)} />
          <ChipSelect label="Boutiques préférées" options={["Le Bon Marché", "Harrods", "Bergdorf Goodman", "Galeries Lafayette", "Printemps", "Selfridges", "Saks Fifth Avenue"]}
            selected={profile.favoriteShops || []} onChange={v => update("favoriteShops", v)} />
          <SelectField label="Dress code habituel" value={profile.dresscode || ""} onChange={v => update("dresscode", v)} options={[
            { value: "casual", label: "Casual" }, { value: "smart_casual", label: "Smart Casual" },
            { value: "chic", label: "Chic" }, { value: "formel", label: "Formel" }
          ]} />
        </Section>

        {/* 7. GASTRONOMIE */}
        <Section icon={UtensilsCrossed} title="Gastronomie" completedFields={gastroFilled} totalFields={4}>
          <ChipSelect label="Cuisines préférées" options={["Française", "Japonaise", "Italienne", "Méditerranéenne", "Libanaise", "Indienne", "Mexicaine", "Thaïlandaise", "Coréenne", "Péruvienne", "Américaine"]}
            selected={profile.favoriteCuisines || []} onChange={v => update("favoriteCuisines", v)} />
          <ChipSelect label="Plats préférés" options={["Risotto", "Sushi", "Foie gras", "Tartare", "Pizza", "Pasta", "Steak", "Homard", "Ceviche", "Dim sum", "Ramen"]}
            selected={profile.favoriteDishes || []} onChange={v => update("favoriteDishes", v)} />
          <ChipSelect label="Régime alimentaire" options={["Végétarien", "Végan", "Halal", "Casher", "Sans gluten", "Sans lactose", "Pescetarien", "Flexitarien"]}
            selected={profile.dietRegime || []} onChange={v => update("dietRegime", v)} />
          <ChipSelect label="Allergies alimentaires" options={["Arachides", "Noix", "Gluten", "Lactose", "Fruits de mer", "Œufs", "Soja", "Sésame"]}
            selected={profile.dietAllergies || []} onChange={v => update("dietAllergies", v)} />
          <ChipSelect label="Alcools préférés" options={["Champagne", "Vin rouge", "Vin blanc", "Rosé", "Whisky", "Cognac", "Rhum", "Gin", "Vodka", "Cocktails", "Bière artisanale", "Aucun"]}
            selected={profile.favoriteAlcohol || []} onChange={v => update("favoriteAlcohol", v)} />
          <Field label="Café / Thé préféré" value={profile.coffeeTea || ""} onChange={v => update("coffeeTea", v)} placeholder="Espresso, Matcha, Earl Grey..." />
        </Section>

        {/* 8. SANTÉ */}
        <Section icon={Eye} title="Santé & Bien-être" completedFields={santeFilled} totalFields={3}>
          <SelectField label="Vision" value={profile.visionStatus || ""} onChange={v => update("visionStatus", v)} options={[
            { value: "bonne", label: "Bonne" }, { value: "lunettes", label: "Lunettes" },
            { value: "lentilles", label: "Lentilles" }, { value: "les_deux", label: "Lunettes + Lentilles" }
          ]} />
          <Field label="Détails vision" value={profile.visionDetails || ""} onChange={v => update("visionDetails", v)} placeholder="Correction, marque..." />
          <ChipSelect label="Conditions de santé" options={["Asthme", "Diabète", "Hypertension", "Allergies saisonnières", "Mal de mer", "Vertige", "Aucune"]}
            selected={profile.healthConditions || []} onChange={v => update("healthConditions", v)} />
          <SelectField label="Mobilité" value={profile.travelMobility || ""} onChange={v => update("travelMobility", v)} options={[
            { value: "aucune", label: "Aucune restriction" }, { value: "pmr", label: "PMR" },
            { value: "reduite", label: "Mobilité réduite" }, { value: "poussette", label: "Poussette" }
          ]} />
          <ChipSelect label="Bien-être" options={["Yoga", "Méditation", "Massage", "Fitness", "Natation", "Course", "Tennis", "Golf", "Pilates", "Boxe"]}
            selected={profile.wellnessPrefs || []} onChange={v => update("wellnessPrefs", v)} />
        </Section>

        {/* 9. ANIMAUX */}
        <Section icon={PawPrint} title="Animaux" completedFields={animauxFilled} totalFields={1}>
          <p className="text-xs text-white/40">Renseignez vos animaux pour que ARIA filtre automatiquement les lieux pet-friendly et prépare les documents vétérinaires.</p>
          {(profile.pets || []).map((pet: any, i: number) => (
            <div key={i} className="p-3 bg-white/5 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Nom" value={pet.name || ""} onChange={v => {
                  const pets = [...(profile.pets || [])];
                  pets[i] = { ...pets[i], name: v };
                  update("pets", pets);
                }} placeholder="Max" />
                <SelectField label="Type" value={pet.type || ""} onChange={v => {
                  const pets = [...(profile.pets || [])];
                  pets[i] = { ...pets[i], type: v };
                  update("pets", pets);
                }} options={[
                  { value: "chien", label: "Chien" }, { value: "chat", label: "Chat" },
                  { value: "autre", label: "Autre" }
                ]} />
                <Field label="Race" value={pet.race || ""} onChange={v => {
                  const pets = [...(profile.pets || [])];
                  pets[i] = { ...pets[i], race: v };
                  update("pets", pets);
                }} placeholder="Labrador" />
                <Field label="Poids (kg)" value={pet.weight?.toString() || ""} onChange={v => {
                  const pets = [...(profile.pets || [])];
                  pets[i] = { ...pets[i], weight: parseInt(v) || undefined };
                  update("pets", pets);
                }} type="number" placeholder="25" />
                <Field label="Vétérinaire" value={pet.vet?.name || ""} onChange={v => {
                  const pets = [...(profile.pets || [])];
                  pets[i] = { ...pets[i], vet: { ...(pets[i].vet || {}), name: v } };
                  update("pets", pets);
                }} placeholder="Dr Dupont" />
                <Field label="Tél vétérinaire" value={pet.vet?.phone || ""} onChange={v => {
                  const pets = [...(profile.pets || [])];
                  pets[i] = { ...pets[i], vet: { ...(pets[i].vet || {}), phone: v } };
                  update("pets", pets);
                }} placeholder="+33..." />
              </div>
              <Button variant="ghost" size="sm" className="text-red-400 text-xs" onClick={() => {
                const pets = [...(profile.pets || [])];
                pets.splice(i, 1);
                update("pets", pets);
              }}>Supprimer</Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-400" onClick={() => {
            update("pets", [...(profile.pets || []), { type: "chien", name: "", race: "" }]);
          }}>
            + Ajouter un animal
          </Button>
        </Section>

        {/* 10. FAMILLE */}
        <Section icon={Heart} title="Famille & Proches" completedFields={familleFilled} totalFields={3}>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Situation" value={profile.relationshipStatus || ""} onChange={v => update("relationshipStatus", v)} options={[
              { value: "celibataire", label: "Célibataire" }, { value: "couple", label: "En couple" },
              { value: "marie", label: "Marié(e)" }, { value: "pacse", label: "Pacsé(e)" },
              { value: "divorce", label: "Divorcé(e)" }, { value: "veuf", label: "Veuf/ve" }
            ]} />
            <SelectField label="Genre du partenaire" value={profile.partnerGender || ""} onChange={v => update("partnerGender", v)} options={[
              { value: "homme", label: "Homme" }, { value: "femme", label: "Femme" }, { value: "non-binaire", label: "Non-binaire" }
            ]} />
            <Field label="Nom du partenaire" value={profile.partnerName || ""} onChange={v => update("partnerName", v)} placeholder="Prénom" />
            <Field label="Anniversaire partenaire" value={profile.partnerBirthDate || ""} onChange={v => update("partnerBirthDate", v)} type="date" />
          </div>
          <p className="text-xs text-white/40 mt-2">Enfants :</p>
          {(profile.children || []).map((child: any, i: number) => (
            <div key={i} className="p-3 bg-white/5 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Prénom" value={child.name || ""} onChange={v => {
                  const c = [...(profile.children || [])];
                  c[i] = { ...c[i], name: v };
                  update("children", c);
                }} placeholder="Prénom" />
                <Field label="Âge" value={child.age?.toString() || ""} onChange={v => {
                  const c = [...(profile.children || [])];
                  c[i] = { ...c[i], age: parseInt(v) || undefined };
                  update("children", c);
                }} type="number" placeholder="8" />
                <Field label="Niveau scolaire" value={child.schoolLevel || ""} onChange={v => {
                  const c = [...(profile.children || [])];
                  c[i] = { ...c[i], schoolLevel: v };
                  update("children", c);
                }} placeholder="CE2, 6ème..." />
              </div>
              <Button variant="ghost" size="sm" className="text-red-400 text-xs" onClick={() => {
                const c = [...(profile.children || [])];
                c.splice(i, 1);
                update("children", c);
              }}>Supprimer</Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-400" onClick={() => {
            update("children", [...(profile.children || []), { name: "", age: undefined }]);
          }}>
            + Ajouter un enfant
          </Button>
        </Section>

        {/* 11. CLUBS & VIP */}
        <Section icon={Crown} title="Clubs & VIP" completedFields={clubsFilled} totalFields={2}>
          <ChipSelect label="Clubs & Memberships" options={["Soho House", "Club Med VIP", "Quintessentially", "John Paul", "Amex Centurion", "Priority Pass", "Virtuoso", "Relais & Châteaux", "Leading Hotels"]}
            selected={profile.clubMemberships || []} onChange={v => update("clubMemberships", v)} />
          <Field label="Conciergerie de préférence" value={profile.conciergePreference || ""} onChange={v => update("conciergePreference", v)} placeholder="Quintessentially, John Paul..." />
          <SelectField label="Religion / considérations" value={profile.religiousConsiderations || ""} onChange={v => update("religiousConsiderations", v)} options={[
            { value: "aucun", label: "Aucune" }, { value: "halal", label: "Halal" },
            { value: "casher", label: "Casher" }, { value: "autre", label: "Autre" }
          ]} />
        </Section>

        {/* 12. LIEUX & BUCKET LIST */}
        <Section icon={MapPin} title="Lieux & Bucket List" completedFields={lieuxFilled} totalFields={3}>
          <ChipSelect label="Villes préférées" options={["Paris", "New York", "Tokyo", "Londres", "Rome", "Barcelone", "Dubai", "Bali", "Marrakech", "Lisbonne", "Miami", "Los Angeles", "Bordeaux", "Nice"]}
            selected={profile.favoriteCities || []} onChange={v => update("favoriteCities", v)} />
          <div className="space-y-1">
            <label className="text-sm text-white/60">Citations préférées</label>
            <Textarea
              value={(profile.favoriteQuotes || []).join("\n")}
              onChange={e => update("favoriteQuotes", e.target.value.split("\n").filter(Boolean))}
              placeholder="Une citation par ligne..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[80px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-white/60">Bucket List (rêves de voyage)</label>
            <Textarea
              value={(profile.bucketList || []).join("\n")}
              onChange={e => update("bucketList", e.target.value.split("\n").filter(Boolean))}
              placeholder="Voir les aurores boréales&#10;Safari au Kenya&#10;..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[80px]"
            />
          </div>
        </Section>

        {/* Notes libres */}
        <div className="border border-white/10 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-medium text-white">Notes libres</span>
          </div>
          <Textarea
            value={profile.freeNotes || ""}
            onChange={e => { update("freeNotes", e.target.value); }}
            placeholder="Tout ce qu'ARIA devrait savoir sur vous..."
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[100px]"
          />
        </div>

        {/* Save floating button mobile */}
        {hasChanges && (
          <div className="fixed bottom-20 left-0 right-0 px-4 lg:hidden z-30">
            <Button
              onClick={handleSave}
              disabled={saveProfile.isPending}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/30"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveProfile.isPending ? "Sauvegarde..." : "Sauvegarder ma fiche"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
