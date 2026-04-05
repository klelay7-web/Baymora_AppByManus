# Baymora — Intelligence de Voyage Premium

Baymora est une plateforme de conciergerie et planification de voyages propulsée par l'IA, conçue pour une clientèle premium exigeante.

## Stack Technique

- **Backend** : Express.js v5 + TypeScript
- **Frontend** : React 18 + TailwindCSS + Radix UI
- **IA** : OpenAI (principal) + Anthropic Claude (fallback)
- **Base de données** : PostgreSQL + Redis (Phase 1)
- **Paiement** : Stripe (Phase 2)

## Structure du Projet

```
client/                   # SPA React
├── pages/                # Pages de l'application
├── components/ui/        # Bibliothèque de composants Radix UI
├── hooks/                # Hooks personnalisés (useChat, useProfile)
├── App.tsx               # Routing principal
└── global.css            # Thème premium Baymora

server/                   # API Express
├── index.ts              # Point d'entrée + montage des routes
├── routes/               # auth.ts, chat.ts, profile.ts
├── services/             # auth.ts, ai/memory.ts, ai/intents.ts
└── middleware/           # auth.ts (JWT)

shared/                   # Types partagés client/serveur
└── api.ts                # Schémas Zod + interfaces TypeScript
```

## Routes API

| Route | Description |
|-------|-------------|
| `GET /api/ping` | Health check |
| `POST /api/auth/owner-login` | Login admin |
| `GET /api/auth/verify` | Vérification token |
| `POST /api/auth/logout` | Déconnexion |
| `POST /api/chat/start` | Démarrer une conversation |
| `POST /api/chat/message` | Envoyer un message |
| `GET /api/chat/conversations` | Lister les conversations |
| `GET /api/profile` | Récupérer le profil client |
| `PATCH /api/profile/preferences` | Mettre à jour les préférences |

## Pages Frontend

| Route | Page |
|-------|------|
| `/` | Homepage premium |
| `/chat` | Assistant conversationnel |
| `/admin` | Login administration |
| `/admin/dashboard` | Tableau de bord admin |

## Commandes de Développement

```bash
pnpm dev        # Serveur de développement (client + serveur, port 8080)
pnpm build      # Build de production
pnpm start      # Démarrer en production
pnpm typecheck  # Validation TypeScript
pnpm test       # Tests Vitest
```

## Alias de Chemins

- `@shared/*` — Dossier shared/
- `@/*` — Dossier client/

## Roadmap

- **Phase 0** ✅ Nettoyage, routing câblé, base saine
- **Phase 1** — Profil client complet + IA réelle (OpenAI/Claude)
- **Phase 2** — Map interactive + planification + affiliations
- **Phase 3** — Algorithme comportemental + mode "Surprends-moi"
- **Phase 4** — Back-office Baymora + fiches prestataires
- **Phase 5** — Plateforme ouverte (artistes, villes, événements)
