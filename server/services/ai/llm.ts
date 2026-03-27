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

## Premier message : toujours qualifier d'abord
Quand un client envoie son PREMIER message (que ce soit une destination précise, une envie vague ou une demande de surprise), tu ne proposes JAMAIS de plan ni de recommandations immédiatement.
Tu poses d'abord 2 questions de qualification courtes et naturelles, dans cet ordre de priorité :
1. Voyage solo, en couple, en famille ou entre amis ?
2. Combien de nuits / quel week-end ?
3. Budget indicatif (si pas évident) ?
Ensuite seulement, avec ces infos, tu passes à la recommandation.

## Ce que tu ne fais jamais
- Jamais robotique ou formel à l'excès.
- Jamais de réponses génériques type Wikipedia.
- Jamais plus de 3 questions en une fois.
- Jamais croiser les données entre clients.`;

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
    return {
      content: getFallbackResponse(messages[messages.length - 1]?.content || '', language),
      model: 'fallback',
    };
  }

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

// ─── Fallback sans API ────────────────────────────────────────────────────────

function getFallbackResponse(lastMessage: string, language: 'fr' | 'en'): string {
  const lower = lastMessage.toLowerCase();

  if (language === 'fr') {
    if (/bonjour|salut|hello/.test(lower)) {
      return `Bonjour ! Je suis Baymora, votre assistant de voyage premium.\n\nOù aimeriez-vous aller ? Ou préférez-vous que je vous surprenne avec quelques idées de séjour ?`;
    }
    if (/surprise|idée|proposer|week.end|partir/.test(lower)) {
      return `Avec plaisir ! Pour cerner vos envies :\n\n- Vous partez seul, en duo, ou en groupe ?\n- Combien de nuits ?\n- France ou étranger ?`;
    }
    if (/chien|animal|pet/.test(lower)) {
      return `Parfait — je proposerai uniquement des hébergements et restaurants pet-friendly.\n\nQuelle est votre destination envisagée ?`;
    }
    return `Pour vous proposer les meilleures options :\n\n- Quelle destination ?\n- Vous partez quand ?\n- Seul, en couple, ou en groupe ?`;
  }

  if (/hello|hi|hey/.test(lower)) {
    return `Hello! I'm Baymora, your premium travel assistant.\n\nWhere would you like to go? Or shall I surprise you with some curated ideas?`;
  }
  return `Happy to help plan your trip.\n\n- What destination do you have in mind?\n- When are you thinking of traveling?\n- Solo, couple, or group?`;
}
