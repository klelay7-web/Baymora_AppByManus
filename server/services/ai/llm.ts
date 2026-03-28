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

// ─── Modèles disponibles ──────────────────────────────────────────────────────

const MODELS = {
  opus: 'claude-opus-4-6',
  sonnet: 'claude-sonnet-4-6',
} as const;

type ModelKey = keyof typeof MODELS;

// ─── System Prompts ───────────────────────────────────────────────────────────

const BASE_SYSTEM = `Tu es Baymora, un assistant de conciergerie de voyage ultra-premium. Tu incarnes l'excellence, la discrétion et l'intelligence d'un vrai chef concierge de palace — comme si le Ritz et le Four Seasons avaient créé leur propre IA.

## Ta mission
Aider des clients premium (de l'aisé à l'ultra-riche) à préparer et vivre des voyages parfaits. Tu dois leur faire GAGNER DU TEMPS et OPTIMISER chaque moment.

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

## Stratégie conversationnelle
Tu ne proposes JAMAIS un plan complet sans avoir ces 3 infos : destination (ou envie), avec qui, durée.
- Si le client donne une destination → accuse réception ("St Tropez, excellent choix !"), puis demande ce qui MANQUE (une seule question à la fois).
- Si le client dit "surprise moi" → demande ses préférences (plage/montagne/ville ? France/étranger ?).
- Ne répète JAMAIS une question dont la réponse est déjà dans la conversation.
- Quand tu as les 3 infos essentielles → passe immédiatement aux recommandations concrètes.

## Ce que tu ne fais jamais
- Jamais robotique ou formel à l'excès.
- Jamais de réponses génériques type Wikipedia.
- Jamais plus de 3 questions en une fois.
- Jamais croiser les données entre clients.

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

function buildSystemPrompt(userId: string, modelKey: ModelKey): string {
  const extra = modelKey === 'opus' ? OPUS_EXTRA : SONNET_EXTRA;
  const base = BASE_SYSTEM + extra;

  const memory = getClientMemory(userId);
  if (!memory || Object.keys(memory.preferences).length === 0) return base;

  const prefs = memory.preferences;
  const lines: string[] = [];

  if (prefs.travelStyle) lines.push(`Style : ${prefs.travelStyle}`);
  if (prefs.budget?.max) lines.push(`Budget indicatif : jusqu'à ${prefs.budget.max} ${prefs.budget.currency || 'EUR'}`);
  if (prefs.pace) lines.push(`Rythme préféré : ${prefs.pace}`);
  if (prefs.petFriendly) lines.push(`Voyage avec animal de compagnie`);
  if (prefs.travelsWithChildren) {
    const ages = prefs.childrenAges?.length ? ` (âges: ${prefs.childrenAges.join(', ')})` : '';
    lines.push(`Voyage avec enfants${ages}`);
  }
  if (prefs.accessibility?.length) lines.push(`Accessibilité : ${prefs.accessibility.join(', ')}`);
  if (prefs.favoriteDestinations?.length) lines.push(`Destinations appréciées : ${prefs.favoriteDestinations.join(', ')}`);
  if (prefs.activities?.length) lines.push(`Activités : ${prefs.activities.join(', ')}`);
  if (prefs.cuisine?.length) lines.push(`Cuisines : ${prefs.cuisine.join(', ')}`);
  if (prefs.languages?.length) lines.push(`Langues : ${prefs.languages.join(', ')}`);

  if (lines.length === 0) return base;

  return `${base}

## Profil connu de ce client
${lines.map(l => `- ${l}`).join('\n')}

Intègre ces informations naturellement. Ne les récite pas.`;
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
  language: 'fr' | 'en' = 'fr'
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

  try {
    const client = new Anthropic({ apiKey });
    const systemPrompt = buildSystemPrompt(userId, modelKey);

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
        const systemPrompt = buildSystemPrompt(userId, 'sonnet');
        const response = await client.messages.create({
          model: MODELS.sonnet,
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        });
        const content = response.content[0].type === 'text'
          ? response.content[0].text
          : getFallbackResponse(lastMessage, language);
        return { content, model: 'sonnet' };
      } catch {
        // Les deux ont échoué
      }
    }

    return {
      content: getFallbackResponse(lastMessage, language),
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
