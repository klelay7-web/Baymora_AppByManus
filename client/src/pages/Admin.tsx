import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect } from "wouter";

import AdminContenu from "@/components/admin/AdminContenu";
import AdminRenseignement from "@/components/admin/AdminRenseignement";
import AdminQualite from "@/components/admin/AdminQualite";
import AdminMembres from "@/components/admin/AdminMembres";
import AdminCroissance from "@/components/admin/AdminCroissance";
import AdminSysteme from "@/components/admin/AdminSysteme";

const ADMIN_EMAILS = ["k.lelay7@gmail.com"];
const TABS = ["Contenu", "Renseignement", "Qualité", "Membres", "Croissance", "Système"] as const;

export default function Admin() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Contenu");

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}><div className="animate-pulse text-sm" style={{ color: "#C8A96E" }}>Chargement...</div></div>;
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) return <Redirect to="/maison" />;

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", color: "#fff" }}>
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-12">
        <h1 className="text-xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#C8A96E" }}>
          Administration Baymora
        </h1>
        <p className="text-xs mb-6" style={{ color: "#888" }}>{user.email}</p>

        <div className="flex gap-1 overflow-x-auto mb-8 border-b" style={{ borderColor: "#333" }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors"
              style={{
                color: tab === t ? "#C8A96E" : "#888",
                borderBottom: tab === t ? "2px solid #C8A96E" : "2px solid transparent",
                minHeight: 48,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Contenu" && <AdminContenu />}
        {tab === "Renseignement" && <AdminRenseignement />}
        {tab === "Qualité" && <AdminQualite />}
        {tab === "Membres" && <AdminMembres />}
        {tab === "Croissance" && <AdminCroissance />}
        {tab === "Système" && <AdminSysteme />}
      </div>
    </div>
  );
}
