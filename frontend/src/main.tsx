import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { LangProvider } from "./i18n";
import App from "./App";
import "./styles.css";

// HashRouter: deep links work on any static host with zero server config.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <LangProvider>
        <App />
      </LangProvider>
    </HashRouter>
  </StrictMode>
);
