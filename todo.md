# Maison Baymora — TODO (Prompt Final v6)

## URGENT (app cassée sans)
- [x] Fix crash new URL() dans const.ts — safety check getLoginUrl()
- [x] Fix conversationId: 0 dans Maya.tsx — vrai ID via chat.createConversation
- [x] Owner illimité pour Kevin — OWNER_OPEN_ID check, afficher "Acces illimite"
- [x] Supprimer doublons : Chat.tsx, Home.tsx, EstablishmentDetail.tsx, Offers.tsx, Profile.tsx

## CRITIQUE (transforme l'experience)
- [x] Creer MessageRenderer.tsx — parser :::QR::: boutons cliquables (simple + multi-select + portes de sortie)
- [x] Parser :::PLACES::: caroussel de cartes lieux (200x280px, photo, badge, coeur favori)
- [x] Parser :::MAP::: carte Google Maps filtre sombre
- [x] Parser :::BOOKING::: encart reservation glassmorphism 4 boutons
- [x] Parser :::SCENARIOS::: 3 onglets Essentiel/Premium/Excellence
- [x] Parser :::GCAL::: bouton "Ajouter au calendrier"
- [x] Parser :::JOURNEY::: timeline verticale transport
- [x] Markdown dans les bulles (react-markdown + remarkGfm)
- [x] Integrer MessageRenderer dans Maya.tsx

## IMPORTANT
- [x] Credits backend vers frontend (user.freeMessagesUsed, pas state local)
- [x] System prompt : ajouter section TRANSPORT COMPLET (REGLE N°8)
- [x] System prompt : ajouter section APRES-VOYAGE (REGLE N°9)
- [x] Corriger TOUS les prix : Decouverte gratuit, Social Club 9,90e, Duo 14,90e, Annuel 89e/an
- [x] Supprimer "Club Prive" de l'affichage public
- [x] Structure DB affiliatePartners/affiliateClicks/affiliateConversions en place
- [x] Route /api/affiliate/redirect avec tracking

## Prochaines étapes
- [ ] Connecter bouton "Réserver" sur LieuDetail à Stripe Checkout
- [ ] Formulaire de préférences profil (allergies, destinations, cercle familial)
- [ ] Notifications push pour alertes offres flash
- [ ] Page /parcours : connecter au vrai backend (trips table)

## Prompt 04 — Corrections restantes + Map + Transport + CTA
- [ ] Bouton "Inviter" → clipboard + toast "Lien copié !"
- [ ] CTA "Établissement" → mailto partenaires@maisonbaymora.com
- [ ] Préserver overflow-x: hidden dans index.css et index.html
- [ ] Map multi-markers cliquables (bottom sheet nom/note/prix/Découvrir)
- [ ] Géolocalisation client (navigator.geolocation + QR villes)
- [ ] Distances hébergement→prestataires dans system prompt
- [ ] Boutons réservation sur chaque étape JOURNEY (bookingUrl)
- [ ] Transport adapté au budget dans system prompt
- [ ] Map thème sombre (filter: invert+hue-rotate)
- [ ] Budget = question N°1 avec QR fourchettes dans system prompt
- [ ] Récapitulatif budget en fin de programme dans system prompt
- [ ] Questions en fin de message, séparées dans system prompt
- [ ] Raccourcir Maison (supprimer forfaits + parrainage → mini CTA)
- [ ] Boutons d'action forfaits sur /premium (toast Stripe bientôt)

## Prompt pasted_content_8 + pasted_content_9 — Concierge Interactif

- [ ] System prompt Maya : 4 scénarios (Malin/Essentiel/Premium/Excellence) au lieu de 3
- [ ] System prompt Maya : flux 2 étapes (résumé court + QR → programme détaillé)
- [ ] System prompt Maya : transport porte-à-porte, adresse précise, options par budget
- [ ] System prompt Maya : destinations alternatives si budget serré
- [ ] System prompt Maya : mixer les gammes dans un même séjour
- [ ] System prompt Maya : PLACES pour chaque établissement (pas juste hôtels)
- [ ] System prompt Maya : MAP obligatoire avec tous les pins + distances
- [ ] System prompt Maya : QR modification (changer hôtel / changer resto / autre scénario)
- [ ] System prompt Maya : règle "Changer l'hôtel" → 3 alternatives même secteur/budget
- [ ] claudeService.ts : max_tokens 8000 pour les modèles Opus
- [ ] System prompt Maya : découpage auto si programme trop long (jamais tronqué)
- [ ] System prompt Maya : récapitulatif budget obligatoire en fin de programme
- [ ] Frontend : popup GPS élégante glassmorphism (premier contact Maya)
- [ ] Frontend : placeholder Maya adaptatif "Écrivez à Maya..."
- [ ] Frontend : badge "✓ Partenaire" sur cards (Offres, PLACES, LieuDetail)
- [ ] Frontend : bouton "Découvrir" → fiche LieuDetail.tsx (pas Booking direct)
- [ ] Frontend : si fiche absente → message Maya "Dis-moi plus sur [Nom]"
- [ ] Frontend : MAP multi-markers (hôtel doré + restos/activités secondaires)
- [ ] Frontend : bouton "Réserver" sur chaque étape JOURNEY avec bookingUrl
- [ ] Backend : table affiliate_clicks (schema + migration)
- [ ] Backend : enrichir /api/affiliate/redirect avec logging userId + source
- [ ] Vérifier points protégés : products.ts, freeMessagesUsed>=3, OWNER_EMAILS, overflow-x

## PROMPT_MANUS_V2 — 5 Sprints

### Sprint 1 — Connexions & Conversion
- [ ] 1.1 Pages légales : /mentions-legales, /confidentialite, /cgu, /contact
- [ ] 1.1 Fix footers href="#" → vraies routes
- [ ] 1.1 Routes dans App.tsx
- [ ] 1.2 Profil : formulaire préférences (alimentaire, voyage, sports, dates, proches, destinations)
- [ ] 1.2 Profil : Mes collections → trpc.favorites.list
- [ ] 1.2 Profil : Mes proches → trpc.companions.getCompanions + formulaire ajout
- [ ] 1.2 Profil : Parrainer un ami → code unique + partage
- [ ] 1.2 Profil : Notifications → toggles + sauvegarde DB
- [ ] 1.2 Profil : Confidentialité → lien /confidentialite
- [ ] 1.3 Offres.tsx → trpc.offers.list (seed si vide)
- [ ] 1.3 Parcours.tsx → trpc.trips.getMyPlans (état vide élégant)
- [ ] 1.3 LieuDetail.tsx → trpc.establishments.getById (fallback hardcodé)
- [ ] 1.3 Maison.tsx → trpc.bundles.published + trpc.offers.list
- [ ] 1.4 NotFound.tsx thème sombre + FR + CTAs
- [ ] 1.5 MayaDemo.tsx (6 flows pré-écrits, MessageRenderer, typing simulé, CTA)
- [ ] 1.6 Landing : hero rotatif (5 textes, AnimatePresence)
- [ ] 1.6 Landing : section "Comment ça marche" (4 étapes)
- [ ] 1.6 Landing : section "Ce que vivent nos membres" (3 vignettes)
- [ ] 1.6 Landing : 4ème différenciateur "Un club, pas un outil"
- [ ] 1.6 Landing : pricing enrichi (sous-titres + badge populaire)
- [ ] 1.6 Landing : double CTA final
- [ ] 1.7 Cookie JWT 30 jours + redirect /maison si connecté
- [ ] 1.8 Générer 9 images demo/social-proof

### Sprint 2 — Maya Intelligence+
- [ ] 2.1 Règles N°10 à N°16 dans claudeService.ts
- [ ] 2.2 profileExtractor enrichi (nouveaux champs)
- [ ] 2.3 Multi-QR dans MessageRenderer.tsx
- [ ] 2.4 affiliations.json enrichi (+31 partenaires)
- [ ] 2.4 System prompt mis à jour avec nouveaux partenaires
- [ ] 2.5 OnboardingWelcome.tsx (3 étapes + QR)

### Sprint 3 — Exploration & Immersion
- [ ] 3.1 ScenarioExplorer.tsx (slide panel + carte + programme + budget + actions)
- [ ] 3.2 Sauvegarde multi-scénarios en brouillon
- [ ] 3.3 Widget Maya Mini flottant contextuel
- [ ] 3.4 Système notifications (cloche + drawer + backend)

### Sprint 4 — Mode Parcours Actif
- [ ] 4.1 TripActiveMode.tsx (carte + todolist + contacts + SOS)
- [ ] 4.2 TripTodoList.tsx rétractable (spring animation, swipe, mode business)
- [ ] 4.3 Navigation bottom adaptative (mode parcours)
- [ ] 4.4 reminderService.ts (cron + notifications J-14 à retour)

### Sprint 5 — Monétisation & Scale
- [ ] 5.1 Rate limiting (Opus 10/min, Sonnet 30/min, image 5/min)
- [ ] 5.2 Stripe Customer Portal
- [ ] 5.3 Auto-save trip depuis Maya (tag PLAN)
- [ ] 5.4 Programme ambassadeur (code unique, dashboard filleuls)
- [ ] 5.5 Dashboard affilié (owner Kevin uniquement)
