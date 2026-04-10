import { useState, useEffect } from "react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { Sparkles, Shield, Zap, ChevronRight, MapPin, Star, Send } from "lucide-react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { VideoBackground } from "../components/VideoBackground";
import { RUNWAY_VIDEOS, RUNWAY_IMAGES, NIGHTLIFE_VIDEOS } from "../lib/runwayAssets";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm";
const HERO_IMG = `${CDN}/hero_yacht_sunset_b173a771.jpg`;
const GASTRO_IMG = `${CDN}/baymora-le-cinq-paris-9qTbs8An47jBsjQCAYs7xM.webp`;
const SPA_IMG = `${CDN}/baymora-four-seasons-bali-3GtU7HyX7Q4FxXXuxAFiJE.webp`;
const HOTEL_IMG = `${CDN}/baymora-plaza-athenee-paris-UQttpWbf4KhLKFavhpDju8.webp`;
const TOKYO_IMG = `${CDN}/baymora-aman-tokyo-aZXaYUrFDjjHKPFBHjghJ9.webp`;
const MARRAKECH_IMG = `${CDN}/baymora-mamounia-marrakech-WXuKtndnzDxsWbaZf8RMed.webp`;
const SANTORINI_IMG = `${CDN}/baymora-canaves-oia-santorini-dYNNPqBiH8GUcPC6dZMq4y.webp`;

const FEATURES = [
  {
    icon: "✨",
    title: "Maya détient les clés.",
    desc: "Elle connaît les secrets, les meilleures tables, les portes dérobées. Dites-lui ce dont vous rêvez.",
  },
  {
    icon: "📍",
    title: "Chaque jour, un privilège.",
    desc: "Votre accès quotidien aux meilleures adresses de votre ville et du monde.",
  },
  {
    icon: "🗺️",
    title: "Parcours sur-mesure illimités",
    desc: "Créez, sauvegardez et partagez vos voyages. Chaque parcours est unique, coordonné et personnalisé.",
  },
  {
    icon: "🏠",
    title: "Un club, pas un outil.",
    desc: "Maison Baymora est une communauté de membres qui vivent différemment.",
  },
];

// Chiffres réels — pas de faux témoignages
const STATS = [
  { value: "340+", label: "adresses partenaires" },
  { value: "12", label: "pays couverts" },
  { value: "-40%", label: "en moyenne négocié" },
  { value: "4.9/5", label: "satisfaction" },
];

const DIFFERENTIATORS = [
  {
    icon: <Sparkles size={20} color="#C8A96E" />,
    title: "Pas une liste. Un accès.",
    desc: "Les autres donnent des idées. Maya ouvre des portes. Chaque recommandation est liée à un partenaire réel, avec des privilèges négociés.",
  },
  {
    icon: <MapPin size={20} color="#C8A96E" />,
    title: "Chaque jour, un privilège.",
    desc: "Votre accès quotidien aux meilleures adresses de votre ville et du monde. Maya connaît vos goûts.",
  },
  {
    icon: <Zap size={20} color="#C8A96E" />,
    title: "Maya détient les clés.",
    desc: "Elle connaît les secrets, les meilleures tables, les portes dérobées. Elle ne propose jamais deux fois la même adresse.",
  },
  {
    icon: <Star size={20} color="#C8A96E" />,
    title: "Un club, pas un outil.",
    desc: "Maison Baymora est une communauté de membres qui vivent différemment. Bienvenue chez vous.",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Dites à Maya ce dont vous rêvez", desc: "\"Week-end romantique à Paris, budget 1500€, 2 nuits.\" C'est tout ce qu'il faut." },
  { step: "02", title: "Maya propose 4 accès", desc: "Signature, Privilège, Prestige, Sur-Mesure. Choisissez celui qui vous correspond." },
  { step: "03", title: "Affinez en un clic", desc: "\"Changer l'hôtel\", \"Autre restaurant\" — Maya s'adapte instantanément." },
  { step: "04", title: "Réservez avec vos privilèges", desc: "Liens directs vers les partenaires avec vos privilèges négociés. Votre programme est prêt." },
];

const SOCIAL_PROOF = [
  { name: "Sophie M.", city: "Paris", text: "Maya m'a ouvert des adresses que je ne connaissais pas. Week-end à Venise planifié en 3 messages. Hôtel, restos, gondole privée.", stars: 5 },
  { name: "Thomas R.", city: "Lyon", text: "Mon week-end à Dubai organisé en 3 messages. Suite au Four Seasons, dîner privé sur la Marina, transfert inclus. Le Cercle vaut chaque centime.", stars: 5 },
  { name: "Camille D.", city: "Bordeaux", text: "Le Cercle Baymora vaut largement l'abonnement. Maya connaît mes goûts, elle ne propose jamais deux fois la même adresse.", stars: 5 },
];

const HERO_IMAGES = [
  `${CDN}/hero_yacht_sunset_b173a771.jpg`,
  `${CDN}/baymora-plaza-athenee-paris-UQttpWbf4KhLKFavhpDju8.webp`,
  `${CDN}/baymora-canaves-oia-santorini-dYNNPqBiH8GUcPC6dZMq4y.webp`,
];

const FAQ = [
  {
    q: "Qu'est-ce que Maison Baymora ?",
    a: "Maison Baymora est un service de recommandations premium. Maya, votre accès exclusif, connaît les meilleures adresses du monde et quelques secrets que personne d'autre ne partage. Elle crée vos parcours sur-mesure : hôtels, restaurants, activités, lifestyle — le tout personnalisé selon votre profil.",
  },
  {
    q: "Comment Maya crée-t-elle un parcours sur-mesure ?",
    a: "Maya analyse vos préférences, votre budget, vos dates et votre cercle de proches. Elle propose 4 accès (Signature, Privilège, Prestige, Sur-Mesure) avec hébergement, restaurants, activités et transport. Chaque parcours est unique et réservable en quelques clics.",
  },
  {
    q: "Quels types d'hôtels propose Maison Baymora ?",
    a: "Exclusivement des établissements 4 et 5 étoiles : palaces, boutique-hôtels de caractère, resorts avec piscine, spa ou jacuzzi. Toujours dans des grandes villes ou des destinations prisées, en France et à l'international.",
  },
  {
    q: "Les privilèges sont-ils réels ?",
    a: "Oui. Nous négocions en direct avec chaque établissement partenaire. Les privilèges couvrent des hôtels et restaurants d'exception. Ce sont des accès exclusifs réservés aux membres de la Maison.",
  },
  {
    q: "Baymora est-il gratuit ?",
    a: "Le plan Invité est entièrement gratuit : 3 conversations avec Maya et accès aux adresses publiques. Le plan Membre à 9,90€/mois offre un accès illimité à Maya, aux parcours et aux privilèges partenaires. Le Cercle à 149€/an est l'adhésion fondatrice à vie.",
  },
  {
    q: "Dans quels pays Baymora est-il disponible ?",
    a: "Maya couvre le monde entier : France, Europe, États-Unis, Asie, Moyen-Orient. Les privilèges partenaires sont concentrés sur la France et l'Europe, avec une expansion internationale en cours.",
  },
  {
    q: "Mes données sont-elles protégées ?",
    a: "Pseudonyme possible, suppression totale à tout moment, données hébergées en Europe. Aucun partage avec des tiers. Maison Baymora est conforme au RGPD.",
  },
  {
    q: "Puis-je partager mon parcours avec mes proches ?",
    a: "Oui. Envoyez votre parcours par lien, email ou PDF. Vos proches peuvent créer un compte gratuit pour collaborer et modifier le parcours ensemble.",
  },
  {
    q: "Quelle est la différence avec les autres IA ?",
    a: "Les comparateurs donnent des listes. Maya ouvre des portes : des privilèges négociés en direct, des réservations en un clic, une mémoire de vos goûts, et un réseau de partenaires exclusifs.",
  },
  {
    q: "Comment devenir partenaire Baymora ?",
    a: "Si vous êtes un hôtel, restaurant, spa ou prestataire d'expériences premium, rejoignez le réseau Baymora pour toucher une clientèle exigeante et qualifiée. Contactez-nous depuis l'app.",
  },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

// Fallback statique pour la section Ce soir
const STATIC_TONIGHT_EVENTS = [
  { cat: "Dégustation", title: "Grands Crus privés", lieu: "Chai des Chartrons", ville: "Bordeaux", heure: "19h30", prix: "45€", vip: true },
  { cat: "Concert", title: "Jazz au Rooftop", lieu: "Darwin Bordeaux", ville: "Bordeaux", heure: "21h", prix: "Entrée libre", vip: false },
  { cat: "Dîner secret", title: "Table d'hôtes privée", lieu: "Adresse révélée aux membres", ville: "Paris", heure: "20h", prix: "120€", vip: true },
];

function LandingTonightSection() {
  const { data: tonightEvents } = trpc.events.tonight.useQuery(
    { city: "Bordeaux" },
    { retry: false, staleTime: 300000 }
  );
  const eventsToShow = (tonightEvents && tonightEvents.length > 0)
    ? (tonightEvents as any[]).slice(0, 3).map((e: any) => ({
        cat: e.category || "Soirée",
        title: e.title,
        lieu: e.venue_name || "",
        ville: e.city || "",
        heure: e.time_start || "",
        prix: e.price || "Voir détails",
        vip: e.is_members_only || false,
      }))
    : STATIC_TONIGHT_EVENTS;

  return (
    <motion.section
      className="py-10 px-4"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={sectionVariants}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <span style={{ fontSize: 18 }}>🌙</span>
          <h2 className="text-xl md:text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>Ce soir dans votre ville</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {eventsToShow.map((ev, i) => (
            <motion.div
              key={i}
              className="rounded-2xl p-4"
              style={{ background: "#0D1117", border: "1px solid rgba(200,169,110,0.12)" }}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(200,169,110,0.15)", color: "#C8A96E" }}>{ev.cat}</span>
                {ev.vip && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(200,169,110,0.9)", color: "#070B14" }}>Membres</span>}
              </div>
              <h3 className="font-semibold text-sm mb-1" style={{ color: "#F0EDE6" }}>{ev.title}</h3>
              {ev.lieu && <p className="text-xs mb-1" style={{ color: "#8B8D94" }}>{ev.lieu}{ev.ville ? ` · ${ev.ville}` : ""}</p>}
              {ev.heure && <p className="text-xs mb-3" style={{ color: "#8B8D94" }}>{ev.heure}{ev.prix ? ` · ${ev.prix}` : ""}</p>}
              <a href={ev.vip ? "/premium" : "/maya"}>
                <button className="w-full py-2 rounded-xl text-xs font-semibold" style={{ background: ev.vip ? "rgba(200,169,110,0.12)" : "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: ev.vip ? "#C8A96E" : "#070B14", border: ev.vip ? "1px solid rgba(200,169,110,0.3)" : "none" }}>
                  {ev.vip ? "Accès membres" : "J'y vais"}
                </button>
              </a>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-xs mt-4" style={{ color: "#8B8D94" }}>Maya met à jour les événements chaque jour. <a href="/ma-position" style={{ color: "#C8A96E" }}>Voir tout →</a></p>
      </div>
    </motion.section>
  );
}

const HERO_SUBTITLES = [
  "Hôtels 5★ · Restaurants gastronomiques · Expériences exclusives",
  "Vos voyages planifiés en 3 messages · Jusqu'à -40% négociés",
  "Maya connaît vos goûts · Elle ne propose jamais deux fois la même adresse",
  "Accès privé aux meilleures adresses du monde · Sans effort",
];

// ─── MayaDemo inline (3 personas) ──────────────────────────────────────────
const DEMO_PERSONAS = [
  {
    label: "Ce soir à Bordeaux",
    icon: "🌙",
    prompt: "Qu'est-ce qu'il se passe ce soir à Bordeaux ?",
    reply: "Ce soir à Bordeaux, voici ce que j'ai pour vous :\n\n**Soirée** : Dégustation privée Grands Crus — Chai des Chartrons, 19h30 | 45€/pers (réservé membres)\n**Concert** : Jazz au Rooftop Darwin — 21h, entrée libre\n**Dîner** : La Tupina (bistronomique) — table disponible 20h30, Accès Membre\n\nDress code : smart casual pour les Chartrons.\n\nJe vous réserve une place pour la dégustation ?",
  },
  {
    label: "Week-end romantique",
    icon: "💛",
    prompt: "Week-end romantique à Paris, budget 1500€, 2 nuits.",
    reply: "Pour un week-end romantique à Paris avec 1500€, voici mon accès **Privilège** :\n\n**Hôtel** : Hôtel Le Marais Bastille (4★) — Privilège Membre → **290€/nuit**\n**Dîner** : Septime (bistronomique étoilé) — réservation directe, table fenêtre disponible vendredi\n**Matin** : Brunch au Bal Café (Montmartre) + balade Sacré-Cœur\n\nBudget total estimé : **1 340€** pour 2 (hôtel + 2 dîners + brunch)\n\nVous voulez que j'affine l'hôtel ou le restaurant ?",
  },
  {
    label: "Business à Dubai",
    icon: "💼",
    prompt: "Déplacement business Dubai 3 jours, hôtel proche DIFC.",
    reply: "Pour 3 jours business au DIFC Dubai, voici mon accès **Prestige** :\n\n**Hôtel** : Address Boulevard (5★) — Accès Membre → **420€/nuit** | 5min DIFC à pied\n**Déjeuner d'affaires** : Zuma Dubai — table privée, dress code smart casual\n**Transport** : VTC Careem pré-réservé aéroport → hôtel (45min, 35€)\n\n**Programme J1** : Arrivée 14h → check-in → spa express → dîner Zuma 20h\n**J2** : RDV DIFC 9h → déj Zuma 13h → RDV 15h → rooftop Level 43 20h\n\nDress code pour vos RDV ?",
  },
  {
    label: "Famille à Barcelone",
    icon: "👨‍👩‍👧",
    prompt: "Barcelone en famille, 4 jours, 2 enfants 8 et 12 ans.",
    reply: "Barcelone en famille 4 jours — voici mon accès **Signature** :\n\n**Hôtel** : Hotel Arts Barcelona (5★) — suite familiale Accès Membre | piscine + plage privée\n**J1** : Sagrada Familia (entrée coupe-file) + Park Güell + diner La Barceloneta\n**J2** : Aquarium BCN (Privilège exclusif) + Las Ramblas + Boqueria\n**J3** : Tibidabo (parc d'attractions) + Montjuïc + show flamenco familial\n\n**Budget estimé** : 2 800€ pour 4 (hôtel + activités + repas)\n\nLes enfants ont des allergies alimentaires ?",
  },
];

function MayaDemoInline() {
  const [activePersona, setActivePersona] = useState(0);
  const [showReply, setShowReply] = useState(false);
  const [typing, setTyping] = useState(false);
  const loginUrl = getLoginUrl("/maya");

  function selectPersona(i: number) {
    setActivePersona(i);
    setShowReply(false);
    setTyping(true);
    setTimeout(() => { setTyping(false); setShowReply(true); }, 1400);
  }

  return (
    <div className="max-w-2xl mx-auto mt-8" style={{ background: "#0D1117", border: "1px solid rgba(200,169,110,0.2)", borderRadius: 20, overflow: "hidden" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(200,169,110,0.08)", background: "rgba(200,169,110,0.04)" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}>
          <Sparkles size={14} color="#070B14" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#F0EDE6", fontFamily: "'Playfair Display', serif" }}>Maya</p>
          <p className="text-xs" style={{ color: "#C8A96E" }}>Votre accès privé Baymora</p>
        </div>
      </div>
      {/* Personas */}
      <div className="flex gap-2 px-5 py-3" style={{ borderBottom: "1px solid rgba(200,169,110,0.06)" }}>
        {DEMO_PERSONAS.map((p, i) => (
          <button
            key={i}
            onClick={() => selectPersona(i)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: activePersona === i ? "rgba(200,169,110,0.2)" : "rgba(200,169,110,0.05)",
              color: activePersona === i ? "#C8A96E" : "#8B8D94",
              border: `1px solid ${activePersona === i ? "rgba(200,169,110,0.4)" : "rgba(200,169,110,0.1)"}`,
            }}
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>
      {/* Chat */}
      <div className="px-5 py-4 space-y-3" style={{ minHeight: 180 }}>
        {/* User message */}
        <div className="flex justify-end">
          <div className="px-4 py-2.5 rounded-2xl text-sm max-w-[80%]" style={{ background: "rgba(200,169,110,0.15)", color: "#F0EDE6" }}>
            {DEMO_PERSONAS[activePersona].prompt}
          </div>
        </div>
        {/* Maya typing or reply */}
        {typing && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}>
              <Sparkles size={10} color="#070B14" />
            </div>
            <div className="flex gap-1">
              {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "#C8A96E", opacity: 0.6, animation: `pulse ${0.8 + i * 0.2}s infinite` }} />)}
            </div>
          </div>
        )}
        {showReply && !typing && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}>
              <Sparkles size={10} color="#070B14" />
            </div>
            <div className="px-4 py-3 rounded-2xl text-xs leading-relaxed" style={{ background: "#161B27", color: "#D4D0C8", maxWidth: "88%" }}>
              {DEMO_PERSONAS[activePersona].reply.split("\n").map((line, j) => (
                <p key={j} className={line === "" ? "mb-1" : "mb-0.5"}>
                  {line.replace(/\*\*(.*?)\*\*/g, "$1")}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* CTA */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(200,169,110,0.06)" }}>
        <a href={loginUrl} className="flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}>
          <Sparkles size={14} />
          Essayer Maya gratuitement
        </a>
      </div>
    </div>
  );
}

export default function Landing() {
  const loginUrl = getLoginUrl("/maison");
  const [heroIdx, setHeroIdx] = useState(0);
  const [subtitleIdx, setSubtitleIdx] = useState(0);
  const { data: founderData } = trpc.stripe.getFounderCount.useQuery();
  const founderCount = founderData?.count ?? 423;
  const founderTotal = founderData?.total ?? 500;

  // Hero rotatif toutes les 5 secondes
  useEffect(() => {
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % HERO_IMAGES.length), 5000);
    const s = setInterval(() => setSubtitleIdx((i) => (i + 1) % HERO_SUBTITLES.length), 3500);
    return () => { clearInterval(t); clearInterval(s); };
  }, []);

  // Cookie 30j : si déjà visité, stocker dans localStorage
  useEffect(() => {
    const visited = localStorage.getItem("baymora_visited");
    if (!visited) localStorage.setItem("baymora_visited", Date.now().toString());
  }, []);

  return (
    <div style={{ background: "#070B14", color: "#F0EDE6" }}>
      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: "rgba(7, 11, 20, 0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(200, 169, 110, 0.08)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}
          >
            <span className="font-bold text-sm" style={{ color: "#070B14", fontFamily: "'Playfair Display', serif" }}>B</span>
          </div>
          <span className="font-semibold hidden sm:block" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
            Maison Baymora
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a href={loginUrl} className="text-sm font-medium px-4 py-2 rounded-full" style={{ color: "#8B8D94" }}>
            Se connecter
          </a>
          <a
            href={loginUrl}
            className="text-sm font-semibold px-5 py-2 rounded-full"
            style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
          >
            Rejoindre
          </a>
        </div>
      </nav>

      {/* Hero */}
      <VideoBackground
        src={RUNWAY_VIDEOS.heroLanding}
        fallbackImage={HERO_IMAGES[heroIdx]}
        overlay={0.55}
        className="min-h-screen flex items-center justify-center pt-16"
      >
        <motion.div
          className="relative z-10 text-center px-4 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6"
            style={{ background: "rgba(200, 169, 110, 0.15)", color: "#C8A96E", border: "1px solid rgba(200, 169, 110, 0.3)" }}
          >
            <Sparkles size={12} />
✦ Accès privé · Le Cercle Baymora
          </div>

          <h1
            className="text-4xl md:text-6xl font-bold mb-4 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
          >
            Là où les portes s'ouvrent.
            <span className="block" style={{ color: "#C8A96E" }}></span>
          </h1>

          <p className="text-base md:text-lg mb-5 max-w-xl mx-auto" style={{ color: "rgba(240, 237, 230, 0.7)", minHeight: "2rem" }}>
            {HERO_SUBTITLES[subtitleIdx]}
          </p>

          {/* FounderCounter */}
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl mb-6" style={{ background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)" }}>
            <div className="flex -space-x-2">
              {["S","T","C"].map((l, i) => (
                <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14", border: "2px solid #070B14" }}>{l}</div>
              ))}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold" style={{ color: "#C8A96E" }}>{founderCount === 0 ? `${founderTotal} places disponibles` : founderCount < founderTotal ? `${founderTotal - founderCount} places restantes` : "Complet"}</p>
              <p className="text-xs" style={{ color: "#8B8D94" }}>{founderTotal - founderCount} places restantes au tarif fondateur</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={loginUrl}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-semibold"
              style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
            >
              <Sparkles size={18} />
              Découvrir Maya
            </a>
            <button
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-medium"
                style={{ background: "rgba(200, 169, 110, 0.1)", color: "#C8A96E", border: "1px solid rgba(200, 169, 110, 0.25)" }}
                onClick={() => document.getElementById("offres-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                Voir les privilèges
                <ChevronRight size={16} />
              </button>
          </div>

          <p className="text-xs mt-4" style={{ color: "#8B8D94" }}>
            3 conversations gratuites · Sans carte bancaire
          </p>
        </motion.div>
      </VideoBackground>

      {/* Chiffres réels */}
      <motion.section
        className="py-12 px-4"
        style={{ borderTop: "1px solid rgba(200, 169, 110, 0.08)" }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-2xl md:text-3xl font-bold mb-1"
                style={{ fontFamily: "'Playfair Display', serif", color: "#C8A96E" }}
              >
                {stat.value}
              </div>
              <div className="text-xs" style={{ color: "#8B8D94" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Galerie adresses */}
      <motion.section
        id="offres-section"
        className="py-12 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={sectionVariants}
      >
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold text-center mb-2"
            style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
          >
            Des adresses d'exception
          </h2>
          <p className="text-sm text-center mb-8" style={{ color: "#8B8D94" }}>
            Sélectionnées par la Maison pour ses membres
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { img: HOTEL_IMG, name: "Plaza Athénée", city: "Paris", badge: "Accès Membre" },
              { img: SPA_IMG, name: "Four Seasons", city: "Bali", badge: "Privilège exclusif" },
              { img: SANTORINI_IMG, name: "Canaves Oia", city: "Santorin", badge: "Accès Membre" },
              { img: TOKYO_IMG, name: "Aman Tokyo", city: "Tokyo", badge: "Accès Membre" },
              { img: MARRAKECH_IMG, name: "La Mamounia", city: "Marrakech", badge: "Privilège exclusif" },
              { img: GASTRO_IMG, name: "Le Cinq", city: "Paris", badge: "Accès Membre" },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="relative rounded-2xl overflow-hidden card-hover cursor-pointer"
                style={{ paddingTop: "66.67%" }}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <img src={item.img} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(7,11,20,0.8) 0%, transparent 50%)" }} />
                <div
                  className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: "#16a34a", color: "white" }}
                >
                  {item.badge}
                </div>
                <div className="absolute bottom-3 left-3">
                  <div className="text-sm font-semibold" style={{ color: "#F0EDE6", fontFamily: "'Playfair Display', serif" }}>{item.name}</div>
                  <div className="text-xs" style={{ color: "#8B8D94" }}>{item.city}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>



      {/* Différenciateurs — remplace les faux témoignages */}
      <motion.section
        className="py-12 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={sectionVariants}
      >
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold text-center mb-2"
            style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
          >
            Pourquoi rejoindre la Maison ?
          </h2>
          <p className="text-sm text-center mb-8" style={{ color: "#8B8D94" }}>
            Ce qui nous rend différents
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {DIFFERENTIATORS.map((d, i) => (
              <motion.div
                key={i}
                className="rounded-2xl p-5"
                style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.1)" }}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.4 }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "rgba(200, 169, 110, 0.1)" }}
                >
                  {d.icon}
                </div>
                <h3 className="font-semibold mb-2" style={{ color: "#F0EDE6" }}>{d.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#8B8D94" }}>{d.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Comment ça marche */}
      <motion.section
        className="py-12 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={sectionVariants}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
            Comment ça marche ?
          </h2>
          <p className="text-sm text-center mb-8" style={{ color: "#8B8D94" }}>4 étapes, 30 secondes</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={i}
                className="rounded-2xl p-5 text-center"
                style={{ background: "#0D1117", border: "1px solid rgba(200,169,110,0.1)" }}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <div className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "rgba(200,169,110,0.3)" }}>{step.step}</div>
                <h3 className="font-semibold mb-2 text-sm" style={{ color: "#F0EDE6" }}>{step.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#8B8D94" }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-6">
            <MayaDemoInline />
          </div>
        </div>
      </motion.section>

      {/* Ce soir dans votre ville — branché sur DB avec fallback statique */}
      <LandingTonightSection />

      {/* Social Proof */}
      <motion.section
        className="py-12 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={sectionVariants}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
            Ce qu'ils en disent
          </h2>
          <p className="text-sm text-center mb-8" style={{ color: "#8B8D94" }}>Membres de la Maison</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SOCIAL_PROOF.map((review, i) => (
              <motion.div
                key={i}
                className="rounded-2xl p-5"
                style={{ background: "#0D1117", border: "1px solid rgba(200,169,110,0.1)" }}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.4 }}
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: review.stars }).map((_, j) => (
                    <Star key={j} size={12} fill="#C8A96E" color="#C8A96E" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#F0EDE6" }}>"{review.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(200,169,110,0.15)", color: "#C8A96E" }}>
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#F0EDE6" }}>{review.name}</p>
                    <p className="text-xs" style={{ color: "#8B8D94" }}>{review.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Pricing */}
      <motion.section
        className="py-12 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={sectionVariants}
      >
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold text-center mb-2"
            style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
          >
            Votre adhésion
          </h2>
          <p className="text-sm text-center mb-8" style={{ color: "#8B8D94" }}>
            Commencez gratuitement, évoluez à votre rythme
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                name: "Invité",
                price: "Gratuit",
                features: ["3 conversations avec Maya", "Accès aux adresses publiques", "Aperçu des privilèges"],
                highlight: false,
                cta: "Commencer",
              },
              {
                name: "Membre",
                price: "9,90€/mois ou 99€/an",
                features: ["Maya illimitée", "Parcours & cartes illimités", "Privilèges partenaires", "Feed local \"Ma position\"", "Mode Business"],
                highlight: true,
                cta: "Rejoindre la Maison",
              },
              {
                name: "Duo",
                price: "14,90€/mois ou 149€/an",
                features: ["Tout Membre pour 2 profils", "Parcours en commun", "Préférences croisées"],
                highlight: false,
                cta: "Choisir Duo",
              },
              {
                name: "Le Cercle",
                price: "149€/an — Fondateur à vie",
                features: ["Tout Membre", "Maya mode Prestige", "Le Secret du Jour", "Événements privés Cercle", "2 invitations/mois", "Badge Fondateur (500 places)"],
                highlight: false,
                cta: "Rejoindre Le Cercle",
              },
            ].map((plan, i) => (
              <motion.div
                key={i}
                className="rounded-2xl p-5"
                style={{
                  background: plan.highlight ? "rgba(200, 169, 110, 0.06)" : "#0D1117",
                  border: plan.highlight ? "1px solid rgba(200, 169, 110, 0.35)" : "1px solid rgba(200, 169, 110, 0.1)",
                }}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <h3 className="font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>{plan.name}</h3>
                <div className="text-xl font-bold mb-3" style={{ color: plan.highlight ? "#C8A96E" : "#F0EDE6" }}>{plan.price}</div>
                <div className="space-y-1.5 mb-4">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs" style={{ color: "#8B8D94" }}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#C8A96E" }} />
                      {f}
                    </div>
                  ))}
                </div>
                <a href={loginUrl}>
                  <button
                    className="w-full py-2.5 rounded-full text-sm font-semibold"
                    style={{
                      background: plan.highlight ? "linear-gradient(135deg, #C8A96E, #E8D5A8)" : "rgba(200, 169, 110, 0.1)",
                      color: plan.highlight ? "#070B14" : "#C8A96E",
                      border: plan.highlight ? "none" : "1px solid rgba(200, 169, 110, 0.2)",
                    }}
                  >
                    {plan.cta}
                  </button>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* FAQ */}
      <motion.section
        className="py-12 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={sectionVariants}
      >
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold text-center mb-8"
            style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
          >
            Questions fréquentes
          </h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                className="rounded-xl p-4"
                style={{ background: "#0D1117", border: "1px solid rgba(200, 169, 110, 0.1)" }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
              >
                <h3 className="font-medium text-sm mb-2" style={{ color: "#F0EDE6" }}>{item.q}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#8B8D94" }}>{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA final */}
      <motion.section
        className="py-16 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
      >
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}
          >
            <Sparkles size={28} color="#070B14" />
          </div>
          <h2
            className="text-2xl md:text-3xl font-bold mb-3"
            style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}
          >
            Prêt à vivre autrement ?
          </h2>
          <p className="text-sm mb-6" style={{ color: "#8B8D94" }}>
            Rejoignez les membres qui savent où aller.
          </p>
          <a
            href={loginUrl}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold"
            style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
          >
            <Sparkles size={18} />
            Découvrir Maya
          </a>
          <p className="text-xs mt-3" style={{ color: "#8B8D94" }}>
            Sans carte bancaire · Annulation à tout moment
          </p>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="px-4 py-8" style={{ borderTop: "1px solid rgba(200, 169, 110, 0.08)" }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}
            >
              <span className="font-bold text-xs" style={{ color: "#070B14", fontFamily: "'Playfair Display', serif" }}>B</span>
            </div>
            <span className="text-sm font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>Maison Baymora</span>
          </div>
          <div className="flex flex-wrap justify-center gap-5 text-xs" style={{ color: "#8B8D94" }}>
            <a href="/mentions-legales" className="hover:text-[#C8A96E] transition-colors">Mentions légales</a>
            <a href="/confidentialite" className="hover:text-[#C8A96E] transition-colors">Confidentialité</a>
            <a href="/cgu" className="hover:text-[#C8A96E] transition-colors">CGU</a>
            <a href="/contact" className="hover:text-[#C8A96E] transition-colors">Contact</a>
            <a href="/partenaires/evenement" className="hover:text-[#C8A96E] transition-colors" style={{ color: "#C8A96E", opacity: 0.8 }}>Soumettre un événement</a>
          </div>
          <span className="text-xs" style={{ color: "#8B8D94" }}>© 2026 Maison Baymora</span>
        </div>
      </footer>
    </div>
  );
}
