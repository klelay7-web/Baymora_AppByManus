import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MapPin, RefreshCw } from "lucide-react";

interface Category {
  emoji: string;
  title: string;
  description: string;
  mayaMessage: (city: string) => string;
}

const CATEGORIES: Category[] = [
  {
    emoji: "🎭",
    title: "Sortir",
    description: "Events, soirées, vernissages, dégustations",
    mayaMessage: (city) => `Qu'est-ce qui te tenterait ce soir à ${city} ?`,
  },
  {
    emoji: "🍽️",
    title: "Manger",
    description: "Restaurants & bars avec privilèges",
    mayaMessage: (city) => `Tu cherches quel type de restaurant à ${city} ?`,
  },
  {
    emoji: "💆",
    title: "Se ressourcer",
    description: "Spas, piscines, bien-être",
    mayaMessage: () => "Spa, piscine, massage — qu'est-ce qui te ferait du bien ?",
  },
  {
    emoji: "🏌️",
    title: "Bouger",
    description: "Sport, padel, golf, yoga",
    mayaMessage: (city) => `Quel sport te tente à ${city} ?`,
  },
  {
    emoji: "💼",
    title: "Travailler",
    description: "Coworking, salles de réunion",
    mayaMessage: () => "Coworking, salle de réunion, café calme — de quoi as-tu besoin ?",
  },
  {
    emoji: "🏠",
    title: "À domicile",
    description: "Chef, nounou, petsitter, livraison",
    mayaMessage: () => "Chef, nounou, ménage, massage, livraison — dis-moi.",
  },
  {
    emoji: "👥",
    title: "Rencontrer",
    description: "Événements membres, networking",
    mayaMessage: (city) => `Tu veux découvrir les événements Baymora proches de ${city} ?`,
  },
  {
    emoji: "🏝️",
    title: "S'évader",
    description: "Séjours flash à proximité",
    mayaMessage: (city) => `Je cherche les meilleurs séjours flash autour de ${city} ?`,
  },
];

export default function MaPosition() {
  const [, navigate] = useLocation();
  const [city, setCity] = useState<string>("votre ville");
  const [loading, setLoading] = useState(true);
  const [manualInput, setManualInput] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      setCity("Paris");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=fr`
          );
          const data = await res.json();
          const detectedCity =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.municipality ||
            "votre ville";
          setCity(detectedCity);
        } catch {
          setCity("votre ville");
        }
        setLoading(false);
      },
      () => {
        setCity("Paris");
        setLoading(false);
      },
      { timeout: 5000 }
    );
  };

  const handleCategoryTap = (cat: Category) => {
    const msg = cat.mayaMessage(city);
    navigate(`/maya?q=${encodeURIComponent(msg)}`);
  };

  const handleManualCity = () => {
    if (inputValue.trim()) {
      setCity(inputValue.trim());
      setManualInput(false);
      setInputValue("");
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "#070B14", color: "#F0EDE6" }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 pt-4 pb-3"
        style={{
          background: "rgba(7, 11, 20, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(200, 169, 110, 0.1)",
        }}
      >
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <MapPin size={18} style={{ color: "#C8A96E" }} />
            {loading ? (
              <span className="text-sm animate-pulse" style={{ color: "#8B8D94" }}>
                Détection en cours...
              </span>
            ) : manualInput ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualCity()}
                  placeholder="Entrez une ville..."
                  className="text-sm bg-transparent border-b outline-none"
                  style={{ color: "#F0EDE6", borderColor: "#C8A96E", width: "140px" }}
                />
                <button
                  onClick={handleManualCity}
                  className="text-xs px-2 py-1 rounded"
                  style={{ background: "#C8A96E", color: "#070B14" }}
                >
                  OK
                </button>
              </div>
            ) : (
              <span className="text-base font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                📍 {city} — Aujourd'hui
              </span>
            )}
          </div>
          <button
            onClick={() => {
              if (manualInput) {
                setManualInput(false);
              } else {
                setManualInput(true);
              }
            }}
            className="text-xs px-3 py-1.5 rounded-full border transition-colors"
            style={{ borderColor: "rgba(200,169,110,0.3)", color: "#C8A96E" }}
          >
            {manualInput ? "Annuler" : "Changer"}
          </button>
        </div>
        <p className="text-xs mt-1 max-w-2xl mx-auto" style={{ color: "#8B8D94" }}>
          Votre accès quotidien aux meilleures adresses de votre ville et du monde.
        </p>
      </div>

      {/* Grid 8 catégories */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.title}
              onClick={() => handleCategoryTap(cat)}
              className="text-left p-4 rounded-2xl transition-all duration-200 active:scale-95"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(200,169,110,0.15)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(200,169,110,0.4)";
                (e.currentTarget as HTMLElement).style.background = "rgba(200,169,110,0.06)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(200,169,110,0.15)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
              }}
            >
              <div className="text-3xl mb-2">{cat.emoji}</div>
              <div className="font-semibold text-sm mb-1" style={{ color: "#F0EDE6" }}>
                {cat.title}
              </div>
              <div className="text-xs leading-snug" style={{ color: "#8B8D94" }}>
                {cat.description}
              </div>
            </button>
          ))}
        </div>

        {/* Refresh géoloc */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={detectLocation}
            className="flex items-center gap-2 text-xs px-4 py-2 rounded-full transition-colors"
            style={{ color: "#8B8D94", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <RefreshCw size={12} />
            Actualiser ma position
          </button>
        </div>

        {/* Note bas de page */}
        <p className="text-center text-xs mt-4" style={{ color: "#4A4D56" }}>
          Ma position fonctionne partout dans le monde. À Barcelone ? Les résultats s'adaptent.
        </p>
      </div>
    </div>
  );
}
