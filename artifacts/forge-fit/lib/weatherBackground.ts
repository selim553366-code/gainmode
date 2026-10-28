export type WeatherKind =
  | 'clear' | 'fewClouds' | 'partlyCloudy' | 'mostlyCloudy' | 'overcast'
  | 'drizzle' | 'lightRain' | 'rain' | 'shower' | 'heavyShower'
  | 'snow' | 'lightSnow' | 'blizzard' | 'sleet' | 'freezingRain' | 'hail' | 'graupel'
  | 'thunderstorm' | 'storm' | 'sandstorm' | 'hurricane' | 'tornado'
  | 'fog' | 'mist' | 'smoke' | 'smog'
  | 'hot' | 'dryHeat' | 'mild' | 'cool' | 'cold' | 'frost';

export const WEATHER_KINDS: readonly WeatherKind[] = [
  'clear', 'fewClouds', 'partlyCloudy', 'mostlyCloudy', 'overcast',
  'drizzle', 'lightRain', 'rain', 'shower', 'heavyShower',
  'snow', 'lightSnow', 'blizzard', 'sleet', 'freezingRain', 'hail', 'graupel',
  'thunderstorm', 'storm', 'sandstorm', 'hurricane', 'tornado',
  'fog', 'mist', 'smoke', 'smog',
  'hot', 'dryHeat', 'mild', 'cool', 'cold', 'frost',
];

export type WeatherObservation = {
  weatherCode: number;
  isDay: boolean;
  temperature: number; // °C
  apparentTemperature: number; // °C
  humidity: number; // %
  cloudCover: number; // %
  windSpeed: number; // km/h
  windGusts: number; // km/h
  visibility?: number; // metres
  pm25?: number; // µg/m³
  dust?: number; // µg/m³
};

export type PrecipitationStyle = 'none' | 'drizzle' | 'rain' | 'shower' | 'heavy' | 'snow' | 'blizzard' | 'sleet' | 'freezing' | 'hail' | 'graupel';
export type PaletteGroup = 'sunny' | 'cloudy' | 'rainy' | 'storm' | 'snow' | 'fog' | 'smog' | 'sand' | 'hot' | 'dry' | 'mild' | 'cool' | 'cold' | 'frost' | 'tornado' | 'hurricane';

export type WeatherScene = {
  group: PaletteGroup;
  sun: boolean;
  clouds: number;
  cloudDarkness: number; // 0 white – 1 charcoal
  precipitation: PrecipitationStyle;
  lightning: boolean;
  wind: number; // 0 calm – 1 violent
  fog: number; // 0 – 1
  dust: boolean;
  funnel: boolean;
  spiral: boolean;
  heat: boolean;
  frost: boolean;
  petals: boolean;
};

const base: WeatherScene = {
  group: 'sunny', sun: false, clouds: 0, cloudDarkness: 0, precipitation: 'none', lightning: false,
  wind: 0.15, fog: 0, dust: false, funnel: false, spiral: false, heat: false, frost: false, petals: false,
};

const scene = (patch: Partial<WeatherScene>): WeatherScene => ({ ...base, ...patch });

export const WEATHER_SCENES: Record<WeatherKind, WeatherScene> = {
  clear: scene({ sun: true }),
  fewClouds: scene({ sun: true, clouds: 2 }),
  partlyCloudy: scene({ group: 'cloudy', sun: true, clouds: 4, cloudDarkness: 0.1 }),
  mostlyCloudy: scene({ group: 'cloudy', sun: true, clouds: 6, cloudDarkness: 0.3 }),
  overcast: scene({ group: 'cloudy', clouds: 7, cloudDarkness: 0.6 }),
  drizzle: scene({ group: 'rainy', clouds: 5, cloudDarkness: 0.45, precipitation: 'drizzle', fog: 0.25 }),
  lightRain: scene({ group: 'rainy', clouds: 5, cloudDarkness: 0.5, precipitation: 'rain' }),
  rain: scene({ group: 'rainy', clouds: 6, cloudDarkness: 0.62, precipitation: 'rain', wind: 0.3 }),
  shower: scene({ group: 'rainy', clouds: 6, cloudDarkness: 0.72, precipitation: 'shower', wind: 0.4 }),
  heavyShower: scene({ group: 'storm', clouds: 7, cloudDarkness: 0.82, precipitation: 'heavy', wind: 0.55 }),
  snow: scene({ group: 'snow', clouds: 5, cloudDarkness: 0.25, precipitation: 'snow' }),
  lightSnow: scene({ group: 'snow', clouds: 3, cloudDarkness: 0.1, precipitation: 'snow' }),
  blizzard: scene({ group: 'snow', clouds: 6, cloudDarkness: 0.35, precipitation: 'blizzard', wind: 0.95, fog: 0.45 }),
  sleet: scene({ group: 'rainy', clouds: 6, cloudDarkness: 0.55, precipitation: 'sleet', wind: 0.3 }),
  freezingRain: scene({ group: 'frost', clouds: 5, cloudDarkness: 0.5, precipitation: 'freezing', frost: true }),
  hail: scene({ group: 'storm', clouds: 7, cloudDarkness: 0.78, precipitation: 'hail', wind: 0.5 }),
  graupel: scene({ group: 'snow', clouds: 6, cloudDarkness: 0.4, precipitation: 'graupel', wind: 0.35 }),
  thunderstorm: scene({ group: 'storm', clouds: 7, cloudDarkness: 0.9, precipitation: 'heavy', lightning: true, wind: 0.6 }),
  storm: scene({ group: 'storm', clouds: 7, cloudDarkness: 0.78, wind: 1 }),
  sandstorm: scene({ group: 'sand', dust: true, wind: 1, fog: 0.5 }),
  hurricane: scene({ group: 'hurricane', clouds: 7, cloudDarkness: 0.95, precipitation: 'heavy', lightning: true, wind: 1, spiral: true }),
  tornado: scene({ group: 'tornado', clouds: 7, cloudDarkness: 0.9, precipitation: 'rain', wind: 0.9, funnel: true }),
  fog: scene({ group: 'fog', fog: 1, wind: 0.05 }),
  mist: scene({ group: 'fog', fog: 0.55, wind: 0.05 }),
  smoke: scene({ group: 'smog', fog: 0.6, clouds: 2, cloudDarkness: 0.85, wind: 0.2 }),
  smog: scene({ group: 'smog', fog: 0.85, wind: 0.05 }),
  hot: scene({ group: 'hot', sun: true, heat: true }),
  dryHeat: scene({ group: 'dry', sun: true, heat: true, dust: false, wind: 0.2 }),
  mild: scene({ group: 'mild', sun: true, clouds: 1, petals: true, wind: 0.1 }),
  cool: scene({ group: 'cool', clouds: 3, cloudDarkness: 0.2, wind: 0.35 }),
  cold: scene({ group: 'cold', clouds: 0, wind: 0.7 }),
  frost: scene({ group: 'frost', frost: true, wind: 0.05 }),
};

const FREEZING_LOW = -1;
const FREEZING_HIGH = 1.5;

/**
 * Turn real observations (WMO weather code plus measurements) into one of the
 * categories listed in the product brief. Tornadoes cannot be detected from a
 * forecast model, so that category is reachable only through the preview.
 */
export function classifyWeather(obs: WeatherObservation): WeatherKind {
  const { weatherCode: code, temperature: temp, windGusts, windSpeed, humidity } = obs;
  const visibility = obs.visibility ?? Infinity;
  const nearFreezing = temp >= FREEZING_LOW && temp <= FREEZING_HIGH;
  const gust = Math.max(windGusts, windSpeed);

  if (gust >= 118) return 'hurricane';
  if (code === 95) return 'thunderstorm';
  if (code === 96 || code === 99) return 'hail';
  if (code === 56 || code === 57 || code === 66 || code === 67) return 'freezingRain';
  if (code === 77) return 'graupel';
  if (code === 75 || code === 86) return windSpeed >= 40 ? 'blizzard' : 'snow';
  if (code === 73 || code === 85) return 'snow';
  if (code === 71) return 'lightSnow';
  if (code >= 51 && code <= 65 && nearFreezing) return 'sleet';
  if (code === 51 || code === 53 || code === 55) return 'drizzle';
  if (code === 61) return 'lightRain';
  if (code === 63) return 'rain';
  if (code === 65 || code === 81) return 'shower';
  if (code === 80) return 'rain';
  if (code === 82) return 'heavyShower';
  if (code === 48) return 'frost';
  if (code === 45) return visibility < 1000 ? 'fog' : 'mist';

  if ((obs.dust ?? 0) >= 200 && gust >= 30) return 'sandstorm';
  if (gust >= 62) return 'storm';
  if ((obs.pm25 ?? 0) >= 150) return 'smoke';
  if ((obs.pm25 ?? 0) >= 55 && visibility < 5000) return 'smog';
  if (visibility < 1000) return 'fog';
  if (visibility < 5000 && humidity >= 85) return 'mist';

  // Dry-sky states: temperature and humidity decide the feeling of the day.
  if (obs.cloudCover < 60) {
    if (temp >= 35 && humidity < 30) return 'dryHeat';
    if (obs.apparentTemperature >= 32 && humidity >= 60) return 'hot';
    if (temp <= 0 && humidity >= 85) return 'frost';
    if (temp <= -3) return 'cold';
    if (temp > 0 && temp < 10 && gust < 40) return 'cool';
    if (temp >= 18 && temp <= 24 && gust < 15) return 'mild';
  }

  if (code === 0 || obs.cloudCover < 15) return 'clear';
  if (obs.cloudCover < 35) return 'fewClouds';
  if (obs.cloudCover < 65) return 'partlyCloudy';
  if (obs.cloudCover < 90) return 'mostlyCloudy';
  return 'overcast';
}
