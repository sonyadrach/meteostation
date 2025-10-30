import React, { useState } from "react";
import { translations } from "../../i18n/translations";
import WeatherWidget from "../weather/weatherwidget"; 
import "./auth.css";

export default function Auth({ language }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false); 

  const t = translations[language];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        // Вхід користувача
        const res = await window.api.loginUser({
          email: form.email,
          password: form.password,
        });

        if (res.success) {
          setMessage("Вхід успішний!");
          setIsAuthenticated(true);
        } else {
          setMessage("Помилка: " + res.message);
        }
      } else {
        // Реєстрація користувача
        const res = await window.api.registerUser({
          username: form.username,
          email: form.email,
          password: form.password,
        });

        if (res.success) {
          setMessage("Реєстрація успішна!");
          setIsAuthenticated(true); 
        } else {
          setMessage("Помилка: " + res.message);
        }
      }
    } catch (err) {
      console.error(err);
      setMessage("Помилка з'єднання з базою даних.");
    }
  };

  if (isAuthenticated) {
    return <WeatherWidget language={language} />;
  }

  return (
    <div className="auth-container">
      <h2>{isLogin ? t.login : t.register}</h2>

      <form onSubmit={handleSubmit} className="auth-form">
        {!isLogin && (
          <>
            <label>{t.username}</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </>
        )}

        <label>{t.email}</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <label>{t.password}</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit">
          {isLogin ? t.login : t.register}
        </button>
      </form>

      {message && <p style={{ marginTop: "10px" }}>{message}</p>}

      <div className="auth-toggle">
        {isLogin ? t.noAccount : t.haveAccount}{" "}
        <span onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? t.register : t.login}
        </span>
      </div>
    </div>
  );
}
