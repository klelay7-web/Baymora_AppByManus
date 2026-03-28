import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import chatRouter from "./routes/chat";
import profileRouter from "./routes/profile";
import usersRouter, { userAuthMiddleware } from "./routes/users";

export function createServer() {
  const app = express();

  app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:8080",
    credentials: true,
  }));
  app.use(express.json());

  // Middleware auth utilisateur (injecte req.baymoraUser si token valide)
  app.use(userAuthMiddleware);

  // Health check
  app.get("/api/ping", (_req, res) => {
    res.json({ ok: true, service: "Baymora API" });
  });

  // Routes
  app.use("/api/auth", authRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/users", usersRouter);

  // 404 — uniquement pour les routes /api/
  app.use("/api/*path", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}
