import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const conn = await mysql.createConnection(DATABASE_URL);

// ─── Mapping slug → heroImageUrl (CDN webp) ─────────────────────────

const imageMapping = {
  // PARIS
  "le-cinq-paris": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-le-cinq-paris-9qTbs8An47jBsjQCAYs7xM.webp",
  "hotel-plaza-athenee-paris": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-plaza-athenee-paris-UQttpWbf4KhLKFavhpDju8.webp",
  "crazy-horse-paris": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-crazy-horse-paris-kZQLZKFQ9FMpn3kUbYHqw6.webp",
  "bar-hemingway-ritz-paris": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-crazy-horse-paris-kZQLZKFQ9FMpn3kUbYHqw6.webp",
  
  // MARRAKECH
  "la-mamounia-marrakech": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-mamounia-marrakech-WXuKtndnzDxsWbaZf8RMed.webp",
  "le-jardin-marrakech": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-le-comptoir-marrakech-SWLGFArqYTGJ6rafRiKZ32.webp",
  "hammam-mouassine-marrakech": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-hammam-rose-marrakech-e4AJVTS2TKhiaQSM9XUbBV.webp",
  "musee-ysl-marrakech": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-souk-marrakech-ScYbedBnHrmMUsRhMb7BPy.webp",
  
  // SANTORINI
  "canaves-oia-santorini": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-canaves-oia-santorini-dYNNPqBiH8GUcPC6dZMq4y.webp",
  "selene-santorini": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-selene-santorini-dD8zskVi34xkzPP8rJANyk.webp",
  "sailing-catamaran-santorini": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-sunset-cruise-santorini-43GVV6w8FwsAdnFbxFKRVj.webp",
  "santo-wines-santorini": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-wine-tasting-santorini-KTKgTmDE6NDvcfvaRAjD4n.webp",
  
  // TOKYO
  "aman-tokyo": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-aman-tokyo-aZXaYUrFDjjHKPFBHjghJ9.webp",
  "sukiyabashi-jiro-tokyo": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-sukiyabashi-jiro-tokyo-hG9fwuNjhqaKTXm7cv8fVi.webp",
  "teamlab-borderless-tokyo": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-teamlab-tokyo-KCDpQVmpSkpZHyEWxLcg8a.webp",
  "golden-gai-tokyo": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-bar-benfiddich-tokyo-cgPxoMgiqiugMLoAnN3csN.webp",
  
  // NEW YORK
  "the-mark-hotel-new-york": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-mark-hotel-newyork-H7wYDzKsoopT3Gogr3uiVb.webp",
  "le-bernardin-new-york": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-le-bernardin-ny-XNKTXuSWQ3auUpy8MJmhDj.webp",
  "sleep-no-more-new-york": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-attiko-ny-ksKuanCuwityQbAeuoUSBB.webp",
  "please-dont-tell-new-york": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-helicopter-ny-W7nbN8cvvsmM2GZvpJXSkG.webp",
  
  // BALI
  "four-seasons-sayan-bali": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-four-seasons-bali-3GtU7HyX7Q4FxXXuxAFiJE.webp",
  "locavore-bali": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-locavore-bali-aaBAHpjTmNKif2xPCN28dq.webp",
  "tegallalang-rice-terraces-bali": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-riziere-bali-PKct2V33VbuKJ2AyAbx4V4.webp",
  "como-shambhala-bali": "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm/baymora-spa-bali-USRQm4Ye3oxWJfMnaoeUFr.webp",
};

console.log("🖼️  Updating heroImageUrl for 24 establishments...\n");

let updated = 0;
let errors = 0;

for (const [slug, imageUrl] of Object.entries(imageMapping)) {
  try {
    const [result] = await conn.execute(
      "UPDATE establishments SET heroImageUrl = ? WHERE slug = ?",
      [imageUrl, slug]
    );
    if (result.affectedRows > 0) {
      console.log(`  ✅ ${slug}`);
      updated++;
    } else {
      console.log(`  ⚠️  ${slug} — not found in DB`);
    }
  } catch (e) {
    console.error(`  ❌ ${slug}: ${e.message}`);
    errors++;
  }
}

console.log(`\n✨ Done! Updated: ${updated}, Errors: ${errors}`);
await conn.end();
