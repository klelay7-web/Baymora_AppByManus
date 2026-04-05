/**
 * MARINE SERVICE — Conditions balnéaires & qualité de l'eau
 *
 * Sources :
 * - Open-Meteo Marine API (gratuit) → météo marine, vagues, température eau
 * - EU EEA Bathing Water API → qualité officielle eaux de baignade Europe
 * - Geocoding Google → convertir "plage de Pampelonne" en coordonnées
 */

import { geocodeAddress } from './maps';

export interface MarineConditions {
  location: string;
  waterTempC: number | null;
  waveHeightM: number | null;
  swellHeightM: number | null;
  windSpeedKmh: number | null;
  uvIndex: number | null;
  conditions: 'excellentes' | 'bonnes' | 'moyennes' | 'agitées' | 'dangereuses';
  conditionsEmoji: string;
  forecast: DayForecast[];
  fetchedAt: Date;
}

export interface DayForecast {
  date: string;         // "2025-04-20"
  waveHeightMaxM: number;
  waterTempC: number | null;
  label: string;        // "Dimanche 20 avril"
}

export interface BathingWaterQuality {
  stationName: string;
  status: 'excellent' | 'bon' | 'suffisant' | 'insuffisant' | 'inconnu';
  statusLabel: string;
  statusEmoji: string;
  lastSample?: string;
  country?: string;
  blueFlag?: boolean;
}

// ─── Open-Meteo Marine API ────────────────────────────────────────────────────

export async function getMarineConditions(
  locationName: string
): Promise<MarineConditions | null> {
  try {
    // 1. Géocoder la plage
    const geo = await geocodeAddress(`plage ${locationName}`);
    if (!geo) {
      console.warn(`[MARINE] Impossible de géocoder: ${locationName}`);
      return null;
    }

    const { lat, lng } = geo;

    // 2. Open-Meteo Marine API (gratuit, sans clé)
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      hourly: 'wave_height,swell_wave_height,wind_wave_height,sea_surface_temperature',
      daily: 'wave_height_max,swell_wave_height_max',
      forecast_days: '7',
      timezone: 'auto',
      wind_speed_unit: 'kmh',
    });

    // Open-Meteo aussi pour UV et vent côtier
    const weatherParams = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      hourly: 'uv_index,wind_speed_10m',
      forecast_days: '1',
      timezone: 'auto',
    });

    const [marineRes] = await Promise.all([
      fetch(`https://marine-api.open-meteo.com/v1/marine?${params}`),
    ]);

    if (!marineRes.ok) {
      console.error('[MARINE] API error:', marineRes.status);
      return null;
    }

    const marine = await marineRes.json();

    // Prendre l'heure actuelle (index 12 = midi par défaut)
    const nowIdx = getCurrentHourIndex(marine.hourly?.time || []);
    const waveHeight = marine.hourly?.wave_height?.[nowIdx] ?? null;
    const swellHeight = marine.hourly?.swell_wave_height?.[nowIdx] ?? null;
    const waterTemp = marine.hourly?.sea_surface_temperature?.[nowIdx] ?? null;

    // Calcul des conditions
    const conditions = assessConditions(waveHeight);

    // Prévisions 7 jours
    const forecast: DayForecast[] = (marine.daily?.time || []).slice(0, 7).map((date: string, i: number) => ({
      date,
      waveHeightMaxM: marine.daily?.wave_height_max?.[i] ?? 0,
      waterTempC: waterTemp, // approximation (varie peu sur 7j)
      label: new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
    }));

    console.log(`[MARINE] ${locationName}: vagues ${waveHeight}m, eau ${waterTemp}°C`);

    return {
      location: geo.formatted,
      waterTempC: waterTemp ? Math.round(waterTemp * 10) / 10 : null,
      waveHeightM: waveHeight ? Math.round(waveHeight * 10) / 10 : null,
      swellHeightM: swellHeight ? Math.round(swellHeight * 10) / 10 : null,
      windSpeedKmh: null, // enrichi si besoin
      uvIndex: null,
      conditions,
      conditionsEmoji: getConditionsEmoji(conditions),
      forecast,
      fetchedAt: new Date(),
    };
  } catch (error) {
    console.error('[MARINE] Erreur:', error);
    return null;
  }
}

// ─── Qualité eau de baignade UE (EEA) ────────────────────────────────────────

export async function getBathingWaterQuality(
  countryCode: string, // 'FR', 'ES', 'IT', 'GR', etc.
  locationName: string
): Promise<BathingWaterQuality | null> {
  try {
    // API EEA Bathing Water (données officielles EU)
    const url = `https://bathing-water.eea.europa.eu/api/v1/station/?country=${countryCode}&name=${encodeURIComponent(locationName)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (!data.results?.length) return null;

    const station = data.results[0];
    const statusMap: Record<string, BathingWaterQuality['status']> = {
      'Excellent': 'excellent',
      'Good': 'bon',
      'Sufficient': 'suffisant',
      'Poor': 'insuffisant',
    };

    const status = statusMap[station.water_quality] || 'inconnu';

    return {
      stationName: station.name || locationName,
      status,
      statusLabel: getQualityLabel(status),
      statusEmoji: getQualityEmoji(status),
      lastSample: station.date_of_last_sample,
      country: countryCode,
      blueFlag: station.blue_flag === true,
    };
  } catch (error) {
    console.error('[MARINE] Erreur qualité eau:', error);
    return null;
  }
}

// ─── Rapport complet pour Claude ─────────────────────────────────────────────

export async function getBeachReport(locationName: string, countryCode?: string): Promise<string> {
  const [marine, quality] = await Promise.all([
    getMarineConditions(locationName),
    countryCode ? getBathingWaterQuality(countryCode, locationName) : Promise.resolve(null),
  ]);

  const lines: string[] = [`## Conditions balnéaires — ${locationName}`];

  if (marine) {
    lines.push(`**Conditions actuelles :** ${marine.conditionsEmoji} ${marine.conditions}`);
    if (marine.waterTempC !== null) lines.push(`🌡️ Température eau : **${marine.waterTempC}°C**`);
    if (marine.waveHeightM !== null) lines.push(`🌊 Vagues : **${marine.waveHeightM}m**${marine.swellHeightM !== null ? ` (swell ${marine.swellHeightM}m)` : ''}`);

    if (marine.forecast.length > 0) {
      lines.push(`\n**Prévisions :**`);
      marine.forecast.slice(0, 4).forEach(d => {
        const emoji = d.waveHeightMaxM < 0.5 ? '😎' : d.waveHeightMaxM < 1.5 ? '🏄' : d.waveHeightMaxM < 2.5 ? '⚠️' : '🚫';
        lines.push(`${emoji} ${d.label} : vagues max ${d.waveHeightMaxM}m`);
      });
    }
  }

  if (quality) {
    lines.push(`\n**Qualité eau de baignade (officiel UE) :** ${quality.statusEmoji} ${quality.statusLabel}`);
    if (quality.blueFlag) lines.push(`🏖️ Plage Pavillon Bleu certifiée`);
    if (quality.lastSample) lines.push(`Dernier contrôle : ${quality.lastSample}`);
  }

  if (!marine && !quality) {
    return `Données marines non disponibles pour ${locationName}. Je recommande de vérifier sur [Surf-forecast.com](https://www.surf-forecast.com) ou l'application Windguru.`;
  }

  return lines.join('\n');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCurrentHourIndex(times: string[]): number {
  const now = new Date();
  const currentHour = now.getHours();
  const today = now.toISOString().split('T')[0];
  const idx = times.findIndex((t: string) => t.startsWith(today) && parseInt(t.split('T')[1]) >= currentHour);
  return idx >= 0 ? idx : 0;
}

function assessConditions(waveHeight: number | null): MarineConditions['conditions'] {
  if (waveHeight === null) return 'bonnes';
  if (waveHeight < 0.3) return 'excellentes';
  if (waveHeight < 0.8) return 'bonnes';
  if (waveHeight < 1.5) return 'moyennes';
  if (waveHeight < 2.5) return 'agitées';
  return 'dangereuses';
}

function getConditionsEmoji(c: MarineConditions['conditions']): string {
  const map = { excellentes: '😎', bonnes: '🏄', moyennes: '🌊', agitées: '⚠️', dangereuses: '🚫' };
  return map[c];
}

function getQualityLabel(s: BathingWaterQuality['status']): string {
  const map = { excellent: 'Excellente', bon: 'Bonne', suffisant: 'Suffisante', insuffisant: 'Insuffisante — baignade déconseillée', inconnu: 'Non évaluée' };
  return map[s];
}

function getQualityEmoji(s: BathingWaterQuality['status']): string {
  const map = { excellent: '💚', bon: '🟢', suffisant: '🟡', insuffisant: '🔴', inconnu: '⬜' };
  return map[s];
}
