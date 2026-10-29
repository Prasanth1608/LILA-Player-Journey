import { useEffect, useState } from "react";

// Dark (default) or light theme. Stored per browser so a reload keeps the choice;
// storage can be blocked (private mode), so every access is guarded.
// index.html applies the stored theme before React loads, so there's no flash.
const KEY = "lila-theme";

function readStored() {
  try {
    return localStorage.getItem(KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(readStored);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      // not saved: the theme still applies for this visit
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return [theme, toggle];
}
