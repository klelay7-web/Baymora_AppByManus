# Maison Baymora — Améliorations UX Détaillées par Point d'Entrée

**Document technique & créatif** | Version 1.0 | Avril 2026
**Auteur** : Manus AI pour Maison Baymora

---

## Introduction

Ce document détaille les améliorations UX recommandées pour chacun des 8 points d'entrée de Maison Baymora. Pour chaque point, on analyse l'état actuel de l'interface, les lacunes identifiées, puis on propose des améliorations concrètes avec leur spécification technique (composants, routes, interactions, logique IA). Chaque amélioration est accompagnée d'un **niveau de priorité**, d'un **effort estimé**, et de son **impact sur la conversion**.

---

## 1. Assistant IA — `/chat`

### 1.1 État actuel

La page Chat est fonctionnelle : header avec icône Sparkles et statut « En ligne », zone de messages avec scroll, zone de saisie avec textarea et bouton envoi. Quatre **quick prompts** sont déjà présents quand la conversation est vide (« Week-end romantique à Venise », « Meilleurs restaurants de Tokyo », « Safari de luxe en Tanzanie », « Spa & wellness à Bali »). La gate de 3 messages gratuits fonctionne côté client et serveur. Le mode démo (non authentifié) renvoie une réponse statique.

### 1.2 Lacunes identifiées

Le chat est actuellement un écran unique sans contexte visuel. Le client arrive sur un fond sombre avec un champ texte — c'est fonctionnel mais pas « aspirationnel ». Les quick prompts sont statiques et ne s'adaptent pas au profil du client. Il n'y a aucun visuel d'accompagnement, aucune carte, aucun widget riche dans les réponses de l'IA. Le passage du message 3 (gratuit) au paywall est abrupt, sans transition émotionnelle.

### 1.3 Améliorations recommandées

**A. Quick Prompts Dynamiques & Contextuels** (Priorité : Haute | Effort : Faible)

Les quick prompts doivent s'adapter au profil du client et au contexte temporel. Au lieu de 4 suggestions statiques, le système doit proposer des suggestions personnalisées basées sur la saison, la localisation du client, et ses préférences connues.

| Profil | Saison | Exemples de quick prompts |
|---|---|---|
| Nouveau visiteur (inconnu) | Été | « Où partir en août ? », « Les plus belles plages secrètes », « Dîner étoilé ce soir à Paris » |
| Curieux (economy) | Hiver | « Week-end ski pas cher dans les Alpes », « Staycation spa près de chez moi » |
| Hédoniste (premium) | Printemps | « Escapade gastronomique en Toscane », « Retraite bien-être à Marrakech » |
| Mogul (ultra_premium) | Toute saison | « Villa privée avec chef à Saint-Barth », « Yacht Côte d'Azur pour 8 personnes » |

**Implémentation technique** : Créer un endpoint `trpc.chat.getSuggestedPrompts` qui utilise `ctx.user.budgetPreference`, `ctx.user.travelStyle`, `ctx.user.homeCity`, et la date courante pour générer 4-6 suggestions via un appel LLM léger (ou un système de templates pré-définis pour la performance). Côté frontend, remplacer le tableau statique dans `Chat.tsx` par un appel `trpc.chat.getSuggestedPrompts.useQuery()`.

---

**B. Écran d'accueil immersif avant le premier message** (Priorité : Haute | Effort : Moyen)

Quand le chat est vide, au lieu d'un simple texte « Bienvenue chez Baymora », afficher un écran d'accueil immersif avec :

- Un **visuel de fond** en dégradé (image de destination tendance, changeante chaque jour)
- Le **nom du client** s'il est authentifié : « Bonjour Kévin, où vous emmène-t-on aujourd'hui ? »
- Les **quick prompts** organisés en catégories visuelles (pas juste des pills texte) :
  - **Voyager** : icône avion + 2 suggestions
  - **Dîner** : icône fourchette + 2 suggestions
  - **Découvrir** : icône boussole + 2 suggestions
  - **Organiser** : icône calendrier + 2 suggestions
- Un **compteur de messages restants** pour les utilisateurs gratuits : « 3 messages offerts — Posez votre première question »

**Structure du composant** :

```
ChatWelcomeScreen
├── BackgroundImage (destination du jour, avec overlay gradient)
├── GreetingText (personnalisé si authentifié)
├── PromptCategories (grille 2x2)
│   ├── CategoryCard "Voyager" → [prompt1, prompt2]
│   ├── CategoryCard "Dîner" → [prompt1, prompt2]
│   ├── CategoryCard "Découvrir" → [prompt1, prompt2]
│   └── CategoryCard "Organiser" → [prompt1, prompt2]
└── FreeMessagesBadge (si non-premium)
```

---

**C. Widgets riches dans les réponses IA** (Priorité : Haute | Effort : Élevé)

Actuellement, les réponses de l'IA sont du texte Markdown brut rendu par Streamdown. L'infrastructure existe déjà dans le schéma DB (`attachmentType` et `attachmentData` dans la table `messages`), mais elle n'est pas exploitée côté frontend. Les réponses doivent inclure des **widgets interactifs** :

| Type de widget | Déclencheur | Contenu | Action |
|---|---|---|---|
| **Carte Établissement** | L'IA recommande un lieu | Photo, nom, catégorie, note, prix | « Voir la fiche » → `/establishment/:id` |
| **Mini-carte** | L'IA mentionne une localisation | Google Maps embed avec pin | Zoom, pan |
| **Comparateur Budget** | L'IA propose des scénarios | 3 colonnes : Budget / Confort / Luxe | Cliquer pour choisir |
| **Aperçu Parcours** | L'IA génère un itinéraire | Timeline verticale avec étapes | « Voir le parcours complet » → `/trip/:id` |
| **Bouton Réservation** | L'IA confirme un choix | Lien d'affiliation stylisé | Ouvre le lien externe |

**Implémentation technique** : Modifier `generateConciergeResponse` pour détecter quand l'IA mentionne un établissement ou une destination, et ajouter automatiquement un `attachmentType` et `attachmentData` au message. Côté frontend, créer un composant `ChatMessageWidget` qui parse `attachmentData` et rend le widget approprié.

---

**D. Transition émotionnelle au paywall** (Priorité : Moyenne | Effort : Faible)

Le message actuel au 3e message est : « Vous avez utilisé vos 3 messages gratuits. Passez au plan Premium (90€/mois) ». C'est trop transactionnel. Le remplacer par une transition en deux temps :

**Message 3 (dernier gratuit)** : L'IA répond normalement mais ajoute en bas : « *C'est votre dernier message offert. Pour continuer cette conversation et recevoir votre parcours personnalisé, découvrez nos forfaits à partir de 9,90€/mois.* »

**Message 4 (bloqué)** : Au lieu d'un message d'erreur, afficher un **écran de transition** avec :
- Un résumé de ce que l'IA a compris du besoin du client (extrait de la conversation)
- « Votre parcours est presque prêt. Pour le recevoir, choisissez votre formule. »
- Les 3 forfaits en mini-cards cliquables (Explorer / Premium / Élite)
- Un CTA secondaire : « Acheter 10 crédits (2,99€) pour continuer cette conversation »

---

## 2. Explorer les Destinations — `/discover`

### 2.1 État actuel

La page Discover est un feed de fiches SEO avec une barre de recherche textuelle et des filtres par catégorie (chips : Tout, Restaurants, Hôtels, Activités, Bars, Spas, Expériences). Les fiches s'affichent en grille 3 colonnes avec photo, titre, ville, catégorie et note. C'est fonctionnel mais générique — on pourrait être sur n'importe quel annuaire.

### 2.2 Lacunes identifiées

Il n'y a aucune dimension géographique visuelle (pas de carte). Les filtres sont uniquement par catégorie, sans possibilité de filtrer par budget, style de voyage, ou continent. Il n'y a pas de section « Tendances » ou « Nouveautés ». Le lien entre Discovery et le Chat est faible — aucun CTA ne propose de « créer un parcours autour de cette destination ». La page ne distingue pas les profils de budget.

### 2.3 Améliorations recommandées

**A. Carte monde interactive en header** (Priorité : Haute | Effort : Moyen)

Ajouter en haut de la page Discover une **carte monde interactive** (composant `MapView` déjà disponible) qui affiche les destinations disponibles sous forme de clusters. Le client peut cliquer sur un continent, puis zoomer sur une région, puis voir les établissements. La carte remplace l'approche « annuaire » par une approche « exploration visuelle ».

**Structure** :

```
DiscoverPage
├── DiscoverHeader (titre + bascule vue carte / vue liste)
├── WorldMap (MapView avec clusters par ville/pays)
│   ├── ContinentClusters (Europe: 45, Asie: 23, ...)
│   ├── CityPins (au zoom) avec mini-preview au hover
│   └── FilterOverlay (budget, style, catégorie)
├── FilterBar (chips catégorie + nouveaux filtres)
│   ├── CategoryChips (existant)
│   ├── BudgetSlider (€ → €€€€)
│   ├── StyleDropdown (Romantique, Business, Famille, ...)
│   └── ContinentDropdown (Europe, Asie, Amériques, ...)
└── ResultsGrid (existant, mais enrichi)
```

**Interaction** : Le client peut basculer entre « Vue carte » et « Vue liste » via un toggle en haut à droite. Les filtres s'appliquent aux deux vues simultanément. Au clic sur un pin de la carte, un popup affiche la mini-fiche de l'établissement avec un CTA « Voir la fiche ».

---

**B. Sections thématiques au lieu d'un feed plat** (Priorité : Haute | Effort : Moyen)

Remplacer le feed unique par des **sections thématiques** qui créent un parcours de découverte :

| Section | Contenu | Logique |
|---|---|---|
| **Tendances du moment** | 4-6 fiches les plus vues cette semaine | Tri par `viewCount` décroissant, période 7 jours |
| **Nouveautés** | Dernières fiches publiées | Tri par `publishedAt` décroissant |
| **Pour vous** (si authentifié) | Fiches correspondant au profil | Matching `budgetPreference` + `travelStyle` + `homeCountry` |
| **Par expérience** | Carrousels horizontaux par catégorie | Gastronomie, Bien-être, Aventure, Culture, Nightlife |
| **Destinations secrètes** (Premium+) | Fiches avec tag « secret » | Visibles uniquement pour les abonnés Premium/Élite |

Chaque section a un titre, un sous-titre, et un lien « Voir tout » qui filtre le feed complet.

---

**C. CTA contextuel « Créer un parcours »** (Priorité : Haute | Effort : Faible)

Ajouter un **bouton flottant** en bas de la page Discover : « Créer un parcours avec ces destinations ». Ce bouton apparaît dès que le client a consulté 2+ fiches. Au clic, il redirige vers le chat avec un message pré-rempli : « Je suis intéressé par [nom des fiches consultées]. Pouvez-vous me créer un parcours ? »

**Implémentation** : Stocker les slugs des fiches consultées dans un state local `viewedEstablishments[]`. Quand `viewedEstablishments.length >= 2`, afficher le bouton flottant. Au clic, naviguer vers `/chat` avec un query param `?context=establishments&ids=slug1,slug2,slug3`.

---

**D. Filtres par budget avec indicateurs visuels** (Priorité : Moyenne | Effort : Faible)

Ajouter un filtre budget sous forme de **4 pastilles visuelles** :

| Pastille | Label | Correspondance DB (`priceLevel`) | Visuel |
|---|---|---|---|
| € | Accessible | `budget` | Vert |
| €€ | Confortable | `moderate` | Bleu |
| €€€ | Premium | `upscale` | Or |
| €€€€ | Ultra-luxe | `luxury` | Or avec bordure diamant |

Sur chaque fiche dans le feed, afficher la pastille budget correspondante pour que le client identifie instantanément si c'est dans sa gamme.

---

## 3. Fiches Établissements — `/establishment/:id`

### 3.1 État actuel

La page EstablishmentDetail est déjà riche : hero plein écran, badges catégorie/prix/note, description, infos pratiques (horaires, téléphone, prix, cuisine), highlights, galerie photo/vidéo avec onglets, vidéos virales, anecdotes/secrets, tips pratiques, avis, et liens d'affiliation. C'est l'une des pages les plus abouties de l'app.

### 3.2 Lacunes identifiées

Malgré sa richesse, la fiche est une **impasse de navigation**. Le client lit, admire, mais n'a aucun chemin naturel vers l'action. Il n'y a pas de CTA « Intégrer à mon parcours », pas de section « Établissements similaires », pas d'indication de compatibilité avec le budget du client, et pas de widget de réservation directe. La fiche est un contenu éditorial, pas un outil de conversion.

### 3.3 Améliorations recommandées

**A. CTA flottant sticky « Intégrer à mon parcours »** (Priorité : Haute | Effort : Faible)

Ajouter un **bandeau sticky en bas de l'écran** (mobile) ou en sidebar droite (desktop) avec deux actions :

| Action | Label | Comportement |
|---|---|---|
| Primaire | « Ajouter à mon parcours » | Redirige vers `/chat` avec contexte : « Je veux intégrer [nom établissement] dans un parcours » |
| Secondaire | « Réserver directement » | Ouvre le lien d'affiliation principal (Booking, TheFork, etc.) |

Le bandeau apparaît après 3 secondes de lecture ou au premier scroll. Il reste visible en permanence. Sur mobile, il prend la forme d'un bottom bar avec les deux boutons côte à côte.

**Composant** :

```
EstablishmentCTA (sticky bottom)
├── Button "Ajouter à mon parcours" (primary, gold)
│   └── onClick → navigate("/chat?context=establishment&id={slug}")
└── Button "Réserver" (secondary, outline)
    └── onClick → window.open(affiliateLink)
```

---

**B. Section « Établissements similaires »** (Priorité : Haute | Effort : Moyen)

En bas de chaque fiche, ajouter un carrousel horizontal de 4-6 établissements similaires. La similarité est calculée sur trois critères : même ville, même catégorie, même gamme de prix. Si le client est authentifié, pondérer par ses préférences connues.

**Implémentation** : Créer un endpoint `trpc.establishments.getSimilar` qui prend `{ id, limit }` et retourne les établissements de la même ville + catégorie, triés par note décroissante. Exclure l'établissement courant.

---

**C. Badge de compatibilité budget** (Priorité : Moyenne | Effort : Faible)

Si le client est authentifié et a un `budgetPreference` défini, afficher un **badge de compatibilité** sur le hero de la fiche :

| Compatibilité | Badge | Couleur |
|---|---|---|
| Parfait match | « Dans votre gamme » | Vert |
| Un cran au-dessus | « Un cran au-dessus — Offrez-vous l'exception » | Or |
| Très au-dessus | « Expérience Élite » | Violet |
| En dessous | (pas de badge, ne pas dévaloriser) | — |

Ce badge crée un effet de **nudge psychologique** : le client qui voit « Un cran au-dessus » est tenté de se faire plaisir. Le client qui voit « Dans votre gamme » est rassuré.

---

**D. Widget « Ce que l'IA en dit »** (Priorité : Moyenne | Effort : Moyen)

Ajouter une section entre la description et les avis : « L'avis de votre assistant ». Un court paragraphe généré par l'IA qui contextualise l'établissement par rapport au profil du client. Par exemple : « Kévin, ce restaurant correspond parfaitement à votre goût pour la cuisine japonaise fusion. La vue sur la baie rappelle le rooftop que vous aviez adoré à New York. »

**Implémentation** : Endpoint `trpc.establishments.getAiInsight` (protectedProcedure) qui appelle `invokeLLM` avec le profil client + les données de l'établissement pour générer un paragraphe de 2-3 phrases. Mettre en cache côté serveur (clé : userId + establishmentId, TTL 24h).

---

## 4. Bundles & Sélections — `/inspirations` (nouvelle route)

### 4.1 État actuel

Les bundles sont actuellement affichés sur la landing page (section « Nos sélections exclusives ») sous forme de 4 cartes statiques (10 tables secrètes, 5 rooftops d'exception, 7 chalets d'altitude, Les spas les plus exclusifs). Ils pointent tous vers `/discover` sans filtrage spécifique. Il n'y a pas de page dédiée aux bundles.

### 4.2 Lacunes identifiées

Les bundles sont le point d'entrée le plus puissant pour les clients indécis (« je ne sais pas ce que je veux, inspirez-moi »), mais ils sont noyés dans la landing page et n'ont pas de destination propre. Le clic sur un bundle mène au feed Discovery générique, pas à une sélection curatée. Il n'y a pas de bundles personnalisés par profil.

### 4.3 Améliorations recommandées

**A. Page dédiée `/inspirations`** (Priorité : Haute | Effort : Moyen)

Créer une nouvelle page `/inspirations` qui présente les collections thématiques de manière immersive. La page est organisée en **collections visuelles** (pas un feed plat) :

**Structure de la page** :

```
InspirationsPage
├── HeroSection
│   ├── Title "Laissez-vous inspirer"
│   ├── Subtitle "Collections curatées par notre IA"
│   └── SearchBar "Rechercher une inspiration..."
├── FeaturedCollection (grande carte plein largeur)
│   ├── BackgroundImage (visuel premium)
│   ├── Title "Collection du mois : Été méditerranéen"
│   ├── Description "12 adresses secrètes de la Côte d'Azur à Santorin"
│   └── CTA "Découvrir la collection"
├── CollectionGrid (grille 2x3 ou 3x2)
│   ├── CollectionCard "Gastronomie" → 10 tables secrètes
│   ├── CollectionCard "Nightlife" → 5 rooftops d'exception
│   ├── CollectionCard "Montagne" → 7 chalets d'altitude
│   ├── CollectionCard "Bien-être" → Spas les plus exclusifs
│   ├── CollectionCard "Romantique" → Lunes de miel inoubliables
│   └── CollectionCard "Aventure" → Expériences extrêmes
├── PersonalizedSection (si authentifié)
│   ├── Title "Pour vous, Kévin"
│   └── CollectionCards basées sur budgetPreference + travelStyle
└── CTASection
    ├── "Aucune collection ne vous correspond ?"
    └── Button "Parlez à votre assistant" → /chat
```

---

**B. Page de collection individuelle `/inspirations/:slug`** (Priorité : Haute | Effort : Moyen)

Chaque collection a sa propre page avec un design éditorial magazine :

```
CollectionDetailPage
├── HeroSection (visuel plein écran + titre + description)
├── IntroText (paragraphe éditorial IA : pourquoi cette sélection)
├── EstablishmentList (liste ordonnée, pas une grille)
│   ├── #1 EstablishmentCard (grande, avec photo + description longue)
│   ├── #2 EstablishmentCard
│   ├── ...
│   └── #N EstablishmentCard
├── CTAMidPage
│   └── "Envie de transformer cette sélection en parcours ?" → /chat
├── RelatedCollections (carrousel de 3 collections similaires)
└── StickyBottomCTA
    └── "Créer mon parcours à partir de cette sélection" → /chat
```

**Implémentation technique** : Créer une table `collections` dans le schéma Drizzle (id, slug, title, subtitle, description, heroImageUrl, category, establishments JSON array, status, publishedAt). Créer les endpoints `trpc.collections.getPublished`, `trpc.collections.getBySlug`. L'IA génère les collections automatiquement via le département Acquisition & Contenu.

---

**C. Bundles personnalisés « Pour vous »** (Priorité : Moyenne | Effort : Élevé)

Pour les clients authentifiés avec un profil enrichi, générer des **bundles personnalisés** en temps réel. Par exemple, un client avec `travelStyle: "romantic"` et `budgetPreference: "premium"` qui habite à Paris verrait : « 5 escapades romantiques à moins de 3h de Paris ».

**Implémentation** : Endpoint `trpc.collections.getPersonalized` (protectedProcedure) qui utilise le LLM pour sélectionner et ordonner les établissements existants en fonction du profil client. Résultat mis en cache 24h.

---

## 5. Parcours Voyage — `/trip/:id`

### 5.1 État actuel

La page TripPlan est la plus avancée techniquement : split-view avec panneau gauche (onglets par jour, timeline des étapes, infos transport/coût/tips) et panneau droit (MapView Google Maps avec markers et polyline). Elle gère les types de voyage, les niveaux de budget, les modes de transport, les statuts de confirmation. C'est un outil puissant mais actuellement accessible uniquement via le chat (l'IA doit créer le trip plan).

### 5.2 Lacunes identifiées

Le parcours est un objet « fermé » : il n'est pas partageable, pas exportable, pas modifiable par le client directement. Il n'y a pas de boutons de réservation sur chaque étape. Le client ne peut pas comparer plusieurs scénarios de budget pour le même parcours. Il n'y a pas de vue « résumé » avec le coût total et les liens de réservation groupés.

### 5.3 Améliorations recommandées

**A. Boutons de réservation par étape** (Priorité : Haute | Effort : Moyen)

Sur chaque carte d'étape dans le panneau gauche, ajouter un **bouton de réservation** contextuel si l'étape est liée à un établissement avec des liens d'affiliation :

| Type d'étape | Bouton | Lien |
|---|---|---|
| `checkin` (hôtel) | « Réserver cet hôtel » | Lien Booking.com |
| `meal` (restaurant) | « Réserver cette table » | Lien TheFork |
| `activity` | « Réserver cette activité » | Lien Viator/GetYourGuide |
| `flight` | « Voir les vols » | Lien Skyscanner/Amadeus |
| `transfer` | « Réserver le transfert » | Lien locale ou Uber |

Chaque clic est tracké via `trpc.affiliate.trackClick` pour comptabiliser les commissions.

---

**B. Vue résumé « Mon voyage en un coup d'œil »** (Priorité : Haute | Effort : Moyen)

Ajouter un onglet « Résumé » en plus des onglets par jour. Ce résumé affiche :

```
TripSummaryTab
├── TripHeader (destination, dates, voyageurs, type)
├── CostBreakdown
│   ├── Transport : XXX€ (vol + transferts)
│   ├── Hébergement : XXX€ (X nuits)
│   ├── Restauration : XXX€ (X repas)
│   ├── Activités : XXX€
│   ├── ──────────────────
│   └── Total estimé : XXXX€
├── BookingChecklist
│   ├── ☐ Vol aller → [Réserver]
│   ├── ☐ Hôtel (3 nuits) → [Réserver]
│   ├── ☐ Restaurant Jour 1 → [Réserver]
│   ├── ☐ Activité Jour 2 → [Réserver]
│   └── ☐ Vol retour → [Réserver]
└── ActionButtons
    ├── "Partager ce parcours" (lien public)
    ├── "Exporter en PDF"
    └── "Modifier avec l'assistant" → /chat
```

---

**C. Partage social du parcours** (Priorité : Moyenne | Effort : Moyen)

Permettre au client de **partager son parcours** via un lien public. Le parcours partagé est en lecture seule, avec les établissements visibles mais les prix masqués. Le lien inclut un CTA « Créer votre propre parcours avec Baymora ».

**Implémentation** : Ajouter un champ `shareToken` (varchar unique) à la table `tripPlans`. Créer une route publique `/trip/shared/:token` qui affiche le parcours en lecture seule. Le bouton « Partager » génère le token et copie le lien dans le presse-papier.

**Impact ambassadeur** : Chaque parcours partagé est un outil de conversion organique. Le visiteur qui reçoit le lien voit un parcours concret et désirable, avec un CTA pour créer le sien.

---

**D. Comparateur de scénarios budget** (Priorité : Moyenne | Effort : Élevé)

Quand l'IA génère un parcours, elle peut proposer **3 variantes de budget** pour le même itinéraire. Le client peut basculer entre les scénarios via des onglets en haut du parcours :

| Onglet | Hébergement | Restauration | Transport | Total estimé |
|---|---|---|---|---|
| **Confort** | 3 étoiles | Bistrots réputés | Transports en commun | ~1 200€ |
| **Premium** | 4-5 étoiles | Tables étoilées | Taxi/VTC | ~3 500€ |
| **Élite** | Palace/Villa privée | Chef privé | Chauffeur privé | ~12 000€ |

Chaque scénario remplace les établissements et les coûts dans le même plan de voyage. Le client peut mixer (hôtel Premium + restaurants Confort) via un mode « personnaliser ».

---

## 6. Forfaits & Pricing — `/pricing`

### 6.1 État actuel

La page Pricing affiche 2 plans (Découverte 0€ et Premium 90€) au lieu des 3 plans affichés sur la landing (Explorer 9,90€, Premium 29,90€, Élite 89,90€). Il y a un décalage entre la landing et la page pricing. Le CTA Premium affiche un toast « Stripe bientôt disponible ». Les value props en bas sont génériques.

### 6.2 Lacunes identifiées

Le décalage entre la landing (3 plans à 9,90/29,90/89,90€) et la page pricing (2 plans à 0/90€) crée de la confusion. Il n'y a pas de quiz d'orientation. Il n'y a pas de comparaison fonctionnalité par fonctionnalité. Le client ne sait pas quel plan lui correspond. Il n'y a pas de témoignages ou de social proof.

### 6.3 Améliorations recommandées

**A. Aligner les 3 forfaits** (Priorité : Critique | Effort : Faible)

Mettre à jour `Pricing.tsx` pour afficher les mêmes 3 forfaits que la landing : Explorer (9,90€), Premium (29,90€), Élite (89,90€). Ajouter le plan gratuit en mention discrète en haut : « Essayez gratuitement avec 3 messages offerts ».

---

**B. Tableau comparatif détaillé** (Priorité : Haute | Effort : Faible)

Sous les 3 cards de forfaits, ajouter un **tableau comparatif** complet qui liste toutes les fonctionnalités :

| Fonctionnalité | Gratuit | Explorer (9,90€) | Premium (29,90€) | Élite (89,90€) |
|---|---|---|---|---|
| Messages assistant IA | 3 | 20/mois | Illimité | Illimité + proactif |
| Fiches établissements | Basiques | Complètes | Complètes + secrets | + off-market |
| Parcours voyage | Non | 1/mois | Illimité | Illimité + GPS live |
| Mémoire client | Non | Basique | Complète | + cercle proche |
| Bundles personnalisés | Aperçu | Complet | Personnalisé | Exclusif |
| Programme ambassadeur | Non | Non | 15% commissions | 22% commissions |
| Mode Fantôme | Non | Non | Non | Complet |
| Support | FAQ | Email | Prioritaire | Dédié 24/7 |

Le tableau utilise des icônes check/cross/dash pour une lecture rapide.

---

**C. Quiz « Quel forfait pour vous ? »** (Priorité : Moyenne | Effort : Faible)

Ajouter un **quiz interactif en 3 questions** au-dessus des forfaits :

**Question 1** : « Comment voyagez-vous le plus souvent ? »
- Seul ou en couple → Explorer
- En famille ou entre amis → Premium
- Pour le business ou des événements → Élite

**Question 2** : « Quel est votre budget voyage annuel ? »
- < 5 000€ → Explorer
- 5 000€ – 20 000€ → Premium
- > 20 000€ → Élite

**Question 3** : « Qu'est-ce qui compte le plus pour vous ? »
- Les bons plans → Explorer
- La personnalisation → Premium
- L'exclusivité et la discrétion → Élite

Le résultat met en surbrillance le forfait recommandé avec un badge « Recommandé pour vous ».

**Composant** : `PricingQuiz` avec 3 étapes, state local, animation de transition entre les questions, résultat qui scroll vers le forfait recommandé.

---

**D. Social proof et témoignages** (Priorité : Moyenne | Effort : Faible)

Ajouter une section « Ce qu'ils en disent » avec 3 témoignages (à créer quand les premiers clients seront actifs, en attendant utiliser des témoignages fictifs marqués comme exemples) :

```
TestimonialSection
├── Testimonial 1 (Explorer) : "Pour 9,90€ j'ai découvert des adresses que je n'aurais jamais trouvées seul"
├── Testimonial 2 (Premium) : "L'assistant a organisé notre lune de miel en 10 minutes. Chaque détail était parfait."
└── Testimonial 3 (Élite) : "La discrétion et l'accès off-market justifient largement l'investissement."
```

---

## 7. Programme Ambassadeur — `/ambassador` (nouvelle route)

### 7.1 État actuel

Le programme ambassadeur est présenté uniquement dans une section de la landing page. Il n'y a pas de page dédiée, pas de dashboard de suivi des commissions, pas de lien de parrainage généré. Les tables `affiliatePartners`, `affiliateClicks`, `affiliateConversions` existent dans le schéma DB mais ne sont pas exploitées côté frontend pour les clients ambassadeurs.

### 7.2 Améliorations recommandées

**A. Dashboard ambassadeur `/ambassador`** (Priorité : Moyenne | Effort : Élevé)

Créer une page dédiée accessible depuis le profil (pour les clients Premium+) :

```
AmbassadorDashboard
├── Header
│   ├── "Programme Ambassadeur"
│   └── Badge tier (Bronze / Argent / Or / Platine)
├── StatsCards (grille 4 colonnes)
│   ├── "Filleuls actifs" : 12
│   ├── "Commissions ce mois" : 47,80€
│   ├── "Commissions totales" : 234,50€
│   └── "Taux de conversion" : 23%
├── ReferralLink
│   ├── Lien unique : baymora.com/r/kevin-xxx
│   ├── Bouton "Copier le lien"
│   └── Boutons partage (WhatsApp, Instagram, Email)
├── ReferralHistory (tableau)
│   ├── Date | Filleul | Forfait souscrit | Commission | Statut
│   └── ...
├── SharedTrips (parcours partagés qui ont converti)
│   ├── "Week-end à Venise" → 3 inscriptions
│   └── "Safari Tanzanie" → 1 inscription
└── TipsSection
    └── "Comment maximiser vos commissions" (conseils IA)
```

---

**B. Système de tiers ambassadeur** (Priorité : Basse | Effort : Moyen)

Gamifier le programme avec des niveaux :

| Tier | Condition | Commission abonnements | Commission réservations | Avantages |
|---|---|---|---|---|
| **Bronze** | 0-5 filleuls | 10% | 3% | Lien de parrainage |
| **Argent** | 6-20 filleuls | 15% | 5% | + Badge profil |
| **Or** | 21-50 filleuls | 18% | 7% | + Accès Élite offert |
| **Platine** | 50+ filleuls | 22% | 10% | + Événements VIP |

---

## 8. Espace Prestataire B2B — `/partners` (nouvelle route)

### 8.1 État actuel

Les prestataires sont mentionnés dans une section de la landing page avec un CTA « Devenir partenaire » qui ne mène nulle part (pas de formulaire, pas de page dédiée). Les catégories sont listées (Hôtellerie, Gastronomie, Transport, Yachts, etc.) mais sans action concrète.

### 8.2 Améliorations recommandées

**A. Page d'onboarding prestataire `/partners`** (Priorité : Moyenne | Effort : Moyen)

Créer une landing page dédiée aux prestataires avec un formulaire de candidature :

```
PartnersPage
├── HeroSection
│   ├── Title "Rejoignez le réseau Maison Baymora"
│   ├── Subtitle "Recevez des clients qualifiés, prêts à réserver"
│   └── Stats "250+ établissements | 15 pays | 0€ d'inscription"
├── ValueProposition (3 colonnes)
│   ├── "Clients qualifiés" : Nos clients arrivent informés et décidés
│   ├── "Zéro risque" : Commission uniquement sur réservation confirmée
│   └── "Visibilité IA" : Votre fiche optimisée par notre intelligence artificielle
├── HowItWorks (4 étapes)
│   ├── 1. Candidatez (formulaire)
│   ├── 2. Validation (notre équipe vérifie)
│   ├── 3. Fiche créée (l'IA génère votre fiche premium)
│   └── 4. Clients arrivent (recommandations IA personnalisées)
├── ApplicationForm
│   ├── Nom de l'établissement
│   ├── Catégorie (dropdown)
│   ├── Ville + Pays
│   ├── Site web
│   ├── Email de contact
│   ├── Téléphone
│   ├── Description courte
│   └── Submit → notifyOwner + confirmation email
├── FAQ
│   ├── "Combien ça coûte ?" → 0€, commission sur réservations
│   ├── "Comment sont sélectionnés les clients ?" → IA + profil vérifié
│   └── "Puis-je gérer ma fiche ?" → Dashboard prestataire (à venir)
└── TestimonialsPrestataires (quand disponibles)
```

**Implémentation** : Créer un endpoint `trpc.partners.apply` (publicProcedure) qui enregistre la candidature dans une nouvelle table `partnerApplications` et appelle `notifyOwner` pour alerter l'admin.

---

## Synthèse des Priorités

| # | Amélioration | Point d'entrée | Priorité | Effort | Impact conversion |
|---|---|---|---|---|---|
| 1 | Aligner les 3 forfaits sur Pricing | Pricing | Critique | Faible | Élevé |
| 2 | Quick prompts dynamiques | Chat | Haute | Faible | Moyen |
| 3 | Écran d'accueil immersif chat | Chat | Haute | Moyen | Élevé |
| 4 | CTA flottant « Intégrer au parcours » | Fiches | Haute | Faible | Élevé |
| 5 | Sections thématiques Discovery | Discovery | Haute | Moyen | Élevé |
| 6 | Page `/inspirations` dédiée | Bundles | Haute | Moyen | Élevé |
| 7 | Carte monde interactive | Discovery | Haute | Moyen | Moyen |
| 8 | Widgets riches dans le chat | Chat | Haute | Élevé | Très élevé |
| 9 | Boutons réservation par étape | Parcours | Haute | Moyen | Très élevé |
| 10 | Vue résumé parcours | Parcours | Haute | Moyen | Élevé |
| 11 | Tableau comparatif pricing | Pricing | Haute | Faible | Moyen |
| 12 | Établissements similaires | Fiches | Haute | Moyen | Moyen |
| 13 | Transition émotionnelle paywall | Chat | Moyenne | Faible | Élevé |
| 14 | Badge compatibilité budget | Fiches | Moyenne | Faible | Moyen |
| 15 | Quiz pricing | Pricing | Moyenne | Faible | Moyen |
| 16 | Partage social parcours | Parcours | Moyenne | Moyen | Moyen |
| 17 | Comparateur scénarios budget | Parcours | Moyenne | Élevé | Élevé |
| 18 | Widget « Ce que l'IA en dit » | Fiches | Moyenne | Moyen | Moyen |
| 19 | Dashboard ambassadeur | Ambassadeur | Moyenne | Élevé | Moyen |
| 20 | Page onboarding prestataire | B2B | Moyenne | Moyen | Moyen |
| 21 | Bundles personnalisés | Bundles | Moyenne | Élevé | Élevé |
| 22 | Filtres budget visuels | Discovery | Moyenne | Faible | Faible |
| 23 | Social proof pricing | Pricing | Moyenne | Faible | Moyen |
| 24 | Système tiers ambassadeur | Ambassadeur | Basse | Moyen | Faible |

---

*Document confidentiel — Maison Baymora — Avril 2026*
