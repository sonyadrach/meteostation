import React, { useState } from "react";
import "./header.css";


export default function Header({ onOpenModal, language, setLanguage }) {
const [langOpen, setLangOpen] = useState(false);


const toggleLang = () => setLangOpen(!langOpen);


const changeLang = (lang) => {
setLanguage(lang);
localStorage.setItem("lang", lang);
setLangOpen(false);
};


return (
<header className="header">
<div className="header-left">Meteostation</div>
<div className="header-right">
<button className="login-btn" onClick={onOpenModal}>
{language === "en" ? "Login/Register" : "Увійти/Зареєструватися"}
</button>
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
</header>
);
}