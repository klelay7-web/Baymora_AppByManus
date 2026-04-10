# CONVERSATION CLAUDE V1 — SYNTHÈSE COMPLÈTE
## Maison Baymora — Échanges stratégiques Kevin × Claude
## 9-10 avril 2026

---

# TABLE DES MATIÈRES

1. Contexte initial
2. Évolution des décisions (chronologique)
3. Documents produits
4. État final validé
5. Backlog restant
6. Décisions clés à retenir

---

# 1. CONTEXTE INITIAL

Kevin (créateur de Maison Baymora) a transmis :
- La PJ de sa conversation précédente avec Claude (stratégie complète V2 avec 9 sprints)
- L'historique de la refonte du 8 avril 2026 (9 commits, -19 008 lignes, +5 425 lignes)
- Le commit de base : d9b6c34 du 8 avril 2026
- 2 repos GitHub privés : klelay7-web/Baymora_AppByManus (github/main) + klelay7-web/Baymora_app (claude/main)
- Le site live : https://maisonbaymora.com
- Stack : React 19 + TypeScript + Tailwind 4 + Express 4 + tRPC 11 + MySQL/TiDB + Claude API + Stripe + Perplexity + Google Maps

L'app avait été reconstruite en version épurée avec 7 pages (Landing, Maison, Maya, Offres, Parcours, Profil, Premium, LieuDetail) supprimant 19 anciennes routes complexes.

---

# 2. ÉVOLUTION DES DÉCISIONS (CHRONOLOGIQUE)

## Phase 1 — Rapport stratégique initial (V1-V2)

**Demande :** Analyser le dernier push GitHub + la conversation précédente, proposer une stratégie d'amélioration.

**Livrable :** RAPPORT_STRATEGIQUE_BAYMORA.md + PROMPT_MANUS_V2.md

**Décisions :**
- 9 axes d'amélioration identifiés (Maya IA, Landing V2, Scénarios explorables, Mode Parcours Actif, Connexion données réelles, Affiliations luxe, Pages/UX, Backend, Intégration Manus API)
- 5 sprints planifiés
- MayaDemo sur la Landing (6 flows pré-écrits, 0 API)
- Enrichissement Maya : règles N°10 à N°16
- 30+ partenaires affiliés à ajouter
- Mode Business Traveler complet (RDV fixes inviolables, Maya organise autour)

## Phase 2 — Le repositionnement identitaire (V3)

**Demande de Kevin :** "Le mot concierge me gêne. On parle de social club, de concierge, d'assistant — il faut un fil rouge."

**Décisions clés :**
- ❌ "Concierge" / "Conciergerie" → SUPPRIMÉ partout
- ❌ "Assistant(e) IA" → SUPPRIMÉ
- ❌ "Propulsé par l'IA" → SUPPRIMÉ (les gens sont réticents avec l'IA)
- ✅ "Social Club Premium" comme positionnement
- ✅ Maya = "accès privé de la Maison" (prospect) → "alliée premium" (membre)
- ✅ "Membre" au lieu de "client/utilisateur"
- ✅ "Privilège" au lieu de "réduction/offre"
- ✅ "Adhésion" au lieu de "abonnement/forfait"
- ✅ "La Maison" au lieu de "l'app/la plateforme"

**Livrable :** RAPPORT_REPOSITIONNEMENT_BAYMORA.md

## Phase 3 — L'usage quotidien + feed local (V3 suite)

**Insight de Kevin :** "Les gens ne partent pas tous les jours en vacances. Baymora doit être utilisé chaque jour."

**Décisions :**
- Feed quotidien local géolocalisé sur la page Maison
- "Secret de la Maison" quotidien (1 adresse cachée/jour)
- Privilège du jour (notification matin pour le Cercle)
- Sections : Ce soir, Bien-être, Ce week-end, Sport, Culture, Évasions flash
- Stratégie ville par ville : Bordeaux d'abord → Paris → 5 villes FR → EU → US

**Livrable :** RAPPORT_STRATEGIQUE_FINAL_V3_BAYMORA.md (avec analyse financière complète)

## Phase 4 — Tarification + personas + démo adaptative (V4)

**Questions de Kevin :** Forfait annuel ? Prix du Cercle ? Comment chaque profil sait que Baymora est pour lui ?

**Décisions :**
- Grille : Invité (gratuit) / Membre (9,90€/mois ou 99€/an) / Duo (14,90€/mois ou 149€/an) / Le Cercle (149€/an Fondateur, 249€ après 500 places)
- Crédits à la carte : 4,99€/5 convos, 9,99€/15, 19,99€/40
- Démo adaptative sur Landing : 2 modes (auto 60s + interactif 6 flows cliquables)
- Landing s'adapte au persona après la démo (social proof, plan, CTA personnalisés)

**Livrable :** STRATEGIE_BAYMORA_V4_FINAL.md

## Phase 5 — Segmentation invisible des budgets

**Insight de Kevin :** "Les vrais premium ne veulent pas se mélanger. On ne dit jamais 'luxe accessible'."

**Décisions :**
- Scénarios renommés : Malin → **Signature**, Essentiel → **Privilège**, Premium → **Prestige**, Excellence → **Sur-Mesure**
- Maya ne montre JAMAIS les scénarios d'entrée à un profil premium, ni les scénarios haut de gamme à un profil modeste
- Aucun prix barré visible (uniquement badge % membre)
- "Luxe accessible" SUPPRIMÉ
- Le budget est invisible : Maya s'adapte silencieusement

## Phase 6 — Autocritique + viralité (V5-V6)

**Autocritique de Claude :** Le Cercle à 249€ est prématuré → "Fondateur 149€ à vie" pour les 500 premiers. La viralité manquait.

**Décisions viralité :**
1. Story Cards partageables (Secret du Jour avec teaser flouté)
2. Trip Cards (Spotify Wrapped du voyage, généré au retour)
3. Invitations Dorées (Cercle invite 2 proches/mois, code unique, 7j d'expiration)
4. Avis membres (reviews internes + Review Cards partageables)
5. Contenu quotidien Instagram/TikTok (7 jours/7, samedi = Kevin en vrai)

**Livrable :** STRATEGIE_ET_PROMPT_MANUS_FINAL_V6.md

## Phase 7 — Analyse screenshots app + "Ma position" (V6.1)

**Kevin uploade 5 screenshots de l'app.**

**Problèmes identifiés :**
- "Votre club privé de Social Club" = charabia en français
- "Luxe accessible" encore présent
- Prix barrés visibles
- "Maya IA" avec badge
- Questionnaire onboarding trop limité (4 options voyage uniquement)

**Décision majeure :** Le 2ème bouton à côté de "Parler à Maya" devient **"Ma position"** (ex "Voir les offres"). "Ma position" = services locaux quotidiens géolocalisés. Fonctionne chez soi ET en voyage.

**8 catégories :** Sortir, Manger, Se ressourcer, Bouger, Travailler, À domicile, Rencontrer, S'évader

**Bottom nav mobile :** [Maison] [📍 Ma position] [✨ Maya] [Parcours] [Profil]

**Onboarding corrigé :** "Comment vivez-vous vos meilleurs moments ?" avec 6 options élargies (pas juste "voyageur")

**Livrable :** ANALYSE_SCREENSHOTS_CORRECTIONS_V6.1.md

## Phase 8 — Scraping Manus PDF (V7)

**Kevin uploade 2 PDFs de scraping Manus (mobile + PC).**

**Problèmes identifiés :**
- Onboarding bloque TOUT (overlay sur chaque page)
- "Votre club privé de Social Club" toujours là
- Le Cercle à 89€ pas mis à jour
- Desktop : énormément d'espace vide

**Livrable :** PROMPT_MANUS_DEFINITIF_V7.md (Sprint 0 urgences + 5 sprints complets)

## Phase 9 — Manus exécute V7, compte-rendu (V7.1)

**Kevin uploade 3 PDFs de Manus : architecture V7, system prompt V7, compte-rendu V7→V7.1.**

**Manus a fait :** Checklist 20/20 validée. Prix corrigés, termes supprimés, vouvoiement adaptatif, rate limiting par minute, MayaDemo inline, géolocalisation, onboarding fixé.

**Problèmes identifiés par Claude :**
1. "Hub IA de conciergerie privée" encore dans les textes légaux
2. Duo à 16,90€ au lieu de 14,90€
3. Packs crédits trop chers (pack 15 à 11,90€ > Membre à 9,90€)
4. Vouvoiement systématique au lieu d'adaptatif
5. Rate limiting par jour au lieu de par minute
6. MayaDemo sur route séparée au lieu d'intégrée dans Landing
7. Catégories "Ma position" incorrectes (Transports, Hôtels au lieu de Travailler, À domicile)
8. Sidebar desktop dans le mauvais ordre
9. Pas d'options annuelles visibles pour Membre et Duo

**Livrable :** ORDRES_MANUS_V7.1_CORRECTIONS.md (32 ordres, 8 groupes, 20 points de vérification)

## Phase 10 — Manus exécute V7.1, nouveau compte-rendu (V7.2)

**Kevin uploade 3 PDFs V7.1 de Manus.**

**Manus a corrigé :** 20/20 checklist. Mais backlog reste : Stripe placeholders, Ma position pas branchée sur DB, rappels automatiques pas créés, Secret du Jour statique, invitations Cercle pas branchées.

**Claude identifie 3 nouveaux problèmes :**
1. Catégories Ma position toujours incorrectes dans le system prompt
2. Sidebar desktop : Ma position après Maya (devrait être avant)
3. Documentation interne dit encore "conciergerie"

**Livrables :**
- ORDRES_MANUS_V7.2.md (28 ordres techniques : Stripe réel, données Ma position, rappels, Secret du Jour, invitations, avis)
- ADDENDUM_RUNWAY_CREATIVES_V7.2.md (25 assets Runway Gen 4.5)

## Phase 11 — Le pivot "Sortir" (V7.2b)

**Insight de Kevin :** "On a mis peu en valeur le côté festif, sortir, soirées, events, DJ, lieux VIP. C'est prioritairement ce que recherchent les gens."

**Décision majeure :** "Sortir" n'est plus une catégorie parmi 8. C'est LE pilier de l'app.

**Changements :**
- Ma position restructurée en 3 zones hiérarchisées : événements hero (50%) → lieux tendance → services (grille compacte)
- Page Maison commence par "Cette semaine" (événements) avant les coups de cœur
- Table events en DB avec 15+ événements seedés
- Maya = experte N°1 des sorties (clubs, DJ, concerts, vernissages, dégustations, VIP, dress codes, guest lists)
- Notifications : vendredi 17h "Ce week-end" + quotidien 18h "Ce soir"
- Démo Landing : persona 1 = "Ce soir à Bordeaux" (remplace "Week-end romantique")
- Section Landing "Ce soir dans votre ville"
- 5 vidéos Runway nightlife ajoutées

**Livrables :**
- MESSAGE_1_MANUS_PIVOT_SORTIR.md
- MESSAGE_2_MANUS_RUNWAY.md

## Phase 12 — Manus exécute V7.2 + V7.2c, rapport final

**Kevin uploade 2 PDFs : rapport Runway + system prompt V7.2c.**

**Manus a fait :** 30 assets Runway générés et sur S3. VideoBackground.tsx créé. Table events existe. System prompt Maya V7.2c complet (17 règles + calendrier événementiel).

**Suggestions de Manus (4, toutes validées par Claude) :**
- A : Re-seed automatique événements (dates fixes vont expirer)
- B : Section "Inspirations" avec vidéos destinations
- C : Démo "Ce soir" dynamique (pas maintenant, quand scraping fiable)
- D : Webhook Stripe → isCercle (CRITIQUE, bug de paiement)

**Problèmes identifiés par Claude :**
1. Membre limité à 30 conv./mois → devrait être illimité
2. Modèle par défaut Opus partout → gaspillage, besoin de routing Haiku/Sonnet/Opus
3. Vérifier Duo à 14,90€ dans Stripe et CGU

---

# 3. DOCUMENTS PRODUITS (dans l'ordre)

| # | Document | Contenu |
|---|----------|---------|
| 1 | RAPPORT_STRATEGIQUE_BAYMORA.md | Analyse initiale + 9 axes + 5 sprints |
| 2 | PROMPT_MANUS_V2.md | Premier prompt Manus (5 sprints détaillés) |
| 3 | RAPPORT_REPOSITIONNEMENT_BAYMORA.md | Identité Social Club + lexique + vision |
| 4 | RAPPORT_STRATEGIQUE_FINAL_V3_BAYMORA.md | Feed local + coûts/marges + SEO + plan long terme |
| 5 | STRATEGIE_BAYMORA_V4_FINAL.md | Pricing final + personas + démo adaptative |
| 6 | STRATEGIE_DEFINITIVE_V5_BAYMORA.md | Autocritique + viralité + pricing Fondateur |
| 7 | STRATEGIE_ET_PROMPT_MANUS_FINAL_V6.md | Prompt Manus consolidé V6 |
| 8 | ANALYSE_SCREENSHOTS_CORRECTIONS_V6.1.md | Analyse screenshots + Ma position + corrections |
| 9 | PROMPT_MANUS_DEFINITIF_V7.md | Prompt Manus V7 (Sprint 0-5 + vérification 18 points) |
| 10 | ORDRES_MANUS_V7.1_CORRECTIONS.md | 32 ordres correctifs post-V7 |
| 11 | ORDRES_MANUS_V7.2.md | 28 ordres (Stripe, données, rappels, invitations) |
| 12 | ADDENDUM_RUNWAY_CREATIVES_V7.2.md | 25 assets Runway Gen 4.5 |
| 13 | ADDENDUM_V7.2b_PIVOT_SORTIR.md | Pivot événementiel |
| 14 | MESSAGE_1_MANUS_PIVOT_SORTIR.md | Message 1 pour Manus (pivot sortir) |
| 15 | MESSAGE_2_MANUS_RUNWAY.md | Message 2 pour Manus (30 assets Runway) |

---

# 4. ÉTAT FINAL VALIDÉ (checkpoint 757760f4)

## Identité
- Maison Baymora = Social Club Premium
- Maya = accès privé / alliée premium (pas assistante, pas concierge)
- Vocabulaire : membre, privilège, adhésion, la Maison
- Mots bannis : concierge, conciergerie, assistant IA, luxe accessible, bon plan, client, utilisateur

## Pricing
- Invité : Gratuit (3 conversations)
- Membre : 9,90€/mois ou 99€/an (Maya illimitée — à corriger, Manus a mis 30/mois)
- Duo : 14,90€/mois ou 149€/an
- Le Cercle : 149€/an Fondateur (500 places, puis 249€)
- Packs crédits : 4,99€/5 · 9,99€/15 · 19,99€/40

## Scénarios
- Signature / Privilège / Prestige / Sur-Mesure
- Budget invisible : Maya adapte silencieusement

## Navigation
- Sidebar desktop : Maison → Ma position → Maya → Privilèges → Parcours → Profil
- Bottom nav mobile : [Maison] [Ma position] [Maya] [Parcours] [Profil]

## Pages
- Landing (MayaDemo inline, hero vidéo, section "Ce soir", pricing Fondateur)
- Maison (événements "Cette semaine", Secret du Jour, coups de cœur, privilèges)
- Maya (chat IA, scénarios, parcours)
- Ma position (3 zones : événements hero → lieux tendance → services 8 catégories)
- Parcours (mode actif, todolist, business)
- Privilèges (ex-Offres, badges % sans prix barrés)
- Profil (éditable, adhésion, invitations, notifications)
- Pages légales (CGU, confidentialité, mentions, contact)

## System Prompt Maya (V7.2c)
- 17 règles
- Sélection de modèle : Opus (premiers messages + complexe + Cercle), Sonnet (moyen), Haiku (simple)
- Ton adaptatif (tutoiement/vouvoiement selon le membre)
- Rate limiting par minute
- 8 catégories "Ma position" avec contexte
- Calendrier événementiel intégré
- Événements DB mentionnés dans les réponses

## Assets Runway
- 30 assets générés (16 vidéos + 11 images + 3 templates)
- VideoBackground.tsx créé et intégré
- Héros vidéo sur Landing et Maison

## Domaines (planifié)
- maisonbaymora.com = France (FR)
- baymora.com = US/International (EN) — Q4 2026

---

# 5. BACKLOG RESTANT

## Critique (avant lancement)
- [ ] Stripe : vrais price_IDs (placeholders actuels)
- [ ] Webhook Stripe : mettre à jour isCercle = true automatiquement
- [ ] Membre : passer de 30 conv./mois à illimité (rate limit par minute uniquement)
- [ ] Routing modèle IA : Haiku pour les messages simples (pas Opus partout)

## Priorité haute (semaine 1 post-lancement)
- [ ] Ma position : brancher sur données réelles (champ category dans establishments)
- [ ] Rappels automatiques J-14/J-7/J-3/J-1 (cron job reminderService)
- [ ] Secret du Jour dynamique (table + procédure + génération Maya)
- [ ] Invitations Cercle branchées sur DB
- [ ] Section "Inspirations" destinations dans Maison.tsx (6 vidéos 9:16)
- [ ] Événements Landing branchés sur DB (remplacer données statiques)

## Priorité moyenne
- [ ] Formulaire soumission événement partenaire
- [ ] Notifications push sorties (vendredi 17h + quotidien 18h)
- [ ] Compteur fondateurs animé (framer-motion)
- [ ] Page Ambassadeur complète
- [ ] Avis membres (MemberReview branchée sur DB + LieuDetail)
- [ ] Script re-seed événements automatique

## Priorité basse (Phase 2)
- [ ] SEO : pages ville (/bordeaux, /paris), blog, structured data
- [ ] i18n FR/EN (architecture + traduction)
- [ ] Lancement baymora.com (US)
- [ ] App native iOS/Android (ou PWA avancée)
- [ ] Scraping événements automatique (Fever, Shotgun, Dice)
- [ ] Dashboard affilié complet
- [ ] Mode hors-ligne Ma position

---

# 6. DÉCISIONS CLÉS À RETENIR

Ces décisions sont DÉFINITIVES et ne doivent pas être remises en question dans les futures conversations :

1. **Baymora est un Social Club, pas une conciergerie.** Le mot "concierge" ne doit JAMAIS apparaître.

2. **L'IA est invisible.** On ne vend pas l'IA, on vend l'expérience. "Derrière Maya : une équipe, un réseau, une technologie de pointe."

3. **Le budget est invisible.** Maya ne catégorise jamais. Le membre à 200€ et le membre à 20 000€ se sentent tous les deux privilégiés.

4. **"Sortir" est le pilier N°1.** C'est ce qui fait ouvrir l'app chaque jour. Les événements dominent visuellement dans Ma position et Maison.

5. **"Ma position" fonctionne partout.** Chez soi ET en voyage. La géolocalisation adapte automatiquement.

6. **Le Cercle est un statut, pas une réduction.** 149€ Fondateur → 249€ ensuite. Avantages exclusifs réels.

7. **Mobile first.** 80%+ des utilisateurs seront sur smartphone. Chaque modification doit être parfaite sur 390px AVANT le desktop.

8. **L'affiliation est le bonus, l'adhésion est la base.** Recommander gratuitement via affiliations → identifier les plus appréciés → les démarcher avec des chiffres.

9. **Kevin est l'humain derrière la Maison.** Le samedi sur les réseaux = contenu réel, pas IA. Ça humanise tout.

10. **Bordeaux d'abord.** Saturer une ville avant de passer à la suivante. Puis Paris, Lyon, Nice, Marseille. US en Q4 2026.

---

*Document compilé le 10 avril 2026 — Pour archivage dans le repo klelay7-web/Baymora_AppByManus sous docs/CONVERSATION_CLAUDE_V1.md*

*Transmettre à Manus avec l'instruction : "Push ce fichier dans docs/CONVERSATION_CLAUDE_V1.md sur les 2 repos."*
