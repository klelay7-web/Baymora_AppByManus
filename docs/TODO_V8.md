# TODO V8 — Maison Baymora

> Fonctionnalités planifiées pour la prochaine version majeure.
> Ce fichier est mis à jour après chaque sprint et sert de référence pour Claude et Manus.

---

## Groupe A — Fonctionnalités IA & Personnalisation

- [ ] **A1 — Mémoire longue Maya** : Persistance des conversations en base (résumé vectoriel par utilisateur). Maya se souvient des préférences passées sans relire l'historique complet.
- [ ] **A2 — Profil enrichi automatique** : Après chaque conversation, Maya extrait et met à jour le profil utilisateur (destinations aimées, budget moyen, style de voyage, restrictions alimentaires).
- [ ] **A3 — Mode vocal Maya** : Interface vocale (Web Speech API + Whisper) pour parler directement à Maya sur mobile.
- [ ] **A4 — Maya Proactive** : Notifications push personnalisées envoyées par Maya (ex : "Ce soir à Bordeaux, il y a un dîner secret qui vous correspond").
- [ ] **A5 — Suggestions contextuelles** : Maya détecte la météo, les événements locaux et l'heure pour adapter ses recommandations en temps réel.

---

## Groupe B — Événements & Géolocalisation

- [ ] **B1 — Événements tiers** : Intégration API Eventbrite / Shotgun / Dice pour enrichir le catalogue d'événements automatiquement.
- [ ] **B2 — Carte interactive événements** : Vue cartographique des événements autour de l'utilisateur (Google Maps + clustering).
- [ ] **B3 — Système de réservation natif** : Réservation d'événements directement dans l'app (sans redirection), avec confirmation par email via Resend.
- [ ] **B4 — Événements membres exclusifs** : Les membres Cercle peuvent créer des événements privés visibles uniquement par le Cercle.
- [ ] **B5 — Alertes géolocalisées** : Notification automatique quand un événement correspondant au profil est détecté dans la ville de l'utilisateur.

---

## Groupe C — Abonnements & Monétisation

- [ ] **C1 — Pause abonnement** : Possibilité de mettre l'abonnement en pause (débit suspendu, profil conservé 90 jours).
- [ ] **C2 — Offre cadeau** : Acheter un abonnement Baymora pour un proche (email + date d'activation différée).
- [ ] **C3 — Parrainage** : Système de parrainage avec récompenses crédits (parrain + filleul).
- [ ] **C4 — Crédits V2** : Refonte du système de crédits — crédits utilisables pour des services premium (accès événements VIP, génération de parcours avancés).
- [ ] **C5 — Dashboard affilié enrichi** : Tableau de bord affilié pour Kevin avec analytics détaillés (clics par partenaire, revenus estimés, top destinations).

---

## Groupe D — UX & Design

- [ ] **D1 — Onboarding V2** : Onboarding conversationnel avec Maya (questions de profil posées par Maya, pas un formulaire).
- [ ] **D2 — Mode sombre/clair** : Thème clair optionnel pour les utilisateurs qui le préfèrent.
- [ ] **D3 — Partage social** : Partage de parcours et de lieux sur Instagram/WhatsApp avec Story Card générée automatiquement.
- [ ] **D4 — Widget Maya Mini V2** : Widget flottant amélioré avec suggestions contextuelles et accès rapide aux événements du soir.
- [ ] **D5 — Page destination** : Pages dédiées par destination (ex : `/destination/saint-tropez`) avec événements, adresses et parcours suggérés.

---

## Groupe E — Administration & Partenaires

- [ ] **E1 — Dashboard admin complet** : Interface d'administration pour gérer les événements, les partenaires, les utilisateurs et les statistiques.
- [ ] **E2 — Portail partenaires** : Espace dédié aux partenaires pour soumettre leurs événements et offres (formulaire `/partenaires/evenement` déjà créé en V7.3).
- [ ] **E3 — Validation éditoriale** : Workflow de validation des événements soumis par les partenaires (statut : en attente / validé / refusé).
- [ ] **E4 — Analytics temps réel** : Dashboard temps réel pour suivre les conversations Maya, les clics affiliés et les conversions Stripe.
- [ ] **E5 — API partenaires** : API REST documentée pour permettre aux partenaires d'intégrer leurs systèmes de réservation directement.

---

## Groupe F — Infrastructure & Performance

- [ ] **F1 — Cache Redis** : Mise en cache des réponses Maya fréquentes et des événements pour réduire la latence.
- [ ] **F2 — CDN vidéo optimisé** : Compression et streaming adaptatif des vidéos Runway (HLS/DASH) pour mobile.
- [ ] **F3 — PWA** : Progressive Web App avec installation sur écran d'accueil et mode hors-ligne partiel.
- [ ] **F4 — Tests E2E** : Suite de tests end-to-end avec Playwright pour les parcours critiques (inscription, paiement, conversation Maya).
- [ ] **F5 — Monitoring** : Intégration Sentry pour le suivi des erreurs en production + alertes Slack.

---

## Notes pour Claude

> Ces suggestions sont issues des retours utilisateurs et des observations de Manus lors des sprints V7.x.
> Claude est décisionnaire sur la priorisation et l'implémentation.
> Chaque fonctionnalité doit être validée par le prompt versionné correspondant avant exécution.

---

*Dernière mise à jour : V7.3 — Avril 2026*
