import React, { useEffect, useState, useCallback } from "react";
import { translations } from "../i18n/translations";
import "./weather.css";

export default function WeatherWidget({ language, user, onCitySave }) {
  const initialCity = user?.city || ""; 
  
  // Стан для поля вводу всередині віджета
  const [cityInput, setCityInput] = useState(initialCity); 
  const [weather, setWeather] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const t = translations[language]; 
  const apiKey = window.env.apiKey;

  useEffect(() => {
    setCityInput(initialCity);
  }, [initialCity]);

  // ======================================================
  // LOAD WEATHER (викликається, коли user.city змінюється)
  // ======================================================
  const loadWeather = useCallback(async (targetCity) => {
    if (!targetCity) return;
    setIsLoading(true); setMessage(""); setWeather(null);

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${targetCity}&appid=${apiKey}&units=metric&lang=${language}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.cod === 200) {
        setWeather({ // Зберігаємо повний об'єкт даних
          temp: data.main.temp,
          feelsLike: data.main.feels_like,
          humidity: data.main.humidity,
          wind: data.wind.speed,
          description: data.weather[0].description,
          icon: data.weather[0].icon,
        }); 
      } else {
        setMessage(t.cityNotFound);
      }
    } catch (err) {
      setMessage(t.error);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, language, t.cityNotFound, t.error]); 

  useEffect(() => {
    if (initialCity) loadWeather(initialCity);
  }, [initialCity, language, loadWeather]);

  // ======================================================
  // SAVE CITY (Викликається з кнопки "Зберегти" у віджеті)
  // ======================================================
  const saveCity = async () => {
    if (!cityInput.trim() || !user?.id) return;
    setMessage("");

    try {
      const response = await window.api.updateUserCity({
        userId: user.id,
        city: cityInput.trim(),
      });

      if (response.success) {
        if (onCitySave) onCitySave(cityInput.trim()); 
        setMessage(t.citySaved);
      } else {
        setMessage(t.saveError);
      }
    } catch (err) {
      setMessage(t.saveError);
    }
  };

  return (
    <div className="weather-widget">

      <div className="city-input-group">
        <input
          type="text"
          value={cityInput}
          placeholder={t.enterCity}
          onChange={(e) => setCityInput(e.target.value)}
          className="city-input-field"
        />
        <button onClick={saveCity} className="city-save-btn">
          {t.save}
        </button>
      </div>

      {message && <p className="status-message">{message}</p>}

      {isLoading && <p>Завантаження...</p>}
      {weather && (
        <div className="weather-info">
          <h3>{t.weatherIn} {initialCity}</h3>
          
          <img
            alt="icon"
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/50x50/cccccc/333333?text=N/A" }}
          />
          
          <p>{t.temp} {weather.temp}°C</p>
          <p>{t.feelsLike} {weather.feelsLike}°C</p>
          <p>{t.humidity} {weather.humidity}%</p>
          <p>{t.wind} {weather.wind} m/s</p>
          <p style={{ textTransform: "capitalize" }}>{weather.description}</p>
        </div>
      )}
      {!weather && !isLoading && initialCity && <p style={{ marginTop: "15px" }}>{t.cityNotFound}</p>}

    </div>
  );
}