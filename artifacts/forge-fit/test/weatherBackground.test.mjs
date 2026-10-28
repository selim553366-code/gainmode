import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyWeather, WEATHER_KINDS, WEATHER_SCENES } from '../lib/weatherBackground.ts';

const obs = (patch) => ({
  weatherCode: 0, isDay: true, temperature: 14, apparentTemperature: 14, humidity: 50,
  cloudCover: 0, windSpeed: 10, windGusts: 15, ...patch,
});

test('every category has a scene', () => {
  assert.equal(WEATHER_KINDS.length, 32);
  for (const kind of WEATHER_KINDS) assert.ok(WEATHER_SCENES[kind], kind);
});

test('sky cover maps to the five sky categories', () => {
  assert.equal(classifyWeather(obs({})), 'clear');
  assert.equal(classifyWeather(obs({ weatherCode: 1, cloudCover: 25 })), 'fewClouds');
  assert.equal(classifyWeather(obs({ weatherCode: 2, cloudCover: 50 })), 'partlyCloudy');
  assert.equal(classifyWeather(obs({ weatherCode: 3, cloudCover: 80 })), 'mostlyCloudy');
  assert.equal(classifyWeather(obs({ weatherCode: 3, cloudCover: 100 })), 'overcast');
});

test('precipitation codes map to rain, snow and ice categories', () => {
  assert.equal(classifyWeather(obs({ weatherCode: 53, cloudCover: 100 })), 'drizzle');
  assert.equal(classifyWeather(obs({ weatherCode: 61, cloudCover: 100 })), 'lightRain');
  assert.equal(classifyWeather(obs({ weatherCode: 63, cloudCover: 100 })), 'rain');
  assert.equal(classifyWeather(obs({ weatherCode: 82, cloudCover: 100 })), 'heavyShower');
  assert.equal(classifyWeather(obs({ weatherCode: 63, temperature: 0.5 })), 'sleet');
  assert.equal(classifyWeather(obs({ weatherCode: 66 })), 'freezingRain');
  assert.equal(classifyWeather(obs({ weatherCode: 75, windSpeed: 50, temperature: -4 })), 'blizzard');
  assert.equal(classifyWeather(obs({ weatherCode: 71, temperature: -4 })), 'lightSnow');
  assert.equal(classifyWeather(obs({ weatherCode: 77, temperature: -4 })), 'graupel');
  assert.equal(classifyWeather(obs({ weatherCode: 99 })), 'hail');
  assert.equal(classifyWeather(obs({ weatherCode: 95 })), 'thunderstorm');
});

test('wind, visibility and air quality refine dry weather', () => {
  assert.equal(classifyWeather(obs({ windGusts: 70 })), 'storm');
  assert.equal(classifyWeather(obs({ windGusts: 125 })), 'hurricane');
  assert.equal(classifyWeather(obs({ dust: 400, windGusts: 40 })), 'sandstorm');
  assert.equal(classifyWeather(obs({ weatherCode: 45, visibility: 500 })), 'fog');
  assert.equal(classifyWeather(obs({ weatherCode: 45, visibility: 3000 })), 'mist');
  assert.equal(classifyWeather(obs({ weatherCode: 48 })), 'frost');
  assert.equal(classifyWeather(obs({ pm25: 200 })), 'smoke');
  assert.equal(classifyWeather(obs({ pm25: 80, visibility: 3000 })), 'smog');
});

test('temperature decides the feel of a dry sky', () => {
  assert.equal(classifyWeather(obs({ temperature: 36, apparentTemperature: 38, humidity: 20 })), 'dryHeat');
  assert.equal(classifyWeather(obs({ temperature: 31, apparentTemperature: 36, humidity: 75 })), 'hot');
  assert.equal(classifyWeather(obs({ temperature: -8 })), 'cold');
  assert.equal(classifyWeather(obs({ temperature: -1, humidity: 92 })), 'frost');
  assert.equal(classifyWeather(obs({ temperature: 6 })), 'cool');
  assert.equal(classifyWeather(obs({ temperature: 21, windGusts: 8 })), 'mild');
});
