import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";

export default function AdminDashboardContent() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/admin");
      return;
    }

    fetch("/api/auth/verify", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem("authToken");
          navigate("/admin");
        } else {
          setAuthorized(true);
        }
      })
      .catch(() => {
        localStorage.removeItem("authToken");
        navigate("/admin");
      });
  }, [navigate]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("authToken");
    navigate("/admin");
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Baymora Admin</h1>
            <p className="text-white/40 text-sm mt-1">Tableau de bord privé</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white/40 hover:text-white gap-2"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Clients actifs", value: "—", note: "Base de données à connecter" },
            { label: "Conversations", value: "—", note: "En mémoire" },
            { label: "Affiliations", value: "—", note: "Phase 2" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 border border-white/10 rounded-xl p-5"
            >
              <p className="text-white/40 text-sm">{stat.label}</p>
              <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
              <p className="text-white/20 text-xs mt-2">{stat.note}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-4 w-4 text-secondary" />
            <h2 className="text-white font-semibold">Prochaines étapes</h2>
          </div>
          <ul className="space-y-2 text-white/50 text-sm">
            <li>→ Connexion PostgreSQL (Phase 1)</li>
            <li>→ Intégration OpenAI / Claude (Phase 1)</li>
            <li>→ Gestion des partenaires et affiliations (Phase 2)</li>
            <li>→ Nourrir l'IA Baymora — destinations et prestataires (Phase 2)</li>
            <li>→ Analytics et suivi des conversions (Phase 3)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
