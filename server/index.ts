import "dotenv/config";
import { initSentry, captureException } from "./services/sentry";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import chatRouter from "./routes/chat";
import profileRouter from "./routes/profile";
import usersRouter, { userAuthMiddleware } from "./routes/users";
import stripeRouter from "./routes/stripe";
import adminRouter from "./routes/admin";
import partnersRouter from "./routes/partners";
import clubRouter from "./routes/club";
import notificationsRouter from "./routes/notifications";
import tripsRouter from "./routes/trips";
import conciergeRouter from "./routes/concierge";
import giftsRouter from "./routes/gifts";
import prestatairesRouter from "./routes/prestataires";
import atlasRouter from "./routes/atlas";
import uploadRouter from "./routes/upload";
import boutiqueRouter from "./routes/boutique";
import collectionsRouter from "./routes/collections";
import offmarketRouter from "./routes/offmarket";
import creatorRouter from "./routes/creator";
import notificationsInboxRouter from "./routes/notificationsInbox";
import googleAuthRouter from "./routes/googleAuth";
import seoRouter from "./routes/seo";
import { chatRateLimit, authRateLimit } from "./middleware/rateLimit";
import { startBirthdayCron } from "./services/birthdayCron";

export function createServer() {
  const app = express();

  app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:8080",
    credentials: true,
  }));

  // SEO routes (sitemap, robots.txt, meta) — avant le static serving
  app.use("/", seoRouter);

  // Webhook Stripe doit recevoir le body brut (avant express.json)
  app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
  app.use(express.json());

  // Middleware auth utilisateur global (injecte req.baymoraUser si token valide)
  app.use(userAuthMiddleware);

  // Health check
  app.get("/api/ping", (_req, res) => {
    res.json({ ok: true, service: "Baymora API" });
  });

  // Routes avec rate limiting ciblé
  app.use("/api/auth", authRateLimit, authRouter);
  app.use("/api/users/login", authRateLimit);
  app.use("/api/users/register", authRateLimit);
  app.use("/api/chat/message", chatRateLimit);

  // Routes
  app.use("/api/auth", authRouter);
  app.use("/api/auth/google", googleAuthRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/stripe", stripeRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/partners", partnersRouter);
  app.use("/api/club", clubRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/trips", tripsRouter);
  app.use("/api/concierge", conciergeRouter);
  app.use("/api/gifts", giftsRouter);
  app.use("/api/prestataires", prestatairesRouter);
  app.use("/api/atlas", atlasRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api/boutique", boutiqueRouter);
  app.use("/api/collections", collectionsRouter);
  app.use("/api/offmarket", offmarketRouter);
  app.use("/api/creator", creatorRouter);
  app.use("/api/inbox", notificationsInboxRouter);

  // 404
  app.use("/api/{*path}", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Global error handler — capture vers Sentry
  app.use((err: any, _req: any, res: any, _next: any) => {
    captureException(err, { route: _req?.path, method: _req?.method });
    res.status(500).json({ error: 'Erreur interne du serveur' });
  });

  // Init Sentry au démarrage (async, non-bloquant)
  initSentry().catch(() => {});

  return app;
}
