export interface WeatherData {
  temperature: number;
  windSpeed: number;
  weatherCode: number;
  isRaining: boolean;
  precipitationProb: number;
  conditionText: string;
  safetyGuidance: string;
  isExtreme: boolean;
}

// Weather codes based on WMO standards (Open-Meteo)
const getWeatherCondition = (code: number): { text: string; isRaining: boolean } => {
  if (code === 0) return { text: 'Clear sky', isRaining: false };
  if (code === 1 || code === 2 || code === 3) return { text: 'Partly cloudy', isRaining: false };
  if (code === 45 || code === 48) return { text: 'Fog', isRaining: false };
  if (code >= 51 && code <= 67) return { text: 'Rain / Drizzle', isRaining: true };
  if (code >= 71 && code <= 77) return { text: 'Snow', isRaining: false };
  if (code >= 80 && code <= 82) return { text: 'Rain showers', isRaining: true };
  if (code >= 95 && code <= 99) return { text: 'Thunderstorm', isRaining: true };
  return { text: 'Unknown', isRaining: false };
};

const getSafetyGuidance = (temp: number, isRaining: boolean, windSpeed: number): { text: string; extreme: boolean } => {
  if (isRaining && windSpeed > 40) return { text: 'Heavy rain and strong winds. Avoid driving if possible. Seek a verified rest facility.', extreme: true };
  if (isRaining) return { text: 'Rainy conditions. Drive carefully. Consider taking a break under shade or a rest stop.', extreme: false };
  if (temp > 38) return { text: 'Extreme heat warning! High risk of heatstroke. Hydrate frequently and rest in shaded areas every 1-2 hours.', extreme: true };
  if (temp > 33) return { text: 'High temperature. Keep yourself hydrated and take regular breaks.', extreme: false };
  if (temp < 15) return { text: 'Cold conditions. Wear warm clothing.', extreme: false };
  if (windSpeed > 30) return { text: 'Strong winds. Drive safely and be cautious of crosswinds.', extreme: false };
  return { text: 'Good weather conditions for driving.', extreme: false };
};

export const fetchWeather = async (lat: number, lng: number): Promise<WeatherData> => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather API failed');
    const data = await res.json();
    
    const temp = data.current.temperature_2m;
    const windSpeed = data.current.wind_speed_10m;
    const weatherCode = data.current.weather_code;
    const precipitationProb = data.hourly?.precipitation_probability?.[0] || 0;
    
    const { text: conditionText, isRaining } = getWeatherCondition(weatherCode);
    const { text: safetyGuidance, extreme } = getSafetyGuidance(temp, isRaining || precipitationProb > 50, windSpeed);

    return {
      temperature: temp,
      windSpeed: windSpeed,
      weatherCode,
      isRaining: isRaining || precipitationProb > 50,
      precipitationProb,
      conditionText,
      safetyGuidance,
      isExtreme: extreme
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};
