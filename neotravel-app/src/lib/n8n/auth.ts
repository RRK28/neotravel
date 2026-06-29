import { NextResponse } from "next/server";

/** Vérifie le header x-webhook-secret (même règle que /api/webhooks/relance). */
export function checkN8nAuth(req: Request): NextResponse | null {
  const secret = req.headers.get("x-webhook-secret");
  const expected = process.env.WEBHOOK_SECRET?.trim();

  if (expected && secret !== expected) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  return null;
}

export function resolveBaseUrl(req: Request): string {
  return (
    req.headers.get("x-app-base-url")?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    new URL(req.url).origin
  );
}
