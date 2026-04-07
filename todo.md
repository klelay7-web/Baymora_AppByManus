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

## Phase 19 — Prévisualisation Médias dans Formulaire Terrain
- [x] Prévisualisation locale des images avant upload (URL.createObjectURL)
- [x] Prévisualisation locale des vidéos avant upload (balise video inline)
- [x] Lightbox plein écran pour agrandir photos et vidéos (clic sur miniature)
- [x] Barre de progression d'upload (compteur fichiers envoyés / total)
- [x] Drag & drop amélioré avec zone visuelle (bordure + fond + texte dynamique)
- [x] Suppression d'un média avant envoi (bouton X au hover)
- [x] Séparation visuelle : section "Prévisualisation" (en attente) vs "Envoyés" (badge vert)
- [x] Badges type (PHOTO/VIDÉO) + taille fichier (Mo) sur chaque miniature
- [x] Blocage du bouton Suivant si fichiers en attente d'envoi
- [x] 29 tests vitest passants (4 fichiers)
- [x] Checkpoint ccebbd88 et livraison

## Phase 20 — Refonte visuelle & UX complète

- [ ] "Voir tout" cliquable sur page Destinations (blocs continents)
- [ ] Hover CTA lisible (texte visible au survol de la souris)
- [ ] Bouton retour arrière sur toutes les sous-pages
- [ ] Bundles "Prêts à Vivre" → vrais parcours détaillés (pas IA chat)
- [ ] Top 10 → liens vers fiches établissements réelles
- [ ] Hero images sur page Destinations avec photos de couverture par continent
- [ ] Hero images sur page Bundles avec visuels de couverture par bundle
- [ ] Hero images sur page Discover/Inspirations
- [ ] Blocs cliquables avec photos de couverture vivantes partout
- [ ] Mode Fantôme : refonte page avec 3 niveaux distincts (données non revendues / anonymat app / anonymat vie réelle)
- [ ] Ton humain : revoir les textes IA pour rester proche des humains (histoire de Kévin, fondateur)
- [ ] Verrouiller forfait Élite avec badge "En cours de création"
- [ ] Verrouiller Accès Off-Market avec badge "Bientôt disponible"
- [ ] Dashboard owner : courbes revenus/dépenses/inscrits, coûts IA par requête, rentabilité
- [ ] Centre de données interne avec équipe IA analytique
- [ ] Salle de réunion IA : vérifier accès et affichage correct
- [ ] Checkpoint et livraison

## Phase 20 — Secrets, Tarifs, Claude complet, Pilotage Admin
- [ ] Configurer STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET
- [ ] Configurer RESEND_API_KEY (emails transactionnels)
- [ ] Configurer GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
- [ ] Ajouter Stripe au projet (webdev_add_feature)
- [ ] Refonte tarifs : Découverte (gratuit, 15 crédits) / Premium (14.90€, 200 crédits) / Privé (49.90€, illimité)
- [ ] Système crédits : Opus=3, Sonnet=1, Perplexity=+1, rollover cap 3x
- [ ] Feature unlocks : VIP 14.90€/30j, Conciergerie humaine 19.90€/7j, Off-Market 9.90€/30j
- [ ] Programme créateur : points + cash-out (100 pts = 1€, min 1000 pts)
- [ ] Migration DB nouveaux champs crédits/points/rollover
- [ ] Remplacer seoGenerator.ts + agentBus.ts + concierge.ts par Claude
- [ ] Créer bouton "Pilotage" navbar (owner/admin uniquement)
- [ ] Page /pilotage unifiée avec toutes les sections admin

## Phase 21 — Système Email Complet (Resend + Claude)
- [ ] Corriger erreurs TypeScript webhook.ts (credits → credits, elite)
- [ ] Appliquer migration DB 0006 (elite, points, featureExpiry)
- [ ] Service emailService.ts avec Resend + Claude rédacteur
- [ ] Template bienvenue (inscription)
- [ ] Template confirmation abonnement Premium/Privé
- [ ] Template relance abonnement (J+3, J+7 après expiration)
- [ ] Template bons plans hebdomadaires (marketing)
- [ ] Template prospection partenaires B2B
- [ ] Template affiliations (nouveaux partenaires)
- [ ] Template suivi client (J+30 après inscription)
- [ ] Template rapport équipe (hebdo interne)
- [ ] Router tRPC email : sendWelcome, sendSubscription, sendWeeklyPlans, sendProspection
- [ ] Triggers automatiques (inscription → welcome, paiement → confirmation)
- [ ] Page admin /admin/emails (Email Center avec historique + envoi manuel)
- [ ] Bouton "Pilotage" navbar (owner/admin uniquement)
- [ ] Page /pilotage unifiée avec toutes les sections admin
- [ ] Refonte page Pricing (3 plans + feature unlocks + programme créateur)
- [ ] Stripe Checkout pour Premium et Privé

## Phase 22 — Pilotage Complet (IA DG + Dashboard Unifié)
- [ ] Service pilotageService.ts : IA DG Claude Opus avec mémoire persistante owner-only
- [ ] System prompt DG : chef de toutes les équipes, donne ordres à Manus/équipes
- [ ] Table pilotage_messages en DB pour mémoire persistante
- [ ] Router tRPC pilotage : chat DG, stats consolidées, dépenses, facturation
- [ ] Refonte page Pilotage : layout 2 colonnes (chat DG gauche + dashboard droite)
- [ ] Dashboard : stats globales (membres, CA, conversations, fiches)
- [ ] Dashboard : revenus et dépenses (Stripe, API costs, équipe)
- [ ] Dashboard : échanges clients récents (conversations live)
- [ ] Dashboard : campagnes email (historique, taux ouverture)
- [ ] Dashboard : équipes (statut, tâches en cours, rapports)
- [ ] Dashboard : créatives (posts sociaux, fiches, SEO)
- [ ] Actions rapides : modifier n'importe quelle section depuis Pilotage
- [ ] Refonte Pricing (3 plans corrects : 0€ / 14.90€ / 49.90€)
- [ ] Migration DB : appliquer 0006 (elite, points, featureExpiry)

## Phase 22 — ARIA DG + Pilotage Complet
- [x] Service ARIA DG (dgService.ts) : system prompt DG complète, carnet de bord, rapports, alertes, organigramme 7 équipes
- [x] Router tRPC pilotage : chat, dailyReport, history, carnetsDebord, organigramme, strategie, budget, stats
- [x] Migration DB : table pilotageMessages pour mémoire ARIA
- [x] Page Pilotage complète : chat ARIA DG (gauche) + dashboard 6 onglets (Vue Générale, Équipes, Stratégie, Budget, Carnet de Bord, Tâches)
- [x] Bouton Pilotage dans navbar (owner only)
- [x] Stratégie 30/60/90 jours détaillée
- [x] Budget mensuel avec seuil de rentabilité (15 abonnés = 222€)
- [x] 41/41 tests Vitest passent

## Phase 23 — Secrets & Intégrations
- [x] ANTHROPIC_API_KEY configurée (Claude Opus)
- [x] RESEND_API_KEY configurée (emails)
- [x] GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET configurés
- [x] STRIPE_WEBHOOK_SECRET configuré
- [x] Service email Resend + Claude (emailService.ts)
- [x] Router email tRPC (send, preview, triggers automatiques)
- [ ] Stripe Checkout fonctionnel (produits à créer dans dashboard Stripe)
- [ ] Page Pricing refondée avec 3 plans corrects

## Phase 24 — Cercle Familial & Profil Client Complet
- [ ] Migration DB : enrichir userPreferences (30+ champs : alimentation, voyage, lifestyle, logistique, tailles)
- [ ] Migration DB : enrichir travelCompanions (fiche proche complète avec tous les champs)
- [ ] Migration DB : table userDestinations (parcours personnels partageables public/privé/famille)
- [ ] Backend tRPC : profil complet CRUD (getProfile, updateProfile)
- [ ] Backend tRPC : proches CRUD (listCompanions, addCompanion, updateCompanion, deleteCompanion)
- [ ] Backend tRPC : destinations personnelles CRUD (listDestinations, saveDestination, updateVisibility, deleteDestination)
- [ ] Auto-remplissage IA silencieux : extraction infos personnelles dans chaque message Claude
- [ ] Frontend : refondre Mon Espace (fiche profil complète avec tous les champs)
- [ ] Frontend : page Cercle (liste proches + fiches individuelles)
- [ ] Frontend : section Mes Destinations dans page Destinations
- [ ] Tests Vitest pour les nouveaux routers

## Phase 25 — Navigation + Assistante LÉNA (Terrain)
- [ ] Composant BackNav (flèche retour + breadcrumb) réutilisable
- [ ] Ajouter BackNav sur : Dashboard, Salle de Réunion, Pilotage, Terrain, Mon Espace, Admin
- [ ] Menu latéral persistant sur les pages admin (navigation sans retour à l'accueil)
- [ ] Page Terrain refondée : assistante LÉNA (Claude Opus) avec voix
- [ ] LÉNA : questions guidées pour remplir la fiche SEO (nom, adresse, type, services, prix...)
- [ ] LÉNA : mémoire de session (reprend où on s'est arrêté)
- [ ] LÉNA : recherche web Perplexity pour compléter les infos
- [ ] LÉNA : construction fiche SEO finale automatique (Claude)
- [ ] Backend : router tRPC terrain (sessions, questions, recherche, construction fiche)
- [ ] Schema DB : table terrainSessions pour la mémoire LÉNA

## Phase 26 — ARIA Panneau Dynamique
- [ ] Router pilotage.chat retourne panelType + panelData structurés selon intention
- [ ] Pilotage.tsx panneau droit affiche composants visuels dynamiques selon panelType
- [ ] TeamPanel : 7 équipes + agents + tâches en cours visuellement
- [ ] BudgetPanel : CA, coûts, marges, seuil rentabilité avec graphiques
- [ ] StrategyPanel : plan 30/60/90j avec tâches urgentes
- [ ] AlertPanel : alertes actives avec priorité et actions
- [ ] TaskPanel : tâches par équipe avec statut
- [ ] ReportPanel : rapport journalier formaté et structuré

## Phase 27 — Réorganisation Architecture Interne (COMPLÉTÉ)

- [x] Navbar : supprimer Dashboard et Salle de Réunion, garder Terrain (terrain+owner) et PILOTAGE (owner)
- [x] Pilotage.tsx : 5 onglets (Dashboard | Salle de Réunion | Terrain | Carnet | Accès)
- [x] Salle de Réunion dans Pilotage : 7 vrais agents IA (ARIA, LÉNA, MAYA, NOVA, ATLAS, JADE, PIXEL) avec fonctions réelles
- [x] Gestion des accès dans Pilotage (promouvoir rôle terrain/admin depuis l'interface)
- [x] getAllUsers + updateUserRoleById dans db.ts
- [x] 41/41 tests Vitest passent
- [x] Checkpoint 2dcd945f

## Phase 28 — Architecture Bi-Cerveau ARIA+MANUS (selon doc GitHub)

- [ ] Orchestrateur multi-agents : FLASH/EXPLORE/EXCELLENCE (agentAtlas, agentScout, agentOffMarket, agentBoutique)
- [ ] Profiling client automatique : 6 tiers budgétaires, 14 dimensions, 6 modes, 4 styles
- [ ] Binôme LÉNA+SCOUT : LÉNA (Claude Opus) rédige fiches SEO, SCOUT (Perplexity/Manus) fait terrain
- [ ] ARIA DG refondée : rapports de tous agents, ordres à équipes, dialogue direct owner
- [ ] Agent Manus coordinateur : peut parler directement à l'owner pour ses tâches spécifiques
- [ ] Système crédits complet (transactions atomiques, rollover, feature unlocks)
- [ ] Programme créateur (points, cash-out, barème)
- [ ] Collections (modèle Pinterest, limites par plan)
- [ ] Atlas CMS (AtlasVenue, AtlasCityGuide, AtlasCuratedRoute)
- [ ] Off-Market (pépites secrètes, débloquable)
- [ ] Boutique affiliations (commission, suggestion cadeau IA)
- [ ] Calendrier événementiel 40+ fêtes FR/US/INT

## Phase 20 — Système SEO par Ville (Pipeline Complet)

- [ ] Migration DB : étendre catégories seoCards (transport, cityGuide, rooftop, vip, event, boutique, airport, spa_wellness, park_garden, beach, viewpoint, secret_spot, nightlife, shopping_luxury, concierge, villa, private_jet)
- [ ] Migration DB : ajouter champ viralVideos (JSON) dans seoCards + budgetTarget dans bundles
- [ ] Refondre scrapingAgent : pipeline par ville, 20+ catégories, vidéos virales TikTok/Instagram
- [ ] Définir liste des villes prioritaires (France+USA riches en premier)
- [ ] Pipeline SEO→Bundle : génération auto de 3 bundles (budget/moyen/luxe) depuis fiches d'une ville
- [ ] Pipeline Bundle→Parcours : génération auto de parcours depuis les bundles
- [ ] Pipeline contenu social : MAYA génère posts Instagram/TikTok/YouTube + blog SEO (sans révéler le payant)
- [ ] Interface CampaignTab : sélection par ville, pipeline visuel complet, progression live
- [ ] Lancer campagne complète Paris (20+ fiches toutes catégories)
- [ ] Lancer campagne New York

## Phase 18 — Corrections Critiques (06/04/2026)

### 18.1 Persistance session LÉNA cross-device
- [ ] Créer table `lenaSessions` en DB pour persister session, étape, données collectées
- [ ] Endpoint tRPC : saveSession, loadSession par userId
- [ ] Frontend Terrain : charger la session depuis DB au démarrage, sauvegarder à chaque message
- [ ] LÉNA reprend automatiquement où elle s'est arrêtée, même depuis un autre appareil

### 18.2 Tableau de bord des tâches agents
- [ ] Enrichir table `agentTasks` : ajouter champs title, description, requestedBy, progressPercent, notes
- [ ] Endpoint tRPC : createTask, updateTaskProgress, listTasks (filtrés par agent/statut)
- [ ] Quand LÉNA reçoit une demande autonome, créer une tâche traçable en DB
- [ ] Quand ARIA donne un ordre, créer une tâche traçable en DB
- [ ] Onglet "Tâches" dans Pilotage : liste toutes les tâches avec %, agent, statut, date

### 18.3 ARIA conversationnelle et exécutrice
- [ ] Refondre DG_SYSTEM_PROMPT : ARIA répond court, direct, conversationnel
- [ ] ARIA crée une tâche DB quand elle donne un ordre (via tool call ou tag structuré)
- [ ] ARIA ne renvoie JAMAIS vers Manus (l'IA externe) pour des actions internes
- [ ] ARIA peut lancer LÉNA en autonomie sur une fiche (créer la tâche + notifier)
- [ ] Réponses max 3-4 lignes sauf si rapport demandé explicitement

### 18.4 Responsive mobile complet
- [ ] Pilotage : layout mobile (colonne unique, chat plein écran, onglets scrollables)
- [ ] Terrain : layout mobile adapté
- [ ] Toutes les pages : vérifier breakpoints sm/md/lg
- [ ] Navigation bottom bar mobile sur toutes les pages internes

## Sprint 0.5 — Corrections & Ajouts (06/04/2026)

### Corrections visuelles
- [x] Hero : overlay plus sombre + text-shadow pour lisibilité B et texte
- [x] Hero : B stylisé (Playfair Display) remplace le logo image
- [x] Forfaits : mise en pause visible sur chaque plan (1 mois/an, 2 mois/an, illimitée)
- [x] Forfaits : conciergerie par chat ajoutée dans Premium
- [x] Chat mobile : word-break + overflow-wrap sur messages ARIA
- [x] Chat mobile : quick actions scroll horizontal + input compacté
- [x] Pilotage responsive mobile : toggle ARIA/Panneaux, tabs scrollables, cards empilées
- [x] Pilotage : bouton Relancer dans l'historique des missions

### Nouvelles pages et contenus
- [x] Page /ambassadeur-info : explicatif complet programme ambassadeur (niveaux, FAQ, CTA)
- [x] Boutons "En savoir plus" + "Mon dashboard" dans section ambassadeur homepage
- [x] Catégories Conciergerie, Social Clubs, Mariages & VIP, Yachts dans Discover
- [x] Tags Conciergerie, Social Clubs, Mariages & VIP dans section prestataires homepage

### Navigation mobile-first
- [x] AppLayout : header mobile + navbar desktop + bottom nav 5 onglets
- [x] MobileBottomNav : Accueil / Découvrir / ARIA / Parcours / Profil
- [x] MobileHeader : logo B + notifications + avatar
- [x] MobileBackButton : retour sur toutes les sous-pages
- [x] Route /mes-parcours avec page MesParcours

### En cours
- [ ] Section Bundles visible sur la homepage (scroll horizontal)
- [ ] Tendances : générer du contenu réel pour remplir les cliquables vides
- [ ] Système invitation opérateurs terrain par email (lien profil + forfait + dashboard)
- [ ] Vue "Mon Équipe" dans Pilotage pour voir les dashboards terrain

## Sprint 0.6 — Qualification IA + Fiche Client Ultra-Complète

### A. System prompt assistant client
- [x] L'IA doit TOUJOURS qualifier avant de proposer (localisation, contexte, budget, accompagnants)
- [x] "Surprends-moi" = 3-4 questions rapides PUIS proposition ciblée
- [x] L'IA ne propose JAMAIS une destination lointaine sans vérifier où est le client
- [ ] L'IA remplit discrètement la fiche client au fil des conversations
- [ ] L'IA propose d'inviter les proches mentionnés (lien parrainage)

### B. Fiche client ultra-complète (50+ champs)
- [x] Identité : âge, anniversaire, taille, poids, pointure, tailles vêtements
- [x] Permis : types (B, A, bateau, hélico), conduite droite/gauche, manuel/auto
- [x] Véhicules : préférence luxe, quotidien, location
- [x] Logement : préf ville/campagne/balnéaire, appart/villa, piscine/spa/jacuzzi/salle sport
- [x] Localisation : plage/pied plage/centre/transports, chauffeur/uber/autonome (multi-sélection)
- [x] Style : couleurs préférées, goûts, marques préférées, boutiques préférées
- [x] Gastronomie : plats préférés, allergies, régime alimentaire, croyance/religion
- [x] Santé : vue (bonne/mauvaise, lentilles/lunettes), handicap, problèmes spécifiques
- [x] Animaux : race, poids, taille, âge, nom, habitudes, vétérinaire de référence
- [x] Famille : conjoint(e) (homme/femme/non-binaire, couple homo/mixte), enfants (âge, niveau scolaire)
- [x] Clubs & VIP : membre de clubs, avion privé, jet, yacht, bateau, conciergerie préférée
- [x] Préférences : lieux préférés, villes préférées, citations préférées, amis proches
- [x] Gamification : points gagnés en remplissant la fiche, barre de progression
- [x] Adaptation FR/US : questions différentes selon la locale (champs adaptés)
- [x] L'IA peut remplir automatiquement les champs via les conversations (system prompt mis à jour)

## Sprint 0.7 — Système Invitation Opérateurs Terrain

- [ ] Table `teamInvitations` (token, email, téléphone, nom, statut, expiration)
- [ ] Route tRPC `team.invite` (créer invitation + envoyer email OU générer lien WhatsApp/SMS)
- [ ] Route tRPC `team.acceptInvite` (valider token + activer compte team)
- [ ] Route tRPC `team.listInvitations` (liste des invitations envoyées)
- [ ] Route tRPC `team.listMembers` (liste des membres terrain actifs)
- [ ] UI Pilotage onglet Terrain : bouton "Inviter un opérateur" + formulaire (email OU téléphone)
- [ ] UI Pilotage onglet Terrain : liste des membres avec statut (en attente / actif)
- [ ] Page /rejoindre/:token (acceptation invitation, création compte automatique)
- [ ] Email d'invitation avec lien personnalisé OU lien copiable + bouton WhatsApp
- [ ] Activation automatique rôle `team` + forfait Explorer offert

## Phase 21 — Corrections Bugs Signalés (06/04/2026)

- [ ] BUG-1 : 404 quand Théo clique le lien d'invitation → vérifier route /invite/:token en prod
- [ ] BUG-2 : Forfait gratuit (free) non attribué lors de l'inscription via invitation
- [ ] BUG-3 : Après acceptation invitation, Théo n'apparaît pas dans le dashboard terrain
- [ ] BUG-4 : WhatsApp doit envoyer directement au numéro saisi (pas juste ouvrir WhatsApp Web)
- [ ] BUG-5 : Email doit être envoyé directement depuis l'app (Resend) sur l'email saisi
- [ ] BUG-6 : Bug affichage IA — scénarios affichent du "codage" (tags JSON/markdown bruts)
- [ ] BUG-7 : QR cliquables partiels — l'IA ne propose que la moitié des réponses en cliquables
- [ ] BUG-8 : Navigation terrain — pas de flèche retour arrière
- [ ] FEAT-9 : Forfait gratuit — permettre 1-2 parcours complets avant limitation
- [ ] FEAT-10 : Popup upgrade Opus→Sonnet — proposer forfait ou crédits supplémentaires

## Phase 22 — Dashboard Opérateur Terrain Complet (06/04/2026)

- [ ] Profil opérateur validé visible dans TeamDashboard (badge "Profil validé", date d'inscription, forfait actuel)
- [ ] Gestion forfait par admin dans Pilotage : bouton pour attribuer forfait Explorer/Premium à un opérateur
- [ ] Messagerie directe admin→opérateur dans Pilotage + réception dans TeamDashboard
- [ ] Fiches établissements/prestataires : formulaire de création avec statut (à visiter / visité / approuvé / partenariat)
- [ ] Parcours locaux : créer un parcours avec plusieurs établissements dans une ville (découverte, plages, etc.)
- [ ] Upload photos depuis TeamDashboard (S3)
- [ ] Contenu généraliste — remplacer références "chirurgie esthétique Turquie" par exemples universels
- [ ] Badge validation Théo dans Pilotage > Terrain (vert = validé, orange = en attente)
- [ ] Schéma DB : table operator_messages, operator_field_reports (fiches terrain), operator_routes (parcours)

## Phase 23 — Design Apple/Spotify + Évolutions Majeures

### Design global rounded (Apple/Spotify)
- [ ] index.css : variables globales rounded
- [ ] Home.tsx : pills tags rounded-full, cards rounded-2xl, boutons rounded-xl
- [ ] Pricing.tsx : boutons crédits rounded-xl, cards forfaits rounded-2xl
- [ ] Services.tsx : pills catégories rounded-full, bouton "Devenir partenaire" rounded-xl
- [ ] Chat.tsx : pills QR rounded-full, cards établissements rounded-2xl
- [ ] TeamDashboard.tsx : badges rounded-full, boutons rounded-xl
- [ ] Pilotage.tsx : badges rounded-full, boutons rounded-xl

### Hero mobile allégé
- [ ] Home.tsx : masquer logo B + tag CONCIERGERIE sur mobile, titre text-2xl mobile

### Cloche notifications
- [x] routers.ts : procédure team.getUnreadCount (existait déjà)
- [x] routers.ts : getRecentNotifications + markAllNotificationsRead
- [x] MobileHeader.tsx : cloche → drawer notifications messages non lus + badge rouge

### Validation fiches terrain (Pilotage)
- [x] routers.ts : procédure fieldReports.getPendingReviews
- [x] Pilotage.tsx : bloc "À valider" avec Approuver/Rejeter + notes
- [x] Notification auto opérateur via operatorMessages après review

### Dashboard SEO opérateur (TeamDashboard)
- [x] TeamDashboard.tsx : stats SEO par fiche publiée (vues, date, évolution, lien)

### LÉNA proactive
- [x] claudeService.ts : Règle N°6 relance + clôture + proposition sauvegarde

### RightPanel mobile
- [x] Chat.tsx : drawer mobile bottom sheet pour RightPanel (spring animation)
- [x] Chat.tsx : overlay mobile pour fermeture par tap

## Phase 23b — Proactivité MAYA & ARIA
- [x] claudeService.ts : MAYA ultra-proactive — mène les échanges, propose toujours plus, jamais d'attente
- [x] claudeService.ts : QR riches systématiques — 4-6 suggestions cliquables après chaque réponse
- [x] claudeService.ts : Règle N°7 porte de sortie libre impérative ("Autre chose")

## Phase 23c — Liberté client dans les QR de MAYA
- [x] claudeService.ts : MAYA inclut toujours une option "💬 Autre chose" dans chaque QR
- [x] claudeService.ts : MAYA se repositionne immédiatement sur l'intention libre du client

## Phase 24 — Accès total ARIA en écriture DB
- [x] Cartographier les tables que ARIA doit pouvoir écrire (seoCards, establishments, socialMediaPosts, contentCalendar)
- [x] Procédures tRPC admin : aria.getAllSeoCardsAria, aria.getAllEstablishmentsAria, aria.enrichSeoCard, aria.createSeoCardAria, aria.createEstablishmentAria, aria.updateEstablishmentAria, aria.saveSocialPostAria, aria.createContentItemAria, aria.getContentCalendarAria, aria.updateContentStatusAria
- [x] Interface Pilotage ARIA : bouton "Enregistrer en base" + "Copier" sur chaque message ARIA long
- [x] Détection intelligente du type de contenu (reel/script → socialPost, fiche SEO → seoCard, autre → contentCalendar)
- [x] Zéro erreur TypeScript

## Phase 25 — Responsive Pilotage 100% mobile
- [x] Corriger débordement chat ARIA : overflow-hidden + max-w-[400px] + min-w-0 + break-words sur markdown
- [x] Onglet Dashboard : grid-cols-2 md:grid-cols-3 pour stats, grid-cols-1 md:grid-cols-2 pour budget
- [x] Onglet Salle de Réunion : grid-cols-1 sm:grid-cols-2 pour agents
- [x] Onglet Terrain : grid-cols-2 md:grid-cols-4 pour quick actions
- [x] Onglet Creative : grid-cols-2 md:grid-cols-4 + flex-wrap sous-onglets
- [x] Onglet Comms : grid-cols-1 sm:grid-cols-2 md:grid-cols-3 + flex-wrap sous-onglets
- [x] Onglet MANUS DG : flex-wrap header buttons + grid-cols-1 sm:grid-cols-2 md:grid-cols-3
- [x] Tabs navigation : overflow-x-auto scrollbar-hide + min-w-max sur TabsList
- [x] Zéro erreur TypeScript

## Phase 26 — Livraison 100% Opérationnelle

### 26.1 Renommage ARIA → Manus DG
- [ ] Renommer ARIA → "Manus DG" dans dgService.ts (system prompt, identité)
- [ ] Renommer dans Pilotage.tsx (tous les labels, onglets, messages)
- [ ] Renommer dans routers.ts (commentaires, logs)
- [ ] Renommer dans MobileHeader.tsx si mentionné
- [ ] Intégrer clé Runway API dans les secrets (RUNWAY_API_KEY)
- [ ] Créer runwayService.ts (génération vidéo depuis script texte)
- [ ] Module vidéo dans Pilotage : bouton "Générer vidéo" sur chaque script social

### 26.2 Modèle Freemium Spotify
- [ ] Accès gratuit : fiches établissements avec réductions (grandes villes, 5 étoiles uniquement)
- [ ] Paywall parcours IA : "Créer un parcours" → consomme crédits ou forfait payant
- [ ] Logique crédits : N échanges IA gratuits/mois, puis paywall
- [ ] Badge "Avec réduction" sur les fiches accessibles gratuitement
- [ ] Badge "Plan Premium requis" sur les fiches sans réduction
- [ ] CTA "Voulez-vous créer un parcours ?" après sélection d'établissements
- [ ] Parcours payant : inclut chauffeur, resto, transport, avion, expériences sur place
- [ ] Sélection limitée premium même en gratuit (pas de lowcost, uniquement 5 étoiles avec réductions)

### 26.3 Refonte MAYA 6 modes
- [ ] System prompt MAYA : 6 modes (Avant/Live/Retour/Business/Lifestyle/Explorer)
- [ ] Détection automatique du mode selon les premiers mots du client
- [ ] Popup localisation au démarrage (proposition directe, pas dans les paramètres)
- [ ] Budget VIP : option "illimité" → plus de prix, uniquement valeur et expérience
- [ ] Carte supprimée du chat → uniquement dans les fiches établissements
- [ ] Parcours modifiables : Modifier / Supprimer étape / Déplacer / Remplacer / Ajouter
- [ ] 3 scénarios budget dans panneau droit (inférieur -15% / respecté / supérieur +15%)
- [ ] Profil animaux : filtre pet-friendly automatique si animal détecté
- [ ] Mode Business : hébergement, transport, rappels RDV, salle sport, squash, piscine
- [ ] Ce que MAYA ne sait pas faire : 3 alternatives proposées (faire soi-même / transmettre équipe / conciergerie)
- [ ] Filtre hors-sujet : réponse fixe si demande inappropriée

### 26.4 Pilotage Kanban + accès mobile
- [ ] Supprimer chat ARIA/Manus DG de Pilotage (remplacé par rapports automatiques)
- [ ] Kanban : colonnes En attente / En cours / Effectué
- [ ] Lien Pilotage dans nav mobile (owner/admin uniquement)
- [ ] Lien Terrain dans nav mobile (team/admin/owner)
- [ ] Mémoire MANUS persistante en DB (historique conversations entre sessions)

### 26.5 Cron jobs production
- [ ] Rapport hebdomadaire lundi 6h00 → email + notification Kevin
- [ ] Vérification fiches sans photos réelles chaque jour 8h → alerte si manquant
- [ ] Génération 3 contenus sociaux/jour (9h, 13h, 18h) → file de validation
- [ ] Résumé quotidien 22h → notification Kevin

### 26.6 Notifications + Runway
- [ ] Push notifications PWA (manifest, service worker, permission)
- [ ] Notification iPhone à chaque contenu en attente de validation
- [ ] Notification rapport hebdomadaire lundi 6h
- [ ] Module Runway : runwayService.ts + procédure tRPC + UI Pilotage
- [ ] File de validation vidéo dans Pilotage Kanban

### 26.7 Photos réelles + Découverte
- [ ] Google Places API : récupérer photos officielles pour chaque établissement
- [ ] Remplacer photos IA par photos réelles dans les 24 fiches
- [ ] Refonte page Découverte : parcours thématiques, bons plans, lieux secrets
- [ ] Supprimer les établissements/services de la page Découverte

### 26.8 Bugs + Dashboard terrain
- [ ] BUG-1 : 404 invitation → vérifier route /invite/:token
- [ ] BUG-2 : Forfait gratuit non attribué à l'inscription via invitation
- [ ] BUG-3 : Opérateur n'apparaît pas dans dashboard terrain après acceptation
- [ ] BUG-4 : WhatsApp → envoyer directement au numéro saisi
- [ ] BUG-5 : Email envoyé directement depuis Resend sur l'email saisi
- [ ] BUG-6 : Tags JSON/markdown bruts dans le chat → rendu propre
- [ ] BUG-7 : QR cliquables partiels → tous les QR doivent être cliquables
- [ ] BUG-8 : Flèche retour arrière manquante sur pages terrain
- [ ] Dashboard opérateur : voir son travail publié, modifier, valider, pousser
- [ ] Accès forfait gratuit opérateurs depuis Pilotage (Kevin attribue le forfait)
- [ ] Blocage compte opérateur depuis Pilotage

## Phase 26 — Précisions modèle freemium (08/04/2026)

### Accès gratuit
- [ ] Toutes les offres avec réductions : grandes villes + lieux de prestige (Saint-Tropez, Nice, Cannes, Monaco, Courchevel, Megève, Saint-Barth, Ibiza, Mykonos, Portofino, Capri, Marbella, Miami Beach, LA, Hamptons, Aspen, Dubai, Bali, Phuket, Marrakech...)
- [ ] Liste `PREMIUM_DESTINATIONS` dans shared/constants.ts — éditable depuis Pilotage
- [ ] Réservation style Staycation : offres packagées 1/2/3 nuits avec prix réduit affiché
- [ ] IA limitée : 5 échanges/mois puis paywall
- [ ] 3 essais création parcours puis paywall
- [ ] Aperçu verrouillé des bundles luxe et sélections VIP

### Accès payant
- [ ] IA illimitée + parcours complets
- [ ] Bundles luxe et sélections VIP déverrouillés
- [ ] Accès aux deux modes : réductions OU Premium/VIP (choix mémorisé dans profil)
- [ ] MAYA pose la question au démarrage du parcours : "Voulez-vous voir les offres avec réductions ou uniquement les sélections Premium/VIP ?"
- [ ] Préférence sauvegardée dans userPreferences.contentMode ('discount' | 'premium' | 'both')
- [ ] Changeable à tout moment depuis le profil

### Notification mode réductions (membres payants)
- [ ] Bannière contextuelle quand membre payant navigue dans sélection réductions : "Vous êtes dans la sélection avec réductions — Continuer | Passer en espace VIP Premium"
- [ ] Villas de prestige avec réduction dans la sélection gratuite/réductions (ex : villa Saint-Tropez 12 500€/sem au lieu de 15 000€)
- [ ] Champ `originalPrice` + `discountedPrice` + `discountPercent` dans les fiches établissements
- [ ] Badge "−X%" affiché sur les fiches avec réduction

## Phase 21 — Landing Page SEO + Espace Intérieur + Notifications

### Landing Page (refonte scroll conversationnel style Spotify)
- [ ] Refonte Home.tsx : scroll multi-sections conversationnel + landing page SEO
- [ ] Section Hero : intent-first (émotion/occasion) avec double CTA (IA ou Offres)
- [ ] Section "Entrée IA" : démo conversationnelle MAYA avec 3 questions d'intention
- [ ] Section "Entrée Offres" : sélection horizontale scrollable par secteur
- [ ] Section "Entrée Parcours" : exemples de parcours complets (Monaco, Bali, Paris...)
- [ ] Section "Comment ça marche" : 3 étapes visuelles
- [ ] Section "Forfaits" : 3 états clairs (Explorateur / Membre / Conciergerie)
- [ ] Section FAQ SEO : 8 questions/réponses optimisées Google
- [ ] SEO technique : balises meta title/description, OG tags, JSON-LD schema, ancres
- [ ] index.html : meta robots, canonical, structured data WebSite + Organization

### Espace Intérieur Client (/mon-espace)
- [ ] Page /mon-espace : dashboard parcours (brouillons, sauvegardés, actif en cours)
- [ ] Carte parcours : titre, destination, dates, statut, actions (activer/modifier/supprimer)
- [ ] Parcours actif : badge "EN COURS" + timeline du jour
- [ ] Fiche profil : avatar, infos, préférences, style de voyage
- [ ] Section Proches : liste travelCompanions avec ajout/modification
- [ ] Toggles notifications : parcours actif ON/OFF, découvertes ON/OFF, newsletter ON/OFF

### Système Notifications
- [ ] Table DB : notifications (id, userId, type, title, body, data, readAt, createdAt)
- [ ] Table DB : notificationSettings (userId, activeTripNotifs, discoveryNotifs, emailNotifs)
- [ ] Table DB : activeTripSessions (tripPlanId, userId, startedAt, currentDayIndex, isActive)
- [ ] tRPC : notifications.list, notifications.markRead, notifications.settings.get/update
- [ ] tRPC : trips.activate, trips.deactivate, trips.getActive
- [ ] Centre notifications : cloche navbar avec badge compteur non-lus
- [ ] Notifications parcours actif : rappel matin, rappel restaurant, rappel départ
- [ ] Notifications découvertes : nouvelles offres, nouveaux parcours, événements (opt-in)

## Sprint — Partage + Filtres avancés

- [ ] Composant ShareModal universel (lien copiable, Web Share API, QR code)
- [ ] Backend tRPC : generateShareLink + getSharedTrip (liens publics temporaires)
- [ ] Composant FilterBar universel (prix, catégorie, destination, durée, tri)
- [ ] Intégration ShareModal dans Mes Parcours (TripsTab) + page TripPlan
- [ ] Intégration ShareModal dans les fiches Offres (BottomSheet)
- [ ] Intégration FilterBar dans page Offres (remplacer filtres pilules simples)
- [ ] Intégration FilterBar dans page Discover
- [ ] Filtres persistés dans URL (query params) pour partage direct
- [ ] Page publique /parcours/:shareToken pour affichage sans connexion

## Sprint — Refonte Landing Mobile V2

### Hero Mobile
- [x] Supprimer bouton jaune "Parlez à votre assistant"
- [x] Supprimer "experts humains & IA - voyages d'exception"
- [x] Supprimer "Explorer les destinations"
- [x] Garder "L'art de l'excellence" + "Un assistant qui vous connaît"
- [x] Remplacer texte "Maison Baymora...exprimiez" par "Discrétion & confidentialité · Accès mondial"
- [x] Réduire taille hero pour arriver vite au contenu
- [x] Scroll max vers le haut = "Chaque moment devient une expérience inoubliable"

### Sections supprimées
- [x] Supprimer "Comment ça fonctionne"
- [x] Supprimer les 4 icônes (expert humain, parcours GPS, discrétion, accès mondial)
- [x] Supprimer section forfaits de la landing (déplacer dans Premium)

### Bloc Ambassadeur reformulé
- [x] Titre : "Invitez vos proches et devenez ambassadeur Maison Baymora"
- [x] Système de points : partage, réservations, forfait
- [x] 10 000€ en points = accès liste d'attente Club Privé
- [x] Club Privé = "Sur invitation" / "S'inscrire à la liste d'attente"
- [x] Points : partage sans profil = X pts, avec profil = X pts, avec forfait = X pts
- [x] Réservations : plus le montant est grand, plus de points
- [x] Crédits débloqués par les points + fonctionnalités débloquées

### Forfaits dans Premium
- [x] Déplacer forfaits dans page Premium
- [x] Bouton "Choisir Duo" avec prix duo dans chaque tier
- [x] Crédits à la carte déplacés aussi

### Bloc B2B
- [x] Garder "Recevez des clients qualifiés"
