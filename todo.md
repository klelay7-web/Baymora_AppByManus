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
- [ ] Push sur GitHub Baymora_AppByManus
- [ ] Checkpoint final

## Fonctionnalités en attente (Phase 2)
- [ ] Intégration Stripe pour abonnements Premium 90€/mois
- [ ] Page Dossier Voyage (parcours personnalisé)
- [ ] Intégration API Unsplash/Pexels pour images de fiches
- [ ] API affiliations externes (Booking.com, TheFork, Amadeus, Viator)
