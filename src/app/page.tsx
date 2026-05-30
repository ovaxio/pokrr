import { redirect } from "next/navigation";

// Proxy handles the redirect for most clients via Accept-Language detection.
// This is a fallback for any request that slips through.
export default function RootPage() {
  redirect("/fr");
}
