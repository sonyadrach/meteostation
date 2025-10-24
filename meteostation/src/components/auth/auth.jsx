import React, { useState } from "react";
import { translations } from "../../i18n/translations";
import "./auth.css";


export default function Auth({ language }) {
const [isLogin, setIsLogin] = useState(true);
const [form, setForm] = useState({ username: "", email: "", password: "" });


const t = translations[language];


const handleChange = (e) => {
setForm({ ...form, [e.target.name]: e.target.value });
};


const handleSubmit = (e) => {
e.preventDefault();
// Тут пізніше LocalStorage / SQL
console.log(isLogin ? "Login:" : "Register:", form);
};


return (
<div className="auth-container">
<h2>{isLogin ? t.login : t.register}</h2>
<form onSubmit={handleSubmit} className="auth-form">
{!isLogin && (
<>
<label>{t.username}</label>
<input type="text" name="username" value={form.username} onChange={handleChange} required />
</>
)}
<label>{t.email}</label>
<input type="email" name="email" value={form.email} onChange={handleChange} required />


<label>{t.password}</label>
<input type="password" name="password" value={form.password} onChange={handleChange} required />


<button type="submit"> {isLogin ? t.login : t.register} </button>
</form>
<div className="auth-toggle">
{isLogin ? t.noAccount : t.haveAccount} <span onClick={() => setIsLogin(!isLogin)}>{isLogin ? t.register : t.login}</span>
</div>
</div>
);
}