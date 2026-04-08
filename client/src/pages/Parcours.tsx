import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Plus, Lock, Users, Globe, Eye, EyeOff, Sparkles, MapPin, Calendar, DollarSign } from "lucide-react";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm";

const MOCK_PARCOURS = [
  {
    id: "1",
    title: "Week-end romantique Paris",
    destination: "Paris, France",
    dates: "14-16 mars 2025",
    duration: "2 nuits",
    budget: "1 800€",
    steps: 5,
    status: "validé" as const,
    visibility: "privé" as const,
    img: `${CDN}/baymora-plaza-athenee-paris-UQttpWbf4KhLKFavhpDju8.webp`,
    shared: 0,
  },
  {
    id: "2",
    title: "Escapade Bali & Ubud",
    destination: "Bali, Indonésie",
    dates: "5-12 avril 2025",
    duration: "7 nuits",
    budget: "3 200€",
    steps: 8,
    status: "brouillon" as const,
    visibility: "privé" as const,
    img: `${CDN}/baymora-four-seasons-bali-3GtU7HyX7Q4FxXXuxAFiJE.webp`,
    shared: 0,
  },
  {
    id: "3",
    title: "Tokyo Gastronomique",
    destination: "Tokyo, Japon",
    dates: "20-27 mai 2025",
    duration: "7 nuits",
    budget: "4 500€",
    steps: 10,
    status: "en_cours" as const,
    visibility: "partagé" as const,
    img: `${CDN}/baymora-aman-tokyo-aZXaYUrFDjjHKPFBHjghJ9.webp`,
    shared: 2,
  },
];

const STATUS_CONFIG = {
  brouillon: { label: "Brouillon", color: "#d97706", bg: "rgba(217, 119, 6, 0.12)" },
  validé: { label: "Validé", color: "#16a34a", bg: "rgba(22, 163, 74, 0.12)" },
  en_cours: { label: "En cours", color: "#2563eb", bg: "rgba(37, 99, 235, 0.12)" },
  partagé: { label: "Partagé", color: "#C8A96E", bg: "rgba(200, 169, 110, 0.12)" },
};

const TABS = ["Tous", "Brouillons", "Validés", "Partagés"];

export default function Parcours() {
  const { user } = useAuth();
  const [activéTab, setActivéTab] = useState("Tous");

  const OWNER_EMAILS = ["k.lelay7@gmail.com", "klelay7@gmail.com"];
  const isOwner = OWNER_EMAILS.includes(user?.email || "") || user?.role === "admin";
  const isFree = !user || (user.subscriptionTier === "free" && !isOwner);

  if (isFree) {
    return (
      <div style={{ background: "#070B14", minHeight: "100vh", color: "#F0EDE6" }}>
        {/* Header */}
        <div className="px-4 pt-6 pb-4 max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>Mes parcours</h1>
              <p className="text-sm" style={{ color: "#8B8D94" }}>Vos voyages sur-mesure</p>
            </div>
            <Link href="/maya">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}>
                <Plus size={16} />
                Nouveau
              </button>
            </Link>
          </div>
        </div>

        {/* Démos floutées */}
        <div className="px-4 pb-4 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MOCK_PARCOURS.map((parcours) => {
              const statusCfg = STATUS_CONFIG[parcours.status];
              return (
                <div key={parcours.id} className="rounded-2xl overflow-hidden relative" style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.12)" }}>
                  {/* Flou overlay */}
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center" style={{ backdropFilter: "blur(6px)", background: "rgba(7,11,20,0.6)" }}>
                    <Lock size={22} color="#C8A96E" className="mb-2" />
                    <span className="text-xs font-semibold" style={{ color: "#C8A96E" }}>Social Club</span>
                  </div>
                  <div className="relative h-36">
                    <img src={parcours.img} alt={parcours.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(7,11,20,0.8) 0%, transparent 50%)" }} />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.color}40` }}>
                      {statusCfg.label}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>{parcours.title}</h3>
                    <p className="text-xs" style={{ color: "#8B8D94" }}>{parcours.destination} · {parcours.duration}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA upgrade */}
        <div className="px-4 pb-8 max-w-sm mx-auto text-center">
          <div className="rounded-3xl p-8" style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.2)" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(200, 169, 110, 0.12)" }}>
              <Sparkles size={24} color="#C8A96E" />
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>Passez au Social Club</h2>
            <p className="text-sm mb-6" style={{ color: "#8B8D94" }}>Les parcours sur-mesure illimités sont réservés aux membres Social Club. Créez, sauvegardez et partagez vos voyages de rêve.</p>
            <Link href="/premium">
              <button className="w-full py-3 rounded-full text-sm font-semibold mb-3" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}>Voir les forfaits</button>
            </Link>
            <Link href="/maya">
              <button className="w-full py-3 rounded-full text-sm font-medium" style={{ background: "rgba(200, 169, 110, 0.08)", color: "#C8A96E", border: "1px solid rgba(200, 169, 110, 0.2)" }}>Essayer avec Maya d'abord</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filtered = MOCK_PARCOURS.filter((p) => {
    if (activéTab === "Tous") return true;
    if (activéTab === "Brouillons") return p.status === "brouillon";
    if (activéTab === "Validés") return p.status === "validé";
    if (activéTab === "Partagés") return p.visibility === "partagé";
    return true;
  });

  return (
    <div style={{ background: "#070B14", color: "#F0EDE6", minHeight: "100vh" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold mb-1"
              style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
            >
              Mes parcours
            </h1>
            <p className="text-sm" style={{ color: "#8B8D94" }}>{MOCK_PARCOURS.length} parcours</p>
          </div>
          <Link href="/maya">
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
            >
              <Plus size={16} />
              Nouveau
            </button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <div className="max-w-5xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab}
              className="pill-item flex-shrink-0"
              style={{
                background: activéTab === tab ? "linear-gradient(135deg, #C8A96E, #E8D5A8)" : "rgba(200, 169, 110, 0.08)",
                color: activéTab === tab ? "#070B14" : "#8B8D94",
                border: activéTab === tab ? "none" : "1px solid rgba(200, 169, 110, 0.15)",
                fontWeight: activéTab === tab ? 600 : 400,
              }}
              onClick={() => setActivéTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 pb-8">
        <div className="max-w-5xl mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="font-semibold mb-2" style={{ color: "#F0EDE6" }}>Aucun parcours</h3>
                <p className="text-sm" style={{ color: "#8B8D94" }}>Créez un parcours avec Maya</p>
              <Link href="/maya">
                <button
                  className="px-6 py-3 rounded-full text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
                >
                  Créer avec Maya
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((parcours) => {
                const statusCfg = STATUS_CONFIG[parcours.status];
                return (
                  <div
                    key={parcours.id}
                    className="rounded-2xl overflow-hidden card-hover cursor-pointer"
                    style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.12)" }}
                  >
                    {/* Photo */}
                    <div className="relative h-36">
                      <img src={parcours.img} alt={parcours.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(7,11,20,0.8) 0%, transparent 50%)" }} />
                      {/* Status badge */}
                      <div
                        className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold"
                        style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.color}40` }}
                      >
                        {statusCfg.label}
                      </div>
                      {/* Visibility */}
                      <div className="absolute top-3 right-3">
                        {parcours.visibility === "partagé" ? (
                          <Globe size={14} color="rgba(200,169,110,0.8)" />
                        ) : (
                          <Lock size={14} color="rgba(139,141,148,0.8)" />
                        )}
                      </div>
                    </div>

                    {/* Infos */}
                    <div className="p-4">
                      <h3
                        className="font-semibold mb-1 leading-tight"
                        style={{ color: "#F0EDE6", fontFamily: "'Playfair Display', serif" }}
                      >
                        {parcours.title}
                      </h3>
                      <div className="flex items-center gap-1 mb-3">
                        <MapPin size={11} color="#8B8D94" />
                        <span className="text-xs" style={{ color: "#8B8D94" }}>{parcours.destination}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: "#8B8D94" }}>
                        <div className="flex items-center gap-1">
                          <Calendar size={11} />
                          <span>{parcours.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span style={{ color: "#C8A96E", fontWeight: 600 }}>{parcours.budget}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{parcours.steps} etapes</span>
                        </div>
                      </div>
                      {parcours.shared > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: "#8B8D94" }}>
                          <Users size={11} />
                          <span>{parcours.shared} personnes</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
