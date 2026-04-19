import { trpc } from "@/lib/trpc";

export default function AdminSysteme() {
  const { data: crons } = trpc.admin.getCronStatus.useQuery(undefined, { retry: false });
  const { data: manusStatus } = trpc.admin.getManusStatus.useQuery(undefined, { retry: false });
  const { data: envInfo } = trpc.admin.getEnvInfo.useQuery(undefined, { retry: false });

  return (
    <div>
      {/* CRONS */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>Crons</h2>
        <div className="space-y-2">
          {(crons as any[] || []).map((c: any) => (
            <div key={c.name} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#1a1a1a", border: "1px solid #333" }}>
              <div>
                <p className="text-sm text-white">{c.name}</p>
                <p className="text-xs text-gray-500">{c.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: "#C8A96E" }}>{c.frequency}</p>
                <p className="text-[10px] text-gray-600">{c.lastRun ? new Date(c.lastRun).toLocaleString("fr-FR") : "Non tracké"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AGENTS */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>Agents</h2>
        <div className="p-4 rounded-lg" style={{ background: "#1a1a1a", border: "1px solid #333" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ background: (manusStatus as any)?.connected ? "#4ade80" : "#ef4444" }} />
            <span className="text-sm text-white">Manus / Claude API</span>
          </div>
          <p className="text-xs text-gray-500">
            {(manusStatus as any)?.connected ? "API connectée" : "API non configurée"} — Modèle : {(manusStatus as any)?.model || "claude-sonnet-4-20250514"}
          </p>
        </div>
      </div>

      {/* LOGS */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>Logs</h2>
        <div className="p-6 rounded-lg text-center" style={{ background: "#1a1a1a", border: "1px solid #333" }}>
          <p className="text-sm text-gray-500">Logs — bientôt disponible</p>
          <p className="text-xs text-gray-600 mt-1">Intégration Sentry / Railway logs prévue</p>
        </div>
      </div>

      {/* CONFIGURATION */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>Configuration</h2>
        <div className="space-y-2">
          {envInfo && Object.entries(envInfo as Record<string, unknown>).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#1a1a1a", border: "1px solid #333" }}>
              <span className="text-xs text-gray-400 font-mono">{key}</span>
              <span className="text-xs text-white">{typeof val === "boolean" ? (val ? "Oui" : "Non") : String(val)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
