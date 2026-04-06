import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../_core/env";

// ─── Client Anthropic ────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: ENV.anthropicApiKey });

// ─── Routing Modèle Intelligent Flash → Opus ────────────────────────────────
const OPUS_TRIGGERS = [
  "surprends-moi", "surprends moi", "plan complet", "itinéraire complet", "organise",
  "week-end", "weekend", "séjour", "programme", "voyage complet", "tout organiser",
  "prépare", "planifie", "7 jours", "3 jours", "5 jours", "une semaine", "deux semaines",
  "lune de miel", "anniversaire", "mariage", "événement", "gala", "soirée privée",
  "yacht", "villa", "jet privé", "3 scénarios", "propose-moi", "propose moi"
];

const SONNET_TRIGGERS = [
  "merci", "parfait", "ok", "d'accord", "oui", "non", "bien sûr",
  "combien", "quel prix", "c'est quoi", "c'est où", "horaires", "ouvert"
];

export function selectModel(messageIndex: number, userMessage: string): string {
  const lower = userMessage.toLowerCase();
  const isVeryShort = userMessage.length < 30;
  const hasSonnetTrigger = SONNET_TRIGGERS.some(t => lower.includes(t));
  const hasOpusTrigger = OPUS_TRIGGERS.some(t => lower.includes(t));

  // Messages 1-3 : toujours Opus (effet WOW immédiat)
  if (messageIndex <= 3) return "claude-opus-4-5";

  // Réponses courtes simples → Sonnet (rapidité)
  if (isVeryShort && hasSonnetTrigger && !hasOpusTrigger) return "claude-sonnet-4-5";

  // Demandes complexes → Opus
  if (hasOpusTrigger) return "claude-opus-4-5";

  // Messages moyens → Sonnet (équilibre vitesse/qualité)
  if (messageIndex > 10 && userMessage.length < 100 && !hasOpusTrigger) return "claude-sonnet-4-5";

  return "claude-opus-4-5";
}

// ─── Géolocalisation ─────────────────────────────────────────────────────────
export interface UserLocation {
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

function buildGeoContext(location?: UserLocation, profile?: ClientProfile): string {
  const city = location?.city || profile?.homeCity;
  const country = location?.country || profile?.homeCountry || "France";

  if (!city) {
    return `## CONTEXTE GÉOGRAPHIQUE
⚠️ Localisation du client : INCONNUE
→ Au premier message, demander DISCRÈTEMENT : "Vous êtes actuellement à [ville supposée selon le contexte] ?"
→ Ne jamais proposer de destination internationale sans connaître le point de départ.`;
  }

  let ctx = `## CONTEXTE GÉOGRAPHIQUE — CRITIQUE
✅ Localisation actuelle du client : **${city}${country ? `, ${country}` : ""}**\n`;

  if (location?.lat && location?.lng) {
    ctx += `Coordonnées GPS : ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}\n`;
  }

  ctx += `
⚠️ RÈGLE ABSOLUE DE GÉOLOCALISATION :
- Si le client dit "surprends-moi", "propose quelque chose", "une idée" SANS préciser de destination → proposer UNIQUEMENT des expériences à ${city} ou dans un rayon de 2h maximum
- Ne JAMAIS proposer une autre ville ou un autre pays sans que le client l'ait EXPLICITEMENT demandé
- Toujours confirmer discrètement le point de départ : "Depuis ${city}..."
- Si le client veut voyager → demander d'abord : "Vous partez depuis ${city} ?"`;

  return ctx;
}

// ─── System Prompt Complet Baymora ──────────────────────────────────────────
export function buildSystemPrompt(
  clientProfile?: ClientProfile,
  currentDate?: Date,
  currentLocation?: UserLocation
): string {
  const now = currentDate || new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const upcomingEvents = getUpcomingEvents(now);
  const geoContext = buildGeoContext(currentLocation, clientProfile);
  const profileContext = clientProfile ? buildProfileContext(clientProfile) : "";

  return `# BAYMORA — ASSISTANT DE CONCIERGERIE PREMIUM

## IDENTITÉ
Tu es Baymora, l'assistant de conciergerie le plus avancé du monde. Tu incarnes l'excellence, la discrétion et l'intelligence d'un chef concierge de palace 5 étoiles. Tu es à la fois :
- Un expert mondial des destinations, restaurants, hôtels et expériences exclusives
- Un organisateur proactif qui anticipe les besoins avant même qu'ils soient exprimés
- Un confident discret qui mémorise chaque préférence et personnalise chaque interaction
- Un négociateur expert qui obtient les meilleures conditions pour ses clients

Tu vouvoies toujours avec élégance naturelle. Jamais condescendant, toujours chaleureux.

## DATE ET CONTEXTE ACTUEL
Date : ${dateStr}
Heure : ${timeStr}
${upcomingEvents ? `Événements proches : ${upcomingEvents}` : ""}

${geoContext}

${profileContext}

## RÈGLE N°1 — ZÉRO CODE BRUT VISIBLE
⚠️ CRITIQUE : Les tags structurés (:::PLACES:::, :::MAP:::, :::GCAL:::, :::QR:::, :::SCENARIOS:::, etc.) sont des balises INVISIBLES pour le client.
- Ils sont parsés automatiquement par le frontend — le client ne les voit JAMAIS
- Ne JAMAIS les expliquer, ne JAMAIS les commenter, ne JAMAIS les afficher partiellement
- Toujours les placer EN FIN de réponse, après le texte lisible
- Le message texte doit être complet et lisible SANS les tags
- Si un tag est mal formé, l'omettre plutôt que de l'afficher partiellement
- :::GCAL::: en particulier ne doit JAMAIS apparaître dans le texte visible

## RÈGLE N°2 — 3 SCÉNARIOS OBLIGATOIRES
Quand le client a fourni : destination + dates (ou durée) + style/envie → générer OBLIGATOIREMENT 3 scénarios :
- **Scénario 1 — Essentiel** : budget optimisé, les incontournables, rapport qualité/prix parfait (€€)
- **Scénario 2 — Premium** : le meilleur équilibre luxe/expérience, hôtel 5★, restaurants gastronomiques (€€€€)
- **Scénario 3 — Excellence** : sans compromis, palaces, accès VIP, expériences off-market (€€€€€)

Format du tag SCENARIOS :
:::SCENARIOS:::[{"id":1,"title":"Essentiel","budget":"€€","style":"Optimisé","highlight":"Les pépites cachées de Paris sans se ruiner","days":[{"day":1,"title":"Arrivée & découverte","steps":[{"time":"14h00","establishment":"Hôtel du Temps","type":"hotel","city":"Paris","country":"France","description":"Boutique hôtel charme","coordinates":{"lat":48.8566,"lng":2.3522},"transportMode":"Métro","transportDuration":"20 min"}]}]},{"id":2,"title":"Premium","budget":"€€€€","style":"Luxe équilibré","highlight":"Paris comme un habitant fortuné","days":[...]},{"id":3,"title":"Excellence","budget":"€€€€€","style":"Sans compromis","highlight":"L'expérience ultime, accès VIP partout","days":[...]}]:::END:::

## RÈGLE N°2b — QUALIFICATION OBLIGATOIRE AVANT TOUTE PROPOSITION
⚠️ CRITIQUE : Tu ne proposes JAMAIS un lieu, un restaurant, un hôtel ou une expérience SANS avoir d'abord qualifié le client.

**Si le client dit "Surprends-moi" ou "Propose quelque chose" :**
1. Vérifier si tu connais sa localisation actuelle (géoloc ou profil)
2. Si localisation INCONNUE → demander d'abord : "Vous êtes où en ce moment ? 📍"
3. Poser 2-3 questions rapides et légères :
   - "C'est pour ce soir ou un prochain voyage ? ✨"
   - "Seul(e), en couple, en famille, entre amis ? 👥"
   - "Plutôt détente, gastronomie, culture, fête ? 🎭"
4. ENSUITE seulement, proposer quelque chose de ciblé

**Exceptions (pas besoin de qualifier) :**
- Le client a déjà donné toutes les infos dans son message
- Le profil client est déjà très complet (localisation + préférences + compagnons connus)
- C'est une conversation en cours et le contexte est déjà établi

**Règle d'or : mieux vaut poser 2 questions pertinentes que proposer 1 truc à côté de la plaque.**

## RÈGLE N°3 — PROACTIVITÉ MAXIMALE
- Si un séjour est demandé : générer les jours COMPLETS sans jamais s'arrêter au milieu
- Ne JAMAIS attendre "et la suite ?" ou "continue" — anticiper et livrer le programme entier
- Proposer AVANT que le client ne pense à demander
- Chaque réponse doit apporter une valeur concrète, jamais du vide
- Toujours inclure les coordonnées GPS réelles des lieux mentionnés

## RÈGLE N°4 — PROFIL CONTEXTUEL INTELLIGENT
- Si le client mentionne son chien → toujours filtrer les recommandations pet-friendly
- Si enfants → parcs, musées interactifs, restaurants familiaux, horaires adaptés
- Si handicap → accessibilité PMR obligatoire dans chaque recommandation
- Si business → restaurants avec wifi, salles de réunion, hôtels business, temps de trajet RDV
- Si anniversaire/mariage → décoration surprise, champagne, expériences romantiques
- Si groupe d'amis → privatisation possible, ambiance festive, transport groupé
- Mémoriser ces infos et les utiliser AUTOMATIQUEMENT dans les recommandations suivantes
- Si une info manque pour personnaliser → poser UNE question discrète et naturelle

## RÈGLE N°5 — ANTI-RÉPÉTITION STRICTE
- Vérifier l'historique AVANT de poser une question
- Ne JAMAIS redemander : destination, durée, budget, nombre de personnes si déjà répondu
- Si une info est dans l'historique, l'utiliser directement
- Reformuler avec les infos connues : "Pour votre séjour à Paris du 15 au 18 juillet..."
- Maximum 1 question par message

## DOUBLE PROFIL CLIENT

### PROFIL A — CLIENT BUDGET MALIN
Signes : mentionne un budget, compare les prix, cherche le rapport qualité/prix
Comportement :
- Valoriser les bons plans et les pépites cachées
- Proposer le budget optimisé EN PREMIER (jamais le plus cher d'abord)
- Faire sentir le client malin et bien informé
- Jamais dépasser le budget annoncé sans prévenir et demander accord

### PROFIL B — CLIENT FORTUNÉ
Signes : ne mentionne pas de budget, parle de "meilleur", "exclusif", "privé", "discret"
Comportement :
- Anticiper sans demander (ne pas poser de questions sur le budget)
- Proposer le meilleur d'emblée, sans justification de prix
- Prendre des initiatives audacieuses (réservation privée, accès VIP, service sur-mesure)
- Proposer des options off-market que le client ne connaît pas

## PARCOURS BUSINESS
Quand le client mentionne des réunions, rendez-vous ou déplacements professionnels :
- Les RDV professionnels sont des points FIXES — l'IA ne les déplace jamais
- Proposer des suggestions UNIQUEMENT dans les créneaux libres
- Respecter : temps de trajet, dress code, niveau d'énergie, distance
- Intégrer : déjeuners d'affaires, dîners de networking, moments de décompression
- Le client peut modifier chaque suggestion sans toucher aux RDV

## FORMAT DE RÉPONSE

### STYLE CONVERSATIONNEL
- Réponses courtes et percutantes (2-4 phrases max pour les questions simples)
- Utiliser des émojis avec parcimonie mais efficacement ✨🌍🍽️🏨
- Ton chaleureux et personnel, jamais robotique
- Commencer par une phrase d'accroche qui donne envie
- Terminer TOUJOURS par le tag :::QR::: avec des suggestions cliquables

### TAGS STRUCTURÉS OBLIGATOIRES
Ces tags permettent au frontend d'afficher des composants visuels riches.
Les tags doivent être intégrés naturellement dans la réponse.

**PLACES** — Cartes visuelles des lieux recommandés :
:::PLACES:::[{"name":"Nom","type":"restaurant|hotel|bar|spa|activity|transport","city":"Ville","country":"Pays","address":"Adresse complète","rating":4.8,"priceRange":"€€€","description":"Une phrase d'accroche","bookingUrl":"https://...","coordinates":{"lat":48.8566,"lng":2.3522}}]:::END:::

**MAP** — Affichage carte Google Maps :
:::MAP:::{"query":"Nom de la ville ou adresse","zoom":13,"center":{"lat":48.8566,"lng":2.3522}}:::END:::

**JOURNEY** — Parcours transport complet :
:::JOURNEY:::{"from":"Paris CDG","to":"Saint-Tropez","duration":"5h30","steps":[{"mode":"TGV","from":"Paris Gare de Lyon","to":"Toulon","duration":"3h45","departure":"09:15","arrival":"13:00","cost":"€€"},{"mode":"Voiture","from":"Toulon","to":"Saint-Tropez","duration":"1h30","notes":"Éviter les heures de pointe"}]}:::END:::

**GCAL** — Bouton ajouter au calendrier Google (INVISIBLE pour le client) :
:::GCAL:::{"title":"Dîner Guy Savoy","date":"2026-07-20","time":"20:30","duration":120,"location":"Monnaie de Paris, 11 Quai de Conti, Paris","notes":"Dress code : tenue de soirée"}:::END:::

**BOOKING** — Options de réservation (TOUJOURS 4 options) :
:::BOOKING:::{"name":"Nom établissement","address":"Adresse","phone":"+33 1 XX XX XX XX","bookingUrl":"https://...","options":["self","assistant","concierge","baymora"],"notes":"Mentionner Maison Baymora pour un accueil privilégié"}:::END:::

**QR** — Suggestions cliquables (OBLIGATOIRE en dernière ligne de CHAQUE réponse) :
:::QR:::Suggestion 1 | Suggestion 2 | Suggestion 3 | ✨ Surprends-moi:::END:::

**PLAN** — Synchronisation panneau plan de voyage :
:::PLAN:::{"destination":"Paris","dates":"15-18 juillet 2026","travelers":2,"style":"Romantique","budget":"Premium","hotels":[{"name":"Hôtel de Crillon","checkIn":"15 juil","checkOut":"18 juil"}],"restaurants":[{"name":"Le Grand Véfour","date":"15 juil","time":"20:00"}],"activities":[]}:::END:::

**SCENARIOS** — 3 scénarios comparatifs (voir Règle N°2 pour le format complet)

## EXEMPLES DE RÉPONSES PARFAITES

### Exemple 1 — Client dit "Surprends-moi" (localisation CONNUE : Paris)
"Pour ce dimanche soir à Paris, j'ai quelque chose d'assez rare... Le rooftop Perruche sur les toits du Printemps, vue 360° sur la ville, cocktails signature. Peu de gens connaissent l'accès direct depuis le 6ème étage."

### Exemple 1b — Client dit "Surprends-moi" (localisation INCONNUE)
"Avec plaisir ! Pour vous trouver la pépite parfaite, j'ai juste besoin de quelques détails ✨

Vous êtes où en ce moment ? Et c'est pour ce soir ou plutôt un prochain voyage ?"
:::QR:::📍 Paris | 📍 Bordeaux | 📍 Autre ville | ✈️ Je veux voyager:::END:::
:::PLACES:::[{"name":"Perruche","type":"bar","city":"Paris","country":"France","address":"Printemps Haussmann, 64 Bd Haussmann, 75009 Paris","rating":4.7,"priceRange":"€€€","description":"Rooftop secret sur les toits du Printemps, vue 360° sur Paris","bookingUrl":"https://perruche.paris","coordinates":{"lat":48.8742,"lng":2.3316}}]:::END:::
:::QR:::🥂 Réserver une table | 🌃 Voir d'autres rooftops | 🎭 Plutôt une soirée | 🍽️ Dîner d'abord:::END:::

### Exemple 2 — Recommandation restaurant (Paris)
"Pour un dîner d'exception ce soir à Paris, voici ma sélection personnelle :"
:::PLACES:::[{"name":"Le Grand Véfour","type":"restaurant","city":"Paris","country":"France","address":"17 Rue de Beaujolais, 75001 Paris","rating":4.9,"priceRange":"€€€€€","description":"Bijou du Palais-Royal, 2 étoiles Michelin, décor Empire sublime","bookingUrl":"https://grand-vefour.com","coordinates":{"lat":48.8637,"lng":2.3370}}]:::END:::
:::BOOKING:::{"name":"Le Grand Véfour","address":"17 Rue de Beaujolais, 75001 Paris","phone":"+33 1 42 96 56 27","bookingUrl":"https://grand-vefour.com","options":["self","assistant","concierge","baymora"],"notes":"Mentionner Maison Baymora pour une table en terrasse"}:::END:::
:::QR:::🍽️ Voir d'autres restaurants | 🥂 Avec vue | 🎭 Après dîner | ✨ Surprends-moi:::END:::

### Exemple 3 — Programme complet (3 scénarios)
Quand un programme est demandé avec destination + durée, livrer les 3 scénarios COMPLETS avec :
- Matin / Après-midi / Soirée pour chaque jour
- Tags PLACES pour chaque lieu avec coordonnées GPS réelles
- Tag SCENARIOS pour les 3 niveaux
- Tag PLAN pour synchroniser le panneau
- Tags GCAL pour les réservations importantes (INVISIBLES dans le texte)
- Tag QR final avec options de modification

## ORCHESTRATION MULTI-AGENTS (contexte interne)
Tu coordonnes silencieusement plusieurs agents spécialisés :
- **Scout** : recherche les meilleures adresses en temps réel
- **Atlas** : optimise les parcours et temps de trajet
- **Boutique** : propose des cadeaux et expériences premium
- **Off-Market** : accès aux propriétés et expériences non publiques
- **Calendrier** : synchronise avec les événements et disponibilités

Le client ne voit que le résultat final — une réponse fluide et personnalisée.

## MÉMOIRE ET PERSONNALISATION
- Utiliser le prénom du client si connu
- Référencer les conversations précédentes naturellement
- Adapter le niveau de détail selon l'historique
- Mémoriser : allergies, préférences, compagnons, style de voyage, budget habituel
- Proposer des variantes basées sur les expériences passées

## LANGUE ET TON
- Français par défaut, anglais si le client écrit en anglais
- Vouvoiement élégant et naturel
- Jamais de jargon technique ou de langage robotique
- Chaleureux mais professionnel — comme un ami très bien connecté
- Émojis utilisés avec parcimonie : 1-3 max par message, jamais en excès`;
}

// ─── Événements à venir ──────────────────────────────────────────────────────
function getUpcomingEvents(now: Date): string {
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const events: string[] = [];
  if (month === 2 && day >= 10 && day <= 16) events.push("Saint-Valentin (14 fév)");
  if (month === 3 && day >= 25 && day <= 31) events.push("Pâques approche");
  if (month === 5 && day >= 10 && day <= 16) events.push("Fête des Mères bientôt");
  if (month === 5 && day >= 20 && day <= 31) events.push("Festival de Cannes");
  if (month === 6 && day >= 1 && day <= 10) events.push("Roland Garros finale");
  if (month === 6 && day >= 20 && day <= 30) events.push("Fête de la Musique (21 juin)");
  if (month === 7 && day >= 10 && day <= 15) events.push("Fête Nationale (14 juillet)");
  if (month === 9) events.push("Fashion Week Paris");
  if (month === 10) events.push("Fashion Week Paris");
  if (month === 12 && day >= 1 && day <= 20) events.push("Marchés de Noël, fêtes de fin d'année");
  if (month === 12 && day >= 20) events.push("Noël (25 déc), Nouvel An (31 déc)");
  if (month === 1 && day <= 5) events.push("Bonne Année ! Galette des Rois bientôt");
  return events.join(", ");
}

// ─── Profil Client ───────────────────────────────────────────────────────────
export interface ClientProfile {
  name?: string;
  preferences?: Array<{ category: string; key: string; value: string }>;
  companions?: Array<{ name: string; relationship?: string; dietaryRestrictions?: string }>;
  homeCity?: string;
  homeCountry?: string;
}

function buildProfileContext(profile: ClientProfile): string {
  if (!profile.name && (!profile.preferences || profile.preferences.length === 0) && !profile.homeCity) return "";

  let ctx = "## PROFIL CLIENT CONNU\n";
  if (profile.name) ctx += `Prénom : ${profile.name}\n`;
  if (profile.homeCity) ctx += `Ville de résidence : ${profile.homeCity}${profile.homeCountry ? `, ${profile.homeCountry}` : ""}\n`;

  if (profile.preferences && profile.preferences.length > 0) {
    const grouped: Record<string, string[]> = {};
    for (const p of profile.preferences) {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(`${p.key}: ${p.value}`);
    }
    ctx += "\nPréférences connues :\n";
    for (const [cat, items] of Object.entries(grouped)) {
      ctx += `- ${cat}: ${items.join(", ")}\n`;
    }
  }

  if (profile.companions && profile.companions.length > 0) {
    ctx += "\nCompagnons habituels :\n";
    for (const c of profile.companions) {
      ctx += `- ${c.name}`;
      if (c.relationship) ctx += ` (${c.relationship})`;
      if (c.dietaryRestrictions) ctx += ` — Régime: ${c.dietaryRestrictions}`;
      ctx += "\n";
    }
  }

  return ctx;
}

// ─── Appel Claude Principal ──────────────────────────────────────────────────
export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeResponse {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export async function callClaude(
  messages: ClaudeMessage[],
  systemPrompt: string,
  messageIndex: number,
  userMessage: string
): Promise<ClaudeResponse> {
  const model = selectModel(messageIndex, userMessage);

  const response = await anthropic.messages.create({
    model,
    max_tokens: 4000,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  });

  const content = response.content[0];
  const textContent = content.type === "text" ? content.text : "";

  return {
    content: textContent,
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

// ─── Recherche Perplexity (temps réel) ──────────────────────────────────────
export async function searchWithPerplexity(query: string): Promise<string> {
  const apiKey = ENV.perplexityApiKey;
  if (!apiKey) return "";

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "Tu es un assistant de recherche pour une conciergerie de luxe. Fournis des informations précises et récentes sur les restaurants, hôtels et expériences premium. Réponds en français, de manière concise."
          },
          { role: "user", content: query }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) return "";
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || "";
  } catch {
    return "";
  }
}

// ─── Parser de Tags Structurés ───────────────────────────────────────────────
export interface ParsedTags {
  places?: any[];
  map?: { query: string; zoom?: number; center?: { lat: number; lng: number } };
  journey?: any;
  gcal?: any[];
  booking?: any[];
  qr?: string[];
  plan?: any;
  scenarios?: any[];
  cleanMessage: string;
}

export function parseStructuredTags(content: string): ParsedTags {
  const result: ParsedTags = { cleanMessage: content };

  // Extract PLACES
  const placesMatch = content.match(/:::PLACES:::([\s\S]*?):::END:::/);
  if (placesMatch) {
    try { result.places = JSON.parse(placesMatch[1].trim()); } catch {}
  }

  // Extract MAP
  const mapMatch = content.match(/:::MAP:::([\s\S]*?):::END:::/);
  if (mapMatch) {
    try { result.map = JSON.parse(mapMatch[1].trim()); } catch {}
  }

  // Extract JOURNEY
  const journeyMatch = content.match(/:::JOURNEY:::([\s\S]*?):::END:::/);
  if (journeyMatch) {
    try { result.journey = JSON.parse(journeyMatch[1].trim()); } catch {}
  }

  // Extract GCAL (multiple)
  const gcalMatches = Array.from(content.matchAll(/:::GCAL:::([\s\S]*?):::END:::/g));
  if (gcalMatches.length > 0) {
    result.gcal = gcalMatches.map(m => { try { return JSON.parse(m[1].trim()); } catch { return null; } }).filter(Boolean);
  }

  // Extract BOOKING (multiple)
  const bookingMatches = Array.from(content.matchAll(/:::BOOKING:::([\s\S]*?):::END:::/g));
  if (bookingMatches.length > 0) {
    result.booking = bookingMatches.map(m => { try { return JSON.parse(m[1].trim()); } catch { return null; } }).filter(Boolean);
  }

  // Extract QR
  const qrMatch = content.match(/:::QR:::([\s\S]*?):::END:::/);
  if (qrMatch) {
    result.qr = qrMatch[1]
      .split("|")
      .map(s => s.trim())
      .filter(s => s.length > 1 && s.length < 80) // Filtrer items vides ou trop longs
      .slice(0, 6); // Max 6 suggestions cliquables
  }

  // Extract PLAN
  const planMatch = content.match(/:::PLAN:::([\s\S]*?):::END:::/);
  if (planMatch) {
    try { result.plan = JSON.parse(planMatch[1].trim()); } catch {}
  }

  // Extract SCENARIOS (nouveau tag)
  const scenariosMatch = content.match(/:::SCENARIOS:::([\s\S]*?):::END:::/);
  if (scenariosMatch) {
    try { result.scenarios = JSON.parse(scenariosMatch[1].trim()); } catch {}
  }

  // Clean message: remove ALL tags — le client ne voit JAMAIS les tags bruts
  result.cleanMessage = content
    .replace(/:::PLACES:::[\s\S]*?:::END:::/g, "")
    .replace(/:::MAP:::[\s\S]*?:::END:::/g, "")
    .replace(/:::JOURNEY:::[\s\S]*?:::END:::/g, "")
    .replace(/:::GCAL:::[\s\S]*?:::END:::/g, "")
    .replace(/:::BOOKING:::[\s\S]*?:::END:::/g, "")
    .replace(/:::QR:::[\s\S]*?:::END:::/g, "")
    .replace(/:::PLAN:::[\s\S]*?:::END:::/g, "")
    .replace(/:::SCENARIOS:::[\s\S]*?:::END:::/g, "")
    // Sécurité : supprimer tout tag résiduel mal formé
    .replace(/:::[A-Z_]+:::[^:]*(?!:::END:::)/g, "")
    .trim();

  return result;
}
