import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import "./index.css";

// Apply saved or Telegram theme on initial load
const savedTheme = localStorage.getItem("gm_theme");
if (savedTheme === "dark" || savedTheme === "light") {
  document.documentElement.classList.toggle("dark", savedTheme === "dark");
} else {
  // Try to detect Telegram color scheme
  const tgColorScheme = window.Telegram?.WebApp?.colorScheme;
  if (tgColorScheme === "dark") {
    document.documentElement.classList.add("dark");
  }
}

// Green Market Mini App entry point — v2
createRoot(document.getElementById("root")!).render(<App />);
