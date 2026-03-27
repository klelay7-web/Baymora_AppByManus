/**
 * MEMORY ENGINE
 * Stocke et apprend les préférences des clients
 * Gère la mémoire court terme (conversation) et long terme (profil)
 */

export interface ClientMemory {
  userId: string;
  preferences: PreferenceSet;
  conversationHistory: ConversationMemory[];
  lastUpdated: Date;
  confidenceScores: Record<string, number>;
}

export interface PreferenceSet {
  travelStyle?: 'adventurous' | 'relaxed' | 'cultural' | 'luxury' | 'budget';
  budget?: {
    min?: number;
    max?: number;
    currency?: 'EUR' | 'USD' | 'GBP';
  };
  favoriteDestinations?: string[];
  cuisine?: string[];
  activities?: string[];
  pace?: 'slow' | 'moderate' | 'fast';
  petFriendly?: boolean;
  accessibility?: string[];
  languages?: string[];
  travelsWithChildren?: boolean;
  childrenAges?: number[];
  travelCompanions?: string[]; // 'spouse', 'friends', 'family', 'solo'
}

export interface ConversationMemory {
  conversationId: string;
  timestamp: Date;
  extractedPreferences: Partial<PreferenceSet>;
  confidence: Record<string, number>;
  journey?: {
    destination?: string;
    startDate?: Date;
    endDate?: Date;
    budget?: number;
  };
}

// Store en mémoire (remplacer par PostgreSQL + Prisma en Phase 2.5)
const clientMemories = new Map<string, ClientMemory>();

/**
 * Initialiser ou récupérer la mémoire d'un client
 */
export function initializeClientMemory(userId: string): ClientMemory {
  if (clientMemories.has(userId)) {
    return clientMemories.get(userId)!;
  }

  const memory: ClientMemory = {
    userId,
    preferences: {},
    conversationHistory: [],
    lastUpdated: new Date(),
    confidenceScores: {},
  };

  clientMemories.set(userId, memory);
  return memory;
}

/**
 * Mettre à jour les préférences apprises
 */
export function updateClientPreferences(
  userId: string,
  newPreferences: Partial<PreferenceSet>,
  confidenceScores: Record<string, number>
): void {
  const memory = initializeClientMemory(userId);

  // Fusionner les nouvelles préférences
  Object.entries(newPreferences).forEach(([key, value]) => {
    const currentConfidence = memory.confidenceScores[key] || 0;
    const newConfidence = confidenceScores[key] || 0.5;

    // Si la nouvelle confiance est meilleure, remplacer
    if (newConfidence > currentConfidence) {
      (memory.preferences as any)[key] = value;
      memory.confidenceScores[key] = newConfidence;
    }
  });

  memory.lastUpdated = new Date();
  console.log(
    `[MEMORY] Préférences mises à jour pour ${userId} :`,
    memory.preferences
  );
}

/**
 * Enregistrer une conversation et extraire les apprentissages
 */
export function recordConversation(
  userId: string,
  conversationId: string,
  extractedPreferences: Partial<PreferenceSet>,
  confidenceScores: Record<string, number>,
  journey?: ConversationMemory['journey']
): void {
  const memory = initializeClientMemory(userId);

  const memoryRecord: ConversationMemory = {
    conversationId,
    timestamp: new Date(),
    extractedPreferences,
    confidence: confidenceScores,
    journey,
  };

  memory.conversationHistory.push(memoryRecord);

  // Mettre à jour les préférences globales
  updateClientPreferences(userId, extractedPreferences, confidenceScores);

  console.log(
    `[MEMORY] Conversation enregistrée: ${conversationId} pour ${userId}`
  );
}

/**
 * Récupérer la mémoire d'un client
 */
export function getClientMemory(userId: string): ClientMemory | null {
  return clientMemories.get(userId) || null;
}

/**
 * Générer un résumé des préférences connues
 */
export function generateMemorySummary(userId: string): string {
  const memory = getClientMemory(userId);

  if (!memory || Object.keys(memory.preferences).length === 0) {
    return 'Je ne connais pas encore vos préférences. Parlez-moi de vous !';
  }

  const parts: string[] = [];

  if (memory.preferences.travelStyle) {
    parts.push(`Style : ${memory.preferences.travelStyle}`);
  }

  if (memory.preferences.budget) {
    const { min, max, currency } = memory.preferences.budget;
    if (min || max) {
      parts.push(`Budget : ${min || '?'}-${max || '?'} ${currency || 'EUR'}`);
    }
  }

  if (memory.preferences.petFriendly) {
    parts.push('Animal de compagnie : Oui');
  }

  if (memory.preferences.favoriteDestinations?.length) {
    parts.push(
      `Destinations préférées : ${memory.preferences.favoriteDestinations.join(', ')}`
    );
  }

  if (memory.preferences.activities?.length) {
    parts.push(`Activités : ${memory.preferences.activities.join(', ')}`);
  }

  if (memory.preferences.travelsWithChildren) {
    parts.push('Voyage en famille');
  }

  return parts.length > 0
    ? parts.join(' | ')
    : 'Profil en construction...';
}

/**
 * Recommander un type de voyage basé sur les préférences
 */
export function suggestJourneyType(userId: string): string {
  const memory = getClientMemory(userId);

  if (!memory || Object.keys(memory.preferences).length === 0) {
    return 'Débutez par me décrire votre rêve de voyage. Où, quand, avec qui ?';
  }

  const preferences = memory.preferences;
  const suggestions: string[] = [];

  if (preferences.travelStyle === 'adventurous') {
    suggestions.push('Voyage d\'aventure avec activités outdoor');
  } else if (preferences.travelStyle === 'relaxed') {
    suggestions.push('Séjour reposant en bord de mer ou spa');
  } else if (preferences.travelStyle === 'cultural') {
    suggestions.push('Immersion culturelle et visites historiques');
  } else if (preferences.travelStyle === 'luxury') {
    suggestions.push('Expérience premium avec services concierge');
  }

  if (preferences.petFriendly) {
    suggestions.push('avec votre animal de compagnie');
  }

  if (preferences.travelsWithChildren) {
    suggestions.push('adapté aux enfants');
  }

  return suggestions.length > 0
    ? `Basé sur vos préférences, je peux créer : ${suggestions.join(', ')}`
    : 'Je peux créer un voyage sur mesure basé sur vos goûts.';
}

/**
 * Nettoyer les anciennes conversations (garder seulement 10 dernières)
 */
export function cleanupOldConversations(userId: string): void {
  const memory = getClientMemory(userId);
  if (!memory) return;

  if (memory.conversationHistory.length > 10) {
    memory.conversationHistory = memory.conversationHistory.slice(-10);
    console.log(
      `[MEMORY] Historique nettoyé pour ${userId}, gardé 10 dernières conversations`
    );
  }
}

/**
 * Réinitialiser la mémoire d'un client (pour GDPR/demande de l'utilisateur)
 */
export function deleteClientMemory(userId: string): boolean {
  const deleted = clientMemories.delete(userId);
  if (deleted) {
    console.log(`[MEMORY] Mémoire supprimée pour ${userId}`);
  }
  return deleted;
}

/**
 * Exporter toutes les préférences (pour PDF/téléchargement)
 */
export function exportClientProfile(userId: string): string {
  const memory = getClientMemory(userId);

  if (!memory) {
    return 'Aucun profil trouvé.';
  }

  const profile = memory.preferences;
  let markdown = `# Mon Profil Baymora\n\n`;

  if (profile.travelStyle) {
    markdown += `**Style de voyage** : ${profile.travelStyle}\n\n`;
  }

  if (profile.budget) {
    markdown += `**Budget** : ${profile.budget.min || '?'} - ${profile.budget.max || '?'} ${profile.budget.currency || 'EUR'}\n\n`;
  }

  if (profile.favoriteDestinations?.length) {
    markdown += `**Destinations préférées** :\n`;
    profile.favoriteDestinations.forEach((dest) => {
      markdown += `- ${dest}\n`;
    });
    markdown += `\n`;
  }

  if (profile.activities?.length) {
    markdown += `**Activités** :\n`;
    profile.activities.forEach((act) => {
      markdown += `- ${act}\n`;
    });
    markdown += `\n`;
  }

  if (profile.cuisine?.length) {
    markdown += `**Cuisines appréciées** : ${profile.cuisine.join(', ')}\n\n`;
  }

  if (profile.petFriendly) {
    markdown += `**Animal de compagnie** : Oui\n\n`;
  }

  if (profile.travelsWithChildren) {
    markdown += `**Voyage en famille** : Oui`;
    if (profile.childrenAges?.length) {
      markdown += ` (âges : ${profile.childrenAges.join(', ')})`;
    }
    markdown += `\n\n`;
  }

  markdown += `*Mis à jour : ${memory.lastUpdated.toLocaleDateString('fr-FR')}*`;

  return markdown;
}
