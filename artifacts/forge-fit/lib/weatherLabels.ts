import type { Language } from '@/lib/i18n';
import type { WeatherKind } from '@/lib/weatherBackground';

// Order per entry: tr, en, de, fr, es. Titles use " · " instead of parentheses.
const LABELS: Record<WeatherKind, readonly [string, string, string, string, string]> = {
  clear: ['Açık · Güneşli', 'Clear · Sunny', 'Klar · Sonnig', 'Dégagé · Ensoleillé', 'Despejado · Soleado'],
  fewClouds: ['Az bulutlu', 'Few clouds', 'Leicht bewölkt', 'Peu nuageux', 'Poco nuboso'],
  partlyCloudy: ['Parçalı bulutlu', 'Partly cloudy', 'Teilweise bewölkt', 'Partiellement nuageux', 'Parcialmente nublado'],
  mostlyCloudy: ['Çok bulutlu', 'Mostly cloudy', 'Überwiegend bewölkt', 'Très nuageux', 'Muy nublado'],
  overcast: ['Kapalı', 'Overcast', 'Bedeckt', 'Couvert', 'Cubierto'],
  drizzle: ['Çiseleme · Çisenti', 'Drizzle', 'Nieselregen', 'Bruine', 'Llovizna'],
  lightRain: ['Hafif yağmurlu', 'Light rain', 'Leichter Regen', 'Pluie légère', 'Lluvia ligera'],
  rain: ['Yağmurlu', 'Rainy', 'Regnerisch', 'Pluvieux', 'Lluvioso'],
  shower: ['Sağanak yağışlı', 'Rain showers', 'Regenschauer', 'Averses', 'Chubascos'],
  heavyShower: ['Kuvvetli sağanak', 'Heavy downpour', 'Starkregen', 'Fortes averses', 'Aguacero fuerte'],
  snow: ['Kar yağışlı', 'Snowy', 'Schneefall', 'Neigeux', 'Nevado'],
  lightSnow: ['Hafif kar yağışlı', 'Light snow', 'Leichter Schneefall', 'Neige légère', 'Nieve ligera'],
  blizzard: ['Yoğun kar yağışlı · Tipi', 'Heavy snow · Blizzard', 'Starker Schneefall · Schneesturm', 'Neige dense · Blizzard', 'Nevada intensa · Ventisca'],
  sleet: ['Karla karışık yağmurlu · Sleet', 'Sleet', 'Schneeregen', 'Pluie et neige mêlées', 'Aguanieve'],
  freezingRain: ['Dondurucu yağmur', 'Freezing rain', 'Gefrierender Regen', 'Pluie verglaçante', 'Lluvia helada'],
  hail: ['Dolu', 'Hail', 'Hagel', 'Grêle', 'Granizo'],
  graupel: ['Grup · Greupel', 'Graupel', 'Graupel', 'Grésil', 'Granizo blando'],
  thunderstorm: ['Gökgürültülü sağanak yağışlı', 'Thunderstorm', 'Gewitterschauer', 'Averses orageuses', 'Chubascos con tormenta'],
  storm: ['Fırtınalı', 'Stormy', 'Stürmisch', 'Tempétueux', 'Tormentoso'],
  sandstorm: ['Kum · Toz fırtınası', 'Sand · Dust storm', 'Sand · Staubsturm', 'Tempête de sable · Poussière', 'Tormenta de arena · Polvo'],
  hurricane: ['Kasırga · Tayfun · Tropikal siklon', 'Hurricane · Typhoon · Tropical cyclone', 'Hurrikan · Taifun · Tropischer Zyklon', 'Ouragan · Typhon · Cyclone tropical', 'Huracán · Tifón · Ciclón tropical'],
  tornado: ['Hortum', 'Tornado', 'Tornado', 'Tornade', 'Tornado'],
  fog: ['Sisli', 'Foggy', 'Neblig', 'Brumeux', 'Con niebla'],
  mist: ['Puslu', 'Misty', 'Dunstig', 'Brume légère', 'Neblina'],
  smoke: ['Dumanlı', 'Smoky', 'Verraucht', 'Enfumé', 'Con humo'],
  smog: ['Puslu-Kirli · Smog', 'Smog', 'Smog', 'Smog', 'Smog'],
  hot: ['Sıcak · Bunaltıcı', 'Hot · Sultry', 'Heiß · Schwül', 'Chaud · Étouffant', 'Caluroso · Sofocante'],
  dryHeat: ['Kuru sıcak · Çöl sıcağı', 'Dry heat · Desert heat', 'Trockene Hitze · Wüstenhitze', 'Chaleur sèche · Chaleur du désert', 'Calor seco · Calor desértico'],
  mild: ['Ilık · Bahar havası', 'Mild · Spring air', 'Mild · Frühlingsluft', 'Doux · Air printanier', 'Templado · Aire primaveral'],
  cool: ['Serin', 'Cool', 'Kühl', 'Frais', 'Fresco'],
  cold: ['Soğuk · Ayaz', 'Cold · Bitter frost', 'Kalt · Eisig', 'Froid · Glacial', 'Frío · Gélido'],
  frost: ['Don', 'Frost', 'Frost', 'Gel', 'Escarcha'],
};

const LANGUAGE_INDEX: Record<Language, 0 | 1 | 2 | 3 | 4> = { tr: 0, en: 1, de: 2, fr: 3, es: 4 };

export function getWeatherLabel(language: Language, kind: WeatherKind): string {
  return LABELS[kind][LANGUAGE_INDEX[language]];
}
