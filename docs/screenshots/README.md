# Baymora — Captures Visuelles Complètes

> Capturées le 09 avril 2026 — Version `5a9aa74` (STRATEGIE_ET_PROMPT_MANUS_FINAL_V6.md)

## Structure des dossiers

```
baymora_screenshots/
├── pc/          → Desktop 1440×900px (fullPage)
└── telephone/   → Mobile iPhone 14 Pro 390×844px (fullPage)
```

## Pages capturées (14 pages)

| Fichier | Page | URL | Accès |
|---------|------|-----|-------|
| `01_landing.png` | Landing / Accueil | `/` | Public |
| `02_auth.png` | Authentification | `/auth` | Public |
| `03_premium.png` | Offres & Plans | `/premium` | Public |
| `04_maya_demo.png` | Démo Maya Interactive | `/maya-demo` | Public |
| `05_mentions_legales.png` | Mentions Légales | `/mentions-legales` | Public |
| `06_confidentialite.png` | Politique de Confidentialité | `/confidentialite` | Public |
| `07_cgu.png` | Conditions Générales | `/cgu` | Public |
| `08_contact.png` | Contact | `/contact` | Public |
| `09_maison.png` | Maison (Dashboard) | `/maison` | Membre (redirect login) |
| `10_maya.png` | Maya — IA Chat | `/maya` | Membre (redirect login) |
| `11_offres.png` | Offres & Établissements | `/offres` | Membre (redirect login) |
| `12_parcours.png` | Mes Parcours | `/parcours` | Membre (redirect login) |
| `13_profil.png` | Profil & Préférences | `/profil` | Membre (redirect login) |
| `14_not_found.png` | 404 Not Found | `/page-inexistante` | Public |

> **Note :** Les pages marquées "Membre (redirect login)" affichent la page de connexion car les captures ont été faites sans session active. Pour voir le contenu authentifié, il faut se connecter manuellement.

## Contexte du projet

**Baymora** est un Social Club premium propulsé par l'IA Maya. Repositionnement complet V6 :
- Vocabulaire : "accès privé" (plus "conciergerie"), "Le Cercle" (plan premium)
- 4 scénarios Maya : Signature / Privilège / Prestige / Sur-Mesure
- 4 plans : Invité (gratuit) / Membre (9,90€) / Duo (14,90€) / Le Cercle (89€/an)
- FounderCounter : 67/100 membres fondateurs
- Stack : React 19 + Tailwind 4 + tRPC 11 + Express + Claude AI

## Points à analyser pour Claude

1. **Cohérence visuelle** : Charte graphique noire/dorée (#C8A96E) respectée sur toutes les pages ?
2. **UX Mobile** : Navigation, lisibilité, boutons tactiles sur les captures téléphone
3. **Hiérarchie de l'information** : Landing → conversion, Premium → clarté des plans
4. **Pages légales** : Complètes et professionnelles ?
5. **404 & Auth** : Thème sombre Baymora respecté ?
6. **Opportunités d'amélioration** : Sections manquantes, incohérences, bugs visuels
