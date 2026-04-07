import { useState } from "react";
import { Link } from "wouter";
import {
  Home, Sparkles, Tag, Gift, Crown, User, MapPin, Heart,
  Route, Settings, Users, Star, Search, X, ArrowRight
} from "lucide-react";

const SECTIONS = [
  { path: "/", icon: Home, label: "Accueil", desc: "Page principale Maison Baymora", color: "amber" },
  { path: "/chat", icon: Sparkles, label: "IA Maya", desc: "Votre assistante de voyage personnelle", color: "amber" },
  { path: "/mes-parcours", icon: Route, label: "Mes Parcours", desc: "Brouillons, enregistrés, actifs", color: "amber" },
  { path: "/offres", icon: Tag, label: "Offres avec remises", desc: "Hébergements et expériences à prix réduit", color: "orange" },
  { path: "/bundles", icon: Gift, label: "Bundles à découvrir", desc: "Sélections inspirantes et thématiques", color: "orange" },
  { path: "/discover", icon: MapPin, label: "Destinations", desc: "Explorer les fiches et établissements", color: "blue" },
  { path: "/pricing", icon: Crown, label: "Forfaits Premium", desc: "Social Club, Club Privé et crédits", color: "purple" },
  { path: "/profile", icon: User, label: "Mon Profil", desc: "Informations, préférences, proches", color: "green" },
  { path: "/mon-espace", icon: Star, label: "Mon Espace", desc: "Tableau de bord, favoris, conversations", color: "cyan" },
  { path: "/ambassadeur-info", icon: Users, label: "Programme Ambassadeur", desc: "Parrainage et commissions", color: "pink" },
  { path: "/services", icon: Settings, label: "Nos Services", desc: "Conciergerie, parcours, off-market", color: "slate" },
];

const COLOR_MAP: Record<string, string> = {
  amber: "bg-amber-400/10 text-amber-400",
  orange: "bg-orange-400/10 text-orange-400",
  blue: "bg-blue-400/10 text-blue-400",
  purple: "bg-purple-400/10 text-purple-400",
  green: "bg-emerald-400/10 text-emerald-400",
  cyan: "bg-cyan-400/10 text-cyan-400",
  pink: "bg-pink-400/10 text-pink-400",
  slate: "bg-slate-400/10 text-slate-400",
};

export default function Rechercher() {
  const [query, setQuery] = useState("");

  const filtered = SECTIONS.filter(
    (s) =>
      s.label.toLowerCase().includes(query.toLowerCase()) ||
      s.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 pt-4 pb-24">
      {/* Barre de recherche */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une section..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-10 py-3.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-400/40 transition-colors"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Titre */}
      <h2 className="text-white/40 text-xs font-medium tracking-widest uppercase mb-4 px-1">
        {query ? `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}` : "Toutes les sections"}
      </h2>

      {/* Liste des sections */}
      <div className="space-y-2">
        {filtered.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.path} href={section.path}>
              <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all group cursor-pointer">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${COLOR_MAP[section.color]}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/90 text-sm font-medium">{section.label}</p>
                  <p className="text-white/35 text-xs mt-0.5 truncate">{section.desc}</p>
                </div>
                <ArrowRight size={14} className="text-white/15 group-hover:text-white/40 transition-colors shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-white/20">
          <Search size={40} className="mb-4 opacity-30" />
          <p className="text-sm">Aucune section trouvée</p>
          <p className="text-xs mt-1">Essayez un autre terme de recherche</p>
        </div>
      )}
    </div>
  );
}
