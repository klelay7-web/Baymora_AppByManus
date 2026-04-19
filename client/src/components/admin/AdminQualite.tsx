import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminQualite() {
  const { data: convStats } = trpc.admin.getConversationStats.useQuery(undefined, { retry: false });
  const { data: incomplete, refetch } = trpc.admin.getIncompleteEstablishments.useQuery(undefined, { retry: false });
  const { data: promptPreview } = trpc.admin.getSystemPromptPreview.useQuery(undefined, { retry: false });
  const enrichMut = trpc.admin.enrichEstablishment.useMutation({ onSuccess: () => { toast.success("Enrichi"); refetch(); }, onError: (e) => toast.error(e.message) });

  return (
    <div>
      {/* MAYA MONITORING */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>Maya — Dernières conversations</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ color: "#888", borderBottom: "1px solid #333" }}>
              <th className="text-left py-2 px-2">ID</th><th className="text-left py-2 px-2">User</th><th className="text-left py-2 px-2">Messages</th><th className="text-left py-2 px-2">Status</th><th className="text-left py-2 px-2">Date</th>
            </tr></thead>
            <tbody>
              {(convStats as any[] || []).map((c: any) => (
                <tr key={c.id} className="hover:bg-white/5" style={{ borderBottom: "1px solid #222" }}>
                  <td className="py-2 px-2 text-gray-400">#{c.id}</td>
                  <td className="py-2 px-2 text-white">User #{c.userId}</td>
                  <td className="py-2 px-2">
                    <span style={{ color: (c.msgCount || 0) > 8 ? "#ef4444" : "#C8A96E" }}>{c.msgCount || 0}</span>
                    {(c.msgCount || 0) > 8 && <span className="text-[10px] ml-1 text-red-400">trop</span>}
                  </td>
                  <td className="py-2 px-2 text-gray-400">{c.status}</td>
                  <td className="py-2 px-2 text-gray-400">{c.createdAt ? new Date(c.createdAt).toLocaleDateString("fr-FR") : "—"}</td>
                </tr>
              ))}
              {(!convStats || (convStats as any[]).length === 0) && <tr><td colSpan={5} className="py-8 text-center text-gray-500">Aucune conversation</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* FICHES INCOMPLÈTES */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>Fiches incomplètes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ color: "#888", borderBottom: "1px solid #333" }}>
              <th className="text-left py-2 px-2">Nom</th><th className="text-left py-2 px-2">Ville</th><th className="text-left py-2 px-2">Cat.</th><th className="text-left py-2 px-2">Statut</th><th className="py-2 px-2"></th>
            </tr></thead>
            <tbody>
              {(incomplete as any[] || []).map((e: any) => (
                <tr key={e.id} className="hover:bg-white/5" style={{ borderBottom: "1px solid #222" }}>
                  <td className="py-2 px-2 text-white">{e.name}</td>
                  <td className="py-2 px-2 text-gray-400">{e.city}</td>
                  <td className="py-2 px-2 text-gray-400">{e.category}</td>
                  <td className="py-2 px-2"><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>{e.enrichStatus || "manque"}</span></td>
                  <td className="py-2 px-2"><button onClick={() => enrichMut.mutate({ id: e.id })} disabled={enrichMut.isPending} className="text-[10px] px-2 py-1 rounded" style={{ border: "1px solid #C8A96E", color: "#C8A96E" }}>Enrichir</button></td>
                </tr>
              ))}
              {(!incomplete || (incomplete as any[]).length === 0) && <tr><td colSpan={5} className="py-8 text-center" style={{ color: "#4ade80" }}>Toutes les fiches sont complètes</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* SYSTEM PROMPT MAYA */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>System Prompt Maya</h2>
        <pre
          className="text-xs leading-relaxed overflow-auto rounded-lg p-4"
          style={{ background: "#111", color: "#ccc", maxHeight: 400, border: "1px solid #333", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        >
          {typeof promptPreview === "string" ? promptPreview : "Chargement..."}
        </pre>
      </div>
    </div>
  );
}
