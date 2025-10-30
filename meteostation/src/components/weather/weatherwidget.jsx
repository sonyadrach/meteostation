import React, { useState, useEffect } from "react";
import { translations } from "../../i18n/translations";
import "./weather.css";

export default function WeatherWidget({ language }) {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState("Kyiv");
  const t = translations[language];

  // Тут поки що фейкові дані, пізніше підключимо API
  useEffect(() => {
    const fetchWeather = async () => {
      // TODO: замінити на API виклик
      setWeather({
        temperature: 18,
        pressure: 1012,
        humidity: 55,
        windSpeed: 5,
      });
    };
    fetchWeather();
  }, [city]);

  if (!weather) return <div className="weather-widget">Loading...</div>;

  return (
    <div className="weather-widget">
      <h3>{t.city}: {city}</h3>
      <p>{t.temperature}: {weather.temperature}°C</p>
      <p>{t.pressure}: {weather.pressure} hPa</p>
      <p>{t.humidity}: {weather.humidity}%</p>
      <p>{t.wind}: {weather.windSpeed} m/s</p>

      <div className="city-input">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={t.city}
        />
      </div>
    </div>
  );
}
