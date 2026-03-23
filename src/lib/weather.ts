export interface WeatherData {
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  precipitation: number;
  description: string;
}

export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,wind_speed_10m&wind_speed_unit=ms`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    return {
      temperature: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      windSpeed: data.current.wind_speed_10m,
      precipitation: data.current.precipitation,
      description: getWeatherDescription(data.current.temperature_2m, data.current.precipitation)
    };
  } catch (error) {
    console.error("Vær-feil:", error);
    return { temperature: 10, feelsLike: 8, windSpeed: 5, precipitation: 0, description: "Ukjent vær" };
  }
}

function getWeatherDescription(temp: number, precip: number) {
  if (precip > 0) return "Regn/nedbør";
  if (temp < 0) return "Kaldt og klart";
  return "Oppholdsvær";
}