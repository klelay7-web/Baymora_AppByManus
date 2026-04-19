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
import { runEnrichBatch, startEnrichCron } from "../cron/enrichCron";
import { sdk } from "./sdk";
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

  // SEO: robots.txt
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(`User-agent: *\nAllow: /\nSitemap: https://www.baymora.com/sitemap.xml\nDisallow: /auth\nDisallow: /profil\nDisallow: /maya`);
  });

  // SEO: sitemap.xml
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const db = await getDb();
      const urls: string[] = [
        "https://www.baymora.com/",
        "https://www.baymora.com/premium",
        "https://www.baymora.com/mentions-legales",
        "https://www.baymora.com/confidentialite",
        "https://www.baymora.com/cgu",
        "https://www.baymora.com/contact",
      ];
      if (db) {
        const { establishments, inspirationThemes: it, parcoursMaison: pm, contentPages: cp } = await import("../../drizzle/schema");
        const estRows = await db.select({ slug: establishments.slug }).from(establishments).limit(1000);
        for (const r of estRows) urls.push(`https://www.baymora.com/lieu/${r.slug}`);
        try {
          const thRows = await db.select({ slug: it.slug }).from(it).limit(200);
          for (const r of thRows) urls.push(`https://www.baymora.com/inspiration/${r.slug}`);
        } catch { /* table might not exist */ }
        try {
          const pmRows = await db.select({ slug: pm.slug }).from(pm).limit(200);
          for (const r of pmRows) urls.push(`https://www.baymora.com/parcours-maison/${r.slug}`);
        } catch { /* table might not exist */ }
        try {
          const cpRows = await db.select({ slug: cp.slug }).from(cp).limit(500);
          for (const r of cpRows) urls.push(`https://www.baymora.com/guide/${r.slug}`);
        } catch { /* table might not exist */ }
      }
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>`;
      res.type("application/xml").send(xml);
    } catch (err: any) {
      res.status(500).send("<!-- sitemap error -->");
    }
  });

  // Admin-only manual enrichment trigger
  app.get("/api/admin/enrich", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (user.role !== "admin") {
        return res.status(403).json({ error: "admin only" });
      }
      const result = await runEnrichBatch();
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("[admin/enrich] error:", err);
      res.status(err?.status || 500).json({ error: err?.message || "enrich failed" });
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
    // Démarrer le cron d'enrichissement des établissements (toutes les 2h)
    startEnrichCron();
  });
}

startServer().catch(console.error);
