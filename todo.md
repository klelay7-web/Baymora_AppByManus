# Baymora — Project TODO

## Phase 1 : Infrastructure & Design System
- [x] Design system global (index.css) : palette bleu nuit #080c14 + or #c8a94a, Playfair Display + Inter
- [x] ThemeProvider dark par défaut
- [x] Schéma Drizzle complet (users, conversations, messages, seoCards, affiliatePartners, affiliateClicks, affiliateConversions, credits, subscriptions, travelCompanions, userPreferences, agentTasks, socialMediaPosts)
- [x] Migrations SQL appliquées

## Phase 2 : Backend (tRPC Routers & Services)
- [x] Auth router : me, logout (déjà scaffold), rôles admin/user/owner
- [x] Chat router : sendMessage (streaming LLM), getConversations, getMessages
- [x] Service LLM : invokeLLM avec system prompt conciergerie luxe, mémoire client
- [x] Credits router : getBalance, deductCredits (atomique), rechargeCredits, rollover (3x)
- [ ] Subscription router : getPlans, subscribe (90€/mois), cancelSubscription (nécessite Stripe)
- [x] SEO Cards router : listCards, getCard, generateCard (IA), publishCard
- [x] Affiliation router : listPartners, trackClick, trackConversion, getDashboard
- [x] Social Media router : generatePost, listPosts, getPostStatus
- [x] Admin router : stats, manageUsers, manageCards, manageParters
- [x] Agent Tasks router : listTasks, getTaskStatus, triggerAgent
- [x] Voice transcription : transcribeAudio via Whisper
- [x] Image generation : generateCardImage via built-in imageGeneration
- [x] Owner notifications : nouveaux abonnements, commissions seuil, erreurs critiques

## Phase 3 : Frontend Pages
- [x] Layout global mobile-first avec navigation bottom (smartphone)
- [x] Landing page / Accueil : hero premium, feed infini de fiches SEO, teaser chat (3 msgs gratuits)
- [x] Page Chat Concierge : interface conversationnelle premium, streaming, voice input, widgets riches
- [x] Page Fiche SEO locale : template optimisé Google + LLM, Schema.org, photos, liens affiliation
- [ ] Page Dossier Voyage : parcours personnalisé, liens affiliation prêts à cliquer
- [x] Page Profil & Mémoire : préférences, allergies, proches, historique
- [x] Page Abonnement : plans, paiement 90€/mois, gestion crédits
- [x] Dashboard Admin : stats, gestion fiches, gestion agents, commissions
- [x] Page 404 personnalisée

## Phase 4 : Intégrations & Agents IA
- [x] Moteur SEO Local : génération quotidienne de fiches via LLM
- [x] Automatisation Social Media : transformation fiches → posts Instagram/TikTok
- [x] Architecture Event-Driven : Event Bus (in-process pour MVP), départements IA
- [x] Département Acquisition & Contenu : agents rédacteurs SEO, trend spotters
- [x] Département Conciergerie : agent superviseur, profilers
- [x] Département Logistique : agents chercheurs, logisticiens, affiliation
- [x] Département Qualité : agents fact-checkers

## Phase 5 : Tests & Livraison
- [x] Tests Vitest backend (auth, credits, chat, affiliation) — 11 tests, 2 suites, all passing
- [x] Push sur GitHub Baymora_AppByManus
- [x] Checkpoint final

## Fonctionnalités en attente (Phase 2)
- [ ] Intégration Stripe pour abonnements Premium 90€/mois
- [ ] Page Dossier Voyage (parcours personnalisé)
- [ ] Intégration API Unsplash/Pexels pour images de fiches
- [ ] API affiliations externes (Booking.com, TheFork, Amadeus, Viator)

## Phase 6 : Refonte Majeure — Vision Concierge Complète

### 6.1 Modèle économique Staycation mondial
- [ ] Système d'offres à prix réduit (entrée de gamme luxe accessible)
- [ ] Montée en gamme progressive (budget → premium → ultra-premium)
- [ ] Scénarios multi-budget pour chaque recommandation (3 niveaux de prix)
- [ ] Détection du type de voyage (business, loisir, romantique, famille, staycation)

### 6.2 Assistant IA proactif omniscient
- [ ] Mémoire client complète (cercle proche, préférences, allergies, historique)
- [ ] Auto-apprentissage : l'IA renseigne la fiche client si incomplète
- [ ] Recommandations proactives (proposer avant que le client ne demande)
- [ ] Adaptation contextuelle (budget, type de voyage, nombre de personnes)
- [ ] Parcours multi-scénarios sélectionnables par le client

### 6.3 Chat split-view avec carte interactive
- [ ] Layout split : chat à gauche, carte interactive à droite
- [ ] Carte Google Maps interactive avec parcours en temps réel
- [ ] Simulation de voyage (animation avion sur la carte)
- [ ] Affichage des établissements/prestataires sur la carte (cliquables)
- [ ] Solutions de transport intégrées (à pied, chauffeur, voiture, vélo, Uber)

### 6.4 Parcours voyage jour par jour
- [ ] Planning jour par jour avec étapes sur la carte
- [ ] GPS de parcours géolocalisé pour chaque journée
- [ ] Temps de trajet entre chaque étape
- [ ] Informations parking, transports, distances
- [ ] Adaptation business vs loisir vs romantique

### 6.5 Fiches établissements premium ("sexy")
- [ ] Hero soigné avec photo plein écran
- [ ] Galerie photos (plats, chambres, prestations, parcs, vues)
- [ ] Vidéos TikTok/Instagram virales intégrées
- [ ] Description détaillée, anecdotes, secrets, choses à savoir
- [ ] Avis clients, retours, ce qu'il s'en dit
- [ ] Liens d'affiliation intégrés pour réservation directe

### 6.6 Schéma DB enrichi
- [x] Table establishments (fiches établissements détaillées)
- [x] Table tripPlans (plans de voyage complets)
- [x] Table tripDays (jours de voyage avec étapes)
- [x] Table tripSteps (étapes individuelles avec géolocalisation)
- [x] Table establishmentMedia (photos, vidéos par établissement)
- [x] Enrichissement table userPreferences (cercle proche, type voyage)

## Phase 7 : Écosystème d'Affiliation Client & Marketplace B2B
- [ ] Programme d'affiliation client multi-niveaux (commissions sur commissions)
- [ ] Système de parcours vérifiés par les clients (UGC approuvé par IA)
- [ ] Contenu UGC : vidéos TikTok/Instagram des clients intégrées aux fiches
- [ ] Marketplace B2B : fabricants de luxe, agences immobilières, yachts, off-market
- [ ] Accès off-market réservé aux clients Élite (villas, yachts, appartements)
- [ ] Cercle vertueux d'auto-gestion et mutualisme
- [ ] Prospection automatisée des prestataires B2B par agents IA
- [ ] Dashboard client ambassadeur (suivi commissions, parrainages, contenus)

## Phase 8 : Personas Ultra-Riches & Parcours Exclusifs
- [ ] Système de personas client (détection automatique par l'IA)
- [ ] Parcours adaptés par persona (Mogul, Héritier, Discret, Déconnecté, etc.)
- [ ] Stratégie agents espions pour lieux secrets, sécurisés, select
- [ ] Mode "Vitrine" vs mode "Fantôme" pour les clients riches
- [ ] Parcours sécurité/sérénité (lieux zen, privés, sans intrusion)
- [ ] Intelligence comportementale IA (analyse des patterns de consommation)

## Phase 9 : Stratégie Social Media & Protection Juridique
- [ ] Calendrier éditorial IA (5-10 publications/jour)
- [ ] Répartition % des types de contenu (fiches SEO, bundles, tutos, engagement)
- [ ] Formats viraux : carrousels texte, vidéos IA, "5 destinations...", tutos app
- [ ] Mécanique de conversion : commentaire → lien → teaser voilé → paywall
- [ ] Agent Community Manager (réponses commentaires, DM, closing)
- [ ] Publication multi-plateforme (Instagram, TikTok, YouTube)
- [ ] Vidéos IA réalistes (luxe, ski, hôtels, restaurants, fêtes)
- [ ] Protection juridique (brevets, marques, CGU, NDA, anti-copie)

## Phase 10 : Branding & CTA
- [x] Intégrer le logo Baymora (rond typographique) dans la navbar
- [x] Intégrer le favicon.ico
- [x] Intégrer les icônes PWA (192px + 512px)
- [x] Remplacer "Parler au Concierge" par formulation assistant premium
- [x] Remplacer toutes les mentions "concierge" par "assistant" dans le frontend

## Phase 11 : Refonte Landing Page + Branding
- [x] Analyser Quintessentially.com pour inspiration design
- [x] Décider naming : Maison Baymora
- [x] Intégrer logo rond typographique dans la navbar
- [x] Intégrer favicon.ico
- [x] Remplacer "Parler au Concierge" par "Parlez à votre assistant"
- [x] Refondre la landing page : Hero premium, offre claire, prix, packs SEO
- [x] Afficher les 3 forfaits (Explorer 9,90€ / Premium 29,90€ / Élite 89,90€) sur la landing
- [x] Afficher les bundles/packs SEO visibles sur la landing
- [x] Design inspiré Quintessentially (fullscreen, élégant, immersif)
- [x] Visuels IA générés (yacht, gastro, ski, rooftop, spa)
- [x] Section programme ambassadeur
- [x] Section prestataires B2B
- [x] Section crédits one-shot
- [x] CTA final + footer complet

## Phase 12 : Navigation Quintessentially & Points d'Entrée Multiples
- [x] Menu desktop avec dropdowns élégants (Nos Services ▾, Destinations ▾, À Propos ▾)
- [x] Sous-menus structurés : Services (Assistant IA, Parcours Voyage, Bundles, Off-Market)
- [x] Sous-menus : Destinations (Par Continent, Par Expérience, Secrets, Tendances)
- [x] Sous-menus : À Propos (Notre Histoire, Comment ça marche, Devenir Ambassadeur, Prestataires)
- [x] CTA "Demander un accès" ou "Parlez à votre assistant" en haut à droite
- [x] Bouton Login séparé
- [x] Points d'entrée multiples : pas uniquement IA, aussi destinations, bundles, services directs
- [x] Positionnement limpide dès le premier regard
- [x] Menu mobile hamburger avec même structure
- [x] Push sur GitHub
- [x] Corriger double logo : "B" compact dans navbar, logo complet dans hero uniquement
- [x] Corriger l'erreur affichée sur la page (nested anchor fix + lazy AdminDashboard)

## Phase 13 — Implémentation Vision Complète (Dashboards + Landing Refondée)
- [x] Pousser descriptifs stratégiques + visuels complets sur GitHub
- [x] Mettre à jour schéma DB (favoris, collections, commissions ambassadeurs, directives IA, fiches prestataires)
- [x] Refondre la landing page (hero cinématographique, sections conversion, bundles, pricing 3 colonnes)
- [x] Dashboard Client (Mon Espace) — sidebar, parcours, favoris, conversations, crédits
- [x] Dashboard Client Affilié (Programme Ambassadeur) — stats, filleuls, commissions, tiers
- [x] Dashboard Admin SEO & Fiches — gestion fiches, score SEO, aperçu Google, bulk actions
- [x] Dashboard IA SEO — agents autonomes 24/7, logs temps réel, métriques
- [x] Dashboard Contenu & Social Media — calendrier éditorial, générateur split-view, publication
- [x] Dashboard Affiliations & Partenaires — prestataires, réservations, contrats
- [x] Dashboard Commissions — flux financiers, entrantes/sortantes, paiements
- [x] Salle de Réunion IA (QG) — conversation départements, KPIs, directives, compte-rendu
- [x] Connecter et interconnecter tous les dashboards, routes, navigation, permissions
- [x] Tester et sauvegarder checkpoint
- [x] Pousser tout sur GitHub

## Phase 14 — Construction Complète de l'Expérience

### Sprint 1 — Chat IA Interactif Split-View
- [x] Message d'accueil proactif qui donne envie (l'IA prend l'initiative)
- [x] Réponses cliquables (boutons) au lieu de texte libre — minimum d'écriture pour le client
- [x] Option "Autre" pour écrire sa propre réponse si les propositions ne conviennent pas
- [x] Split-view : conversation à gauche, fiches/map/récap à droite
- [x] Génération de 3 parcours différents par l'IA, sélection et enregistrement
- [x] Panneau droit : fiche établissement, récap parcours, map interactive
- [x] Système de réservation en ligne (soi-même) depuis le panneau droit
- [x] Système de partage : vers proche, assistant, conciergerie préférée, conciergerie partenaire Baymora
- [x] Backend IA : system prompt interactif avec questions et propositions cliquables

### Sprint 2 — Fiches Établissements & Map Interactive
- [x] Fiches établissements SEO complètes avec hero, visuels, contenu
- [x] Map interactive jour par jour (GPS, transport, notifications)
- [x] Chaque établissement cliquable sur la map avec sa fiche SEO
- [ ] Sync calendrier Google, notifications, rappels

### Sprint 3 — Contenus de Toutes les Pages
- [x] Page Destinations (par continent, par expérience, secrets, tendances)
- [x] Page Nos Services (assistant IA, parcours, bundles, off-market, mode fantôme)
- [x] Page Inspirations/Bundles
- [x] Page À Propos (notre histoire, comment ça marche)
- [x] Page Devenir Ambassadeur (intégré dans À Propos)
- [x] Page Prestataires B2B (intégré dans À Propos #b2b)

## Phase 15 — Carte Interactive Google Maps
- [x] Composant InteractiveMap avec pins cliquables, itinéraires, transport
- [x] Intégration dans le panneau droit du Chat split-view
- [x] Intégration dans la page TripPlan (parcours jour par jour)
- [x] Pins numérotés par jour avec fiches cliquables
- [x] Options transport (Uber, chauffeur, métro, à pied)
- [x] Itinéraires tracés entre les étapes
- [x] Popup fiche établissement au clic sur un pin

## Phase 16 — Alimentation Fiches SEO avec Contenu Réel
- [x] Seed DB avec 24 établissements réels (restaurants, hôtels, bars, spas, expériences) dans 6 villes (Paris, Marrakech, Santorini, Tokyo, New York, Bali)
- [x] Descriptions IA riches et SEO-friendly pour chaque établissement
- [x] 24 photos IA générées et uploadées sur CDN pour chaque établissement
- [x] Métadonnées SEO Schema.org (Restaurant, Hotel, BarOrPub, Museum, TouristAttraction, HealthAndBeautyBusiness) dans les fiches
- [x] 6 bundles pré-remplis avec des sélections curatées (Paris romantique, Marrakech immersion, Santorini luxe, Tokyo secret, NY insider, Bali transformation)
- [x] Formatage horaires d'ouverture lisible (au lieu de JSON brut)
- [x] Rendu Schema.org JSON-LD dans les pages d'établissement
- [x] Meta tags OG (Open Graph) pour partage social
- [x] Tester le rendu des fiches avec contenu réel — 24/24 fiches vérifiées
- [x] Pousser sur GitHub (checkpoint f0204442)

## Phase 17 — Commentaires IA Engagement sur Fiches Établissements
- [x] Créer table `establishmentComments` (DB + migration 0004)
- [x] Router tRPC : getByEstablishment, getCount, markHelpful, generateAI
- [x] Service IA : commentGenerator.ts avec invokeLLM + JSON schema strict
- [x] Composant frontend CommentsSection : note moyenne, distribution, avatars, badges vérifiés, boutons Utile/Signaler
- [x] Seed 120 commentaires IA (5 par établissement x 24) avec contenu spécifique par slug
- [x] Interactions : bouton Utile avec compteur optimiste, Signaler avec toast
- [x] 7 tests vitest (comments.test.ts) — 18 tests totaux passants
- [x] Checkpoint f47fa092 et livraison

## Phase 18 — Système de Reporting Terrain (Rôle Team)
- [x] Migration DB : rôle `team` ajouté à l'enum users.role (migration 0005)
- [x] Table `fieldReports` : rapport terrain complet (20+ champs)
- [x] Table `fieldReportServices` : prestations détaillées (nom, catégorie, prix min/max, devise, sur devis, durée)
- [x] Table `fieldReportJourneySteps` : parcours transport (10 types d'étapes, compagnie, vol, coût, inclus)
- [x] Table `fieldReportContacts` : contacts (nom, rôle, tél, email, WhatsApp, langues, principal)
- [x] Table `fieldReportMedia` : photos/vidéos (12 catégories, upload S3)
- [x] `teamProcedure` backend : accès restreint team + admin
- [x] Router tRPC `fieldReports` : create, update, getMyReports, getAll, submit, enrichWithAI, addService, addJourneyStep, addContact, addMedia
- [x] Page `/team/fiches` : dashboard avec liste des rapports + statuts
- [x] Formulaire multi-étapes 7 sections : Établissement, Prestations, Parcours, Contacts, Médias, Conseils, Résumé
- [x] Upload photos/vidéos vers S3 avec catégorisation (endpoint /api/upload/field-report)
- [x] Service IA `fieldReportEnricher` : description SEO, recherche, recommandation, Schema.org
- [x] Enrichissement IA : génère description 300-500 mots, recherche réputation/certifications, recommandation parcours, métadonnées SEO
- [x] Conversion rapport → fiche : workflow submit → ai_processing → review → approved → published
- [x] Lien navbar desktop + mobile "Terrain" pour team + admin
- [x] 11 tests vitest (fieldReports.test.ts) — 29 tests totaux passants
- [x] Checkpoint ba47d35a et livraison
