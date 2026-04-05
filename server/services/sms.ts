/**
 * Baymora — Service SMS / WhatsApp via Twilio
 */

import twilio from 'twilio';

// Lazy-init pour éviter l'erreur si les env vars ne sont pas définies en dev
let _client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (_client) return _client;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error('Twilio non configuré (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN manquants)');
  _client = twilio(sid, token);
  return _client;
}

function getTwilioPhone(): string {
  const phone = process.env.TWILIO_PHONE_NUMBER;
  if (!phone) throw new Error('TWILIO_PHONE_NUMBER manquant');
  return phone;
}

function getWhatsAppFrom(): string {
  // Twilio sandbox WhatsApp : "whatsapp:+14155238886"
  // Production : "whatsapp:+XXXXX" avec un numéro approuvé
  const phone = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER;
  if (!phone) throw new Error('TWILIO_WHATSAPP_NUMBER manquant');
  return `whatsapp:${phone}`;
}

// ─── Envoi SMS ────────────────────────────────────────────────────────────────

export async function sendSMS(to: string, body: string): Promise<void> {
  try {
    const client = getClient();
    const from = getTwilioPhone();
    await client.messages.create({ to, from, body });
    console.log(`[SMS] Envoyé à ${to}`);
  } catch (err) {
    console.error('[SMS] Erreur envoi:', err);
    throw err;
  }
}

// ─── Envoi WhatsApp ───────────────────────────────────────────────────────────

export async function sendWhatsApp(to: string, body: string): Promise<void> {
  try {
    const client = getClient();
    const from = getWhatsAppFrom();
    await client.messages.create({
      to: `whatsapp:${to}`,
      from,
      body,
    });
    console.log(`[WhatsApp] Envoyé à ${to}`);
  } catch (err) {
    console.error('[WhatsApp] Erreur envoi:', err);
    throw err;
  }
}

// ─── Dispatcher unifié ────────────────────────────────────────────────────────

interface NotifTarget {
  phone: string;
  notifSms?: boolean;
  notifWhatsApp?: boolean;
}

/**
 * Envoie via SMS et/ou WhatsApp selon les préférences du membre.
 * Utilise le mode le plus adapté si les deux sont actifs.
 */
export async function sendNotification(target: NotifTarget, body: string): Promise<void> {
  const errors: string[] = [];

  if (target.notifWhatsApp) {
    try { await sendWhatsApp(target.phone, body); }
    catch (e) { errors.push(`WhatsApp: ${e}`); }
  }

  if (target.notifSms && !target.notifWhatsApp) {
    // SMS seulement si WhatsApp n'est pas actif (pour éviter le doublon)
    try { await sendSMS(target.phone, body); }
    catch (e) { errors.push(`SMS: ${e}`); }
  }

  if (errors.length > 0) console.error('[NOTIF] Erreurs partielles:', errors);
}

// ─── Templates messages ───────────────────────────────────────────────────────

export const NotifTemplates = {

  flightReminder: (prenom: string, destination: string, date: string) =>
    `✈️ Baymora — Rappel voyage\nBonjour ${prenom} ! Votre départ pour ${destination} est demain (${date}). Bon voyage ! 🌍`,

  checkinReminder: (prenom: string, hotel: string, date: string) =>
    `🏨 Baymora — Check-in demain\nBonjour ${prenom} ! Rappel : check-in à ${hotel} demain (${date}). Bon séjour ! 🛎`,

  birthdayAlert: (prenom: string, name: string, relation: string) =>
    `🎂 Baymora — Anniversaire\nBonjour ${prenom} ! C'est l'anniversaire de ${name} (${relation}) aujourd'hui. Pensez à lui/elle ! 🎉`,

  partnerOffer: (prenom: string, partnerName: string, offerTitle: string, link: string) =>
    `✨ Baymora Club — Offre exclusive\nBonjour ${prenom} ! ${partnerName} vous propose : "${offerTitle}"\nRéservez via : ${link}`,

  welcome: (prenom: string, code: string) =>
    `💎 Bienvenue au Baymora Club, ${prenom} !\nVotre code d'invitation : ${code}\nPartagez-le et gagnez 150 Crystals par parrainage.`,

  pointsEarned: (prenom: string, points: number, total: number) =>
    `🌟 Baymora Club — +${points} Crystals !\nBonjour ${prenom} ! Vous avez gagné ${points} Crystals. Total : ${total} Crystals.`,
};
