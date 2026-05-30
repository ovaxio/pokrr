import { cookies } from "next/headers";
import { locales, defaultLocale, getDict } from "./shared";
import type { Locale } from "./types";

export { locales, defaultLocale, getDict };
export type { Locale };
export { interpolate } from "./shared";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get("locale")?.value;
  if (value && (locales as string[]).includes(value)) return value as Locale;
  return defaultLocale;
}
