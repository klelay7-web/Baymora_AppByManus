/**
 * ─── Maison Baymora — BackNav ─────────────────────────────────────────────────
 * Composant de navigation avec flèche retour + breadcrumb + liens rapides admin.
 * À placer en haut de chaque page admin/dashboard pour une navigation fluide.
 */
import { useLocation } from "wouter";
import { ChevronLeft, Home, LayoutDashboard, BrainCircuit, Shield, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BackNavProps {
  /** Titre de la page courante */
  title: string;
  /** Icône optionnelle */
  icon?: React.ReactNode;
  /** Chemin de retour (défaut: auto-détecté) */
  backHref?: string;
  /** Label du bouton retour (défaut: "Retour") */
  backLabel?: string;
  /** Breadcrumb personnalisé */
  breadcrumb?: BreadcrumbItem[];
  /** Afficher les liens rapides admin */
  showAdminLinks?: boolean;
}

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
  { href: "/admin/command-center", label: "Salle de Réunion", icon: <BrainCircuit className="h-3.5 w-3.5" /> },
  { href: "/pilotage", label: "Pilotage", icon: <Shield className="h-3.5 w-3.5" /> },
  { href: "/team/fiches", label: "Terrain", icon: <MapPin className="h-3.5 w-3.5" /> },
];

export default function BackNav({
  title,
  icon,
  backHref,
  backLabel = "Retour",
  breadcrumb,
  showAdminLinks = true,
}: BackNavProps) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const handleBack = () => {
    if (backHref) {
      navigate(backHref);
    } else {
      // Auto-détection : remonter d'un niveau dans l'URL
      const parts = location.split("/").filter(Boolean);
      if (parts.length > 1) {
        navigate("/" + parts.slice(0, -1).join("/"));
      } else {
        navigate("/");
      }
    }
  };

  return (
    <div className="border-b border-white/5 bg-[#080c14]/80 backdrop-blur-sm sticky top-0 z-40">
      {/* Ligne principale */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Flèche retour */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-white/50 hover:text-white hover:bg-white/5 gap-1.5 rounded-sm px-2 shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-xs font-light">{backLabel}</span>
        </Button>

        {/* Séparateur */}
        <span className="text-white/20 text-xs">|</span>

        {/* Breadcrumb */}
        {breadcrumb ? (
          <nav className="flex items-center gap-1.5 text-xs text-white/40">
            <button onClick={() => navigate("/")} className="hover:text-white/70 transition-colors">
              <Home className="h-3 w-3" />
            </button>
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="text-white/20">/</span>
                {item.href ? (
                  <button
                    onClick={() => navigate(item.href!)}
                    className="hover:text-[#c8a94a] transition-colors"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="text-white/70">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : (
          <div className="flex items-center gap-2">
            {icon && <span className="text-[#c8a94a]">{icon}</span>}
            <h1 className="text-sm font-semibold text-white/90 tracking-wide">{title}</h1>
          </div>
        )}
      </div>

      {/* Liens rapides admin */}
      {showAdminLinks && isAdmin && (
        <div className="flex items-center gap-1 px-4 pb-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-white/30 hover:text-white/60 hover:bg-white/5 rounded-sm transition-colors whitespace-nowrap"
          >
            <Home className="h-3 w-3" />
            Accueil
          </button>
          {ADMIN_LINKS.map((link) => {
            const isActive = location === link.href || location.startsWith(link.href + "/");
            return (
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-sm transition-colors whitespace-nowrap ${
                  isActive
                    ? "text-[#c8a94a] bg-[#c8a94a]/10 border border-[#c8a94a]/20"
                    : "text-white/30 hover:text-white/60 hover:bg-white/5"
                }`}
              >
                {link.icon}
                {link.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
