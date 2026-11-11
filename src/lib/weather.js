import {
  Sun, Moon, CloudSun, CloudMoon, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning,
} from 'lucide-react';

/** WMO weather code -> label + icon. */
export function describe(code, isDay = true) {
  if (code === 0) return { label: 'Clear', Icon: isDay ? Sun : Moon };
  if (code === 1) return { label: 'Mostly clear', Icon: isDay ? Sun : Moon };
  if (code === 2) return { label: 'Partly cloudy', Icon: isDay ? CloudSun : CloudMoon };
  if (code === 3) return { label: 'Overcast', Icon: Cloud };
  if (code === 45 || code === 48) return { label: 'Fog', Icon: CloudFog };
  if (code >= 51 && code <= 57) return { label: 'Drizzle', Icon: CloudDrizzle };
  if (code >= 61 && code <= 67) return { label: 'Rain', Icon: CloudRain };
  if (code >= 71 && code <= 77) return { label: 'Snow', Icon: CloudSnow };
  if (code >= 80 && code <= 82) return { label: 'Showers', Icon: CloudRain };
  if (code === 85 || code === 86) return { label: 'Snow showers', Icon: CloudSnow };
  if (code >= 95) return { label: 'Thunderstorm', Icon: CloudLightning };
  return { label: 'Cloudy', Icon: Cloud };
}

export async function fetchWeather({ lat, lon }) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,is_day' +
    '&hourly=temperature_2m,weather_code,precipitation_probability,is_day' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max' +
    '&timezone=auto&forecast_days=7&forecast_hours=24';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather service answered ${res.status}`);
  const j = await res.json();
  return {
    at: Date.now(),
    current: {
      temp: j.current.temperature_2m,
      feels: j.current.apparent_temperature,
      code: j.current.weather_code,
      wind: j.current.wind_speed_10m,
      humidity: j.current.relative_humidity_2m,
      isDay: j.current.is_day === 1,
    },
    hourly: j.hourly.time.map((t, i) => ({
      time: t,
      temp: j.hourly.temperature_2m[i],
      code: j.hourly.weather_code[i],
      rain: j.hourly.precipitation_probability?.[i] ?? 0,
      isDay: j.hourly.is_day?.[i] !== 0,
    })),
    daily: j.daily.time.map((t, i) => ({
      date: t,
      code: j.daily.weather_code[i],
      max: j.daily.temperature_2m_max[i],
      min: j.daily.temperature_2m_min[i],
      sunrise: j.daily.sunrise[i],
      sunset: j.daily.sunset[i],
      rain: j.daily.precipitation_probability_max?.[i] ?? 0,
    })),
  };
}

export async function searchCity(q) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en`,
  );
  if (!res.ok) throw new Error(`City search answered ${res.status}`);
  const j = await res.json();
  return (j.results ?? []).map((r) => ({
    name: r.name,
    region: [r.admin1, r.country].filter(Boolean).join(', '),
    lat: r.latitude,
    lon: r.longitude,
  }));
}
