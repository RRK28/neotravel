import { NextResponse } from "next/server";
import { checkN8nAuth, resolveBaseUrl } from "@/lib/n8n/auth";
import { processRelancesDue } from "@/lib/email/relances";

/** Alias n8n de POST /api/webhooks/relance — même logique et auth. */
export async function POST(req: Request) {
  const denied = checkN8nAuth(req);
  if (denied) return denied;

  const baseUrl = resolveBaseUrl(req);
  const results = await processRelancesDue(baseUrl);

  return NextResponse.json({
    ok: true,
    traitees: results.filter((r) => r.email_sent).length,
    results,
  });
}

export async function GET() {
  return NextResponse.json({
    usage: "POST avec header x-webhook-secret (alias /api/webhooks/relance)",
    alias: "/api/webhooks/relance",
  });
}
