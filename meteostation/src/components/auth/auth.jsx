import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { translations } from "../../i18n/translations";
import "./auth.css";
import { loginUser, registerUser } from "../../api/backend";

export default function Auth({ language }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");

  const t = translations[language];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    if (isLogin) {
      const res = await loginUser({
        email: form.email,
        password: form.password,
      });

      if (res.success) {
        localStorage.setItem("user", JSON.stringify(res.user));
        navigate("/home");
      } else {
        setMessage(res.message);
      }

    } else {
      if (form.password !== form.confirmPassword) {
        setMessage("Паролі не співпадають");
        return;
      }

      const res = await registerUser({
        username: form.username,
        email: form.email,
        password: form.password,
      });

      if (res.success) {
        localStorage.setItem("user", JSON.stringify(res.user));
        navigate("/home");
      } else {
        setMessage(res.message);
      }
    }
  } catch (e) {
      setMessage(
        language === "ua"
          ? "Помилка з'єднання з базою даних."
          : "Database connection error."
      );
    }
  };

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

        {!isLogin && (
          <>
            <label>
              {language === "ua" ? "Підтвердіть пароль" : "Confirm password"}
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </>
        )}

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
