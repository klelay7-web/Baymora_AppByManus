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
