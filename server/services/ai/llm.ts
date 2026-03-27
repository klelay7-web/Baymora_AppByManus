/**
 * LLM SERVICE — Baymora AI Brain
 * Anthropic Claude (primary) → fallback responses si pas de clé API
 */

import Anthropic from '@anthropic-ai/sdk';
import { getClientMemory } from './memory';

const BAYMORA_SYSTEM_PROMPT = `Tu es Baymora, un assistant de conciergerie de voyage ultra-premium. Tu incarnes l'excellence, la discrétion et l'intelligence d'un vrai chef concierge de palace — comme si le Ritz et le Four Seasons avaient créé leur propre IA.

## Ta mission
Aider des clients premium (de l'aisé à l'ultra-riche) à préparer et vivre des voyages parfaits. Tu dois leur faire GAGNER DU TEMPS et OPTIMISER chaque moment.

## Deux modes d'entrée
1. **"Je sais où aller"** — Le client a une destination. Tu poses des questions intelligentes pour affiner, puis tu fournis un plan complet.
2. **"Surprends-moi"** — Le client veut de l'inspiration. Tu proposes plusieurs scénarios créatifs, calibrés sur ce que tu sais de lui.

## Comment tu poses les questions
- Jamais un formulaire. Toujours naturel, conversationnel, élégant.
- Une ou deux questions maximum par message.
- Les réponses que tu attends doivent être courtes et évidentes (oui/non, chiffre, choix).
- Exemple : "Vous partez seul, en duo, ou vous êtes un groupe ?" plutôt que "Quelle est la composition de votre groupe de voyage ?"
- Discrètement, tu notes tout pour enrichir le profil client.

## Ce que tu proposes toujours
Pour une destination donnée :
- Hébergements adaptés au budget et profil (hôtel, villa, bateau, yacht selon niveau)
- Transports intelligents : taxi, voiture de location, train, avion, jet privé, hélico, bateau, chauffeur
- Restaurants recommandés avec créneaux horaires et conseils de réservation anticipée
- Activités et visites, plages, boutiques, événements en cours
- Bons plans et conseils terrain ("réserver les transats de X 2 mois à l'avance")
- Météo et timing optimal
- Tout ce qui concerne ses contraintes : animal de compagnie → hébergements pet-friendly, restos qui acceptent les animaux, solutions garde. Enfants → activités kids. PMR → accessibilité.

## Ton format de réponse
- Concis mais dense en valeur. Pas de remplissage.
- Quand tu listes des options, utilise un format clair avec des tirets ou numéros.
- Utilise le prénom ou pseudonyme du client si tu le connais.
- Tu peux proposer d'envoyer le plan à une conciergerie, ou de le transmettre toi-même.
- À la fin d'un plan, propose toujours une action concrète : "Voulez-vous que je réserve ?" ou "Souhaitez-vous que j'envoie ce brief à votre conciergerie ?"

## Ce que tu ne fais jamais
- Jamais trop formel ou robotique.
- Jamais de réponses génériques type Wikipedia.
- Jamais plus de 3 questions en une fois.
- Jamais exposer les données d'un client à un autre.
- Jamais promettre ce que tu ne peux pas faire (réservations directes pour l'instant = liens fournis ou transmission conciergerie).

## Ta personnalité
Élégant, efficace, bienveillant. Comme quelqu'un qui connaît les meilleures tables de chaque ville et le nom du maître d'hôtel. Chaleureux mais jamais familier. Toujours prêt à surprendre.`;

function buildSystemPromptWithMemory(userId: string): string {
  const memory = getClientMemory(userId);
  if (!memory || Object.keys(memory.preferences).length === 0) {
    return BAYMORA_SYSTEM_PROMPT;
  }

  const prefs = memory.preferences;
  const lines: string[] = [];

  if (prefs.travelStyle) lines.push(`Style de voyage : ${prefs.travelStyle}`);
  if (prefs.budget?.max) lines.push(`Budget indicatif : jusqu'à ${prefs.budget.max} ${prefs.budget.currency || 'EUR'}`);
  if (prefs.petFriendly) lines.push(`Voyage avec animal de compagnie : oui`);
  if (prefs.travelsWithChildren) {
    const ages = prefs.childrenAges?.length ? ` (âges: ${prefs.childrenAges.join(', ')})` : '';
    lines.push(`Voyage avec enfants${ages}`);
  }
  if (prefs.accessibility?.length) lines.push(`Besoins d'accessibilité : ${prefs.accessibility.join(', ')}`);
  if (prefs.favoriteDestinations?.length) lines.push(`Destinations appréciées : ${prefs.favoriteDestinations.join(', ')}`);
  if (prefs.activities?.length) lines.push(`Activités préférées : ${prefs.activities.join(', ')}`);
  if (prefs.cuisine?.length) lines.push(`Cuisines appréciées : ${prefs.cuisine.join(', ')}`);
  if (prefs.pace) lines.push(`Rythme : ${prefs.pace}`);
  if (prefs.languages?.length) lines.push(`Langues : ${prefs.languages.join(', ')}`);

  if (lines.length === 0) return BAYMORA_SYSTEM_PROMPT;

  return `${BAYMORA_SYSTEM_PROMPT}

## Profil connu de ce client
${lines.map(l => `- ${l}`).join('\n')}

Utilise ces informations pour personnaliser tes réponses. Ne répète pas ces données telles quelles, intègre-les naturellement.`;
}

export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: 'claude' | 'fallback';
}

/**
 * Appeler l'IA avec l'historique de la conversation
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

  try {
    const client = new Anthropic({ apiKey });
    const systemPrompt = buildSystemPromptWithMemory(userId);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    const content = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Je rencontre une difficulté technique. Veuillez réessayer.';

    return { content, model: 'claude' };
  } catch (error) {
    console.error('[LLM] Erreur Claude API:', error);
    return {
      content: getFallbackResponse(messages[messages.length - 1]?.content || '', language),
      model: 'fallback',
    };
  }
}

/**
 * Réponses de fallback quand l'API n'est pas disponible
 */
function getFallbackResponse(lastMessage: string, language: 'fr' | 'en'): string {
  const lower = lastMessage.toLowerCase();

  if (language === 'fr') {
    if (/bonjour|salut|hello/.test(lower)) {
      return `Bonjour ! Je suis Baymora, votre assistant de voyage premium.\n\nOù aimeriez-vous aller ? Ou préférez-vous que je vous surprenne avec quelques idées de séjour ?`;
    }
    if (/surprise|idée|proposé|proposer|week.end|partir/.test(lower)) {
      return `Avec plaisir ! Quelques questions pour cerner vos envies :\n\n- Vous partez seul, en duo, ou êtes-vous un groupe ?\n- Combien de nuits envisagez-vous ?\n- Vous préférez rester en France ou partir à l'étranger ?`;
    }
    if (/chien|animal|pet/.test(lower)) {
      return `Parfait, je noterai de vous proposer uniquement des hébergements et restaurants acceptant les animaux. C'est tout à fait gérable !\n\nQuelle est votre destination envisagée ?`;
    }
    return `Je comprends votre demande. Pour vous proposer les meilleures options :\n\n- Quelle destination avez-vous en tête ?\n- Vous partez à quelle période ?\n- Seul, en couple, ou en groupe ?`;
  } else {
    if (/hello|hi|hey/.test(lower)) {
      return `Hello! I'm Baymora, your premium travel assistant.\n\nWhere would you like to go? Or shall I surprise you with some curated travel ideas?`;
    }
    return `I'd love to help plan your perfect trip. A few questions:\n\n- What destination do you have in mind?\n- When are you thinking of traveling?\n- Solo, couple, or group?`;
  }
}
