/**
 * POLLEN SERVICE — Données polliniques & qualité de l'air
 *
 * Sources :
 * - Open-Meteo Air Quality API (gratuit, sans clé) → pollen, AQI, particules fines
 * - Geocoding Google → convertir une ville en coordonnées
 *
 * Types de pollen couverts :
 * - Graminées (grass_pollen) — principal allergène printanier
 * - Bouleau (birch_pollen) — forte allergie en Europe du Nord
 * - Aulne (alder_pollen) — février-mars
 * - Ambroisie (ragweed_pollen) — fin été / automne
 * - Olivier (olive_pollen) — Méditerranée
 */

import { geocodeAddress } from '../maps';

export interface PollenData {
  type: 'grass' | 'birch' | 'alder' | 'ragweed' | 'olive';
  labelFr: string;
  value: number | null;         // grains/m³
  level: 'faible' | 'modéré' | 'élevé' | 'très élevé' | 'inconnu';
  levelEmoji: string;
}

export interface AirQualityData {
  location: string;
  aqi: number | null;           // European AQI 0-500
  aqiLabel: string;
  aqiEmoji: string;
  pm25: number | null;          // µg/m³
  pm10: number | null;          // µg/m³
  pollen: PollenData[];
  dominantAllergen: string | null;
  advice: string;
  fetchedAt: Date;
}

// ─── Open-Meteo Air Quality API ───────────────────────────────────────────────

export async function getAirQuality(locationName: string): Promise<AirQualityData | null> {
  try {
    // 1. Géocoder la ville
    const geo = await geocodeAddress(locationName);
    if (!geo) {
      console.warn(`[POLLEN] Impossible de géocoder: ${locationName}`);
      return null;
    }

    const { lat, lng } = geo;

    // 2. Open-Meteo Air Quality API (gratuit, sans clé)
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      hourly: [
        'grass_pollen',
        'birch_pollen',
        'alder_pollen',
        'ragweed_pollen',
        'olive_pollen',
        'european_aqi',
        'pm10',
        'pm2_5',
      ].join(','),
      forecast_days: '1',
      timezone: 'auto',
    });

    const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);

    if (!res.ok) {
      console.error('[POLLEN] API error:', res.status);
      return null;
    }

    const data = await res.json();

    // Prendre l'index de l'heure actuelle
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
    ].filter(p => p.value !== null || p.level !== 'inconnu');

    // Allergène dominant (niveau le plus élevé)
    const dominant = pollenItems
      .filter(p => p.value !== null && p.value > 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0))[0];

    const { label: aqiLabel, emoji: aqiEmoji } = assessAQI(aqiVal);

    const advice = buildAdvice(pollenItems, aqiVal);

    console.log(`[POLLEN] ${locationName}: AQI ${aqiVal}, dominant: ${dominant?.labelFr || 'aucun'}`);

    return {
      location: geo.formatted,
      aqi: aqiVal !== null ? Math.round(aqiVal) : null,
      aqiLabel,
      aqiEmoji,
      pm25: pm25Val !== null ? Math.round(pm25Val * 10) / 10 : null,
      pm10: pm10Val !== null ? Math.round(pm10Val * 10) / 10 : null,
      pollen: pollenItems,
      dominantAllergen: dominant?.labelFr || null,
      advice,
      fetchedAt: new Date(),
    };
  } catch (error) {
    console.error('[POLLEN] Erreur:', error);
    return null;
  }
}

// ─── Rapport formaté pour Claude ─────────────────────────────────────────────

export function formatPollenReport(data: AirQualityData): string {
  const lines: string[] = [`## Qualité de l'air & Pollen — ${data.location}`];

  // AQI
  lines.push(`**Qualité de l'air :** ${data.aqiEmoji} ${data.aqiLabel}${data.aqi !== null ? ` (AQI ${data.aqi})` : ''}`);

  // Particules fines
  if (data.pm25 !== null || data.pm10 !== null) {
    const parts: string[] = [];
    if (data.pm25 !== null) parts.push(`PM2.5: ${data.pm25} µg/m³`);
    if (data.pm10 !== null) parts.push(`PM10: ${data.pm10} µg/m³`);
    lines.push(`🏭 Particules fines : ${parts.join(' · ')}`);
  }

  // Pollen actifs
  const activePollen = data.pollen.filter(p => p.level !== 'inconnu' && p.level !== 'faible');
  if (activePollen.length > 0) {
    lines.push(`\n**Pollen actifs :**`);
    activePollen.forEach(p => {
      lines.push(`${p.levelEmoji} ${p.labelFr} : ${p.level}${p.value !== null ? ` (${Math.round(p.value)} grains/m³)` : ''}`);
    });
  } else {
    lines.push(`🌿 Pollen : niveaux faibles`);
  }

  if (data.dominantAllergen) {
    lines.push(`\n⚠️ Allergène dominant : **${data.dominantAllergen}**`);
  }

  if (data.advice) {
    lines.push(`\n💡 ${data.advice}`);
  }

  return lines.join('\n');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPollenData(type: PollenData['type'], labelFr: string, value: number | null): PollenData {
  const level = assessPollenLevel(value);
  return {
    type,
    labelFr,
    value,
    level,
    levelEmoji: getPollenEmoji(level),
  };
}

function assessPollenLevel(value: number | null): PollenData['level'] {
  if (value === null) return 'inconnu';
  if (value < 10) return 'faible';
  if (value < 30) return 'modéré';
  if (value < 80) return 'élevé';
  return 'très élevé';
}

function getPollenEmoji(level: PollenData['level']): string {
  const map: Record<PollenData['level'], string> = {
    faible: '🟢',
    modéré: '🟡',
    élevé: '🟠',
    'très élevé': '🔴',
    inconnu: '⬜',
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
    return `Journée difficile pour les allergiques : ${highPollen.map(p => p.labelFr.toLowerCase()).join(' et ')} à risque + air pollué. Préférez les activités intérieures, fenêtres fermées.`;
  }
  if (highPollen.length > 0) {
    return `${highPollen.map(p => p.labelFr).join(', ')} : niveaux élevés. Les allergiques devraient éviter les activités extérieures prolongées.`;
  }
  if (aqi !== null && aqi > 60) {
    return `Qualité de l'air dégradée. Les personnes sensibles devraient limiter les efforts en extérieur.`;
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
