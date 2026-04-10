# TODO V8 — Maison Baymora

> Sprint V8 — Exécuté le 10 avril 2026
> Ce fichier est mis à jour après chaque sprint et sert de référence pour Claude et Manus.
> Archive du sprint précédent : `docs/TODO_V7.3_ARCHIVE.md`

---

## GROUPE A — Blockers lancement (3/3 ✓)

- [x] **A1 — Price IDs Stripe réels** : 8 price IDs créés dans le dashboard Stripe test et injectés dans les secrets (`STRIPE_PRICE_MEMBRE`, `STRIPE_PRICE_MEMBRE_ANNUAL`, `STRIPE_PRICE_DUO`, `STRIPE_PRICE_DUO_ANNUAL`, `STRIPE_PRICE_CERCLE`, `STRIPE_PRICE_PACK_5`, `STRIPE_PRICE_PACK_15`, `STRIPE_PRICE_PACK_40`)
- [x] **A2 — Modération événements** : Colonne `status` ajoutée à la table `events` (pending/approved/rejected). Les procédures `list/tonight/thisWeekend/thisWeek` filtrent `status=approved`. Procédures admin `listPending/approve/reject` créées. `notifyOwner` envoyé à chaque soumission partenaire.
- [x] **A3 — Crédits grâce anti-abus** : `customer.subscription.deleted` → 5 crédits de grâce (type `grace`) au lieu de reset à 15. Vérification : si l'utilisateur a déjà reçu des crédits de grâce dans les 30 derniers jours, aucun crédit supplémentaire.

---

## GROUPE B — Routing IA hybride (1/1 ✓)

- [x] **B1 — Routing hybride contenu + plan** : `selectModel()` remplacé par une logique hybride :
  - `cercle/elite` → `claude-opus-4-5` (toujours)
  - `invite/free` → `claude-haiku-4-5` (sauf 1er message → Sonnet pour WOW effect)
  - `membre/premium` → Sonnet par défaut, Haiku pour requêtes courtes (<50 chars, pas de mots-clés complexes), Opus pour requêtes complexes (>200 chars + mots-clés luxe/parcours/itinéraire)

---

## GROUPE C — Usage quotidien (4/4 ✓)

- [x] **C1 — Lien MaPosition → Soumettre événement** : Bouton "Soumettre un événement" ajouté en bas de `MaPosition.tsx` avec lien vers `/partenaires/evenement`
- [x] **C2 — Cron notifications sorties** : `eventNotificationService.ts` créé avec 2 jobs cron :
  - Lundi-vendredi 18h : "Ce soir à [ville]" — 3 meilleurs événements du soir
  - Vendredi 17h : "Ce week-end à [ville]" — 5 meilleurs événements du week-end
  - Intégré dans `server/_core/index.ts`
- [x] **C3 — Toggle notifySorties dans Profil** : Toggle dans `SectionNotifications` de `Profil.tsx` → appel `trpc.profile.updateProfile({ notifySorties: bool })`. Colonne `notifySorties` déjà présente en DB.
- [x] **C4 — Ville dans updateProfile** : Champs `notifySorties` et `city` ajoutés dans le schéma Zod de `profile.updateProfile`

---

## GROUPE D — Améliorations UX (3/3 ✓)

- [x] **D1 — Landing events dynamiques** : Section "Ce soir dans votre ville" branchée sur `trpc.events.tonight` avec fallback statique si DB vide. Composant `LandingTonightSection` extrait.
- [x] **D2 — Footer liens** : Lien "Soumettre un événement" ajouté dans le footer de `Landing.tsx` (en doré, visible)
- [x] **D3 — Doc archivée** : `docs/TODO_V7.3_ARCHIVE.md` créé. Ce fichier `TODO_V8.md` mis à jour avec les 22 ordres V8.

---

## Prochaines priorités (V9)

- [ ] **V9-A1 — Météo contextuelle Maya** : Appel API météo côté serveur, injecté dans le system prompt pour des suggestions adaptées à la météo du jour
- [ ] **V9-A2 — Onboarding conversationnel V2** : Maya pose les questions de profil au lieu d'un formulaire
- [ ] **V9-B1 — Intégration API événements tiers** : Eventbrite / Shotgun / Dice pour enrichir le catalogue
- [ ] **V9-B2 — Carte interactive événements** : Vue cartographique Google Maps avec clustering
- [ ] **V9-C1 — Pause abonnement** : Débit suspendu, profil conservé 90 jours
- [ ] **V9-E1 — Dashboard admin événements** : Interface pour valider/rejeter les événements soumis

---

## Notes pour Claude

> Ces suggestions sont issues des retours utilisateurs et des observations de Manus lors des sprints V7.x et V8.
> Claude est décisionnaire sur la priorisation et l'implémentation.
> Chaque fonctionnalité doit être validée par le prompt versionné correspondant avant exécution.
> TypeScript : 0 erreur à la fin de chaque sprint. `pnpm tsc --noEmit` doit retourner 0.

---

*Dernière mise à jour : V8 — 10 Avril 2026*
