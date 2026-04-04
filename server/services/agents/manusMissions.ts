/**
 * AGENT MANUS — Missions automatisées
 *
 * Cet agent utilise l'API Manus pour exécuter des tâches de recherche web :
 * 1. Trouver des photos réelles pour les fiches Atlas/Guides
 * 2. Enrichir les fiches avec des infos web (horaires, avis, etc.)
 * 3. Détecter de nouveaux lieux populaires
 *
 * Chaque mission est loggée dans AgentTask pour suivi.
 */

import { prisma } from '../../db';

const MANUS_API_KEY = process.env.MANUS_API_KEY;
const MANUS_API = 'https://api.manus.im/v2/tasks';

interface ManusResult {
  taskId: string;
  status: string;
  output: any;
}

// ─── Appeler Manus et attendre le résultat ──────────────────────────────────

async function callManus(prompt: string, maxWaitMs = 60000): Promise<ManusResult | null> {
  if (!MANUS_API_KEY) {
    console.log('[MANUS] Pas de clé API — skip');
    return null;
  }

  try {
    // Créer la tâche
    const createRes = await fetch(MANUS_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${MANUS_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, agentProfile: 'manus-1.6-lite', mode: 'agent' }),
    });

    if (!createRes.ok) {
      console.error(`[MANUS] Create failed: ${createRes.status}`);
      return null;
    }

    const task = await createRes.json();
    const taskId = task.task_id || task.id;
    console.log(`[MANUS] Task créé: ${taskId}`);

    // Poller
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      await new Promise(r => setTimeout(r, 3000));
      const pollRes = await fetch(`${MANUS_API}/${taskId}`, {
        headers: { 'Authorization': `Bearer ${MANUS_API_KEY}` },
      });
      if (!pollRes.ok) continue;
      const status = await pollRes.json();

      if (status.status === 'completed' || status.status === 'done') {
        console.log(`[MANUS] Résultat en ${Date.now() - start}ms`);
        return { taskId, status: 'completed', output: status.output || status.result };
      }
      if (status.status === 'failed') {
        console.error(`[MANUS] Task failed`);
        return { taskId, status: 'failed', output: status.error };
      }
    }
    console.warn(`[MANUS] Timeout ${maxWaitMs}ms`);
    return null;
  } catch (e) {
    console.error('[MANUS] Error:', e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MISSION 1 : Enrichir les fiches Atlas avec des infos web
// ═══════════════════════════════════════════════════════════════════════════════

export async function missionEnrichVenues(): Promise<void> {
  console.log('[MANUS_MISSION] 🔍 Enrichissement des fiches Atlas...');

  const venues = await prisma.atlasVenue.findMany({
    where: { status: 'published', OR: [{ description: null }, { description: '' }, { insiderTips: null }] },
    take: 3,
  });

  if (venues.length === 0) {
    console.log('[MANUS_MISSION] Toutes les fiches sont complètes');
    return;
  }

  for (const venue of venues) {
    const prompt = `Recherche des informations sur "${venue.name}" à ${venue.city}, ${venue.country}.
Je veux :
1. Une description de 2-3 phrases (style magazine de voyage, en français)
2. Un conseil insider (ce que seuls les habitués savent)
3. Les horaires d'ouverture
4. Le numéro de téléphone
5. Le site web officiel
6. 3-5 tags pertinents
7. L'URL d'une photo de l'établissement (depuis Google, TripAdvisor ou le site officiel)

Réponds en JSON : {"description":"...","insiderTips":"...","openingHours":"...","phone":"...","website":"...","tags":["..."],"photoUrl":"..."}`;

    const result = await callManus(prompt, 45000);
    if (!result || result.status !== 'completed') continue;

    try {
      const text = typeof result.output === 'string' ? result.output : result.output?.text || JSON.stringify(result.output);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        const updates: any = {};
        if (data.description && !venue.description) updates.description = data.description;
        if (data.insiderTips && !venue.insiderTips) updates.insiderTips = data.insiderTips;
        if (data.phone && !venue.phone) updates.phone = data.phone;
        if (data.website && !venue.website) updates.website = data.website;
        if (data.tags?.length > 0) updates.tags = data.tags;
        if (data.photoUrl) {
          const currentPhotos = venue.photos as string[] || [];
          if (currentPhotos.length === 0) updates.photos = [data.photoUrl];
        }

        if (Object.keys(updates).length > 0) {
          await prisma.atlasVenue.update({ where: { id: venue.id }, data: updates });
          console.log(`[MANUS_MISSION] ✅ Enrichi: ${venue.name} (${Object.keys(updates).join(', ')})`);
        }
      }
    } catch (e) {
      console.error(`[MANUS_MISSION] Erreur parse ${venue.name}:`, e);
    }

    await logMission('enrich_venue', venue.name, result);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MISSION 2 : Enrichir les guides SEO avec des photos
// ═══════════════════════════════════════════════════════════════════════════════

export async function missionEnrichGuides(): Promise<void> {
  console.log('[MANUS_MISSION] 📸 Recherche de photos pour les guides...');

  const guides = await prisma.seoGuide.findMany({ where: { status: 'published' }, take: 3 });

  for (const guide of guides) {
    const items = guide.items as any[];
    const itemsWithoutPhotos = items.filter((item: any) => !item.photo);

    if (itemsWithoutPhotos.length === 0) continue;

    // Prendre les 3 premiers sans photo
    const toEnrich = itemsWithoutPhotos.slice(0, 3);

    for (const item of toEnrich) {
      const prompt = `Trouve l'URL d'une belle photo de "${item.name}" à ${guide.city || ''}.
Cherche sur Google Images, TripAdvisor, ou le site officiel de l'établissement.
Je veux UNE seule URL d'image haute qualité (pas un thumbnail).
Réponds UNIQUEMENT avec l'URL de l'image, rien d'autre.`;

      const result = await callManus(prompt, 30000);
      if (!result || result.status !== 'completed') continue;

      const text = typeof result.output === 'string' ? result.output : result.output?.text || '';
      const urlMatch = text.match(/https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/i);

      if (urlMatch) {
        // Mettre à jour l'item dans le guide
        const updatedItems = items.map((it: any) =>
          it.name === item.name ? { ...it, photo: urlMatch[0] } : it
        );
        await prisma.seoGuide.update({ where: { id: guide.id }, data: { items: updatedItems } });
        console.log(`[MANUS_MISSION] 📸 Photo trouvée: ${item.name} → ${urlMatch[0].substring(0, 60)}...`);
      }

      await logMission('enrich_guide_photo', `${item.name} (${guide.title})`, result);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MISSION 3 : Détecter de nouveaux lieux populaires
// ═══════════════════════════════════════════════════════════════════════════════

export async function missionDiscoverTrends(): Promise<void> {
  console.log('[MANUS_MISSION] 🌐 Détection de tendances...');

  const cities = ['Paris', 'Saint-Tropez', 'New York', 'London', 'Tokyo'];
  const city = cities[Math.floor(Math.random() * cities.length)];

  const prompt = `Quels sont les 3 nouveaux restaurants ou bars les plus tendance à ${city} en ce moment (2026) ?
Pour chaque lieu donne :
- Nom
- Type (restaurant, bar, beach, hotel)
- Adresse
- Pourquoi c'est tendance
- Prix moyen

Réponds en JSON : [{"name":"...","type":"...","address":"...","description":"...","price":"..."}]`;

  const result = await callManus(prompt, 45000);
  if (!result || result.status !== 'completed') return;

  try {
    const text = typeof result.output === 'string' ? result.output : result.output?.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const trends = JSON.parse(jsonMatch[0]);
      for (const trend of trends) {
        if (!trend.name || !trend.type) continue;

        // Vérifier si le lieu existe déjà
        const exists = await prisma.atlasVenue.findFirst({
          where: { name: { contains: trend.name, mode: 'insensitive' }, city: { contains: city, mode: 'insensitive' } },
        });

        if (!exists) {
          await prisma.atlasVenue.create({
            data: {
              name: trend.name,
              type: trend.type,
              city,
              country: ['Paris', 'Saint-Tropez'].includes(city) ? 'FR' : ['New York'].includes(city) ? 'US' : 'INT',
              address: trend.address,
              description: trend.description,
              priceLevel: 3,
              tags: ['tendance', '2026', 'nouveau'],
              status: 'draft',
              createdBy: 'manus-agent',
              affiliateType: 'auto',
            },
          });
          console.log(`[MANUS_MISSION] 🆕 Nouveau lieu détecté: ${trend.name} (${city})`);
        }
      }
    }
  } catch (e) {
    console.error('[MANUS_MISSION] Erreur parse trends:', e);
  }

  await logMission('discover_trends', city, result);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MISSION 4 : Vidéos virales TikTok/Reels pour les fiches
// ═══════════════════════════════════════════════════════════════════════════════

export async function missionFindViralVideos(): Promise<void> {
  console.log('[MANUS_MISSION] 🎬 Recherche de vidéos virales...');

  const venues = await prisma.atlasVenue.findMany({
    where: { status: 'published' },
    take: 3,
    orderBy: { updatedAt: 'asc' }, // Les plus anciennes d'abord
  });

  for (const venue of venues) {
    const prompt = `Cherche les vidéos les plus populaires/virales sur TikTok et Instagram Reels concernant "${venue.name}" à ${venue.city}.

Je veux :
1. Les 2-3 vidéos TikTok les plus vues (URL + nombre de vues approximatif + description courte)
2. Les 2-3 Reels Instagram les plus vues (URL + nombre de vues + description)
3. Le hashtag principal utilisé pour ce lieu

Réponds en JSON :
{
  "tiktok": [{"url":"...","views":"...","description":"..."}],
  "reels": [{"url":"...","views":"...","description":"..."}],
  "hashtag": "#...",
  "viralScore": 1-10
}`;

    const result = await callManus(prompt, 45000);
    if (!result || result.status !== 'completed') continue;

    try {
      const text = typeof result.output === 'string' ? result.output : result.output?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        const currentVideos = (venue.videos as any) || {};
        await prisma.atlasVenue.update({
          where: { id: venue.id },
          data: {
            videos: { ...currentVideos, ...data },
          },
        });
        console.log(`[MANUS_MISSION] 🎬 Vidéos trouvées: ${venue.name} (${data.tiktok?.length || 0} TikTok, ${data.reels?.length || 0} Reels)`);
      }
    } catch (e) {
      console.error(`[MANUS_MISSION] Erreur vidéos ${venue.name}:`, e);
    }

    await logMission('find_viral_videos', venue.name, result);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MISSION 5 : Résumé des avis par Claude (Manus scrape + Claude résume)
// ═══════════════════════════════════════════════════════════════════════════════

export async function missionSummarizeReviews(): Promise<void> {
  console.log('[MANUS_MISSION] 💬 Résumé des avis...');

  const venues = await prisma.atlasVenue.findMany({
    where: { status: 'published', seasonalNotes: null },
    take: 3,
  });

  for (const venue of venues) {
    // Étape 1 : Manus scrape les avis
    const scrapePrompt = `Cherche les avis récents sur "${venue.name}" à ${venue.city} sur Google Reviews, TripAdvisor, et les réseaux sociaux.

Collecte :
1. Les 10 avis les plus récents et pertinents (positifs ET négatifs)
2. La note moyenne sur Google et TripAdvisor
3. Les points forts mentionnés le plus souvent
4. Les points faibles mentionnés
5. Des citations marquantes de clients

Réponds en JSON :
{
  "googleRating": 4.5,
  "tripadvisorRating": 4.3,
  "totalReviews": 250,
  "topPositive": ["service exceptionnel", "vue incroyable", "cuisine raffinée"],
  "topNegative": ["prix élevés", "attente longue"],
  "bestQuotes": ["La meilleure soirée de notre vie", "On y retourne chaque été"],
  "worstQuotes": ["Un peu cher pour ce que c'est"],
  "recentTrend": "en hausse"
}`;

    const scrapeResult = await callManus(scrapePrompt, 45000);
    if (!scrapeResult || scrapeResult.status !== 'completed') continue;

    try {
      const scrapeText = typeof scrapeResult.output === 'string' ? scrapeResult.output : scrapeResult.output?.text || '';
      const jsonMatch = scrapeText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;

      const reviewData = JSON.parse(jsonMatch[0]);

      // Étape 2 : Claude fait un résumé sexy
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) continue;

      const client = new Anthropic({ apiKey });
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Tu es rédacteur pour un magazine de voyage premium. À partir de ces données d'avis sur "${venue.name}" à ${venue.city}, écris un résumé de 3-4 phrases qui donne envie. Style magazine, vivant, avec des citations de clients.

Données : ${JSON.stringify(reviewData)}

Le résumé doit :
- Commencer par une accroche (pas "Ce restaurant..." mais quelque chose de vivant)
- Inclure 1-2 citations de clients entre guillemets
- Mentionner ce qui rend ce lieu unique
- Donner le ton général (romantique, festif, intime, etc.)
- Terminer par un détail qui fait la différence

Écris UNIQUEMENT le résumé, rien d'autre. En français.`,
        }],
      });

      const summary = response.content[0].type === 'text' ? response.content[0].text : '';

      if (summary) {
        await prisma.atlasVenue.update({
          where: { id: venue.id },
          data: {
            seasonalNotes: summary,
            rating: reviewData.googleRating || venue.rating,
          },
        });
        console.log(`[MANUS_MISSION] 💬 Résumé avis: ${venue.name} → "${summary.substring(0, 80)}..."`);
      }
    } catch (e) {
      console.error(`[MANUS_MISSION] Erreur résumé ${venue.name}:`, e);
    }

    await logMission('summarize_reviews', venue.name, scrapeResult);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MISSION 6 : Rapport quotidien
// ═══════════════════════════════════════════════════════════════════════════════

export async function missionDailyReport(): Promise<void> {
  console.log('[MANUS_MISSION] 📊 Génération du rapport...');

  const [totalVenues, publishedVenues, totalGuides, totalTrips, totalUsers] = await Promise.all([
    prisma.atlasVenue.count(),
    prisma.atlasVenue.count({ where: { status: 'published' } }),
    prisma.seoGuide.count({ where: { status: 'published' } }),
    prisma.trip.count({ where: { visibility: 'public' } }),
    prisma.user.count(),
  ]);

  const recentTasks = await prisma.agentTask.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const report = {
    date: new Date().toISOString(),
    atlas: { total: totalVenues, published: publishedVenues },
    guides: totalGuides,
    publicTrips: totalTrips,
    users: totalUsers,
    agentTasksLast24h: recentTasks.length,
    taskTypes: recentTasks.reduce((acc: any, t) => { acc[t.type] = (acc[t.type] || 0) + 1; return acc; }, {}),
  };

  await logMission('daily_report', 'système', { taskId: 'report', status: 'completed', output: report });
  console.log(`[MANUS_MISSION] 📊 Rapport: ${totalVenues} venues (${publishedVenues} publiées), ${totalGuides} guides, ${totalTrips} parcours, ${totalUsers} users`);
}

// ─── Helper ──────────────────────────────────────────────────────────────────

async function logMission(type: string, target: string, result: ManusResult | null): Promise<void> {
  try {
    await prisma.agentTask.create({
      data: {
        type: `manus_${type}`,
        status: result?.status || 'failed',
        input: { target },
        output: result?.output ? { taskId: result.taskId, preview: JSON.stringify(result.output).substring(0, 500) } : { error: 'no result' },
        agentProfile: 'manus-1.6-lite',
        triggeredBy: 'manus-agent',
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════════
// LANCEMENT — Toutes les missions
// ═══════════════════════════════════════════════════════════════════════════════

export async function runAllManusMissions(): Promise<void> {
  if (!MANUS_API_KEY) {
    console.log('[MANUS] Pas de clé API — missions désactivées');
    return;
  }

  console.log('[MANUS] ═══ Démarrage des 6 missions ═══');

  await missionDailyReport();
  await missionEnrichVenues();
  await missionEnrichGuides();
  await missionFindViralVideos();
  await missionSummarizeReviews();
  await missionDiscoverTrends();

  console.log('[MANUS] ═══ 6 missions terminées ═══');
}

export function startManusCron(): void {
  if (!MANUS_API_KEY) {
    console.log('[MANUS] Pas de clé API — cron désactivé');
    return;
  }

  // Mode SEO continu : missions toutes les 2h (au lieu de 6h)
  setInterval(runAllManusMissions, 2 * 60 * 60 * 1000);
  // Premier run après 3 minutes
  setTimeout(runAllManusMissions, 3 * 60 * 1000);

  console.log('[MANUS] 🔥 Mode SEO continu : missions toutes les 2h');
}
