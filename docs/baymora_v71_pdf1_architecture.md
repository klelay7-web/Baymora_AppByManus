# Baymora — Architecture Technique V7.1
### Document de scraping pour Claude — Avril 2026

---

## 1. Présentation du projet

**Baymora** est une application web de conciergerie privée pilotée par l'IA **Maya** (Claude Anthropic). Elle s'adresse à une clientèle premium souhaitant planifier des voyages, découvrir des adresses exclusives et bénéficier d'un accès privilégié à un réseau de partenaires sélectionnés.

| Paramètre | Valeur |
|---|---|
| Nom du projet | Baymora_AppByManus |
| Version | V7.1 (Avril 2026) |
| URL de production | https://maisonbaymora.com |
| URL de staging | https://baymoraia-9v8af2uu.manus.space |
| Dépôt GitHub | klelay7-web/Baymora_AppByManus |
| Branches actives | `main` (prod) · `claude/main` (accès Claude) |
| Dernier commit | `8bbdee4` — feat: V7.1 corrections complètes |
| Stack | React 19 + Tailwind 4 + Express 4 + tRPC 11 + MySQL/TiDB |

---

## 2. Stack technique

### Frontend
- **React 19** avec TypeScript strict
- **Tailwind CSS 4** — thème sombre `#070B14` (fond) / `#C8A96E` (or Baymora)
- **Wouter** — routing côté client (SPA)
- **tRPC 11** — appels typés end-to-end (aucun fetch/Axios)
- **Framer Motion** — animations
- **Sonner** — toasts
- **Lucide React** — icônes
- **Streamdown** — rendu markdown streaming pour les réponses Maya

### Backend
- **Express 4** + **tRPC 11** — toutes les procédures sous `/api/trpc`
- **Drizzle ORM** + **MySQL/TiDB** — base de données relationnelle
- **Anthropic Claude** (via `invokeLLM`) — IA Maya
- **Perplexity Sonar** — recherche temps réel
- **Stripe** — paiements (Checkout Sessions + Webhooks)
- **Resend** — emails transactionnels
- **AWS S3** — stockage fichiers (images, médias)
- **Manus OAuth** — authentification SSO

---

## 3. Structure des fichiers

```
client/
  src/
    pages/          ← Pages de l'application
    components/     ← Composants réutilisables
    lib/trpc.ts     ← Client tRPC
    App.tsx         ← Routes + layout
    index.css       ← Thème global (variables CSS)
server/
  routers.ts        ← Toutes les procédures tRPC (~3500 lignes)
  db.ts             ← Helpers DB (requêtes Drizzle)
  services/
    claudeService.ts   ← System prompt Maya + appel Anthropic
    emailService.ts    ← Emails Resend
    concierge.ts       ← Réponse de bienvenue
  stripe/
    products.ts        ← Plans et packs crédits V7.1
    webhook.ts         ← Webhooks Stripe
drizzle/
  schema.ts         ← Schéma DB complet (~1200 lignes)
```

---

## 4. Routes de l'application

| Route | Composant | Accès |
|---|---|---|
| `/` | Landing.tsx | Public |
| `/auth` | Auth.tsx | Public |
| `/maison` | Maison.tsx | Protégé |
| `/maya` | Maya.tsx | Protégé |
| `/offres` | Offres.tsx | Protégé |
| `/parcours` | Parcours.tsx | Protégé |
| `/profil` | Profil.tsx | Protégé |
| `/premium` | Premium.tsx | Public |
| `/ma-position` | MaPosition.tsx | Protégé |
| `/lieu/:id` | LieuDetail.tsx | Protégé |
| `/maya-demo` | MayaDemo.tsx | Public |
| `/mentions-legales` | MentionsLegales.tsx | Public |
| `/confidentialite` | Confidentialite.tsx | Public |
| `/cgu` | CGU.tsx | Public |
| `/contact` | Contact.tsx | Public |

---

## 5. Schéma de base de données (tables principales)

### Table `users` (table centrale)

| Colonne | Type | Valeur par défaut | Description |
|---|---|---|---|
| `id` | int | auto_increment | Clé primaire |
| `openId` | varchar(255) | — | ID Manus OAuth |
| `email` | varchar(255) | — | Email |
| `name` | varchar(255) | — | Nom complet |
| `role` | enum | `user` | `user` ou `admin` |
| `subscriptionTier` | enum | `free` | `free`, `explorer`, `premium`, `elite` |
| `credits` | int | 0 | Crédits de conversation |
| `stripeCustomerId` | varchar | null | ID client Stripe |
| `stripeSubscriptionId` | varchar | null | ID abonnement Stripe |
| `hasCompletedOnboarding` | boolean | false | Onboarding effectué (V7) |
| `isCercle` | boolean | false | Membre Le Cercle (V7) |
| `createdAt` | timestamp | now() | Date de création |

### Correspondance tiers ↔ plans

| `subscriptionTier` | Plan Baymora | Prix |
|---|---|---|
| `free` | Invité | 0€ — 3 conversations |
| `explorer` | Membre | 9,90€/mois ou 99€/an |
| `premium` | Duo | 14,90€/mois ou 149€/an |
| `elite` | Le Cercle | 149€/an (fondateur) |

### Autres tables importantes

| Table | Usage |
|---|---|
| `conversations` | Historique des sessions Maya |
| `messages` | Messages individuels (user/assistant) |
| `establishments` | Adresses partenaires (hôtels, restos, spas) |
| `tripPlans` | Parcours créés par Maya |
| `tripDays` + `tripSteps` | Détail jour par jour |
| `favorites` + `collections` | Favoris et listes personnelles |
| `affiliatePartners` | Partenaires affiliés |
| `creditTransactions` | Historique des achats de crédits |
| `ambassadors` + `referrals` | Programme ambassadeur |
| `clientProfiles` | Profil enrichi (préférences, régime, style) |
| `companions` | Proches du membre (conjoint, enfants…) |
| `fieldReports` | Rapports terrain des agents |
| `discountOffers` | Offres et privilèges partenaires |

---

## 6. Plans et tarification V7.1

### Plans d'adhésion

| Plan | ID Stripe | Prix mensuel | Prix annuel | Crédits/mois |
|---|---|---|---|---|
| Invité | — | Gratuit | — | 3 conversations |
| Membre | `price_membre_monthly` | 9,90€ | 99€/an | 200 crédits |
| Duo | `price_duo_monthly` | 14,90€ | 149€/an | 400 crédits |
| Le Cercle | `price_cercle_annual` | — | 149€/an (fondateur) | 600 crédits |

### Packs de crédits supplémentaires

| Pack | ID | Prix | Crédits |
|---|---|---|---|
| Pack Essentiel | `pack_5` | 4,99€ | 5 conversations |
| Pack Confort | `pack_15` | 9,99€ | 15 conversations |
| Pack Liberté | `pack_40` | 19,99€ | 40 conversations |

### Rate limiting Maya

| Plan | Limite |
|---|---|
| Membre | 30 messages/minute |
| Le Cercle | 10 messages Opus/minute |

---

## 7. Routeurs tRPC (server/routers.ts)

Le fichier `routers.ts` (~3 500 lignes) contient tous les routeurs :

| Routeur | Procédures principales |
|---|---|
| `auth` | `me`, `logout`, `completeOnboarding` |
| `chat` | `send` (Maya IA), `history`, `conversations` |
| `profile` | `get`, `update`, `preferences` |
| `establishments` | `list`, `getBySlug`, `create`, `update` |
| `trips` | `list`, `create`, `update`, `days`, `steps` |
| `stripe` | `getFounderCount`, `createCheckoutSession`, `buyCredits` |
| `credits` | `balance`, `history`, `add` |
| `favorites` | `list`, `add`, `remove` |
| `collections` | `list`, `create`, `update` |
| `ambassador` | `get`, `create`, `stats` |
| `admin` | `stats`, `users`, `revenue` |
| `lena` | Workspace IA interne (SEO, bundles, destinations) |
| `manus` | Chat avec MANUS (pilotage opérationnel) |
| `maya` | Procédures spécifiques Maya (démo, scénarios) |
| `profileEnriched` | Profil détaillé client (régime, style, bucket list) |
| `companions` | Proches du membre |
| `destinations` | Destinations créées par Maya |
| `fieldReports` | Rapports terrain |
| `email` | Envoi emails (Resend) |
| `pilotage` | Messages de pilotage interne |

---

## 8. Navigation V7.1

### Sidebar desktop (AppLayout.tsx)

Ordre : **Maison** → **Maya** → **Ma position** → **Privilèges** → **Parcours** → **Profil**

### Bottom nav mobile (MobileBottomNav.tsx)

Ordre : **[Maison]** → **[Ma position]** → **[Maya]** → **[Parcours]** → **[Profil]**

### MobileHeader (pills)

Pills : **Maison** · **Privilèges** · **Ma position**

---

## 9. Composants clés

| Composant | Rôle |
|---|---|
| `AppLayout.tsx` | Layout principal desktop (sidebar + header) |
| `MobileBottomNav.tsx` | Navigation mobile bas de page |
| `MobileHeader.tsx` | Header mobile avec pills de navigation |
| `OnboardingWelcome.tsx` | Écran d'accueil (une seule fois, DB + localStorage) |
| `CreditsModal.tsx` | Achat de packs crédits |
| `ScenarioExplorer.tsx` | Exploration des 4 scénarios Maya |
| `TripActiveMode.tsx` | Mode parcours actif (carte + todolist + SOS Maya) |
| `TripTodoList.tsx` | Todolist rétractable pendant un parcours |
| `TripCard.tsx` | Carte résumé d'un parcours |
| `ShareableCard.tsx` | Carte partageable sur réseaux sociaux |
| `InvitationSystem.tsx` | Système d'invitations membres |
| `MemberReview.tsx` | Avis membres |
| `NotificationBell.tsx` | Cloche de notifications |
| `SecretOfDay.tsx` | Le Secret du Jour (Cercle uniquement) |
| `DailyFeed.tsx` | Feed quotidien personnalisé |
| `InteractiveMap.tsx` | Carte interactive Google Maps |
| `MessageRenderer.tsx` | Rendu des messages Maya (markdown + tags) |

---

## 10. Variables d'environnement requises

| Variable | Usage |
|---|---|
| `DATABASE_URL` | Connexion MySQL/TiDB |
| `JWT_SECRET` | Signature des cookies de session |
| `ANTHROPIC_API_KEY` | API Claude (Maya) |
| `PERPLEXITY_API_KEY` | Recherche temps réel |
| `STRIPE_SECRET_KEY` | Paiements Stripe |
| `STRIPE_WEBHOOK_SECRET` | Vérification webhooks Stripe |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe (frontend) |
| `RESEND_API_KEY` | Emails transactionnels |
| `VITE_APP_ID` | OAuth Manus |
| `BUILT_IN_FORGE_API_KEY` | APIs internes Manus |

---

## 11. Points techniques importants pour Claude

**Onboarding** : géré via `localStorage` (clé `baymora_onboarding_done_v7`) ET le champ DB `hasCompletedOnboarding`. La procédure `trpc.auth.completeOnboarding` met à jour les deux.

**Compteur fondateurs** : `trpc.stripe.getFounderCount` lit le vrai nombre d'utilisateurs avec `subscriptionTier = "elite"` en DB. La Landing affiche ce chiffre en temps réel avec fallback à 423.

**Rate limiting** : la fonction `checkRateLimit(userId, key, maxPerMinute)` en mémoire (Map) limite à 30 msg/min pour Membre et 10 msg/min Opus pour Cercle.

**Géolocalisation** : `MaPosition.tsx` utilise `navigator.geolocation.getCurrentPosition()` pour localiser le membre et afficher les adresses partenaires proches dans 8 catégories.

**TypeScript** : 0 erreur confirmée par `tsc --noEmit` (watcher actif).

---

*Document généré par Manus — Baymora V7.1 — Avril 2026*
