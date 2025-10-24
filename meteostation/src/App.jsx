import React, { useState, useEffect } from "react";
import Header from "./components/header/header";
import Modal from "./components/modal/modal";
import Auth from "./components/auth/auth";
import "./App.css";


export default function App() {
const [isModalOpen, setIsModalOpen] = useState(false);
const [language, setLanguage] = useState("en");


useEffect(() => {
const lang = localStorage.getItem("lang");
if (lang) setLanguage(lang);
}, []);


return (
<div className="app-container">
<Header onOpenModal={() => setIsModalOpen(true)} language={language} setLanguage={setLanguage} />
{/* Тут буде WeatherWidget */}
<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
<Auth language={language} />
</Modal>
</div>
);
}