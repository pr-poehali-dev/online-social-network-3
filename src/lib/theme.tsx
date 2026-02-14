import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeKey = "dark-green" | "dark-blue" | "crystal" | "white-yellow";

export const themeNames: Record<ThemeKey, string> = {
  "dark-green": "Tёмно-зелёная",
  "dark-blue": "Тёмно-синяя",
  "crystal": "Кристальная",
  "white-yellow": "Бело-жёлтая",
};

interface ThemeContextType {
  theme: ThemeKey;
  setTheme: (t: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark-green",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>(() => {
    return (localStorage.getItem("buzzzy_theme") as ThemeKey) || "dark-green";
  });

  const setTheme = (t: ThemeKey) => {
    setThemeState(t);
    localStorage.setItem("buzzzy_theme", t);
    document.documentElement.setAttribute("data-theme", t);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
