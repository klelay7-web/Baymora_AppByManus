/**
 * ORCHESTRATEUR — Cerveau du pipeline multi-agents Baymora
 *
 * Reçoit une requête client, décide quels agents appeler,
 * lance les agents en parallèle, fusionne les résultats,
 * et fournit un briefing structuré à l'IA Façade.
 *
 * 3 scénarios de composition :
 * - FLASH  : Atlas seul (cache local) → Sonnet → 3-5s
 * - EXPLORE : Scout + Atlas + Profil (parallèle) → Opus → 8-12s
 * - EXCELLENCE : Tous agents + QC → Opus max → 12-20s
 */

import { prisma } from '../../db';
import crypto from 'crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AgentScenario = 'flash' | 'explore' | 'excellence';

export interface AgentBriefing {
  scenario: AgentScenario;
  atlasVenues: any[];
  cityGuide: any | null;
  curatedRoutes: any[];
  scoutResults: any | null;
  offMarketItems: any[];
  boutiqueItems: any[];
  profileAnalysis: any | null;
  timestamp: string;
  detectedCity: string | null;
  cacheHit: boolean;
}

interface OrchestrationContext {
  messages: Array<{ role: string; content: string }>;
  userId: string;
  userRecord: any;
  lastMessage: string;
}

// ─── Scénario Router ─────────────────────────────────────────────────────────

/**
 * Détermine le scénario d'agents basé sur la requête et le profil client.
 */
export function routeScenario(lastMessage: string, msgCount: number, userCircle: string): AgentScenario {
  const isVIP = ['prive', 'fondateur'].includes(userCircle);
  const msgLen = lastMessage.length;

  // EXCELLENCE : client VIP + demande complexe
  if (isVIP && (msgLen > 150 || /organise|planifie|programme|séjour.*complet|tout.*prévoir|multi.*destination/i.test(lastMessage))) {
    return 'excellence';
  }

  // EXPLORE : demande de recherche, planification, inspiration
  if (/hôtel|restaurant|vol|séjour|week.?end|vacances|partir|destination|surpren|inspir|cherche|compare|planifi|organis/i.test(lastMessage)) {
    return 'explore';
  }

  // EXPLORE : premier message substantiel
  if (msgCount <= 1 && msgLen > 50) {
    return 'explore';
  }

  // FLASH : réponses courtes, suivi, oui/non
  return 'flash';
}

// ─── Cache des résultats agents ──────────────────────────────────────────────

function hashQuery(query: string, agentType: string): string {
  return crypto.createHash('sha256').update(`${agentType}:${query.toLowerCase().trim()}`).digest('hex').substring(0, 32);
}

async function getCachedResult(agentType: string, query: string): Promise<any | null> {
  const hash = hashQuery(query, agentType);
  try {
    const cached = await prisma.agentResult.findFirst({
      where: {
        queryHash: hash,
        agentType,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    return cached?.results || null;
  } catch {
    return null;
  }
}

async function cacheResult(agentType: string, query: string, results: any, ttlMinutes: number = 30): Promise<void> {
  const hash = hashQuery(query, agentType);
  try {
    await prisma.agentResult.create({
      data: {
        agentType,
        query: query.substring(0, 500),
        queryHash: hash,
        results,
        source: agentType === 'scout' ? 'perplexity' : 'internal',
        expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
      },
    });
  } catch (e) {
    console.error(`[ORCHESTRATOR] Cache write error (${agentType}):`, e);
  }
}

// ─── Agent: Atlas (local DB) ─────────────────────────────────────────────────

async function agentAtlas(city: string): Promise<{ venues: any[]; cityGuide: any; routes: any[] }> {
  try {
    const [venues, cityGuide, routes] = await Promise.all([
      prisma.atlasVenue.findMany({
        where: { city: { contains: city, mode: 'insensitive' }, status: 'published' },
        orderBy: [{ testedByBaymora: 'desc' }, { rating: 'desc' }],
        take: 10,
      }),
      prisma.atlasCityGuide.findFirst({
        where: { city: { contains: city, mode: 'insensitive' }, status: 'published' },
      }),
      prisma.atlasCuratedRoute.findMany({
        where: { city: { contains: city, mode: 'insensitive' }, status: 'published' },
        take: 5,
      }),
    ]);
    return { venues, cityGuide, routes };
  } catch {
    return { venues: [], cityGuide: null, routes: [] };
  }
}

// ─── Agent: Scout (Perplexity / Manus) ───────────────────────────────────────

async function agentScout(query: string, city: string): Promise<any> {
  // Vérifier le cache d'abord
  const cached = await getCachedResult('scout', `${city}:${query}`);
  if (cached) {
    console.log(`[SCOUT] Cache hit pour ${city}`);
    return cached;
  }

  // Appeler Perplexity (ou Manus quand configuré)
  const manusKey = process.env.MANUS_API_KEY;
  const perplexityKey = process.env.PERPLEXITY_API_KEY;

  let results: any = null;

  if (manusKey) {
    // Manus API
    results = await callManus(query, city, manusKey);
  } else if (perplexityKey) {
    // Fallback Perplexity
    results = await callPerplexityForScout(query, city, perplexityKey);
  }

  if (results) {
    await cacheResult('scout', `${city}:${query}`, results, 30); // 30min cache
    console.log(`[SCOUT] Résultats trouvés pour ${city} → cache 30min`);
  }

  return results;
}

async function callManus(query: string, city: string, apiKey: string): Promise<any> {
  try {
    const res = await fetch('https://api.manus.im/v2/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Research the best options for: "${query}" in ${city}. Return structured JSON with hotels, restaurants, activities including: name, address, price range, rating, booking URL, photos, brief description. Focus on quality and accuracy.`,
        agentProfile: 'manus-1.6-lite',
        mode: 'agent',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      // Manus renvoie un task_id — on devrait poller pour le résultat
      // Pour l'instant on log le task ID
      console.log(`[SCOUT/MANUS] Task créé: ${data.task_id || data.id}`);
      return data;
    }
  } catch (e) {
    console.error('[SCOUT/MANUS] Error:', e);
  }
  return null;
}

async function callPerplexityForScout(query: string, city: string, apiKey: string): Promise<any> {
  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{
          role: 'user',
          content: `Recherche les meilleurs ${query} à ${city}. Donne les noms, adresses, prix, notes, et liens de réservation si disponibles. Format structuré.`,
        }],
        max_tokens: 800,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      return { source: 'perplexity', city, query, content, citations: data.citations };
    }
  } catch (e) {
    console.error('[SCOUT/PERPLEXITY] Error:', e);
  }
  return null;
}

// ─── Agent: Off-Market ───────────────────────────────────────────────────────

async function agentOffMarket(city: string, userCircle: string): Promise<any[]> {
  if (!['prive', 'fondateur'].includes(userCircle)) return [];
  try {
    return await prisma.offMarketItem.findMany({
      where: { status: 'published', city: city ? { contains: city, mode: 'insensitive' } : undefined },
      take: 5,
    });
  } catch {
    return [];
  }
}

// ─── Agent: Boutique ─────────────────────────────────────────────────────────

async function agentBoutique(lastMessage: string): Promise<any[]> {
  if (!/cadeau|offrir|anniversaire|anniv|fleurs|cigare|whisky|montre|parfum|bijou|surprise/i.test(lastMessage)) {
    return [];
  }
  try {
    return await prisma.boutiqueItem.findMany({
      where: { status: 'published' },
      orderBy: [{ featured: 'desc' }, { priceEur: 'asc' }],
      take: 6,
    });
  } catch {
    return [];
  }
}

// ─── Détection ville ─────────────────────────────────────────────────────────

function detectCity(messages: Array<{ role: string; content: string }>, userPrefs?: any): string | null {
  const allText = messages.filter(m => m.role === 'user').map(m => m.content).join(' ');
  const match = allText.match(/(?:à|en|pour|vers|de)\s+([A-ZÀ-Ÿ][a-zà-ÿA-ZÀ-Ÿ\s-]{2,25})/);
  return match?.[1]?.trim() || userPrefs?.mentionedDestinations?.[0] || null;
}

// ─── Orchestration principale ────────────────────────────────────────────────

/**
 * Point d'entrée principal.
 * Appelé par llm.ts AVANT l'appel Claude.
 * Retourne un briefing structuré que l'IA Façade consomme directement.
 */
export async function orchestrate(ctx: OrchestrationContext): Promise<AgentBriefing> {
  const { messages, userId, userRecord, lastMessage } = ctx;
  const userCircle = userRecord?.circle || 'decouverte';
  const msgCount = messages.filter(m => m.role === 'user').length;

  // Décider le scénario
  const scenario = routeScenario(lastMessage, msgCount, userCircle);
  console.log(`[ORCHESTRATOR] Scénario: ${scenario} | user: ${userId} | circle: ${userCircle}`);

  // Détecter la ville
  const detectedCity = detectCity(messages, userRecord?.preferences);

  // Préparer le briefing
  const briefing: AgentBriefing = {
    scenario,
    atlasVenues: [],
    cityGuide: null,
    curatedRoutes: [],
    scoutResults: null,
    offMarketItems: [],
    boutiqueItems: [],
    profileAnalysis: null,
    timestamp: new Date().toISOString(),
    detectedCity,
    cacheHit: false,
  };

  if (!detectedCity && scenario === 'flash') {
    // Pas de ville détectée + requête simple → pas besoin d'agents
    return briefing;
  }

  // ── FLASH : Atlas seul ─────────────────────────────────────────────────
  if (scenario === 'flash' && detectedCity) {
    const atlas = await agentAtlas(detectedCity);
    briefing.atlasVenues = atlas.venues;
    briefing.cityGuide = atlas.cityGuide;
    briefing.curatedRoutes = atlas.routes;
    briefing.boutiqueItems = await agentBoutique(lastMessage);
    return briefing;
  }

  // ── EXPLORE / EXCELLENCE : agents en parallèle ─────────────────────────
  const tasks: Promise<void>[] = [];

  // Atlas (toujours)
  if (detectedCity) {
    tasks.push(
      agentAtlas(detectedCity).then(atlas => {
        briefing.atlasVenues = atlas.venues;
        briefing.cityGuide = atlas.cityGuide;
        briefing.curatedRoutes = atlas.routes;
      })
    );
  }

  // Scout (recherche web — explore + excellence)
  if (detectedCity) {
    tasks.push(
      agentScout(lastMessage, detectedCity).then(results => {
        briefing.scoutResults = results;
        if (results?.source === 'cache') briefing.cacheHit = true;
      })
    );
  }

  // Boutique (si cadeau détecté)
  tasks.push(
    agentBoutique(lastMessage).then(items => {
      briefing.boutiqueItems = items;
    })
  );

  // Off-Market (VIP seulement — excellence)
  if (scenario === 'excellence' && detectedCity) {
    tasks.push(
      agentOffMarket(detectedCity, userCircle).then(items => {
        briefing.offMarketItems = items;
      })
    );
  }

  // Exécuter tous les agents en parallèle
  await Promise.allSettled(tasks);

  // Log du briefing
  const agentCount = [
    briefing.atlasVenues.length > 0 ? 'Atlas' : null,
    briefing.scoutResults ? 'Scout' : null,
    briefing.boutiqueItems.length > 0 ? 'Boutique' : null,
    briefing.offMarketItems.length > 0 ? 'OffMarket' : null,
  ].filter(Boolean);

  console.log(`[ORCHESTRATOR] Briefing prêt: ${agentCount.join(' + ')} | city: ${detectedCity || 'N/A'} | ${scenario}`);

  // Loguer la tâche
  try {
    await prisma.agentTask.create({
      data: {
        type: `orchestrate_${scenario}`,
        status: 'completed',
        input: { query: lastMessage.substring(0, 200), city: detectedCity, scenario },
        output: { agentsUsed: agentCount, venueCount: briefing.atlasVenues.length },
        triggeredBy: userId,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });
  } catch {}

  return briefing;
}

// ─── Formater le briefing en contexte pour l'IA Façade ───────────────────────

export function formatBriefingForLLM(briefing: AgentBriefing): string {
  if (!briefing.detectedCity && briefing.atlasVenues.length === 0 && !briefing.scoutResults) {
    return '';
  }

  const lines: string[] = [];

  // City Guide
  if (briefing.cityGuide) {
    const g = briefing.cityGuide;
    lines.push(`## 🏙️ Guide Baymora — ${g.city}`);
    if (g.description) lines.push(g.description);
    if (g.secrets) lines.push(`**Secrets :** ${g.secrets}`);
    if (g.localTips) lines.push(`**Tips :** ${g.localTips}`);
    if (g.vipAccess) lines.push(`**VIP :** ${g.vipAccess}`);
    if (g.transitTips) lines.push(`**Transport :** ${g.transitTips}`);
    if (g.dangerZones) lines.push(`**⚠️ Éviter :** ${g.dangerZones}`);
    lines.push('');
  }

  // Atlas venues
  if (briefing.atlasVenues.length > 0) {
    lines.push(`## 📍 Fiches Baymora (${briefing.atlasVenues.length} vérifiés) — PRIORITÉ`);
    for (const v of briefing.atlasVenues) {
      const badge = v.testedByBaymora ? '✅ Testé' : '📋 Curatée';
      lines.push(`**${badge} ${v.name}** (${v.type}) — ${v.city}`);
      if (v.description) lines.push(`  ${v.description}`);
      if (v.insiderTips) lines.push(`  💡 ${v.insiderTips}`);
      if (v.priceFrom) lines.push(`  À partir de ${v.priceFrom}${v.currency || '€'}`);
      if (v.rating) lines.push(`  ⭐ ${v.rating}/5`);
      if (v.affiliateUrl) lines.push(`  🔗 ${v.affiliateUrl}`);
      lines.push('');
    }
  }

  // Scout results
  if (briefing.scoutResults?.content) {
    lines.push('## 🔍 Recherche web temps réel (Agent Scout)');
    lines.push(briefing.scoutResults.content);
    lines.push('');
  }

  // Curated routes
  if (briefing.curatedRoutes.length > 0) {
    lines.push(`## 🗺️ Parcours Baymora`);
    for (const r of briefing.curatedRoutes) {
      lines.push(`**${r.name}** (${r.theme}) — ${r.duration || ''} · ${'€'.repeat(r.budgetLevel)}`);
      if (r.description) lines.push(`  ${r.description}`);
      lines.push('');
    }
  }

  // Off-Market (VIP)
  if (briefing.offMarketItems.length > 0) {
    lines.push('## 🔒 Off-Market — Pépites secrètes (client VIP)');
    lines.push('Ces lieux/expériences sont EXCLUSIFS aux membres Privé. Mentionne-les avec mystère.');
    for (const item of briefing.offMarketItems) {
      lines.push(`**🔒 ${item.name}** (${item.type})`);
      if (item.description) lines.push(`  ${item.description}`);
      if (item.whySpecial) lines.push(`  ✨ ${item.whySpecial}`);
      if (item.howToAccess) lines.push(`  🗝️ ${item.howToAccess}`);
      lines.push('');
    }
  }

  // Boutique
  if (briefing.boutiqueItems.length > 0) {
    lines.push('## 🎁 Boutique Baymora — Cadeaux disponibles');
    for (const item of briefing.boutiqueItems) {
      lines.push(`**${item.name}** — ${item.priceEur}€${item.brand ? ` · ${item.brand}` : ''}`);
      if (item.giftSuggestion) lines.push(`  💡 ${item.giftSuggestion}`);
      if (item.affiliateUrl) lines.push(`  🔗 ${item.affiliateUrl}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}
