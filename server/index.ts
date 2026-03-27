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
  const chatRouter = require("./routes/chat").default;
  app.use("/api/chat", chatRouter);

  // Profile routes (client memory + preferences)
  const profileRouter = require("./routes/profile").default;
  app.use("/api/profile", profileRouter);

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
