import React, { useState, useEffect } from "react";
import "./weather.css";

export default function WeatherWidget({ language }) {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState("Kyiv");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiKey = process.env.REACT_APP_WEATHER_API_KEY;

  useEffect(() => {
    fetchWeather();
    // eslint-disable-next-line
  }, []);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=${language}`
      );
      const data = await res.json();
      if (data.cod === 200) setWeather(data);
      else setError(language === "ua" ? "Місто не знайдено" : "City not found");
    } catch (err) {
      setError(language === "ua" ? "Помилка з'єднання" : "Connection error");
    } finally {
      setLoading(false);
    }
  };

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
            🌡 {Math.round(weather.main.temp)}°C | 💧 {weather.main.humidity}% | 🌬{" "}
            {Math.round(weather.wind.speed)} m/s
          </p>
          <p>{weather.weather[0].description}</p>
        </div>
      )}
    </div>
  );
}
