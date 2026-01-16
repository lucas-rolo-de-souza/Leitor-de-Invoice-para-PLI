// Version: 1.00.00.01
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { TranslationProvider } from "./contexts/TranslationContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <TranslationProvider>
      <AuthProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </AuthProvider>
    </TranslationProvider>
  </React.StrictMode>
);
