/**
 * ─── Maison Baymora — NOVA : Agente Communication ────────────────────────────
 * Responsable : emails, commentaires, messages privés, CRM, newsletter.
 * Gère toute la communication externe et interne de Maison Baymora.
 */
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../../_core/env";

const anthropic = new Anthropic({ apiKey: ENV.anthropicApiKey });

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface EmailTemplate {
  sujet: string;
  preheader: string;
  corps: string;
  cta: { texte: string; url: string };
  type: "bienvenue" | "newsletter" | "relance" | "prospection" | "confirmation" | "rapport";
}

export interface CommentaireReponse {
  commentaireOriginal: string;
  reponse: string;
  ton: "chaleureux" | "professionnel" | "excuses" | "informatif";
}

export interface MessagePrive {
  expediteur: string;
  message: string;
  reponse: string;
  priorite: "urgente" | "normale" | "basse";
  categorie: "reservation" | "information" | "plainte" | "partenariat" | "presse";
}

// ─── SYSTEM PROMPT NOVA ───────────────────────────────────────────────────────
const NOVA_SYSTEM_PROMPT = `Tu es NOVA, l'Agente Communication de Maison Baymora.

## TON RÔLE
Tu gères toute la communication de la marque :
- Emails (bienvenue, newsletter, relance, prospection partenaires)
- Réponses aux commentaires (Instagram, TikTok, Google, site)
- Messages privés (DM Instagram, WhatsApp, email)
- CRM et suivi client
- Communication presse et partenariats

## IDENTITÉ DE MARQUE BAYMORA
- **Ton** : Chaleureux, premium, personnalisé, expert
- **Style** : Social Club de luxe — chaque client est unique
- **Signature** : "L'équipe Maison Baymora" ou "Votre accès privé"

## RÈGLES DE COMMUNICATION
1. Toujours personnaliser avec le prénom du client
2. Répondre dans les 2h aux messages urgents
3. Transformer les plaintes en opportunités
4. Proposer toujours une solution concrète
5. Terminer par une invitation à revenir

## GESTION DES COMMENTAIRES
- Commentaire positif : Remercier, partager, inviter à revenir
- Commentaire négatif : S'excuser sincèrement, proposer une solution, contacter en privé
- Question : Répondre précisément, rediriger vers l'app si besoin
- Spam : Ignorer ou signaler

## EMAILS
- Objet : 40-60 caractères, personnalisé, accrocheur
- Préheader : 85-100 caractères
- Corps : Clair, aéré, mobile-first
- CTA : Un seul, visible, actionnable`;

// ─── GÉNÉRER UN EMAIL ─────────────────────────────────────────────────────────
export async function genererEmail(
  type: EmailTemplate["type"],
  destinataire: { prenom: string; email: string; tier?: string },
  contexte?: string
): Promise<EmailTemplate> {
  const prompt = `Génère un email ${type} pour Maison Baymora.

Destinataire : ${destinataire.prenom} (${destinataire.tier || "membre"})
${contexte ? `Contexte : ${contexte}` : ""}

Réponds en JSON strict :
{
  "sujet": "...",
  "preheader": "...",
  "corps": "HTML email complet avec style inline",
  "cta": {"texte": "...", "url": "https://maisonbaymora.com"},
  "type": "${type}"
}`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2000,
    system: NOVA_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);

  return {
    sujet: `Maison Baymora — ${type}`,
    preheader: "Votre expérience premium vous attend",
    corps: "",
    cta: { texte: "Découvrir", url: "https://maisonbaymora.com" },
    type,
  };
}

// ─── RÉPONDRE À UN COMMENTAIRE ────────────────────────────────────────────────
export async function repondreCommentaire(
  commentaire: string,
  plateforme: string,
  etablissement?: string
): Promise<CommentaireReponse> {
  const prompt = `Génère une réponse à ce commentaire sur ${plateforme} pour Maison Baymora.

Commentaire : "${commentaire}"
${etablissement ? `Établissement concerné : ${etablissement}` : ""}

Réponds en JSON strict :
{
  "commentaireOriginal": "${commentaire}",
  "reponse": "...",
  "ton": "chaleureux"
}`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 500,
    system: NOVA_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);

  return {
    commentaireOriginal: commentaire,
    reponse: "Merci pour votre message ! L'équipe Maison Baymora",
    ton: "chaleureux",
  };
}

// ─── GÉRER UN MESSAGE PRIVÉ ───────────────────────────────────────────────────
export async function gererMessagePrive(
  expediteur: string,
  message: string
): Promise<MessagePrive> {
  const prompt = `Analyse et réponds à ce message privé reçu par Maison Baymora.

Expéditeur : ${expediteur}
Message : "${message}"

Réponds en JSON strict :
{
  "expediteur": "${expediteur}",
  "message": "${message}",
  "reponse": "...",
  "priorite": "normale",
  "categorie": "information"
}`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 800,
    system: NOVA_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);

  return {
    expediteur,
    message,
    reponse: "Merci pour votre message. Notre équipe vous répond dans les plus brefs délais.",
    priorite: "normale",
    categorie: "information",
  };
}

// ─── GÉNÉRER EMAIL PROSPECTION PARTENAIRE ────────────────────────────────────
export async function genererEmailProspection(
  partenaire: { nom: string; type: string; ville: string },
  contexte?: string
): Promise<EmailTemplate> {
  const prompt = `Génère un email de prospection partenariat pour ${partenaire.nom} (${partenaire.type} à ${partenaire.ville}).

${contexte || "Maison Baymora est une plateforme de Social Club premium IA qui met en avant les meilleures expériences."}

Email professionnel, personnalisé, avec proposition de valeur claire.

Réponds en JSON strict :
{
  "sujet": "...",
  "preheader": "...",
  "corps": "...",
  "cta": {"texte": "Planifier un appel", "url": "https://maisonbaymora.com/partenaires"},
  "type": "prospection"
}`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1500,
    system: NOVA_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);

  return {
    sujet: `Partenariat Maison Baymora × ${partenaire.nom}`,
    preheader: "Une opportunité de visibilité premium",
    corps: "",
    cta: { texte: "Planifier un appel", url: "https://maisonbaymora.com/partenaires" },
    type: "prospection",
  };
}
