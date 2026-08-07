import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = window.localStorage.getItem("founderpilot-theme");
    return stored === "light" ? "light" : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === "light") {
      root.classList.add("light");
      body.classList.remove("dark");
      body.classList.add("light");
    } else {
      root.classList.remove("light");
      body.classList.add("dark");
      body.classList.remove("light");
    }
    window.localStorage.setItem("founderpilot-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggle };
}
