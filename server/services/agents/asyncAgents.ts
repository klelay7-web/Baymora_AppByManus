/**
 * Async Background Agents — Baymora
 *
 * Three autonomous agents running on cron schedules:
 * - Plume   (Content Creator)    — daily 2AM
 * - Gardien (Quality Control)    — weekly Sunday 3AM
 * - Data    (Business Intelligence) — daily 6AM
 *
 * Each agent logs its work as AgentTask records in the database.
 */

import { prisma } from '../../db';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// ─── Helpers ────────────────────────────────────────────────────────────────

function msToNext(hour: number, minute = 0, dayOfWeek?: number): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);

  if (dayOfWeek !== undefined) {
    // Advance to next occurrence of dayOfWeek (0=Sun)
    const diff = (dayOfWeek - now.getDay() + 7) % 7;
    target.setDate(target.getDate() + (diff === 0 && now >= target ? 7 : diff));
  } else if (now >= target) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

async function createAgentTask(data: {
  type: string;
  status?: string;
  input?: any;
  output?: any;
  agentProfile?: string;
  triggeredBy?: string;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  creditsUsed?: number;
  error?: string;
}) {
  return prisma.agentTask.create({
    data: {
      type: data.type,
      status: data.status ?? 'completed',
      priority: 8, // background
      input: data.input ?? {},
      output: data.output ?? undefined,
      agentProfile: data.agentProfile ?? null,
      triggeredBy: data.triggeredBy ?? 'cron',
      startedAt: data.startedAt ?? new Date(),
      completedAt: data.completedAt ?? new Date(),
      durationMs: data.durationMs ?? 0,
      creditsUsed: data.creditsUsed ?? 0,
      error: data.error ?? null,
    },
  });
}

// ─── AGENT PLUME — Content Creator ──────────────────────────────────────────

async function agentPlume(): Promise<void> {
  const start = Date.now();
  console.log('[AGENT_PLUME] Starting content creation run...');

  try {
    let actionsPerformed = 0;
    const MAX_ENRICHMENTS = 5;

    // 1. Find cities with < 3 venues and auto-create drafts
    const cityCounts = await prisma.atlasVenue.groupBy({
      by: ['city'],
      _count: { id: true },
    });

    const sparseCities = cityCounts.filter(c => c._count.id < 3);

    for (const cityEntry of sparseCities) {
      if (actionsPerformed >= MAX_ENRICHMENTS) break;

      const existingTypes = await prisma.atlasVenue.findMany({
        where: { city: cityEntry.city },
        select: { type: true },
      });
      const existingTypeSet = new Set(existingTypes.map(v => v.type));
      const coreTypes = ['hotel', 'restaurant', 'bar', 'activity'];
      const missingTypes = coreTypes.filter(t => !existingTypeSet.has(t));

      for (const venueType of missingTypes) {
        if (actionsPerformed >= MAX_ENRICHMENTS) break;

        await prisma.atlasVenue.create({
          data: {
            name: `${venueType.charAt(0).toUpperCase() + venueType.slice(1)} — ${cityEntry.city} (draft)`,
            type: venueType,
            city: cityEntry.city,
            country: 'FR',
            status: 'draft',
            createdBy: 'agent_plume',
          },
        });

        await createAgentTask({
          type: 'plume_content',
          input: { action: 'create_draft', city: cityEntry.city, venueType },
          output: { message: `Created draft ${venueType} venue for ${cityEntry.city}` },
          agentProfile: 'agent-plume',
        });

        actionsPerformed++;
        console.log(`[AGENT_PLUME] Created draft ${venueType} for ${cityEntry.city}`);
      }
    }

    // 2. Generate descriptions for venues missing them (via Claude Haiku)
    const venuesMissingDesc = await prisma.atlasVenue.findMany({
      where: { description: null, status: { not: 'archived' } },
      take: MAX_ENRICHMENTS - actionsPerformed,
    });

    for (const venue of venuesMissingDesc) {
      if (actionsPerformed >= MAX_ENRICHMENTS) break;

      try {
        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-20250414',
          max_tokens: 300,
          messages: [
            {
              role: 'user',
              content: `Write a short, elegant French description (2-3 sentences) for a travel venue:
Name: ${venue.name}
Type: ${venue.type}
City: ${venue.city}, ${venue.country}
${venue.ambiance ? `Ambiance: ${venue.ambiance}` : ''}
Keep it refined, concise, and appealing for luxury travelers.`,
            },
          ],
        });

        const text = response.content[0].type === 'text' ? response.content[0].text : '';

        await prisma.atlasVenue.update({
          where: { id: venue.id },
          data: { description: text },
        });

        await createAgentTask({
          type: 'plume_content',
          input: { action: 'generate_description', venueId: venue.id, venueName: venue.name },
          output: { description: text.slice(0, 100) + '...' },
          agentProfile: 'claude-haiku',
          creditsUsed: 0.01,
        });

        actionsPerformed++;
        console.log(`[AGENT_PLUME] Generated description for "${venue.name}"`);
      } catch (err: any) {
        console.error(`[AGENT_PLUME] Failed to generate description for "${venue.name}":`, err.message);
      }
    }

    // 3. Enrich venues missing insiderTips, seasonalNotes, or tags
    const venuesMissingFields = await prisma.atlasVenue.findMany({
      where: {
        status: 'published',
        OR: [
          { insiderTips: null },
          { seasonalNotes: null },
          { tags: { equals: [] } },
        ],
      },
      take: MAX_ENRICHMENTS - actionsPerformed,
    });

    for (const venue of venuesMissingFields) {
      if (actionsPerformed >= MAX_ENRICHMENTS) break;

      const missingFields: string[] = [];
      if (!venue.insiderTips) missingFields.push('insiderTips');
      if (!venue.seasonalNotes) missingFields.push('seasonalNotes');
      const tagsArray = Array.isArray(venue.tags) ? venue.tags : [];
      if (tagsArray.length === 0) missingFields.push('tags');

      try {
        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-20250414',
          max_tokens: 400,
          messages: [
            {
              role: 'user',
              content: `For this venue, provide the missing fields in JSON format:
Name: ${venue.name} | Type: ${venue.type} | City: ${venue.city}
${venue.description ? `Description: ${venue.description}` : ''}

Missing fields: ${missingFields.join(', ')}

Respond ONLY with valid JSON containing:
${missingFields.includes('insiderTips') ? '- "insiderTips": a short insider tip in French (1-2 sentences)' : ''}
${missingFields.includes('seasonalNotes') ? '- "seasonalNotes": seasonal advice in French (1 sentence)' : ''}
${missingFields.includes('tags') ? '- "tags": array of 3-5 relevant tags in French (lowercase)' : ''}`,
            },
          ],
        });

        const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
        const parsed = JSON.parse(text);

        const updateData: any = {};
        if (parsed.insiderTips && !venue.insiderTips) updateData.insiderTips = parsed.insiderTips;
        if (parsed.seasonalNotes && !venue.seasonalNotes) updateData.seasonalNotes = parsed.seasonalNotes;
        if (parsed.tags && tagsArray.length === 0) updateData.tags = parsed.tags;

        if (Object.keys(updateData).length > 0) {
          await prisma.atlasVenue.update({
            where: { id: venue.id },
            data: updateData,
          });
        }

        await createAgentTask({
          type: 'plume_content',
          input: { action: 'enrich_fields', venueId: venue.id, fields: missingFields },
          output: { enriched: Object.keys(updateData) },
          agentProfile: 'claude-haiku',
          creditsUsed: 0.01,
        });

        actionsPerformed++;
        console.log(`[AGENT_PLUME] Enriched "${venue.name}" with: ${Object.keys(updateData).join(', ')}`);
      } catch (err: any) {
        console.error(`[AGENT_PLUME] Failed to enrich "${venue.name}":`, err.message);
      }
    }

    const duration = Date.now() - start;
    console.log(`[AGENT_PLUME] Completed — ${actionsPerformed} actions in ${duration}ms`);

    await createAgentTask({
      type: 'plume_content',
      input: { action: 'run_summary' },
      output: { totalActions: actionsPerformed, durationMs: duration },
      agentProfile: 'agent-plume',
      startedAt: new Date(start),
      durationMs: duration,
    });
  } catch (error: any) {
    console.error('[AGENT_PLUME] Fatal error:', error.message);
    await createAgentTask({
      type: 'plume_content',
      status: 'failed',
      input: { action: 'run_summary' },
      error: error.message,
      agentProfile: 'agent-plume',
      startedAt: new Date(start),
      durationMs: Date.now() - start,
    });
  }
}

// ─── AGENT GARDIEN — Quality Control ────────────────────────────────────────

async function agentGardien(): Promise<void> {
  const start = Date.now();
  console.log('[AGENT_GARDIEN] Starting quality control audit...');

  try {
    const issues: Array<{ venueId: string; name: string; issue: string }> = [];

    // 1. Check published venues for completeness
    const published = await prisma.atlasVenue.findMany({
      where: { status: 'published' },
      select: {
        id: true,
        name: true,
        city: true,
        type: true,
        description: true,
        rating: true,
        priceLevel: true,
        updatedAt: true,
      },
    });

    for (const v of published) {
      if (!v.name) issues.push({ venueId: v.id, name: v.name ?? '(unnamed)', issue: 'missing_name' });
      if (!v.city) issues.push({ venueId: v.id, name: v.name, issue: 'missing_city' });
      if (!v.type) issues.push({ venueId: v.id, name: v.name, issue: 'missing_type' });
      if (!v.description) issues.push({ venueId: v.id, name: v.name, issue: 'missing_description' });

      // Flag null rating or priceLevel=0
      if (v.rating === null) {
        issues.push({ venueId: v.id, name: v.name, issue: 'rating_null' });
      }
      if (v.priceLevel === 0) {
        issues.push({ venueId: v.id, name: v.name, issue: 'price_level_zero' });
      }

      // Check if not updated in 90+ days
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(v.updatedAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceUpdate >= 90) {
        issues.push({ venueId: v.id, name: v.name, issue: `stale_${daysSinceUpdate}d` });
      }
    }

    const duration = Date.now() - start;

    // Group issues by type for summary
    const issuesByType: Record<string, number> = {};
    for (const i of issues) {
      const key = i.issue.startsWith('stale_') ? 'stale_90d+' : i.issue;
      issuesByType[key] = (issuesByType[key] || 0) + 1;
    }

    console.log(`[AGENT_GARDIEN] Audit complete — ${issues.length} issue(s) found across ${published.length} venues`);
    for (const [type, count] of Object.entries(issuesByType)) {
      console.log(`[AGENT_GARDIEN]   ${type}: ${count}`);
    }

    await createAgentTask({
      type: 'gardien_check',
      input: { action: 'weekly_audit', venuesScanned: published.length },
      output: {
        totalIssues: issues.length,
        issuesByType,
        issues: issues.slice(0, 50), // cap stored issues to keep output manageable
      },
      agentProfile: 'agent-gardien',
      startedAt: new Date(start),
      durationMs: duration,
    });
  } catch (error: any) {
    console.error('[AGENT_GARDIEN] Fatal error:', error.message);
    await createAgentTask({
      type: 'gardien_check',
      status: 'failed',
      input: { action: 'weekly_audit' },
      error: error.message,
      agentProfile: 'agent-gardien',
      startedAt: new Date(start),
      durationMs: Date.now() - start,
    });
  }
}

// ─── AGENT DATA — Business Intelligence ─────────────────────────────────────

const PLAN_PRICES: Record<string, number> = {
  decouverte: 0,
  explorateur: 9.99,
  connaisseur: 24.99,
  excellence: 49.99,
};

async function agentData(): Promise<void> {
  const start = Date.now();
  console.log('[AGENT_DATA] Starting business intelligence collection...');

  try {
    // 1. Total users by circle
    const usersByCircle = await prisma.user.groupBy({
      by: ['circle'],
      _count: { id: true },
    });

    const circleStats: Record<string, number> = {};
    for (const entry of usersByCircle) {
      circleStats[entry.circle] = entry._count.id;
    }

    // 2. Daily active users (users with messages created today)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const dailyActive = await prisma.message.findMany({
      where: {
        createdAt: { gte: todayStart },
        role: 'user',
      },
      select: {
        conversation: {
          select: { userId: true },
        },
      },
      distinct: ['conversationId'],
    });

    const uniqueActiveUsers = new Set(dailyActive.map(m => m.conversation.userId));
    const dau = uniqueActiveUsers.size;

    // 3. New signups this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const newSignups = await prisma.user.count({
      where: { createdAt: { gte: weekAgo } },
    });

    // 4. Revenue estimate
    let revenueEstimate = 0;
    for (const [circle, count] of Object.entries(circleStats)) {
      const price = PLAN_PRICES[circle] ?? 0;
      revenueEstimate += count * price;
    }
    revenueEstimate = Math.round(revenueEstimate * 100) / 100;

    const totalUsers = Object.values(circleStats).reduce((a, b) => a + b, 0);
    const paidUsers = totalUsers - (circleStats['decouverte'] ?? 0);

    const duration = Date.now() - start;

    const stats = {
      date: new Date().toISOString().slice(0, 10),
      totalUsers,
      usersByCircle: circleStats,
      dailyActiveUsers: dau,
      newSignupsThisWeek: newSignups,
      paidUsers,
      revenueEstimateMRR: revenueEstimate,
    };

    console.log('[AGENT_DATA] Stats collected:');
    console.log(`[AGENT_DATA]   Total users: ${totalUsers}`);
    console.log(`[AGENT_DATA]   DAU: ${dau}`);
    console.log(`[AGENT_DATA]   New signups (7d): ${newSignups}`);
    console.log(`[AGENT_DATA]   Paid users: ${paidUsers}`);
    console.log(`[AGENT_DATA]   MRR estimate: ${revenueEstimate} EUR`);

    await createAgentTask({
      type: 'data_analysis',
      input: { action: 'daily_bi_report' },
      output: stats,
      agentProfile: 'agent-data',
      startedAt: new Date(start),
      durationMs: duration,
    });
  } catch (error: any) {
    console.error('[AGENT_DATA] Fatal error:', error.message);
    await createAgentTask({
      type: 'data_analysis',
      status: 'failed',
      input: { action: 'daily_bi_report' },
      error: error.message,
      agentProfile: 'agent-data',
      startedAt: new Date(start),
      durationMs: Date.now() - start,
    });
  }
}

// ─── Scheduler ──────────────────────────────────────────────────────────────

export function startAsyncAgents(): void {
  // Agent Plume — daily at 2AM
  const plumeDelay = msToNext(2, 0);
  setTimeout(() => {
    agentPlume();
    setInterval(agentPlume, 24 * 60 * 60 * 1000);
  }, plumeDelay);
  console.log(`[AGENTS] Plume scheduled — first run in ${Math.round(plumeDelay / 60000)}min`);

  // Agent Gardien — every Sunday at 3AM
  const gardienDelay = msToNext(3, 0, 0); // 0 = Sunday
  setTimeout(() => {
    agentGardien();
    setInterval(agentGardien, 7 * 24 * 60 * 60 * 1000);
  }, gardienDelay);
  console.log(`[AGENTS] Gardien scheduled — first run in ${Math.round(gardienDelay / 60000)}min`);

  // Agent Data — daily at 6AM
  const dataDelay = msToNext(6, 0);
  setTimeout(() => {
    agentData();
    setInterval(agentData, 24 * 60 * 60 * 1000);
  }, dataDelay);
  console.log(`[AGENTS] Data scheduled — first run in ${Math.round(dataDelay / 60000)}min`);

  console.log('[AGENTS] All async agents registered');
}
