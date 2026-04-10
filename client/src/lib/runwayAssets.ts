// Runway Gen 4.5 — Assets CDN URLs
// Généré automatiquement — ne pas modifier manuellement

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663511927491/9v8AF2UUHUqZmkCSAruMmm";

export const RUNWAY_VIDEOS = {
  // Hero
  heroLanding: `${CDN}/hero-landing_2eb91938.mp4`,
  heroMaison: `${CDN}/hero-maison_4c5f09b0.mp4`,

  // Nightlife
  nightlifeClub: `${CDN}/nightlife-club_2068bcbe.mp4`,
  nightlifeRooftop: `${CDN}/nightlife-rooftop_f4b5215d.mp4`,
  nightlifeJazz: `${CDN}/nightlife-jazz_900589d9.mp4`,
  nightlifeDegustation: `${CDN}/nightlife-degustation_b0119bf6.mp4`,
  nightlifeFestival: `${CDN}/nightlife-festival_6abfb5dc.mp4`,

  // Personas
  personaCeSoir: `${CDN}/persona-cesoir_8301e1d4.mp4`,
  personaBusiness: `${CDN}/persona-business_09a9217d.mp4`,
  personaFamille: `${CDN}/persona-famille_f936976b.mp4`,

  // Destinations (9:16)
  destSaintTropez: `${CDN}/dest-saint-tropez.mp4`,
  destAlpesSki: `${CDN}/dest-alpes-ski.mp4`,
  destNyc: `${CDN}/dest-nyc.mp4`,
  destSantorin: `${CDN}/dest-santorin.mp4`,
  destTokyo: `${CDN}/dest-tokyo.mp4`,
  destMarrakech: `${CDN}/dest-marrakech.mp4`,
} as const;

export const RUNWAY_IMAGES = {
  // Catégories Ma position
  catSortir: `${CDN}/cat-sortir_75d033eb.jpg`,
  catManger: `${CDN}/cat-manger_aab6964f.jpg`,
  catRessourcer: `${CDN}/cat-ressourcer_2343fc51.jpg`,
  catBouger: `${CDN}/cat-bouger_49cf7e18.jpg`,
  catTravailler: `${CDN}/cat-travailler_781ba628.jpg`,
  catDomicile: `${CDN}/cat-domicile_74629910.jpg`,
  catRencontrer: `${CDN}/cat-rencontrer_cff7987e.jpg`,
  catEvader: `${CDN}/cat-evader_7b393143.jpg`,

  // Templates Story Cards
  tplSecretDuJour: `${CDN}/tpl-secret-du-jour_ab56214e.jpg`,
  tplTripCard: `${CDN}/tpl-trip-card_8381be53.jpg`,
  tplInvitation: `${CDN}/tpl-invitation_fdaed776.jpg`,
} as const;

// Nightlife videos array for event cards rotation
export const NIGHTLIFE_VIDEOS = [
  RUNWAY_VIDEOS.nightlifeClub,
  RUNWAY_VIDEOS.nightlifeRooftop,
  RUNWAY_VIDEOS.nightlifeJazz,
  RUNWAY_VIDEOS.nightlifeDegustation,
  RUNWAY_VIDEOS.nightlifeFestival,
];
