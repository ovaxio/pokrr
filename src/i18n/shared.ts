import { fr } from "./fr";
import { en } from "./en";
import type { Locale, Dict } from "./types";

export type { Locale, Dict };

export const locales: Locale[] = ["fr", "en"];
export const defaultLocale: Locale = "fr";

const dicts: Record<Locale, Dict> = { fr, en };

export function getDict(locale: Locale): Dict {
  return dicts[locale];
}

export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)}}/g, (_, key) => vars[key] ?? "");
}
