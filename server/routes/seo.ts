import { Router } from "express";

const router = Router();

const BASE_URL = process.env.BASE_URL || "https://baymora.com";

const SITEMAP_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/chat", priority: "0.9", changefreq: "daily" },
  { path: "/auth", priority: "0.5", changefreq: "monthly" },
  { path: "/boutique", priority: "0.8", changefreq: "weekly" },
  { path: "/devenir-partenaire", priority: "0.7", changefreq: "monthly" },
  { path: "/club", priority: "0.8", changefreq: "weekly" },
];

const PAGE_META: Record<string, { title: string; description: string; ogImage: string }> = {
  home: {
    title: "Baymora — Votre conciergerie de voyage premium par IA",
    description: "Baymora est votre conciergerie de voyage premium propulsée par l'IA. Planifiez, réservez et vivez des expériences uniques.",
    ogImage: `${BASE_URL}/og-home.png`,
  },
  chat: {
    title: "Chat Baymora — Parlez à votre concierge IA",
    description: "Discutez en temps réel avec votre concierge IA Baymora pour organiser vos voyages sur mesure.",
    ogImage: `${BASE_URL}/og-chat.png`,
  },
  boutique: {
    title: "Boutique Baymora — Cadeaux et produits premium",
    description: "Découvrez notre sélection de cadeaux et produits premium pour voyageurs exigeants.",
    ogImage: `${BASE_URL}/og-boutique.png`,
  },
  partner: {
    title: "Devenir partenaire Baymora — 15% de commission",
    description: "Rejoignez le programme partenaire Baymora et gagnez 15% de commission sur chaque recommandation.",
    ogImage: `${BASE_URL}/og-partner.png`,
  },
  club: {
    title: "Baymora Club — Gagnez des points, débloquez des privilèges",
    description: "Rejoignez le Baymora Club pour accumuler des points et débloquer des privilèges exclusifs.",
    ogImage: `${BASE_URL}/og-club.png`,
  },
};

// GET /sitemap.xml
router.get("/sitemap.xml", (_req, res) => {
  const urls = SITEMAP_ROUTES.map(
    (r) => `  <url>
    <loc>${BASE_URL}${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  res.header("Content-Type", "application/xml").send(xml);
});

// GET /robots.txt
router.get("/robots.txt", (_req, res) => {
  const txt = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml`;

  res.header("Content-Type", "text/plain").send(txt);
});

// GET /api/seo/meta/:page
router.get("/api/seo/meta/:page", (req, res) => {
  const meta = PAGE_META[req.params.page];
  if (!meta) {
    return res.status(404).json({ error: "Page not found" });
  }
  res.json(meta);
});

export default router;
