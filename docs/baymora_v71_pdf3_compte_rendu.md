# Baymora — Compte-rendu V7 → V7.1
### Transmission à Claude — Avril 2026

---

## 1. Contexte

Ce document est un **compte-rendu de passation** entre Manus (agent exécutant) et Claude (agent de revue/continuation). Il détaille l'ensemble des modifications effectuées sur l'application Baymora entre la version V7 et la version V7.1, ainsi que les points restant à implémenter.

**Dépôt GitHub** : `klelay7-web/Baymora_AppByManus`
**Branche Claude** : `claude/main` (dernier commit : `8bbdee4`)
**Application live** : https://maisonbaymora.com
**Checkpoint Manus** : `45fb097f`

---

## 2. Ce qui a été fait (V7 → V7.1)

### Groupe A — Corrections de prix

| Élément | Avant | Après |
|---|---|---|
| Pack 5 conversations | 4,90€ | **4,99€** |
| Pack 15 conversations | 11,90€ | **9,99€** |
| Pack 40 conversations | 24,90€ | **19,99€** |
| Plan Duo mensuel | 12,90€ | **14,90€** |
| Plan Duo annuel | — | **149€/an** |
| Plan Membre annuel | — | **99€/an** |
| Options annuelles | Cachées | **Visibles dans Premium.tsx** |

Fichiers modifiés : `server/stripe/products.ts`, `client/src/components/CreditsModal.tsx`, `client/src/pages/Premium.tsx`

### Groupe B — Suppression des termes interdits

Les termes suivants ont été **entièrement supprimés** du client (0 occurrence restante) :

| Terme supprimé | Remplacé par |
|---|---|
| "conciergerie" | — (supprimé) |
| "hub IA de conciergerie privée" | — (supprimé) |
| "Social Club" / "Social club virtuel premium" | "Maison Baymora" / "Accès privé" |
| "Maya IA" / "IA Maya" | "Maya" |
| "Luxe accessible" | — (supprimé) |
| Prix barrés (`line-through`) | Badges % de réduction |

Fichiers modifiés : `Landing.tsx`, `Maison.tsx`, `CGU.tsx`, `Confidentialite.tsx`, `Profil.tsx`, `Offres.tsx`, `LieuDetail.tsx`, `claudeService.ts`

### Groupe C — System prompt Maya

1. **Vouvoiement adaptatif** : Maya tutoie par défaut (chaleureux), vouvoie si profil formel ou 1ère conversation. La règle "Vouvoiement élégant et naturel" a été remplacée par la logique adaptative complète.

2. **Rate limiting corrigé** : passage de "par jour" à "**par minute**" — 30 msg/min pour Membre, 10 msg Opus/min pour Cercle. Fonction `checkRateLimit(userId, key, maxPerMinute)` dans `routers.ts`.

3. **Règle N°17 ajoutée** : 8 catégories "Ma position" avec comportement Maya adapté pour chacune (Gastronomie, Hôtels, Bien-être, Culture, Shopping, Sorties, Transports, Sport).

4. **Nomenclature scénarios** : MALIN → Signature, ESSENTIEL → Privilège, PREMIUM → Prestige, EXCELLENCE → Sur-Mesure (dans tout le system prompt).

Fichier modifié : `server/services/claudeService.ts`

### Groupe D — MayaDemo intégrée dans la Landing

La section "Voir Maya en action" (lien externe) a été remplacée par un **composant interactif inline** `MayaDemoInline` directement dans `Landing.tsx`. Il propose 3 personas cliquables :

| Persona | Prompt | Réponse simulée |
|---|---|---|
| Week-end romantique | "Week-end romantique à Paris, budget 1500€, 2 nuits." | Hôtel Le Marais Bastille, Septime, Brunch Bal Café — 1 340€ |
| Business Dubai | "Déplacement pro à Dubai, 3 jours, réunions le matin." | DIFC Marriott, Nobu, spa Four Seasons — programme business complet |
| Famille Barcelone | "Vacances en famille à Barcelone, 5 jours, 3 enfants." | Sagrada Familia, Parc Güell, plage Barceloneta — programme famille |

Fichier modifié : `client/src/pages/Landing.tsx`

### Groupe E — UI/UX

- **Sidebar desktop** : ordre corrigé → Maison / Maya / Ma position / Privilèges / Parcours / Profil
- **Bottom nav mobile** : ordre corrigé → [Maison] [Ma position] [Maya] [Parcours] [Profil]
- **MobileHeader pills** : Maison · Privilèges · Ma position
- **Profil.tsx** : "Social club virtuel premium" → "Accès privé"

Fichiers modifiés : `AppLayout.tsx`, `MobileBottomNav.tsx`, `MobileHeader.tsx`, `Profil.tsx`

### Groupe F — Pages légales

- **CGU.tsx** : prix mis à jour (Membre 9,90€, Duo 14,90€, Cercle 149€/an), vocabulaire "adhésion" / "membre" / "privilèges"
- **Confidentialite.tsx** : "Claude IA" → "Anthropic (Claude) — traitement des conversations pour générer les recommandations Maya"

### Groupe G — Fonctionnalités

1. **Onboarding** : double vérification `localStorage` (clé `baymora_onboarding_done_v7`) + champ DB `hasCompletedOnboarding`. Procédure `trpc.auth.completeOnboarding` créée dans `routers.ts`. Champs `hasCompletedOnboarding` et `isCercle` ajoutés dans `drizzle/schema.ts` et migrés en DB.

2. **Géolocalisation Ma position** : `MaPosition.tsx` utilise `navigator.geolocation.getCurrentPosition()` pour localiser le membre et afficher les adresses partenaires proches dans 8 catégories.

3. **Compteur fondateurs DB** : procédure `trpc.stripe.getFounderCount` créée. Elle lit le vrai nombre d'utilisateurs `subscriptionTier = "elite"` en DB. La Landing affiche ce chiffre en temps réel (fallback : 423 si DB inaccessible).

4. **TripActiveMode.tsx** : composant créé — mode parcours actif avec carte interactive, todolist rétractable, bouton SOS Maya, mode Business.

---

## 3. État actuel de l'application (V7.1)

### Points validés (checklist 20/20)

| # | Point | Statut |
|---|---|---|
| 1 | Prix packs crédits (4,99/9,99/19,99€) | ✅ |
| 2 | Prix Duo 14,90€/mois | ✅ |
| 3 | Options annuelles visibles dans Premium.tsx | ✅ |
| 4 | "Conciergerie" supprimé du client | ✅ |
| 5 | "Hub IA" supprimé du client | ✅ |
| 6 | "Social Club" supprimé du client | ✅ |
| 7 | "Maya IA" supprimé du client | ✅ |
| 8 | "Luxe accessible" supprimé du client | ✅ |
| 9 | Prix barrés supprimés (→ badges %) | ✅ |
| 10 | Vouvoiement adaptatif dans system prompt | ✅ |
| 11 | Rate limiting /minute (pas /jour) | ✅ |
| 12 | MayaDemo inline dans Landing (3 personas) | ✅ |
| 13 | Géolocalisation dans Ma position | ✅ |
| 14 | Onboarding DB + localStorage | ✅ |
| 15 | Compteur fondateurs branché sur DB | ✅ |
| 16 | Sidebar desktop ordre V7 | ✅ |
| 17 | Bottom nav mobile ordre V7 | ✅ |
| 18 | TypeScript : 0 erreur | ✅ |
| 19 | CGU prix 149€ Cercle | ✅ |
| 20 | Confidentialité : Anthropic (Claude) | ✅ |

### TypeScript
0 erreur confirmée. Serveur Express opérationnel. HMR Vite actif.

---

## 4. Ce qui reste à faire (backlog pour Claude)

### Priorité haute

**4.1 — Connecter les prix Stripe réels**
Les `stripePriceId` dans `server/stripe/products.ts` utilisent des placeholders (`price_membre_monthly`, `price_duo_monthly`, etc.). Il faut créer les vrais produits dans le dashboard Stripe et remplacer les IDs par les vrais `price_xxx`.

Variables d'environnement à définir :
- `STRIPE_PRICE_MEMBRE` (mensuel)
- `STRIPE_PRICE_MEMBRE_ANNUAL`
- `STRIPE_PRICE_DUO` (mensuel)
- `STRIPE_PRICE_DUO_ANNUAL`
- `STRIPE_PRICE_CERCLE` (annuel)
- `STRIPE_PRICE_PACK_5`, `STRIPE_PRICE_PACK_15`, `STRIPE_PRICE_PACK_40`

**4.2 — Activer les emails de bienvenue Stripe**
Brancher `reminderService` sur le webhook `customer.subscription.created` pour envoyer un email de bienvenue Cercle via Resend (template déjà dans `emailService.ts`).

**4.3 — Rappels J-14/J-7/J-1 automatiques**
La logique est dans le system prompt (Règle N°13) mais le **service de rappels automatiques** n'est pas encore branché. Il faut créer un job cron qui :
1. Lit les `tripPlans` avec une date de départ dans 14, 7 ou 1 jour
2. Envoie une notification push ou email via Resend
3. Marque le rappel comme envoyé (champ `reminderSentAt` à ajouter dans `tripPlans`)

**4.4 — Page Ma position enrichie avec données réelles**
Actuellement, `MaPosition.tsx` affiche une interface de géolocalisation mais les adresses partenaires ne sont pas filtrées par catégorie depuis la DB. Il faut :
1. Ajouter un champ `category` dans la table `establishments` (enum : gastronomie, hotels, bien_etre, culture, shopping, sorties, transports, sport)
2. Créer la procédure `trpc.establishments.listByCategory({ lat, lng, category, radius })` dans `routers.ts`
3. Brancher `MaPosition.tsx` sur cette procédure

### Priorité moyenne

**4.5 — Compteur fondateurs animé**
Ajouter une animation de comptage (0 → valeur réelle) au chargement de la Landing pour renforcer l'urgence. Utiliser `framer-motion` (déjà installé) avec `animate={{ count: founderCount }}`.

**4.6 — Page Ambassadeur complète**
La route `/ambassadeur` existe mais la page n'est pas complète. Il faut afficher :
- Nombre de filleuls actifs
- Commissions générées (depuis `commissionPayments`)
- Statut ambassadeur (bronze/argent/or)
- Lien de parrainage personnalisé

**4.7 — Système d'invitations Cercle**
Le composant `InvitationSystem.tsx` existe mais n'est pas branché sur la DB. Les membres Cercle ont droit à **2 invitations/mois**. Il faut :
1. Créer la table `cercleInvitations` dans `schema.ts`
2. Créer les procédures `trpc.cercle.createInvitation` et `trpc.cercle.listInvitations`
3. Brancher `InvitationSystem.tsx`

**4.8 — Le Secret du Jour (Cercle)**
Le composant `SecretOfDay.tsx` existe mais le contenu est statique. Il faut créer une procédure `trpc.cercle.getSecretOfDay` qui retourne un secret quotidien depuis la DB (table à créer : `secretsOfDay` avec champs `date`, `content`, `category`).

### Priorité basse

**4.9 — Dashboard affilié**
La route `/affiliate-dashboard` existe dans `routers.ts` mais l'interface frontend est incomplète. Afficher les clics, conversions et commissions en temps réel.

**4.10 — Notifications push**
Le composant `NotificationBell.tsx` existe. Brancher sur un service de notifications push (Web Push API ou Resend) pour les rappels de voyage et les secrets du jour.

**4.11 — Avis membres (MemberReview)**
Le composant `MemberReview.tsx` existe. Créer la procédure `trpc.establishments.addReview` et afficher les avis sur les pages `LieuDetail.tsx`.

**4.12 — Mode hors-ligne Ma position**
Mettre en cache les adresses partenaires proches dans `localStorage` pour permettre l'accès hors-ligne (Service Worker ou simple cache JSON).

---

## 5. Architecture des services IA

```
Client (React)
    ↓ trpc.chat.send()
Server (Express/tRPC)
    ↓ buildSystemPrompt() + profil enrichi + contexte temporel
claudeService.ts
    ↓ selectModel() → Haiku / Sonnet / Opus
Anthropic API (Claude)
    ↓ réponse texte + tags structurés
parseStructuredTags()
    ↓ PLACES, MAP, JOURNEY, QR, BOOKING, GCAL, PLAN
Client (MessageRenderer.tsx)
    → Rendu markdown + composants interactifs
```

En parallèle, `searchWithPerplexity()` enrichit certaines réponses avec des données temps réel (Perplexity Sonar).

---

## 6. Fichiers à ne pas modifier sans précaution

| Fichier | Risque |
|---|---|
| `server/services/claudeService.ts` | System prompt Maya — toute modification change le comportement de l'IA |
| `drizzle/schema.ts` | Schéma DB — toute modification nécessite une migration SQL |
| `server/routers.ts` | ~3 500 lignes — risque de casser des procédures existantes |
| `server/stripe/webhook.ts` | Webhooks Stripe — erreur = paiements non traités |
| `client/src/App.tsx` | Routes — erreur = pages inaccessibles |

---

## 7. Commandes utiles

```bash
# Démarrer le serveur de développement
pnpm dev

# Vérifier TypeScript
npx tsc --noEmit

# Générer une migration Drizzle
pnpm drizzle-kit generate

# Lancer les tests
pnpm test

# Build production
pnpm build
```

---

*Document généré par Manus — Passation V7.1 → Claude — Avril 2026*
