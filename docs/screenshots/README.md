# Baymora — Captures Visuelles Complètes (Session Authentifiée)

> Capturées le 09 avril 2026 — Version `5a9aa74` (STRATEGIE_ET_PROMPT_MANUS_FINAL_V6.md)
> **Session active : Kévin Le Lay (admin, Bordeaux) — toutes les pages membres sont visibles**

## Structure des dossiers

```
docs/screenshots/
├── README.md
├── pc/          → Desktop 1440×900px (fullPage, session Kevin active)
└── telephone/   → Mobile iPhone 14 Pro 390×844px (fullPage, session Kevin active)
```

## Pages capturées (13 pages — toutes authentifiées)

| Fichier | Page | URL | Statut |
|---------|------|-----|--------|
| `01_landing.png` | Landing / Accueil | `/` | ✅ Public |
| `02_maison.png` | Maison (Dashboard membre) | `/maison` | ✅ Authentifié |
| `03_maya.png` | Maya — Chat IA | `/maya` | ✅ Authentifié |
| `04_offres.png` | Offres & Établissements | `/offres` | ✅ Authentifié |
| `05_parcours.png` | Mes Parcours | `/parcours` | ✅ Authentifié |
| `06_profil.png` | Profil & Préférences | `/profil` | ✅ Authentifié |
| `07_premium.png` | Plans & Abonnements | `/premium` | ✅ Public |
| `08_maya_demo.png` | Démo Maya Interactive | `/maya-demo` | ✅ Public |
| `09_mentions_legales.png` | Mentions Légales | `/mentions-legales` | ✅ Public |
| `10_confidentialite.png` | Politique de Confidentialité | `/confidentialite` | ✅ Public |
| `11_cgu.png` | Conditions Générales | `/cgu` | ✅ Public |
| `12_contact.png` | Contact | `/contact` | ✅ Public |
| `13_not_found.png` | 404 Not Found | `/page-inexistante` | ✅ Public |

## Contexte du projet Baymora

**Baymora** est un Social Club premium propulsé par l'IA Maya.

### Repositionnement V6
- **Vocabulaire** : "accès privé" (plus "conciergerie"), "Le Cercle" (plan premium)
- **4 scénarios Maya** : Signature / Privilège / Prestige / Sur-Mesure
- **4 plans** : Invité (gratuit, 3 crédits) / Membre (9,90€/mois) / Duo (14,90€/mois) / Le Cercle (89€/an)
- **FounderCounter** : 67/100 membres fondateurs
- **Stack** : React 19 + Tailwind 4 + tRPC 11 + Express + Claude AI (Anthropic)

### Compte de test (Kevin — admin)
- Email : k.lelay7@gmail.com
- Rôle : admin
- Ville : Bordeaux
- Plan actuel : Invité (free, 3 crédits, 2 messages utilisés)

## Points à analyser pour Claude

### UX & Design
1. **Cohérence visuelle** : Charte graphique noire/dorée (#C8A96E) respectée sur toutes les pages ?
2. **UX Mobile** : Navigation, lisibilité, boutons tactiles sur les captures téléphone
3. **Hiérarchie de l'information** : Landing → conversion, Premium → clarté des plans
4. **Hero Landing** : Sous-titre rotatif visible ? FounderCounter affiché ?

### Fonctionnel
5. **Maison (Dashboard)** : Sections présentes ? Offres visibles ? Widget Maya Mini ?
6. **Maya Chat** : Interface de chat correcte ? Placeholder adaptatif ?
7. **Offres** : Cards avec badge Partenaire ? Filtres fonctionnels ?
8. **Parcours** : Liste vide ou avec données mockées ?
9. **Profil** : 6 sections connectées ? Stripe Portal button ?

### Qualité
10. **Pages légales** : Complètes et professionnelles ?
11. **404** : Thème sombre Baymora respecté ?
12. **Opportunités** : Sections manquantes, incohérences, bugs visuels à corriger ?
