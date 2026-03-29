import "dotenv/config";
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
import googleAuthRouter from "./routes/googleAuth";
import { chatRateLimit, authRateLimit } from "./middleware/rateLimit";
import { startBirthdayCron } from "./services/birthdayCron";

export function createServer() {
  const app = express();

  app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:8080",
    credentials: true,
  }));

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

  // 404
  app.use("/api/{*path}", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}
