import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { translations } from "../i18n/translations";
import "./reminders.css";

export default function RemindersPage() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user"));
  
  const initialLanguage = storedUser?.settings?.language || localStorage.getItem("lang") || "ua";
  const initialTheme = storedUser?.settings?.theme || localStorage.getItem("theme") || "default";
  
  const [language] = useState(initialLanguage);
  const [theme] = useState(initialTheme);
  const [reminders, setReminders] = useState([]);
  const [newReminder, setNewReminder] = useState("");
  const [city] = useState(storedUser?.city || "");
  const [tomorrowDate, setTomorrowDate] = useState("");
  
  const t = translations[language] || translations['ua'];

  // Встановлення теми
  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  // Отримання дати завтрашнього дня
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedDate = tomorrow.toISOString().split('T')[0];
    setTomorrowDate(formattedDate);
  }, []);

  // Завантаження нагадувань лише на завтрашній день
  const loadReminders = useCallback(async () => {
    if (!storedUser?.id || !tomorrowDate) return;
    
    try {
      const remindersData = await window.api.getReminders({
        userId: storedUser.id,
        date: tomorrowDate // Завантажуємо тільки нагадування на завтра
      });
      if (remindersData.success) {
        setReminders(remindersData.reminders || []);
      }
    } catch (error) {
      console.error("Помилка завантаження нагадувань:", error);
    }
  }, [storedUser?.id, tomorrowDate]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  // Додавання нагадування лише на завтрашній день
  const addReminder = async () => {
    if (!newReminder.trim() || !city) return;
    
    try {
      const result = await window.api.addReminder({
        userId: storedUser?.id,
        city: city,
        text: newReminder,
        date: tomorrowDate, // Використовуємо завтрашню дату
        created_at: new Date().toISOString()
      });
      
      if (result.success) {
        setNewReminder("");
        loadReminders();
      }
    } catch (error) {
      console.error("Помилка додавання нагадування:", error);
    }
  };

  // Видалення нагадування
  const deleteReminder = async (id) => {
    try {
      const result = await window.api.deleteReminder({ id });
      if (result.success) {
        loadReminders();
      }
    } catch (error) {
      console.error("Помилка видалення нагадування:", error);
    }
  };

  // Форматування дати для відображення
  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ua' ? 'uk-UA' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Перевірка автентифікації
  if (!storedUser || !storedUser.id) {
    navigate("/");
    return null;
  }

  return (
    <div className="reminders-container">
      <div className="reminders-header">
        <button className="back-button" onClick={() => navigate('/home')}>
          ←
        </button>
        <div className="header-title">
          <h1>{t.myForecastTomorrow || "Мій прогноз на завтра"}</h1>
          <div className="tomorrow-date-badge">
            📅 {tomorrowDate ? formatDisplayDate(tomorrowDate) : "Завантаження..."}
          </div>
        </div>
      </div>

      {/* Форма додавання нового нагадування */}
      <div className="add-reminder-box">
        <h3>{t.addReminder || "Додати нове нагадування"}</h3>
        <div className="reminder-meta-info">
          <div className="meta-item">
            <span className="meta-label">{t.city || "Місто"}:</span>
            <span className="meta-value">{city || "Не вказано"}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">{t.date || "Дата"}:</span>
            <span className="meta-value">
              {tomorrowDate ? formatDisplayDate(tomorrowDate) : "Завтра"}
            </span>
          </div>
        </div>
        <div className="form-group">
          <textarea
            value={newReminder}
            onChange={(e) => setNewReminder(e.target.value)}
            placeholder={t.reminderPlaceholder || "Наприклад: Полити квіти, якщо буде сонячно. Взяти парасольку, якщо буде дощ."}
            rows="3"
            className="reminder-input"
          />
          <div className="input-hint">
            {t.reminderInputHint || "Нагадування буде прив'язане до погоди завтра в вашому місті"}
          </div>
        </div>
        <button 
          className="add-button"
          onClick={addReminder}
          disabled={!newReminder.trim() || !city}
        >
          {t.add || "Додати"} ➕
        </button>
      </div>

      {/* Список нагадувань на завтра */}
      <div className="reminders-list">
        <div className="list-header">
          <h3>{t.myReminders || "Мої нагадування"} ({reminders.length})</h3>
          <div className="date-filter">
            <span className="filter-active">
              {tomorrowDate ? formatDisplayDate(tomorrowDate) : "Завтра"}
            </span>
          </div>
        </div>
        
        {reminders.length === 0 ? (
          <div className="no-reminders-container">
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h4>{t.noRemindersForTomorrow || "Немає нагадувань на завтра"}</h4>
              <p>{t.addFirstReminder || "Додайте перше нагадування для завтрашнього дня"}</p>
            </div>
          </div>
        ) : (
          <div className="reminders-grid">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="reminder-card">
                <div className="reminder-header">
                  <div className="reminder-location">
                    <span className="location-icon">📍</span>
                    <span className="reminder-city">{reminder.city}</span>
                  </div>
                  <span className="reminder-date">{formatDisplayDate(reminder.date)}</span>
                </div>
                <div className="reminder-content">
                  <div className="reminder-icon">💭</div>
                  <p className="reminder-text">{reminder.text}</p>
                </div>
                <div className="reminder-footer">
                  <span className="created-time">
                    {new Date(reminder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button 
                    className="delete-button"
                    onClick={() => deleteReminder(reminder.id)}
                    title={t.delete || "Видалити"}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Підказка про нагадування */}
      <div className="hint-box">
        <div className="hint-icon">💡</div>
        <div className="hint-content">
          <p><strong>{t.reminderHintTitle || "Корисні поради:"}</strong></p>
          <ul className="hint-list">
            <li>{t.reminderHint1 || "Нагадування зберігаються лише на завтрашній день"}</li>
            <li>{t.reminderHint2 || "Пов'язуйте нагадування з очікуваною погодою"}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}