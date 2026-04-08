import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  User, Heart, Compass, Users, Crown, CreditCard, Gift,
  Bell, Globe, Shield, LogOut, ChevronRight, Sparkles, Zap
} from "lucide-react";

export default function Profil() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#070B14" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#C8A96E", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#070B14" }}>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
            Connectez-vous pour accéder à votre profil
          </h2>
          <Link href="/auth">
            <button className="px-6 py-3 rounded-full text-sm font-semibold" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}>
              Se connecter
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0] || "Membre";
  const initial = (user.name || user.email || "M")[0].toUpperCase();

  // Détection owner/admin
  const OWNER_EMAILS = ["k.lelay7@gmail.com", "klelay7@gmail.com"];
  const isOwner = OWNER_EMAILS.includes(user.email || "") || user.role === "admin";

  const isFree = !isOwner && user.subscriptionTier === "free";
  const tierLabel = isOwner ? "Admin" : isFree ? "Découverte" : user.subscriptionTier === "explorer" ? "Social Club" : "Illimité";

  // Crédits dynamiques
  const freeUsed = user.freeMessagesUsed ?? 0;
  const freeTotal = 3;
  const freeRemaining = Math.max(0, freeTotal - freeUsed);
  const creditPct = (freeRemaining / freeTotal) * 100;
  const creditColor = freeRemaining === 3 ? "#C8A96E"
    : freeRemaining === 2 ? "#C8A96E"
    : freeRemaining === 1 ? "#E8A040"
    : "#E85050";

  const MENU_SECTIONS = [
    {
      title: "Mon compte",
      items: [
        { icon: User, label: "Compléter mon profil", desc: "Goûts, allergies, préférences", href: "#" },
        { icon: Compass, label: "Mes parcours", desc: "Voyages créés avec Maya", href: "/parcours" },
        { icon: Heart, label: "Mes collections", desc: "Favoris et lieux sauvegardés", href: "#" },
        { icon: Users, label: "Mes proches", desc: "Cercle familial et amis", href: "#" },
      ],
    },
    {
      title: "Forfait & crédits",
      items: [
        { icon: Crown, label: "Mon forfait", desc: `Actuel : ${tierLabel}`, href: "/premium" },
        { icon: CreditCard, label: "Acheter des crédits", desc: "Recharger votre solde", href: "/premium" },
        { icon: Gift, label: "Parrainer un ami", desc: "Gagnez 1 mois offert", href: "#" },
      ],
    },
    {
      title: "Paramètres",
      items: [
        { icon: Bell, label: "Notifications", desc: "Alertes et rappels", href: "#" },
        { icon: Globe, label: "Langue", desc: "Français", href: "#" },
        { icon: Shield, label: "Confidentialité", desc: "Gestion des données", href: "#" },
      ],
    },
  ];

  return (
    <div style={{ background: "#070B14", color: "#F0EDE6", minHeight: "100vh" }}>
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-12">
        {/* Avatar + nom */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-3">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
              style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14", fontFamily: "'Playfair Display', serif" }}
            >
              {initial}
            </div>
            {isOwner && (
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}>
                <Zap size={12} color="#070B14" />
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
            {user.name || user.email || "Membre"}
          </h1>
          <div
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: isOwner ? "linear-gradient(135deg, rgba(200,169,110,0.2), rgba(232,213,168,0.2))" : "rgba(200, 169, 110, 0.12)",
              color: "#C8A96E",
              border: isOwner ? "1px solid rgba(200, 169, 110, 0.5)" : "1px solid rgba(200, 169, 110, 0.25)"
            }}
          >
            {isOwner ? "⚡ Admin — Accès illimité" : tierLabel}
          </div>
        </div>

        {/* Card crédits */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.15)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} color="#C8A96E" />
              <span className="text-sm font-semibold" style={{ color: "#F0EDE6" }}>Crédits Maya</span>
            </div>
            <span className="text-sm font-bold" style={{ color: isOwner ? "#C8A96E" : creditColor }}>
              {isOwner ? "Illimité ∞" : `${freeRemaining} / ${freeTotal}`}
            </span>
          </div>

          {isOwner ? (
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(200, 169, 110, 0.12)" }}>
              <div className="h-full rounded-full w-full" style={{ background: "linear-gradient(90deg, #C8A96E, #E8D5A8)" }} />
            </div>
          ) : (
            <>
              <div className="h-2 rounded-full mb-3 overflow-hidden" style={{ background: "rgba(200, 169, 110, 0.12)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${creditPct}%`, background: `linear-gradient(90deg, ${creditColor}, ${creditColor}dd)` }}
                />
              </div>
              <button
                className={`w-full py-2.5 rounded-xl text-sm font-semibold ${freeRemaining === 0 ? "animate-pulse-gold" : ""}`}
                style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
                onClick={() => navigate("/premium")}
              >
                Passer au Social Club — 9,90€/mois
              </button>
            </>
          )}
        </div>

        {/* Sections menu */}
        {MENU_SECTIONS.map((section) => (
          <div key={section.title} className="mb-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: "#8B8D94" }}>
              {section.title}
            </h2>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.1)" }}
            >
              {section.items.map((item, i) => {
                const Icon = item.icon;
                const isLast = i === section.items.length - 1;
                return (
                  <Link key={item.label} href={item.href}>
                    <div
                      className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
                      style={{ borderBottom: isLast ? "none" : "1px solid rgba(200, 169, 110, 0.06)" }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(200, 169, 110, 0.08)" }}
                      >
                        <Icon size={16} color="#C8A96E" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium" style={{ color: "#F0EDE6" }}>{item.label}</div>
                        <div className="text-xs" style={{ color: "#8B8D94" }}>{item.desc}</div>
                      </div>
                      <ChevronRight size={14} color="#8B8D94" className="flex-shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Déconnexion */}
        <button
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium mt-2"
          style={{ background: "rgba(239, 68, 68, 0.08)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.15)" }}
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut size={16} />
          {logoutMutation.isPending ? "Déconnexion..." : "Se déconnecter"}
        </button>

        {/* Footer enrichi */}
        <div className="mt-10 pt-6" style={{ borderTop: "1px solid rgba(200, 169, 110, 0.08)" }}>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#C8A96E" }}>Maison Baymora</p>
              <div className="space-y-1.5">
                {["Maya IA", "Offres", "Forfaits"].map(l => (
                  <p key={l}><a href="#" className="text-xs" style={{ color: "#8B8D94" }}>{l}</a></p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#C8A96E" }}>Support</p>
              <div className="space-y-1.5">
                {["Aide & FAQ", "Contact", "Devenir partenaire"].map(l => (
                  <p key={l}><a href="#" className="text-xs" style={{ color: "#8B8D94" }}>{l}</a></p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#C8A96E" }}>Légal</p>
              <div className="space-y-1.5">
                {["Mentions légales", "Confidentialité", "CGU"].map(l => (
                  <p key={l}><a href="#" className="text-xs" style={{ color: "#8B8D94" }}>{l}</a></p>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-center" style={{ color: "rgba(139, 141, 148, 0.5)" }}>
            © 2026 Maison Baymora — Social club virtuel premium
          </p>
        </div>
      </div>
    </div>
  );
}
