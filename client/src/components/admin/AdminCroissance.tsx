import { trpc } from "@/lib/trpc";

function MetricCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "#1a1a1a", border: "1px solid #333" }}>
      <p className="text-2xl font-bold" style={{ color: color || "#C8A96E" }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: "#888" }}>{label}</p>
    </div>
  );
}

export default function AdminCroissance() {
  const { data: stats } = trpc.admin.getStats.useQuery(undefined, { retry: false });
  const { data: topEst } = trpc.admin.getTopEstablishments.useQuery(undefined, { retry: false });
  const { data: topCP } = trpc.admin.getTopContentPages.useQuery(undefined, { retry: false });
  const { data: tierCounts } = trpc.admin.getMembersByTier.useQuery(undefined, { retry: false });
  const { data: seoCoverage } = trpc.admin.getSeoCoverage.useQuery(undefined, { retry: false });

  const s = stats as any || {};
  const TIER_LABELS: Record<string, string> = { free: "Invité", explorer: "Membre", premium: "Duo", elite: "Cercle" };

  return (
    <div>
      {/* METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
        <MetricCard label="Membres total" value={s.totalUsers || 0} />
        <MetricCard label="Actifs cette semaine" value={s.activeWeek || 0} />
        <MetricCard label="Établissements" value={s.totalEstablishments || 0} />
        <MetricCard label="Content Pages" value={s.contentPages || 0} />
        <MetricCard label="Parcours Maison" value={s.parcoursMaison || 0} />
        <MetricCard label="Clics sortants" value={s.outboundClicks || 0} />
      </div>

      {/* RÉPARTITION PAR TIER */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>Répartition par tier</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(tierCounts as Record<string, number> || {}).map(([tier, count]) => (
            <MetricCard key={tier} label={TIER_LABELS[tier] || tier} value={count} />
          ))}
        </div>
      </div>

      {/* TOP FICHES */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>Top 10 Fiches (clics sortants)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ color: "#888", borderBottom: "1px solid #333" }}>
              <th className="text-left py-2 px-2">#</th><th className="text-left py-2 px-2">Nom</th><th className="text-left py-2 px-2">Ville</th><th className="text-left py-2 px-2">Clics</th>
            </tr></thead>
            <tbody>
              {(topEst as any[] || []).map((e: any, i: number) => (
                <tr key={e.id} className="hover:bg-white/5" style={{ borderBottom: "1px solid #222" }}>
                  <td className="py-2 px-2 text-gray-500">{i + 1}</td>
                  <td className="py-2 px-2 text-white">{e.name}</td>
                  <td className="py-2 px-2 text-gray-400">{e.city}</td>
                  <td className="py-2 px-2" style={{ color: "#C8A96E" }}>{e.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOP GUIDES */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>Top 10 Guides (vues)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ color: "#888", borderBottom: "1px solid #333" }}>
              <th className="text-left py-2 px-2">#</th><th className="text-left py-2 px-2">Titre</th><th className="text-left py-2 px-2">Ville</th><th className="text-left py-2 px-2">Vues</th>
            </tr></thead>
            <tbody>
              {(topCP as any[] || []).map((cp: any, i: number) => (
                <tr key={cp.id} className="hover:bg-white/5" style={{ borderBottom: "1px solid #222" }}>
                  <td className="py-2 px-2 text-gray-500">{i + 1}</td>
                  <td className="py-2 px-2 text-white">{cp.title}</td>
                  <td className="py-2 px-2 text-gray-400">{cp.city}</td>
                  <td className="py-2 px-2" style={{ color: "#C8A96E" }}>{cp.viewCount}</td>
                </tr>
              ))}
              {(!topCP || (topCP as any[]).length === 0) && <tr><td colSpan={4} className="py-8 text-center text-gray-500">Aucune content page</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* COUVERTURE SEO */}
      <div className="mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>Couverture SEO par ville</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(seoCoverage as any[] || []).map((row: any) => (
            <div key={row.city} className="rounded-lg px-3 py-2" style={{ background: "#1a1a1a", border: "1px solid #333" }}>
              <span className="text-xs text-white">{row.city}</span>
              <span className="text-xs font-bold ml-2" style={{ color: "#C8A96E" }}>{row.count}</span>
            </div>
          ))}
          {(!seoCoverage || (seoCoverage as any[]).length === 0) && <p className="text-xs text-gray-500 col-span-4">Aucune donnée</p>}
        </div>
      </div>
    </div>
  );
}
