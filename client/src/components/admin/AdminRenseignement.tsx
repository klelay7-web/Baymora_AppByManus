import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminRenseignement() {
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);
  const [linksResult, setLinksResult] = useState<any[] | null>(null);

  const { data: findings, refetch: refetchFindings } = trpc.manus.getSeoFindings.useQuery(undefined, { retry: false });
  const { data: auditStatus } = trpc.manus.getAuditStatus.useQuery(undefined, {
    enabled: auditRunning,
    refetchInterval: auditRunning ? 5000 : false,
  });

  const launchAudit = trpc.manus.launchSeoAudit.useMutation({
    onSuccess: (d: any) => {
      setAuditRunning(true);
      setAuditMessage(d.message || "Audit lancé");
      toast.success("Audit lancé en arrière-plan");
    },
    onError: (e) => { toast.error(e.message); setAuditMessage(`Erreur: ${e.message}`); },
  });
  const checkLinks = trpc.admin.checkOutboundLinks.useMutation({
    onSuccess: (d) => { setLinksResult(d); toast.success(`${d.length} liens cassés`); },
    onError: (e) => toast.error(e.message),
  });

  // Stop polling after 10 minutes
  useEffect(() => {
    if (!auditRunning) return;
    const timeout = setTimeout(() => { setAuditRunning(false); refetchFindings(); }, 600000);
    return () => clearTimeout(timeout);
  }, [auditRunning, refetchFindings]);

  const TARGETS = [
    { url: "https://www.timeout.com/fr", name: "Timeout" },
    { url: "https://lefooding.com", name: "Le Fooding" },
    { url: "https://www.tripadvisor.fr", name: "TripAdvisor" },
  ];
  const TEST_CITIES = ["Paris", "Bordeaux", "Lyon"];
  const ALL_CITIES = ["Paris", "Bordeaux", "Lyon", "Nice", "Marseille", "Cannes", "Monaco", "Marrakech", "Barcelone", "Rome", "Londres", "New York", "Tokyo", "Bali"];

  return (
    <div>
      {/* AUDIT SEO */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>Audit SEO (Manus API)</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => launchAudit.mutate({ sites: TARGETS.map((t) => ({ url: t.url, name: t.name })), cities: TEST_CITIES, limit: 3 })}
            disabled={launchAudit.isPending || auditRunning}
            className="text-xs px-4 py-2 rounded-lg font-semibold"
            style={{ background: "#C8A96E", color: "#1a1a1a" }}
          >
            {launchAudit.isPending ? "Lancement..." : "Test rapide (3 combos)"}
          </button>
          <button
            onClick={() => launchAudit.mutate({ sites: TARGETS.map((t) => ({ url: t.url, name: t.name })), cities: TEST_CITIES })}
            disabled={launchAudit.isPending || auditRunning}
            className="text-xs px-4 py-2 rounded-lg"
            style={{ border: "1px solid #C8A96E", color: "#C8A96E" }}
          >
            3 sites × 3 villes
          </button>
          {auditRunning && (
            <button
              onClick={() => { setAuditRunning(false); refetchFindings(); }}
              className="text-xs px-4 py-2 rounded-lg"
              style={{ border: "1px solid #ef4444", color: "#ef4444" }}
            >
              Arrêter le polling
            </button>
          )}
        </div>

        {auditRunning && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg" style={{ background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)" }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#C8A96E" }} />
            <span className="text-xs" style={{ color: "#C8A96E" }}>
              Audit en cours... {(auditStatus as any)?.findingsCount || 0} findings trouvés
            </span>
          </div>
        )}
        {auditMessage && !auditRunning && <p className="text-xs mb-4" style={{ color: "#4ade80" }}>{auditMessage}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ color: "#888", borderBottom: "1px solid #333" }}>
              <th className="text-left py-2 px-2">Source</th><th className="text-left py-2 px-2">Ville</th><th className="text-left py-2 px-2">Cat.</th><th className="text-left py-2 px-2">Intent</th><th className="py-2 px-2">Page</th>
            </tr></thead>
            <tbody>
              {(findings as any[] || []).slice(0, 50).map((f: any, i: number) => (
                <tr key={f.id || i} className="hover:bg-white/5" style={{ borderBottom: "1px solid #222" }}>
                  <td className="py-2 px-2 text-white">{f.source}</td>
                  <td className="py-2 px-2 text-gray-400">{f.city}</td>
                  <td className="py-2 px-2 text-gray-400">{f.category}</td>
                  <td className="py-2 px-2 text-gray-400 max-w-[200px] truncate">{f.searchIntent}</td>
                  <td className="py-2 px-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: f.contentPageGenerated ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)", color: f.contentPageGenerated ? "#4ade80" : "#ef4444" }}>
                      {f.contentPageGenerated ? "Oui" : "Non"}
                    </span>
                  </td>
                </tr>
              ))}
              {(!findings || (findings as any[]).length === 0) && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">Aucun finding. Lancez un audit ou forcez les migrations dans l'onglet Système.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TROUS SEO */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>Trous SEO</h2>
        <p className="text-xs" style={{ color: "#888" }}>Analyse des trous — bientôt disponible</p>
      </div>

      {/* LIENS */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>Vérification liens</h2>
        <button
          onClick={() => checkLinks.mutate()}
          disabled={checkLinks.isPending}
          className="text-xs px-4 py-2 rounded-lg mb-4"
          style={{ border: "1px solid #C8A96E", color: "#C8A96E" }}
        >
          {checkLinks.isPending ? "Vérification..." : "Vérifier tous les liens"}
        </button>
        {linksResult && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr style={{ color: "#888", borderBottom: "1px solid #333" }}>
                <th className="text-left py-2 px-2">Établissement</th><th className="text-left py-2 px-2">URL</th><th className="text-left py-2 px-2">Statut</th>
              </tr></thead>
              <tbody>
                {linksResult.map((l, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #222" }}>
                    <td className="py-2 px-2 text-white">{l.name}</td>
                    <td className="py-2 px-2 text-gray-400 max-w-[250px] truncate">{l.url}</td>
                    <td className="py-2 px-2" style={{ color: "#ef4444" }}>{l.status}</td>
                  </tr>
                ))}
                {linksResult.length === 0 && <tr><td colSpan={3} className="py-4 text-center" style={{ color: "#4ade80" }}>Tous les liens fonctionnent</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
