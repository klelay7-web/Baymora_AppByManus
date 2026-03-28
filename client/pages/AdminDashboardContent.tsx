import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Users, MessageSquare, TrendingUp, Search, Crown, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  users: { total: number; today: number; thisWeek: number; paid: number; byCircle: Record<string, number> };
  conversations: { total: number };
  messages: { total: number; thisWeek: number };
}

interface AdminUser {
  id: string;
  pseudo: string;
  prenom: string | null;
  email: string | null;
  circle: string;
  mode: string;
  messagesUsed: number;
  messagesLimit: number;
  createdAt: string;
  _count: { conversations: number; companions: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeader() {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const CIRCLE_BADGE: Record<string, string> = {
  decouverte: "○", essentiel: "✦", elite: "✦✦", prive: "✦✦✦", fondateur: "✦✦✦✦",
};
const CIRCLE_COLOR: Record<string, string> = {
  decouverte: "text-white/30", essentiel: "text-secondary", elite: "text-secondary",
  prive: "text-amber-300", fondateur: "text-amber-200",
};
const CIRCLES = ["decouverte", "essentiel", "elite", "prive", "fondateur"];

// ─── Composant ────────────────────────────────────────────────────────────────

export default function AdminDashboardContent() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filterCircle, setFilterCircle] = useState("");
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── Auth check
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) { navigate("/admin"); return; }
    fetch("/api/auth/verify", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) { localStorage.removeItem("authToken"); navigate("/admin"); }
        else setAuthorized(true);
      })
      .catch(() => { localStorage.removeItem("authToken"); navigate("/admin"); });
  }, [navigate]);

  // ── Load stats
  const loadStats = () => {
    setLoadingStats(true);
    fetch("/api/admin/stats", { headers: authHeader() })
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  };

  // ── Load users
  const loadUsers = () => {
    setLoadingUsers(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterCircle) params.set("circle", filterCircle);
    fetch(`/api/admin/users?${params}`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  };

  useEffect(() => { if (authorized) { loadStats(); loadUsers(); } }, [authorized]);
  useEffect(() => { if (authorized) loadUsers(); }, [search, filterCircle]);

  const handleCircleChange = async (userId: string, circle: string) => {
    setUpdatingId(userId);
    await fetch(`/api/admin/users/${userId}/circle`, {
      method: "PATCH",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ circle }),
    });
    setUpdatingId(null);
    loadUsers();
    loadStats();
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("authToken");
    navigate("/admin");
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg">Baymora Admin</h1>
          <p className="text-white/30 text-xs">Tableau de bord privé</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { loadStats(); loadUsers(); }} className="text-white/30 hover:text-white/70 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/40 hover:text-white gap-2">
            <LogOut className="h-4 w-4" /> Déconnexion
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loadingStats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 h-24 animate-pulse" />
            ))
          ) : stats && [
            {
              icon: <Users className="h-4 w-4" />,
              label: "Utilisateurs",
              value: stats.users.total,
              sub: `+${stats.users.today} aujourd'hui · +${stats.users.thisWeek} cette semaine`,
            },
            {
              icon: <Crown className="h-4 w-4" />,
              label: "Abonnés payants",
              value: stats.users.paid,
              sub: `${stats.users.total ? Math.round((stats.users.paid / stats.users.total) * 100) : 0}% du total`,
            },
            {
              icon: <MessageSquare className="h-4 w-4" />,
              label: "Conversations",
              value: stats.conversations.total,
              sub: `${stats.messages.total} messages au total`,
            },
            {
              icon: <TrendingUp className="h-4 w-4" />,
              label: "Messages / semaine",
              value: stats.messages.thisWeek,
              sub: "7 derniers jours",
            },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 text-secondary/70 mb-2">{s.icon}<span className="text-white/40 text-xs">{s.label}</span></div>
              <p className="text-3xl font-bold text-white">{s.value}</p>
              <p className="text-white/20 text-xs mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Répartition par cercle ── */}
        {stats && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h2 className="text-white/70 font-semibold text-sm mb-4">Répartition par cercle</h2>
            <div className="flex flex-wrap gap-4">
              {CIRCLES.map(c => (
                <div key={c} className="text-center">
                  <p className={`text-lg font-bold ${CIRCLE_COLOR[c]}`}>{stats.users.byCircle[c] || 0}</p>
                  <p className="text-white/30 text-xs capitalize">{c}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Liste utilisateurs ── */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <h2 className="text-white/70 font-semibold text-sm">
              Utilisateurs <span className="text-white/30 font-normal">({total})</span>
            </h2>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-white/8 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-secondary/40 w-44"
                />
              </div>
              <select
                value={filterCircle}
                onChange={e => setFilterCircle(e.target.value)}
                className="bg-white/8 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-secondary/40"
              >
                <option value="">Tous les cercles</option>
                {CIRCLES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
              </select>
            </div>
          </div>

          {loadingUsers ? (
            <div className="divide-y divide-white/5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-3 h-14 animate-pulse bg-white/3" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="px-5 py-8 text-center text-white/25 text-sm">Aucun utilisateur trouvé</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/8">
                    {["Utilisateur", "Cercle", "Mode", "Messages", "Conversations", "Inscription", "Action"].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-white/30 text-xs font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white text-sm">{u.prenom || u.pseudo}</div>
                        <div className="text-white/30 text-xs">{u.email || `@${u.pseudo}`}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${CIRCLE_COLOR[u.circle]}`}>
                          {CIRCLE_BADGE[u.circle]} {u.circle}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white/30 text-xs">
                          {u.mode === 'fantome' ? '👻' : '✍️'} {u.mode}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white/60 text-xs">{u.messagesUsed}/{u.messagesLimit}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white/60 text-xs">{u._count.conversations}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white/30 text-xs">
                          {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.circle}
                          disabled={updatingId === u.id}
                          onChange={e => handleCircleChange(u.id, e.target.value)}
                          className="bg-white/8 border border-white/10 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-secondary/40 disabled:opacity-40"
                        >
                          {CIRCLES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Partenaires (Phase 2) ── */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-white/70 font-semibold text-sm mb-3">Partenaires affiliés</h2>
          <p className="text-white/25 text-sm">Module de gestion des partenaires — Phase 2.</p>
          <p className="text-white/15 text-xs mt-1">Commissions, remboursements, tableaux de bord partenaires.</p>
        </div>
      </div>
    </div>
  );
}
