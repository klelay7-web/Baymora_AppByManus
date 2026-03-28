/**
 * INTENT ENGINE
 * Classifie les demandes utilisateur et extrait les entités clés
 * 
 * Étapes:
 * 1. Intent classification (discovery, plan_modification, concierge, etc.)
 * 2. Entity extraction (destination, dates, party composition, budget)
 * 3. Confidence scoring
 * 4. Context determination
 */

export type IntentType =
  | 'destination_discovery'
  | 'plan_modification'
  | 'preference_sharing'
  | 'concierge_request'
  | 'general_question'
  | 'greeting'
  | 'farewell';

export interface ExtractedEntity {
  type: string;
  value: string | number | boolean | string[];
  confidence: number;
  source?: string; // Where it was extracted from
}

export interface ClassifiedIntent {
  intent: IntentType;
  confidence: number;
  entities: Record<string, ExtractedEntity>;
  language: 'en' | 'fr';
  rawMessage: string;
  timestamp: Date;
}

/**
 * Classifier l'intent du message utilisateur
 */
export function classifyIntent(
  message: string,
  language: 'en' | 'fr' = 'fr'
): ClassifiedIntent {
  const lower = message.toLowerCase().trim();
  const words = lower.split(/\s+/);

  // Déterminer l'intent basé sur les mots-clés
  let intent: IntentType = 'general_question';
  let confidence = 0.5;
  const entities: Record<string, ExtractedEntity> = {};

  if (language === 'fr') {
    // Greetings
    if (/bonjour|salut|hey|allô|coucou/.test(lower)) {
      intent = 'greeting';
      confidence = 0.95;
    }
    // Farewell
    else if (
      /au revoir|à bientôt|bye|adieu|goodbye|merci beaucoup|fin/.test(lower)
    ) {
      intent = 'farewell';
      confidence = 0.9;
    }
    // Destination discovery
    else if (
      /où|destination|aller|voyage|trip|partir|quitter|vacances|séjour|week-end/.test(
        lower
      )
    ) {
      intent = 'destination_discovery';
      confidence = 0.85;

      // Extract potential destinations
      const destinations = extractDestinations(message, language);
      if (destinations.length > 0) {
        entities['destination'] = {
          type: 'location',
          value: destinations,
          confidence: 0.7,
          source: 'keyword_extraction',
        };
      }
    }
    // Preference sharing
    else if (
      /j'aime|préfère|style|budget|personnes|enfants|animal|pet|famille|groupe/.test(
        lower
      )
    ) {
      intent = 'preference_sharing';
      confidence = 0.8;

      // Extract preferences
      const preferences = extractPreferences(message, language);
      Object.assign(entities, preferences);
    }
    // Plan modification
    else if (/modifier|changer|remplacer|ajouter|enlever|comment/.test(lower)) {
      intent = 'plan_modification';
      confidence = 0.75;
    }
    // Concierge request
    else if (
      /conciergerie|réserver|booking|faire la réservation|s'en charger|aider moi|aide/.test(
        lower
      )
    ) {
      intent = 'concierge_request';
      confidence = 0.8;
    }
  } else {
    // English patterns
    if (/hello|hi|hey|greetings|welcome/.test(lower)) {
      intent = 'greeting';
      confidence = 0.95;
    } else if (/goodbye|bye|farewell|see you|thanks|thank you/.test(lower)) {
      intent = 'farewell';
      confidence = 0.9;
    } else if (
      /where|destination|travel|trip|go|visit|vacation|getaway/.test(lower)
    ) {
      intent = 'destination_discovery';
      confidence = 0.85;

      const destinations = extractDestinations(message, language);
      if (destinations.length > 0) {
        entities['destination'] = {
          type: 'location',
          value: destinations,
          confidence: 0.7,
          source: 'keyword_extraction',
        };
      }
    } else if (
      /like|prefer|style|budget|people|kids|pet|family|group|with/.test(
        lower
      )
    ) {
      intent = 'preference_sharing';
      confidence = 0.8;

      const preferences = extractPreferences(message, language);
      Object.assign(entities, preferences);
    } else if (/change|modify|update|swap|add|remove|how/.test(lower)) {
      intent = 'plan_modification';
      confidence = 0.75;
    } else if (
      /concierge|book|booking|reserve|help|arrange|handle/.test(lower)
    ) {
      intent = 'concierge_request';
      confidence = 0.8;
    }
  }

  return {
    intent,
    confidence,
    entities,
    language,
    rawMessage: message,
    timestamp: new Date(),
  };
}

/**
 * Extraire les destinations potentielles du message
 */
function extractDestinations(message: string, language: 'en' | 'fr'): string[] {
  const destinations: string[] = [];

  // Liste de destinations populaires (extensible)
  const popularDestinations = [
    'paris',
    'lyon',
    'nice',
    'côte d\'azur',
    'marseille',
    'bali',
    'new york',
    'los angeles',
    'miami',
    'cancun',
    'mexico',
    'tokyo',
    'bangkok',
    'dubai',
    'maldives',
    'st tropez',
    'versailles',
    'provence',
    'iceland',
    'iceland',
    'greece',
    'greece',
    'santorini',
    'santorini',
    'capri',
    'positano',
    'la',
    'ny',
    'london',
    'rome',
    'florence',
    'venice',
  ];

  const lower = message.toLowerCase();
  for (const dest of popularDestinations) {
    if (lower.includes(dest)) {
      destinations.push(dest);
    }
  }

  return [...new Set(destinations)]; // Remove duplicates
}

/**
 * Extraire les préférences du message
 */
function extractPreferences(
  message: string,
  language: 'en' | 'fr'
): Record<string, ExtractedEntity> {
  const preferences: Record<string, ExtractedEntity> = {};
  const lower = message.toLowerCase();

  // Budget extraction
  if (language === 'fr') {
    const budgetMatch = lower.match(
      /(\d+)\s*(€|euros?|k|mille|budget|spending)/
    );
    if (budgetMatch) {
      let amount = parseInt(budgetMatch[1]);
      if (budgetMatch[2]?.includes('k')) amount *= 1000;
      preferences['budget'] = {
        type: 'number',
        value: amount,
        confidence: 0.7,
        source: 'regex_extraction',
      };
    }

    // Family composition
    if (/enfants?|kids?|bébé|baby/.test(lower)) {
      const countMatch = lower.match(/(\d+)\s*enfants?/);
      const count = countMatch ? parseInt(countMatch[1]) : 2;
      preferences['children'] = {
        type: 'number',
        value: count,
        confidence: 0.6,
        source: 'keyword_extraction',
      };
    }

    if (/animal|pet|chien|dog|chat|cat/.test(lower)) {
      preferences['has_pets'] = {
        type: 'boolean',
        value: true,
        confidence: 0.8,
        source: 'keyword_extraction',
      };
    }

    // Travel style
    if (/aventure|adrenaline|active|sport/.test(lower)) {
      preferences['style'] = {
        type: 'string',
        value: 'adventurous',
        confidence: 0.7,
        source: 'keyword_extraction',
      };
    } else if (/relaxant|repos|plage|quiet|peaceful/.test(lower)) {
      preferences['style'] = {
        type: 'string',
        value: 'relaxed',
        confidence: 0.7,
        source: 'keyword_extraction',
      };
    } else if (/culture|histoire|musée|museum|art/.test(lower)) {
      preferences['style'] = {
        type: 'string',
        value: 'cultural',
        confidence: 0.7,
        source: 'keyword_extraction',
      };
    }
  } else {
    // English preferences extraction
    const budgetMatch = lower.match(
      /(\d+)\s*(\$|dollars?|k|thousand|budget|spending)/
    );
    if (budgetMatch) {
      let amount = parseInt(budgetMatch[1]);
      if (budgetMatch[2]?.includes('k')) amount *= 1000;
      preferences['budget'] = {
        type: 'number',
        value: amount,
        confidence: 0.7,
        source: 'regex_extraction',
      };
    }

    if (/kids?|children|baby|toddler/.test(lower)) {
      const countMatch = lower.match(/(\d+)\s*kids?|children/);
      const count = countMatch ? parseInt(countMatch[1]) : 2;
      preferences['children'] = {
        type: 'number',
        value: count,
        confidence: 0.6,
        source: 'keyword_extraction',
      };
    }

    if (/pet|dog|cat|puppy|kitten/.test(lower)) {
      preferences['has_pets'] = {
        type: 'boolean',
        value: true,
        confidence: 0.8,
        source: 'keyword_extraction',
      };
    }

    if (/adventure|adrenaline|active|sports?|hiking/.test(lower)) {
      preferences['style'] = {
        type: 'string',
        value: 'adventurous',
        confidence: 0.7,
        source: 'keyword_extraction',
      };
    } else if (/relax|beach|lazy|peaceful|calm/.test(lower)) {
      preferences['style'] = {
        type: 'string',
        value: 'relaxed',
        confidence: 0.7,
        source: 'keyword_extraction',
      };
    } else if (/culture|history|museum|art|architecture/.test(lower)) {
      preferences['style'] = {
        type: 'string',
        value: 'cultural',
        confidence: 0.7,
        source: 'keyword_extraction',
      };
    }
  }

  return preferences;
}

/**
 * Analyser la conversation pour extraire le contexte
 */
export function extractContextFromConversation(
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>
): Partial<Record<string, ExtractedEntity>> {
  const context: Partial<Record<string, ExtractedEntity>> = {};

  // Combiner tous les messages utilisateur pour extraire le contexte global
  const userMessages = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' ');

  if (userMessages.length > 0) {
    const language = userMessages.includes('ç') ? 'fr' : 'en';

    // Extraire les intentions du contexte entier
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((m) => m.role === 'user')?.content || '';
    const classified = classifyIntent(lastUserMessage, language);

    // Combiner les entités
    Object.assign(context, classified.entities);
  }

  return context;
}
