/**
 * Cron job : détection des anniversaires et dates importantes
 * Fenêtres d'alerte : J-30 (1 mois avant) et J-7 (1 semaine avant)
 * Génère des liens Google Calendar pour chaque événement
 */

import { prisma } from '../db';
import { sendBirthdayAlertEmail } from './email';
import { sendNotification, NotifTemplates } from './sms';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UpcomingAlert {
  userId: string;
  userEmail?: string | null;
  label: string;
  contactName?: string;
  daysLeft: number;
  alertWindow: 30 | 7 | 0 | 1;
  nextDate: string; // YYYYMMDD
  googleCalendarUrl: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function parseDateDDMM(str: string): { day: number; month: number } | null {
  if (!str) return null;
  const parts = str.split(/[-/]/);
  if (parts.length >= 2) {
    const a = parseInt(parts[0]);
    const b = parseInt(parts[1]);
    if (!isNaN(a) && !isNaN(b)) {
      if (str.includes('-') && parts[0].length === 4) {
        return { day: parseInt(parts[2]), month: b }; // YYYY-MM-DD
      }
      return { day: a, month: b }; // DD/MM or DD/MM/YYYY
    }
  }
  return null;
}

export function nextOccurrence(day: number, month: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(today.getFullYear(), month - 1, day);
  if (target <= today) target.setFullYear(today.getFullYear() + 1);
  return target;
}

export function daysUntil(target: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function toGCalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

export function buildGoogleCalendarUrl(params: {
  title: string;
  date: Date;
  description?: string;
}): string {
  const dateStr = toGCalDate(params.date);
  // All-day event: dates = YYYYMMDD/YYYYMMDD (next day for exclusive end)
  const nextDay = new Date(params.date);
  nextDay.setDate(nextDay.getDate() + 1);
  const endStr = toGCalDate(nextDay);

  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: params.title,
    dates: `${dateStr}/${endStr}`,
    details: params.description || `Rappel Baymora — ${params.title}`,
    ctz: 'Europe/Paris',
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

// ─── Upcoming dates pour un utilisateur donné ─────────────────────────────────

export async function getUpcomingForUser(userId: string): Promise<UpcomingAlert[]> {
  const alerts: UpcomingAlert[] = [];

  const [dates, companions, user] = await Promise.all([
    prisma.importantDate.findMany({ where: { userId, recurring: true } }),
    prisma.travelCompanion.findMany({ where: { userId, birthday: { not: null } } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ]);

  // Dates importantes
  for (const d of dates) {
    const parsed = parseDateDDMM(d.date);
    if (!parsed) continue;
    const next = nextOccurrence(parsed.day, parsed.month);
    const days = daysUntil(next);
    if (days <= 30) {
      alerts.push({
        userId,
        userEmail: user?.email,
        label: d.label,
        contactName: d.contactName ?? undefined,
        daysLeft: days,
        alertWindow: days <= 1 ? (days === 0 ? 0 : 1) : days <= 7 ? 7 : 30,
        nextDate: toGCalDate(next),
        googleCalendarUrl: buildGoogleCalendarUrl({
          title: d.label + (d.contactName ? ` — ${d.contactName}` : ''),
          date: next,
          description: `${d.label}${d.contactName ? ` (${d.contactName})` : ''}. Rappel généré par Baymora.`,
        }),
      });
    }
  }

  // Anniversaires compagnons
  for (const c of companions) {
    if (!c.birthday) continue;
    const parsed = parseDateDDMM(c.birthday);
    if (!parsed) continue;
    const next = nextOccurrence(parsed.day, parsed.month);
    const days = daysUntil(next);
    if (days <= 30) {
      const title = `Anniversaire de ${c.name}`;
      alerts.push({
        userId,
        userEmail: user?.email,
        label: title,
        contactName: c.name,
        daysLeft: days,
        alertWindow: days <= 1 ? (days === 0 ? 0 : 1) : days <= 7 ? 7 : 30,
        nextDate: toGCalDate(next),
        googleCalendarUrl: buildGoogleCalendarUrl({
          title,
          date: next,
          description: `Anniversaire de ${c.name}. N'oubliez pas de prévoir quelque chose de spécial ! Rappel généré par Baymora.`,
        }),
      });
    }
  }

  return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
}

// ─── Core cron ────────────────────────────────────────────────────────────────

export async function checkUpcomingDates(): Promise<void> {
  try {
    console.log('[CRON] Vérification des dates importantes...');

    // Charger tous les utilisateurs avec dates ou compagnons avec birthday
    const usersWithDates = await prisma.user.findMany({
      where: {
        OR: [
          { dates: { some: { recurring: true } } },
          { companions: { some: { birthday: { not: null } } } },
        ],
      },
      select: {
        id: true, pseudo: true, prenom: true, email: true,
        phone: true, notifSms: true, notifWhatsApp: true, notifBirthdays: true,
      },
    });

    let totalAlerts = 0;

    for (const user of usersWithDates) {
      const upcoming = await getUpcomingForUser(user.id);
      // Filtrer seulement les alertes J-30 et J-7 (pas les intermédiaires)
      const toAlert = upcoming.filter(a => a.daysLeft === 30 || a.daysLeft === 7 || a.daysLeft === 1 || a.daysLeft === 0);

      for (const alert of toAlert) {
        totalAlerts++;
        const when = alert.daysLeft === 0 ? "aujourd'hui !"
          : alert.daysLeft === 1 ? 'demain'
          : `dans ${alert.daysLeft} jour${alert.daysLeft > 1 ? 's' : ''}`;

        console.log(`[CRON] [${user.prenom || user.pseudo}] ${alert.label} — ${when}`);
        console.log(`       Google Calendar: ${alert.googleCalendarUrl}`);

        if (user.email) {
          await sendBirthdayAlertEmail(user.email, user.prenom, alert);
        }

        // Notification SMS/WhatsApp si activé et que c'est un anniversaire J-0
        if (user.phone && user.notifBirthdays && alert.daysLeft === 0 && alert.contactName) {
          const name = user.prenom ?? user.pseudo;
          await sendNotification(
            { phone: user.phone, notifSms: user.notifSms, notifWhatsApp: user.notifWhatsApp },
            NotifTemplates.birthdayAlert(name, alert.contactName, alert.label),
          );
        }
      }
    }

    if (totalAlerts === 0) {
      console.log('[CRON] Aucune alerte J-30 ou J-7 aujourd\'hui.');
    } else {
      console.log(`[CRON] ${totalAlerts} alerte(s) envoyée(s).`);
    }
  } catch (error) {
    console.error('[CRON] Erreur:', error);
  }
}

// ─── Démarrage ────────────────────────────────────────────────────────────────

export function startBirthdayCron(): void {
  // Premier check au boot (délai 10s pour laisser la DB se connecter)
  setTimeout(checkUpcomingDates, 10000);
  // Toutes les 24h
  setInterval(checkUpcomingDates, 24 * 60 * 60 * 1000);
  console.log('[CRON] Birthday cron démarré — alertes J-30 et J-7');
}
