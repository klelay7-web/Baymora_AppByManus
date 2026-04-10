# Rapport Baymora — Exécutions Runway V7.2 + V7.2c
**Date :** 10 avril 2026 | **Rédigé par :** Manus (pour transmission à Claude)

---

## 1. Résumé des 2 dernières exécutions

### Exécution 1 — Runway V7.2 (checkpoint `c10c3ef9`)
**Prompt :** ADDENDUM_RUNWAY_CREATIVES_V7.2.md

**Ce qui a été fait :**

| Asset | Type | Format | Statut |
|---|---|---|---|
| `hero-landing.mp4` | Vidéo Hero | 16:9 · 8s | ✓ Généré + S3 + intégré Landing.tsx |
| `hero-maison.mp4` | Vidéo Hero | 16:9 · 6s | ✓ Généré + S3 + intégré Maison.tsx |
| `persona-romantique.mp4` | Vidéo Persona | 16:9 · 3s | ✓ Généré + S3 |
| `persona-business.mp4` | Vidéo Persona | 16:9 · 3s | ✓ Généré + S3 |
| `persona-famille.mp4` | Vidéo Persona | 16:9 · 3s | ✓ Généré + S3 |
| `persona-lifestyle.mp4` | Vidéo Persona | 16:9 · 3s | ✓ Généré + S3 |
| `persona-wellness.mp4` | Vidéo Persona | 16:9 · 3s | ✓ Généré + S3 |
| `persona-evader.mp4` | Vidéo Persona | 16:9 · 4s | ✓ Généré + S3 |
| `dest-saint-tropez.mp4` | Vidéo Destination | 9:16 · 6s | ✓ Généré + S3 |
| `dest-alpes-ski.mp4` | Vidéo Destination | 9:16 · 6s | ✓ Généré + S3 |
| `dest-nyc.mp4` | Vidéo Destination | 9:16 · 6s | ✓ Généré + S3 |
| `dest-santorin.mp4` | Vidéo Destination | 9:16 · 6s | ✓ Généré + S3 |
| `dest-tokyo.mp4` | Vidéo Destination | 9:16 · 6s | ✓ Généré + S3 |
| `dest-marrakech.mp4` | Vidéo Destination | 9:16 · 6s | ✓ Généré + S3 |
| `cat-sortir.jpg` | Image catégorie | 16:9 + 1:1 | ✓ Généré + S3 |
| `cat-manger.jpg` | Image catégorie | 16:9 + 1:1 | ✓ Généré + S3 |
| `cat-ressourcer.jpg` | Image catégorie | 16:9 + 1:1 | ✓ Généré + S3 |
| `cat-bouger.jpg` | Image catégorie | 16:9 + 1:1 | ✓ Généré + S3 |
| `cat-travailler.jpg` | Image catégorie | 16:9 + 1:1 | ✓ Généré + S3 |
| `cat-domicile.jpg` | Image catégorie | 16:9 + 1:1 | ✓ Généré + S3 |
| `cat-rencontrer.jpg` | Image catégorie | 16:9 + 1:1 | ✓ Généré + S3 |
| `cat-evader.jpg` | Image catégorie | 16:9 + 1:1 | ✓ Généré + S3 |
| `tpl-secret-du-jour.jpg` | Template Story | 9:16 | ✓ Généré + S3 |
| `tpl-trip-card.jpg` | Template Story | 9:16 | ✓ Généré + S3 |
| `tpl-invitation.jpg` | Template Story | 9:16 | ✓ Généré + S3 |

**Composants créés :**
- `client/src/components/VideoBackground.tsx` — wrapper vidéo avec IntersectionObserver, lazy loading, fallback mobile, détection connexion lente
- Intégration dans `Landing.tsx` (Hero vidéo) et `Maison.tsx` (Hero vidéo)

---

### Exécution 2 — Runway Message 2 V7.2c (checkpoint `757760f4`)
**Prompt :** MESSAGE_2_MANUS_RUNWAY.md

**Ce qui a été fait :**

| Asset | Type | Format | Statut |
|---|---|---|---|
| `nightlife-club.mp4` | Vidéo Nightlife | 16:9 · 4s | ✓ Généré + S3 |
| `nightlife-rooftop.mp4` | Vidéo Nightlife | 16:9 · 5s | ✓ Généré + S3 |
| `nightlife-jazz.mp4` | Vidéo Nightlife | 16:9 · 4s | ✓ Généré + S3 |
| `nightlife-degustation.mp4` | Vidéo Nightlife | 16:9 · 4s | ✓ Généré + S3 |
| `nightlife-festival.mp4` | Vidéo Nightlife | 16:9 · 4s | ✓ Généré + S3 |
| `persona-cesoir.mp4` | Vidéo Persona | 16:9 · 3s | ✓ Généré + S3 |

**Fichiers créés/modifiés :**
- `client/src/lib/runwayAssets.ts` — manifest centralisé de toutes les URLs CDN (vidéos + images)
- `MaPosition.tsx` — Zone 1 : vidéos nightlife en rotation sur les cartes événements ; Zone 3 : images catégories en fond des boutons services
- `Landing.tsx` — import depuis `runwayAssets.ts` (plus d'URL hardcodée)
- `server/routers.ts` — correction erreur SQL `LIMIT ?` non supporté par mysql2/promise dans `events.list`, `events.thisWeek`, `notifications.list`

---

## 2. État actuel de l'application (checkpoint `757760f4`)

### Architecture technique
- **Stack :** React 19 + Tailwind 4 + Express 4 + tRPC 11 + MySQL/TiDB
- **Auth :** Manus OAuth (cookie session)
- **IA :** Claude (Anthropic) via `claudeService.ts` + Perplexity pour les recherches web
- **Paiement :** Stripe (clés live configurées par l'utilisateur dans Settings → Payment)
- **Stockage :** S3 (assets Runway + fichiers utilisateurs)

### Plans tarifaires actifs
| Plan | Prix | Crédits |
|---|---|---|
| Invité | Gratuit | 3 conversations |
| Membre | 9,90€/mois | 30 conv./mois |
| Duo | 14,90€/mois | 60 conv./mois |
| Le Cercle | 149€/an | Illimité (Opus) |
| Pack 5 conv. | 4,99€ | +5 conversations |
| Pack 15 conv. | 9,99€ | +15 conversations |
| Pack 40 conv. | 19,99€ | +40 conversations |

### Pages principales
| Route | Description | Statut |
|---|---|---|
| `/` (Landing) | Page publique avec MayaDemo 4 personas + vidéo Hero + section Ce soir | ✓ |
| `/maison` | Dashboard membre — événements Cette semaine + coups de cœur | ✓ |
| `/maya` | Chat IA avec Maya (Claude) | ✓ |
| `/ma-position` | 3 zones : Ce soir / Spots / Services avec assets Runway | ✓ |
| `/parcours` | Planification de voyages | ✓ |
| `/premium` | Page adhésion (4 plans + options annuelles) | ✓ |
| `/profil` | Profil utilisateur + crédits + adhésion | ✓ |
| `/offres` | Offres partenaires | ✓ |
| `/cgu` | CGU | ✓ |
| `/confidentialite` | Politique de confidentialité | ✓ |

### Base de données (tables principales)
- `users` — id, openId, name, email, role, subscriptionTier, credits, hasCompletedOnboarding, isCercle
- `conversations` — id, userId, title, createdAt, updatedAt
- `messages` — id, conversationId, role, content, createdAt
- `trips` — id, userId, title, destination, startDate, endDate, status
- `events` — id, title, category, city, date, time_start, price, is_vip, is_members_only (15 seedés)
- `affiliations` — id, userId, code, referrals, commissions
- `notifications` — id, userId, title, content, readAt

---

## 3. Ce qui reste à faire (backlog)

### Priorité haute
1. **Brancher les événements DB sur la section "Ce soir" de la Landing** — remplacer les 3 cartes statiques par `trpc.events.tonight.useQuery({ city: "Bordeaux" })` pour afficher les vrais événements du soir
2. **Carrousel Destinations** — créer une section "Nos destinations du moment" dans Maison.tsx avec les 6 vidéos 9:16 en carrousel horizontal cliquable
3. **Intégrer les templates Story Cards** dans `ShareableCard.tsx` — utiliser `tpl-trip-card.jpg`, `tpl-secret-du-jour.jpg`, `tpl-invitation.jpg` comme fond des cartes partageables

### Priorité moyenne
4. **Formulaire soumission événement partenaire** — page `/partenaires/evenement` avec formulaire simple (titre, date, lieu, prix) qui appelle `trpc.events.create` (admin only)
5. **Notifications push sorties** — cron quotidien à 17h envoyant aux membres Cercle les événements du soir dans leur ville via Resend
6. **Compteur fondateurs animé** — animation de comptage (0 → valeur réelle) au chargement de la Landing pour renforcer l'urgence
7. **Page Ambassadeur** — compléter `/ambassadeur` avec les stats réelles de parrainage (filleuls, commissions, statut) tirées de la DB

### Priorité basse
8. **Personas vidéo dans MayaDemo** — remplacer les icônes emoji par les clips `persona-romantique.mp4` / `persona-business.mp4` en miniature cliquable
9. **Destinations dans Profil** — afficher les destinations préférées de l'utilisateur (tirées de ses parcours) dans la section Profil
10. **Mode sombre/clair** — permettre à l'utilisateur de basculer entre thème sombre (actuel) et thème clair dans les paramètres

---

## 4. Suggestions de Manus pour Claude
> **Important :** Ce sont des suggestions personnelles de Manus, pas des ordres. Claude est décisionnaire.

**Suggestion A — Cohérence des données événements :** Les événements seedés ont des dates fixes (avril 2026). Il serait utile de créer un script de re-seed automatique qui décale les dates au fil du temps, ou de permettre à l'admin d'ajouter facilement de nouveaux événements via une interface simple dans le Dashboard.

**Suggestion B — Vidéos Destinations en Reels :** Les 6 vidéos 9:16 générées (Saint-Tropez, Alpes, NYC, Santorin, Tokyo, Marrakech) sont actuellement sur S3 mais pas encore utilisées dans l'app. Il serait intéressant de les afficher dans une section "Inspirations" sur Maison.tsx, avec un scroll horizontal et un CTA "Planifier ce voyage" qui ouvre Maya avec le contexte pré-rempli.

**Suggestion C — Persona "Ce soir" dynamique :** La démo Landing "Ce soir à Bordeaux" affiche une réponse statique. Il serait plus impactant de la brancher sur les vrais événements DB (`trpc.events.tonight`) pour que la réponse de Maya reflète les événements réels du soir — renforçant la crédibilité de l'IA auprès des visiteurs non connectés.

**Suggestion D — Webhook Stripe pour isCercle :** Actuellement, `isCercle` est dans le schéma DB mais n'est pas mis à jour automatiquement lors d'un paiement Cercle. Il faudrait que le webhook Stripe `checkout.session.completed` mette à jour `isCercle = true` pour les utilisateurs qui souscrivent au plan Cercle.

---

*Rapport généré par Manus le 10 avril 2026 — Version `757760f4`*
