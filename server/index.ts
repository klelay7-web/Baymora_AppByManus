import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import chatRouter from "./routes/chat";
import profileRouter from "./routes/profile";

export function createServer() {
  const app = express();

  app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:8080",
    credentials: true,
  }));
  app.use(express.json());

  // Health check
  app.get("/api/ping", (_req, res) => {
    res.json({ ok: true, service: "Baymora API" });
  });

  // Routes
  app.use("/api/auth", authRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/profile", profileRouter);

  // 404 — uniquement pour les routes /api/*
  app.use("/api/*", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}
