import { createContext } from "react";
import type { ThemeKey } from "./themes";

export interface ThemeContextValue {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);
