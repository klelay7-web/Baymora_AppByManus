/**
 * ─── Maison Baymora — Mission Service ────────────────────────────────────────
 * Gestion des missions 24h du fondateur vers ARIA.
 * 
 * Flux :
 *   1. Fondateur colle une directive → createMission()
 *   2. ARIA reçoit la mission comme contexte dans son system prompt
 *   3. ARIA génère un accusé de réception (ariaAck)
 *   4. La mission expire après durationHours (défaut 24h)
 *   5. À l'expiration, ARIA génère un compte-rendu final avec score de succès
 *   6. La mission passe en historique (status: completed/expired)
 */

import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "../db";
import { ariaMissions } from "../../drizzle/schema";
import { eq, desc, and, lte, or } from "drizzle-orm";
import { ENV } from "../_core/env";

const anthropic = new Anthropic({ apiKey: ENV.anthropicApiKey });

// ─── Types ────────────────────────────────────────────────────────────────────
export interface MissionInput {
  title: string;
  content: string;
  priority?: "normal" | "high" | "urgent";
  durationHours?: number;
  authorId: number;
}

export interface MissionProgress {
  note: string;
  timestamp: string;
  agent?: string;
  tasksCompleted?: number;
  totalTasks?: number;
}

// ─── Créer une mission ────────────────────────────────────────────────────────
export async function createMission(input: MissionInput) {
  const db = await getDb();
  if (!db) throw new Error("DB non disponible");

  const durationHours = input.durationHours ?? 24;
  const startsAt = new Date();
  const expiresAt = new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000);

  // Expirer les missions actives précédentes
  await db
    .update(ariaMissions)
    .set({ status: "expired", updatedAt: new Date() })
    .where(eq(ariaMissions.status, "active"));

  // Créer la nouvelle mission
  const [result] = await db.insert(ariaMissions).values({
    title: input.title,
    content: input.content,
    status: "active",
    priority: input.priority ?? "normal",
    authorId: input.authorId,
    startsAt,
    expiresAt,
    durationHours,
  });

  const missionId = (result as { insertId: number }).insertId;

  // ARIA génère un accusé de réception
  const ack = await generateAriaAck(input.title, input.content, durationHours);

  await db
    .update(ariaMissions)
    .set({ ariaAck: ack, ariaAckAt: new Date() })
    .where(eq(ariaMissions.id, missionId));

  return { id: missionId, ariaAck: ack, expiresAt };
}

// ─── Récupérer la mission active ─────────────────────────────────────────────
export async function getActiveMission() {
  const db = await getDb();
  if (!db) return null;

  // Auto-expirer les missions dont le temps est écoulé
  await db
    .update(ariaMissions)
    .set({ status: "expired", updatedAt: new Date() })
    .where(
      and(
        eq(ariaMissions.status, "active"),
        lte(ariaMissions.expiresAt, new Date())
      )
    );

  const rows = await db
    .select()
    .from(ariaMissions)
    .where(eq(ariaMissions.status, "active"))
    .orderBy(desc(ariaMissions.createdAt))
    .limit(1);

  return rows[0] ?? null;
}

// ─── Récupérer l'historique des missions ─────────────────────────────────────
export async function getMissionHistory(limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(ariaMissions)
    .orderBy(desc(ariaMissions.createdAt))
    .limit(limit);
}

// ─── Mettre à jour la progression d'une mission ──────────────────────────────
export async function addMissionProgress(
  missionId: number,
  note: string,
  agent?: string,
  completedTasks?: number,
  totalTasks?: number
) {
  const db = await getDb();
  if (!db) return;

  const rows = await db
    .select()
    .from(ariaMissions)
    .where(eq(ariaMissions.id, missionId))
    .limit(1);

  if (!rows[0]) return;

  const existing: MissionProgress[] = rows[0].progressNotes
    ? JSON.parse(rows[0].progressNotes)
    : [];

  const newNote: MissionProgress = {
    note,
    timestamp: new Date().toISOString(),
    agent,
    tasksCompleted: completedTasks,
    totalTasks,
  };

  const updated = [...existing, newNote];

  await db
    .update(ariaMissions)
    .set({
      progressNotes: JSON.stringify(updated),
      completedTasks: completedTasks ?? rows[0].completedTasks ?? 0,
      totalTasks: totalTasks ?? rows[0].totalTasks ?? 0,
      updatedAt: new Date(),
    })
    .where(eq(ariaMissions.id, missionId));
}

// ─── Clôturer une mission avec compte-rendu ───────────────────────────────────
export async function closeMission(
  missionId: number,
  status: "completed" | "cancelled" = "completed"
) {
  const db = await getDb();
  if (!db) throw new Error("DB non disponible");

  const rows = await db
    .select()
    .from(ariaMissions)
    .where(eq(ariaMissions.id, missionId))
    .limit(1);

  if (!rows[0]) throw new Error("Mission introuvable");

  const mission = rows[0];

  // ARIA génère le compte-rendu final
  const { report, score } = await generateFinalReport(mission);

  await db
    .update(ariaMissions)
    .set({
      status,
      completedAt: new Date(),
      finalReport: report,
      finalReportAt: new Date(),
      successScore: score,
      updatedAt: new Date(),
    })
    .where(eq(ariaMissions.id, missionId));

  return { report, score };
}

// ─── Construire le contexte mission pour le system prompt ARIA ───────────────
export async function buildMissionContext(): Promise<string> {
  const mission = await getActiveMission();
  if (!mission) return "";

  const now = new Date();
  const elapsed = Math.floor((now.getTime() - new Date(mission.startsAt).getTime()) / (1000 * 60 * 60));
  const remaining = Math.max(0, Math.floor((new Date(mission.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60)));

  const progress: MissionProgress[] = mission.progressNotes
    ? JSON.parse(mission.progressNotes)
    : [];

  const lastNotes = progress.slice(-3).map(p =>
    `[${p.agent ?? "ARIA"}] ${p.note}`
  ).join("\n");

  return `
## 🎯 MISSION ACTIVE — "${mission.title}"
**Priorité :** ${mission.priority.toUpperCase()}
**Temps écoulé :** ${elapsed}h | **Temps restant :** ${remaining}h
**Tâches :** ${mission.completedTasks ?? 0}/${mission.totalTasks ?? "?"} complétées

### DIRECTIVE COMPLÈTE :
${mission.content}

${lastNotes ? `### DERNIÈRES NOTES DE PROGRESSION :\n${lastNotes}` : ""}

**⚠️ Cette mission est ta priorité absolue. Chaque réponse doit faire avancer les objectifs définis ci-dessus.**
`;
}

// ─── Générer l'accusé de réception ARIA ──────────────────────────────────────
async function generateAriaAck(
  title: string,
  content: string,
  durationHours: number
): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 600,
      system: `Tu es ARIA, Directrice Générale IA de Maison Baymora. Tu viens de recevoir une directive de mission du fondateur. Génère un accusé de réception concis (max 300 mots) qui :
1. Confirme ta compréhension des objectifs principaux
2. Identifie les 3 priorités critiques
3. Nomme les agents que tu vas mobiliser
4. Confirme le planning sur ${durationHours}h
5. Signe : **— ARIA, DG Maison Baymora**
Sois directe, professionnelle, et montre que tu as bien compris la mission.`,
      messages: [{
        role: "user",
        content: `Mission reçue : "${title}"\n\nContenu :\n${content.slice(0, 3000)}`,
      }],
    });
    return response.content[0].type === "text" ? response.content[0].text : "Mission reçue et enregistrée.";
  } catch {
    return `✅ Mission "${title}" reçue et enregistrée. Durée : ${durationHours}h. Démarrage immédiat.\n\n— ARIA, DG Maison Baymora`;
  }
}

// ─── Générer le compte-rendu final ───────────────────────────────────────────
async function generateFinalReport(mission: {
  title: string;
  content: string;
  startsAt: Date;
  expiresAt: Date;
  completedTasks: number | null;
  totalTasks: number | null;
  progressNotes: string | null;
}): Promise<{ report: string; score: number }> {
  const progress: MissionProgress[] = mission.progressNotes
    ? JSON.parse(mission.progressNotes)
    : [];

  const duration = Math.floor(
    (new Date(mission.expiresAt).getTime() - new Date(mission.startsAt).getTime()) / (1000 * 60 * 60)
  );

  const progressSummary = progress.map(p =>
    `[${new Date(p.timestamp).toLocaleTimeString("fr-FR")}] ${p.agent ?? "ARIA"}: ${p.note}`
  ).join("\n");

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1200,
      system: `Tu es ARIA, Directrice Générale IA de Maison Baymora. Tu dois rédiger le compte-rendu de clôture d'une mission. Structure :
**📅 COMPTE-RENDU DE MISSION — [DATE]**
**Mission :** [titre]
**Durée :** [X]h | **Score de succès :** [X]/100

**✅ ACCOMPLI**
[liste des réalisations]

**⚠️ PARTIELLEMENT RÉALISÉ**
[ce qui n'a pas été terminé]

**❌ NON RÉALISÉ**
[objectifs manqués avec raison]

**📊 MÉTRIQUES**
[chiffres clés]

**💡 RECOMMANDATIONS POUR LA PROCHAINE MISSION**
[3 recommandations concrètes]

**— ARIA, DG Maison Baymora**

À la fin, sur une ligne séparée, écris uniquement : SCORE:[chiffre entre 0 et 100]`,
      messages: [{
        role: "user",
        content: `Mission : "${mission.title}"
Durée prévue : ${duration}h
Tâches : ${mission.completedTasks ?? 0}/${mission.totalTasks ?? "?"}
Notes de progression :\n${progressSummary || "Aucune note enregistrée"}
Objectifs initiaux :\n${mission.content.slice(0, 2000)}`,
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const scoreMatch = text.match(/SCORE:(\d+)/);
    const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 50;
    const report = text.replace(/\nSCORE:\d+\s*$/, "").trim();

    return { report, score };
  } catch {
    const score = mission.totalTasks && mission.totalTasks > 0
      ? Math.round(((mission.completedTasks ?? 0) / mission.totalTasks) * 100)
      : 50;
    return {
      report: `**Compte-rendu de mission "${mission.title}"**\nTâches complétées : ${mission.completedTasks ?? 0}/${mission.totalTasks ?? "?"}\n\n— ARIA, DG Maison Baymora`,
      score,
    };
  }
}
