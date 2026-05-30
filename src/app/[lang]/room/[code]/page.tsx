import type { Metadata } from "next";
import { getDict, locales } from "@/i18n/shared";
import type { Locale } from "@/i18n/types";
import RoomClient from "../../../room/[code]/_RoomClient";

const SITE_URL = "https://pokrr.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<Record<string, string>>;
}): Promise<Metadata> {
  const { lang, code } = await params;
  const locale = (locales as string[]).includes(lang) ? (lang as Locale) : "fr";
  const d = getDict(locale);
  const roomLabel = d.roomLabel;
  return {
    title: `${roomLabel} ${code}`,
    description:
      locale === "fr"
        ? `Rejoins la salle de planning poker ${code} sur pokrr — gratuit, sans inscription.`
        : `Join planning poker room ${code} on pokrr — free, no sign-up.`,
    openGraph: {
      title: `pokrr · ${roomLabel} ${code}`,
      images: [{ url: `${SITE_URL}/${lang}/room/${code}/opengraph-image`, width: 1200, height: 630 }],
    },
  };
}

export default async function RoomPage({
  params,
}: {
  params: Promise<Record<string, string>>;
}) {
  const { code } = await params;
  return <RoomClient roomId={code} />;
}
