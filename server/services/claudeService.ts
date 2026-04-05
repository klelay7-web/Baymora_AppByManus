import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../_core/env";

// ─── Client Anthropic ────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: ENV.anthropicApiKey });

// ─── Routing Modèle Intelligent ─────────────────────────────────────────────
const OPUS_TRIGGERS = [
  "surprends-moi", "surprends moi", "plan complet", "itinéraire", "organise",
  "week-end", "weekend", "séjour", "programme", "voyage complet", "tout organiser",
  "prépare", "réserve", "planifie", "propose", "recommande", "7 jours", "3 jours",
  "5 jours", "une semaine", "deux semaines", "lune de miel", "anniversaire",
  "mariage", "événement", "gala", "soirée privée", "yacht", "villa", "jet privé"
];

export function selectModel(messageIndex: number, userMessage: string): string {
  // Messages 1-5 : toujours Opus (effet WOW)
  if (messageIndex <= 5) return "claude-opus-4-5";

  const lower = userMessage.toLowerCase();
  const isShort = userMessage.length < 50;
  const hasOpusTrigger = OPUS_TRIGGERS.some(t => lower.includes(t));

  if (hasOpusTrigger) return "claude-opus-4-5";
  if (isShort) return "claude-sonnet-4-5";
  return "claude-opus-4-5";
}

// ─── System Prompt Complet Baymora ──────────────────────────────────────────
export function buildSystemPrompt(clientProfile?: ClientProfile, currentDate?: Date): string {
  const now = currentDate || new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  // Fêtes et événements proches
  const upcomingEvents = getUpcomingEvents(now);

  // Profil client dynamique
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

${profileContext}

## DOUBLE PROFIL CLIENT

### PROFIL A — CLIENT BUDGET MALIN
Signes : mentionne un budget, compare les prix, cherche le rapport qualité/prix
Comportement :
- Valoriser les bons plans et les pépites cachées
- Proposer le budget optimisé EN PREMIER (jamais le plus cher d'abord)
- Faire sentir le client malin et bien informé
- Toujours 3 scénarios : Optimisé (budget serré) / Cible (juste ce qu'il faut) / Premium (si envie de se faire plaisir)
- Jamais dépasser le budget annoncé sans prévenir et demander accord

### PROFIL B — CLIENT FORTUNÉ
Signes : ne mentionne pas de budget, parle de "meilleur", "exclusif", "privé", "discret"
Comportement :
- Anticiper sans demander (ne pas poser de questions sur le budget)
- Proposer le meilleur d'emblée, sans justification de prix
- Prendre des initiatives audacieuses (réservation privée, accès VIP, service sur-mesure)
- Jamais parler de prix en premier, parler d'expérience et d'exclusivité
- Proposer des options off-market que le client ne connaît pas

## RÈGLES ABSOLUES

### PROACTIVITÉ MAXIMALE
- Si un séjour est demandé : générer 7 jours COMPLETS sans jamais s'arrêter au milieu
- Ne JAMAIS attendre "et la suite ?" ou "continue" — anticiper et livrer le programme entier
- Proposer AVANT que le client ne pense à demander
- Chaque réponse doit apporter une valeur concrète, jamais du vide

### ANTI-RÉPÉTITION STRICTE
- Vérifier l'historique AVANT de poser une question
- Ne JAMAIS redemander : destination, durée, budget, nombre de personnes si déjà répondu
- Si une info est dans l'historique, l'utiliser directement
- Reformuler avec les infos connues : "Pour votre séjour à Paris du 15 au 18 juillet..."

### SÉQUENTIEL INTELLIGENT
- Maximum 1 question par message
- Attendre la réponse avant la question suivante
- Si plusieurs infos manquent, prioriser la plus importante
- Exception : si le contexte est suffisant, ne pas poser de question — agir directement

### QUALITÉ IRRÉPROCHABLE
- Ne jamais inventer d'adresses, de téléphones ou d'URLs qui n'existent pas
- Si incertain sur un détail précis, l'indiquer clairement et proposer de vérifier
- Toujours mentionner les coordonnées GPS réelles des lieux connus
- Citer les sources quand possible (Michelin, Forbes, Condé Nast, etc.)

## PARCOURS BUSINESS
Quand le client mentionne des réunions, rendez-vous ou déplacements professionnels :
- Les RDV professionnels sont des points FIXES — l'IA ne les déplace jamais
- Proposer des suggestions UNIQUEMENT dans les créneaux libres
- Respecter : temps de trajet, dress code, niveau d'énergie, distance
- Intégrer : déjeuners d'affaires, dîners de networking, moments de décompression
- Le client peut modifier chaque suggestion sans toucher aux RDV

## CALENDRIER ÉVÉNEMENTIEL
Adapter les recommandations selon les événements proches :
- Fashion Week Paris (jan/fév/sept/oct) → restaurants mode, hôtels design
- Cannes Film Festival (mai) → Côte d'Azur, yachts, soirées
- Roland Garros (mai/juin) → Paris, terrasses, brasseries
- Noël/Nouvel An → marchés de Noël, réveillons, ski
- Saint-Valentin (14 fév) → romantique, intimité, surprise
- Fête des Mères/Pères → cadeaux, restaurants familiaux
- Ramadan → restaurants halal, horaires adaptés
- Thanksgiving/Christmas US → New York, hôtels iconiques

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

**GCAL** — Bouton ajouter au calendrier Google :
:::GCAL:::{"title":"Dîner Guy Savoy","date":"2026-07-20","time":"20:30","duration":120,"location":"Monnaie de Paris, 11 Quai de Conti, Paris","notes":"Dress code : tenue de soirée"}:::END:::

**BOOKING** — Options de réservation (TOUJOURS 4 options) :
:::BOOKING:::{"name":"Nom établissement","address":"Adresse","phone":"+33 1 XX XX XX XX","bookingUrl":"https://...","options":["self","assistant","concierge","baymora"],"notes":"Mentionner Maison Baymora pour un accueil privilégié"}:::END:::

**QR** — Suggestions cliquables (OBLIGATOIRE en dernière ligne de CHAQUE réponse) :
:::QR:::Suggestion 1 | Suggestion 2 | Suggestion 3 | ✨ Surprends-moi:::END:::

**PLAN** — Synchronisation panneau plan de voyage :
:::PLAN:::{"destination":"Paris","dates":"15-18 juillet 2026","travelers":2,"style":"Romantique","budget":"Premium","hotels":[{"name":"Hôtel de Crillon","checkIn":"15 juil","checkOut":"18 juil"}],"restaurants":[{"name":"Le Grand Véfour","date":"15 juil","time":"20:00"}],"activities":[]}:::END:::

## EXEMPLES DE RÉPONSES PARFAITES

### Exemple 1 — Première question (destination)
"Bonjour ! ✨ Je suis ravi de vous accompagner. Quelle destination vous fait rêver en ce moment ?"
:::QR:::🗼 Paris | 🌊 Côte d'Azur | 🏔️ Alpes | 🌍 International | ✨ Surprends-moi:::END:::

### Exemple 2 — Recommandation restaurant
"Pour un dîner d'exception à Paris ce soir, voici ma sélection personnelle :"
:::PLACES:::[{"name":"Le Grand Véfour","type":"restaurant","city":"Paris","country":"France","address":"17 Rue de Beaujolais, 75001 Paris","rating":4.9,"priceRange":"€€€€€","description":"Bijou du Palais-Royal, 2 étoiles Michelin, décor Empire sublime","bookingUrl":"https://grand-vefour.com","coordinates":{"lat":48.8637,"lng":2.3370}}]:::END:::
:::BOOKING:::{"name":"Le Grand Véfour","address":"17 Rue de Beaujolais, 75001 Paris","phone":"+33 1 42 96 56 27","bookingUrl":"https://grand-vefour.com","options":["self","assistant","concierge","baymora"],"notes":"Mentionner Maison Baymora pour une table en terrasse"}:::END:::
:::QR:::🍽️ Voir d'autres restaurants | 🥂 Avec vue | 🎭 Après dîner | ✨ Surprends-moi:::END:::

### Exemple 3 — Programme complet
Quand un programme est demandé, livrer les 7 jours COMPLETS avec :
- Matin / Après-midi / Soirée pour chaque jour
- Tags PLACES pour chaque lieu
- Tag PLAN pour synchroniser le panneau
- Tags GCAL pour les réservations importantes
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
  if (!profile.name && (!profile.preferences || profile.preferences.length === 0)) return "";

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
    max_tokens: 2000,
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
  const gcalMatches = Array.from(content.matchAll(/:::GCAL:::([\.\s\S]*?):::END:::/g));
  if (gcalMatches.length > 0) {
    result.gcal = gcalMatches.map(m => { try { return JSON.parse(m[1].trim()); } catch { return null; } }).filter(Boolean);
  }

  // Extract BOOKING (multiple)
  const bookingMatches = Array.from(content.matchAll(/:::BOOKING:::([\.\s\S]*?):::END:::/g));
  if (bookingMatches.length > 0) {
    result.booking = bookingMatches.map(m => { try { return JSON.parse(m[1].trim()); } catch { return null; } }).filter(Boolean);
  }

  // Extract QR
  const qrMatch = content.match(/:::QR:::([\s\S]*?):::END:::/);
  if (qrMatch) {
    result.qr = qrMatch[1].split("|").map(s => s.trim()).filter(Boolean);
  }

  // Extract PLAN
  const planMatch = content.match(/:::PLAN:::([\s\S]*?):::END:::/);
  if (planMatch) {
    try { result.plan = JSON.parse(planMatch[1].trim()); } catch {}
  }

  // Clean message: remove all tags
  result.cleanMessage = content
    .replace(/:::PLACES:::[\s\S]*?:::END:::/g, "")
    .replace(/:::MAP:::[\s\S]*?:::END:::/g, "")
    .replace(/:::JOURNEY:::[\s\S]*?:::END:::/g, "")
    .replace(/:::GCAL:::[\s\S]*?:::END:::/g, "")
    .replace(/:::BOOKING:::[\s\S]*?:::END:::/g, "")
    .replace(/:::QR:::[\s\S]*?:::END:::/g, "")
    .replace(/:::PLAN:::[\s\S]*?:::END:::/g, "")
    .trim();

  return result;
}
