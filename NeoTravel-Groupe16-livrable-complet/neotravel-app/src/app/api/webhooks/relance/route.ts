import { NextResponse } from "next/server";
import { processRelancesDue } from "@/lib/email/relances";

/** Déclenchement des relances dues (n8n, cron ou manuel). */
export async function POST(req: Request) {
  const secret = req.headers.get("x-webhook-secret");
  const expected = process.env.WEBHOOK_SECRET?.trim();

  if (expected && secret !== expected) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const baseUrl =
    req.headers.get("x-app-base-url")?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    new URL(req.url).origin;

  const results = await processRelancesDue(baseUrl);

  return NextResponse.json({
    ok: true,
    traitees: results.filter((r) => r.email_sent).length,
    results,
  });
}

export async function GET() {
  return NextResponse.json({
    usage: "POST avec header x-webhook-secret (si WEBHOOK_SECRET défini)",
  });
}
