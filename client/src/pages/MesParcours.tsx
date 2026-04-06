import { useState } from "react";
import { Map, Bookmark, Plus, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "../lib/trpc";
import { useAuth } from "../_core/hooks/useAuth";
import { getLoginUrl } from "../const";
import MobileBackButton from "../components/MobileBackButton";

export default function MesParcours() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"trips" | "saved">("trips");

  const { data: myTrips, isLoading: tripsLoading } = trpc.trips.getMyPlans.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <Map size={48} className="text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Vos parcours vous attendent</h2>
          <p className="text-white/50 text-sm mb-6">Connectez-vous pour accéder à vos voyages et sauvegardes.</p>
          <a href={getLoginUrl()} className="inline-block bg-amber-500 text-black font-semibold px-6 py-2.5 rounded-lg text-sm">
            Se connecter
          </a>
        </div>
      </div>
    );
  }

  const trips = myTrips || [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <MobileBackButton />

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Mes Parcours</h1>
          <Link href="/chat">
            <button className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-amber-500/20">
              <Plus size={14} /> Créer
            </button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("trips")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              tab === "trips"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
            }`}
          >
            <Map size={14} /> Mes voyages
          </button>
          <button
            onClick={() => setTab("saved")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              tab === "saved"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
            }`}
          >
            <Bookmark size={14} /> Sauvegardes
          </button>
        </div>

        {/* Content */}
        {tab === "trips" && (
          <div>
            {tripsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : trips.length === 0 ? (
              <div className="text-center py-16">
                <Map size={40} className="text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm mb-4">Aucun voyage planifié</p>
                <Link href="/chat">
                  <button className="bg-amber-500 text-black font-semibold px-5 py-2 rounded-lg text-sm">
                    Demander à ARIA
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {trips.map((trip: any) => (
                  <Link key={trip.id} href={`/trip/${trip.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 cursor-pointer">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white/90 truncate">{trip.title || trip.destination}</p>
                        <p className="text-xs text-white/40 mt-0.5">{trip.destination} · {trip.duration || "?"} jours</p>
                      </div>
                      <ChevronRight size={16} className="text-white/30 flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "saved" && (
          <div className="text-center py-16">
            <Bookmark size={40} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm mb-4">Aucune sauvegarde pour l'instant</p>
            <Link href="/discover">
              <button className="bg-white/10 text-white/70 font-medium px-5 py-2 rounded-lg text-sm border border-white/10">
                Explorer les fiches
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
