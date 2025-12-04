import React, { useEffect, useState, useCallback } from "react";
import { translations } from "../../i18n/translations";
import "./weather.css";

const MIN_LOADING_TIME = 300;

export default function WeatherWidget({ language, user, onCitySave, onWeatherUpdate }) {

    const initialCity = user?.city || "";
    const [cityInput, setCityInput] = useState(initialCity);
    const [weather, setWeather] = useState(null);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [loadedCity, setLoadedCity] = useState(initialCity);

    const t = translations[language];
    const apiKey = window.env.apiKey;

    const loadWeather = useCallback(async (targetCity) => {
        if (!targetCity) {
            setWeather(null);
            setLoadedCity("");
            return;
        }

        setIsLoading(true);
        setMessage("");
        const start = Date.now();

        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${targetCity}&appid=${apiKey}&units=metric&lang=${language}`;
            const res = await fetch(url);
            const data = await res.json();

            const delay = Math.max(0, MIN_LOADING_TIME - (Date.now() - start));
            if (delay > 0) await new Promise(r => setTimeout(r, delay));

            if (data.cod === 200) {
                const w = {
                    temp: data.main.temp,
                    feelsLike: data.main.feels_like,
                    humidity: data.main.humidity,
                    wind: data.wind.speed,
                    description: data.weather[0].description,
                    icon: data.weather[0].icon
                };
                setWeather(w);
                setLoadedCity(targetCity);

                onWeatherUpdate?.(w);
            } else {
                setWeather(null);
                setMessage(t.cityNotFound);
                onWeatherUpdate?.(null);
            }

        } catch (e) {
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
        t.error
    ]);

    useEffect(() => {
        if (initialCity && loadedCity !== initialCity) {
            loadWeather(initialCity);
        }
    }, [initialCity, loadedCity, loadWeather]);

    const saveCity = async () => {
        if (!cityInput.trim()) return;

        const cleanCity = cityInput.trim();

        // If not logged in, just load weather
        if (!user?.id) {
            loadWeather(cleanCity);
            return;
        }

        try {
            const res = await window.api.updateUserCity({
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

    const renderContent = () => {
        if (isLoading)
            return <div className="weather-info-placeholder"><p>Завантаження...</p></div>;

        if (!weather)
            return (
                <div className="weather-info-placeholder">
                    <p>
                        {loadedCity ? t.cityNotFound : "Введіть місто."}
                    </p>
                </div>
            );

        return (
            <div className="weather-info">
                <h3>{t.weatherIn} {loadedCity}</h3>
                <img
                    alt="icon"
                    src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                    onError={(e) => (e.target.src = "https://placehold.co/60x60")}
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
                {renderContent()}
            </div>
        </div>
    );
}
