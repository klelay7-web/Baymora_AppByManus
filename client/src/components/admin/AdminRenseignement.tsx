import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminRenseignement() {
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [linksResult, setLinksResult] = useState<any[] | null>(null);

  const { data: findings } = trpc.manus.getSeoFindings.useQuery(undefined, { retry: false });
  const launchAudit = trpc.manus.launchSeoAudit.useMutation({
    onMutate: () => setAuditLoading(true),
    onSettled: () => setAuditLoading(false),
    onSuccess: (d: any) => { setAuditResult(`${d.processed} combinaisons traitées, ${d.findingsTotal} findings, ${d.inserted} insérés${d.errors?.length ? ` (${d.errors.length} erreurs)` : ""}`); toast.success("Audit terminé"); },
    onError: (e) => { toast.error(e.message); setAuditResult(`Erreur: ${e.message}`); },
  });
  const checkLinks = trpc.admin.checkOutboundLinks.useMutation({
    onSuccess: (d) => { setLinksResult(d); toast.success(`${d.length} liens cassés trouvés`); },
    onError: (e) => toast.error(e.message),
  });

  const TARGETS = [
    { url: "https://www.timeout.com/fr", name: "Timeout" },
    { url: "https://lefooding.com", name: "Le Fooding" },
    { url: "https://www.cntraveler.com", name: "Condé Nast" },
    { url: "https://www.tripadvisor.fr", name: "TripAdvisor" },
    { url: "https://www.infosbar.com", name: "Infosbar" },
    { url: "https://www.lonelyplanet.fr", name: "Lonely Planet" },
    { url: "https://www.sortiraparis.com", name: "Sortir à Paris" },
    { url: "https://www.thefork.fr", name: "TheFork" },
  ];
  const CITIES = ["Paris", "Bordeaux", "Lyon", "Nice", "Marseille", "Cannes", "Monaco", "Marrakech", "Barcelone", "Rome", "Londres", "New York", "Tokyo", "Bali"];

  return (
    <div>
      {/* AUDIT SEO */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>Audit SEO</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => launchAudit.mutate({ sites: TARGETS.map((t) => ({ url: t.url, name: t.name })), cities: ["Paris", "Bordeaux", "Lyon"], limit: 3 })}
            disabled={auditLoading}
            className="text-xs px-4 py-2 rounded-lg font-semibold"
            style={{ background: "#C8A96E", color: "#1a1a1a" }}
          >
            {auditLoading ? "Audit en cours..." : "Test rapide (3 combos)"}
          </button>
          <button
            onClick={() => launchAudit.mutate({ sites: TARGETS.map((t) => ({ url: t.url, name: t.name })), cities: CITIES })}
            disabled={auditLoading}
            className="text-xs px-4 py-2 rounded-lg"
            style={{ border: "1px solid #C8A96E", color: "#C8A96E" }}
          >
            {auditLoading ? "En cours..." : `Audit complet (${TARGETS.length} × ${CITIES.length} = ${TARGETS.length * CITIES.length} combos)`}
          </button>
        </div>
        {auditResult && <p className="text-xs mb-4" style={{ color: "#4ade80" }}>{auditResult}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ color: "#888", borderBottom: "1px solid #333" }}>
              <th className="text-left py-2 px-2">Source</th><th className="text-left py-2 px-2">Ville</th><th className="text-left py-2 px-2">Cat.</th><th className="text-left py-2 px-2">Intent</th><th className="py-2 px-2">Page</th>
            </tr></thead>
            <tbody>
              {(findings as any[] || []).slice(0, 50).map((f: any, i: number) => (
                <tr key={i} className="hover:bg-white/5" style={{ borderBottom: "1px solid #222" }}>
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
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">Aucun finding. Lancez un audit.</td></tr>
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

      {/* LIENS CASSÉS */}
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
