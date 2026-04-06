/**
 * ─── Maison Baymora — Service Email ──────────────────────────────────────────
 *
 * Architecture :
 *  • Resend  → envoi transactionnel & marketing
 *  • Claude  → rédaction IA de tous les contenus email
 *
 * Équipes responsables dans Maison Baymora :
 *  • Département Communication (Claude Opus) — rédaction, ton, personnalisation
 *  • Département Acquisition (Claude Sonnet) — prospection, affiliations, partenaires
 *  • Département Fidélisation (Claude Sonnet) — relances, bons plans, suivi client
 *  • Département Opérations (Claude Haiku) — rapports internes, alertes équipe
 */

import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });
const resend = new Resend(process.env.RESEND_API_KEY || "");

// ─── Expéditeur par défaut ────────────────────────────────────────
const FROM_EMAIL = "Maison Baymora <hello@maisonbaymora.com>";
const FROM_TEAM = "Équipe Baymora <equipe@maisonbaymora.com>";
const FROM_PARTNERSHIPS = "Partenariats Baymora <partenaires@maisonbaymora.com>";

// ─── Types ────────────────────────────────────────────────────────
export type EmailType =
  | "welcome"
  | "subscription_confirmed"
  | "subscription_reminder_3d"
  | "subscription_reminder_7d"
  | "weekly_plans"
  | "partner_prospection"
  | "affiliate_welcome"
  | "client_followup_30d"
  | "team_weekly_report"
  | "feature_unlock_confirmed"
  | "team_invite";

interface EmailContext {
  recipientName?: string;
  recipientEmail: string;
  planName?: string;
  city?: string;
  interests?: string[];
  companyName?: string;
  partnerType?: string;
  teamStats?: Record<string, number>;
  customData?: Record<string, any>;
}

// ─── Rédaction Claude ─────────────────────────────────────────────
async function generateEmailContent(
  type: EmailType,
  context: EmailContext
): Promise<{ subject: string; html: string; text: string }> {
  const prompts: Record<EmailType, string> = {
    welcome: `Tu es le rédacteur de Maison Baymora, une conciergerie IA premium ultra-luxe. 
Rédige un email de bienvenue chaleureux et élégant pour ${context.recipientName || "notre nouveau membre"}.
Ton : chaleureux, exclusif, comme une lettre d'un maître d'hôtel 5 étoiles.
Inclure : accueil personnalisé, ce qui les attend (assistant IA, fiches premium, parcours sur-mesure), CTA "Parler à votre assistant".
Format : objet percutant + HTML élégant avec emojis subtils. Pas de bullet points. Prose fluide.
Signature : L'équipe Maison Baymora.`,

    subscription_confirmed: `Tu es le rédacteur de Maison Baymora.
Rédige un email de confirmation d'abonnement ${context.planName || "Premium"} pour ${context.recipientName || "notre membre"}.
Ton : prestige, exclusivité, comme une confirmation de réservation au Ritz.
Inclure : félicitations, récapitulatif des avantages du plan, crédits disponibles, CTA "Accéder à mon espace".
Rappeler : accès Claude Opus, parcours illimités, fiches premium.`,

    subscription_reminder_3d: `Tu es le rédacteur de Maison Baymora.
Rédige un email de relance douce (J+3 après expiration) pour ${context.recipientName || "notre membre"}.
Ton : bienveillant, pas insistant, comme un concierge qui prend des nouvelles.
Inclure : "Votre assistant vous manque", rappel des avantages perdus, offre de retour avec réduction 20%, CTA "Reprendre mon abonnement".
Ne pas mentionner directement "expiration" — utiliser "votre accès est en pause".`,

    subscription_reminder_7d: `Tu es le rédacteur de Maison Baymora.
Rédige un email de relance finale (J+7) pour ${context.recipientName || "notre membre"}.
Ton : urgence douce, dernière chance, mais toujours élégant.
Inclure : "Dernière invitation", témoignage client fictif mais crédible, offre spéciale limitée, CTA fort.
Mentionner : "Votre profil et vos préférences sont sauvegardés — reprenez là où vous vous étiez arrêté."`,

    weekly_plans: `Tu es le rédacteur de Maison Baymora.
Rédige un email de bons plans hebdomadaires pour ${context.recipientName || "notre membre"}.
Ville de référence : ${context.city || "Paris"}.
Centres d'intérêt : ${context.interests?.join(", ") || "gastronomie, culture, bien-être"}.
Ton : curateur de luxe, insider, comme un ami qui connaît les meilleures adresses.
Inclure : 3 recommandations de la semaine (restaurant, expérience, hôtel), 1 événement exclusif, 1 astuce concierge, CTA "Voir plus de bons plans".
Format : HTML riche avec sections visuelles, emojis élégants (🍽️ 🌟 🏛️ ✨).`,

    partner_prospection: `Tu es le responsable des partenariats de Maison Baymora, conciergerie IA premium.
Rédige un email de prospection pour ${context.companyName || "un établissement de luxe"} (${context.partnerType || "hôtel/restaurant"}).
Ton : professionnel, direct, B2B premium. Pas de fioriture.
Inclure : présentation Baymora en 3 lignes, proposition de valeur (visibilité auprès de clients ultra-premium, commissions, fiches SEO), chiffres clés (ex: "notre base de membres premium"), CTA "Planifier un appel de 20 minutes".
Objet : accrocheur, pas commercial.`,

    affiliate_welcome: `Tu es le responsable des affiliations de Maison Baymora.
Rédige un email de bienvenue pour un nouveau partenaire affilié : ${context.companyName || "notre partenaire"}.
Ton : professionnel, enthousiaste, partenariat win-win.
Inclure : félicitations pour l'intégration, récapitulatif du programme (commissions, tracking, support), lien vers le dashboard partenaire, contact dédié.`,

    client_followup_30d: `Tu es le concierge de Maison Baymora.
Rédige un email de suivi 30 jours après l'inscription de ${context.recipientName || "notre membre"}.
Ton : attentionné, personnalisé, comme un concierge qui prend des nouvelles.
Inclure : "Comment s'est passé votre premier mois ?", rappel des fonctionnalités peut-être non utilisées, invitation à partager un retour, CTA "Parler à votre assistant".
Mentionner : programme créateur (gagnez des points en partageant vos parcours).`,

    team_weekly_report: `Tu es le coordinateur IA de Maison Baymora.
Rédige un rapport hebdomadaire interne pour l'équipe.
Stats : ${JSON.stringify(context.teamStats || { conversations: 0, newMembers: 0, revenue: 0 })}.
Ton : professionnel, synthétique, actionnable.
Inclure : résumé de la semaine, points d'attention, priorités de la semaine suivante, remerciements équipe.
Format : email interne structuré avec sections claires.`,

    feature_unlock_confirmed: `Tu es le rédacteur de Maison Baymora.
Rédige un email de confirmation de déverrouillage de fonctionnalité "${context.customData?.featureName || "VIP"}" pour ${context.recipientName || "notre membre"}.
Ton : exclusif, prestige, comme une invitation privée.
Inclure : confirmation d'accès, durée (${context.customData?.durationDays || 30} jours), comment en profiter, CTA "Découvrir maintenant".`,

    team_invite: `Tu es le directeur des opérations de Maison Baymora.
Rédige un email d'invitation à rejoindre l'équipe terrain pour ${context.recipientName || "notre futur collaborateur"}.
Lien d'invitation : ${context.customData?.inviteUrl || ""}
${context.customData?.message ? `Message personnalisé de l'équipe : "${context.customData.message}"` : ""}
Ton : professionnel, chaleureux, motivant. Comme une lettre d'onboarding d'une maison de luxe.
Inclure : bienvenue dans l'équipe Baymora, ce qu'ils vont faire (terrain, fiches, LÉNA), accès gratuit inclus, bouton CTA "Rejoindre l'équipe" pointant vers le lien d'invitation.
Format : HTML élégant, palette Baymora (fond sombre, or), signature : "L'équipe Maison Baymora".`,
  };

  const model = ["welcome", "weekly_plans", "partner_prospection"].includes(type)
    ? "claude-opus-4-5"
    : "claude-sonnet-4-5";

  const response = await anthropic.messages.create({
    model,
    max_tokens: 1500,
    system: `Tu es le rédacteur officiel de Maison Baymora. Tu rédiges des emails premium en français.
RÈGLES ABSOLUES :
- Toujours retourner un JSON valide avec les champs : subject (string), html (string HTML complet), text (string plain text)
- Le HTML doit être autonome (pas de dépendances externes) avec styles inline
- Palette : fond #080c14 (bleu nuit), texte #f5f0e8 (crème), accent #c8a94a (or)
- Police : Georgia pour les titres, Arial pour le corps
- Jamais de spam words (gratuit, urgent, cliquez ici)
- Signature toujours : "Maison Baymora — L'excellence à portée de main"`,
    messages: [
      {
        role: "user",
        content: `${prompts[type]}\n\nRetourne UNIQUEMENT un JSON valide : {"subject": "...", "html": "...", "text": "..."}`,
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";

  // Parser le JSON retourné par Claude
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Claude n'a pas retourné de JSON valide");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    subject: parsed.subject || "Message de Maison Baymora",
    html: parsed.html || `<p>${parsed.text || ""}</p>`,
    text: parsed.text || "",
  };
}

// ─── Envoi d'email ────────────────────────────────────────────────
export async function sendEmail(
  type: EmailType,
  context: EmailContext,
  options?: { from?: string; replyTo?: string }
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const content = await generateEmailContent(type, context);

    const from = options?.from || (
      type === "partner_prospection" || type === "affiliate_welcome"
        ? FROM_PARTNERSHIPS
        : type === "team_weekly_report"
        ? FROM_TEAM
        : FROM_EMAIL
    );

    const result = await resend.emails.send({
      from,
      to: context.recipientEmail,
      subject: content.subject,
      html: content.html,
      text: content.text,
      replyTo: options?.replyTo || "hello@maisonbaymora.com",
    });

    console.log(`[Email] Sent ${type} to ${context.recipientEmail} — ID: ${result.data?.id}`);
    return { success: true, id: result.data?.id };
  } catch (error: any) {
    console.error(`[Email] Failed to send ${type}:`, error.message);
    return { success: false, error: error.message };
  }
}

// ─── Envoi en masse (bons plans hebdo) ───────────────────────────
export async function sendBulkWeeklyPlans(
  recipients: Array<{ email: string; name?: string; city?: string; interests?: string[] }>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendEmail("weekly_plans", {
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      city: recipient.city,
      interests: recipient.interests,
    });
    if (result.success) sent++;
    else failed++;

    // Rate limiting Resend : 2 emails/seconde max
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return { sent, failed };
}

// ─── Triggers automatiques ────────────────────────────────────────
export async function triggerWelcomeEmail(user: {
  email: string;
  name?: string;
}): Promise<void> {
  await sendEmail("welcome", {
    recipientEmail: user.email,
    recipientName: user.name,
  });
}

export async function triggerSubscriptionConfirmed(user: {
  email: string;
  name?: string;
  planName: string;
}): Promise<void> {
  await sendEmail("subscription_confirmed", {
    recipientEmail: user.email,
    recipientName: user.name,
    planName: user.planName,
  });
}

export async function triggerSubscriptionReminder(
  user: { email: string; name?: string },
  daysAfterExpiry: 3 | 7
): Promise<void> {
  const type = daysAfterExpiry === 3 ? "subscription_reminder_3d" : "subscription_reminder_7d";
  await sendEmail(type, {
    recipientEmail: user.email,
    recipientName: user.name,
  });
}

export async function triggerClientFollowup(user: {
  email: string;
  name?: string;
}): Promise<void> {
  await sendEmail("client_followup_30d", {
    recipientEmail: user.email,
    recipientName: user.name,
  });
}

export async function triggerPartnerProspection(partner: {
  email: string;
  companyName: string;
  partnerType: string;
}): Promise<void> {
  await sendEmail("partner_prospection", {
    recipientEmail: partner.email,
    companyName: partner.companyName,
    partnerType: partner.partnerType,
  });
}

export async function triggerAffiliateWelcome(affiliate: {
  email: string;
  companyName: string;
}): Promise<void> {
  await sendEmail("affiliate_welcome", {
    recipientEmail: affiliate.email,
    companyName: affiliate.companyName,
  });
}

export async function triggerTeamInvite(params: {
  recipientEmail: string;
  recipientName: string;
  inviteUrl: string;
  message?: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendEmail("team_invite", {
    recipientEmail: params.recipientEmail,
    recipientName: params.recipientName,
    customData: { inviteUrl: params.inviteUrl, message: params.message },
  }, { from: FROM_TEAM });
}

export async function triggerTeamWeeklyReport(
  teamEmail: string,
  stats: Record<string, number>
): Promise<void> {
  await sendEmail("team_weekly_report", {
    recipientEmail: teamEmail,
    teamStats: stats,
  });
}

// ─── Preview email (sans envoi) ───────────────────────────────────
export async function previewEmail(
  type: EmailType,
  context: EmailContext
): Promise<{ subject: string; html: string; text: string }> {
  return generateEmailContent(type, context);
}
