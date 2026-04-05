# Maison Baymora — Stratégie des Points d'Entrée, Parcours Utilisateur & Prise en Charge IA

**Document stratégique interne** | Version 1.0 | Avril 2026
**Auteur** : Manus AI pour Maison Baymora

---

## Philosophie Fondatrice

> « Ne rien posséder. Tout contrôler. » — John D. Rockefeller

Maison Baymora est un **hub d'interconnexion premium** entre des clients exigeants et les meilleurs prestataires de luxe au monde. L'application ne possède aucun hôtel, aucun restaurant, aucun yacht. Elle possède quelque chose de bien plus précieux : **le système**, la relation client, la mémoire, l'intelligence, et le contrôle du flux entre l'offre et la demande.

Chaque point d'entrée de l'application doit refléter cette philosophie : **qualifier le client, comprendre son profil, et l'orienter vers le bon prestataire au bon moment**, tout en capturant de la valeur à chaque étape via l'affiliation, l'abonnement et les crédits.

---

## I. Cartographie des Points d'Entrée

L'application dispose de **8 points d'entrée distincts**, chacun conçu pour capter un profil différent et le guider vers la conversion. Ils sont répartis en trois catégories : les entrées par l'inspiration, les entrées par le besoin, et les entrées par la relation.

### 1.1 Vue d'ensemble

| # | Point d'entrée | Route | Accès | Profil cible principal | Objectif de conversion |
|---|---|---|---|---|---|
| 1 | **Assistant IA** | `/chat` | Gratuit (3 msgs) puis payant | Tous profils | Qualifier → Abonnement |
| 2 | **Explorer les Destinations** | `/discover` | Public | Curieux, rêveurs, planificateurs | Inspirer → Engagement → Chat |
| 3 | **Fiches Établissements** | `/establishment/:id` | Public | SEO entrant, réseaux sociaux | Découvrir → Réserver (affiliation) |
| 4 | **Bundles & Sélections** | `/discover` (filtré) | Public | Indécis, chercheurs d'inspiration | Inspirer → Chat → Parcours |
| 5 | **Parcours Voyage** | `/trip/:id` | Premium | Voyageurs confirmés | Planifier → Réserver (affiliation) |
| 6 | **Forfaits & Pricing** | `/pricing` | Public | Comparateurs, décideurs | Comparer → S'abonner |
| 7 | **Programme Ambassadeur** | `/pricing` (section) | Premium | Clients satisfaits, influenceurs | Parrainer → Commissions |
| 8 | **Espace Prestataire B2B** | Landing (section) | Public | Hôtels, restaurants, agences | Rejoindre le réseau |

### 1.2 Matrice d'accessibilité par forfait

| Point d'entrée | Gratuit (0€) | Explorer (9,90€) | Premium (29,90€) | Élite (89,90€) |
|---|---|---|---|---|
| Assistant IA | 3 messages | 20 messages/mois | Illimité | Illimité + proactif |
| Destinations (browse) | Complet | Complet | Complet | Complet |
| Fiches Établissements | Basique | Complète | Complète + secrets | Complète + off-market |
| Bundles & Sélections | Aperçu | Complet | Complet + personnalisé | Complet + exclusif |
| Parcours Voyage | Non | 1/mois | Illimité | Illimité + GPS live |
| Profil & Mémoire | Non | Basique | Complet | Complet + cercle proche |
| Programme Ambassadeur | Non | Non | 15% commissions | 22% commissions |
| Mode Fantôme | Non | Non | Non | Complet |

---

## II. Les 5 Profils Utilisateur & Leur Budget

L'IA de Maison Baymora identifie automatiquement le profil du client dès les premières interactions, en analysant le vocabulaire utilisé, les destinations mentionnées, le type de compagnons de voyage, et les attentes exprimées. Chaque profil correspond à un **budget implicite**, un **style de voyage**, et une **stratégie de prise en charge IA** différente.

### 2.1 Tableau des profils

| Profil | Budget mensuel voyage | Forfait naturel | Style dominant | Déclencheur d'entrée | Ce qu'il attend |
|---|---|---|---|---|---|
| **Le Curieux** | < 500€ | Gratuit → Explorer | Découverte, staycation | Réseaux sociaux, SEO | Inspiration, bons plans, accessibilité |
| **Le Planificateur** | 500€ – 2 000€ | Explorer → Premium | Culturel, famille | Recherche Google, bouche-à-oreille | Organisation, gain de temps, fiabilité |
| **L'Hédoniste** | 2 000€ – 10 000€ | Premium | Romantique, bien-être, gastronomie | Recommandation, Instagram | Expériences uniques, personnalisation |
| **Le Mogul** | 10 000€ – 50 000€ | Élite | Business, prestige | Réseau privé, ambassadeur | Discrétion, exclusivité, zéro friction |
| **Le Fantôme** | 50 000€+ | Élite (Mode Fantôme) | Ultra-privé, sécurisé | Invitation directe | Anonymat total, accès off-market |

### 2.2 Détection automatique par l'IA

L'assistant IA qualifie le profil du client via un processus en 3 étapes, invisible pour l'utilisateur :

**Étape 1 — Analyse lexicale** : Dès le premier message, l'IA analyse le vocabulaire. Un client qui dit « je cherche un bon resto pas trop cher à Paris » est classé différemment de celui qui dit « je souhaite une table au Bristol pour un dîner d'affaires ». Le champ `budgetPreference` (economy, moderate, premium, ultra_premium) et `travelStyle` (adventure, relaxation, cultural, business, romantic, family) sont mis à jour dans la base de données.

**Étape 2 — Enrichissement progressif** : À chaque conversation, le service `extractAndSavePreferences` analyse le message et extrait automatiquement les préférences implicites (catégories : dietary, travel_style, budget, accommodation, activities, destinations). Ces données s'accumulent dans la table `userPreferences` avec un score de confiance.

**Étape 3 — Adaptation du ton et des recommandations** : Le system prompt du concierge intègre la mémoire client complète (préférences + compagnons de voyage) pour adapter chaque réponse au profil détecté. Un client Élite reçoit des recommandations off-market ; un client Explorer reçoit des bons plans accessibles.

---

## III. Les 7 Parcours Utilisateur Détaillés

Chaque point d'entrée déclenche un parcours spécifique. Voici le détail de chaque parcours, son process étape par étape, et la prise en charge IA à chaque moment.

### Parcours 1 — « Je parle à l'assistant » (Entrée Chat)

C'est le parcours principal et le plus puissant. Le client arrive avec un besoin (vague ou précis) et l'IA le qualifie, le guide, et le convertit.

| Étape | Action utilisateur | Prise en charge IA | Données capturées | Gate monétisation |
|---|---|---|---|---|
| 1. Accueil | Clique sur « Parlez à votre assistant » | Salutation personnalisée si connu, générique sinon | Session créée | — |
| 2. Expression du besoin | « Je veux partir en Grèce en août avec ma femme » | Qualification : destination, dates, compagnons, style | tripType, companions, destination | — |
| 3. Exploration | L'IA propose 2-3 scénarios (budget → premium → luxe) | Génération de scénarios multi-budget avec établissements réels | budgetPreference, preferences | Message 1-3 gratuit |
| 4. Approfondissement | Le client choisit un scénario et pose des questions | Détails sur les établissements, alternatives, secrets d'initiés | Préférences affinées | **Gate : 3 messages gratuits atteints → abonnement** |
| 5. Parcours généré | L'IA crée un trip plan jour par jour | Création automatique dans tripPlans/tripDays/tripSteps avec géolocalisation | Plan complet avec étapes | Fonctionnalité Premium |
| 6. Visualisation | Le client consulte son parcours sur la carte | Affichage split-view chat + carte Google Maps interactive | Interactions carte | Fonctionnalité Premium |
| 7. Réservation | Le client clique sur les liens de réservation | Liens d'affiliation pré-intégrés (Booking, TheFork, etc.) | affiliateClicks, conversions | **Commission affiliation** |
| 8. Mémoire | Après le voyage, l'IA demande un retour | Enrichissement du profil, suggestions proactives futures | Reviews, satisfaction | Rétention → renouvellement |

**Prise en charge IA détaillée** : Le service `generateConciergeResponse` charge le system prompt enrichi de la mémoire client (préférences + compagnons) à chaque message. L'IA ne propose jamais de lieux fictifs. Elle structure ses réponses en Markdown avec noms réels, types, villes, et phrases d'accroche. Pour les itinéraires, elle structure par jour avec horaires suggérés. En parallèle, `extractAndSavePreferences` analyse chaque message pour enrichir silencieusement le profil.

---

### Parcours 2 — « J'explore les destinations » (Entrée Discovery)

Le client arrive par curiosité ou par recherche. Il browse les fiches sans engagement, puis l'app le guide progressivement vers l'assistant.

| Étape | Action utilisateur | Prise en charge IA | Conversion |
|---|---|---|---|
| 1. Browse | Navigue dans `/discover`, filtre par catégorie (restaurant, hotel, spa...) | Fiches SEO générées par IA, classées par pertinence | — |
| 2. Découverte | Clique sur une fiche établissement | Fiche premium : hero, galerie, anecdotes, secrets, avis | — |
| 3. Intérêt | Lit les détails, regarde les vidéos virales | Contenu éditorial IA enrichi, vidéos TikTok/Instagram intégrées | — |
| 4. Engagement | CTA « Demander un parcours autour de ce lieu » | Redirection vers le chat avec contexte pré-rempli | **Inscription / Login** |
| 5. Conversion | L'assistant prend le relais avec le contexte | L'IA sait déjà quel établissement intéresse le client | → Parcours 1 (Chat) |

**Prise en charge IA** : Les fiches sont générées par le service `generateSeoCard` qui utilise le LLM pour produire du contenu SEO optimisé (meta title, meta description, Schema.org). Les établissements sont enrichis avec des champs éditoriaux premium : `anecdotes`, `thingsToKnow`, `highlights`, `reviews`, `viralVideos`. L'IA de contenu travaille en arrière-plan pour alimenter le catalogue en permanence.

---

### Parcours 3 — « Je veux ce bundle » (Entrée Inspirations/Bundles)

Le client est attiré par une sélection curatée (« Top 10 rooftops Paris », « Week-end romantique Côte d'Azur »). C'est un parcours d'impulsion.

| Étape | Action utilisateur | Prise en charge IA | Conversion |
|---|---|---|---|
| 1. Accroche | Voit un bundle sur la landing ou les réseaux sociaux | Bundles générés par IA, visuels premium | — |
| 2. Consultation | Clique et parcourt la sélection | Liste curatée avec descriptions, photos, prix indicatifs | — |
| 3. Personnalisation | « Je veux ce bundle mais adapté à mon budget » | L'assistant adapte le bundle au profil (dates, budget, compagnons) | **Inscription → Chat** |
| 4. Réservation | Valide le parcours personnalisé | Liens d'affiliation pour chaque établissement | **Commission affiliation** |

---

### Parcours 4 — « Je compare les forfaits » (Entrée Pricing)

Le client arrive avec une intention d'achat. Il compare les offres et choisit son niveau d'engagement.

| Étape | Action utilisateur | Prise en charge IA | Conversion |
|---|---|---|---|
| 1. Comparaison | Consulte la page `/pricing` | Présentation claire des 3 forfaits + crédits à la carte | — |
| 2. Hésitation | Hésite entre Explorer et Premium | CTA contextuel : « Essayez 3 messages gratuits d'abord » | **Inscription gratuite** |
| 3. Essai | Utilise les 3 messages gratuits | L'IA donne un avant-goût exceptionnel pour créer le désir | Gate 3 messages |
| 4. Conversion | S'abonne à Explorer ou Premium | Stripe (à intégrer) | **Abonnement récurrent** |
| 5. Upgrade | Après quelques semaines, veut plus | L'IA suggère subtilement les fonctionnalités Premium/Élite | **Upsell** |

---

### Parcours 5 — « Je veux devenir ambassadeur » (Entrée Affiliation)

Le client satisfait veut monétiser son réseau. C'est un parcours de fidélisation et de croissance organique.

| Étape | Action utilisateur | Prise en charge IA | Conversion |
|---|---|---|---|
| 1. Découverte | Voit la section « Programme Ambassadeur » sur la landing | Présentation des commissions (15-22%) | — |
| 2. Inscription | S'inscrit au programme (nécessite Premium minimum) | Génération d'un lien de parrainage unique | **Abonnement Premium requis** |
| 3. Partage | Partage ses parcours vérifiés, invite ses proches | L'IA aide à créer du contenu partageable (résumés de voyage) | — |
| 4. Commissions | Ses filleuls s'abonnent et réservent | Tracking automatique via `affiliateClicks` et `affiliateConversions` | **Commissions récurrentes** |
| 5. Niveau 2 | Les filleuls de ses filleuls génèrent aussi des commissions | Système multi-niveaux | **Commissions de niveau 2** |

---

### Parcours 6 — « Je suis prestataire » (Entrée B2B)

Un hôtel, restaurant ou agence veut rejoindre le réseau Baymora pour recevoir des clients qualifiés.

| Étape | Action utilisateur | Prise en charge IA | Conversion |
|---|---|---|---|
| 1. Découverte | Voit la section B2B sur la landing | Présentation du modèle : 0€ inscription, commission sur réservations | — |
| 2. Candidature | Remplit un formulaire de contact | Notification automatique au owner via `notifyOwner` | — |
| 3. Onboarding | Validation et création de la fiche établissement | L'IA génère automatiquement la fiche premium (description, SEO, photos) | — |
| 4. Visibilité | Sa fiche apparaît dans le catalogue | L'IA intègre l'établissement dans les recommandations pertinentes | — |
| 5. Revenus | Reçoit des réservations via les liens d'affiliation | Tracking des conversions, dashboard prestataire | **Commission sur réservations** |

---

### Parcours 7 — « J'arrive par Google/TikTok » (Entrée SEO/Social)

Le client ne connaît pas Baymora. Il tombe sur une fiche via Google ou un post viral sur les réseaux sociaux.

| Étape | Action utilisateur | Prise en charge IA | Conversion |
|---|---|---|---|
| 1. Découverte | Recherche Google « meilleur restaurant Santorin » ou voit un post TikTok | Fiche SEO optimisée avec Schema.org, positionnée en top résultats | — |
| 2. Lecture | Lit la fiche établissement complète | Contenu premium : anecdotes, secrets, vidéos virales, avis | — |
| 3. Curiosité | Explore d'autres fiches sur le site | Navigation fluide entre fiches, bundles, destinations | — |
| 4. Engagement | CTA « Créer votre parcours personnalisé » | Redirection vers inscription + chat | **Inscription** |
| 5. Conversion | Utilise l'assistant pour planifier | → Parcours 1 (Chat) | → Abonnement |

---

## IV. Architecture IA — Qui Fait Quoi

L'intelligence artificielle de Maison Baymora n'est pas un simple chatbot. C'est un **écosystème de départements IA** qui travaillent en parallèle pour alimenter, qualifier, convertir et fidéliser.

### 4.1 Départements IA et leurs rôles

| Département | Agents | Rôle | Parcours servis | Statut |
|---|---|---|---|---|
| **Conciergerie** | Superviseur, Profiler | Qualifier le client, adapter le ton, proposer des scénarios | Chat, Parcours Voyage | Actif |
| **Acquisition & Contenu** | Rédacteurs SEO, Trend Spotters | Générer des fiches, bundles, contenu viral | Discovery, SEO, Social | Actif |
| **Logistique** | Chercheurs, Logisticiens, Affiliation | Trouver les prestataires, construire les parcours, intégrer les liens | Parcours Voyage, Réservation | Actif |
| **Qualité** | Fact-checkers | Vérifier que les lieux existent, que les prix sont corrects | Tous | Actif |
| **Social Media** | Community Manager, Créateurs | Transformer les fiches en posts viraux, répondre aux commentaires | SEO/Social (Parcours 7) | Planifié |
| **Prospection B2B** | Scouts, Négociateurs | Identifier et démarcher de nouveaux prestataires | B2B (Parcours 6) | Planifié |

### 4.2 Flux IA par interaction

```
Client envoie un message
        │
        ▼
┌─────────────────────┐
│  Service Concierge   │ ← System prompt + Mémoire client (préférences + compagnons)
│  generateConcierge   │
│  Response()          │
└────────┬────────────┘
         │
         ├──► Réponse personnalisée au client
         │
         └──► extractAndSavePreferences()  ← Enrichissement silencieux du profil
                    │
                    ▼
              userPreferences (DB)
                    │
                    ▼
         Prochaine interaction encore plus personnalisée
```

### 4.3 Prise en charge IA par profil

| Profil | Ton de l'IA | Type de recommandations | Proactivité | Fonctionnalités IA exclusives |
|---|---|---|---|---|
| **Le Curieux** | Chaleureux, pédagogue | Bons plans accessibles, staycations, expériences locales | Faible (réactive) | Suggestions basiques |
| **Le Planificateur** | Structuré, efficace | Itinéraires détaillés, comparatifs, alternatives | Moyenne | Parcours GPS, planning jour/jour |
| **L'Hédoniste** | Inspirant, storytelling | Expériences uniques, secrets d'initiés, anecdotes | Haute | Mémoire complète, cercle proche |
| **Le Mogul** | Sobre, direct, respectueux | Exclusivités, accès VIP, réservations prioritaires | Très haute (proactive) | Recommandations avant la demande |
| **Le Fantôme** | Ultra-discret, codé | Off-market, anonymat, réservations sous pseudonyme | Maximale | Mode Fantôme, réservations anonymes |

---

## V. Intégration UX — Rendre Chaque Point d'Entrée « Sexy »

### 5.1 Principes de design

Chaque point d'entrée doit respecter trois principes fondamentaux pour convertir efficacement :

**Principe 1 — L'immersion immédiate** : Le visiteur doit être transporté dans l'univers Baymora dès le premier pixel. Pas de page blanche, pas de formulaire froid. Des visuels plein écran, des animations subtiles, un sentiment de luxe accessible.

**Principe 2 — La friction intelligente** : Chaque gate de monétisation (3 messages gratuits, fonctionnalités Premium) doit arriver au moment où le client a déjà reçu suffisamment de valeur pour comprendre ce qu'il perd en ne s'abonnant pas. La frustration doit être transformée en désir.

**Principe 3 — Les sorties multiples** : Aucune page ne doit être un cul-de-sac. Chaque écran propose au moins 2 chemins vers un autre point d'entrée. Un client qui ne veut pas parler à l'IA peut explorer les destinations. Un client qui ne veut pas s'abonner peut acheter des crédits à l'unité.

### 5.2 Améliorations UX recommandées par point d'entrée

| Point d'entrée | État actuel | Amélioration recommandée | Priorité |
|---|---|---|---|
| **Assistant IA** | Chat fonctionnel, gate 3 messages | Ajouter des « quick prompts » contextuels (« Week-end à Paris », « Lune de miel Maldives ») pour aider les indécis à démarrer | Haute |
| **Destinations** | Feed de fiches SEO avec filtres basiques | Ajouter une carte monde interactive cliquable + filtres par budget et style de voyage | Haute |
| **Fiches Établissements** | Template éditorial riche | Ajouter un CTA flottant « Intégrer à mon parcours » + widget « Établissements similaires » | Moyenne |
| **Bundles** | Mélangés dans le feed Discovery | Créer une section dédiée `/inspirations` avec des collections thématiques visuelles (carrousels) | Haute |
| **Parcours Voyage** | Split-view chat + carte | Ajouter le partage social du parcours (lien public) + export PDF | Moyenne |
| **Pricing** | 3 forfaits + crédits | Ajouter un quiz « Quel forfait est fait pour vous ? » en 3 questions | Moyenne |
| **Ambassadeur** | Section sur la landing | Créer un dashboard dédié `/ambassador` avec suivi des commissions en temps réel | Basse |
| **B2B** | Section sur la landing | Créer un formulaire dédié `/partners` avec onboarding guidé | Basse |

### 5.3 Parcours de montée en gamme (Upsell naturel)

Le parcours de montée en gamme est le moteur économique de Baymora. Voici comment chaque profil évolue naturellement vers le forfait supérieur :

```
Gratuit (0€)          Explorer (9,90€)        Premium (29,90€)        Élite (89,90€)
     │                      │                        │                       │
     │ 3 msgs gratuits      │ 20 msgs/mois          │ Illimité              │ Proactif
     │ → frustration        │ → envie de plus        │ → habitude            │ → dépendance
     │ → "je veux plus"     │ → "je veux illimité"   │ → "je veux exclusif"  │ → "je ne peux plus
     │                      │                        │                       │    m'en passer"
     ▼                      ▼                        ▼                       ▼
  Inscription           Abonnement              Upgrade                 Fidélité à vie
```

**Déclencheurs d'upsell intégrés dans l'IA** :
- Après le 3e message gratuit : « Vous avez atteint la limite de votre essai. Pour continuer cette conversation et recevoir votre parcours personnalisé, découvrez nos forfaits. »
- Après 15 messages Explorer : « Vous utilisez intensément votre assistant. Avec Premium, vous auriez des messages illimités et des parcours GPS interactifs. »
- Après 3 parcours Premium : « Vos voyages méritent le meilleur. Avec Élite, accédez aux adresses off-market et au Mode Fantôme pour une discrétion absolue. »

---

## VI. Prochaines Étapes d'Implémentation

### 6.1 Priorités immédiates (Sprint 1)

| Action | Impact | Effort | Dépendance |
|---|---|---|---|
| Intégrer Stripe pour les abonnements | Monétisation directe | Moyen | Aucune |
| Créer la page `/inspirations` (bundles dédiés) | Nouveau point d'entrée majeur | Moyen | Contenu IA |
| Ajouter les quick prompts dans le chat | Conversion des indécis | Faible | Aucune |
| Carte monde interactive dans Discovery | Engagement visuel | Moyen | Google Maps (déjà intégré) |

### 6.2 Priorités moyennes (Sprint 2)

| Action | Impact | Effort | Dépendance |
|---|---|---|---|
| Quiz « Quel forfait pour vous ? » | Conversion pricing | Faible | Aucune |
| CTA flottant sur les fiches établissements | Cross-selling | Faible | Aucune |
| Dashboard ambassadeur `/ambassador` | Rétention, croissance organique | Moyen | Programme affiliation |
| Intégration APIs affiliation (Booking, TheFork) | Revenus affiliation | Élevé | Partenariats |

### 6.3 Priorités long terme (Sprint 3+)

| Action | Impact | Effort | Dépendance |
|---|---|---|---|
| Mode Fantôme complet | Différenciation Élite | Élevé | Architecture anonymisation |
| IA proactive (recommandations push) | Rétention Élite | Élevé | Mémoire client mature |
| Formulaire onboarding prestataires | Croissance B2B | Moyen | Validation manuelle |
| Calendrier éditorial social media | Acquisition organique | Élevé | Agents Social Media |

---

## VII. Synthèse — La Machine Baymora

Maison Baymora fonctionne comme un **entonnoir intelligent à 8 entrées** qui converge vers un seul objectif : transformer chaque visiteur en client récurrent qui génère de la valeur à trois niveaux simultanés.

**Niveau 1 — Abonnement** : Le client paie pour accéder à l'assistant IA et aux fonctionnalités premium. Revenus récurrents prévisibles.

**Niveau 2 — Affiliation** : Chaque réservation effectuée via les liens Baymora génère une commission. Le client ne paie rien de plus, mais Baymora capture de la valeur sur chaque transaction.

**Niveau 3 — Réseau** : Chaque client satisfait devient un ambassadeur potentiel qui amène de nouveaux clients. Croissance organique exponentielle.

L'IA est le ciment qui lie ces trois niveaux. Elle qualifie, personnalise, convertit, fidélise, et fait monter en gamme — le tout de manière invisible et élégante. Le client a l'impression de parler à un concierge humain de confiance. En réalité, il interagit avec un système qui apprend, s'adapte, et optimise chaque interaction pour maximiser la valeur créée pour toutes les parties.

> **Ne rien posséder. Tout contrôler.** L'hôtel appartient à l'hôtelier. Le restaurant appartient au chef. Le yacht appartient à l'armateur. Mais le client, sa mémoire, ses préférences, son parcours, et la relation de confiance — tout cela appartient à Maison Baymora.

---

*Document confidentiel — Maison Baymora — Avril 2026*
