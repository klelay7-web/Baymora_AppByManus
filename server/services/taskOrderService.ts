/**
 * ─── Task Order Service ───────────────────────────────────────────────────────
 * Gestion des ordres de tâches traçables pour les agents ARIA, LÉNA, MANUS, etc.
 * Chaque demande du fondateur ou ordre d'ARIA crée une entrée persistante en DB.
 */
import { getDb } from "../db";
import { agentTaskOrders } from "../../drizzle/schema";
import { eq, desc, and, ne } from "drizzle-orm";

export interface CreateTaskOrderInput {
  title: string;
  description?: string;
  agent: string;
  requestedBy?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  linkedMissionId?: number;
  linkedFieldReportId?: number;
  dueAt?: Date;
}

export interface ProgressNote {
  at: string;
  note: string;
  by: string;
}

// ─── Créer un ordre de tâche ──────────────────────────────────────────────────
export async function createTaskOrder(input: CreateTaskOrderInput) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(agentTaskOrders).values({
    title: input.title,
    description: input.description ?? null,
    agent: input.agent,
    requestedBy: input.requestedBy ?? "fondateur",
    priority: input.priority ?? "normal",
    status: "pending",
    progressPercent: 0,
    linkedMissionId: input.linkedMissionId ?? null,
    linkedFieldReportId: input.linkedFieldReportId ?? null,
    dueAt: input.dueAt ?? null,
  });
  const id = (result as { insertId: number }).insertId;
  return getTaskOrderById(id);
}

// ─── Récupérer une tâche par ID ───────────────────────────────────────────────
export async function getTaskOrderById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(agentTaskOrders).where(eq(agentTaskOrders.id, id)).limit(1);
  return rows[0] ?? null;
}

// ─── Lister les tâches (avec filtres optionnels) ──────────────────────────────
export async function listTaskOrders(options?: {
  agent?: string;
  status?: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(agentTaskOrders).orderBy(desc(agentTaskOrders.createdAt));
  const rows = await query.limit(options?.limit ?? 50);
  let result = rows;
  if (options?.agent) result = result.filter(r => r.agent === options.agent);
  if (options?.status) result = result.filter(r => r.status === options.status);
  return result;
}

// ─── Mettre à jour la progression d'une tâche ────────────────────────────────
export async function updateTaskProgress(
  id: number,
  progressPercent: number,
  note?: string,
  by?: string
) {
  const db = await getDb();
  if (!db) return;
  const task = await getTaskOrderById(id);
  if (!task) return;

  const existingNotes: ProgressNote[] = task.progressNotes
    ? JSON.parse(task.progressNotes)
    : [];

  if (note) {
    existingNotes.push({ at: new Date().toISOString(), note, by: by ?? "système" });
  }

  const newStatus = progressPercent >= 100 ? "completed"
    : progressPercent > 0 ? "in_progress"
    : task.status;

  await db.update(agentTaskOrders).set({
    progressPercent: Math.min(100, Math.max(0, progressPercent)),
    progressNotes: JSON.stringify(existingNotes),
    status: newStatus as "pending" | "in_progress" | "completed" | "failed" | "cancelled",
    startedAt: task.startedAt ?? (progressPercent > 0 ? new Date() : null),
    completedAt: progressPercent >= 100 ? new Date() : task.completedAt,
  }).where(eq(agentTaskOrders.id, id));
}

// ─── Changer le statut d'une tâche ───────────────────────────────────────────
export async function updateTaskStatus(
  id: number,
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled",
  result?: string
) {
  const db = await getDb();
  if (!db) return;
  await db.update(agentTaskOrders).set({
    status,
    result: result ?? null,
    completedAt: ["completed", "failed", "cancelled"].includes(status) ? new Date() : null,
    progressPercent: status === "completed" ? 100 : undefined,
  }).where(eq(agentTaskOrders.id, id));
}

// ─── Récupérer les tâches actives (non terminées) ────────────────────────────
export async function getActiveTasks(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(agentTaskOrders)
    .where(and(
      ne(agentTaskOrders.status, "completed"),
      ne(agentTaskOrders.status, "cancelled"),
      ne(agentTaskOrders.status, "failed")
    ))
    .orderBy(desc(agentTaskOrders.createdAt))
    .limit(limit);
  return rows;
}

// ─── Statistiques des tâches ─────────────────────────────────────────────────
export async function getTaskStats() {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, inProgress: 0, completed: 0, failed: 0 };
  const all = await db.select().from(agentTaskOrders);
  return {
    total: all.length,
    pending: all.filter(t => t.status === "pending").length,
    inProgress: all.filter(t => t.status === "in_progress").length,
    completed: all.filter(t => t.status === "completed").length,
    failed: all.filter(t => t.status === "failed").length,
  };
}
