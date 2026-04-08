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
