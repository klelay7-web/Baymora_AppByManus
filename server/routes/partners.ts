/**
 * Routes Partenaires Baymora
 * - Routes publiques : liste, fiche, candidature, tracking
 * - Routes admin (requireOwner) : gestion CRUD + approbation
 */

import { Router, RequestHandler } from 'express';
import { prisma } from '../db';
import { verifyToken } from '../services/auth';
import { sendEmail } from '../services/email';

const router = Router();

// ─── Middleware owner ──────────────────────────────────────────────────────────

const requireOwner: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ error: 'Non autorisé' }); return; }
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'owner') {
    res.status(403).json({ error: 'Accès réservé à l\'administration' }); return;
  }
  (req as any).adminUser = decoded;
  next();
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateAffiliateCode(name: string): string {
  const clean = name.toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 20)
    .replace(/-+$/, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BAY-${clean}-${rand}`;
}

function slugify(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Cache partenaires (5 min TTL) ─────────────────────────────────────────────

let _partnersCache: { data: any[]; ts: number } | null = null;

export function invalidatePartnersCache() {
  _partnersCache = null;
}

export async function getCachedApprovedPartners() {
  if (_partnersCache && Date.now() - _partnersCache.ts < 5 * 60 * 1000) {
    return _partnersCache.data;
  }
  const data = await prisma.partner.findMany({
    where: { status: 'approved' },
    include: { offers: { where: { isActive: true } } },
    orderBy: { approvedAt: 'desc' },
    take: 30,
  });
  _partnersCache = { data, ts: Date.now() };
  return data;
}

// ─── Routes publiques ──────────────────────────────────────────────────────────

// GET /api/partners — liste des partenaires approuvés
router.get('/', async (req, res) => {
  try {
    const { city, type, limit = '20' } = req.query as Record<string, string>;
    const where: any = { status: 'approved' };
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (type) where.type = type;

    const partners = await prisma.partner.findMany({
      where,
      include: { offers: { where: { isActive: true } } },
      orderBy: { approvedAt: 'desc' },
      take: parseInt(limit),
    });
    res.json({ partners });
  } catch (err) {
    console.error('[PARTNERS] Erreur liste:', err);
    res.status(500).json({ error: 'Erreur liste partenaires' });
  }
});

// POST /api/partners/apply — candidature d'un prestataire
router.post('/apply', async (req, res) => {
  try {
    const {
      name, type, city, address, description,
      contactName, contactEmail, contactPhone, website, message,
    } = req.body;

    if (!name || !type || !city || !contactEmail) {
      res.status(400).json({ error: 'Champs obligatoires manquants (name, type, city, contactEmail)' });
      return;
    }

    // Générer un slug unique
    let baseSlug = slugify(`${name} ${city}`);
    let slug = baseSlug;
    let attempt = 1;
    while (await prisma.partner.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${attempt++}`;
    }

    // Créer le partenaire en attente
    const partner = await prisma.partner.create({
      data: {
        slug,
        name,
        type,
        city,
        address: address || null,
        description: description || null,
        contactName: contactName || null,
        contactEmail,
        contactPhone: contactPhone || null,
        website: website || null,
        applyMessage: message || null,
        affiliateCode: '', // sera généré à l'approbation
        status: 'pending',
      },
    });

    // Notifier l'admin
    const html = `
      <h2>Nouvelle candidature partenaire Baymora</h2>
      <p><strong>Établissement :</strong> ${name}</p>
      <p><strong>Type :</strong> ${type}</p>
      <p><strong>Ville :</strong> ${city}${address ? ` — ${address}` : ''}</p>
      ${description ? `<p><strong>Description :</strong> ${description}</p>` : ''}
      ${website ? `<p><strong>Site :</strong> <a href="${website}">${website}</a></p>` : ''}
      <hr>
      <p><strong>Contact :</strong> ${contactName || 'N/A'}</p>
      <p><strong>Email :</strong> ${contactEmail}</p>
      ${contactPhone ? `<p><strong>Téléphone :</strong> ${contactPhone}</p>` : ''}
      ${message ? `<p><strong>Message :</strong> ${message}</p>` : ''}
      <hr>
      <p><em>ID partenaire : ${partner.id}</em></p>
    `;
    await sendEmail('partenaires@baymora.com', `Candidature partenaire : ${name} (${city})`, html);

    res.status(201).json({ success: true, partnerId: partner.id });
  } catch (err) {
    console.error('[PARTNERS] Erreur candidature:', err);
    res.status(500).json({ error: 'Erreur lors de la soumission de la candidature' });
  }
});

// GET /api/partners/track/:affiliateCode — tracking affilié persistant + redirect
router.get('/track/:affiliateCode', async (req, res) => {
  try {
    const { affiliateCode } = req.params;
    const { redirect, offer } = req.query as Record<string, string>;
    const baymoraUser = (req as any).baymoraUser;

    const partner = await prisma.partner.findFirst({
      where: { affiliateCode },
      select: { id: true, name: true },
    });

    if (!partner) {
      res.status(404).json({ error: 'Code affilié introuvable' });
      return;
    }

    // Persister le clic en base (remplace le console.log)
    await prisma.affiliateClick.create({
      data: {
        partnerId: partner.id,
        affiliateCode,
        userId: baymoraUser?.id || null,
        offerId: offer || null,
        ip: req.ip || null,
        userAgent: req.headers['user-agent']?.substring(0, 200) || null,
      },
    });

    console.log(`[AFFILIATE] Click: ${partner.name} (${affiliateCode}) | user: ${baymoraUser?.id || 'guest'}`);

    if (redirect) {
      res.redirect(302, redirect);
    } else {
      res.json({ success: true, partner: partner.name });
    }
  } catch (err) {
    console.error('[PARTNERS] Erreur tracking:', err);
    res.status(500).json({ error: 'Erreur tracking' });
  }
});

// ─── POST /api/partners/login — Auth partenaire via magic link ──────────────

router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: 'Email requis' }); return; }

    const partner = await prisma.partner.findFirst({
      where: { contactEmail: email.trim().toLowerCase(), status: 'approved' },
    });

    if (!partner) {
      // Ne pas révéler si le partenaire existe
      res.json({ success: true, message: 'Si ce compte existe, un lien de connexion a été envoyé.' });
      return;
    }

    // Générer un token temporaire (valide 1h)
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await prisma.partner.update({
      where: { id: partner.id },
      data: { loginToken: token, loginTokenExpiry: expiry },
    });

    const loginUrl = `${process.env.CORS_ORIGIN || 'https://baymora.com'}/partner?token=${token}`;

    await sendEmail(
      email.trim().toLowerCase(),
      'Connexion à votre espace partenaire Baymora',
      `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,sans-serif;background:#f5f3ef;margin:0;padding:0;">
<div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #e8e3da;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#1a1e2e,#0f1420);padding:32px;text-align:center;">
    <span style="font-weight:800;font-size:24px;color:#c8a94a;">B</span>
    <p style="color:rgba(200,169,74,0.9);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:8px 0 0;">Baymora Partenaires</p>
  </div>
  <div style="padding:32px;">
    <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 12px;">Bonjour ${partner.contactName || partner.name}</h1>
    <p style="color:#555;font-size:15px;line-height:1.6;">Cliquez sur le bouton ci-dessous pour accéder à votre espace partenaire. Ce lien est valable 1 heure.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${loginUrl}" style="display:inline-block;background:#c8a94a;color:#000;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">Accéder à mon espace →</a>
    </div>
    <p style="color:#999;font-size:12px;text-align:center;">Si vous n'avez pas demandé ce lien, ignorez cet email.</p>
  </div>
</div></body></html>`,
    );

    res.json({ success: true, message: 'Si ce compte existe, un lien de connexion a été envoyé.' });
  } catch (err) {
    console.error('[PARTNERS] Erreur login:', err);
    res.status(500).json({ error: 'Erreur connexion' });
  }
});

// ─── GET /api/partners/me — Dashboard partenaire (auth via token) ───────────

router.get('/me', async (req, res) => {
  try {
    const token = (req.query.token as string) || req.headers.authorization?.replace('Bearer ', '');
    if (!token) { res.status(401).json({ error: 'Token requis' }); return; }

    const partner = await prisma.partner.findFirst({
      where: { loginToken: token, loginTokenExpiry: { gte: new Date() } },
      include: {
        offers: { orderBy: { createdAt: 'desc' } },
        affiliateClicks: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });

    if (!partner) {
      res.status(401).json({ error: 'Token invalide ou expiré' });
      return;
    }

    // Stats du partenaire
    const totalClicks = await prisma.affiliateClick.count({ where: { partnerId: partner.id } });
    const conversions = await prisma.affiliateClick.count({ where: { partnerId: partner.id, convertedAt: { not: null } } });
    const totalCommission = await prisma.affiliateClick.aggregate({
      where: { partnerId: partner.id, commissionEur: { not: null } },
      _sum: { commissionEur: true },
    });

    const thisMonth = new Date();
    thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
    const monthlyClicks = await prisma.affiliateClick.count({
      where: { partnerId: partner.id, createdAt: { gte: thisMonth } },
    });

    res.json({
      partner: {
        id: partner.id,
        name: partner.name,
        type: partner.type,
        city: partner.city,
        affiliateCode: partner.affiliateCode,
        commissionRate: partner.commissionRate,
        verificationLevel: partner.verificationLevel,
        badgeType: partner.badgeType,
        status: partner.status,
      },
      offers: partner.offers,
      stats: {
        totalClicks,
        conversions,
        conversionRate: totalClicks > 0 ? Math.round((conversions / totalClicks) * 100) : 0,
        totalCommission: totalCommission._sum.commissionEur || 0,
        monthlyClicks,
      },
      recentClicks: partner.affiliateClicks.map(c => ({
        id: c.id,
        offerId: c.offerId,
        converted: !!c.convertedAt,
        commission: c.commissionEur,
        createdAt: c.createdAt,
      })),
    });
  } catch (err) {
    console.error('[PARTNERS] Erreur dashboard:', err);
    res.status(500).json({ error: 'Erreur chargement dashboard' });
  }
});

// GET /api/partners/boutique — toutes les offres actives pour la boutique
router.get('/boutique', async (_req, res) => {
  try {
    const partners = await prisma.partner.findMany({
      where: { status: 'approved' },
      include: {
        offers: { where: { isActive: true }, orderBy: { minTier: 'asc' } },
      },
      orderBy: { approvedAt: 'desc' },
    });
    // Aplatir en offres avec infos partenaire
    const offers = partners.flatMap(p =>
      p.offers.map(o => ({
        ...o,
        partner: {
          id: p.id,
          name: p.name,
          slug: p.slug,
          type: p.type,
          city: p.city,
          affiliateCode: p.affiliateCode,
          photos: p.photos,
          vibe: p.vibe,
          tags: p.tags,
        },
      }))
    );
    res.json({ offers });
  } catch (err) {
    console.error('[PARTNERS] Erreur boutique:', err);
    res.status(500).json({ error: 'Erreur boutique' });
  }
});

// GET /api/partners/:slug — fiche complète d'un partenaire approuvé
router.get('/:slug', async (req, res) => {
  try {
    const partner = await prisma.partner.findFirst({
      where: { slug: req.params.slug, status: 'approved' },
      include: { offers: { where: { isActive: true }, orderBy: { createdAt: 'asc' } } },
    });

    if (!partner) {
      res.status(404).json({ error: 'Partenaire introuvable' });
      return;
    }

    res.json({ partner });
  } catch (err) {
    console.error('[PARTNERS] Erreur fiche:', err);
    res.status(500).json({ error: 'Erreur fiche partenaire' });
  }
});

// ─── Routes admin ──────────────────────────────────────────────────────────────

// GET /api/admin/partners
router.get('/admin/list', requireOwner, async (_req, res) => {
  try {
    const partners = await prisma.partner.findMany({
      include: { offers: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ partners });
  } catch (err) {
    console.error('[PARTNERS] Erreur liste admin:', err);
    res.status(500).json({ error: 'Erreur liste admin partenaires' });
  }
});

// PATCH /api/admin/partners/:id/approve
router.patch('/admin/:id/approve', requireOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = (req as any).adminUser;

    const existing = await prisma.partner.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ error: 'Partenaire introuvable' }); return; }

    const affiliateCode = generateAffiliateCode(existing.name);

    const partner = await prisma.partner.update({
      where: { id },
      data: {
        status: 'approved',
        affiliateCode,
        approvedAt: new Date(),
        approvedBy: adminUser?.userId || 'admin',
      },
      include: { offers: true },
    });

    // Invalider le cache
    invalidatePartnersCache();

    res.json({ partner });
  } catch (err) {
    console.error('[PARTNERS] Erreur approbation:', err);
    res.status(500).json({ error: 'Erreur approbation' });
  }
});

// PATCH /api/admin/partners/:id
router.patch('/admin/:id', requireOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, type, status, city, address, country,
      description, vibe, photos, videoUrl, virtualTourUrl, mapQuery,
      tags, priceLevel, commissionRate, testCostAmount,
      contactName, contactEmail, contactPhone, website, notes,
    } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (city !== undefined) updateData.city = city;
    if (address !== undefined) updateData.address = address;
    if (country !== undefined) updateData.country = country;
    if (description !== undefined) updateData.description = description;
    if (vibe !== undefined) updateData.vibe = vibe;
    if (photos !== undefined) updateData.photos = photos;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
    if (virtualTourUrl !== undefined) updateData.virtualTourUrl = virtualTourUrl;
    if (mapQuery !== undefined) updateData.mapQuery = mapQuery;
    if (tags !== undefined) updateData.tags = tags;
    if (priceLevel !== undefined) updateData.priceLevel = priceLevel;
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate;
    if (testCostAmount !== undefined) updateData.testCostAmount = testCostAmount;
    if (contactName !== undefined) updateData.contactName = contactName;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (website !== undefined) updateData.website = website;
    if (notes !== undefined) updateData.notes = notes;

    const partner = await prisma.partner.update({
      where: { id },
      data: updateData,
      include: { offers: true },
    });

    // Invalider le cache si statut a changé
    if (status !== undefined) invalidatePartnersCache();

    res.json({ partner });
  } catch (err) {
    console.error('[PARTNERS] Erreur mise à jour:', err);
    res.status(500).json({ error: 'Erreur mise à jour partenaire' });
  }
});

// POST /api/admin/partners/:id/offers
router.post('/admin/:id/offers', requireOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, description, normalPrice, baymoraPrice, currency, bookingUrl, minTier } = req.body;

    if (!type || !title) {
      res.status(400).json({ error: 'type et title obligatoires' });
      return;
    }

    const validTiers = ['crystal', 'gold', 'platinum', 'diamond'];
    const offer = await prisma.partnerOffer.create({
      data: {
        partnerId: id,
        type,
        title,
        description: description || null,
        normalPrice: normalPrice ? parseFloat(normalPrice) : null,
        baymoraPrice: baymoraPrice ? parseFloat(baymoraPrice) : null,
        currency: currency || 'EUR',
        bookingUrl: bookingUrl || null,
        minTier: validTiers.includes(minTier) ? minTier : 'crystal',
      },
    });

    invalidatePartnersCache();
    res.status(201).json({ offer });
  } catch (err) {
    console.error('[PARTNERS] Erreur ajout offre:', err);
    res.status(500).json({ error: 'Erreur ajout offre' });
  }
});

// PATCH /api/admin/partners/:id/offers/:offerId
router.patch('/admin/:id/offers/:offerId', requireOwner, async (req, res) => {
  try {
    const { offerId } = req.params;
    const { type, title, description, normalPrice, baymoraPrice, currency, bookingUrl, isActive, minTier } = req.body;

    const updateData: any = {};
    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (normalPrice !== undefined) updateData.normalPrice = normalPrice ? parseFloat(normalPrice) : null;
    if (baymoraPrice !== undefined) updateData.baymoraPrice = baymoraPrice ? parseFloat(baymoraPrice) : null;
    if (currency !== undefined) updateData.currency = currency;
    if (bookingUrl !== undefined) updateData.bookingUrl = bookingUrl;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (minTier !== undefined) {
      const validTiers = ['crystal', 'gold', 'platinum', 'diamond'];
      updateData.minTier = validTiers.includes(minTier) ? minTier : 'crystal';
    }

    const offer = await prisma.partnerOffer.update({ where: { id: offerId }, data: updateData });
    invalidatePartnersCache();
    res.json({ offer });
  } catch (err) {
    console.error('[PARTNERS] Erreur mise à jour offre:', err);
    res.status(500).json({ error: 'Erreur mise à jour offre' });
  }
});

// DELETE /api/admin/partners/:id/offers/:offerId
router.delete('/admin/:id/offers/:offerId', requireOwner, async (req, res) => {
  try {
    const { offerId } = req.params;
    await prisma.partnerOffer.delete({ where: { id: offerId } });
    invalidatePartnersCache();
    res.json({ success: true });
  } catch (err) {
    console.error('[PARTNERS] Erreur suppression offre:', err);
    res.status(500).json({ error: 'Erreur suppression offre' });
  }
});

export default router;
