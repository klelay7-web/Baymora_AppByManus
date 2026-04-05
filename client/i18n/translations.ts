// ─── Baymora i18n translations ──────────────────────────────────────────────
// Primary: French (fr) · Secondary: English (en)
// Usage: translations.nav.home.fr → "Accueil"

export type Lang = "fr" | "en";

export interface TranslationEntry {
  fr: string;
  en: string;
}

export const translations = {
  // ─── Navigation ─────────────────────────────────────────────────────────────
  nav: {
    home:      { fr: "Accueil",        en: "Home" },
    chat:      { fr: "Chat",           en: "Chat" },
    dashboard: { fr: "Tableau de bord", en: "Dashboard" },
    boutique:  { fr: "Boutique",       en: "Boutique" },
    salon:     { fr: "Salon",          en: "Salon" },
    login:     { fr: "Se connecter",   en: "Log in" },
    signup:    { fr: "Créer un compte", en: "Sign up" },
    logout:    { fr: "Se déconnecter", en: "Log out" },
    language:  { fr: "Langue",         en: "Language" },
  },

  // ─── Chat ───────────────────────────────────────────────────────────────────
  chat: {
    placeholder:       { fr: "Décrivez votre voyage idéal…", en: "Describe your ideal trip…" },
    send:              { fr: "Envoyer",                     en: "Send" },
    listening:         { fr: "Écoute en cours…",            en: "Listening…" },
    credits_remaining: { fr: "Crédits restants",            en: "Credits remaining" },
    credits_exhausted: { fr: "Crédits épuisés",             en: "Credits exhausted" },
    save:              { fr: "Sauvegarder",                 en: "Save" },
    saved:             { fr: "Sauvegardé",                  en: "Saved" },
  },

  // ─── Plans & pricing ───────────────────────────────────────────────────────
  plans: {
    title:    { fr: "Nos cercles",                        en: "Our circles" },
    subtitle: { fr: "Choisissez l'expérience qui vous correspond", en: "Choose the experience that fits you" },
    free:     { fr: "Gratuit",                            en: "Free" },
    premium:  { fr: "Premium",                            en: "Premium" },
    prive:    { fr: "Privé",                              en: "Private" },
    popular:  { fr: "Le plus populaire",                  en: "Most popular" },
    start:    { fr: "Commencer",                          en: "Get started" },
    join:     { fr: "Rejoindre",                          en: "Join" },
    upgrade:  { fr: "Passer au niveau supérieur",         en: "Upgrade" },
    features: { fr: "Fonctionnalités",                    en: "Features" },
  },

  // ─── Common UI strings ─────────────────────────────────────────────────────
  common: {
    loading: { fr: "Chargement…",  en: "Loading…" },
    error:   { fr: "Erreur",       en: "Error" },
    back:    { fr: "Retour",       en: "Back" },
    close:   { fr: "Fermer",       en: "Close" },
    cancel:  { fr: "Annuler",      en: "Cancel" },
    confirm: { fr: "Confirmer",    en: "Confirm" },
    save:    { fr: "Enregistrer",  en: "Save" },
    delete:  { fr: "Supprimer",    en: "Delete" },
    share:   { fr: "Partager",     en: "Share" },
    copy:    { fr: "Copier",       en: "Copy" },
    copied:  { fr: "Copié",        en: "Copied" },
  },

  // ─── Dashboard ──────────────────────────────────────────────────────────────
  dashboard: {
    title:         { fr: "Mon espace",      en: "My space" },
    conversations: { fr: "Conversations",   en: "Conversations" },
    collections:   { fr: "Collections",     en: "Collections" },
    preferences:   { fr: "Préférences",     en: "Preferences" },
    companions:    { fr: "Compagnons",      en: "Companions" },
    profile:       { fr: "Profil",          en: "Profile" },
  },

  // ─── Salon (off-market / luxury) ───────────────────────────────────────────
  salon: {
    title:              { fr: "Le Salon",                   en: "The Salon" },
    locked:             { fr: "Accès réservé",              en: "Restricted access" },
    offmarket:          { fr: "Off-market",                 en: "Off-market" },
    immobilier:         { fr: "Immobilier",                 en: "Real estate" },
    yachts:             { fr: "Yachts",                     en: "Yachts" },
    services:           { fr: "Services",                   en: "Services" },
    contact_concierge:  { fr: "Contacter le concierge",     en: "Contact the concierge" },
    exclusive:          { fr: "Exclusivités",               en: "Exclusives" },
  },
} as const;

export type TranslationKey = string; // e.g. "nav.home", "chat.send"
