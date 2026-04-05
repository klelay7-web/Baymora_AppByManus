import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const conn = await mysql.createConnection(DATABASE_URL);

// Fetch all establishments
const [rows] = await conn.execute("SELECT id, slug, name, subtitle, category, city, country, address, lat, lng, heroImageUrl, description, shortDescription, phone, website, openingHours, priceRange, priceLevel, cuisineType, rating, reviewCount, reviews FROM establishments WHERE status = 'published'");

console.log(`📋 Found ${rows.length} published establishments\n`);

function buildSchemaOrg(est) {
  const base = {
    "@context": "https://schema.org",
    "name": est.name,
    "description": est.shortDescription || est.description?.substring(0, 200),
    "url": `https://www.baymora.com/etablissement/${est.slug}`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": est.address,
      "addressLocality": est.city,
      "addressCountry": est.country
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": est.lat,
      "longitude": est.lng
    }
  };

  if (est.heroImageUrl) base.image = est.heroImageUrl;
  if (est.phone) base.telephone = est.phone;
  if (est.website) base.url = est.website;

  // Parse rating
  if (est.rating && est.reviewCount) {
    base.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": parseFloat(est.rating),
      "bestRating": 5,
      "worstRating": 1,
      "ratingCount": est.reviewCount
    };
  }

  // Parse reviews
  if (est.reviews) {
    try {
      const reviewsArr = JSON.parse(est.reviews);
      if (reviewsArr.length > 0) {
        base.review = reviewsArr.map(r => ({
          "@type": "Review",
          "author": { "@type": "Person", "name": r.author },
          "reviewRating": { "@type": "Rating", "ratingValue": r.rating, "bestRating": 5 },
          "reviewBody": r.text,
          "datePublished": r.date
        }));
      }
    } catch (e) { /* skip */ }
  }

  // Parse opening hours
  if (est.openingHours) {
    try {
      const hours = JSON.parse(est.openingHours);
      const dayMap = { lun: "Monday", mar: "Tuesday", mer: "Wednesday", jeu: "Thursday", ven: "Friday", sam: "Saturday", dim: "Sunday", reception: null };
      const specs = [];
      for (const [day, time] of Object.entries(hours)) {
        if (dayMap[day] === null) continue; // skip "reception: 24h/24"
        if (dayMap[day]) {
          const times = time.split(",").map(t => t.trim());
          for (const t of times) {
            if (t.includes("-")) {
              const [open, close] = t.split("-").map(s => s.trim());
              specs.push({
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": dayMap[day],
                "opens": open,
                "closes": close
              });
            }
          }
        }
      }
      if (specs.length > 0) base.openingHoursSpecification = specs;
    } catch (e) { /* skip */ }
  }

  // Price range
  if (est.priceRange) base.priceRange = est.priceRange;

  // Category-specific types
  switch (est.category) {
    case "restaurant":
      base["@type"] = "Restaurant";
      if (est.cuisineType) base.servesCuisine = est.cuisineType;
      break;
    case "hotel":
      base["@type"] = "Hotel";
      base.starRating = { "@type": "Rating", "ratingValue": 5 };
      base.checkinTime = "15:00";
      base.checkoutTime = "12:00";
      break;
    case "bar":
      base["@type"] = "BarOrPub";
      if (est.cuisineType) base.servesCuisine = est.cuisineType;
      break;
    case "spa":
    case "wellness":
      base["@type"] = "HealthAndBeautyBusiness";
      break;
    case "museum":
      base["@type"] = "Museum";
      break;
    case "experience":
    case "activity":
      base["@type"] = "TouristAttraction";
      base.touristType = "Luxury travelers";
      break;
    default:
      base["@type"] = "LocalBusiness";
  }

  return JSON.stringify(base);
}

let updated = 0;
for (const est of rows) {
  const schemaOrg = buildSchemaOrg(est);
  try {
    await conn.execute("UPDATE establishments SET schemaOrg = ? WHERE id = ?", [schemaOrg, est.id]);
    console.log(`  ✅ ${est.name} (${est.category})`);
    updated++;
  } catch (e) {
    console.error(`  ❌ ${est.name}: ${e.message}`);
  }
}

console.log(`\n✨ Schema.org updated for ${updated} establishments`);
await conn.end();
