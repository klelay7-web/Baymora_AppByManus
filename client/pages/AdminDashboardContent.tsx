import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Users, MessageSquare, TrendingUp, Search, Crown, RefreshCw, Handshake, CheckCircle, Clock, XCircle, Plus, Pencil, Trash2 } from "lucide-react";

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

interface AdminPartnerOffer {
  id: string;
  type: string;
  title: string;
  description?: string;
  normalPrice?: number;
  baymoraPrice?: number;
  currency: string;
  bookingUrl?: string;
  isActive: boolean;
}

interface AdminPartner {
  id: string;
  slug: string;
  name: string;
  type: string;
  status: string;
  city: string;
  address?: string;
  description?: string;
  vibe?: string;
  photos: string[];
  tags: string[];
  priceLevel: number;
  affiliateCode: string;
  commissionRate: number;
  testCostAmount: number;
  totalCommissions: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  applyMessage?: string;
  notes?: string;
  mapQuery?: string;
  approvedAt?: string;
  createdAt: string;
  offers: AdminPartnerOffer[];
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
  const [activeTab, setActiveTab] = useState<'users' | 'partners' | 'club'>('users');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filterCircle, setFilterCircle] = useState("");
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Partners state
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [editingPartner, setEditingPartner] = useState<AdminPartner | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editVibe, setEditVibe] = useState('');
  const [editMapQuery, setEditMapQuery] = useState('');
  const [editPhotos, setEditPhotos] = useState('');
  const [editTags, setEditTags] = useState('');
  const [savingPartner, setSavingPartner] = useState(false);
  const [newOffer, setNewOffer] = useState({ type: '', title: '', normalPrice: '', baymoraPrice: '', bookingUrl: '' });
  const [addingOffer, setAddingOffer] = useState(false);

  // Club state
  const [clubStats, setClubStats] = useState<any>(null);
  const [loadingClub, setLoadingClub] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantPoints, setGrantPoints] = useState('');
  const [grantDesc, setGrantDesc] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);

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

  const loadPartners = () => {
    setLoadingPartners(true);
    fetch("/api/partners/admin/list", { headers: authHeader() })
      .then(r => r.json())
      .then(d => setPartners(d.partners || []))
      .catch(() => {})
      .finally(() => setLoadingPartners(false));
  };

  const handleApprove = async (partnerId: string) => {
    await fetch(`/api/partners/admin/${partnerId}/approve`, {
      method: "PATCH",
      headers: authHeader(),
    });
    loadPartners();
  };

  const handleStatusChange = async (partnerId: string, status: string) => {
    await fetch(`/api/partners/admin/${partnerId}`, {
      method: "PATCH",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadPartners();
  };

  const handleSavePartner = async () => {
    if (!editingPartner) return;
    setSavingPartner(true);
    const photos = editPhotos.split('\n').map(s => s.trim()).filter(Boolean);
    const tags = editTags.split(',').map(s => s.trim()).filter(Boolean);
    await fetch(`/api/partners/admin/${editingPartner.id}`, {
      method: "PATCH",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ notes: editNotes, vibe: editVibe, mapQuery: editMapQuery, photos, tags }),
    });
    setSavingPartner(false);
    setEditingPartner(null);
    loadPartners();
  };

  const handleAddOffer = async (partnerId: string) => {
    if (!newOffer.type || !newOffer.title) return;
    setAddingOffer(true);
    await fetch(`/api/partners/admin/${partnerId}/offers`, {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newOffer,
        normalPrice: newOffer.normalPrice || undefined,
        baymoraPrice: newOffer.baymoraPrice || undefined,
      }),
    });
    setAddingOffer(false);
    setNewOffer({ type: '', title: '', normalPrice: '', baymoraPrice: '', bookingUrl: '' });
    loadPartners();
  };

  const handleDeleteOffer = async (partnerId: string, offerId: string) => {
    await fetch(`/api/partners/admin/${partnerId}/offers/${offerId}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    loadPartners();
  };

  const loadClub = () => {
    setLoadingClub(true);
    fetch('/api/club/admin/stats', { headers: authHeader() })
      .then(r => r.json())
      .then(d => setClubStats(d))
      .catch(() => {})
      .finally(() => setLoadingClub(false));
  };

  const handleGrant = async () => {
    if (!grantUserId || !grantPoints || !grantDesc) return;
    setGrantLoading(true);
    await fetch('/api/club/admin/grant', {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: grantUserId, points: grantPoints, description: grantDesc }),
    });
    setGrantLoading(false);
    setGrantUserId(''); setGrantPoints(''); setGrantDesc('');
    loadClub();
  };

  useEffect(() => { if (authorized) { loadStats(); loadUsers(); loadPartners(); loadClub(); } }, [authorized]);
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
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-white font-bold text-lg">Baymora Admin</h1>
            <p className="text-white/30 text-xs">Tableau de bord privé</p>
          </div>
          {/* Tabs */}
          <div className="hidden sm:flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'users' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              <Users className="h-3.5 w-3.5" /> Utilisateurs
            </button>
            <button
              onClick={() => setActiveTab('partners')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'partners' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              <Handshake className="h-3.5 w-3.5" /> Partenaires
              {partners.filter(p => p.status === 'pending').length > 0 && (
                <span className="bg-secondary text-black text-[10px] font-bold rounded-full px-1.5">
                  {partners.filter(p => p.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('club')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'club' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              💎 Club
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { loadStats(); loadUsers(); loadPartners(); loadClub(); }} className="text-white/30 hover:text-white/70 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/40 hover:text-white gap-2">
            <LogOut className="h-4 w-4" /> Déconnexion
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6" style={{ display: activeTab === 'users' ? 'block' : 'none' }}>

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

      </div>

      {/* ── Onglet Partenaires ── */}
      {activeTab === 'partners' && (
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">Partenaires Baymora</h2>
              <p className="text-white/30 text-xs mt-0.5">Établissements testés, approuvés et gérés</p>
            </div>
            <Link to="/devenir-partenaire" target="_blank">
              <Button size="sm" className="bg-secondary/20 border border-secondary/40 text-secondary hover:bg-secondary/35 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Page candidature
              </Button>
            </Link>
          </div>

          {loadingPartners ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="bg-white/5 border border-white/10 rounded-xl h-20 animate-pulse" />)}
            </div>
          ) : partners.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-10 text-center">
              <Handshake className="h-8 w-8 text-white/20 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Aucun partenaire pour l'instant</p>
              <p className="text-white/15 text-xs mt-1">Les candidatures apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-4">
              {partners.map(partner => {
                const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
                  pending: { icon: <Clock className="h-3.5 w-3.5" />, label: 'En attente', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
                  testing: { icon: <Clock className="h-3.5 w-3.5" />, label: 'En test', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
                  approved: { icon: <CheckCircle className="h-3.5 w-3.5" />, label: 'Approuvé', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
                  rejected: { icon: <XCircle className="h-3.5 w-3.5" />, label: 'Refusé', color: 'text-red-400 bg-red-400/10 border-red-400/30' },
                };
                const s = statusConfig[partner.status] || statusConfig.pending;
                const isEditing = editingPartner?.id === partner.id;

                return (
                  <div key={partner.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    {/* Partner header */}
                    <div className="px-5 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-white font-semibold">{partner.name}</h3>
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${s.color}`}>
                            {s.icon} {s.label}
                          </span>
                          <span className="text-white/30 text-xs bg-white/5 px-2 py-0.5 rounded-full">{partner.type}</span>
                        </div>
                        <p className="text-white/40 text-xs">{partner.city}{partner.address ? ` — ${partner.address}` : ''}</p>
                        {partner.contactEmail && (
                          <p className="text-white/30 text-xs mt-0.5">
                            {partner.contactName && `${partner.contactName} · `}{partner.contactEmail}
                            {partner.contactPhone && ` · ${partner.contactPhone}`}
                          </p>
                        )}
                        {partner.applyMessage && (
                          <p className="text-white/35 text-xs mt-2 italic">"{partner.applyMessage}"</p>
                        )}
                        {partner.status === 'approved' && (
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="text-secondary/70 text-xs font-mono bg-secondary/10 px-2 py-0.5 rounded">{partner.affiliateCode}</span>
                            <span className="text-white/30 text-xs">Commission: {partner.commissionRate}%</span>
                            <span className="text-white/30 text-xs">Coût test: {partner.testCostAmount}€</span>
                            <span className="text-white/30 text-xs">Total commissions: {partner.totalCommissions}€</span>
                            <Link to={`/partenaires/${partner.slug}`} target="_blank" className="text-secondary/60 text-xs hover:text-secondary">
                              Voir fiche →
                            </Link>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {partner.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleApprove(partner.id)}
                            className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/35 text-xs"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approuver
                          </Button>
                        )}
                        {partner.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(partner.id, 'testing')}
                            className="bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25 text-xs"
                          >
                            En test
                          </Button>
                        )}
                        {partner.status !== 'rejected' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingPartner(isEditing ? null : partner);
                              setEditNotes(partner.notes || '');
                              setEditVibe(partner.vibe || '');
                              setEditMapQuery(partner.mapQuery || '');
                              setEditPhotos(partner.photos.join('\n'));
                              setEditTags(partner.tags.join(', '));
                            }}
                            className="text-white/40 hover:text-white/70 text-xs gap-1"
                          >
                            <Pencil className="h-3.5 w-3.5" /> {isEditing ? 'Annuler' : 'Éditer'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Edit form */}
                    {isEditing && (
                      <div className="border-t border-white/8 px-5 py-4 space-y-3 bg-white/3">
                        <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider">Éditer la fiche</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-white/40 text-xs mb-1 block">Vibe / ambiance</label>
                            <Input
                              value={editVibe}
                              onChange={e => setEditVibe(e.target.value)}
                              placeholder="Chic, discret, romantique"
                              className="bg-white/6 border-white/10 text-white text-xs placeholder:text-white/20"
                            />
                          </div>
                          <div>
                            <label className="text-white/40 text-xs mb-1 block">Map query</label>
                            <Input
                              value={editMapQuery}
                              onChange={e => setEditMapQuery(e.target.value)}
                              placeholder="Hôtel Byblos, Saint-Tropez"
                              className="bg-white/6 border-white/10 text-white text-xs placeholder:text-white/20"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-white/40 text-xs mb-1 block">Tags (séparés par virgule)</label>
                          <Input
                            value={editTags}
                            onChange={e => setEditTags(e.target.value)}
                            placeholder="Piscine, Spa, Vue mer"
                            className="bg-white/6 border-white/10 text-white text-xs placeholder:text-white/20"
                          />
                        </div>
                        <div>
                          <label className="text-white/40 text-xs mb-1 block">Photos (une URL par ligne)</label>
                          <textarea
                            value={editPhotos}
                            onChange={e => setEditPhotos(e.target.value)}
                            rows={3}
                            placeholder="https://..."
                            className="w-full px-3 py-2 bg-white/6 border border-white/10 rounded-xl text-white text-xs placeholder:text-white/20 focus:outline-none resize-none"
                          />
                        </div>
                        <div>
                          <label className="text-white/40 text-xs mb-1 block">Notes internes</label>
                          <textarea
                            value={editNotes}
                            onChange={e => setEditNotes(e.target.value)}
                            rows={2}
                            placeholder="Notes internes Baymora..."
                            className="w-full px-3 py-2 bg-white/6 border border-white/10 rounded-xl text-white text-xs placeholder:text-white/20 focus:outline-none resize-none"
                          />
                        </div>
                        <Button
                          onClick={handleSavePartner}
                          disabled={savingPartner}
                          size="sm"
                          className="bg-secondary/20 border border-secondary/40 text-secondary hover:bg-secondary/35 text-xs"
                        >
                          {savingPartner ? 'Sauvegarde...' : 'Sauvegarder'}
                        </Button>
                      </div>
                    )}

                    {/* Offers section */}
                    {partner.status === 'approved' && (
                      <div className="border-t border-white/8 px-5 py-4">
                        <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">
                          Offres exclusives ({partner.offers.length})
                        </h4>
                        {partner.offers.length > 0 && (
                          <div className="space-y-2 mb-4">
                            {partner.offers.map(offer => (
                              <div key={offer.id} className="flex items-center justify-between bg-white/4 rounded-xl px-3 py-2">
                                <div className="min-w-0 flex-1">
                                  <span className="text-white/70 text-xs font-medium">{offer.title}</span>
                                  <span className="text-white/25 text-xs ml-2">({offer.type})</span>
                                  {offer.baymoraPrice && (
                                    <span className="text-secondary text-xs ml-2">{offer.baymoraPrice}{offer.currency}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDeleteOffer(partner.id, offer.id)}
                                  className="text-red-400/50 hover:text-red-400 transition-colors ml-2"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Add offer form */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <select
                            value={newOffer.type}
                            onChange={e => setNewOffer(p => ({ ...p, type: e.target.value }))}
                            className="bg-white/6 border border-white/10 rounded-xl px-2 py-1.5 text-white text-xs focus:outline-none focus:border-secondary/40 col-span-1"
                          >
                            <option value="">Type...</option>
                            <option value="stay_1night">1 nuit</option>
                            <option value="stay_2nights">2 nuits</option>
                            <option value="stay_3nights">3 nuits</option>
                            <option value="day_pass">Day Pass</option>
                            <option value="spa">Spa</option>
                            <option value="massage">Massage</option>
                            <option value="activity">Activité</option>
                            <option value="custom">Personnalisé</option>
                          </select>
                          <Input
                            value={newOffer.title}
                            onChange={e => setNewOffer(p => ({ ...p, title: e.target.value }))}
                            placeholder="Titre de l'offre"
                            className="bg-white/6 border-white/10 text-white text-xs placeholder:text-white/20 col-span-1"
                          />
                          <Input
                            value={newOffer.baymoraPrice}
                            onChange={e => setNewOffer(p => ({ ...p, baymoraPrice: e.target.value }))}
                            placeholder="Prix Baymora (€)"
                            className="bg-white/6 border-white/10 text-white text-xs placeholder:text-white/20 col-span-1"
                          />
                          <Input
                            value={newOffer.normalPrice}
                            onChange={e => setNewOffer(p => ({ ...p, normalPrice: e.target.value }))}
                            placeholder="Prix normal (€)"
                            className="bg-white/6 border-white/10 text-white text-xs placeholder:text-white/20 col-span-1"
                          />
                          <Input
                            value={newOffer.bookingUrl}
                            onChange={e => setNewOffer(p => ({ ...p, bookingUrl: e.target.value }))}
                            placeholder="URL réservation"
                            className="bg-white/6 border-white/10 text-white text-xs placeholder:text-white/20 col-span-1"
                          />
                          <Button
                            onClick={() => handleAddOffer(partner.id)}
                            disabled={addingOffer || !newOffer.type || !newOffer.title}
                            size="sm"
                            className="bg-secondary/20 border border-secondary/40 text-secondary hover:bg-secondary/35 text-xs col-span-1"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Commission summary */}
          {partners.filter(p => p.status === 'approved').length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/8">
                <h3 className="text-white/60 text-sm font-semibold">Résumé commissions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/8">
                      {['Partenaire', 'Commission', 'Coût test', 'Total commissions', 'Statut remboursement'].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-white/30 text-xs font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {partners.filter(p => p.status === 'approved').map(p => {
                      const reimbursed = p.totalCommissions >= p.testCostAmount;
                      return (
                        <tr key={p.id}>
                          <td className="px-4 py-3 text-white text-sm font-medium">{p.name}</td>
                          <td className="px-4 py-3 text-white/60 text-xs">{p.commissionRate}%</td>
                          <td className="px-4 py-3 text-white/60 text-xs">{p.testCostAmount}€</td>
                          <td className="px-4 py-3 text-secondary text-xs font-semibold">{p.totalCommissions}€</td>
                          <td className="px-4 py-3">
                            {reimbursed ? (
                              <span className="text-emerald-400 text-xs">✓ Remboursé</span>
                            ) : (
                              <span className="text-amber-400 text-xs">
                                {(p.testCostAmount - p.totalCommissions).toFixed(0)}€ restants
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Onglet Club ── */}
      {activeTab === 'club' && (
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div>
            <h2 className="text-white font-bold text-lg">Baymora Club</h2>
            <p className="text-white/30 text-xs mt-0.5">Points, invitations, niveaux</p>
          </div>

          {/* Stats */}
          {loadingClub ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="bg-white/5 border border-white/10 rounded-xl h-20 animate-pulse" />)}
            </div>
          ) : clubStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Membres',            value: clubStats.totalMembers,            emoji: '👥' },
                { label: 'Membres vérifiés',   value: clubStats.totalVerified,           emoji: '✅' },
                { label: 'Points distribués',  value: clubStats.totalPointsDistributed?.toLocaleString('fr-FR'), emoji: '💎' },
                { label: 'Invitations utilisées', value: clubStats.totalInvitationsUsed, emoji: '🤝' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="text-2xl mb-1">{s.emoji}</div>
                  <p className="text-3xl font-bold text-white">{s.value}</p>
                  <p className="text-white/30 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Leaderboard admin */}
          {clubStats?.topUsers?.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/8">
                <h3 className="text-white/60 text-sm font-semibold">Top membres (non anonymisé)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/8">
                      {['Rang', 'Membre', 'Cercle', 'Points', 'Niveau', 'Vérifié'].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-white/30 text-xs font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {clubStats.topUsers.map((u: any, i: number) => {
                      const TIERS = [{name:'Crystal',min:0,emoji:'💎'},{name:'Gold',min:500,emoji:'🌟'},{name:'Platinum',min:2000,emoji:'✨'},{name:'Diamond',min:5000,emoji:'👑'}];
                      const tier = [...TIERS].reverse().find((t: any) => u.clubPoints >= t.min) ?? TIERS[0];
                      return (
                        <tr key={u.id}>
                          <td className="px-4 py-3 text-white/30 text-sm">#{i + 1}</td>
                          <td className="px-4 py-3">
                            <p className="text-white text-sm font-medium">{u.prenom || u.pseudo}</p>
                            <p className="text-white/30 text-xs">{u.email || `@${u.pseudo}`}</p>
                          </td>
                          <td className="px-4 py-3 text-white/50 text-xs">{u.circle}</td>
                          <td className="px-4 py-3 text-secondary font-bold text-sm">{u.clubPoints}</td>
                          <td className="px-4 py-3 text-xs">{tier.emoji} {tier.name}</td>
                          <td className="px-4 py-3 text-xs">{u.clubVerified ? '✅' : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Grant points */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="text-white/60 text-sm font-semibold mb-4">Accorder des points manuellement</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                value={grantUserId}
                onChange={e => setGrantUserId(e.target.value)}
                placeholder="User ID"
                className="bg-white/6 border-white/10 text-white text-xs placeholder:text-white/20"
              />
              <Input
                value={grantPoints}
                onChange={e => setGrantPoints(e.target.value)}
                placeholder="Points (ex: 100)"
                type="number"
                className="bg-white/6 border-white/10 text-white text-xs placeholder:text-white/20"
              />
              <Input
                value={grantDesc}
                onChange={e => setGrantDesc(e.target.value)}
                placeholder="Description"
                className="bg-white/6 border-white/10 text-white text-xs placeholder:text-white/20"
              />
            </div>
            <Button
              onClick={handleGrant}
              disabled={grantLoading || !grantUserId || !grantPoints || !grantDesc}
              size="sm"
              className="mt-3 bg-secondary/20 border border-secondary/40 text-secondary hover:bg-secondary/35 text-xs"
            >
              {grantLoading ? 'Envoi...' : '+ Accorder les points'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
