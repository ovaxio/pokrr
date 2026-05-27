import type { Metadata } from "next";
import RoomClient from "./_RoomClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Salle ${code}`,
    description: `Rejoins la salle de planning poker ${code} sur pokrr — gratuit, sans inscription.`,
    openGraph: {
      title: `pokrr · Salle ${code}`,
      description: `Rejoins la salle ${code} sur pokrr — gratuit, sans inscription.`,
    },
  };
}

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <RoomClient roomId={code} />;
}
