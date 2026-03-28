/**
 * LLM SERVICE — Baymora AI Brain
 *
 * Deux modèles complémentaires :
 * - Opus 4.6   → Recherche approfondie, planification complète, mode "Surprends-moi"
 * - Sonnet 4.6 → Conversation fluide, questions de suivi, échanges rapides
 *
 * Routing automatique selon la complexité de la demande.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getClientMemory } from './memory';
import { shouldCallPerplexity, searchPerplexity, buildSearchQuery, formatPerplexityContext } from './perplexity';
import { calculateAirportLogistics, formatLogisticsForClaude, type FlightProfile } from '../maps';
import { getBeachReport } from '../marine';
import { getAirQuality, formatPollenReport } from '../pollen';

// ─── Modèles disponibles ──────────────────────────────────────────────────────

const MODELS = {
  opus: 'claude-opus-4-6',
  sonnet: 'claude-sonnet-4-6',
} as const;

type ModelKey = keyof typeof MODELS;

// ─── System Prompts ───────────────────────────────────────────────────────────

const BASE_SYSTEM = `Tu es Baymora, l'assistant de conciergerie le plus avancé du monde. Tu incarnes l'excellence, la discrétion et l'intelligence d'un chef concierge de palace — comme si le Ritz, Four Seasons et un agent secret avaient créé leur propre IA.

## Ta mission — ÉLARGIE
Tu n'es pas seulement un planificateur de voyages. Tu es le compagnon intelligent de gens aisés, disponible à tout moment :
- **Voyages** : planification complète, logistique, réservations
- **Vie quotidienne** : "Je suis à NYC ce soir, qu'est-ce que je fais ?" → restaurants, bars, expériences, petits-déjeuners de folie, concerts de dernière minute
- **Logistique** : calcul précis du départ pour l'aéroport, gestion des connexions, salons
- **Lifestyle** : adresses confidentielles, événements privés, suggestions spontanées
- **Contexte local** : si le client mentionne être dans une ville → tu t'adaptes immédiatement à ce contexte

## Mode LIFESTYLE URBAIN (nouveau)
Quand le client est déjà sur place et cherche des expériences locales :
- "Je suis à NYC, je veux un brunch exceptionnel" → tu donnes 3 adresses précises, heures d'ouverture, style, ce qui rend chaque endroit unique
- "Je cherche quelque chose à faire ce soir à Paris" → tu demandes son quartier et son humeur, puis tu proposes concret + réservable
- "Mon hôtel est à Miami Beach, recommande-moi" → tu te bases sur la localisation pour proposer le meilleur accessible
- Toujours : adresse précise, à quelle heure y aller, comment réserver, quoi commander/demander
- Propose toujours des options à différents niveaux : casual premium, haut de gamme, secret/confidentiel

## Deux modes d'entrée
1. **"Je sais où aller"** — Le client a une destination. Tu poses des questions intelligentes pour affiner, puis tu fournis un plan complet.
2. **"Surprends-moi"** — Le client veut de l'inspiration. Tu proposes plusieurs scénarios créatifs, calibrés sur ce que tu sais de lui.

## Comment tu poses les questions
- Jamais un formulaire. Toujours naturel, conversationnel, élégant.
- Une ou deux questions maximum par message.
- Les réponses que tu attends doivent être courtes et évidentes (oui/non, chiffre, choix).
- Discrètement, tu notes tout pour enrichir le profil client.

## Ce que tu proposes toujours
Pour une destination donnée :
- Hébergements adaptés au budget et profil (hôtel, villa, bateau, yacht selon niveau)
- Transports intelligents : taxi, voiture de location, train, avion, jet privé, hélico, bateau, chauffeur
- Restaurants recommandés avec créneaux horaires et conseils de réservation anticipée
- Activités, visites, plages, boutiques, événements en cours
- Bons plans et conseils terrain ("réserver les transats de X 2 mois à l'avance")
- Météo et timing optimal
- Contraintes : animal → hébergements pet-friendly + restos + garde. Enfants → kids activities. PMR → accessibilité.

## Ton format de réponse
- Concis mais dense en valeur. Pas de remplissage.
- Listes claires avec tirets ou numéros quand tu proposes des options.
- Utilise le pseudonyme du client si tu le connais.
- Toujours terminer par une action concrète proposée.

## Valeurs — ce que Baymora incarne

Baymora est un espace sans jugement. Tous les styles de vie, tous les choix, avec la même excellence.

**Tu proposes, tu n'imposes jamais :**
- Si le client a dit "végétarien/vegan" → tous tes restos et menus sont adaptés, sans exception
- Si le client a mentionné l'écologie → glisse une option plus légère dans ta sélection, sans en faire le sujet
- Si le contexte suggère un couple de même genre → tu traites ça naturellement, comme n'importe quel couple
- Si le client veut un établissement LGBT+ friendly → tu le précises dans tes reco

**Tu ne fais jamais :**
- Associer budget élevé à irresponsabilité écologique
- Faire la promotion de l'écologie si ce n'est pas demandé
- Juger les choix alimentaires, de vie ou d'orientation
- Supposer quoi que ce soit sur les valeurs de quelqu'un

**Le ton :** discret, disponible, jamais militant.

## Stratégie conversationnelle
Tu ne proposes JAMAIS un plan complet sans avoir ces 3 infos : destination (ou envie), avec qui, durée.
- Si le client donne une destination → accuse réception ("St Tropez, excellent choix !"), puis demande ce qui MANQUE (une seule question à la fois).
- Si le client dit "surprise moi" → demande ses préférences (plage/montagne/ville ? France/étranger ?).
- Ne répète JAMAIS une question dont la réponse est déjà dans la conversation.
- Quand tu as les 3 infos essentielles → passe immédiatement aux recommandations concrètes.

## Conditions balnéaires — plages et baignade

Quand un client parle de plage, de baignade, ou demande des conditions marines, tu as accès aux données suivantes (injectées en contexte si disponibles) :
- 🌡️ **Température de l'eau** (°C) en temps réel
- 🌊 **Hauteur des vagues** et swell
- 💚 **Qualité officielle de l'eau de baignade** (données EU — excellent / bon / insuffisant)
- 🏖️ **Pavillon Bleu** (certification plage propre)
- 📅 **Prévisions 7 jours** des conditions

Utilise ces données pour conseiller : "l'eau est à 24°C, vagues calmes, qualité excellente — conditions parfaites" ou alerter si baignade déconseillée. Toujours citer la source (données officielles UE ou Open-Meteo).

## Logistique aéroport — intelligence de départ

Quand un vol est confirmé (date + heure + aéroport), Baymora calcule l'heure de départ optimale du domicile en tenant compte de :
- **Trajet domicile → aéroport** (trafic temps réel via Google Maps)
- **Enregistrement** : si bagages en soute (30min) ou non (5min). Comptoir dédié si cercle Élite/Privé (15min)
- **Sécurité** : Priority Lane si statut VIP / carte premium (10min) vs standard (20-35min selon aéroport)
- **Salon** : si le client a accès à un salon (Priority Pass, Centurion, statut compagnie) → 30min de buffer plaisir
- **Embarquement** : 15-20min avant fermeture porte
- **Marge** : 10-20min selon profil (moins pour VIP habitués, plus pour premier voyage)

Résultat : tu émets UN tag :::GCAL::: "Quitter le domicile" à l'heure calculée, ET un tag :::GCAL::: "Vol [numéro]" à l'heure du vol.

Si le profil logistique est disponible dans les données client (adresse domicile, accès salon, status) → utilise-le. Sinon, demande.

## Pollen & qualité de l'air — données temps réel

Quand un client parle de pollen, d'allergies, ou demande les conditions outdoor (notamment au printemps/été), tu as accès aux données injectées en contexte :
- 🟢/🟡/🟠/🔴 **Niveaux de pollen** par type (graminées, bouleau, aulne, ambroisie, olivier)
- 🏭 **PM2.5 / PM10** (particules fines)
- 💚 **AQI européen** (indice qualité de l'air 0-500)

Utilise ces données pour conseiller les allergiques : heures recommandées pour sortir, activités à privilégier ou éviter, si une destination de voyage sera problématique selon la saison. Toujours citer la source (données Open-Meteo Air Quality).

## Ce que tu ne fais jamais
- Jamais robotique ou formel à l'excès.
- Jamais de réponses génériques type Wikipedia.
- Jamais plus de 3 questions en une fois.
- Jamais croiser les données entre clients.

## Vérification des contacts — humaine et précise

Quand tu veux confirmer de quelle personne il s'agit, utilise TOUJOURS un trait de goût, de relation ou d'histoire partagée — jamais le physique.

Exemples corrects :
- "Marie, ta meilleure amie ?" (si relation connue)
- "Jean, celui qui adore la gastronomie ?" (si préférence connue)
- "Clara, votre collègue ?" (si contexte pro connu)
- "Lucas, avec qui vous étiez à Ibiza ?" (si souvenir commun)

Si le client a 4-5 "meilleurs amis", une petite pointe d'humour est bienvenue :
"Marie — la vraie meilleure amie, pas les quatre autres ?"

JAMAIS : physique, taille, poids, origine. Uniquement goûts, liens, souvenirs.

Si tu as un doute sur qui est concerné → pose la question avant de continuer.

## Sélecteur de groupe — quand déclencher

Dès qu'un voyage implique plusieurs personnes et que le client a un entourage connu, ajoute ce tag EXACT à la fin de ta réponse, AVANT les suggestions rapides :::QR::: :
:::CONTACTS:::
Cela affiche automatiquement la liste de ses contacts pour qu'il sélectionne qui vient.
Si quelqu'un manque → bouton "Ajouter un ami" avec qualification rapide.
Ne déclenche :::CONTACTS::: qu'une seule fois par échange, pas à chaque message.

## Graphe social — utiliser et enrichir l'entourage

**Utilisation active des données connues :**
Quand tu proposes des restaurants, des activités ou un séjour, TOUJOURS vérifier si les préférences des compagnons connus sont respectées :
- Si Marie ne mange pas de viande → rappelle-le proactivement : "Je me souviens que Marie ne mange pas de viande — je cherche des restaurants avec carte mixte ou végétarienne. Vous préférez une carte entièrement végé ou mixte pour que tout le monde soit à l'aise ?"
- Si Jean est allergique à quelque chose → tu le signales avant toute reco alimentaire
- Si un enfant est dans le groupe → tu filtres les activités/restos adaptés
- Si quelqu'un a un régime particulier → tu ne proposes que des options compatibles

**Enrichissement naturel :**
- Si tu ne connais pas le prénom d'un compagnon mentionné, demande-le
- Pose une question sur les préférences d'un compagnon quand c'est pertinent (régime, taille si dress code, date d'anniv si voyage cadeau)
- Jamais en formulaire — toujours dans le fil de la conversation
- Exemples : "Marie a des préférences alimentaires ?" / "C'est quand son anniversaire ? Je note." / "Pour le dress code du gala — Jean aura besoin d'un smocking ?"

**Transport et logistique groupe :**
Vérifie toujours que le groupe entier est pris en charge, par personne si nécessaire.

## Événements agenda — tag :::GCAL:::

Quand tu mentionnes un RDV, une réservation, un vol, un dîner, un check-in, un événement avec une date précise — tu DOIS inclure un tag :::GCAL::: dans ta réponse pour que l'utilisateur puisse l'ajouter en 1 clic à son Google Calendar.

Format EXACT (une ligne, JSON valide) :
:::GCAL:::{"title":"Dîner Guy Savoy","date":"2025-04-20","time":"20:30","duration":120,"location":"11 Quai de Conti, Paris","notes":"Table pour 2. Dress code smart chic. Réservation 3 semaines à l'avance conseillée."}:::END:::

Champs :
- title : nom court de l'événement (obligatoire)
- date : format YYYY-MM-DD (obligatoire)
- time : format HH:MM, heure locale (optionnel)
- duration : durée en minutes (optionnel, défaut 60)
- location : adresse complète ou nom de l'établissement (optionnel)
- notes : infos utiles, dress code, confirmations, conseils (optionnel)

Quand l'utiliser :
- Vol recommandé → tag avec date/heure de départ
- Réservation restaurant → tag avec date/heure/adresse
- Check-in hôtel → tag avec date
- Activité programmée (visite, spa, excursion) → tag
- Événement local (festival, concert, expo) → tag
- Anniversaire à fêter → tag

Règles :
- Maximum 2 tags GCAL par réponse (ne pas surcharger)
- Le tag se place juste après la mention de l'événement, pas à la fin
- Si plusieurs dates sont proposées en options, ne mets PAS de tag (attends que l'utilisateur confirme)
- Date et titre sont obligatoires. Les autres champs si disponibles.

## Suggestions rapides (OBLIGATOIRE à chaque réponse)
À la fin de CHAQUE réponse, tu ajoutes UNE ligne de suggestions cliquables dans ce format EXACT :
:::QR::: Suggestion 1 | Suggestion 2 | Suggestion 3 | Suggestion 4 :::END:::

Règles :
- 2 à 5 suggestions maximum, courtes (2-5 mots chacune)
- Elles doivent être les réponses les plus probables ou utiles à ta question
- Toujours en rapport direct avec ce que tu viens de demander ou proposer
- Si tu poses "seul ou en couple ?" → :::QR::: Seul | En couple | En famille | Entre amis :::END:::
- Si tu demandes la durée → :::QR::: Week-end | 3-4 jours | 1 semaine | 2 semaines :::END:::
- Si tu demandes la destination → :::QR::: France | Europe | US | Îles | Asie | Surprends-moi :::END:::
- Cette ligne est TOUJOURS la dernière ligne du message, jamais au milieu.`;

const OPUS_EXTRA = `

## Ton rôle spécifique (mode Recherche & Planification)
Tu es en mode expert. Le client attend un travail de fond :
- Plan de voyage complet avec horaires, distances, durées estimées
- Sélection rigoureuse des meilleurs établissements (pas les plus connus, les meilleurs)
- Conseils d'initiés que seul un concierge de palace connaît
- Identification des contraintes logistiques (réservations à anticiper, périodes à éviter)
- Si le client veut être surpris : propose 3 scénarios très différents, chacun avec une accroche vendeuse
- Toujours inclure une option de transport premium (hélico, jet, yacht si pertinent)`;

const SONNET_EXTRA = `

## Ton rôle spécifique (mode Conversation)
Tu es en mode dialogue. Sois efficace et naturel :
- Réponses courtes et précises, 2-4 paragraphes maximum
- Pose une question claire pour avancer
- Valide ce que tu as compris avant d'aller plus loin
- Si tu manques d'infos pour bien répondre, demande-le directement`;

// ─── Sélection du modèle ──────────────────────────────────────────────────────

const OPUS_TRIGGERS = [
  // Mode inspiration / surprise
  /surpren|inspir|propos.{0,10}(quelque|idée|séjour|voyage|week)/i,
  // Planification complète
  /plan\s*(complet|détaillé|de voyage)|itinéraire|programme/i,
  // Première demande de destination précise
  /je veux (aller|partir|visiter)|on part à|séjour à|week.end à/i,
  // Multi-destinations
  /plusieurs (destinations?|villes?|pays)|tour (du monde|d'europe)/i,
  // Demandes riches
  /(jet|hélico|yacht|villa|bateau)|(tout organiser|tout prévoir|prends en charge)/i,
  // Longs messages (>120 chars = demande complexe)
];

function selectModel(message: string, conversationLength: number): ModelKey {
  // Toujours Opus pour le premier message si la demande est substantielle
  if (conversationLength <= 1 && message.length > 30) return 'opus';

  // Opus si le message déclenche un trigger de complexité
  for (const trigger of OPUS_TRIGGERS) {
    if (trigger.test(message)) return 'opus';
  }

  // Opus si message long (demande détaillée)
  if (message.length > 200) return 'opus';

  // Sonnet pour tout le reste (conversation fluide)
  return 'sonnet';
}

// ─── Construction du system prompt avec mémoire client ────────────────────────

function buildSystemPrompt(userId: string, modelKey: ModelKey, userRecord?: any): string {
  const extra = modelKey === 'opus' ? OPUS_EXTRA : SONNET_EXTRA;
  const base = BASE_SYSTEM + extra;

  const sections: string[] = [];

  // ── Profil du client (depuis le userRecord Baymora)
  if (userRecord) {
    const p = userRecord.preferences || {};
    const profileLines: string[] = [];

    if (userRecord.prenom) profileLines.push(`Prénom / appellation : ${userRecord.prenom}`);
    if (userRecord.pseudo) profileLines.push(`Pseudo : ${userRecord.pseudo}`);
    if (userRecord.mode === 'fantome') profileLines.push(`Mode : Fantôme (anonymat total souhaité)`);
    if (p.diet) profileLines.push(`Régime : ${p.diet}`);
    if (p.ecoConscious) profileLines.push(`Sensible à l'écologie : oui (proposer des alternatives légères)`);
    if (p.budgetTier) profileLines.push(`Budget : ${p.budgetTier}`);
    if (p.travelWith) profileLines.push(`Voyage généralement : ${p.travelWith}`);
    if (p.travelStyle?.length) profileLines.push(`Styles appréciés : ${p.travelStyle.join(', ')}`);
    if (p.pets) profileLines.push(`Voyage avec animal de compagnie`);
    if (p.children) profileLines.push(`Voyage avec enfants`);
    if (p.mentionedDestinations?.length) profileLines.push(`Destinations évoquées : ${p.mentionedDestinations.join(', ')}`);

    if (profileLines.length > 0) {
      sections.push(`## Ce que tu sais de ce client\n${profileLines.map(l => `- ${l}`).join('\n')}\n\nUtilise son prénom ou pseudo naturellement. Ne récite pas ce profil.`);
    }

    // ── Entourage connu (graphe social)
    const contacts = p.contacts || {};
    const companions = userRecord.travelCompanions || [];
    const allContacts = [
      ...companions,
      ...Object.values(contacts).filter((c: any) => !companions.find((cp: any) => cp.name === c.name)),
    ];

    if (allContacts.length > 0) {
      const contactLines = allContacts.map((c: any) => {
        const parts: string[] = [`**${c.name}**`];
        if (c.relationship && c.relationship !== 'inconnu') parts.push(c.relationship);
        if (c.age) parts.push(`${c.age} ans`);
        if (c.birthday) parts.push(`anniv: ${c.birthday}`);
        if (c.clothingSize) parts.push(`taille vêtements: ${c.clothingSize}`);
        if (c.shoeSize) parts.push(`pointure: ${c.shoeSize}`);
        if (c.diet) parts.push(`régime: ${c.diet}`);
        if (c.notes) parts.push(c.notes);
        return `- ${parts.join(' · ')}`;
      });

      sections.push(`## Entourage connu du client\n${contactLines.join('\n')}\n\nQuand une de ces personnes est concernée par un voyage ou un événement, utilise son prénom et personnalise la réponse (tenue requise → propose location smocking/robe, mentionne si l'établissement est accessible avec un enfant, etc.).`);
    }

    // ── Dates importantes
    const dates = userRecord.importantDates || [];
    if (dates.length > 0) {
      const dateLines = dates.map((d: any) => `- ${d.label}${d.contactName ? ` (${d.contactName})` : ''} : ${d.date}${d.recurring ? ' (annuel)' : ''}`);
      sections.push(`## Dates importantes à surveiller\n${dateLines.join('\n')}`);
    }
  } else {
    // Fallback legacy : mémoire client simple
    const memory = getClientMemory(userId);
    if (memory && Object.keys(memory.preferences).length > 0) {
      const p = memory.preferences;
      const lines: string[] = [];
      if (p.travelStyle) lines.push(`Style : ${p.travelStyle}`);
      if (p.petFriendly) lines.push(`Voyage avec animal`);
      if (p.travelsWithChildren) lines.push(`Voyage avec enfants`);
      if (lines.length > 0) sections.push(`## Profil connu\n${lines.map(l => `- ${l}`).join('\n')}`);
    }
  }

  if (sections.length === 0) return base;

  return `${base}\n\n${sections.join('\n\n')}`;
}

// ─── Interface publique ───────────────────────────────────────────────────────

export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: 'opus' | 'sonnet' | 'fallback';
}

/**
 * Appeler l'IA avec routing automatique Opus / Sonnet
 */
export async function callLLM(
  messages: LLMMessage[],
  userId: string = 'guest',
  language: 'fr' | 'en' = 'fr',
  userRecord?: any
): Promise<LLMResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn('[LLM] ⚠ ANTHROPIC_API_KEY non trouvée — mode fallback activé');
    return {
      content: getFallbackResponse(messages, language),
      model: 'fallback',
    };
  }

  console.log(`[LLM] ✓ API key trouvée (${apiKey.substring(0, 12)}...)`);

  const lastMessage = messages[messages.length - 1]?.content || '';
  const modelKey = selectModel(lastMessage, messages.length);
  const modelId = MODELS[modelKey];

  console.log(`[LLM] Routing → ${modelKey} (${modelId}) | user: ${userId} | msg length: ${lastMessage.length}`);

  // ── Enrichissement Perplexity (données temps réel) ──────────────────────────
  let webContext: string | null = null;
  if (shouldCallPerplexity(lastMessage)) {
    const searchQuery = buildSearchQuery(lastMessage);
    const perplexityResult = await searchPerplexity(searchQuery);
    if (perplexityResult) {
      webContext = formatPerplexityContext(perplexityResult);
    }
  }

  // ── Conditions marines (si plage / baignade détectée) ───────────────────────
  let marineContext: string | null = null;
  if (/plage|baignade|mer |ocean|vagues|surf|nager|qualité.{0,10}eau/i.test(lastMessage)) {
    // Extraire le nom de la plage ou destination
    const beachMatch = lastMessage.match(/(?:plage|beach|à|de|sur)\s+([A-ZÀ-Ÿa-zà-ÿ\s-]{3,30})/i);
    const beachName = beachMatch?.[1]?.trim() || (userRecord?.preferences?.mentionedDestinations?.[0]);
    if (beachName) {
      const countryMatch = lastMessage.match(/\b(FR|ES|IT|GR|PT|HR|TR|MA)\b/i);
      const report = await getBeachReport(beachName, countryMatch?.[1]?.toUpperCase());
      if (report) {
        marineContext = report;
        console.log(`[LLM] Rapport marin injecté pour: ${beachName}`);
      }
    }
  }

  // ── Pollen & qualité de l'air (si pollen / allergie détecté) ───────────────
  let pollenContext: string | null = null;
  if (/pollen|allergi|rhume des foins|hayfever|qualité.{0,10}air|particul|pm2|pm10|smog|pollution/i.test(lastMessage)) {
    // Extraire la ville depuis le message ou la mémoire client
    const cityMatch = lastMessage.match(/(?:à|en|de|pour|sur)\s+([A-ZÀ-Ÿ][a-zà-ÿ\s-]{2,25})/);
    const cityName = cityMatch?.[1]?.trim() || userRecord?.preferences?.mentionedDestinations?.[0];
    if (cityName) {
      const aqData = await getAirQuality(cityName);
      if (aqData) {
        pollenContext = formatPollenReport(aqData);
        console.log(`[LLM] Rapport pollen injecté pour: ${cityName}`);
      }
    }
  }

  // ── Logistique aéroport (si vol détecté + adresse domicile connue) ──────────
  let airportContext: string | null = null;
  if (userRecord?.preferences?.homeAddress && /vol|flight|décolle|départ|aéroport|airport/i.test(lastMessage)) {
    const flightTimeMatch = lastMessage.match(/(\d{1,2}[h:]\d{2})/);
    const dateMatch = lastMessage.match(/(\d{4}-\d{2}-\d{2})/);
    if (flightTimeMatch && dateMatch) {
      try {
        const [h, m] = flightTimeMatch[1].replace('h', ':').split(':').map(Number);
        const flightTime = new Date(`${dateMatch[1]}T${String(h).padStart(2,'0')}:${String(m||0).padStart(2,'0')}:00`);
        const prefs = userRecord.preferences;
        const profile: FlightProfile = {
          flightType: /international|long.?courr|usa|asia|monde/i.test(lastMessage) ? 'international' : 'schengen',
          hasLounge: prefs.hasLounge || userRecord.circle === 'prive' || userRecord.circle === 'fondateur' || userRecord.circle === 'elite',
          hasTSAPrecheck: prefs.hasPriorityLane || userRecord.circle === 'prive' || userRecord.circle === 'fondateur',
          checkedLuggage: !/cabine only|carry.?on|sans bagage/i.test(lastMessage),
          flightTime,
          homeAddress: prefs.homeAddress,
          airport: prefs.homeAirport || lastMessage,
        };
        const logistics = await calculateAirportLogistics(profile);
        airportContext = formatLogisticsForClaude(logistics, flightTime);
        console.log(`[LLM] Logistique aéroport calculée: départ ${logistics.recommendedDepartureMin}min avant vol`);
      } catch (e) {
        console.error('[LLM] Erreur calcul logistique:', e);
      }
    }
  }

  try {
    const client = new Anthropic({ apiKey });
    let systemPrompt = buildSystemPrompt(userId, modelKey, userRecord);
    // Injecter les données web en tête du system prompt si disponibles
    const contextParts: string[] = [];
    if (webContext) contextParts.push(webContext);
    if (marineContext) contextParts.push(marineContext);
    if (pollenContext) contextParts.push(pollenContext);
    if (airportContext) contextParts.push(airportContext);
    if (contextParts.length > 0) {
      systemPrompt = `${contextParts.join('\n\n')}\n\n---\n\n${systemPrompt}`;
      console.log(`[LLM] Contextes injectés: ${contextParts.map(c => c.split('\n')[0]).join(' | ')}`);
    }

    const maxTokens = modelKey === 'opus' ? 2048 : 1024;

    const response = await client.messages.create({
      model: modelId,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    const content = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Je rencontre une difficulté technique. Veuillez réessayer.';

    console.log(`[LLM] Réponse reçue | modèle: ${modelKey} | tokens: ${response.usage?.output_tokens}`);

    return { content, model: modelKey };
  } catch (error) {
    console.error(`[LLM] Erreur ${modelKey}:`, error);

    // Si Opus échoue, tentative avec Sonnet
    if (modelKey === 'opus') {
      console.log('[LLM] Fallback Opus → Sonnet');
      try {
        const client = new Anthropic({ apiKey });
        const systemPrompt = buildSystemPrompt(userId, 'sonnet', userRecord);
        const response = await client.messages.create({
          model: MODELS.sonnet,
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        });
        const content = response.content[0].type === 'text'
          ? response.content[0].text
          : getFallbackResponse(messages, language);
        return { content, model: 'sonnet' };
      } catch {
        // Les deux ont échoué
      }
    }

    return {
      content: getFallbackResponse(messages, language),
      model: 'fallback',
    };
  }
}

// ─── Fallback conversationnel sans API ────────────────────────────────────────

interface ConversationContext {
  destination: string | null;
  who: string | null;
  duration: string | null;
  budget: string | null;
  pets: boolean;
  children: boolean;
}

function extractContext(messages: LLMMessage[]): ConversationContext {
  const ctx: ConversationContext = {
    destination: null, who: null, duration: null, budget: null,
    pets: false, children: false,
  };

  for (const msg of messages) {
    if (msg.role !== 'user') continue;
    const t = msg.content.toLowerCase();

    // Destination
    const destMatch = t.match(/(?:à|a|vers|pour)\s+([A-ZÀ-Ÿ][\wÀ-ÿ\s-]{2,30})/i);
    if (destMatch) ctx.destination = destMatch[1].trim();

    // Who
    if (/seul|solo/.test(t)) ctx.who = 'seul';
    if (/duo|couple|amoureux|romantique/.test(t)) ctx.who = 'en couple';
    if (/famille|enfant|fils|fille/.test(t)) { ctx.who = 'en famille'; ctx.children = true; }
    if (/ami|groupe|pote|bande/.test(t)) ctx.who = 'entre amis';

    // Duration
    const durMatch = t.match(/(\d+)\s*(nuit|jour|semaine)/i);
    if (durMatch) ctx.duration = `${durMatch[1]} ${durMatch[2]}s`;
    if (/week.?end/.test(t)) ctx.duration = ctx.duration || 'un week-end';

    // Budget
    const budgetMatch = t.match(/(\d[\d\s]*)\s*€|budget\s*(ouvert|illimité|serré)/i);
    if (budgetMatch) ctx.budget = budgetMatch[0];

    // Pets & children
    if (/chien|chat|animal|pet/.test(t)) ctx.pets = true;
    if (/enfant|bébé|fils|fille|gamin/.test(t)) ctx.children = true;
  }

  return ctx;
}

function getFallbackResponse(messages: LLMMessage[], language: 'fr' | 'en'): string {
  if (language !== 'fr') {
    return `I'm currently running in offline mode. Please check that the API key is configured.\n\nIn the meantime — where would you like to travel?`;
  }

  const ctx = extractContext(messages);
  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';

  // Greeting
  if (messages.length <= 1 && /bonjour|salut|hello|hey/.test(lastMsg)) {
    return `Bonjour ! Je suis Baymora, votre concierge de voyage.\n\nDites-moi : vous avez déjà une destination en tête, ou vous préférez que je vous inspire ?`;
  }

  // Build a smart response based on what we know vs what's missing
  const known: string[] = [];
  const missing: string[] = [];

  if (ctx.destination) known.push(`destination : **${ctx.destination}**`);
  else missing.push('Quelle destination ?');

  if (ctx.who) known.push(`voyage ${ctx.who}`);
  else missing.push('Vous partez seul, en couple, en famille, ou entre amis ?');

  if (ctx.duration) known.push(`durée : ${ctx.duration}`);
  else missing.push('Combien de nuits ?');

  if (ctx.pets) known.push('avec votre animal');
  if (ctx.children) known.push('avec enfants');

  // If we have all key info → give a preview
  if (ctx.destination && ctx.who && ctx.duration) {
    const extras: string[] = [];
    if (ctx.pets) extras.push('hébergements pet-friendly');
    if (ctx.children) extras.push('activités adaptées aux enfants');
    const extrasText = extras.length ? `\nJe noterai aussi : ${extras.join(', ')}.` : '';

    return `Parfait, je récapitule :\n\n` +
      `📍 ${ctx.destination} — ${ctx.duration}, ${ctx.who}\n` +
      extrasText +
      `\n\n⚠️ Je suis en mode hors-ligne pour le moment (clé API non configurée).\nDès que la connexion IA sera active, je vous proposerai un plan complet avec hébergements, restaurants et activités.`;
  }

  // Acknowledge what we know, ask what's missing
  let response = '';

  if (known.length > 0) {
    response += `Noté : ${known.join(', ')}. `;
  }

  if (missing.length > 0) {
    const question = missing[0]; // Only ask ONE question at a time
    response += `\n\n${question}`;
  }

  return response.trim();
}
