import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  User, Heart, Compass, Users, Crown, CreditCard, Gift,
  Bell, Globe, Shield, LogOut, ChevronRight, Sparkles
} from "lucide-react";

export default function Profil() {
  const { user, loading } = useAuth();
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
            Connectez-vous pour acceder a votre profil
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
  const isFree = user.subscriptionTier === "free";
  const tierLabel = isFree ? "Decouverte" : user.subscriptionTier === "explorer" ? "Social Club" : "Premium";
  const creditsUsed = isFree ? 2 : 0;
  const creditsTotal = isFree ? 3 : 999;

  const MENU_SECTIONS = [
    {
      title: "Mon compte",
      items: [
        { icon: User, label: "Completer mon profil", desc: "Gouts, allergies, preferences", href: "#" },
        { icon: Compass, label: "Mes parcours", desc: "Voyages crees avec Maya", href: "/parcours" },
        { icon: Heart, label: "Mes collections", desc: "Favoris et lieux sauvegardes", href: "#" },
        { icon: Users, label: "Mes proches", desc: "Cercle familial et amis", href: "#" },
      ],
    },
    {
      title: "Forfait & credits",
      items: [
        { icon: Crown, label: "Mon forfait", desc: `Actuel : ${tierLabel}`, href: "#" },
        { icon: CreditCard, label: "Acheter des credits", desc: "Recharger votre solde", href: "#" },
        { icon: Gift, label: "Parrainer un ami", desc: "Gagnez 1 mois offert", href: "#" },
      ],
    },
    {
      title: "Parametres",
      items: [
        { icon: Bell, label: "Notifications", desc: "Alertes et rappels", href: "#" },
        { icon: Globe, label: "Langue", desc: "Francais", href: "#" },
        { icon: Shield, label: "Confidentialite", desc: "Gestion des donnees", href: "#" },
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
            <button
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "#161B26", border: "2px solid #070B14" }}
            >
              <User size={12} color="#C8A96E" />
            </button>
          </div>
          <h1 className="text-xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
            {user.name || user.email || "Membre"}
          </h1>
          <div
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: "rgba(200, 169, 110, 0.12)", color: "#C8A96E", border: "1px solid rgba(200, 169, 110, 0.25)" }}
          >
            {tierLabel}
          </div>
        </div>

        {/* Card credits */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.15)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} color="#C8A96E" />
              <span className="text-sm font-semibold" style={{ color: "#F0EDE6" }}>Credits Maya</span>
            </div>
            <span className="text-sm font-bold" style={{ color: "#C8A96E" }}>
              {isFree ? `${creditsTotal - creditsUsed} / ${creditsTotal}` : "Illimite"}
            </span>
          </div>
          {isFree && (
            <>
              <div className="h-2 rounded-full mb-3 overflow-hidden" style={{ background: "rgba(200, 169, 110, 0.12)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${((creditsTotal - creditsUsed) / creditsTotal) * 100}%`,
                    background: "linear-gradient(90deg, #C8A96E, #E8D5A8)",
                  }}
                />
              </div>
              <button
                className="w-full py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
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

        {/* Deconnexion */}
        <button
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium mt-2"
          style={{ background: "rgba(239, 68, 68, 0.08)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.15)" }}
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut size={16} />
          {logoutMutation.isPending ? "Deconnexion..." : "Se deconnecter"}
        </button>
      </div>
    </div>
  );
}
