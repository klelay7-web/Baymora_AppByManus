/**
 * RETENTION SERVICE — Baymora
 *
 * Gestion des résiliations avec période de grâce de 90 jours :
 *
 * 1. Résiliation → le compte passe en "découverte", données conservées 90 jours
 * 2. Pendant 90 jours → le client peut revenir et réactiver son plan
 * 3. Après 90 jours → purge automatique des données (conversations, trips, companions)
 * 4. Email de réactivation envoyé à J+7, J+30, J+60
 */

import { prisma } from '../db';
import { upgradeUserPlan } from './credits';
import { sendEmail } from './email';
import type { BaymoraCircle } from '../types';
import { PLANS } from '../types';

const RETENTION_DAYS = 90;

// ─── Résiliation ─────────────────────────────────────────────────────────────

export async function cancelSubscription(userId: string, reason?: string): Promise<void> {
  const now = new Date();
  const purgeDate = new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);

  // Downgrade vers Découverte mais garder les données
  await prisma.user.update({
    where: { id: userId },
    data: {
      circle: 'decouverte',
      creditsLimit: PLANS.decouverte.creditsLimit,
      perplexityLimit: PLANS.decouverte.perplexityLimit,
      creditsUsed: 0,
      perplexityUsed: 0,
      stripeSubscriptionId: null,
      cancelledAt: now,
      purgeAt: purgeDate,
      cancelReason: reason || null,
    },
  });

  // Email de confirmation
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.email) {
    await sendCancellationEmail(user.email, user.prenom, purgeDate);
  }

  console.log(`[RETENTION] Résiliation user ${userId} — données conservées jusqu'au ${purgeDate.toISOString().split('T')[0]}`);
}

// ─── Réactivation ────────────────────────────────────────────────────────────

export async function reactivateSubscription(userId: string, circle: BaymoraCircle): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;

  // Vérifier qu'on est dans la fenêtre de rétention
  if (user.purgeAt && user.purgeAt < new Date()) {
    return false; // Trop tard, données purgées
  }

  // Réactiver : supprimer les dates de résiliation
  await prisma.user.update({
    where: { id: userId },
    data: {
      cancelledAt: null,
      purgeAt: null,
      cancelReason: null,
    },
  });

  // Upgrade vers le plan choisi
  await upgradeUserPlan(userId, circle);

  console.log(`[RETENTION] Réactivation user ${userId} → ${circle}`);
  return true;
}

// ─── Purge automatique (à appeler via cron) ──────────────────────────────────

export async function purgeExpiredAccounts(): Promise<number> {
  const now = new Date();

  // Trouver les comptes dont la purge est passée
  const expiredUsers = await prisma.user.findMany({
    where: {
      purgeAt: { lte: now },
      cancelledAt: { not: null },
    },
    select: { id: true, pseudo: true, email: true },
  });

  if (expiredUsers.length === 0) return 0;

  for (const user of expiredUsers) {
    // Supprimer les données liées (les cascades Prisma s'en chargent)
    await prisma.user.delete({ where: { id: user.id } });
    console.log(`[RETENTION] Purge définitive: ${user.pseudo} (${user.email || 'pas d\'email'})`);
  }

  console.log(`[RETENTION] ${expiredUsers.length} compte(s) purgé(s)`);
  return expiredUsers.length;
}

// ─── Vérification : est-ce que le compte est en rétention ? ──────────────────

export function isInRetention(user: { cancelledAt: Date | null; purgeAt: Date | null }): boolean {
  return !!user.cancelledAt && !!user.purgeAt && user.purgeAt > new Date();
}

export function retentionDaysLeft(user: { purgeAt: Date | null }): number {
  if (!user.purgeAt) return 0;
  const diff = user.purgeAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

// ─── Emails de rétention ─────────────────────────────────────────────────────

async function sendCancellationEmail(email: string, prenom: string | null, purgeDate: Date): Promise<void> {
  const name = prenom || 'Voyageur';
  const dateStr = purgeDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const subject = `${name}, vos données Baymora sont conservées`;
  const html = `
<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f3ef;margin:0;padding:0;">
<div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #e8e3da;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#1a1e2e,#0f1420);padding:32px;text-align:center;">
    <div style="width:48px;height:48px;border-radius:50%;background:rgba(200,169,74,0.2);border:1px solid rgba(200,169,74,0.4);text-align:center;line-height:48px;margin:0 auto 12px;">
      <span style="font-weight:800;font-size:18px;color:#c8a94a;">B</span>
    </div>
  </div>
  <div style="padding:32px;">
    <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 12px;">Nous gardons tout pour vous</h1>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
      ${name}, votre abonnement est résilié mais <strong>vos données sont conservées jusqu'au ${dateStr}</strong>.
    </p>
    <div style="background:#faf9f7;border:1px solid #e8e3da;border-radius:12px;padding:20px;margin:0 0 24px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td style="padding:0 0 8px;">
          <span style="color:#1a1a1a;font-weight:600;font-size:14px;">Ce qui vous attend si vous revenez :</span>
        </td></tr>
        <tr><td style="color:#555;font-size:13px;padding:4px 0;">✓ Toutes vos conversations intactes</td></tr>
        <tr><td style="color:#555;font-size:13px;padding:4px 0;">✓ Vos compagnons de voyage et dates importantes</td></tr>
        <tr><td style="color:#555;font-size:13px;padding:4px 0;">✓ Vos plans de voyage sauvegardés</td></tr>
        <tr><td style="color:#555;font-size:13px;padding:4px 0;">✓ Vos points Club conservés</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin-bottom:12px;">
      <a href="https://baymora.com/chat" style="display:inline-block;background:#c8a94a;color:#000;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
        Revenir à Baymora →
      </a>
    </div>
    <p style="color:#999;font-size:12px;text-align:center;">
      Après le ${dateStr}, vos données seront définitivement supprimées.
    </p>
  </div>
  <div style="padding:16px 32px;text-align:center;border-top:1px solid #e8e3da;background:#faf9f7;">
    <span style="color:#999;font-size:11px;">Baymora · Conciergerie de voyage privée</span>
  </div>
</div>
</body></html>`;

  await sendEmail(email, subject, html);
}

// ─── Emails de relance J+7, J+30, J+60 ──────────────────────────────────────

export async function checkRetentionEmails(): Promise<number> {
  const now = new Date();
  let sent = 0;

  for (const daysAgo of [7, 30, 60]) {
    const targetDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const dayBefore = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000);

    // Users résiliés il y a exactement N jours (fenêtre de 24h)
    const users = await prisma.user.findMany({
      where: {
        cancelledAt: { gte: dayBefore, lt: targetDate },
        purgeAt: { not: null },
        email: { not: null },
      },
      select: { id: true, email: true, prenom: true, purgeAt: true, cancelReason: true },
    });

    for (const user of users) {
      if (!user.email) continue;
      const daysLeft = user.purgeAt ? retentionDaysLeft(user) : 0;

      if (daysAgo === 7) {
        await sendRetentionEmailJ7(user.email, user.prenom, daysLeft);
      } else if (daysAgo === 30) {
        await sendRetentionEmailJ30(user.email, user.prenom, daysLeft);
      } else if (daysAgo === 60) {
        await sendRetentionEmailJ60(user.email, user.prenom, daysLeft);
      }
      sent++;
    }
  }

  if (sent > 0) console.log(`[RETENTION] ${sent} email(s) de relance envoyé(s)`);
  return sent;
}

async function sendRetentionEmailJ7(email: string, prenom: string | null, daysLeft: number): Promise<void> {
  const name = prenom || 'Voyageur';
  await sendEmail(email, `${name}, on pense à vous`, buildRetentionHtml(name,
    'Une semaine sans Baymora...',
    `Vos préférences, vos compagnons de voyage et vos plans sont toujours là. Il vous reste <strong>${daysLeft} jours</strong> pour revenir.`,
    'Retrouver mon compte →',
  ));
}

async function sendRetentionEmailJ30(email: string, prenom: string | null, daysLeft: number): Promise<void> {
  const name = prenom || 'Voyageur';
  await sendEmail(email, `${name}, vos voyages vous attendent`, buildRetentionHtml(name,
    'Ça fait un mois...',
    `Votre conciergerie est en pause mais vos données sont intactes. Plus que <strong>${daysLeft} jours</strong> avant la suppression.<br><br><strong>Offre de retour : -50% sur votre premier mois</strong> si vous réactivez maintenant.`,
    'Réactiver avec -50% →',
  ));
}

async function sendRetentionEmailJ60(email: string, prenom: string | null, daysLeft: number): Promise<void> {
  const name = prenom || 'Voyageur';
  await sendEmail(email, `Dernier rappel — ${name}, vos données seront supprimées`, buildRetentionHtml(name,
    'Dernier rappel avant suppression',
    `Il ne reste que <strong>${daysLeft} jours</strong> avant la suppression définitive de votre compte, vos conversations, vos compagnons de voyage et vos plans sauvegardés.<br><br>Après cette date, tout sera perdu.`,
    'Sauver mon compte →',
  ));
}

function buildRetentionHtml(name: string, title: string, body: string, ctaText: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,sans-serif;background:#f5f3ef;margin:0;padding:0;">
<div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #e8e3da;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#1a1e2e,#0f1420);padding:32px;text-align:center;">
    <span style="font-weight:800;font-size:24px;color:#c8a94a;">B</span>
  </div>
  <div style="padding:32px;">
    <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 12px;">${title}</h1>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">${body}</p>
    <div style="text-align:center;margin-bottom:12px;">
      <a href="https://baymora.com/chat" style="display:inline-block;background:#c8a94a;color:#000;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">${ctaText}</a>
    </div>
  </div>
  <div style="padding:16px 32px;text-align:center;border-top:1px solid #e8e3da;background:#faf9f7;">
    <span style="color:#999;font-size:11px;">Baymora · Conciergerie de voyage privée</span>
  </div>
</div></body></html>`;
}

// ─── Nettoyage sessions guest expirées ───────────────────────────────────────

export async function cleanupExpiredGuestSessions(): Promise<number> {
  const result = await prisma.guestSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  if (result.count > 0) {
    console.log(`[RETENTION] ${result.count} session(s) guest expirée(s) supprimée(s)`);
  }
  return result.count;
}
