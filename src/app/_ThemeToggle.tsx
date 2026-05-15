"use client";

import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, resolveTheme, storeTheme, type ThemePref } from "../lib/theme";

const NEXT: Record<ThemePref, ThemePref> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const LABEL: Record<ThemePref, string> = {
  system: "système",
  light: "clair",
  dark: "sombre",
};

const ICON: Record<ThemePref, string> = {
  system: "◐",
  light: "☀",
  dark: "☾",
};

export default function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPref(getStoredTheme());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Écoute les changements de préférence système si pref === "system".
    if (pref !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme(resolveTheme("system"));
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [pref, mounted]);

  const cycle = () => {
    const next = NEXT[pref];
    setPref(next);
    storeTheme(next);
    applyTheme(resolveTheme(next));
  };

  // Évite un flash de label "système" avant lecture localStorage.
  const display = mounted ? pref : "system";

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Thème : ${LABEL[display]} (clic pour changer)`}
      aria-label={`Thème actuel : ${LABEL[display]}. Cliquer pour basculer.`}
      className="rounded border border-token bg-surface px-2 py-1 text-xs text-fg-soft transition hover:bg-surface-2"
    >
      <span aria-hidden="true">{ICON[display]}</span>
      <span className="sr-only sm:not-sr-only sm:ml-1">{LABEL[display]}</span>
    </button>
  );
}
