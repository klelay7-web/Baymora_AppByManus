/**
 * Email Service — Baymora
 * Utilise Resend pour les emails transactionnels
 * API key configurée via RESEND_API_KEY dans les variables d'environnement
 */

import type { UpcomingAlert } from './birthdayCron';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'Baymora <contact@baymora.com>';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL] RESEND_API_KEY non configurée — email simulé pour: ${to}`);
    console.log(`[EMAIL] Sujet: ${subject}`);
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[EMAIL] Erreur Resend (${res.status}): ${err}`);
      return false;
    }

    const data = await res.json() as { id: string };
    console.log(`[EMAIL] Envoyé → ${to} (id: ${data.id})`);
    return true;
  } catch (err) {
    console.error('[EMAIL] Erreur réseau:', err);
    return false;
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: #080c14;
  color: #ffffff;
  margin: 0;
  padding: 0;
`;

const cardStyle = `
  max-width: 560px;
  margin: 40px auto;
  background: linear-gradient(145deg, #0f1520, #0a1018);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  overflow: hidden;
`;

const headerStyle = `
  background: linear-gradient(135deg, #1a2035 0%, #0f1520 100%);
  padding: 32px 32px 24px;
  text-align: center;
  border-bottom: 1px solid rgba(255,255,255,0.06);
`;

const contentStyle = `
  padding: 32px;
`;

const btnStyle = `
  display: inline-block;
  background: #c8a94a;
  color: #000000;
  font-weight: 700;
  font-size: 14px;
  padding: 14px 28px;
  border-radius: 12px;
  text-decoration: none;
  letter-spacing: 0.3px;
`;

const footerStyle = `
  padding: 20px 32px;
  text-align: center;
  border-top: 1px solid rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.25);
  font-size: 11px;
`;

function emailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Baymora</title>
</head>
<body style="${baseStyle}">
  <div style="${cardStyle}">
    <div style="${headerStyle}">
      <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,rgba(200,169,74,0.3),rgba(200,169,74,0.1));border:1px solid rgba(200,169,74,0.3);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
        <span style="font-weight:800;font-size:18px;color:#c8a94a;">B</span>
      </div>
      <div style="font-size:11px;color:rgba(200,169,74,0.8);letter-spacing:2px;text-transform:uppercase;font-weight:600;">Baymora</div>
    </div>
    <div style="${contentStyle}">
      ${content}
    </div>
    <div style="${footerStyle}">
      Baymora · Conciergerie de voyage privée<br>
      <a href="https://baymora.com" style="color:rgba(200,169,74,0.5);text-decoration:none;">baymora.com</a>
      · <a href="https://baymora.com/unsubscribe" style="color:rgba(255,255,255,0.2);text-decoration:none;">Se désabonner</a>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email de bienvenue ───────────────────────────────────────────────────────

export async function sendWelcomeEmail(email: string, prenom?: string): Promise<boolean> {
  const name = prenom || 'Voyageur';
  const subject = `Bienvenue chez Baymora, ${name}`;

  const content = `
    <h1 style="font-size:22px;font-weight:700;color:#ffffff;margin:0 0 8px;">
      Bienvenue, ${name} ✦
    </h1>
    <p style="color:rgba(255,255,255,0.55);font-size:14px;line-height:1.6;margin:0 0 24px;">
      Votre conciergerie de voyage privée est prête. Baymora mémorise vos préférences, celles de vos proches, et anticipe ce qui compte pour vous.
    </p>

    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:20px;margin:0 0 24px;">
      <p style="color:rgba(255,255,255,0.40);font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 14px;font-weight:600;">Ce que Baymora fait pour vous</p>
      ${[
        ['🧠', 'Mémoire intelligente', 'Vos proches, leurs allergies, leurs dates clés. Vous ne répétez jamais.'],
        ['✈️', 'Planification complète', 'De l\'inspiration au carnet de voyage, en quelques échanges.'],
        ['🔒', 'Discrétion absolue', 'Vos données vous appartiennent. Hébergé en Europe.'],
        ['📅', 'Toujours un tour d\'avance', 'Anniversaires, réservations à anticiper — Baymora vous alerte.'],
      ].map(([icon, title, desc]) => `
        <div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start;">
          <span style="font-size:18px;flex-shrink:0;">${icon}</span>
          <div>
            <p style="color:#ffffff;font-weight:600;font-size:13px;margin:0 0 2px;">${title}</p>
            <p style="color:rgba(255,255,255,0.45);font-size:12px;margin:0;">${desc}</p>
          </div>
        </div>
      `).join('')}
    </div>

    <div style="text-align:center;margin-bottom:8px;">
      <a href="https://baymora.com/chat" style="${btnStyle}">
        Commencer mon voyage →
      </a>
    </div>
    <p style="color:rgba(255,255,255,0.25);font-size:11px;text-align:center;margin:12px 0 0;">
      Des questions ? Répondez directement à cet email.
    </p>
  `;

  return sendEmail(email, subject, emailTemplate(content));
}

// ─── Email d'alerte anniversaire / date importante ────────────────────────────

export async function sendBirthdayAlertEmail(
  email: string,
  prenom: string | null,
  alert: UpcomingAlert
): Promise<boolean> {
  const name = prenom || 'Voyageur';
  const when = alert.daysLeft === 0
    ? "c'est <strong style=\"color:#c8a94a;\">aujourd'hui</strong> !"
    : alert.daysLeft === 1
    ? "c'est <strong style=\"color:#c8a94a;\">demain</strong>"
    : `c'est dans <strong style="color:#c8a94a;">${alert.daysLeft} jours</strong>`;

  const subject = alert.daysLeft <= 1
    ? `⏰ ${alert.label} — ${alert.daysLeft === 0 ? "Aujourd'hui !" : "Demain !"}`
    : `📅 Rappel : ${alert.label} dans ${alert.daysLeft} jours`;

  const content = `
    <h1 style="font-size:20px;font-weight:700;color:#ffffff;margin:0 0 6px;">
      ${alert.daysLeft === 0 ? '🎉' : alert.daysLeft <= 7 ? '⏰' : '📅'} Rappel important
    </h1>
    <p style="color:rgba(255,255,255,0.55);font-size:14px;line-height:1.6;margin:0 0 20px;">
      Bonjour ${name},
    </p>

    <div style="background:linear-gradient(135deg,rgba(200,169,74,0.1),rgba(200,169,74,0.05));border:1px solid rgba(200,169,74,0.2);border-radius:14px;padding:20px;margin:0 0 24px;">
      <p style="color:#c8a94a;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;font-weight:600;">Événement à ne pas manquer</p>
      <p style="color:#ffffff;font-size:18px;font-weight:700;margin:0 0 6px;">${alert.label}</p>
      ${alert.contactName ? `<p style="color:rgba(255,255,255,0.50);font-size:13px;margin:0 0 8px;">${alert.contactName}</p>` : ''}
      <p style="color:rgba(255,255,255,0.70);font-size:14px;margin:0;">
        ${when}
      </p>
    </div>

    <div style="text-align:center;margin-bottom:16px;">
      <a href="${alert.googleCalendarUrl}" style="${btnStyle}">
        📅 Ajouter à mon agenda
      </a>
    </div>

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:16px;text-align:center;">
      <p style="color:rgba(255,255,255,0.40);font-size:12px;margin:0 0 8px;">
        Besoin d'organiser quelque chose de spécial ?
      </p>
      <a href="https://baymora.com/chat" style="color:#c8a94a;font-size:13px;font-weight:600;text-decoration:none;">
        Planifier avec Baymora →
      </a>
    </div>
  `;

  return sendEmail(email, subject, emailTemplate(content));
}
