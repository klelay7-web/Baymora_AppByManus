import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import authRouter from "./routes/auth";
import { authMiddleware } from "./middleware/auth";

// Validation: ensure critical env vars are set
function validateEnvironment() {
  const required = ['JWT_SECRET', 'NODE_ENV'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    console.warn('Some features may not work correctly.');
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    throw new Error(
      '❌ JWT_SECRET must be at least 32 characters long for security.'
    );
  }
}

export function createServer() {
  validateEnvironment();

  const app = express();

  // =====================================================================
  // SECURITY MIDDLEWARE
  // =====================================================================

  // CORS - restrict to configured origins
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.use(
    cors({
      origin: [corsOrigin, 'http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parsing with size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // =====================================================================
  // REQUEST LOGGING
  // =====================================================================
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
      );
    });
    next();
  });

  // =====================================================================
  // AUTHENTICATION MIDDLEWARE (applies to all routes)
  // =====================================================================
  app.use(authMiddleware);

  // =====================================================================
  // HEALTH CHECK
  // =====================================================================
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "pong";
    res.json({ message: ping, timestamp: new Date().toISOString() });
  });

  // =====================================================================
  // API ROUTES
  // =====================================================================

  // Demo endpoint
  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.use("/api/auth", authRouter);

  // Chat routes (chat interface + conversations)
  app.post("/api/chat/start", async (req, res) => {
    try {
      const { language = 'fr' } = req.body;
      const conversationId = require('uuid').v4();

      res.status(201).json({
        conversationId,
        title: `Conversation ${new Date().toLocaleDateString('fr-FR')}`,
        language,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Erreur chat/start:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.post("/api/chat/message", async (req, res) => {
    try {
      const { conversationId, content } = req.body;

      if (!content) {
        res.status(400).json({ error: 'Contenu requis' });
        return;
      }

      // Réponse simple basée sur mots-clés
      let response = '';
      const lower = content.toLowerCase();

      if (lower.includes('paris')) {
        response = 'Paris ! Magnifique choix ! 🗼\n\nVoici ce que je vous propose :\n\n🏨 Hébergement : 5ème arrondissement (Quartier Latin)\n🍽️ Restaurants : Le Comptoir Général, Frenchie To Go\n🚶 Activités : Notre-Dame, Musée du Louvre, Seine\n🚗 Transport : Métro parisien\n\nQuand envisagez-vous ce voyage ? Combien de jours ?';
      } else if (lower.includes('bonjour') || lower.includes('salut')) {
        response = 'Bonjour ! 👋\n\nBienvenue chez Baymora. Je suis votre assistant de voyage premium.\n\nDites-moi :\n- Où voulez-vous aller ?\n- Quand ?\n- Avec qui ?\n- Quel budget ?';
      } else {
        response = 'Intéressant ! 🌍\n\nPour mieux comprendre :\n- Avez-vous une destination en tête ?\n- Quand voulez-vous partir ?\n- Voyagez-vous en famille ou seul ?\n- Quel budget avez-vous ?\n\nJe vais créer un voyage parfait pour vous !';
      }

      res.status(200).json({
        messageId: require('uuid').v4(),
        response,
        conversationId,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Erreur chat/message:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.get("/api/chat/conversations", async (req, res) => {
    res.json({ conversations: [], total: 0 });
  });

  app.get("/api/chat/conversations/:id", async (req, res) => {
    res.json({ id: req.params.id, messages: [] });
  });

  // TODO: Add more routes here as implemented
  // - /api/plans - Journey plans
  // - /api/venues - Knowledge base
  // - /api/concierge - Concierge requests
  // - /api/admin - Admin dashboard

  // =====================================================================
  // ERROR HANDLING
  // =====================================================================

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      error: 'Not Found',
      code: 'ROUTE_NOT_FOUND',
    });
  });

  // Global error handler
  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error('Unhandled error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        code: 'SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
          details: err.message,
        }),
      });
    }
  );

  return app;
}
