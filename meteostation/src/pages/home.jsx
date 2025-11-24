import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WeatherWidget from "../components/weather/weatherwidget";
import { translations } from "../i18n/translations";
import "./home.css"; 

export default function HomePage() {
  const navigate = useNavigate();
  
  const [language, setLanguage] = useState(localStorage.getItem("lang") || "ua");
  
  const [langOpen, setLangOpen] = useState(false); 
  
  const storedUser = JSON.parse(localStorage.getItem("user"));
  
  const [savedCityState, setSavedCityState] = useState(storedUser?.city || "");
  const [message, setMessage] = useState("");

  const t = translations[language] || translations['ua']; 
  
  useEffect(() => {
    if (storedUser?.city && savedCityState !== storedUser.city) {
        setSavedCityState(storedUser.city);
    }
  }, [storedUser?.city, savedCityState]); 

  const toggleLang = () => setLangOpen(!langOpen);

  const changeLang = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem("lang", newLang);
    setLangOpen(false); 
  };
  
  const handleWidgetCitySaved = (newCity) => {
      setSavedCityState(newCity);
      
      const updatedUser = { ...storedUser, city: newCity };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      setMessage(t.citySaved || "Місто збережено!");
  };

  if (!storedUser || !storedUser.id) {
    navigate("/"); 
    return null;
  }
  
  const userWithCurrentCity = { ...storedUser, city: savedCityState };


  return (
    <div className="homepage-container">
      
      <div className="header-controls">
          <h1 className="welcome-title">{t.welcome || "Вітаємо"}, {storedUser?.username || t.username} 👋</h1>
          
          <div className="lang-switcher">
            <span className="globe" onClick={toggleLang}>🌐</span>
            {langOpen && (
              <div className="lang-options">
                <div onClick={() => changeLang("en")}>EN</div>
                <div onClick={() => changeLang("ua")}>UA</div>
              </div>
            )}
          </div>
      </div>

      <h2 className="city-heading">{t.city || "Місто"}: {savedCityState || "Не встановлено"}</h2>
      
      {message && <p className={`status-message ${message === (t.citySaved || "Місто збережено!") ? 'status-success' : 'status-error'}`}>{message}</p>}

      <WeatherWidget 
        language={language} 
        user={userWithCurrentCity} 
        onCitySave={handleWidgetCitySaved} 
      />


      <button
        onClick={() => {
          localStorage.removeItem("user");
          navigate("/"); 
        }}
        className="logout-btn"
      >
        {t.logout || "Вийти"}
      </button>
    </div>
  );
}