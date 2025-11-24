import React, { useEffect, useState, useCallback } from "react";
// НЕОБХІДНИЙ ІМПОРТ: Додайте цей рядок у ваш файл, якщо він відсутній:
// import { translations } from "../i18n/translations";
import "./weather.css";

// Примітка: Для коректної роботи цього коду, об'єкт translations
// має бути доступний (наприклад, через імпорт). Я імітую його тут для чистоти.
const translations = { ua: { save: "Зберегти", cityNotFound: "Місто не знайдено", error: "Помилка API", temp: "Температура:", feelsLike: "Відчувається як:", humidity: "Вологість:", wind: "Вітер:", weatherIn: "Погода в", citySaved: "Місто збережено!", saveError: "Помилка збереження", enterCity: "Введіть місто...", }, en: { save: "Save", cityNotFound: "City not found", error: "API error", temp: "Temperature:", feelsLike: "Feels like:", humidity: "Humidity:", wind: "Wind speed", weatherIn: "Weather in", citySaved: "City saved!", saveError: "Save error", enterCity: "Enter city...", }, };

export default function WeatherWidget({ language, user, onCitySave }) {
  // Використовуємо властивість city з об'єкта user, переданого з HomePage
  const initialCity = user?.city || ""; 
  
  // Стан для поля вводу всередині віджета
  const [cityInput, setCityInput] = useState(initialCity); 
  const [weather, setWeather] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Використовуємо об'єкт t з імпорту
  const t = translations[language]; 
  const apiKey = window.env.apiKey;

  // Синхронізуємо inner state (cityInput) при зміні initialCity (з HomePage)
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

  // Ефект для автоматичного завантаження погоди
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
        // КЛЮЧ: Повідомляємо HomePage, що місто збережено
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

      {/* ФОРМА ВВЕДЕННЯ */}
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

      {/* ВІДОБРАЖЕННЯ ПОГОДИ */}
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