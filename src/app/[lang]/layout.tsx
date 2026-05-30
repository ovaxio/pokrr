import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { DictProvider } from "@/i18n/DictContext";
import { locales, getDict } from "@/i18n/shared";
import type { Locale } from "@/i18n/types";

const SITE_URL = "https://pokrr.app";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Record<string, string>>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    alternates: {
      canonical: `${SITE_URL}/${lang}`,
      languages: Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}`])),
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<Record<string, string>>;
}) {
  const { lang } = await params;
  if (!(locales as string[]).includes(lang)) notFound();
  const dict = getDict(lang as Locale);
  return <DictProvider value={dict}>{children}</DictProvider>;
}
