/**
 * Email Service — Baymora
 * Utilise Resend pour les emails transactionnels
 * API key configurée via RESEND_API_KEY dans les variables d'environnement
 */

import type { UpcomingAlert } from './birthdayCron';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'Baymora <contact@baymora.com>';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
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

// IMPORTANT : Les clients email (Gmail, Apple Mail, Outlook) ne supportent pas :
// - display:flex → utiliser des tables
// - rgba() partout → préférer des hex solides
// - fond sombre → illisible sur mobile → fond BLANC avec accents dorés

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  background-color: #f5f3ef;
  color: #1a1a1a;
  margin: 0;
  padding: 0;
  -webkit-text-size-adjust: 100%;
`;

const cardStyle = `
  max-width: 560px;
  margin: 32px auto;
  background: #ffffff;
  border: 1px solid #e8e3da;
  border-radius: 16px;
  overflow: hidden;
`;

const headerStyle = `
  background: linear-gradient(135deg, #1a1e2e 0%, #0f1420 100%);
  padding: 32px 32px 24px;
  text-align: center;
`;

const contentStyle = `
  padding: 32px;
`;

const btnStyle = `
  display: inline-block;
  background: #c8a94a;
  color: #000000;
  font-weight: 700;
  font-size: 15px;
  padding: 14px 32px;
  border-radius: 10px;
  text-decoration: none;
  letter-spacing: 0.3px;
`;

const footerStyle = `
  padding: 20px 32px;
  text-align: center;
  border-top: 1px solid #e8e3da;
  color: #999999;
  font-size: 11px;
  background: #faf9f7;
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
      <table cellpadding="0" cellspacing="0" border="0" align="center">
        <tr><td align="center">
          <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,rgba(200,169,74,0.4),rgba(200,169,74,0.15));border:1px solid rgba(200,169,74,0.4);text-align:center;line-height:48px;margin:0 auto 12px;">
            <span style="font-weight:800;font-size:18px;color:#c8a94a;">B</span>
          </div>
        </td></tr>
        <tr><td align="center">
          <span style="font-size:11px;color:rgba(200,169,74,0.9);letter-spacing:2px;text-transform:uppercase;font-weight:600;">Baymora</span>
        </td></tr>
      </table>
    </div>
    <div style="${contentStyle}">
      ${content}
    </div>
    <div style="${footerStyle}">
      Baymora · Conciergerie de voyage privée<br>
      <a href="https://baymora.com" style="color:#c8a94a;text-decoration:none;">baymora.com</a>
      · <a href="https://baymora.com/unsubscribe" style="color:#999999;text-decoration:none;">Se désabonner</a>
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
    <h1 style="font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">
      Bienvenue, ${name} ✦
    </h1>
    <p style="color:#555555;font-size:15px;line-height:1.6;margin:0 0 28px;">
      Votre conciergerie de voyage privée est prête. Baymora mémorise vos préférences, celles de vos proches, et anticipe ce qui compte pour vous.
    </p>

    <div style="background:#faf9f7;border:1px solid #e8e3da;border-radius:12px;padding:24px;margin:0 0 28px;">
      <p style="color:#999999;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px;font-weight:600;">Ce que Baymora fait pour vous</p>

      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        ${[
          ['🧠', 'Mémoire intelligente', 'Vos proches, leurs allergies, leurs dates clés. Vous ne répétez jamais.'],
          ['✈️', 'Planification complète', 'De l\'inspiration au carnet de voyage, en quelques échanges.'],
          ['🔒', 'Discrétion absolue', 'Vos données vous appartiennent. Hébergé en Europe.'],
          ['📅', 'Toujours un tour d\'avance', 'Anniversaires, réservations à anticiper — Baymora vous alerte.'],
        ].map(([icon, title, desc]) => `
          <tr>
            <td style="vertical-align:top;padding:0 12px 14px 0;width:28px;">
              <span style="font-size:20px;">${icon}</span>
            </td>
            <td style="vertical-align:top;padding:0 0 14px 0;">
              <p style="color:#1a1a1a;font-weight:600;font-size:14px;margin:0 0 2px;">${title}</p>
              <p style="color:#777777;font-size:13px;margin:0;line-height:1.4;">${desc}</p>
            </td>
          </tr>
        `).join('')}
      </table>
    </div>

    <div style="text-align:center;margin-bottom:12px;">
      <a href="https://baymora.com/chat" style="${btnStyle}">
        Commencer mon voyage →
      </a>
    </div>
    <p style="color:#999999;font-size:12px;text-align:center;margin:12px 0 0;">
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
    <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 6px;">
      ${alert.daysLeft === 0 ? '🎉' : alert.daysLeft <= 7 ? '⏰' : '📅'} Rappel important
    </h1>
    <p style="color:#555555;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Bonjour ${name},
    </p>

    <div style="background:#fdf8ed;border:1px solid #e8dbb8;border-radius:12px;padding:20px;margin:0 0 24px;">
      <p style="color:#a08a3c;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;font-weight:600;">Événement à ne pas manquer</p>
      <p style="color:#1a1a1a;font-size:20px;font-weight:700;margin:0 0 6px;">${alert.label}</p>
      ${alert.contactName ? `<p style="color:#777777;font-size:14px;margin:0 0 8px;">${alert.contactName}</p>` : ''}
      <p style="color:#333333;font-size:15px;margin:0;">
        ${when}
      </p>
    </div>

    <div style="text-align:center;margin-bottom:16px;">
      <a href="${alert.googleCalendarUrl}" style="${btnStyle}">
        📅 Ajouter à mon agenda
      </a>
    </div>

    <div style="background:#faf9f7;border:1px solid #e8e3da;border-radius:12px;padding:16px;text-align:center;">
      <p style="color:#777777;font-size:13px;margin:0 0 8px;">
        Besoin d'organiser quelque chose de spécial ?
      </p>
      <a href="https://baymora.com/chat" style="color:#c8a94a;font-size:14px;font-weight:600;text-decoration:none;">
        Planifier avec Baymora →
      </a>
    </div>
  `;

  return sendEmail(email, subject, emailTemplate(content));
}
