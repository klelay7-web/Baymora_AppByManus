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
- [ ] Table establishments (fiches établissements détaillées)
- [ ] Table tripPlans (plans de voyage complets)
- [ ] Table tripDays (jours de voyage avec étapes)
- [ ] Table tripSteps (étapes individuelles avec géolocalisation)
- [ ] Table establishmentMedia (photos, vidéos par établissement)
- [ ] Enrichissement table userPreferences (cercle proche, type voyage)
