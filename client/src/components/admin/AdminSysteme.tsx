import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminSysteme() {
  const { data: crons } = trpc.admin.getCronStatus.useQuery(undefined, { retry: false });
  const { data: manusStatus } = trpc.admin.getManusStatus.useQuery(undefined, { retry: false });
  const { data: envInfo } = trpc.admin.getEnvInfo.useQuery(undefined, { retry: false });
  const [manusTestResult, setManusTestResult] = useState<any>(null);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  const migrationMut = trpc.admin.runMigrations.useMutation({
    onSuccess: (d: any) => { setMigrationResult(d.results); toast.success("Migrations exécutées"); },
    onError: (e) => toast.error(e.message),
  });
  const manusTestMut = trpc.admin.testManusConnection.useMutation({
    onSuccess: (d) => { setManusTestResult(d); toast.success(d.success ? "Manus OK" : "Manus erreur"); },
    onError: (e) => { setManusTestResult({ error: e.message }); toast.error(e.message); },
  });

  return (
    <div>
      {/* MIGRATIONS */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>Migrations</h2>
        <button
          onClick={() => migrationMut.mutate()}
          disabled={migrationMut.isPending}
          className="text-xs px-4 py-2 rounded-lg font-semibold mb-4"
          style={{ background: "#C8A96E", color: "#1a1a1a" }}
        >
          {migrationMut.isPending ? "En cours..." : "Forcer les migrations"}
        </button>
        {migrationResult && (
          <div className="space-y-1">
            {(migrationResult as any[]).map((r: any) => (
              <div key={r.table} className="flex items-center gap-2 text-xs p-2 rounded" style={{ background: "#1a1a1a" }}>
                <div className="w-2 h-2 rounded-full" style={{ background: r.status === "ok" ? "#4ade80" : "#ef4444" }} />
                <span className="text-white font-mono">{r.table}</span>
                <span style={{ color: r.status === "ok" ? "#4ade80" : "#ef4444" }}>{r.status}</span>
                {r.error && <span className="text-red-400 text-[10px]">{r.error}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

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
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AGENTS */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>Agents</h2>
        <div className="space-y-2">
          <div className="p-4 rounded-lg" style={{ background: "#1a1a1a", border: "1px solid #333" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: (manusStatus as any)?.connected ? "#4ade80" : "#ef4444" }} />
              <span className="text-sm text-white">Manus API (SEO Scout)</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              {(manusStatus as any)?.connected ? "Connectée — api.manus.ai" : "MANUS_API_KEY non configurée"} — Profil : {(manusStatus as any)?.model || "manus-1.6"}
            </p>
            <button
              onClick={() => manusTestMut.mutate()}
              disabled={manusTestMut.isPending}
              className="text-[10px] px-3 py-1.5 rounded"
              style={{ border: "1px solid #C8A96E", color: "#C8A96E" }}
            >
              {manusTestMut.isPending ? "Test..." : "Tester Manus"}
            </button>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "#1a1a1a", border: "1px solid #333" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: (manusStatus as any)?.claudeConnected ? "#4ade80" : "#ef4444" }} />
              <span className="text-sm text-white">Claude API (Maya + Contenu)</span>
            </div>
            <p className="text-xs text-gray-500">
              {(manusStatus as any)?.claudeConnected ? "Connectée — Anthropic" : "ANTHROPIC_API_KEY non configurée"}
            </p>
          </div>
        </div>
        {manusTestResult && (
          <pre className="mt-3 text-[10px] leading-relaxed overflow-auto rounded-lg p-3" style={{ background: "#111", color: "#ccc", maxHeight: 250, border: "1px solid #333", whiteSpace: "pre-wrap" }}>
            {JSON.stringify(manusTestResult, null, 2)}
          </pre>
        )}
      </div>

      {/* LOGS */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>Logs</h2>
        <div className="p-6 rounded-lg text-center" style={{ background: "#1a1a1a", border: "1px solid #333" }}>
          <p className="text-sm text-gray-500">Logs — bientôt disponible</p>
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
