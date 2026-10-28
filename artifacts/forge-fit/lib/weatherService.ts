import type { WeatherObservation } from '@/lib/weatherBackground';

type ForecastResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    is_day?: number;
    weather_code?: number;
    cloud_cover?: number;
    wind_speed_10m?: number;
    wind_gusts_10m?: number;
    visibility?: number;
  };
};

type AirQualityResponse = { current?: { pm2_5?: number; dust?: number } };

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

/** Read the current conditions at a coordinate from Open-Meteo (no API key needed). */
export async function fetchCurrentWeather(latitude: number, longitude: number): Promise<WeatherObservation> {
  const position = `latitude=${latitude.toFixed(3)}&longitude=${longitude.toFixed(3)}`;
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?${position}&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,cloud_cover,wind_speed_10m,wind_gusts_10m,visibility&wind_speed_unit=kmh&timezone=auto`;
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?${position}&current=pm2_5,dust`;

  const [forecast, air] = await Promise.all([
    getJson<ForecastResponse>(forecastUrl),
    // Air quality only refines smoke, smog and dust scenes, so its failure is not fatal.
    getJson<AirQualityResponse>(airUrl).catch(() => null),
  ]);
  const current = forecast.current;
  if (!current || typeof current.weather_code !== 'number' || typeof current.temperature_2m !== 'number') {
    throw new Error('Weather response did not include current conditions');
  }
  return {
    weatherCode: current.weather_code,
    isDay: current.is_day !== 0,
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature ?? current.temperature_2m,
    humidity: current.relative_humidity_2m ?? 50,
    cloudCover: current.cloud_cover ?? 0,
    windSpeed: current.wind_speed_10m ?? 0,
    windGusts: current.wind_gusts_10m ?? current.wind_speed_10m ?? 0,
    visibility: current.visibility,
    pm25: air?.current?.pm2_5,
    dust: air?.current?.dust,
  };
}
