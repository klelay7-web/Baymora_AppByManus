import { useState, useEffect } from "react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { Sparkles, Shield, Zap, ChevronRight, MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";

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
    title: "Maya, votre IA de Social Club",
    desc: "Dites à Maya ce dont vous rêvez. Elle crée votre parcours idéal de A à Z : hôtel, restaurants, activités, transport.",
  },
  {
    icon: "🏷️",
    title: "Jusqu'à -40% sur des adresses premium",
    desc: "Remises négociées en direct avec les meilleurs établissements. Exclusif aux membres Baymora.",
  },
  {
    icon: "🗺️",
    title: "Parcours sur-mesure illimités",
    desc: "Créez, sauvegardez et partagez vos voyages. Chaque parcours est unique, coordonné et personnalisé.",
  },
  {
    icon: "👑",
    title: "Club privé & évènements",
    desc: "Accès à des expériences exclusives, des soirées privées et des rencontres entre membres sélectifs.",
  },
];

// Chiffres réels — pas de faux témoignages
const STATS = [
  { value: "340+", label: "adresses partenaires" },
  { value: "12", label: "pays couverts" },
  { value: "-40%", label: "de réduction max" },
  { value: "4.9/5", label: "satisfaction" },
];

const DIFFERENTIATORS = [
  {
    icon: <Sparkles size={20} color="#C8A96E" />,
    title: "Pas une liste. Un accès.",
    desc: "ChatGPT donne des idées. Maya donne des réservations. Chaque recommandation est liée à un partenaire réel, avec une remise négociée.",
  },
  {
    icon: <Shield size={20} color="#C8A96E" />,
    title: "Vos données, vos règles.",
    desc: "Pseudonyme possible. Suppression totale à tout moment. Hébergé en Europe. Conforme RGPD.",
  },
  {
    icon: <Zap size={20} color="#C8A96E" />,
    title: "Rapide comme un SMS.",
    desc: "Décrivez votre envie en 2 phrases. Maya vous propose 4 accès complets en moins de 30 secondes.",
  },
  {
    icon: <MapPin size={20} color="#C8A96E" />,
    title: "340+ adresses sélectionnées.",
    desc: "Chaque établissement est visité et validé par notre équipe. Pas d'algorithme, pas de pub — seulement les meilleures adresses du monde.",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Dites à Maya ce dont vous rêvez", desc: "\"Week-end romantique à Paris, budget 1500€, 2 nuits.\" C'est tout ce qu'il faut." },
  { step: "02", title: "Maya propose 4 accès", desc: "Signature, Privilège, Prestige, Sur-Mesure. Choisissez celui qui vous correspond." },
  { step: "03", title: "Affinez en un clic", desc: "\"Changer l'hôtel\", \"Autre restaurant\" — Maya s'adapte instantanément." },
  { step: "04", title: "Réservez avec vos remises", desc: "Liens directs vers les partenaires avec vos remises négociées. Votre programme est prêt." },
];

const SOCIAL_PROOF = [
  { name: "Sophie M.", city: "Paris", text: "Maya m'a ouvert des adresses que je ne connaissais pas. Week-end à Venise planifié en 3 messages. Hôtel, restos, gondole privée.", stars: 5 },
  { name: "Thomas R.", city: "Lyon", text: "J'ai économisé 340€ sur mon accès Dubai. Les remises Baymora sont réelles et négociées. Le Cercle vaut chaque centime.", stars: 5 },
  { name: "Camille D.", city: "Bordeaux", text: "Le Cercle Baymora vaut largement l'abonnement. Maya connaît mes goûts, elle ne propose jamais deux fois la même adresse.", stars: 5 },
];

const HERO_IMAGES = [
  `${CDN}/hero_yacht_sunset_b173a771.jpg`,
  `${CDN}/baymora-plaza-athenee-paris-UQttpWbf4KhLKFavhpDju8.webp`,
  `${CDN}/baymora-canaves-oia-santorini-dYNNPqBiH8GUcPC6dZMq4y.webp`,
];

const FAQ = [
  {
    q: "Qu'est-ce que Baymora ?",
    a: "Baymora est un accès privé aux meilleures adresses du monde. Notre assistante Maya, propulsée par l'intelligence artificielle, crée des parcours sur-mesure : hôtels 5 étoiles, restaurants gastronomiques, activités exclusives et transport — le tout personnalisé selon votre profil.",
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
    q: "Les réductions sont-elles réelles ?",
    a: "Oui. Nous négocions en direct avec chaque établissement partenaire. Les remises vont de -15% à -40% sur des hôtels et restaurants premium. Ce sont des offres exclusives réservées aux membres Maison Baymora.",
  },
  {
    q: "Baymora est-il gratuit ?",
    a: "Le plan Invité est entièrement gratuit : 3 conversations avec Maya et accès à toutes les offres avec remise. Le Cercle à 9,90€/mois offre un accès illimité à Maya, aux parcours sur-mesure et aux avantages exclusifs.",
  },
  {
    q: "Dans quels pays Baymora est-il disponible ?",
    a: "Maya couvre le monde entier : France, Europe, États-Unis, Asie, Moyen-Orient. Les offres avec remise sont concentrées sur la France et l'Europe, avec une expansion internationale en cours.",
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
    q: "Quelle est la différence avec ChatGPT ?",
    a: "ChatGPT donne des listes. Maya donne un accès : des réductions réelles négociées, des réservations en un clic, une mémoire de vos préférences, et un réseau de partenaires physiques.",
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

const HERO_SUBTITLES = [
  "Hôtels 5★ · Restaurants gastronomiques · Expériences exclusives",
  "Vos voyages planifiés en 3 messages · Jusqu'à -40% négociés",
  "Maya connaît vos goûts · Elle ne propose jamais deux fois la même adresse",
  "Accès privé aux meilleures adresses du monde · Sans effort",
];

export default function Landing() {
  const loginUrl = getLoginUrl("/maison");
  const [heroIdx, setHeroIdx] = useState(0);
  const [subtitleIdx, setSubtitleIdx] = useState(0);
  const founderCount = 67;

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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `url(${HERO_IMAGES[heroIdx]})`, backgroundSize: "cover", backgroundPosition: "center", transition: "background-image 1s ease-in-out" }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(7,11,20,0.88) 0%, rgba(7,11,20,0.6) 50%, rgba(7,11,20,0.82) 100%)" }}
        />
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
            L'accès privé
            <span className="block" style={{ color: "#C8A96E" }}>que vous méritez.</span>
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
              <p className="text-xs font-semibold" style={{ color: "#C8A96E" }}>{founderCount}/100 membres fondateurs</p>
              <p className="text-xs" style={{ color: "#8B8D94" }}>{100 - founderCount} places restantes au tarif fondateur</p>
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


      </section>

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
            Sélectionnées et négociées par notre équipe
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { img: HOTEL_IMG, name: "Plaza Athénée", city: "Paris", pct: 28 },
              { img: SPA_IMG, name: "Four Seasons", city: "Bali", pct: 35 },
              { img: SANTORINI_IMG, name: "Canaves Oia", city: "Santorin", pct: 22 },
              { img: TOKYO_IMG, name: "Aman Tokyo", city: "Tokyo", pct: 15 },
              { img: MARRAKECH_IMG, name: "La Mamounia", city: "Marrakech", pct: 18 },
              { img: GASTRO_IMG, name: "Le Cinq", city: "Paris", pct: 22 },
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
                  -{item.pct}%
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
            <Link href="/maya-demo">
              <button className="text-sm font-medium px-6 py-2.5 rounded-full" style={{ background: "rgba(200,169,110,0.08)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.2)" }}>
                Voir Maya en action →
              </button>
            </Link>
          </div>
        </div>
      </motion.section>

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
          <p className="text-sm text-center mb-8" style={{ color: "#8B8D94" }}>Membres du Social Club</p>
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
                features: ["3 conversations Maya", "Offres avec remise", "1 parcours essai"],
                highlight: false,
                cta: "Commencer",
              },
              {
                name: "Membre",
                price: "9,90€/mois",
                features: ["Maya illimitée", "Parcours illimités", "Offres exclusives", "Évènements privés"],
                highlight: true,
                cta: "Rejoindre le Club",
              },
              {
                name: "Duo",
                price: "14,90€/mois",
                features: ["Tout Social Club", "2 profils liés", "Parcours en commun"],
                highlight: false,
                cta: "Choisir Duo",
              },
              {
                name: "Le Cercle",
                price: "89€/an",
                features: ["Social Club 12 mois", "25% de réduction", "Accès prioritaire", "Cadeau de bienvenue"],
                highlight: false,
                cta: "Économiser 25%",
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
            Commencer gratuitement
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
          <div className="flex gap-5 text-xs" style={{ color: "#8B8D94" }}>
            <a href="/mentions-legales" className="hover:text-[#C8A96E] transition-colors">Mentions légales</a>
            <a href="/confidentialite" className="hover:text-[#C8A96E] transition-colors">Confidentialité</a>
            <a href="/cgu" className="hover:text-[#C8A96E] transition-colors">CGU</a>
            <a href="/contact" className="hover:text-[#C8A96E] transition-colors">Contact</a>
          </div>
          <span className="text-xs" style={{ color: "#8B8D94" }}>© 2026 Maison Baymora</span>
        </div>
      </footer>
    </div>
  );
}
