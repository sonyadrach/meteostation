import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WeatherWidget from "../components/weather/weatherwidget";
import { translations } from "../i18n/translations";
import "./home.css"; 

export default function HomePage() {
  const navigate = useNavigate();
  
  // 1. Зчитуємо користувача.
  const storedUser = JSON.parse(localStorage.getItem("user"));
  
  // 2. Стан мови, теми та налаштувань
  const initialLanguage = storedUser?.settings?.language || localStorage.getItem("lang") || "ua";
  const initialTheme = storedUser?.settings?.theme || localStorage.getItem("theme") || "default";

  const [language, setLanguage] = useState(initialLanguage);
  const [theme, setTheme] = useState(initialTheme);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  
  // 3. Стан міста та повідомлень + РЕКОМЕНДАЦІЇ
  const [savedCityState, setSavedCityState] = useState(storedUser?.city || "");
  const [message, setMessage] = useState("");
  const [recommendations, setRecommendations] = useState([]); 

  const t = translations[language] || translations['ua']; 
  
  // 4. IPC функція для збереження теми/мови в БД
  const saveSettingsToDB = async (newTheme, newLanguage) => {
    if (!storedUser?.id) return;
    try {
        const res = await window.api.updateUserSettings({
            userId: storedUser.id,
            theme: newTheme,
            language: newLanguage,
        });
        if (res.success) {
            const updatedUser = { ...storedUser, settings: { theme: newTheme, language: newLanguage } };
            localStorage.setItem("user", JSON.stringify(updatedUser));
        } else {
            console.error("Failed to save settings to DB:", res.message);
        }
    } catch (e) {
        console.error("IPC error during settings save:", e);
    }
  };


  // 5. СИНХРОНІЗАЦІЯ localStorage, ТЕМИ та МІСТА
  useEffect(() => {
    document.body.className = `theme-${theme}`; 
    localStorage.setItem("theme", theme);
    localStorage.setItem("lang", language);
    
    // Синхронізація міста при першому завантаженні
    if (storedUser?.city && savedCityState !== storedUser.city) {
        setSavedCityState(storedUser.city);
    }
    
  }, [storedUser?.city, savedCityState, theme, language]); 


  // 6. Функції керування станом
  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    saveSettingsToDB(newTheme, language); 
  };

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    saveSettingsToDB(theme, newLang); 
  };
  
  const handleLogout = () => {
      localStorage.removeItem("user");
      navigate("/");
  };
  
  // 7. Функція зворотного виклику для ГЕНЕРАЦІЇ РЕКОМЕНДАЦІЙ
  const generateRecommendations = (weatherData) => { 
      if (!weatherData) return setRecommendations([]);

      let recs = [];
      const temp = weatherData.temp;
      const desc = weatherData.description.toLowerCase();
      const wind = weatherData.wind;
      const humidity = weatherData.humidity;

      if (temp > 25) {
          recs.push(t.rec_hot || "На вулиці спекотно. Не забувайте пити воду! 💧");
      } else if (temp < 5) {
          recs.push(t.rec_cold || "На вулиці холодно, вдягніться тепліше! 🥶");
      }

      if (desc.includes('дощ') || desc.includes('rain')) {
          recs.push(t.rec_rain || "Не забудьте парасольку! ☔");
      } else if (desc.includes('сонце') || desc.includes('clear')) {
          recs.push(t.rec_sun || "Сьогодні сонячно, не забудьте сонцезахисний крем.");
      }

      if (wind > 8) {
          recs.push(t.rec_windy || "Сьогодні вітряно, будьте обережні з речима. 🌬️");
      }

      if (humidity > 80) {
          recs.push(t.rec_humid || "Дуже висока вологість. Можливий туман.");
      }

      setRecommendations(recs);
  };

  // 8. Логіка зворотного виклику для WeatherWidget 
 const handleWidgetCitySaved = (newCity, weatherData) => { 
      setSavedCityState(newCity);
      const updatedUser = { ...storedUser, city: newCity };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setMessage(t.citySaved || "Місто збережено!");
      
      generateRecommendations(weatherData); 
  };

  // 9. Логіка зворотного виклику для WeatherWidget 
  const handleWeatherUpdate = (weatherData) => { 
      generateRecommendations(weatherData);
  };

  // Перевірка автентифікації
  if (!storedUser || !storedUser.id) {
    navigate("/"); 
    return null;
  }
  const userWithCurrentCity = {
  ...storedUser,
  city: savedCityState   
};
  return (
    <div className="homepage-container">
      
      {/* 1. БЛОК ЗАГОЛОВКУ/КЕРУВАННЯ */}
      <div className="header-controls">
          <h1 className="welcome-title">{t.welcome || "Вітаємо"}, {storedUser?.username || t.username} 👋</h1>
          
          <div className="controls-group"> 

              {/* КНОПКА НАЛАШТУВАННЯ */}
              <div className="settings-menu">
                  <span className="account-icon" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
                    👤
                  </span>
                  
                  {isSettingsOpen && (
                      <div className="settings-options">
                          <p className="menu-title">{t.settings || "Налаштування"}</p>
                          
                          {/* ЗМІНА МОВИ */}
                          <div className="language-selector">
                              <span className="lang-label">{t.language || "Мова"}:</span>
                              <button className={`lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => changeLanguage('en')}>EN</button>
                              <button className={`lang-btn ${language === 'ua' ? 'active' : ''}`} onClick={() => changeLanguage('ua')}>UA</button>
                          </div>

                          {/* ЗМІНА ТЕМИ */}
                          <div className="theme-selector">
                              <span className="theme-label">{t.theme || "Тема"}:</span>
                              <button className={`theme-btn theme-default ${theme === 'default' ? 'active-theme' : ''}`} onClick={() => changeTheme('default')}></button>
                              <button className={`theme-btn theme-dark ${theme === 'dark' ? 'active-theme' : ''}`} onClick={() => changeTheme('dark')}></button>
                              <button className={`theme-btn theme-blue ${theme === 'blue' ? 'active-theme' : ''}`} onClick={() => changeTheme('blue')}></button>
                          </div>
                          
                          {/* КНОПКА ВИХОДУ */}
                          <button className="logout-btn-menu" onClick={handleLogout}>
                              {t.logout || "Вийти"}
                          </button>
                      </div>
                  )}
              </div> 
          </div> 
      </div>


      {/* 2. ІНФОРМАЦІЯ ПРО МІСТО */}
      <h2 className="city-heading">{t.city || "Місто"}: {savedCityState || "Не встановлено"}</h2>
      
      {message && <p className={`status-message ${message === (t.citySaved || "Місто збережено!") ? 'status-success' : 'status-error'}`}>{message}</p>}

      {/* 3. ВІДОБРАЖЕННЯ РЕКОМЕНДАЦІЙ */}
      {recommendations.length > 0 && (
          <div className="recommendations-box">
              <h3>{t.recommendations || "Рекомендації на сьогодні:"}</h3>
              <ul>
                  {recommendations.map((rec, index) => (
                      <li key={index}>⭐ {rec}</li>
                  ))}
              </ul>
          </div>
      )}


      {/* 4. WEATHER WIDGET */}
      <WeatherWidget 
        language={language} 
        user={userWithCurrentCity} 
        onCitySave={handleWidgetCitySaved} 
        onWeatherUpdate={handleWeatherUpdate} 
      />
    </div>
  );
}