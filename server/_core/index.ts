import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import crypto from "crypto";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleStripeWebhook } from "../stripe/webhook";
import { startEventMaintenanceCron } from "../services/eventMaintenanceService";
import { startEventNotificationCron } from "../services/eventNotificationService";
import { trackAffiliateClick, getDb } from "../db";
import { affiliatePartners } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Stripe webhook MUST be before express.json() to preserve raw body for signature verification
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // File upload for field reports
  app.post("/api/upload/field-report", async (req, res) => {
    try {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", async () => {
        try {
          const body = Buffer.concat(chunks);
          const contentType = req.headers["content-type"] || "application/octet-stream";
          const fileName = (req.headers["x-file-name"] as string) || `upload-${Date.now()}`;
          const userId = (req.headers["x-user-id"] as string) || "unknown";
          const { storagePut } = await import("../storage");
          const suffix = Math.random().toString(36).substring(2, 8);
          const key = `field-reports/${userId}/${Date.now()}-${suffix}-${fileName}`;
          const { url } = await storagePut(key, body, contentType);
          res.json({ url, key });
        } catch (err: any) {
          res.status(500).json({ error: err.message });
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Affiliate redirect tracking
  app.get("/api/affiliate/redirect", async (req, res) => {
    try {
      const { partner, dest, userId } = req.query as { partner?: string; dest?: string; userId?: string };
      if (!dest) return res.status(400).json({ error: "Missing dest parameter" });
      const decodedDest = decodeURIComponent(String(dest));
      const partnerSlug = String(partner || "booking").toLowerCase();
      const userIdNum = userId ? parseInt(String(userId), 10) : undefined;
      const referrer = (req.headers.referer || req.headers.referrer) as string | undefined;
      const userAgent = req.headers["user-agent"] as string | undefined;
      const ip = ((req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "").split(",")[0].trim();
      const ipHash = ip ? crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16) : undefined;
      // Logger le clic en base (non bloquant)
      try {
        const db = await getDb();
        if (db) {
          const rows = await db.select({ id: affiliatePartners.id })
            .from(affiliatePartners)
            .where(eq(affiliatePartners.slug, partnerSlug))
            .limit(1);
          const partnerId = rows[0]?.id ?? 1;
          await trackAffiliateClick(partnerId, decodedDest, undefined, userIdNum || undefined, referrer, userAgent, ipHash);
        }
      } catch (logErr) {
        console.warn("[Affiliate] Log error (non-blocking):", logErr);
      }
      console.log(`[Affiliate] Click: partner=${partnerSlug} userId=${userId} dest=${decodedDest}`);
      res.redirect(302, decodedDest);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Démarrer le cron de maintenance des événements (re-seed dates glissantes)
    startEventMaintenanceCron();
    // Démarrer les notifications Ce soir (18h lun-ven) et Ce week-end (vendredi 17h)
    startEventNotificationCron();
  });
}

startServer().catch(console.error);
