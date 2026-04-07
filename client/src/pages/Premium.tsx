import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Crown, Star, Zap, Users, Route, Heart, Settings,
  ArrowRight, Lock, Gift, CreditCard, Sparkles
} from "lucide-react";

const QUICK_LINKS = [
  { path: "/mon-espace", icon: Star, label: "Mon Espace", desc: "Tableau de bord complet" },
  { path: "/mes-parcours", icon: Route, label: "Mes Parcours", desc: "Brouillons et enregistrés" },
  { path: "/profile", icon: Users, label: "Mon Profil", desc: "Préférences et proches" },
  { path: "/pricing", icon: CreditCard, label: "Gérer mon forfait", desc: "Crédits, recharges, upgrade" },
  { path: "/ambassadeur-info", icon: Gift, label: "Parrainage", desc: "Inviter et gagner des crédits" },
];

export default function Premium() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center mb-6">
          <Lock size={32} className="text-amber-400" />
        </div>
        <h1 className="text-white text-xl font-semibold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Espace Premium
        </h1>
        <p className="text-white/50 text-sm mb-8 max-w-xs">
          Connectez-vous pour accéder à votre espace personnel, vos parcours et vos avantages.
        </p>
        <a
          href={getLoginUrl("/premium")}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-semibold text-sm hover:shadow-lg hover:shadow-amber-500/20 transition-all"
        >
          Se connecter
        </a>
        <Link href="/pricing">
          <span className="mt-4 text-amber-400/70 text-xs hover:text-amber-400 transition-colors cursor-pointer">
            Découvrir les forfaits
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 pt-4 pb-24">
      {/* Header profil */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-xl font-bold text-black shrink-0">
          {(user.name || user.email || "?")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-semibold text-lg truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
            {user.name || "Membre"}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Crown size={12} className="text-amber-400" />
            <span className="text-amber-400/70 text-xs">Compte Gratuit</span>
          </div>
        </div>
        <Link href="/pricing">
          <button className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400/10 to-orange-500/10 border border-amber-400/20 text-amber-400 text-xs font-medium hover:border-amber-400/40 transition-colors">
            <Zap size={12} className="inline mr-1" />
            Upgrade
          </button>
        </Link>
      </div>

      {/* Crédits rapide */}
      <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/50 text-xs uppercase tracking-wider">Mes crédits</span>
          <Sparkles size={14} className="text-amber-400/50" />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-white text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>0</span>
          <span className="text-white/30 text-sm mb-1">crédits restants</span>
        </div>
        <div className="mt-4 flex gap-2">
          <Link href="/pricing">
            <button className="px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-medium hover:bg-amber-400/15 transition-colors">
              Recharger
            </button>
          </Link>
          <Link href="/pricing">
            <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/8 text-white/60 text-xs font-medium hover:bg-white/8 transition-colors">
              Voir les forfaits
            </button>
          </Link>
        </div>
      </div>

      {/* Raccourcis */}
      <h2 className="text-white/40 text-xs font-medium tracking-widest uppercase mb-3 px-1">
        Accès rapide
      </h2>
      <div className="space-y-2">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.path} href={link.path}>
              <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/90 text-sm font-medium">{link.label}</p>
                  <p className="text-white/35 text-xs mt-0.5">{link.desc}</p>
                </div>
                <ArrowRight size={14} className="text-white/15 group-hover:text-white/40 transition-colors shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
