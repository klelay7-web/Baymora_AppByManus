/**
 * PERPLEXITY — Agent de recherche temps réel
 *
 * Baymora utilise Perplexity sonar-pro comme "cerveau de recherche" :
 * - Prix et disponibilités hôtels / vols / restaurants
 * - Analyse de quartier (commerces, transport, ambiance, prix au m²)
 * - Événements en cours dans une ville
 * - Avis récents sur des établissements
 * - Actualités d'une destination (sécurité, météo, événements)
 *
 * Claude reçoit les résultats et les synthétise avec le contexte client.
 */

export interface PerplexityResult {
  content: string;
  citations: string[];
  model: string;
}

export interface SearchQuery {
  query: string;
  focus?: 'travel' | 'real_estate' | 'restaurants' | 'events' | 'prices' | 'general';
}

// ─── Triggers — quand appeler Perplexity ─────────────────────────────────────

const SEARCH_TRIGGERS = [
  // Prix et disponibilités
  /prix|tarif|combien|cost|coût|budget|€|\$/i,
  /disponible|disponibilité|libre|ouvert|réservation/i,
  /hôtel|hotel|villa|appartement|airbnb|location/i,
  // Lifestyle urbain — expériences locales
  /petit.?dej|brunch|breakfast|déjeuner|dîner|lunch|dinner/i,
  /où manger|où boire|où sortir|where to eat|things to do/i,
  /bar|café|restaurant|club|lounge|rooftop|terrasse/i,
  /ce soir|tonight|ce week-end|this weekend|demain soir/i,
  /que faire|quoi faire|what to do|sortir|expérience/i,
  /spa|massage|yoga|bien-être|wellness/i,
  /shopping|boutique|marché|market/i,
  // Quartier / immobilier
  /quartier|arrondissement|voisinage|neighborhood|secteur/i,
  /loyer|achat|immobilier|m²|mètre carré/i,
  // Transport et accès
  /métro|bus|tram|transport|parking|aéroport|airport/i,
  // Actualité destination
  /événement|festival|concert|expo|salon|spectacle/i,
  /météo|climate|température|saison/i,
  /sécurité|danger|conseils|visa|entrée/i,
  // Temps réel
  /actuellement|en ce moment|cette année|2025|2026|récemment/i,
  /meilleur|top|recommandé|étoile|michelin|trending/i,
  // Comparatif
  /comparaison|différence|versus|ou bien|lequel/i,
  // Activités et culture
  /musée|galerie|exposition|théâtre|opéra|musique|live/i,
  /plage|beach|piscine|pool|montagne|randonnée/i,
  // Conditions marines et baignade
  /mer|ocean|baignade|nager|eau|vagues|surf|plongée/i,
  /qualité de l'eau|jellyfish|méduse|drapeau|pavillon bleu/i,
  /température de l'eau|conditions mer|surf report/i,
];

export function shouldCallPerplexity(lastMessage: string): boolean {
  if (!process.env.PERPLEXITY_API_KEY) return false;
  return SEARCH_TRIGGERS.some(t => t.test(lastMessage));
}

// ─── Formulation de la requête de recherche ──────────────────────────────────

export function buildSearchQuery(userMessage: string, context?: {
  destination?: string;
  focus?: SearchQuery['focus'];
}): string {
  const base = userMessage.trim();
  const extras: string[] = ['(résultats en français)'];

  if (context?.destination) {
    extras.push(`pour ${context.destination}`);
  }

  // Ajouter l'année en cours pour les données récentes
  const year = new Date().getFullYear();
  extras.push(`${year}`);

  return `${base} ${extras.join(' ')}`;
}

// ─── Appel API Perplexity ────────────────────────────────────────────────────

export async function searchPerplexity(query: string): Promise<PerplexityResult | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return null;

  try {
    console.log(`[PERPLEXITY] Recherche: ${query.substring(0, 80)}...`);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant de recherche spécialisé voyage et immobilier. Réponds en français. Sois factuel, concis et précis. Inclus des chiffres et données concrètes quand disponibles. Pas de phrases génériques.`,
          },
          {
            role: 'user',
            content: query,
          },
        ],
        max_tokens: 800,
        temperature: 0.1,
        search_recency_filter: 'month',
        return_citations: true,
      }),
    });

    if (!response.ok) {
      console.error(`[PERPLEXITY] Erreur HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const citations = (data.citations || []).slice(0, 3); // Max 3 sources

    console.log(`[PERPLEXITY] Réponse reçue (${content.length} chars, ${citations.length} sources)`);

    return { content, citations, model: data.model || 'sonar-pro' };
  } catch (error) {
    console.error('[PERPLEXITY] Erreur:', error);
    return null;
  }
}

// ─── Injection dans le contexte Claude ───────────────────────────────────────

export function formatPerplexityContext(result: PerplexityResult): string {
  let ctx = `## Données temps réel (recherche web)\n${result.content}`;
  if (result.citations.length > 0) {
    ctx += `\n\nSources: ${result.citations.join(', ')}`;
  }
  return ctx;
}
