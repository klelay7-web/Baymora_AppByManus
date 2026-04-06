/**
 * ─── LÉNA Session Service ─────────────────────────────────────────────────────
 * Persistance cross-device des sessions LÉNA.
 * La session (étape, données collectées, historique) est sauvegardée en DB
 * et rechargée automatiquement depuis n'importe quel appareil.
 */
import { getDb } from "../db";
import { lenaSessions } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import type { LenaSession, LenaMessage } from "./ai/lenaService";

// ─── Sauvegarder ou mettre à jour une session LÉNA ───────────────────────────
export async function saveLenaSession(
  userId: number,
  sessionKey: string,
  session: LenaSession,
  history: LenaMessage[]
) {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select()
    .from(lenaSessions)
    .where(and(eq(lenaSessions.userId, userId), eq(lenaSessions.sessionKey, sessionKey)))
    .limit(1);

  const data = {
    establishmentName: session.establishmentName ?? null,
    city: session.city ?? null,
    currentStep: session.currentStep,
    collectedData: JSON.stringify(session.collectedData ?? {}),
    history: JSON.stringify(history),
    scoutBriefing: session.scoutBriefing ?? null,
    fieldReportId: session.fieldReportId ?? null,
    status: "active" as const,
  };

  if (existing.length > 0) {
    await db.update(lenaSessions).set(data).where(eq(lenaSessions.id, existing[0].id));
  } else {
    await db.insert(lenaSessions).values({ userId, sessionKey, ...data });
  }
}

// ─── Charger la session active d'un utilisateur ──────────────────────────────
export async function loadLenaSession(userId: number, sessionKey?: string): Promise<{
  session: LenaSession;
  history: LenaMessage[];
  sessionKey: string;
} | null> {
  const db = await getDb();
  if (!db) return null;

  let rows;
  if (sessionKey) {
    rows = await db
      .select()
      .from(lenaSessions)
      .where(and(eq(lenaSessions.userId, userId), eq(lenaSessions.sessionKey, sessionKey)))
      .limit(1);
  } else {
    rows = await db
      .select()
      .from(lenaSessions)
      .where(and(eq(lenaSessions.userId, userId), eq(lenaSessions.status, "active")))
      .orderBy(desc(lenaSessions.updatedAt))
      .limit(1);
  }

  if (!rows || rows.length === 0) return null;
  const row = rows[0];

  const session: LenaSession = {
    establishmentName: row.establishmentName ?? undefined,
    city: row.city ?? undefined,
    currentStep: (row.currentStep as LenaSession["currentStep"]) ?? "ACCUEIL",
    collectedData: row.collectedData ? JSON.parse(row.collectedData) : {},
    scoutBriefing: row.scoutBriefing ?? undefined,
    fieldReportId: row.fieldReportId ?? undefined,
  };

  const history: LenaMessage[] = row.history ? JSON.parse(row.history) : [];

  return { session, history, sessionKey: row.sessionKey };
}

// ─── Lister les sessions actives d'un utilisateur ────────────────────────────
export async function listLenaSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(lenaSessions)
    .where(and(eq(lenaSessions.userId, userId), eq(lenaSessions.status, "active")))
    .orderBy(desc(lenaSessions.updatedAt))
    .limit(10);
}

// ─── Clôturer une session ─────────────────────────────────────────────────────
export async function closeLenaSession(userId: number, sessionKey: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(lenaSessions)
    .set({ status: "completed" })
    .where(and(eq(lenaSessions.userId, userId), eq(lenaSessions.sessionKey, sessionKey)));
}

// ─── Générer une clé de session unique ───────────────────────────────────────
export function generateSessionKey(): string {
  return `lena_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
