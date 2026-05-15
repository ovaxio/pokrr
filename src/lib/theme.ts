export type ThemePref = "system" | "light" | "dark";

const KEY = "pokrr:theme";

export function getStoredTheme(): ThemePref {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(KEY);
  if (v === "light" || v === "dark") return v;
  return "system";
}

export function storeTheme(pref: ThemePref): void {
  if (typeof window === "undefined") return;
  if (pref === "system") window.localStorage.removeItem(KEY);
  else window.localStorage.setItem(KEY, pref);
}

export function resolveTheme(pref: ThemePref): "light" | "dark" {
  if (pref === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return pref;
}

export function applyTheme(theme: "light" | "dark"): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}
