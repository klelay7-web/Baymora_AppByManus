import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Sparkles, ChevronRight, X, Play, RotateCcw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DemoMessage {
  role: "user" | "maya";
  content: string;
  delay?: number; // ms avant d'afficher ce message
}

interface DemoFlow {
  id: string;
  label: string;
  emoji: string;
  description: string;
  messages: DemoMessage[];
}

// ─── 6 Flows pré-écrits ───────────────────────────────────────────────────────
const DEMO_FLOWS: DemoFlow[] = [
  {
    id: "weekend-paris",
    label: "Week-end romantique Paris",
    emoji: "🗼",
    description: "Budget 800-1500€, 2 nuits",
    messages: [
      { role: "user", content: "Je veux organiser un week-end romantique à Paris pour 2 personnes. Budget 800-1500€, 2 nuits.", delay: 0 },
      { role: "maya", content: `Quel plaisir de vous accompagner pour ce week-end romantique à Paris ✨

Voici 4 scénarios selon votre envie :

🎯 **Malin** (800€) — Hôtel boutique Marais + dîner bistronomique + balade Seine
🏨 **Essentiel** (1 100€) — Hôtel 4★ Saint-Germain + restaurant gastronomique + croisière privée
✨ **Premium** (1 350€) — Hôtel 5★ Champs-Élysées + chef étoilé + spa privatif
👑 **Excellence** (1 500€) — Suite Plaza Athénée + dîner Alain Ducasse + voiture avec chauffeur

Quel scénario vous correspond le mieux ?`, delay: 1200 },
      { role: "user", content: "✨ Premium", delay: 800 },
      { role: "maya", content: `Excellent choix ! Voici votre programme Premium pour Paris 🌟

**Vendredi soir**
🚂 Arrivée Gare du Nord → Taxi vers l'hôtel (20 min)
🏨 Check-in **Le Royal Monceau** — Suite Deluxe, vue Champs-Élysées
🍽️ Dîner au **Taillevent** (2 étoiles Michelin) — Menu dégustation 7 plats

**Samedi**
☕ Petit-déjeuner en chambre inclus
🛍️ Shopping privé Galeries Lafayette (accès VIP 9h)
🍾 Déjeuner **Café de Flore** — terrasse réservée
🌅 Balade Trocadéro → Tour Eiffel au coucher du soleil
🍽️ Dîner **Le Grand Véfour** — table romantique au Palais-Royal

**Dimanche**
💆 Spa du Royal Monceau (2h en duo)
🥐 Brunch **Ladurée** Champs-Élysées
🚂 Retour tranquille

**Budget estimé : 1 350€** pour 2 personnes tout compris.

Souhaitez-vous que je réserve l'hôtel et les restaurants ?`, delay: 1500 },
    ],
  },
  {
    id: "bali-famille",
    label: "Bali en famille",
    emoji: "🌴",
    description: "7 nuits, 2 adultes 2 enfants",
    messages: [
      { role: "user", content: "On part à Bali en famille — 2 adultes, 2 enfants (8 et 12 ans). 7 nuits, budget 4000-6000€.", delay: 0 },
      { role: "maya", content: `Bali en famille, quelle belle aventure ! 🌴

Avant de vous proposer les scénarios, quelques précisions rapides :
- Les enfants ont des allergies alimentaires ?
- Préférence : resort avec piscine ou villa privée ?
- Activités : surf, temples, rizières, ou tout ?`, delay: 1000 },
      { role: "user", content: "Villa privée avec piscine, pas d'allergies. On veut tout voir !", delay: 600 },
      { role: "maya", content: `Parfait ! Voici votre programme Bali Famille ✨

**Villa recommandée** : Alaya Resort Ubud — Villa 2 chambres, piscine privée, vue rizières
Prix : 280€/nuit × 7 = 1 960€

**Programme 7 jours :**

🌅 J1 — Arrivée Denpasar, transfert Ubud (2h), installation
🛕 J2 — Temples Tanah Lot + Uluwatu au coucher du soleil
🌾 J3 — Balade rizières Tegalalang + cours de cuisine balinaise
🏄 J4 — Kuta : surf pour les enfants (cours débutants)
🐒 J5 — Forêt des singes + marché artisanal Ubud
🤿 J6 — Snorkeling Nusa Penida (demi-journée)
✈️ J7 — Retour

**Budget total estimé : 4 800€** pour 4 personnes.
Vols inclus depuis Paris CDG.

Je vous réserve tout ?`, delay: 1800 },
    ],
  },
  {
    id: "tokyo-gastro",
    label: "Tokyo gastronomique",
    emoji: "🍣",
    description: "Solo, 5 nuits, budget libre",
    messages: [
      { role: "user", content: "Tokyo pour 5 nuits, solo, passionné de gastronomie. Budget confortable.", delay: 0 },
      { role: "maya", content: `Tokyo pour un épicurien solo — c'est mon terrain de jeu préféré 🍣

Quelques questions pour affiner :
- Étoilés Michelin ou izakayas authentiques (ou les deux) ?
- Sushi au comptoir ou kaiseki traditionnel ?
- Vous souhaitez des réservations dans des restaurants difficiles d'accès ?`, delay: 1000 },
      { role: "user", content: "Les deux ! Et oui, les restaurants inaccessibles aux touristes.", delay: 700 },
      { role: "maya", content: `Voici votre programme Tokyo Gastronomique Exclusif 🌟

**Hôtel** : Aman Tokyo — Suite, vue panoramique sur le Palais Impérial
Prix : 980€/nuit × 5 = 4 900€

**Réservations exclusives obtenues :**

🍣 **Sukiyabashi Jiro** (3★ Michelin) — Sushi omakase 20 pièces, 30 000¥
🍱 **Ryugin** (3★ Michelin) — Kaiseki contemporain, menu 15 services
🍜 **Fuunji** — Ramen tsukemen, file d'attente 6h évitée (réservation privée)
🍶 **Bar à sake Sasagin** — Dégustation guidée 8 sakes premium
🥩 **Aragawa** — Wagyu Kobe A5, restaurant le plus cher du monde

**Activités entre les repas :**
Marché Tsukiji (5h), cours de couteaux japonais, visite cave à sake Fushimi

**Budget estimé : 8 500€** tout compris (vols inclus).

Je contacte les restaurants pour les réservations ?`, delay: 2000 },
    ],
  },
  {
    id: "spa-weekend",
    label: "Week-end spa & détox",
    emoji: "💆",
    description: "Solo ou duo, 2 nuits",
    messages: [
      { role: "user", content: "J'ai besoin de me ressourcer. Week-end spa et détox, 2 nuits, seule.", delay: 0 },
      { role: "maya", content: `Vous avez bien raison de prendre soin de vous ✨

Pour un vrai ressourcement, j'ai 3 destinations en tête :

🌿 **Évian-les-Bains** — Royal Évian Resort, spa thermal, vue lac Léman (2h de Paris)
🏔️ **Chamonix** — Le Hameau Albert 1er, spa alpin, air pur (4h de Paris)
🌊 **Biarritz** — Hôtel du Palais, thalasso océan, surf yoga (1h30 de Bordeaux)

Laquelle vous attire le plus ?`, delay: 1100 },
      { role: "user", content: "Évian !", delay: 500 },
      { role: "maya", content: `Évian-les-Bains — choix parfait pour une vraie déconnexion 🌿

**Hôtel** : Royal Évian Resort — Chambre Lac, vue panoramique
Prix : 380€/nuit × 2 = 760€

**Programme sur-mesure :**

🚂 **Vendredi** — TGV Paris-Évian (3h), check-in, bain thermal d'accueil
💆 **Samedi matin** — Rituel Évian Source (3h) : gommage, enveloppement, massage
🥗 **Déjeuner** — Menu détox au restaurant gastronomique (sans gluten, bio)
🚶 **Après-midi** — Balade lac Léman, méditation guidée au bord de l'eau
🛁 **Soir** — Bain aux huiles essentielles en chambre, room service léger
☀️ **Dimanche** — Yoga au lever du soleil, petit-déjeuner healthy, départ 14h

**Budget total : 1 100€** (hôtel + soins + repas + train).

Je réserve tout pour quel week-end ?`, delay: 1600 },
    ],
  },
  {
    id: "business-dubai",
    label: "Voyage business Dubai",
    emoji: "✈️",
    description: "3 nuits, classe affaires",
    messages: [
      { role: "user", content: "Dubai pour 3 nuits, voyage business. Vol classe affaires, hôtel 5 étoiles.", delay: 0 },
      { role: "maya", content: `Dubai business class — je m'en occupe 💼

Quelques précisions pour optimiser votre séjour :
- Dates de voyage ?
- Préférence de quartier : DIFC (business) ou Downtown (vue Burj Khalifa) ?
- Avez-vous des réunions à organiser (salle de réunion, transferts VIP) ?`, delay: 900 },
      { role: "user", content: "15-18 mai, DIFC de préférence. Oui, 2 réunions à organiser.", delay: 700 },
      { role: "maya", content: `Voici votre programme Dubai Business 15-18 mai ✈️

**Vol** : Air France CDG → DXB, Business Class
Départ 22h45, arrivée 8h30 — 7 500€ aller-retour

**Hôtel** : Four Seasons DIFC — Suite Exécutive
Prix : 650€/nuit × 3 = 1 950€

**Services organisés :**
🚘 Chauffeur privé aéroport → hôtel (Mercedes Classe S)
📋 Salle de réunion DIFC Gate Village réservée (J1 14h, J2 10h)
🍽️ Dîner d'affaires **Zuma** (J1) — table privée, menu omakase
🍽️ Déjeuner **Nobu** (J2) — terrasse Burj Khalifa view

**Extras inclus :**
- Accès lounge Al Mourjan (Doha transit)
- Conciergerie 24h sur 24
- Check-out tardif 18h

**Budget total : 11 200€** tout compris.

Je confirme les réservations ?`, delay: 1700 },
    ],
  },
  {
    id: "saint-tropez",
    label: "Saint-Tropez été",
    emoji: "⛵",
    description: "5 nuits, villa avec piscine",
    messages: [
      { role: "user", content: "Saint-Tropez pour 5 nuits cet été, villa avec piscine, 4 personnes. Budget 8000-12000€.", delay: 0 },
      { role: "maya", content: `Saint-Tropez en villa — le summum de l'été méditerranéen ⛵

Pour affiner ma sélection :
- Vous préférez être dans le village (à pied des restaurants) ou en hauteur (vue mer panoramique) ?
- Piscine chauffée ou naturelle ?
- Souhaitez-vous un yacht privatisé pour une journée ?`, delay: 1000 },
      { role: "user", content: "Vue mer, piscine chauffée, et oui pour le yacht !", delay: 600 },
      { role: "maya", content: `Voici votre villa Saint-Tropez sélectionnée ⛵

**Villa** : "Villa Belvédère" — Les Parcs de Saint-Tropez
4 chambres, piscine chauffée 12m, vue mer 180°, jacuzzi
Prix : 1 800€/nuit × 5 = 9 000€ (inclus ménage quotidien + chef à domicile 3 soirs)

**Programme 5 nuits :**

🚗 **J1** — Arrivée hélicoptère Nice → Saint-Tropez (20 min, 1 200€ pour 4)
🍽️ **J1 soir** — Chef privé : soirée barbecue méditerranéen à la villa
⛵ **J2** — Yacht privatisé 12h (Pampelonne, Ramatuelle, Gassin)
🛍️ **J3** — Village Saint-Tropez : marché provençal + déjeuner **Club 55**
🏖️ **J4** — Plage Tahiti + dîner **Nikki Beach** (réservation VIP)
🌅 **J5** — Matinée libre + retour hélicoptère

**Budget total : 12 000€** pour 4 personnes.
(Villa + hélico + yacht + restaurants + chef)

Je réserve ?`, delay: 2000 },
    ],
  },
];

// ─── Composant principal ───────────────────────────────────────────────────────
export default function MayaDemo() {
  const [selectedFlow, setSelectedFlow] = useState<DemoFlow | null>(null);
  const [displayedMessages, setDisplayedMessages] = useState<DemoMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayedMessages, isTyping]);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const startFlow = (flow: DemoFlow) => {
    clearTimeouts();
    setSelectedFlow(flow);
    setDisplayedMessages([]);
    setCurrentMsgIndex(0);
    setIsTyping(false);
    setIsPlaying(true);

    let cumulativeDelay = 500;

    flow.messages.forEach((msg, idx) => {
      const msgDelay = cumulativeDelay + (msg.delay || 0);

      if (msg.role === "maya") {
        // Afficher "typing" avant la réponse Maya
        const typingTimeout = setTimeout(() => {
          setIsTyping(true);
        }, msgDelay - 600);
        timeoutsRef.current.push(typingTimeout);
      }

      const showTimeout = setTimeout(() => {
        setIsTyping(false);
        setDisplayedMessages((prev) => [...prev, msg]);
        setCurrentMsgIndex(idx + 1);
        if (idx === flow.messages.length - 1) {
          setIsPlaying(false);
        }
      }, msgDelay);

      timeoutsRef.current.push(showTimeout);
      cumulativeDelay = msgDelay + 800;
    });
  };

  const resetFlow = () => {
    clearTimeouts();
    if (selectedFlow) startFlow(selectedFlow);
  };

  // Format markdown bold
  const formatContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ color: "#C8A96E" }}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div style={{ background: "#070B14", minHeight: "100vh", color: "#F0EDE6" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}>
              <Sparkles size={14} color="#070B14" />
            </div>
            <span className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#C8A96E" }}>Maya — Démo interactive</span>
          </div>
          <Link href="/auth">
            <button className="text-xs px-4 py-2 rounded-full font-semibold" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}>
              Essayer gratuitement
            </button>
          </Link>
        </div>
        <p className="text-xs" style={{ color: "#8B8D94" }}>
          Découvrez comment Maya planifie vos voyages en quelques échanges
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sidebar : sélection des flows */}
          <div className="md:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: "#8B8D94" }}>
              Choisissez un scénario
            </p>
            <div className="space-y-2">
              {DEMO_FLOWS.map((flow) => (
                <button
                  key={flow.id}
                  onClick={() => startFlow(flow)}
                  className="w-full text-left p-3 rounded-xl flex items-start gap-3"
                  style={{
                    background: selectedFlow?.id === flow.id ? "rgba(200,169,110,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${selectedFlow?.id === flow.id ? "rgba(200,169,110,0.35)" : "rgba(255,255,255,0.07)"}`,
                  }}
                >
                  <span className="text-xl flex-shrink-0">{flow.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight" style={{ color: selectedFlow?.id === flow.id ? "#C8A96E" : "#F0EDE6" }}>
                      {flow.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#8B8D94" }}>{flow.description}</p>
                  </div>
                  {selectedFlow?.id === flow.id && (
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#C8A96E" }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Zone de conversation */}
          <div className="md:col-span-2">
            <div
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: "#0D1117",
                border: "1px solid rgba(200,169,110,0.15)",
                minHeight: "480px",
                maxHeight: "600px",
              }}
            >
              {/* Header chat */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(200,169,110,0.1)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}>
                    <Sparkles size={12} color="#070B14" />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "#F0EDE6" }}>Maya</span>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
                </div>
                {selectedFlow && (
                  <button onClick={resetFlow} className="flex items-center gap-1 text-xs" style={{ color: "#8B8D94" }}>
                    <RotateCcw size={12} />
                    Rejouer
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!selectedFlow ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(200,169,110,0.1)" }}>
                      <Play size={24} color="#C8A96E" />
                    </div>
                    <p className="text-sm font-medium mb-2" style={{ color: "#F0EDE6" }}>Sélectionnez un scénario</p>
                    <p className="text-xs" style={{ color: "#8B8D94" }}>Choisissez un voyage dans la liste pour voir Maya en action</p>
                  </div>
                ) : (
                  <>
                    {displayedMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.role === "maya" && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}>
                            <Sparkles size={10} color="#070B14" />
                          </div>
                        )}
                        <div
                          className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                          style={{
                            background: msg.role === "user"
                              ? "linear-gradient(135deg, #C8A96E, #E8D5A8)"
                              : "rgba(255,255,255,0.05)",
                            color: msg.role === "user" ? "#070B14" : "#F0EDE6",
                            borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                            whiteSpace: "pre-line",
                          }}
                        >
                          {msg.role === "maya" ? formatContent(msg.content) : msg.content}
                        </div>
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)" }}>
                          <Sparkles size={10} color="#070B14" />
                        </div>
                        <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.05)", borderRadius: "4px 18px 18px 18px" }}>
                          <div className="flex gap-1 items-center h-4">
                            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#C8A96E", animationDelay: "0ms" }} />
                            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#C8A96E", animationDelay: "150ms" }} />
                            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#C8A96E", animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* CTA bas de chat */}
              {!isPlaying && selectedFlow && currentMsgIndex >= selectedFlow.messages.length && (
                <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(200,169,110,0.1)" }}>
                  <p className="text-xs text-center mb-3" style={{ color: "#8B8D94" }}>
                    Vous aussi, planifiez votre voyage avec Maya
                  </p>
                  <Link href="/auth">
                    <button
                      className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
                    >
                      <Sparkles size={16} />
                      Commencer gratuitement
                      <ChevronRight size={16} />
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section conversion bas de page */}
        <div className="mt-10 rounded-3xl p-8 text-center" style={{ background: "linear-gradient(135deg, rgba(200,169,110,0.08), rgba(200,169,110,0.03))", border: "1px solid rgba(200,169,110,0.2)" }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(200,169,110,0.12)" }}>
            <Sparkles size={24} color="#C8A96E" />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
            Prêt à voyager autrement ?
          </h2>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "#8B8D94", lineHeight: "1.7" }}>
            Maya connaît vos goûts, vos allergies, vos proches. Elle planifie, réserve et vous accompagne — comme un vrai concierge de palace.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth">
              <button className="px-8 py-3 rounded-full text-sm font-semibold" style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}>
                Essayer gratuitement — 3 échanges offerts
              </button>
            </Link>
            <Link href="/premium">
              <button className="px-8 py-3 rounded-full text-sm font-medium" style={{ background: "rgba(200,169,110,0.08)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.25)" }}>
                Voir les forfaits — dès 9,90€/mois
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
