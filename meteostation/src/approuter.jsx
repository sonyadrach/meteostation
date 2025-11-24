import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import HomePage from "./pages/home";

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </HashRouter>
  );
}
