import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import HomePage from "./pages/home";
import RemindersPage from "./pages/reminders";
import HistoryPage from "./pages/history";

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </HashRouter>
  );
}
