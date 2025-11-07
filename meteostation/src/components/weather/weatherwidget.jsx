import React, { useState, useEffect } from "react";
import "./weather.css";

export default function WeatherWidget({ language }) {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState("Київ");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiKey = window.env?.apiKey;

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError("");

      const encodedCity = encodeURIComponent(city.trim());
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${apiKey}&units=metric&lang=${language}`
      );
      const data = await res.json();

      if (data.cod === 200) {
        // якщо українська то підміняє назву міста з data.sys.country
        const displayName =
          language === "ua" && city ? city.charAt(0).toUpperCase() + city.slice(1) : data.name;
        setWeather({ ...data, name: displayName });
      } else {
        setError(language === "ua" ? "Місто не знайдено" : "City not found");
        setWeather(null);
      }
    } catch (err) {
      setError(language === "ua" ? "Помилка з'єднання" : "Connection error");
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  return (
    <div className="weather-widget">
      <h2>{language === "ua" ? "Погода" : "Weather"}</h2>

      <div className="weather-search">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={language === "ua" ? "Введіть місто..." : "Enter city..."}
        />
        <button onClick={fetchWeather}>
          {language === "ua" ? "Оновити" : "Update"}
        </button>
      </div>

      {loading && <p>{language === "ua" ? "Завантаження..." : "Loading..."}</p>}
      {error && <p className="error">{error}</p>}

      {weather && (
        <div className="weather-info">
          <h3>{weather.name}</h3>
          <p>
            🌡 {language === "ua" ? "Температура" : "Temperature"}:{" "}
            {Math.round(weather.main.temp)}°C
          </p>
          <p>
            💧 {language === "ua" ? "Вологість" : "Humidity"}: {weather.main.humidity}%
          </p>
          <p>
            🌬 {language === "ua" ? "Вітер" : "Wind"}: {Math.round(weather.wind.speed)}{" "}
            {language === "ua" ? "м/с" : "m/s"}
          </p>
          <p>☁️ {weather.weather[0].description}</p>
        </div>
      )}
    </div>
  );
}
