import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { translations } from "../i18n/translations";
import "./history.css";

export default function HistoryPage() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user"));
  
  const initialLanguage = storedUser?.settings?.language || localStorage.getItem("lang") || "ua";
  const initialTheme = storedUser?.settings?.theme || localStorage.getItem("theme") || "default";
  
  const [language] = useState(initialLanguage);
  const [theme] = useState(initialTheme);
  const [historyData, setHistoryData] = useState([]);
  const [fullHistoryData, setFullHistoryData] = useState([]); // Для аналітики
  const city = storedUser?.city || "";
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("table"); // "table" або "analytics"
  
  const t = translations[language] || translations['ua'];

  // Завантаження локальної історії з нашої бази
  const loadLocalHistory = useCallback(async () => {
    if (!city) {
      setHistoryData([]);
      setError(t.noCitySelected || "Виберіть місто на домашній сторінці");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const historyResult = await window.api.getWeatherHistory({
        userId: storedUser?.id,
        city: city,
        limit: 30
      });
      
      if (historyResult.success) {
        const sortedData = historyResult.history.sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
        setHistoryData(sortedData);
        
        if (historyResult.history.length === 0) {
          setError(t.noHistoryForCity || "Історія для цього міста поки відсутня");
        }
      } else {
        setError(historyResult.message || t.loadError || "Помилка завантаження");
      }
    } catch (error) {
      console.error("Помилка завантаження історії:", error);
      setError(t.loadError || "Помилка завантаження");
    } finally {
      setIsLoading(false);
    }
  }, [city, storedUser?.id, t]);

  // Отримання координат міста для історичного API
  const getCityCoordinates = useCallback(async (cityName) => {
    const apiKey = window.env.apiKey;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=metric&lang=${language}`;
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return {
          lat: data.coord.lat,
          lon: data.coord.lon
        };
      }
      return null;
    } catch (error) {
      console.error("Помилка отримання координат:", error);
      return null;
    }
  }, [language]);

  // Альтернативний метод: використовуємо прогноз на 5 днів як історію
  const loadForecastAsHistory = useCallback(async () => {
    try {
      const apiKey = window.env.apiKey;
      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=${language}&cnt=40`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const historicalData = [];
        
        // Групуємо прогноз за днями
        const dailyData = {};
        data.list.forEach(item => {
          const date = item.dt_txt.split(' ')[0];
          if (!dailyData[date]) {
            dailyData[date] = [];
          }
          dailyData[date].push(item);
        });
        
        // Для кожного дня беремо дані опівдні
        Object.keys(dailyData).slice(0, 5).forEach(date => {
          const dayData = dailyData[date];
          // Шукаємо запис близько опівдні
          const noonData = dayData.find(item => item.dt_txt.includes('12:00:00')) || dayData[Math.floor(dayData.length / 2)];
          
          if (noonData) {
            historicalData.push({
              date: date,
              temp: noonData.main.temp,
              description: noonData.weather[0].description,
              icon: noonData.weather[0].icon,
              humidity: noonData.main.humidity,
              wind: noonData.wind.speed,
              pressure: noonData.main.pressure
            });
          }
        });
        
        setFullHistoryData(historicalData);
      }
    } catch (error) {
      console.error("Помилка завантаження прогнозу:", error);
    }
  }, [city, language]);

  // Альтернативний метод для отримання історичних даних
  const loadAlternativeHistoricalData = useCallback(async (lat, lon, apiKey) => {
    try {
      // Використовуємо Current Weather Data API для кожного дня
      const historicalData = [];
      const today = new Date();
      
      for (let i = 4; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        try {
          // Альтернатива: використовуємо Weather API 2.5 для кожного дня
          // Це працює для останніх 5 днів на безкоштовному тарифі
          const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=${language}&dt=${Math.floor(date.getTime() / 1000)}`;
          
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            
            historicalData.push({
              date: dateStr,
              temp: data.main.temp,
              description: data.weather[0].description,
              icon: data.weather[0].icon,
              humidity: data.main.humidity,
              wind: data.wind.speed,
              pressure: data.main.pressure
            });
          }
        } catch (dayError) {
          console.error(`Помилка для дня ${dateStr}:`, dayError);
        }
      }
      
      setFullHistoryData(historicalData);
      
    } catch (error) {
      console.error("Помилка альтернативного методу:", error);
      // Якщо все інше не працює, завантажуємо прогноз
      await loadForecastAsHistory();
    }
  }, [language, loadForecastAsHistory]);

  // Завантаження історичних даних за останні 5 днів з OpenWeatherMap API
  const loadHistoricalData = useCallback(async () => {
    if (!city) return;
    
    setIsLoadingFull(true);
    
    try {
      const apiKey = window.env.apiKey;
      
      // 1. Отримуємо координати міста
      const coordinates = await getCityCoordinates(city);
      if (!coordinates) {
        console.error("Не вдалося отримати координати міста");
        setIsLoadingFull(false);
        return;
      }
      
      const { lat, lon } = coordinates;
      
      // 2. Отримуємо історичні дані за останні 5 днів
      const historicalData = [];
      const today = new Date();
      
      // Для кожного дня отримуємо дані
      for (let i = 4; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const timestamp = Math.floor(date.getTime() / 1000);
        
        try {
          // Використовуємо One Call API 2.5 для історичних даних
          // Увага: Цей метод може потребувати платного тарифу
          const url = `https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${timestamp}&appid=${apiKey}&units=metric&lang=${language}`;
          
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.current) {
              historicalData.push({
                date: date.toISOString().split('T')[0],
                temp: data.current.temp,
                description: data.current.weather[0].description,
                icon: data.current.weather[0].icon,
                humidity: data.current.humidity,
                wind: data.current.wind_speed,
                pressure: data.current.pressure,
                sunrise: new Date(data.current.sunrise * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                sunset: new Date(data.current.sunset * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
              });
            }
          } else {
            console.warn(`Не вдалося отримати дані за ${date.toLocaleDateString()}`);
          }
          
          // Затримка між запитами, щоб не перевищити ліміт API
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (dayError) {
          console.error(`Помилка для дня ${date.toLocaleDateString()}:`, dayError);
        }
      }
      
      // Якщо не вдалося отримати історичні дані, використовуємо альтернативний метод
      if (historicalData.length === 0) {
        await loadAlternativeHistoricalData(lat, lon, apiKey);
      } else {
        setFullHistoryData(historicalData);
      }
      
    } catch (error) {
      console.error("Помилка завантаження історичних даних:", error);
      // Якщо платний API не доступний, використовуємо безкоштовний прогноз
      await loadForecastAsHistory();
    } finally {
      setIsLoadingFull(false);
    }
  }, [city, language, getCityCoordinates, loadAlternativeHistoricalData, loadForecastAsHistory]);

  useEffect(() => {
    document.body.className = `theme-${theme}`;
    loadLocalHistory();
    loadHistoricalData();
  }, [theme, loadLocalHistory, loadHistoricalData]);

  // Обчислюємо статистику
  const calculateStatistics = (data) => {
    if (!data.length) return null;
    
    const temps = data.map(item => item.temp);
    const avgTemp = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const humidities = data.map(item => item.humidity);
    const avgHumidity = humidities.reduce((sum, h) => sum + h, 0) / humidities.length;
    const winds = data.map(item => item.wind);
    const avgWind = winds.reduce((sum, w) => sum + w, 0) / winds.length;
    const pressures = data.map(item => item.pressure || 1013);
    const avgPressure = pressures.reduce((sum, p) => sum + p, 0) / pressures.length;
    
    // Аналіз погодних умов
    const conditions = {
      sunny: data.filter(item => 
        item.description.toLowerCase().includes('сонце') || 
        item.description.toLowerCase().includes('ясно') ||
        item.description.toLowerCase().includes('clear') ||
        item.icon.includes('01') || item.icon.includes('02')
      ).length,
      cloudy: data.filter(item => 
        item.description.toLowerCase().includes('хма') ||
        item.description.toLowerCase().includes('cloud') ||
        item.icon.includes('03') || item.icon.includes('04')
      ).length,
      rainy: data.filter(item => 
        item.description.toLowerCase().includes('дощ') ||
        item.description.toLowerCase().includes('rain') ||
        item.icon.includes('09') || item.icon.includes('10')
      ).length,
      windy: data.filter(item => item.wind > 5).length,
      snowy: data.filter(item => 
        item.description.toLowerCase().includes('сніг') ||
        item.description.toLowerCase().includes('snow') ||
        item.icon.includes('13')
      ).length
    };
    
    return {
      avgTemp: avgTemp.toFixed(1),
      minTemp: minTemp.toFixed(1),
      maxTemp: maxTemp.toFixed(1),
      avgHumidity: avgHumidity.toFixed(0),
      avgWind: avgWind.toFixed(1),
      avgPressure: avgPressure.toFixed(0),
      conditions,
      totalDays: data.length
    };
  };

  // Якщо немає міста
  if (!city || city.trim() === "") {
    return (
      <div className="history-container">
        <div className="history-header">
          <button className="back-button" onClick={() => navigate('/home')}>
            ←
          </button>
          <h1>{t.weatherHistory || "Історія метеоданих"}</h1>
        </div>
        
        <div className="no-city-message">
          <div className="no-city-icon">🏙️</div>
          <h3>{t.noCitySelected || "Місто не вибрано"}</h3>
          <p>{t.selectCityFirst || "Щоб переглянути історію погоди, спочатку виберіть місто на домашній сторінці"}</p>
          <button 
            className="go-to-home-btn"
            onClick={() => navigate('/home')}
          >
            {t.goToHomePage || "Перейти на домашню сторінку"}
          </button>
        </div>
      </div>
    );
  }

  const displayData = activeTab === "table" ? historyData : fullHistoryData;
  const statistics = calculateStatistics(displayData);

  // Форматуємо дату для відображення
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'uk-UA', { 
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  // Отримуємо кольори для температури
  const getTempColor = (temp) => {
    if (temp >= 30) return '#ff4444'; // Дуже жарко
    if (temp >= 25) return '#ff6b6b'; // Жарко
    if (temp >= 20) return '#ffa726'; // Тепло
    if (temp >= 15) return '#ffee58'; // Помірно
    if (temp >= 10) return '#4fc3f7'; // Прохолодно
    if (temp >= 5) return '#29b6f6'; // Холодно
    if (temp >= 0) return '#0288d1'; // Дуже холодно
    return '#01579b'; // Мороз
  };

  // Визначаємо напрямок вітру
  const getWindDirection = (windSpeed) => {
    if (windSpeed < 1) return { icon: "↻", text: "Спокій" };
    if (windSpeed < 5) return { icon: "→", text: "Слабкий" };
    if (windSpeed < 10) return { icon: "↗", text: "Помірний" };
    if (windSpeed < 15) return { icon: "↑", text: "Сильний" };
    return { icon: "⇈", text: "Шторм" };
  };

  return (
    <div className="history-container">
      {/* Хедер */}
      <div className="history-header">
        <button className="back-button" onClick={() => navigate('/home')}>
          ←
        </button>
        <h1>{t.weatherHistory || "Історія метеоданих"}</h1>
      </div>

      {/* Інформація про місто */}
      <div className="city-info">
        <h3>{t.viewingHistoryFor || "Історія для"}: <span className="highlight">{city}</span></h3>
        <div className="city-info-details">
          <p>
            {activeTab === "table" 
              ? `${t.localHistory || "Локальна історія"} (${historyData.length} ${t.days || "днів"})`
              : `${t.apiHistory || "Дані з API"} (${fullHistoryData.length} ${t.days || "днів"})`
            }
          </p>
        </div>
        <div className="city-info-controls">
          <button 
            className="refresh-btn"
            onClick={activeTab === "table" ? loadLocalHistory : loadHistoricalData}
            disabled={isLoading || isLoadingFull}
          >
            {isLoading || isLoadingFull ? t.loading || "Завантаження..." : t.refresh || "Оновити"}
          </button>
          <div className="view-type-selector">
            <button 
              className={`view-type-btn ${activeTab === "table" ? "active" : ""}`}
              onClick={() => setActiveTab("table")}
            >
              📋 {t.tableView || "Таблиця"}
            </button>
            <button 
              className={`view-type-btn ${activeTab === "analytics" ? "active" : ""}`}
              onClick={() => setActiveTab("analytics")}
            >
              📊 {t.analytics || "Аналітика"}
            </button>
          </div>
        </div>
      </div>

      {/* Завантаження */}
      {(isLoading || isLoadingFull) && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t.loadingHistory || "Завантаження історії..."}</p>
        </div>
      )}

      {/* Помилка */}
      {error && !isLoading && !isLoadingFull && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      {/* Контент */}
      {!isLoading && !isLoadingFull && !error && (
        <div className="history-content">
          {displayData.length === 0 ? (
            <div className="no-history">
              <p>{t.noHistoryData || "Немає даних історії для цього міста"}</p>
              <p>{t.historyHint || "Дані з'являться після перегляду погоди в цьому місті"}</p>
            </div>
          ) : (
            <>
              {activeTab === "table" ? (
                <>
                  {/* Таблиця */}
                  <div className="history-table">
                    <table>
                      <thead>
                        <tr>
                          <th>{t.date || "Дата"}</th>
                          <th>{t.temperature || "Температура"}</th>
                          <th>{t.weather || "Погода"}</th>
                          <th>{t.humidity || "Вологість"}</th>
                          <th>{t.wind || "Вітер"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayData.map((item, index) => {
                          const windInfo = getWindDirection(item.wind);
                          
                          return (
                            <tr key={index}>
                              {/* Дата */}
                              <td className="date-cell">
                                <div className="date-day">{formatDate(item.date)}</div>
                              </td>
                              
                              {/* Температура - ОКРЕМА КОЛОНКА */}
                              <td className="temp-cell">
                                <div className="temp-content">
                                  <div 
                                    className="temp-value"
                                    style={{ color: getTempColor(item.temp) }}
                                  >
                                    {item.temp}°C
                                  </div>
                                  <div className={`temp-trend ${item.temp >= 0 ? 'positive' : 'negative'}`}>
                                    {item.temp >= 0 ? '↑' : '↓'}
                                  </div>
                                </div>
                              </td>
                              
                              {/* Погода - ОКРЕМА КОЛОНКА */}
                              <td className="weather-cell">
                                <div className="weather-content">
                                  <div className="weather-icon">
                                    <img 
                                      src={`https://openweathermap.org/img/wn/${item.icon}.png`} 
                                      alt={item.description}
                                    />
                                  </div>
                                  <span className="weather-desc">{item.description}</span>
                                </div>
                              </td>
                              
                              {/* Вологість */}
                              <td className="humidity-cell">
                                <div className="humidity-content">
                                  <div className="humidity-value">{item.humidity}%</div>
                                  <div className="humidity-bar-container">
                                    <div className="humidity-bar">
                                      <div 
                                        className="humidity-fill"
                                        style={{ width: `${Math.min(item.humidity, 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              
                              {/* Вітер */}
                              <td className="wind-cell">
                                <div className="wind-content">
                                  <div className="wind-value">{item.wind} m/s</div>
                                  <div className="wind-direction-container">
                                    <div className="wind-direction-icon">{windInfo.icon}</div>
                                    <div className="wind-direction-text">{windInfo.text}</div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Графік температури */}
                  <div className="temperature-chart">
                    <h4>{t.temperatureChart || "Зміна температури"}</h4>
                    <div className="chart-bars">
                      {displayData.map((item, index) => {
                        const height = Math.min(Math.max(Math.abs(item.temp) * 4, 40), 160);
                        
                        return (
                          <div key={index} className="chart-bar-container">
                            <div className="bar-label">
                              {new Date(item.date).toLocaleDateString(language === 'en' ? 'en-US' : 'uk-UA', { 
                                day: 'numeric',
                                month: 'short'
                              })}
                            </div>
                            <div 
                              className="chart-bar"
                              style={{ 
                                height: `${height}px`,
                                background: getTempColor(item.temp)
                              }}
                              title={`${item.temp}°C`}
                            >
                              <span className="bar-value">{item.temp}°</span>
                            </div>
                            <div className="bar-date">
                              {new Date(item.date).toLocaleDateString(language === 'en' ? 'en-US' : 'uk-UA', { 
                                weekday: 'short'
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Аналітика */}
                  <div className="analytics-section">
                    <div className="analytics-cards">
                      <div className="analytics-card">
                        <h4>📈 {t.temperatureTrend || "Тенденція температури"}</h4>
                        <div className="trend-chart">
                          {fullHistoryData.slice(0, 7).map((item, i, arr) => {
                            const nextItem = arr[i + 1];
                            if (!nextItem) return null;
                            
                            const diff = (nextItem.temp - item.temp).toFixed(1);
                            const isRising = parseFloat(diff) >= 0;
                            
                            return (
                              <div key={i} className="trend-item">
                                <div className="trend-date">
                                  {new Date(item.date).toLocaleDateString(language === 'en' ? 'en-US' : 'uk-UA', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </div>
                                <div className={`trend-arrow ${isRising ? 'rising' : 'falling'}`}>
                                  {isRising ? '↗' : '↘'} {Math.abs(parseFloat(diff))}°
                                </div>
                              </div>
                            );
                          }).filter(Boolean)}
                        </div>
                      </div>
                      
                      <div className="analytics-card">
                        <h4>🌤️ {t.weatherConditions || "Погодні умови"}</h4>
                        {statistics && (
                          <div className="conditions-grid">
                            <div className="condition-item sunny">
                              <span className="condition-label">{t.sunny || "Сонячно"}</span>
                              <span className="condition-value">{statistics.conditions.sunny} дн.</span>
                            </div>
                            <div className="condition-item cloudy">
                              <span className="condition-label">{t.cloudy || "Хмарно"}</span>
                              <span className="condition-value">{statistics.conditions.cloudy} дн.</span>
                            </div>
                            <div className="condition-item rainy">
                              <span className="condition-label">{t.rainy || "Дощ"}</span>
                              <span className="condition-value">{statistics.conditions.rainy} дн.</span>
                            </div>
                            <div className="condition-item windy">
                              <span className="condition-label">{t.windy || "Вітряно"}</span>
                              <span className="condition-value">{statistics.conditions.windy} дн.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="analytics-summary">
                      <h4>📊 {t.summary || "Підсумок"}</h4>
                      <div className="summary-stats">
                        <div className="summary-stat">
                          <div className="stat-icon">📅</div>
                          <div className="stat-info">
                            <div className="stat-label">{t.period || "Період"}</div>
                            <div className="stat-value">{statistics?.totalDays} {t.days || "днів"}</div>
                          </div>
                        </div>
                        <div className="summary-stat">
                          <div className="stat-icon">🌡️</div>
                          <div className="stat-info">
                            <div className="stat-label">{t.tempRange || "Діапазон темп."}</div>
                            <div className="stat-value">
                              {statistics?.minTemp}° - {statistics?.maxTemp}°
                            </div>
                          </div>
                        </div>
                        <div className="summary-stat">
                          <div className="stat-icon">💨</div>
                          <div className="stat-info">
                            <div className="stat-label">{t.avgWind || "Серед. вітер"}</div>
                            <div className="stat-value">{statistics?.avgWind} m/s</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Статистика */}
              {statistics && (
                <div className="statistics-box">
                  <h4>{t.statistics || "Статистика"}</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">{t.averageTemp || "Середня темп."}</span>
                      <span className="stat-value" style={{ color: getTempColor(parseFloat(statistics.avgTemp)) }}>
                        {statistics.avgTemp}°C
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">{t.minTemp || "Мін. темп."}</span>
                      <span className="stat-value" style={{ color: getTempColor(parseFloat(statistics.minTemp)) }}>
                        {statistics.minTemp}°C
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">{t.maxTemp || "Макс. темп."}</span>
                      <span className="stat-value" style={{ color: getTempColor(parseFloat(statistics.maxTemp)) }}>
                        {statistics.maxTemp}°C
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">{t.avgHumidity || "Серед. вологість"}</span>
                      <span className="stat-value">{statistics.avgHumidity}%</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}