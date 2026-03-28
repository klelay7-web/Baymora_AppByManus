/**
 * Cron job : détection des anniversaires et dates importantes
 * Tourne toutes les 24h, vérifie si des dates tombent dans les 7 jours
 * Log les alertes (à brancher sur email/notification Phase 2)
 */

import { prisma } from '../db';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function parseDateDDMM(str: string): { day: number; month: number } | null {
  // Formats supportés: DD/MM, DD/MM/YYYY, YYYY-MM-DD
  const parts = str.split(/[-/]/);
  if (parts.length >= 2) {
    const a = parseInt(parts[0]);
    const b = parseInt(parts[1]);
    if (!isNaN(a) && !isNaN(b)) {
      if (str.includes('-') && parts[0].length === 4) {
        // YYYY-MM-DD
        return { day: parseInt(parts[2]), month: b };
      }
      return { day: a, month: b };
    }
  }
  return null;
}

function daysUntilNextOccurrence(day: number, month: number): number {
  const today = new Date();
  const target = new Date(today.getFullYear(), month - 1, day);
  if (target < today) {
    target.setFullYear(today.getFullYear() + 1);
  }
  const diff = target.getTime() - today.getTime();
  return Math.floor(diff / 86400000);
}

// ─── Core ─────────────────────────────────────────────────────────────────────

export async function checkUpcomingDates(): Promise<void> {
  try {
    console.log('[CRON] Vérification des dates importantes...');

    const alerts: {
      userId: string;
      userPseudo: string;
      label: string;
      contactName?: string;
      daysLeft: number;
    }[] = [];

    // 1. Dates importantes (anniversaires, événements)
    const allDates = await prisma.importantDate.findMany({
      where: { recurring: true },
      include: { user: { select: { id: true, pseudo: true, prenom: true, email: true } } },
    });

    for (const d of allDates) {
      const parsed = parseDateDDMM(d.date);
      if (!parsed) continue;
      const days = daysUntilNextOccurrence(parsed.day, parsed.month);
      if (days <= 7) {
        alerts.push({
          userId: d.userId,
          userPseudo: d.user.prenom || d.user.pseudo,
          label: d.label,
          contactName: d.contactName ?? undefined,
          daysLeft: days,
        });
      }
    }

    // 2. Anniversaires des compagnons de voyage
    const companions = await prisma.travelCompanion.findMany({
      where: { birthday: { not: null } },
      include: { user: { select: { id: true, pseudo: true, prenom: true, email: true } } },
    });

    for (const c of companions) {
      if (!c.birthday) continue;
      const parsed = parseDateDDMM(c.birthday);
      if (!parsed) continue;
      const days = daysUntilNextOccurrence(parsed.day, parsed.month);
      if (days <= 7) {
        alerts.push({
          userId: c.userId,
          userPseudo: c.user.prenom || c.user.pseudo,
          label: `Anniversaire de ${c.name}`,
          contactName: c.name,
          daysLeft: days,
        });
      }
    }

    // Log des alertes (à remplacer par email/push en Phase 2)
    if (alerts.length === 0) {
      console.log('[CRON] Aucune date dans les 7 prochains jours.');
    } else {
      console.log(`[CRON] ${alerts.length} alerte(s) trouvée(s):`);
      for (const a of alerts) {
        const when = a.daysLeft === 0 ? "aujourd'hui !" : a.daysLeft === 1 ? 'demain' : `dans ${a.daysLeft} jours`;
        console.log(`  → [${a.userPseudo}] ${a.label}${a.contactName ? ` (${a.contactName})` : ''} — ${when}`);
        // TODO Phase 2: envoyer un email à l'utilisateur via Resend/SendGrid
        // await sendBirthdayAlert(a);
      }
    }
  } catch (error) {
    console.error('[CRON] Erreur vérification dates:', error);
  }
}

// ─── Démarrage du cron ────────────────────────────────────────────────────────

export function startBirthdayCron(): void {
  const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h

  // Premier check au démarrage (après 5s pour laisser la DB se connecter)
  setTimeout(checkUpcomingDates, 5000);

  // Puis toutes les 24h
  setInterval(checkUpcomingDates, INTERVAL_MS);

  console.log('[CRON] Birthday cron démarré (interval: 24h)');
}
