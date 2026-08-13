
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite failed to load a chunk (likely due to a new deployment). Refreshing page...');
  window.location.reload();
});

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";

import { ThemeProvider } from "./context/ThemeContext";

import "./styles/fonts.css";
import "./styles/tailwind.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);