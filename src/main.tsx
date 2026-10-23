import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import { bootstrapUserContent } from "@/lib/userContent";
import { applyTheme, getTheme } from "@/lib/theme";
import "@/styles/base.css";
import "@/styles/layout.css";
import "@/styles/components.css";
import "@/styles/home.css";
import "@/styles/pages.css";
import "@/styles/detail.css";
import "@/styles/detail-pages.css";
import "@/styles/immersive.css";
import "@/styles/create.css";
import "@/styles/account.css";
import "@/styles/themes.css";

bootstrapUserContent();
applyTheme(getTheme());

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
