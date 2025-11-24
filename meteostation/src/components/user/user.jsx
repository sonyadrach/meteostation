import React, { useState } from "react";
import WeatherWidget from "../weather/weatherwidget";

export default function UserDashboard({ user, language }) {
  const [city, setCity] = useState(user.city || "");
  const [savedCity, setSavedCity] = useState(user.city || "");
  const [message, setMessage] = useState("");

  const handleSaveCity = async () => {
    try {
      const res = await window.api.updateUserCity({
        userId: user.id,
        city,
      });
      if (res.success) {
        setSavedCity(city);
        setMessage(language === "ua" ? "Місто збережено!" : "City saved!");
      } else {
        setMessage(
          (language === "ua" ? "Помилка: " : "Error: ") + res.message
        );
      }
    } catch {
      setMessage(language === "ua" ? "Помилка з'єднання" : "Connection error");
    }
  };

  return (
    <div className="dashboard-container">
      <h2>
        {language === "ua"
          ? `Вітаємо, ${user.username}!`
          : `Welcome, ${user.username}!`}
      </h2>

      <div className="city-form">
        <label>{language === "ua" ? "Ваше місто:" : "Your city:"}</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={language === "ua" ? "Введіть місто..." : "Enter city..."}
        />
        <button onClick={handleSaveCity}>
          {language === "ua" ? "Зберегти" : "Save"}
        </button>
      </div>

      {message && <p>{message}</p>}

      {savedCity && (
        <div style={{ marginTop: "20px" }}>
          <WeatherWidget language={language} city={savedCity} />
        </div>
      )}
    </div>
  );
}
