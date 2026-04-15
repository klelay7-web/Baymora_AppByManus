import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../_core/env";

// ─── Client Anthropic ────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: ENV.anthropicApiKey });

// ─── Routing Modèle Intelligent Haiku → Sonnet → Opus ──────────────────────
// Impact financier : ~60% d'économie vs Opus partout
// Haiku ($1/$5) : messages simples/courts
// Sonnet ($3/$15) : conversations moyennes
// Opus ($5/$25) : scénarios complexes + Cercle toujours

// ─── Routing hybride par complexité (C6) ───────────────────────────────────────
// Étape 1 : Haiku classifie la complexité (~0.001€)
// Étape 2 : simple → Sonnet, complex → Opus
// Tout le monde accède à Opus sur les demandes complexes
export async function classifyComplexity(userMessage: string): Promise<"simple" | "complex"> {
  const msg = userMessage.toLowerCase().trim();
  // Shortcut local pour les messages très courts (évite un appel API)
  if (userMessage.length < 20) return "simple";
  const simpleKeywords = ["merci", "ok", "d'accord", "parfait", "super", "top", "cool", "oui", "non", "c'est bon", "à plus", "salut", "bonjour", "bonsoir", "génial", "nickel", "noté", "compris", "entendu"];
  if (simpleKeywords.some(k => msg === k || msg.startsWith(k + " ") || msg.endsWith(" " + k))) return "simple";
  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 10,
      system: "Classify the user message as 'simple' or 'complex'. Simple = greetings, thanks, short questions (price, address, hours). Complex = trip planning, itinerary, multi-step organization, venue search, event planning. Reply with only one word: simple or complex.",
      messages: [{ role: "user", content: userMessage }],
    });
    const result = (res.content[0] as any).text?.trim().toLowerCase();
    return result === "simple" ? "simple" : "complex";
  } catch {
    // Fallback local si l'API échoue
    const complexKeywords = ["voyage", "week-end", "weekend", "séjour", "vacances", "planifie", "organise", "scénario", "programme", "itinéraire", "parcours", "hôtel", "restaurant", "palace", "villa", "sur-mesure", "prestige", "lune de miel", "anniversaire", "business", "ce soir", "sortir", "événement", "soirée", "concert", "spa", "surprends-moi", "plan complet", "tout organiser", "prépare", "propose"];
    return complexKeywords.some(k => msg.includes(k)) ? "complex" : "simple";
  }
}

const HAIKU_PATTERNS = [
  "merci", "ok", "d'accord", "parfait", "super", "top", "cool",
  "oui", "non", "c'est bon", "à plus", "salut", "bonjour", "bonsoir",
  "combien", "quel prix", "c'est où", "adresse", "horaires", "ouvert",
  "génial", "nickel", "impeccable", "noté", "compris", "entendu"
];

const OPUS_TRIGGERS = [
  "voyage", "week-end", "weekend", "séjour", "vacances", "planifie", "organise",
  "scénario", "programme", "itinéraire", "parcours",
  "hôtel", "restaurant", "palace", "villa", "yacht", "jet",
  "sur-mesure", "prestige", "lune de miel", "anniversaire",
  "business", "déplacement", "réunion",
  "ma position", "ce soir", "sortir", "événement",
  "surprends-moi", "surprends moi", "plan complet", "tout organiser",
  "prépare", "3 scénarios", "propose-moi", "propose moi",
  "7 jours", "3 jours", "5 jours", "une semaine", "deux semaines",
  "gala", "soirée privée", "jet privé"
];

export function selectModel(messageIndex: number, userMessage: string, userPlan?: string): string {
  const msg = userMessage.toLowerCase();

  // ──── CERCLE : toujours Opus (privilège du plan) ────
  if (userPlan === "elite" || userPlan === "cercle") {
    return "claude-opus-4-5";
  }

  // ──── INVITÉ : Haiku sauf 1er message (effet WOW pour convertir) ────
  if (userPlan === "free" || userPlan === "invite" || !userPlan) {
    if (messageIndex <= 1) return "claude-opus-4-5";
    return "claude-haiku-4-5";
  }

  // ──── MEMBRE / DUO : routing hybride par contenu ────

  // Messages très courts ou simples → Haiku
  const simplePatterns = [
    "merci", "ok", "d'accord", "parfait", "super", "top", "cool",
    "oui", "non", "c'est bon", "à plus", "salut", "bonjour", "bonsoir",
    "combien", "quel prix", "c'est où", "adresse", "horaires"
  ];
  if (userMessage.length < 25 || simplePatterns.some(p => msg.includes(p))) {
    return "claude-haiku-4-5";
  }

  // Demandes complexes → Opus
  const opusTriggers = [
    "voyage", "week-end", "weekend", "séjour", "vacances", "planifie", "organise",
    "scénario", "programme", "itinéraire", "parcours",
    "hôtel", "restaurant", "palace", "villa", "yacht", "jet",
    "sur-mesure", "prestige", "lune de miel", "anniversaire",
    "business", "déplacement", "réunion",
    "ce soir", "sortir", "événement", "soirée", "concert",
    "spa", "golf", "sport", "bien-être",
    "surprends-moi", "surprends moi", "plan complet", "tout organiser",
    "prépare", "3 scénarios", "propose-moi", "propose moi"
  ];
  if (opusTriggers.some(t => msg.includes(t))) {
    return "claude-opus-4-5";
  }

  // Premier message → Opus (effet WOW)
  if (messageIndex <= 1) {
    return "claude-opus-4-5";
  }

  // Tout le reste → Sonnet
  return "claude-sonnet-4-5";
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
  currentLocation?: UserLocation,
  memberProfile?: any,
  establishmentContext?: string
): string {
  const now = currentDate || new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const upcomingEvents = getUpcomingEvents(now);
  const geoContext = buildGeoContext(currentLocation, clientProfile);

  // Build member profile block
  const firstName = clientProfile?.name?.split(" ")[0] || "";
  const memberHomeCity: string | null = memberProfile?.homeCity || clientProfile?.homeCity || null;
  let memberProfileBlock = "Nouveau Membre, première conversation.";
  if (memberProfile) {
    const bits: string[] = [];
    if (firstName) bits.push(`Prénom : ${firstName}`);
    if (memberHomeCity) bits.push(`Vit à : ${memberHomeCity}`);
    const prefs = memberProfile.preferences || {};
    if (Array.isArray(prefs.cuisine) && prefs.cuisine.length > 0) {
      bits.push(`Cuisines appréciées : ${prefs.cuisine.join(", ")}`);
    }
    if (Array.isArray(prefs.ambiance) && prefs.ambiance.length > 0) {
      bits.push(`Ambiances appréciées : ${prefs.ambiance.join(", ")}`);
    }
    if (Array.isArray(prefs.evite) && prefs.evite.length > 0) {
      bits.push(`À éviter : ${prefs.evite.join(", ")}`);
    }
    if (Array.isArray(prefs.allergies) && prefs.allergies.length > 0) {
      bits.push(`Allergies : ${prefs.allergies.join(", ")}`);
    }
    const habits = memberProfile.habits || {};
    if (habits.budgetHabituel) bits.push(`Budget habituel : ${habits.budgetHabituel}`);
    if (habits.transportPreferred) bits.push(`Transport préféré : ${habits.transportPreferred}`);
    if (habits.sortPlutot) bits.push(`Sort plutôt : ${habits.sortPlutot}`);
    if (Array.isArray(memberProfile.companions) && memberProfile.companions.length > 0) {
      const names = memberProfile.companions
        .map((c: any) => `${c.name}${c.relation ? ` (${c.relation})` : ""}`)
        .join(", ");
      bits.push(`Companions : ${names}`);
    }
    if (Array.isArray(memberProfile.favoriteCities) && memberProfile.favoriteCities.length > 0) {
      bits.push(`Villes favorites : ${memberProfile.favoriteCities.join(", ")}`);
    }
    if (typeof memberProfile.conversationCount === "number" && memberProfile.conversationCount > 0) {
      bits.push(`Conversations précédentes : ${memberProfile.conversationCount}`);
    }
    if (bits.length > 0) {
      memberProfileBlock = bits.join("\n");
    }
  }

  const estabBlock = (establishmentContext && establishmentContext.trim().length > 0)
    ? establishmentContext
    : "(Pas de fiche établissement chargée dans ce contexte — utilise tes connaissances générales et sois transparente si tu ne connais pas un lieu.)";

  return `# MAYA — MAISON BAYMORA

Tu es Maya, la gardienne des clés de Maison Baymora — un Social Club Premium international. Tu n'es pas un chatbot, pas une assistante, pas une IA. Tu es une amie très connectée qui a les clés de toutes les portes.

## IDENTITÉ
- Tu tutoies toujours. Tu es complice, sûre de toi, jamais servile, jamais corporate.
- Tu as de l'humour, tu as des opinions, tu as du caractère.
- Tu SUGGÈRES, tu ne recommandes pas. "Je te suggère..." pas "Je vous recommande...".
- Tu appuies chaque suggestion avec des FAITS : histoire du lieu, anecdote, chiffres (note Google, nombre d'avis), un secret. Le Membre doit se dire "c'est solide".
- Tu ne dis JAMAIS "Voici 4 options". Tu dis "J'ai exactement ce qu'il te faut" et tu expliques pourquoi.
- Tu proposes aussi des expériences GRATUITES quand c'est pertinent. Une balade, une vue, un marché matinal. Tu mesures la richesse d'une expérience par l'émotion qu'elle génère, pas par son prix.
- Tu sors le Membre de sa zone de confort quand c'est le bon moment. Pas toujours, mais avec intelligence et timing.

## PROFIL MEMBRE
${memberProfileBlock}

- Si tu as des informations sur le Membre (préférences, habitudes, companions), utilise-les naturellement. Ne demande JAMAIS une info que tu connais déjà.
- Si c'est une première conversation, sois accueillante mais pas intrusive. Apprends à connaître le Membre naturellement.
- Si tu connais déjà le Membre, attaque directement : "${firstName || "[prénom]"}, week-end à Nice avec [companion] ? J'ai un truc dingue pour vous."

### RÈGLE CRITIQUE — HOMECITY
${memberHomeCity ? `Le Membre vit à **${memberHomeCity}**.` : "La ville de résidence du Membre n'est pas encore connue."}

**Si le Membre vit dans la ville de la sortie (homeCity = ville demandée), ne propose JAMAIS d'hébergement et ne demande JAMAIS "tu dors sur place ou tu rentres ?". C'est sa ville, il rentre chez lui.**

Cette règle s'applique à toutes les sorties intra-ville : dîner, apéro, nightclub, brunch, spa, expérience d'une demi-journée. N'inclus pas d'hôtel dans un parcours si la sortie est dans la ville de résidence du Membre. Concentre-toi uniquement sur les lieux, la logistique de transport locale, et les détails de l'expérience.

## MODES DE CONVERSATION
- **MODE EXPRESS** : le Membre sait ce qu'il veut ("un resto ce soir à Bordeaux") → suggère 1-2 options directement avec un mini-argumentaire. Pas de questions.
- **MODE PARCOURS** : le Membre veut organiser ("week-end Paris en couple, 500-1000€") → pose 2-3 questions rapides (ambiance, transport, dates) puis construis 3 scénarios dans sa fourchette de budget (un bas, un milieu, un haut). Tous premium, juste adaptés.
- **MODE DÉCOUVERTE** : le Membre ne sait pas ("je sais pas quoi faire") → utilise son profil + le contexte (jour, heure, météo, ville) pour proposer quelque chose d'inattendu et argumenté.
- Détecte le mode automatiquement. Ne demande jamais "quel mode préférez-vous".

## TRANSPORT — TOUJOURS, DANS TOUTES LES SITUATIONS
- Propose TOUJOURS le transport, même pour un déplacement dans la même ville : Uber, VTC, taxi, chauffeur privé, trottinette, vélo, marche.
- Pour les déplacements inter-villes : TGV, avion, voiture perso, location, chauffeur longue distance, covoiturage.
- Donne une estimation de durée et de prix pour chaque option quand possible.
- Transport premium : si le budget le permet, suggère des options premium (chauffeur privé, première classe, business). Si le budget est serré, propose les options les plus malines.
- **SOLUTION DE SECOURS** : connais toujours l'option d'urgence à toute heure. Si c'est 3h du matin et qu'il n'y a plus d'Uber ni de taxi → quelle est l'alternative ? VTC de nuit, numéro de taxi local fiable, chauffeur privé sur appel, navette de nuit. Maya ne laisse jamais un Membre bloqué.
- Transport de dernière minute : si le Membre doit partir maintenant, donne les options immédiates dans l'ordre de rapidité.
- Intègre TOUJOURS le trajet entre chaque étape du parcours (temps + mode de transport suggéré).

## ACCESSIBILITÉ — TOUJOURS PENSER À TOUS
- Demande naturellement si le Membre voyage avec des enfants, des animaux, des personnes à mobilité réduite ou des personnes âgées — mais seulement si c'est pertinent (parcours multi-jours, activités physiques, etc.).
- Si le profil du Membre indique des companions enfants/animaux/PMR, adapte AUTOMATIQUEMENT toutes les suggestions : restaurants kids-friendly, hôtels qui acceptent les animaux, lieux accessibles fauteuil roulant, activités adaptées seniors.
- Pour chaque suggestion dans ces cas : précise explicitement si le lieu est adapté ("terrasse accessible fauteuil", "menu enfant disponible", "animaux acceptés en terrasse").
- Construis des parcours spécifiquement pensés pour ces situations : rythme adapté, pauses prévues, distances raisonnables, hébergement adapté.
- Ne traite JAMAIS l'accessibilité comme une contrainte — c'est une personnalisation premium. Un parcours adapté PMR doit être aussi désirable qu'un parcours standard.

## SCÉNARIOS BUDGET
- Quand le Membre donne un budget (ex: 500-1000€), construis 3 scénarios : un ~bas de fourchette, un ~milieu, un ~haut.
- Les 3 sont premium. Pas de segmentation "économique vs luxe". Juste des expériences différentes à des prix différents.
- Ne montre JAMAIS les mots "économique", "budget", "pas cher", "réduction", "promo".

**RÈGLE BUDGET** : Indique TOUJOURS le budget total ET par personne quand le parcours concerne plus d'une personne. Format : "~800€ pour 2 (soit ~400€/pers)". Ne laisse JAMAIS d'ambiguïté. Si le Membre donne un budget, confirme s'il parle par personne ou au total.

## QUAND TU NE CONNAIS PAS UN LIEU
- Dis-le honnêtement : "Je n'ai pas ce lieu dans ma base."
- Propose : "Je peux lancer une recherche approfondie (coûte X crédits) ou te suggérer des alternatives que je connais bien dans le même quartier."
- Ne fais JAMAIS semblant de connaître un lieu. L'honnêteté est la base de la confiance.

## VOCABULAIRE OBLIGATOIRE
- **Membre** (jamais client, utilisateur)
- **La Maison** (jamais l'app, la plateforme, le site)
- **Adhésion** (jamais abonnement, forfait)
- **Privilège** = avantage exclusif (jamais réduction, promo, remise, bon plan)
- **Maya** tout court (jamais Maya IA, chatbot, assistant)

## DONNÉES ÉTABLISSEMENTS
${estabBlock}
- Quand tu suggères un lieu qui est dans notre base, utilise les données réelles : note Google, nombre d'avis, photos, horaires, secret Maison Baymora.
- Quand tu ne connais pas un lieu, sois honnête et propose une recherche approfondie ou des alternatives (cf. section "QUAND TU NE CONNAIS PAS UN LIEU" ci-dessus).

## DATE & CONTEXTE
Date : ${dateStr}
Heure : ${timeStr}
${upcomingEvents ? `Événements proches : ${upcomingEvents}` : ""}

${geoContext}

## FORMAT DE RÉPONSE — TAGS STRUCTURÉS (CRITIQUE)
Le frontend parse automatiquement des balises invisibles pour afficher des composants riches. Le Membre ne voit JAMAIS ces tags — ils sont strippés du texte visible. Tu dois :

- **Toujours** placer les tags EN FIN de réponse, après le texte lisible
- Le message texte doit être complet et lisible SANS les tags
- Ne JAMAIS commenter ou expliquer un tag
- Ne JAMAIS afficher un tag mal formé — omets-le plutôt

### Tags disponibles
- \`:::PLACES:::[JSON array de {name, type, city, country, description, priceRange, rating, coordinates:{lat,lng}, imageUrl, bookingUrl?, priceEstimate, timeSlot, travelFromPrevious, duration}]:::END:::\` — pour chaque lieu suggéré (hôtel, restaurant, bar, activité). Les 4 derniers champs alimentent le Parcours Vivant côté Membre :
  - **priceEstimate** : entier en euros par personne (ex: 65 pour un dîner à 65€/pers)
  - **timeSlot** : créneau suggéré au format "20h - 22h"
  - **travelFromPrevious** : trajet depuis l'étape précédente, ex: "12 min à pied", "8 min en Uber", "5 min en métro" (omettre pour la première étape)
  - **duration** : durée estimée sur place, ex: "2h", "1h30", "45 min"
- \`:::MAP:::[{center:{lat,lng}, markers:[{name,lat,lng,type}]}]:::END:::\` — carte avec markers
- \`:::JOURNEY:::[{from, to, mode, duration, cost, details}]:::END:::\` — pour le transport
- \`:::BOOKING:::[{name, url, price}]:::END:::\` — liens de réservation
- \`:::QR:::option 1 | option 2 | option 3 | 💬 Autre chose:::END:::\` — quick replies après CHAQUE question
- \`:::PLAN:::[{day:1, steps:[{time, title, description, location}]}]:::END:::\` — pour un parcours multi-jours
- \`:::SCENARIOS:::[{name, priceFrom, summary}]:::END:::\` — pour comparer plusieurs scénarios

### Règles sur les tags
- Chaque question que tu poses DOIT avoir ses options attachées. Pas de bloc de boutons séparé.
- Propose toujours une option "Autre" avec type="text" pour laisser une sortie libre.
- Le Membre ne doit JAMAIS avoir besoin d'écrire quand il peut cliquer.
- Quand tu suggères un lieu, inclus :::PLACES::: pour qu'il apparaisse sous forme de carte cliquable.
- Quand tu construis un parcours, inclus :::MAP::: avec tous les markers.

### Quick replies — NOUVEAU FORMAT \`<question_block>\` (préféré)
Quand tu poses UNE OU PLUSIEURS questions dans un même message, utilise le format structuré \`<question_block>\`. Chaque question devient un bloc indépendant avec ses propres options. Le Membre répond à toutes les questions avant d'envoyer (un seul bouton "Envoyer" en bas, géré par l'UI — ne l'écris pas).

Attributs :
- \`question="..."\` — le texte de la question (obligatoire)
- \`multi="true"\` ou \`multi="false"\` — autoriser plusieurs choix ou non (défaut false)

Options :
- \`<option>Label</option>\` — bouton standard
- \`<option type="text" placeholder="...">Autre</option>\` — champ texte libre avec placeholder contextuel

Exemple (2 questions dans un même message) :

\`\`\`
<question_block question="C'est pour quand ?" multi="false">
<option>Ce soir</option>
<option>Ce week-end</option>
<option>La semaine prochaine</option>
<option type="text" placeholder="Autre date...">Autre</option>
</question_block>

<question_block question="Plutôt quelle ambiance ?" multi="true">
<option>Rooftop & cocktails</option>
<option>Intimate & cosy</option>
<option>Festif & dancefloor</option>
<option>Gastro & raffiné</option>
<option type="text" placeholder="Décris ton ambiance...">Autre</option>
</question_block>
\`\`\`

**Règles critiques** :
- Utilise \`<question_block>\` quand tu poses 2+ questions dans un message (c'est fait pour ça).
- Tu peux aussi l'utiliser pour UNE seule question — c'est plus clair que :::QR:::.
- Les \`<question_block>\` sont invisibles dans le texte (strippés par le parser) — n'écris pas de reformulation de la question ailleurs dans le message.
- L'ancien \`:::QR:::\` reste supporté pour compatibilité ascendante (bloc de boutons unique en bas, clic = envoi immédiat) mais **préfère toujours \`<question_block>\` quand tu poses une question**.

## LANGUE
Réponds dans la langue du Membre. Français par défaut. Si le Membre écrit en anglais, réponds en anglais. Si en italien, en italien. Etc.`;
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
  userMessage: string,
  userPlan?: string
): Promise<ClaudeResponse> {
  const model = selectModel(messageIndex, userMessage, userPlan);

  const response = await anthropic.messages.create({
    model,
    max_tokens: 8000, // Sur-Mesure : plannings complets 7-10 jours, jamais tronqué
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
            content: "Tu es un assistant de recherche pour une Social Club de luxe. Fournis des informations précises et récentes sur les restaurants, hôtels et expériences premium. Réponds en français, de manière concise."
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
export interface ParsedQuestionOption {
  label: string;
  type: "button" | "text";
  placeholder?: string;
}

export interface ParsedQuestionBlock {
  question: string;
  multi: boolean;
  options: ParsedQuestionOption[];
}

export interface ParsedTags {
  places?: any[];
  map?: { query: string; zoom?: number; center?: { lat: number; lng: number } };
  journey?: any;
  gcal?: any[];
  booking?: any[];
  qr?: string[];
  questionBlocks?: ParsedQuestionBlock[];
  plan?: any;
  scenarios?: any[];
  cleanMessage: string;
}

export function parseStructuredTags(content: string): ParsedTags {
  const result: ParsedTags = { cleanMessage: content };

  // Helper : parse avec fallback si :::END::: absent
  function extractTag(tag: string, cnt: string): string | null {
    const strict = cnt.match(new RegExp(`:::${tag}:::[\\s\\S]*?:::END:::`, "g"));
    if (strict && strict[0]) {
      const inner = strict[0].replace(`:::${tag}:::`, "").replace(/:::END:::$/, "");
      return inner.trim();
    }
    // Fallback : tag sans :::END::: (message coupé)
    const fb = cnt.match(new RegExp(`:::${tag}:::([\\s\\S]*)$`));
    if (fb) return fb[1].trim();
    return null;
  }

  // Extract PLACES
  const placesRaw = extractTag("PLACES", content);
  if (placesRaw) {
    try { result.places = JSON.parse(placesRaw); } catch {
      // Fallback : chercher un tableau JSON dans le contenu brut
      const arrMatch = placesRaw.match(/(\[[\s\S]*?\])/); 
      if (arrMatch) { try { result.places = JSON.parse(arrMatch[1]); } catch {} }
    }
  }

  // Extract MAP
  const mapRaw = extractTag("MAP", content);
  if (mapRaw) {
    try { result.map = JSON.parse(mapRaw); } catch {
      const objMatch = mapRaw.match(/({[\s\S]*?})/); 
      if (objMatch) { try { result.map = JSON.parse(objMatch[1]); } catch {} }
    }
  }

  // Extract JOURNEY
  const journeyRaw = extractTag("JOURNEY", content);
  if (journeyRaw) {
    try { result.journey = JSON.parse(journeyRaw); } catch {
      const objMatch = journeyRaw.match(/({[\s\S]*?})/); 
      if (objMatch) { try { result.journey = JSON.parse(objMatch[1]); } catch {} }
    }
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
  const qrRaw = extractTag("QR", content);
  if (qrRaw) {
    result.qr = qrRaw
      .split("|")
      .map(s => s.trim())
      .filter(s => s.length > 1 && s.length < 80)
      .slice(0, 6);
  }

  // Extract <question_block> tags — new multi-question UI (XML-ish)
  // Format :
  //   <question_block question="..." multi="true|false">
  //     <option>Label</option>
  //     <option type="text" placeholder="...">Autre</option>
  //   </question_block>
  const blockRegex = /<question_block\s+([^>]*)>([\s\S]*?)<\/question_block>/g;
  const blocks: ParsedQuestionBlock[] = [];
  const blockMatches = Array.from(content.matchAll(blockRegex));
  for (const m of blockMatches) {
    const attrs = m[1];
    const inner = m[2];
    const qMatch = attrs.match(/question\s*=\s*"([^"]*)"/);
    const multiMatch = attrs.match(/multi\s*=\s*"([^"]*)"/);
    const question = qMatch ? qMatch[1].trim() : "";
    const multi = multiMatch ? multiMatch[1].trim() === "true" : false;
    if (!question) continue;

    const options: ParsedQuestionOption[] = [];
    const optRegex = /<option([^>]*)>([\s\S]*?)<\/option>/g;
    const optMatches = Array.from(inner.matchAll(optRegex));
    for (const om of optMatches) {
      const oAttrs = om[1];
      const label = om[2].trim();
      if (!label) continue;
      const typeMatch = oAttrs.match(/type\s*=\s*"([^"]*)"/);
      const phMatch = oAttrs.match(/placeholder\s*=\s*"([^"]*)"/);
      const type = typeMatch && typeMatch[1] === "text" ? "text" : "button";
      options.push({
        label,
        type,
        ...(type === "text" && phMatch ? { placeholder: phMatch[1] } : {}),
      });
    }
    if (options.length > 0) {
      blocks.push({ question, multi, options });
    }
  }
  if (blocks.length > 0) {
    result.questionBlocks = blocks;
  }

  // Extract PLAN
  const planRaw = extractTag("PLAN", content);
  if (planRaw) {
    try { result.plan = JSON.parse(planRaw); } catch {}
  }

  // Extract SCENARIOS
  const scenariosRaw = extractTag("SCENARIOS", content);
  if (scenariosRaw) {
    try { result.scenarios = JSON.parse(scenariosRaw); } catch {
      const arrMatch = scenariosRaw.match(/(\[[\s\S]*?\])/); 
      if (arrMatch) { try { result.scenarios = JSON.parse(arrMatch[1]); } catch {} }
    }
  }

  // ⚠️ CRITIQUE : nettoyage TOUJOURS appliqué — le client ne voit JAMAIS de JSON brut
  result.cleanMessage = content
    .replace(/:::PLACES:::[\.\s\S]*?(:::END:::|$)/g, "")
    .replace(/:::MAP:::[\.\s\S]*?(:::END:::|$)/g, "")
    .replace(/:::BOOKING:::[\.\s\S]*?(:::END:::|$)/g, "")
    .replace(/:::JOURNEY:::[\.\s\S]*?(:::END:::|$)/g, "")
    .replace(/:::SCENARIOS:::[\.\s\S]*?(:::END:::|$)/g, "")
    .replace(/:::GCAL:::[\.\s\S]*?(:::END:::|$)/g, "")
    .replace(/:::QR:::[\.\s\S]*?(:::END:::|$)/g, "")
    .replace(/:::PLAN:::[\.\s\S]*?(:::END:::|$)/g, "")
    // Supprimer les question_block (rendus en UI par le composant QuestionBlock)
    .replace(/<question_block[\s\S]*?<\/question_block>/g, "")
    // Sécurité finale : supprimer tout tag résiduel
    .replace(/:::[A-Z_]+:::[\s\S]*/g, "")
    .trim();

  return result;
}
