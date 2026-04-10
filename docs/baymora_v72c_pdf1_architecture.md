# Baymora — Architecture Technique V7.2c
**Date :** 10 avril 2026 | **Checkpoint :** `757760f4` | **GitHub :** `klelay7-web/Baymora_AppByManus`

---

## Stack Technique

| Couche | Technologie | Version |
|---|---|---|
| Frontend | React + Tailwind CSS | 19 + 4 |
| Backend | Express + tRPC | 4 + 11 |
| Base de données | MySQL / TiDB | Cloud |
| ORM | Drizzle ORM | Latest |
| IA principale | Claude (Anthropic) | Opus 4.5 / Sonnet 4.5 |
| IA recherche | Perplexity API | Latest |
| Paiement | Stripe | Live (clés configurées) |
| Stockage fichiers | S3 (CloudFront CDN) | — |
| Vidéos | Runway Gen 4.5 | 25 assets |
| Auth | Manus OAuth | Cookie session |
| Déploiement | maisonbaymora.com | Manus Hosting |

---

## Routes Frontend (App.tsx)

| Route | Composant | Accès |
|---|---|---|
| `/` | Landing.tsx | Public |
| `/auth` | Auth.tsx | Public |
| `/maison` | Maison.tsx | Membre |
| `/maya` | Maya.tsx | Membre |
| `/ma-position` | MaPosition.tsx | Membre |
| `/offres` | Offres.tsx | Membre |
| `/parcours` | Parcours.tsx | Membre |
| `/profil` | Profil.tsx | Membre |
| `/premium` | Premium.tsx | Public |
| `/lieu/:id` | LieuDetail.tsx | Membre |
| `/maya-demo` | MayaDemo.tsx | Public |
| `/mentions-legales` | MentionsLegales.tsx | Public |
| `/confidentialite` | Confidentialite.tsx | Public |
| `/cgu` | CGU.tsx | Public |
| `/contact` | Contact.tsx | Public |

---

## Tables Base de Données (drizzle/schema.ts)

| Table | Colonnes principales |
|---|---|
| `users` | id, openId, name, email, role, subscriptionTier, credits, hasCompletedOnboarding, isCercle |
| `userPreferences` | userId, homeCity, homeCountry, preferredLanguage, travelStyle |
| `travelCompanions` | userId, name, relation, age |
| `conversations` | id, userId, title, createdAt, updatedAt |
| `messages` | id, conversationId, role, content, createdAt |
| `establishments` | id, name, category, city, address, lat, lng, priceRange, isPartner |
| `establishmentMedia` | id, establishmentId, url, type |
| `tripPlans` | id, userId, title, destination, startDate, endDate, status |
| `tripDays` | id, tripPlanId, dayNumber, date, theme |
| `tripSteps` | id, tripDayId, time, title, description, type, lat, lng |
| `seoCards` | id, userId, tripPlanId, title, imageUrl, shareToken |
| `affiliatePartners` | id, name, category, commissionRate, affiliateUrl |
| `affiliateClicks` | id, userId, partnerId, clickedAt |
| `affiliateConversions` | id, userId, partnerId, amount, commission |
| `creditTransactions` | id, userId, amount, type, description |
| `agentTasks` | id, userId, type, status, payload, result |
| `socialMediaPosts` | id, userId, platform, content, scheduledAt, status |
| `travelItineraries` | id, userId, destination, duration, style, content |
| `favorites` | id, userId, establishmentId |
| `collections` | id, userId, name, items |
| `ambassadors` | id, userId, code, tier, totalReferrals, totalCommissions |
| `referrals` | id, ambassadorId, referredUserId, status, commission |
| `commissionPayments` | id, ambassadorId, amount, status, paidAt |
| `serviceProviders` | id, name, category, city, rating, priceRange |
| `aiDirectives` | id, userId, type, content, priority |
| `aiDepartmentReports` | id, department, period, content |
| `bundles` | id, name, description, price, items |
| `contentCalendar` | id, userId, platform, date, content, status |
| `establishmentComments` | id, userId, establishmentId, content, rating |
| `events` | id, title, category, city, date, time_start, price, is_vip, is_members_only |
| `notifications` | id, userId, title, content, readAt, createdAt |

---

## Routeurs tRPC (server/routers.ts)

| Routeur | Procédures principales |
|---|---|
| `auth` | me, logout, completeOnboarding |
| `chat` | sendMessage (Claude/Perplexity), getConversations, getMessages |
| `profile` | get, update, getCredits |
| `establishments` | list, get, search, nearby |
| `comments` | add, list, delete |
| `trips` | create, list, get, update, delete, addDay, addStep |
| `seo` | createCard, getCard |
| `affiliate` | getPartners, trackClick, trackConversion |
| `credits` | getBalance, addCredits, deductCredits |
| `social` | shareTrip, getSharedTrip |
| `agents` | createTask, getTask, listTasks |
| `admin` | getStats, manageUsers |
| `favorites` | add, remove, list |
| `collections` | create, update, delete, list |
| `ambassador` | register, getStats, getReferrals |
| `commissions` | list, requestPayout |
| `providers` | list, get, book |
| `aiCommand` | execute, getHistory |
| `bundles` | list, get, purchase |
| `content` | createPost, schedulePost, listPosts |
| `fieldReports` | create, list, get |
| `email` | send, getTemplates |
| `pilotage` | getDashboard, getMetrics |
| `lena` | chat, getHistory |
| `profileEnriched` | get, update, getInsights |
| `companions` | add, update, remove, list |
| `destinations` | search, get, getInspirations |
| `campaign` | create, list, getStats |
| `manus` | chat, getHistory |
| `maya` | chat, getHistory, getSuggestions |
| `nova` | chat, getHistory |
| `aria` | chat, getHistory |
| `atlas` | chat, getHistory |
| `team` | getMembers, addMember, updateRole |
| `offers` | list, get, redeem |
| `notifications` | list, unreadCount, markRead, markAllRead |
| `mySpace` | get, update, getActivity |
| `share` | createCard, getCard, trackView |
| `stripe` | createCheckout, createPackCheckout, getSubscription, cancelSubscription, getFounderCount |
| `affiliateDashboard` | getStats, getReferrals, getCommissions |
| `events` | list, tonight, thisWeekend, thisWeek, create |

---

## Plans Tarifaires (server/stripe/products.ts)

| Plan | Prix mensuel | Prix annuel | Crédits | Claude |
|---|---|---|---|---|
| Invité | Gratuit | — | 3 conv. | Opus 4.5 (3 msg) |
| Membre | 9,90€/mois | 99€/an | 200 crédits | Opus 60 msg + Sonnet 200 msg |
| Duo | 14,90€/mois | 149€/an | 400 crédits | Opus 120 msg + Sonnet 400 msg |
| Le Cercle | — | 149€/an | Illimité | Opus illimité |

| Pack | Prix | Crédits |
|---|---|---|
| Pack 5 conv. | 4,99€ | +5 conversations |
| Pack 15 conv. | 9,99€ | +15 conversations |
| Pack 40 conv. | 19,99€ | +40 conversations |

---

## Assets Runway Gen 4.5 (client/src/lib/runwayAssets.ts)

**CDN Base :** `https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm`

### Vidéos Hero
| Fichier | Format | Durée | Intégration |
|---|---|---|---|
| `hero-landing.mp4` | 16:9 | 8s | Landing.tsx Hero |
| `hero-maison.mp4` | 16:9 | 6s | Maison.tsx Hero |

### Vidéos Nightlife (nouvelles V7.2c)
| Fichier | Format | Durée | Intégration |
|---|---|---|---|
| `nightlife-club.mp4` | 16:9 | 4s | MaPosition Zone 1 |
| `nightlife-rooftop.mp4` | 16:9 | 5s | MaPosition Zone 1 |
| `nightlife-jazz.mp4` | 16:9 | 4s | MaPosition Zone 1 |
| `nightlife-degustation.mp4` | 16:9 | 4s | MaPosition Zone 1 |
| `nightlife-festival.mp4` | 16:9 | 4s | MaPosition Zone 1 |

### Vidéos Personas
| Fichier | Format | Durée |
|---|---|---|
| `persona-cesoir.mp4` | 16:9 | 3s |
| `persona-romantique.mp4` | 16:9 | 3s |
| `persona-business.mp4` | 16:9 | 3s |
| `persona-famille.mp4` | 16:9 | 3s |
| `persona-lifestyle.mp4` | 16:9 | 3s |
| `persona-wellness.mp4` | 16:9 | 3s |
| `persona-evader.mp4` | 16:9 | 4s |

### Vidéos Destinations (9:16 — format Reels)
| Fichier | Destination |
|---|---|
| `dest-saint-tropez.mp4` | Saint-Tropez |
| `dest-alpes-ski.mp4` | Alpes Ski |
| `dest-nyc.mp4` | New York City |
| `dest-santorin.mp4` | Santorin |
| `dest-tokyo.mp4` | Tokyo |
| `dest-marrakech.mp4` | Marrakech |

### Images Catégories Ma position
| Fichier | Catégorie |
|---|---|
| `cat-sortir.jpg` | Sortir |
| `cat-manger.jpg` | Manger |
| `cat-ressourcer.jpg` | Se ressourcer |
| `cat-bouger.jpg` | Bouger |
| `cat-travailler.jpg` | Travailler |
| `cat-domicile.jpg` | À domicile |
| `cat-rencontrer.jpg` | Rencontrer |
| `cat-evader.jpg` | S'évader |

### Templates Story Cards
| Fichier | Usage |
|---|---|
| `tpl-secret-du-jour.jpg` | Secret du Jour (Cercle) |
| `tpl-trip-card.jpg` | Carte de voyage partageable |
| `tpl-invitation.jpg` | Invitation dorée |

---

## Composants Clés (client/src/components/)

| Composant | Rôle |
|---|---|
| `AppLayout.tsx` | Layout principal desktop (sidebar + contenu) |
| `MobileBottomNav.tsx` | Navigation mobile bas d'écran |
| `MobileHeader.tsx` | En-tête mobile |
| `VideoBackground.tsx` | Wrapper vidéo Runway (IntersectionObserver, lazy load, fallback mobile) |
| `OnboardingWelcome.tsx` | Onboarding unique (DB + localStorage) |
| `CreditsModal.tsx` | Modal achat crédits (packs 4,99€/9,99€/19,99€) |
| `AIChatBox.tsx` | Interface chat Maya |
| `TripActiveMode.tsx` | Mode parcours actif (carte + todolist + SOS Maya) |
| `NotificationBell.tsx` | Cloche notifications |
| `ShareableCard.tsx` | Carte voyage partageable |
| `ScenarioExplorer.tsx` | Explorateur de scénarios |
| `MemberReview.tsx` | Avis membres |
| `InvitationSystem.tsx` | Système d'invitations |

---

## Variables d'Environnement (server/_core/env.ts)

| Variable | Usage |
|---|---|
| `DATABASE_URL` | Connexion MySQL/TiDB |
| `JWT_SECRET` | Signature cookies session |
| `VITE_APP_ID` | Manus OAuth App ID |
| `OAUTH_SERVER_URL` | Backend OAuth Manus |
| `VITE_OAUTH_PORTAL_URL` | Portail login Manus |
| `ANTHROPIC_API_KEY` | Claude (Opus 4.5 / Sonnet 4.5) |
| `PERPLEXITY_API_KEY` | Recherches web temps réel |
| `STRIPE_SECRET_KEY` | Stripe Live (configuré) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe Live public (configuré) |
| `STRIPE_WEBHOOK_SECRET` | Signature webhooks Stripe |
| `RUNWAY_API_KEY` | Runway Gen 4.5 |
| `RESEND_API_KEY` | Emails transactionnels |
| `BUILT_IN_FORGE_API_KEY` | APIs internes Manus |
| `OWNER_OPEN_ID` | ID propriétaire |

---

## Domaines

| Domaine | Type |
|---|---|
| `maisonbaymora.com` | Principal (live) |
| `www.maisonbaymora.com` | Alias |
| `baymoraia-9v8af2uu.manus.space` | Dev/staging |

---

## Migrations SQL appliquées

| Fichier | Contenu |
|---|---|
| `0021_onboarding_cercle.sql` | Ajout `hasCompletedOnboarding` + `isCercle` sur `users` |
| `0022_events_table.sql` | Création table `events` (15 événements seedés Bordeaux + Paris) |

---

*Document généré par Manus — Version `757760f4` — 10 avril 2026*
