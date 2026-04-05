/**
 * POLLEN SERVICE — Données polliniques & qualité de l'air
 *
 * Sources (par ordre de priorité) :
 * 1. Google Air Quality API — résolution 500m x 500m, données officiel Google
 *    https://developers.google.com/maps/documentation/air-quality
 * 2. Open-Meteo Air Quality API (fallback gratuit, sans clé)
 *
 * Types de pollen couverts :
 * - Graminées (grass) — principal allergène printanier
 * - Bouleau (tree) — forte allergie en Europe du Nord
 * - Mauvaises herbes (weed) — ambroisie, armoise
 */

import { geocodeAddress } from './maps';

export interface PollenData {
  type: 'grass' | 'tree' | 'weed' | 'birch' | 'alder' | 'ragweed' | 'olive';
  labelFr: string;
  value: number | null;
  level: 'faible' | 'modéré' | 'élevé' | 'très élevé' | 'inconnu';
  levelEmoji: string;
}

export interface AirQualityData {
  location: string;
  aqi: number | null;
  aqiLabel: string;
  aqiEmoji: string;
  pm25: number | null;
  pm10: number | null;
  pollen: PollenData[];
  dominantAllergen: string | null;
  advice: string;
  source: 'google' | 'open-meteo';
  fetchedAt: Date;
}

// ─── Google Air Quality API ───────────────────────────────────────────────────

async function getGoogleAirQuality(lat: number, lng: number): Promise<AirQualityData | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    // 1. AQI + pollutants
    const aqiRes = await fetch(
      `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: { latitude: lat, longitude: lng },
          extraComputations: ['POLLUTANT_CONCENTRATION', 'DOMINANT_POLLUTANT_CONCENTRATION'],
          languageCode: 'fr',
        }),
      }
    );

    // 2. Pollen
    const pollenRes = await fetch(
      `https://pollen.googleapis.com/v1/forecast:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}&days=1`,
    );

    if (!aqiRes.ok && !pollenRes.ok) return null;

    const aqiData = aqiRes.ok ? await aqiRes.json() : null;
    const pollenData = pollenRes.ok ? await pollenRes.json() : null;

    // Extraire AQI
    const indexes = aqiData?.indexes || [];
    const euAqi = indexes.find((i: any) => i.code === 'eea') || indexes[0];
    const aqiValue = euAqi?.aqiDisplay ? parseInt(euAqi.aqiDisplay) : null;

    // Extraire PM2.5 / PM10
    const pollutants = aqiData?.pollutants || [];
    const pm25 = pollutants.find((p: any) => p.code === 'pm25')?.concentration?.value ?? null;
    const pm10 = pollutants.find((p: any) => p.code === 'pm10')?.concentration?.value ?? null;

    // Extraire pollen
    const pollenItems: PollenData[] = [];
    const dailyInfo = pollenData?.dailyInfo?.[0];
    if (dailyInfo?.pollenTypeInfo) {
      for (const pType of dailyInfo.pollenTypeInfo) {
        const indexVal = pType.indexInfo?.value ?? null;
        const level = assessPollenIndexLevel(indexVal);
        const type = pType.code?.toLowerCase() === 'grass' ? 'grass'
          : pType.code?.toLowerCase() === 'tree' ? 'tree'
          : 'weed';
        const labelMap: Record<string, string> = {
          GRASS: 'Graminées',
          TREE: 'Arbres',
          WEED: 'Mauvaises herbes',
        };
        pollenItems.push({
          type,
          labelFr: labelMap[pType.code] || pType.displayName || pType.code,
          value: indexVal,
          level,
          levelEmoji: getPollenEmoji(level),
        });
      }
    }

    const dominant = pollenItems
      .filter(p => p.value !== null && p.value > 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0))[0];

    const { label: aqiLabel, emoji: aqiEmoji } = assessAQI(aqiValue);

    console.log(`[POLLEN] Google API: AQI ${aqiValue}, pollen: ${pollenItems.map(p => `${p.labelFr}=${p.level}`).join(', ')}`);

    return {
      location: `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      aqi: aqiValue,
      aqiLabel,
      aqiEmoji,
      pm25: pm25 !== null ? Math.round(pm25 * 10) / 10 : null,
      pm10: pm10 !== null ? Math.round(pm10 * 10) / 10 : null,
      pollen: pollenItems,
      dominantAllergen: dominant?.labelFr || null,
      advice: buildAdvice(pollenItems, aqiValue),
      source: 'google',
      fetchedAt: new Date(),
    };
  } catch (error) {
    console.error('[POLLEN] Erreur Google Air Quality:', error);
    return null;
  }
}

// ─── Open-Meteo Fallback ──────────────────────────────────────────────────────

async function getOpenMeteoAirQuality(lat: number, lng: number): Promise<AirQualityData | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      hourly: 'grass_pollen,birch_pollen,alder_pollen,ragweed_pollen,olive_pollen,european_aqi,pm10,pm2_5',
      forecast_days: '1',
      timezone: 'auto',
    });

    const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
    if (!res.ok) return null;

    const data = await res.json();
    const nowIdx = getCurrentHourIndex(data.hourly?.time || []);

    const grassVal = data.hourly?.grass_pollen?.[nowIdx] ?? null;
    const birchVal = data.hourly?.birch_pollen?.[nowIdx] ?? null;
    const alderVal = data.hourly?.alder_pollen?.[nowIdx] ?? null;
    const ragweedVal = data.hourly?.ragweed_pollen?.[nowIdx] ?? null;
    const oliveVal = data.hourly?.olive_pollen?.[nowIdx] ?? null;
    const aqiVal = data.hourly?.european_aqi?.[nowIdx] ?? null;
    const pm25Val = data.hourly?.pm2_5?.[nowIdx] ?? null;
    const pm10Val = data.hourly?.pm10?.[nowIdx] ?? null;

    const pollenItems: PollenData[] = [
      buildPollenData('grass', 'Graminées', grassVal),
      buildPollenData('birch', 'Bouleau', birchVal),
      buildPollenData('alder', 'Aulne', alderVal),
      buildPollenData('ragweed', 'Ambroisie', ragweedVal),
      buildPollenData('olive', 'Olivier', oliveVal),
    ].filter(p => p.value !== null);

    const dominant = pollenItems
      .filter(p => p.value !== null && (p.value || 0) > 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0))[0];

    const { label: aqiLabel, emoji: aqiEmoji } = assessAQI(aqiVal);

    return {
      location: `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      aqi: aqiVal !== null ? Math.round(aqiVal) : null,
      aqiLabel,
      aqiEmoji,
      pm25: pm25Val !== null ? Math.round(pm25Val * 10) / 10 : null,
      pm10: pm10Val !== null ? Math.round(pm10Val * 10) / 10 : null,
      pollen: pollenItems,
      dominantAllergen: dominant?.labelFr || null,
      advice: buildAdvice(pollenItems, aqiVal),
      source: 'open-meteo',
      fetchedAt: new Date(),
    };
  } catch (error) {
    console.error('[POLLEN] Erreur Open-Meteo:', error);
    return null;
  }
}

// ─── Interface publique ───────────────────────────────────────────────────────

export async function getAirQuality(locationName: string): Promise<AirQualityData | null> {
  // Géocoder la ville
  const geo = await geocodeAddress(locationName);
  if (!geo) {
    console.warn(`[POLLEN] Impossible de géocoder: ${locationName}`);
    return null;
  }

  const { lat, lng } = geo;

  // Essayer Google en premier (résolution 500m, données officielles)
  const googleResult = await getGoogleAirQuality(lat, lng);
  if (googleResult) {
    googleResult.location = geo.formatted;
    return googleResult;
  }

  // Fallback Open-Meteo (gratuit)
  console.log('[POLLEN] Fallback Open-Meteo');
  const openMeteoResult = await getOpenMeteoAirQuality(lat, lng);
  if (openMeteoResult) {
    openMeteoResult.location = geo.formatted;
    return openMeteoResult;
  }

  return null;
}

// ─── Rapport formaté pour Claude ─────────────────────────────────────────────

export function formatPollenReport(data: AirQualityData): string {
  const sourceLabel = data.source === 'google' ? 'Google Air Quality' : 'Open-Meteo';
  const lines: string[] = [`## Qualité de l'air & Pollen — ${data.location} *(${sourceLabel})*`];

  lines.push(`**Qualité de l'air :** ${data.aqiEmoji} ${data.aqiLabel}${data.aqi !== null ? ` (AQI ${data.aqi})` : ''}`);

  if (data.pm25 !== null || data.pm10 !== null) {
    const parts: string[] = [];
    if (data.pm25 !== null) parts.push(`PM2.5: ${data.pm25} µg/m³`);
    if (data.pm10 !== null) parts.push(`PM10: ${data.pm10} µg/m³`);
    lines.push(`🏭 Particules fines : ${parts.join(' · ')}`);
  }

  const activePollen = data.pollen.filter(p => p.level !== 'inconnu' && p.level !== 'faible');
  if (activePollen.length > 0) {
    lines.push(`\n**Pollen actifs :**`);
    activePollen.forEach(p => {
      lines.push(`${p.levelEmoji} ${p.labelFr} : ${p.level}${p.value !== null ? ` (indice ${Math.round(p.value)})` : ''}`);
    });
  } else {
    lines.push(`🌿 Pollen : niveaux faibles aujourd'hui`);
  }

  if (data.dominantAllergen) {
    lines.push(`\n⚠️ Allergène dominant : **${data.dominantAllergen}**`);
  }

  if (data.advice) {
    lines.push(`\n💡 ${data.advice}`);
  }

  return lines.join('\n');
}

// ─── Helpers privés ───────────────────────────────────────────────────────────

function buildPollenData(type: PollenData['type'], labelFr: string, value: number | null): PollenData {
  const level = assessPollenLevel(value);
  return { type, labelFr, value, level, levelEmoji: getPollenEmoji(level) };
}

// Niveaux Open-Meteo (grains/m³)
function assessPollenLevel(value: number | null): PollenData['level'] {
  if (value === null) return 'inconnu';
  if (value < 10) return 'faible';
  if (value < 30) return 'modéré';
  if (value < 80) return 'élevé';
  return 'très élevé';
}

// Niveaux Google (index 0-5)
function assessPollenIndexLevel(value: number | null): PollenData['level'] {
  if (value === null) return 'inconnu';
  if (value <= 1) return 'faible';
  if (value <= 2) return 'modéré';
  if (value <= 3) return 'élevé';
  return 'très élevé';
}

function getPollenEmoji(level: PollenData['level']): string {
  const map: Record<PollenData['level'], string> = {
    faible: '🟢', modéré: '🟡', élevé: '🟠', 'très élevé': '🔴', inconnu: '⬜',
  };
  return map[level];
}

function assessAQI(aqi: number | null): { label: string; emoji: string } {
  if (aqi === null) return { label: 'Données indisponibles', emoji: '⬜' };
  if (aqi <= 20) return { label: 'Très bonne', emoji: '💚' };
  if (aqi <= 40) return { label: 'Bonne', emoji: '🟢' };
  if (aqi <= 60) return { label: 'Modérée', emoji: '🟡' };
  if (aqi <= 80) return { label: 'Mauvaise', emoji: '🟠' };
  if (aqi <= 100) return { label: 'Très mauvaise', emoji: '🔴' };
  return { label: 'Extrêmement mauvaise', emoji: '🟣' };
}

function buildAdvice(pollen: PollenData[], aqi: number | null): string {
  const highPollen = pollen.filter(p => p.level === 'élevé' || p.level === 'très élevé');
  if (highPollen.length > 0 && aqi !== null && aqi > 60) {
    return `Journée difficile pour les allergiques : ${highPollen.map(p => p.labelFr.toLowerCase()).join(' et ')} à risque + air pollué. Préférez les activités intérieures.`;
  }
  if (highPollen.length > 0) {
    return `${highPollen.map(p => p.labelFr).join(', ')} : niveaux élevés. Évitez les activités extérieures prolongées si vous êtes allergique.`;
  }
  if (aqi !== null && aqi > 60) {
    return `Qualité de l'air dégradée. Limitez les efforts en extérieur.`;
  }
  return `Conditions favorables pour les activités extérieures.`;
}

function getCurrentHourIndex(times: string[]): number {
  const now = new Date();
  const currentHour = now.getHours();
  const today = now.toISOString().split('T')[0];
  const idx = times.findIndex((t: string) => t.startsWith(today) && parseInt(t.split('T')[1]) >= currentHour);
  return idx >= 0 ? idx : 0;
}
