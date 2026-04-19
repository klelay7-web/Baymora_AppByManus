import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminMembres() {
  const [tierFilter, setTierFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creditAmount, setCreditAmount] = useState("10");

  const { data: members, refetch } = trpc.admin.listMembers.useQuery({
    tier: tierFilter || undefined,
    search: search || undefined,
    limit: 50,
  });
  const { data: detail } = trpc.admin.getMemberDetail.useQuery(
    { userId: selectedId! },
    { enabled: !!selectedId }
  );
  const { data: payments } = trpc.admin.getRecentPayments.useQuery(undefined, { retry: false });
  const tierMut = trpc.admin.updateMemberTier.useMutation({ onSuccess: () => { toast.success("Tier mis à jour"); refetch(); }, onError: (e) => toast.error(e.message) });
  const creditMut = trpc.admin.grantCredits.useMutation({ onSuccess: (d) => { toast.success(`Crédits ajoutés. Solde: ${d.newBalance}`); refetch(); }, onError: (e) => toast.error(e.message) });
  const blockMut = trpc.admin.toggleMemberBlock.useMutation({ onSuccess: (d) => { toast.success(`Rôle: ${d.newRole}`); refetch(); }, onError: (e) => toast.error(e.message) });

  const TIER_LABELS: Record<string, string> = { free: "Invité", explorer: "Membre", premium: "Duo", elite: "Cercle" };

  return (
    <div>
      {/* FILTERS */}
      <div className="flex flex-wrap gap-2 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher email ou nom..."
          className="text-xs px-3 py-2 rounded-lg flex-1 min-w-[200px]"
          style={{ background: "#111", border: "1px solid #333", color: "#fff" }}
        />
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="text-xs px-3 py-2 rounded-lg" style={{ background: "#111", border: "1px solid #333", color: "#fff" }}>
          <option value="">Tous les tiers</option>
          <option value="free">Invité</option>
          <option value="explorer">Membre</option>
          <option value="premium">Duo</option>
          <option value="elite">Cercle</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-xs">
          <thead><tr style={{ color: "#888", borderBottom: "1px solid #333" }}>
            <th className="text-left py-2 px-2">Email</th><th className="text-left py-2 px-2">Nom</th><th className="text-left py-2 px-2">Tier</th><th className="text-left py-2 px-2">Ville</th><th className="text-left py-2 px-2">Crédits</th><th className="text-left py-2 px-2">Inscrit</th>
          </tr></thead>
          <tbody>
            {(members as any[] || []).map((m: any) => (
              <tr key={m.id} className="hover:bg-white/5 cursor-pointer" style={{ borderBottom: "1px solid #222" }} onClick={() => setSelectedId(m.id)}>
                <td className="py-2 px-2 text-white">{m.email || "—"}</td>
                <td className="py-2 px-2 text-gray-400">{m.name || "—"}</td>
                <td className="py-2 px-2"><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(200,169,110,0.15)", color: "#C8A96E" }}>{TIER_LABELS[m.subscriptionTier] || m.subscriptionTier}</span></td>
                <td className="py-2 px-2 text-gray-400">{m.homeCity || "—"}</td>
                <td className="py-2 px-2" style={{ color: "#C8A96E" }}>{m.credits}</td>
                <td className="py-2 px-2 text-gray-400">{m.createdAt ? new Date(m.createdAt).toLocaleDateString("fr-FR") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MEMBER DETAIL MODAL */}
      {selectedId && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setSelectedId(null)}>
          <div className="w-full max-w-lg mx-4 rounded-xl p-6 max-h-[85vh] overflow-y-auto" style={{ background: "#1a1a1a" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: "#C8A96E" }}>Détail membre</h3>
              <button onClick={() => setSelectedId(null)} className="text-sm" style={{ color: "#888" }}>Fermer</button>
            </div>
            <div className="space-y-2 mb-6 text-xs">
              <p><span className="text-gray-500">Email:</span> <span className="text-white">{(detail as any).email}</span></p>
              <p><span className="text-gray-500">Nom:</span> <span className="text-white">{(detail as any).name || "—"}</span></p>
              <p><span className="text-gray-500">Tier:</span> <span style={{ color: "#C8A96E" }}>{TIER_LABELS[(detail as any).subscriptionTier] || (detail as any).subscriptionTier}</span></p>
              <p><span className="text-gray-500">Crédits:</span> <span style={{ color: "#C8A96E" }}>{(detail as any).credits}</span></p>
              <p><span className="text-gray-500">Ville:</span> <span className="text-white">{(detail as any).homeCity || "—"}</span></p>
              <p><span className="text-gray-500">Conversations:</span> <span className="text-white">{(detail as any).convCount}</span></p>
              <p><span className="text-gray-500">Parcours:</span> <span className="text-white">{(detail as any).parcoursCount}</span></p>
              <p><span className="text-gray-500">Rôle:</span> <span className="text-white">{(detail as any).role}</span></p>
            </div>

            {/* ACTIONS */}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Changer tier</label>
                <div className="flex gap-2">
                  {(["free", "explorer", "premium", "elite"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => tierMut.mutate({ userId: selectedId, newTier: t })}
                      disabled={tierMut.isPending}
                      className="text-[10px] px-3 py-1.5 rounded"
                      style={{
                        background: (detail as any).subscriptionTier === t ? "#C8A96E" : "transparent",
                        color: (detail as any).subscriptionTier === t ? "#1a1a1a" : "#C8A96E",
                        border: "1px solid #C8A96E",
                      }}
                    >
                      {TIER_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Offrir crédits</label>
                <div className="flex gap-2">
                  <input value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} type="number" min="1" className="text-xs px-3 py-2 rounded-lg w-24" style={{ background: "#111", border: "1px solid #333", color: "#fff" }} />
                  <button onClick={() => creditMut.mutate({ userId: selectedId, amount: parseInt(creditAmount) || 10 })} disabled={creditMut.isPending} className="text-xs px-4 py-2 rounded-lg font-semibold" style={{ background: "#C8A96E", color: "#1a1a1a" }}>
                    {creditMut.isPending ? "..." : "Offrir"}
                  </button>
                </div>
              </div>
              <button
                onClick={() => blockMut.mutate({ userId: selectedId })}
                disabled={blockMut.isPending}
                className="text-xs px-4 py-2 rounded-lg w-full"
                style={{ border: "1px solid #ef4444", color: "#ef4444" }}
              >
                {(detail as any).role === "user" ? "Bloquer ce compte" : "Débloquer ce compte"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STRIPE */}
      <div className="mt-8 mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>Stripe</h2>
        <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="inline-block text-xs px-4 py-2 rounded-lg mb-4" style={{ border: "1px solid #C8A96E", color: "#C8A96E" }}>
          Ouvrir Stripe Dashboard
        </a>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ color: "#888", borderBottom: "1px solid #333" }}>
              <th className="text-left py-2 px-2">User</th><th className="text-left py-2 px-2">Montant</th><th className="text-left py-2 px-2">Type</th><th className="text-left py-2 px-2">Date</th>
            </tr></thead>
            <tbody>
              {(payments as any[] || []).map((p: any) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #222" }}>
                  <td className="py-2 px-2 text-gray-400">#{p.userId}</td>
                  <td className="py-2 px-2" style={{ color: p.amount > 0 ? "#4ade80" : "#ef4444" }}>{p.amount > 0 ? "+" : ""}{p.amount}</td>
                  <td className="py-2 px-2 text-gray-400">{p.type}</td>
                  <td className="py-2 px-2 text-gray-400">{p.createdAt ? new Date(p.createdAt).toLocaleDateString("fr-FR") : "—"}</td>
                </tr>
              ))}
              {(!payments || (payments as any[]).length === 0) && <tr><td colSpan={4} className="py-8 text-center text-gray-500">Aucun paiement</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
