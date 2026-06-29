import { NextResponse } from "next/server";
import { checkN8nAuth } from "@/lib/n8n/auth";
import { n8nQualifier, type QualifierInput } from "@/lib/n8n/tool-handlers";

export async function POST(req: Request) {
  const denied = checkN8nAuth(req);
  if (denied) return denied;

  const body = (await req.json()) as QualifierInput;
  const result = await n8nQualifier(body);

  if ("erreur" in result && result.erreur && !("demande_id" in result)) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

export async function GET() {
  return NextResponse.json({
    usage: "POST avec body { text } ou champs demande + header x-webhook-secret",
    example: {
      text: "Devis 35 personnes Paris à Lyon le 15/07/2026, email demo@neotravel.test",
    },
  });
}
