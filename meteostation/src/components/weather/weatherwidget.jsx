import React, { useEffect, useState, useCallback } from "react";
import { translations } from "../../i18n/translations";
import "./weather.css";
import { addWeatherHistory, updateUserCity } from "../../api/backend";


const MIN_LOADING_TIME = 300;

export default function WeatherWidget({ language, user, onCitySave, onWeatherUpdate }) {

    const initialCity = user?.city || "";
    const [cityInput, setCityInput] = useState(initialCity);

    const [weather, setWeather] = useState(null);
    const [forecastHours, setForecastHours] = useState([]);
    const [forecastDays, setForecastDays] = useState([]);

    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [loadedCity, setLoadedCity] = useState(initialCity);

    const t = translations[language];
    const apiKey =  '358ea41c4cffdd8bec2cca36703a4b64';

    const loadWeather = useCallback(async (targetCity) => {
        if (!targetCity) {
            setWeather(null);
            setForecastHours([]);
            setForecastDays([]);
            setLoadedCity("");
            return;
        }

        setIsLoading(true);
        setMessage("");
        const start = Date.now();

        try {
            const urlWeather =
                `https://api.openweathermap.org/data/2.5/weather?q=${targetCity}&appid=${apiKey}&units=metric&lang=${language}`;

            const urlForecast =
                `https://api.openweathermap.org/data/2.5/forecast?q=${targetCity}&appid=${apiKey}&units=metric&lang=${language}`;

            const [resWeather, resForecast] = await Promise.all([
                fetch(urlWeather),
                fetch(urlForecast)
            ]);

            const dataWeather = await resWeather.json();
            const dataForecast = await resForecast.json();

            const delay = Math.max(0, MIN_LOADING_TIME - (Date.now() - start));
            if (delay > 0) await new Promise(r => setTimeout(r, delay));

            if (dataWeather.cod === 200 && dataForecast.cod === "200") {

                const w = {
                    temp: dataWeather.main.temp,
                    feelsLike: dataWeather.main.feels_like,
                    humidity: dataWeather.main.humidity,
                    wind: dataWeather.wind.speed,
                    description: dataWeather.weather[0].description,
                    icon: dataWeather.weather[0].icon
                };
                setWeather(w);

                try {
                    if (user?.id) {
                        await addWeatherHistory({
                            userId: user.id,
                            city: targetCity,
                            weatherData: w
                        });
                    }
                } catch (historyError) {
                    console.error("Помилка збереження історії:", historyError);
                }

                const hours = dataForecast.list.slice(0, 6).map(item => ({
                    time: item.dt_txt,
                    temp: item.main.temp,
                    icon: item.weather[0].icon
                }));
                setForecastHours(hours);

                const daysMap = {};
                dataForecast.list.forEach(item => {
                    const date = item.dt_txt.split(" ")[0];
                    if (!daysMap[date]) daysMap[date] = item;
                });

                const days = Object.values(daysMap).slice(0, 5).map(item => ({
                    date: item.dt_txt.split(" ")[0],
                    temp: item.main.temp,
                    icon: item.weather[0].icon
                }));
                setForecastDays(days);

                setLoadedCity(targetCity);
                onWeatherUpdate?.(w);

            } else {
                setWeather(null);
                setMessage(t.cityNotFound);
                onWeatherUpdate?.(null);
            }

        } catch (e) {
            console.error(e);
            setWeather(null);
            setMessage(t.error);
            onWeatherUpdate?.(null);

        } finally {
            setIsLoading(false);
        }

    }, [
        apiKey,
        language,
        onWeatherUpdate,
        t.cityNotFound,
        t.error,
        user
    ]);

    useEffect(() => {
        if (initialCity && loadedCity !== initialCity) {
            loadWeather(initialCity);
        }
    }, [initialCity, loadedCity, loadWeather]);

    const saveCity = async () => {
        if (!cityInput.trim()) return;

        const cleanCity = cityInput.trim();

        if (!user?.id) {
            loadWeather(cleanCity);
            return;
        }

        try {
            const res = await updateUserCity({
                userId: user.id,
                city: cleanCity
            });

            if (res.success) {
                loadWeather(cleanCity);
                onCitySave?.(cleanCity);
                setMessage(t.citySaved);
            } else {
                setMessage(t.saveError);
            }
        } catch {
            setMessage(t.saveError);
        }
    };

    const renderCurrent = () => {
        if (isLoading)
            return <div className="weather-info-placeholder"><p>Завантаження...</p></div>;

        if (!weather)
            return <div className="weather-info-placeholder">
                <p>{loadedCity ? t.cityNotFound : "Введіть місто."}</p>
            </div>;

        return (
            <div className="weather-info">
                <h3>{t.weatherIn} {loadedCity}</h3>
                <img
                    alt="icon"
                    src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                />
                <p>{t.temp} {weather.temp}°C</p>
                <p>{t.feelsLike} {weather.feelsLike}°C</p>
                <p>{t.humidity} {weather.humidity}%</p>
                <p>{t.wind} {weather.wind} m/s</p>
                <p style={{ textTransform: "capitalize" }}>{weather.description}</p>
            </div>
        );
    };

    return (
        <div className="weather-widget">

            <div className="city-input-group">
                <input
                    type="text"
                    value={cityInput}
                    placeholder={t.enterCity}
                    onChange={(e) => setCityInput(e.target.value)}
                />
                <button onClick={saveCity}>{t.save}</button>
            </div>

            {message && <p className="status-message">{message}</p>}

            <div className="weather-display-area">
                {renderCurrent()}
            </div>

            {forecastHours.length > 0 && (
                <div className="forecast-hours">
                    <h4>{t.hourlyForecast}</h4>
                    <div className="forecast-row">
                        {forecastHours.map((h, i) => (
                            <div key={i} className="forecast-item">
                                <p>{h.time.slice(11, 16)}</p>
                                <img src={`https://openweathermap.org/img/wn/${h.icon}.png`} alt="" />
                                <p>{h.temp}°C</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {forecastDays.length > 0 && (
                <div className="forecast-days">
                    <h4>{t.dailyForecast}</h4>
                    <div className="forecast-row">
                        {forecastDays.map((d, i) => (
                            <div key={i} className="forecast-item">
                                <p>{d.date}</p>
                                <img src={`https://openweathermap.org/img/wn/${d.icon}.png`} alt="" />
                                <p>{d.temp}°C</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
