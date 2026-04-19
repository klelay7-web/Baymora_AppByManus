import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-base font-semibold mb-4" style={{ color: "#C8A96E" }}>{title}</h2>
      {children}
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-lg mx-4 rounded-xl p-6 max-h-[85vh] overflow-y-auto" style={{ background: "#1a1a1a" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "#C8A96E" }}>{title}</h3>
          <button onClick={onClose} className="text-sm" style={{ color: "#888" }}>Fermer</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminContenu() {
  const [showAddEst, setShowAddEst] = useState(false);
  const [showGenContent, setShowGenContent] = useState(false);
  const [cityFilter, setCityFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [estForm, setEstForm] = useState({ name: "", city: "", country: "France", category: "restaurant" });
  const [contentForm, setContentForm] = useState({ city: "", searchIntent: "" });

  const { data: establishments, refetch: refetchEst } = trpc.admin.listEstablishments.useQuery({ city: cityFilter || undefined, category: catFilter || undefined });
  const { data: parcoursList, refetch: refetchPM } = trpc.parcoursMaison.list.useQuery();
  const { data: contentPagesList, refetch: refetchCP } = trpc.admin.listContentPages.useQuery();
  const { data: inspirations } = trpc.inspiration.list.useQuery();

  const createEstMut = trpc.admin.createEstablishment.useMutation({ onSuccess: () => { toast.success("Établissement créé"); setShowAddEst(false); refetchEst(); } });
  const enrichOneMut = trpc.admin.enrichEstablishment.useMutation({ onSuccess: () => { toast.success("Enrichi"); refetchEst(); }, onError: (e) => toast.error(e.message) });
  const enrichAllMut = trpc.admin.enrichAll.useMutation({ onSuccess: (d) => toast.success(`${d.enriched}/${d.total} enrichis`), onError: (e) => toast.error(e.message) });
  const seedMut = trpc.admin.seedParcoursMaison.useMutation({ onSuccess: (d) => { toast.success(`${d.inserted} parcours insérés`); refetchPM(); }, onError: (e) => toast.error(e.message) });
  const togglePMPub = trpc.admin.toggleParcoursMaisonPublished.useMutation({ onSuccess: () => refetchPM() });
  const genContentMut = trpc.admin.generateContentPage.useMutation({ onSuccess: (d) => { toast.success(`Guide créé : ${d.slug}`); setShowGenContent(false); refetchCP(); }, onError: (e) => toast.error(e.message) });
  const toggleCPPub = trpc.admin.toggleContentPagePublished.useMutation({ onSuccess: () => refetchCP() });

  const cities = Array.from(new Set((establishments as any[] || []).map((e: any) => e.city).filter(Boolean))).sort();
  const categories = Array.from(new Set((establishments as any[] || []).map((e: any) => e.category).filter(Boolean))).sort();

  return (
    <div>
      {/* ÉTABLISSEMENTS */}
      <Section title="Établissements">
        <div className="flex flex-wrap gap-2 mb-4">
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="text-xs px-3 py-2 rounded-lg" style={{ background: "#111", border: "1px solid #333", color: "#fff" }}>
            <option value="">Toutes les villes</option>
            {cities.map((c: any) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="text-xs px-3 py-2 rounded-lg" style={{ background: "#111", border: "1px solid #333", color: "#fff" }}>
            <option value="">Toutes catégories</option>
            {categories.map((c: any) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setShowAddEst(true)} className="text-xs px-4 py-2 rounded-lg font-semibold" style={{ background: "#C8A96E", color: "#1a1a1a" }}>Ajouter</button>
          <button onClick={() => enrichAllMut.mutate()} disabled={enrichAllMut.isPending} className="text-xs px-4 py-2 rounded-lg" style={{ border: "1px solid #C8A96E", color: "#C8A96E" }}>
            {enrichAllMut.isPending ? "En cours..." : "Enrichir incomplets"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ color: "#888", borderBottom: "1px solid #333" }}>
              <th className="text-left py-2 px-2">Nom</th><th className="text-left py-2 px-2">Ville</th><th className="text-left py-2 px-2">Cat.</th><th className="text-left py-2 px-2">Statut</th><th className="text-left py-2 px-2">Rating</th><th className="py-2 px-2"></th>
            </tr></thead>
            <tbody>
              {(establishments as any[] || []).map((e: any) => (
                <tr key={e.id} className="hover:bg-white/5" style={{ borderBottom: "1px solid #222" }}>
                  <td className="py-2 px-2 text-white">{e.name} {!e.description && <span className="text-red-400 text-[10px] ml-1">!</span>}</td>
                  <td className="py-2 px-2 text-gray-400">{e.city}</td>
                  <td className="py-2 px-2 text-gray-400">{e.category}</td>
                  <td className="py-2 px-2"><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: e.enrichStatus === "completed" ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)", color: e.enrichStatus === "completed" ? "#4ade80" : "#ef4444" }}>{e.enrichStatus || "pending"}</span></td>
                  <td className="py-2 px-2 text-gray-400">{e.rating || "—"}</td>
                  <td className="py-2 px-2"><button onClick={() => enrichOneMut.mutate({ id: e.id })} disabled={enrichOneMut.isPending} className="text-[10px] px-2 py-1 rounded" style={{ border: "1px solid #C8A96E", color: "#C8A96E" }}>Enrichir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* PARCOURS MAISON */}
      <Section title="Parcours Maison">
        <div className="flex gap-2 mb-4">
          <button onClick={() => seedMut.mutate()} disabled={seedMut.isPending} className="text-xs px-4 py-2 rounded-lg font-semibold" style={{ background: "#C8A96E", color: "#1a1a1a" }}>
            {seedMut.isPending ? "En cours..." : "Seed Bordeaux"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ color: "#888", borderBottom: "1px solid #333" }}>
              <th className="text-left py-2 px-2">Titre</th><th className="text-left py-2 px-2">Ville</th><th className="text-left py-2 px-2">Durée</th><th className="text-left py-2 px-2">Budget</th><th className="text-left py-2 px-2">Steps</th><th className="text-left py-2 px-2">Vues</th><th className="py-2 px-2">Publié</th>
            </tr></thead>
            <tbody>
              {(parcoursList as any[] || []).map((p: any) => (
                <tr key={p.id} className="hover:bg-white/5" style={{ borderBottom: "1px solid #222" }}>
                  <td className="py-2 px-2 text-white">{p.title}</td>
                  <td className="py-2 px-2 text-gray-400">{p.city}</td>
                  <td className="py-2 px-2 text-gray-400">{p.duration}</td>
                  <td className="py-2 px-2" style={{ color: "#C8A96E" }}>{p.budgetEstimate}</td>
                  <td className="py-2 px-2 text-gray-400">{Array.isArray(p.steps) ? p.steps.length : 0}</td>
                  <td className="py-2 px-2 text-gray-400">{p.viewCount}</td>
                  <td className="py-2 px-2">
                    <button onClick={() => togglePMPub.mutate({ id: p.id })} className="text-[10px] px-2 py-1 rounded" style={{ background: p.isPublished ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)", color: p.isPublished ? "#4ade80" : "#ef4444" }}>{p.isPublished ? "Oui" : "Non"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* CONTENT PAGES */}
      <Section title="Content Pages (Guides SEO)">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setShowGenContent(true)} className="text-xs px-4 py-2 rounded-lg font-semibold" style={{ background: "#C8A96E", color: "#1a1a1a" }}>Créer manuellement</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ color: "#888", borderBottom: "1px solid #333" }}>
              <th className="text-left py-2 px-2">Titre</th><th className="text-left py-2 px-2">Ville</th><th className="text-left py-2 px-2">Cat.</th><th className="text-left py-2 px-2">Vues</th><th className="py-2 px-2">Publié</th>
            </tr></thead>
            <tbody>
              {(contentPagesList as any[] || []).map((cp: any) => (
                <tr key={cp.id} className="hover:bg-white/5" style={{ borderBottom: "1px solid #222" }}>
                  <td className="py-2 px-2 text-white">{cp.title}</td>
                  <td className="py-2 px-2 text-gray-400">{cp.city}</td>
                  <td className="py-2 px-2 text-gray-400">{cp.category}</td>
                  <td className="py-2 px-2 text-gray-400">{cp.viewCount}</td>
                  <td className="py-2 px-2">
                    <button onClick={() => toggleCPPub.mutate({ id: cp.id })} className="text-[10px] px-2 py-1 rounded" style={{ background: cp.isPublished ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)", color: cp.isPublished ? "#4ade80" : "#ef4444" }}>{cp.isPublished ? "Oui" : "Non"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* INSPIRATIONS */}
      <Section title="Inspirations">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ color: "#888", borderBottom: "1px solid #333" }}>
              <th className="text-left py-2 px-2">Titre</th><th className="text-left py-2 px-2">Slug</th><th className="text-left py-2 px-2">Ville</th>
            </tr></thead>
            <tbody>
              {(inspirations as any[] || []).map((t: any) => (
                <tr key={t.id} className="hover:bg-white/5" style={{ borderBottom: "1px solid #222" }}>
                  <td className="py-2 px-2 text-white">{t.title}</td>
                  <td className="py-2 px-2 text-gray-400">{t.slug}</td>
                  <td className="py-2 px-2 text-gray-400">{t.city}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* MODALS */}
      <Modal open={showAddEst} onClose={() => setShowAddEst(false)} title="Ajouter un établissement">
        {["name", "city", "country"].map((f) => (
          <div key={f} className="mb-3">
            <label className="text-xs text-gray-400 block mb-1">{f}</label>
            <input value={(estForm as any)[f]} onChange={(e) => setEstForm({ ...estForm, [f]: e.target.value })} className="w-full text-sm px-3 py-2 rounded-lg" style={{ background: "#111", border: "1px solid #333", color: "#fff" }} />
          </div>
        ))}
        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">Catégorie</label>
          <select value={estForm.category} onChange={(e) => setEstForm({ ...estForm, category: e.target.value })} className="w-full text-sm px-3 py-2 rounded-lg" style={{ background: "#111", border: "1px solid #333", color: "#fff" }}>
            {["bar", "restaurant", "hotel", "spa", "club", "cafe", "museum", "gallery", "park", "beach", "rooftop", "market", "other"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={() => createEstMut.mutate(estForm)} disabled={createEstMut.isPending} className="w-full py-2 rounded-lg text-sm font-semibold mt-2" style={{ background: "#C8A96E", color: "#1a1a1a" }}>
          {createEstMut.isPending ? "En cours..." : "Créer"}
        </button>
      </Modal>

      <Modal open={showGenContent} onClose={() => setShowGenContent(false)} title="Générer un guide">
        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">Ville</label>
          <input value={contentForm.city} onChange={(e) => setContentForm({ ...contentForm, city: e.target.value })} className="w-full text-sm px-3 py-2 rounded-lg" style={{ background: "#111", border: "1px solid #333", color: "#fff" }} placeholder="Bordeaux" />
        </div>
        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">Requête cible</label>
          <input value={contentForm.searchIntent} onChange={(e) => setContentForm({ ...contentForm, searchIntent: e.target.value })} className="w-full text-sm px-3 py-2 rounded-lg" style={{ background: "#111", border: "1px solid #333", color: "#fff" }} placeholder="meilleurs restaurants gastronomiques bordeaux" />
        </div>
        <button onClick={() => genContentMut.mutate(contentForm)} disabled={genContentMut.isPending} className="w-full py-2 rounded-lg text-sm font-semibold mt-2" style={{ background: "#C8A96E", color: "#1a1a1a" }}>
          {genContentMut.isPending ? "Génération Claude en cours..." : "Générer"}
        </button>
      </Modal>
    </div>
  );
}
