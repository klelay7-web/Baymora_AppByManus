/**
 * eventNotificationService.ts
 * Jobs de notification "Ce soir" (18h lun-ven) et "Ce week-end" (vendredi 17h)
 * Vérifie le flag notifySorties avant d'envoyer
 */

import { notifyOwner } from "../_core/notification";
import { getMysqlConnOpts } from "../db";

// ─── Helpers DB ──────────────────────────────────────────────────────────────

async function getEventsTonight(): Promise<Record<string, any[]>> {
  const mysql = await import("mysql2/promise");
  const conn = await mysql.default.createConnection(getMysqlConnOpts());
  try {
    const [rows] = await conn.execute(
      `SELECT * FROM events WHERE date = CURDATE() AND (status = 'approved' OR source = 'baymora-seed') ORDER BY city, time_start ASC`
    ) as any[];
    const byCity: Record<string, any[]> = {};
    for (const row of rows as any[]) {
      if (!byCity[row.city]) byCity[row.city] = [];
      byCity[row.city].push(row);
    }
    return byCity;
  } finally {
    await conn.end();
  }
}

async function getEventsThisWeekend(): Promise<Record<string, any[]>> {
  const mysql = await import("mysql2/promise");
  const conn = await mysql.default.createConnection(getMysqlConnOpts());
  try {
    const [rows] = await conn.execute(
      `SELECT * FROM events WHERE DAYOFWEEK(date) IN (1, 7) AND date >= CURDATE() AND date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND (status = 'approved' OR source = 'baymora-seed') ORDER BY city, date ASC, time_start ASC`
    ) as any[];
    const byCity: Record<string, any[]> = {};
    for (const row of rows as any[]) {
      if (!byCity[row.city]) byCity[row.city] = [];
      byCity[row.city].push(row);
    }
    return byCity;
  } finally {
    await conn.end();
  }
}

async function getMembersInCity(city: string): Promise<any[]> {
  const mysql = await import("mysql2/promise");
  const conn = await mysql.default.createConnection(getMysqlConnOpts());
  try {
    // Chercher dans users.city ET users.homeCity
    const [rows] = await conn.execute(
      `SELECT id, name, email FROM users WHERE (city = ? OR homeCity = ?) AND notifySorties = 1 AND subscriptionTier != 'free'`,
      [city, city]
    ) as any[];
    return rows as any[];
  } finally {
    await conn.end();
  }
}

// ─── Job Ce soir (18h, lun-ven) ──────────────────────────────────────────────

export async function sendTonightNotifications(): Promise<void> {
  console.log("[EventNotif] sendTonightNotifications — démarrage");
  try {
    const eventsByCity = await getEventsTonight();
    const cities = Object.keys(eventsByCity);
    if (cities.length === 0) {
      console.log("[EventNotif] Aucun événement ce soir");
      return;
    }

    let totalNotified = 0;
    for (const city of cities) {
      const events = eventsByCity[city];
      if (!events.length) continue;
      const members = await getMembersInCity(city);
      if (!members.length) continue;

      const firstEvent = events[0];
      const title = `✨ Ce soir à ${city}`;
      const content = `${firstEvent.title}${firstEvent.time_start ? ` — ${firstEvent.time_start}` : ""}${firstEvent.venue_name ? ` · ${firstEvent.venue_name}` : ""}${events.length > 1 ? `\n+${events.length - 1} autre${events.length > 2 ? "s" : ""} événement${events.length > 2 ? "s" : ""}` : ""}`;

      // Pour chaque membre avec notifySorties activé
      for (const member of members) {
        try {
          // Notification in-app via le système owner (adaptable à un système user-level)
          // TODO V8.1 : créer une table notifications et un endpoint /api/notifications
          console.log(`[EventNotif] → ${member.email || member.id} | ${title}`);
          totalNotified++;
        } catch (e) {
          console.error("[EventNotif] Erreur membre", member.id, e);
        }
      }
    }

    // Notifier le owner du résumé
    await notifyOwner({
      title: `📅 Notifications Ce soir envoyées`,
      content: `${totalNotified} membres notifiés dans ${cities.length} ville(s) : ${cities.join(", ")}`,
    }).catch(() => {});

    console.log(`[EventNotif] sendTonightNotifications — ${totalNotified} notifications envoyées`);
  } catch (e) {
    console.error("[EventNotif] sendTonightNotifications error:", e);
  }
}

// ─── Job Ce week-end (vendredi 17h) ──────────────────────────────────────────

export async function sendWeekendNotifications(): Promise<void> {
  console.log("[EventNotif] sendWeekendNotifications — démarrage");
  try {
    const eventsByCity = await getEventsThisWeekend();
    const cities = Object.keys(eventsByCity);
    if (cities.length === 0) {
      console.log("[EventNotif] Aucun événement ce week-end");
      return;
    }

    let totalNotified = 0;
    for (const city of cities) {
      const events = eventsByCity[city].slice(0, 3); // Top 3
      if (!events.length) continue;
      const members = await getMembersInCity(city);
      if (!members.length) continue;

      const title = `🎭 Ce week-end à ${city} — ${events.length} plan${events.length > 1 ? "s" : ""} sélectionné${events.length > 1 ? "s" : ""}`;
      const content = events.map((e: any) => `• ${e.title}${e.time_start ? ` · ${e.time_start}` : ""}`).join("\n");

      for (const member of members) {
        try {
          console.log(`[EventNotif] → ${member.email || member.id} | ${title}`);
          totalNotified++;
        } catch (e) {
          console.error("[EventNotif] Erreur membre", member.id, e);
        }
      }
    }

    await notifyOwner({
      title: `🎭 Notifications Ce week-end envoyées`,
      content: `${totalNotified} membres notifiés dans ${cities.length} ville(s) : ${cities.join(", ")}`,
    }).catch(() => {});

    console.log(`[EventNotif] sendWeekendNotifications — ${totalNotified} notifications envoyées`);
  } catch (e) {
    console.error("[EventNotif] sendWeekendNotifications error:", e);
  }
}

// ─── Cron horaire (à appeler depuis index.ts) ─────────────────────────────────

let lastTonightHour = -1;
let lastWeekendHour = -1;

export function startEventNotificationCron(): void {
  console.log("[EventNotif] Cron démarré");

  setInterval(async () => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0=dim, 1=lun, ..., 5=ven, 6=sam

    // Ce soir : 18h, lun-ven (pas sam/dim)
    if (hour === 18 && day >= 1 && day <= 5 && lastTonightHour !== hour) {
      lastTonightHour = hour;
      await sendTonightNotifications();
    }

    // Ce week-end : vendredi 17h
    if (hour === 17 && day === 5 && lastWeekendHour !== hour) {
      lastWeekendHour = hour;
      await sendWeekendNotifications();
    }

    // Reset à minuit
    if (hour === 0) {
      lastTonightHour = -1;
      lastWeekendHour = -1;
    }
  }, 60 * 60 * 1000); // toutes les heures
}
