import { NextResponse } from "next/server";

const startedAt = Date.now();

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      uptimeMs: Date.now() - startedAt,
      startedAt: new Date(startedAt).toISOString(),
      timestamp: new Date().toISOString(),
      partyKitHost: process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? null,
      env: process.env.NODE_ENV ?? "unknown",
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
