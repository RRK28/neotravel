import { NextResponse } from "next/server";
import { checkN8nAuth } from "@/lib/n8n/auth";
import { n8nCalculerDevis } from "@/lib/n8n/tool-handlers";

export async function POST(req: Request) {
  const denied = checkN8nAuth(req);
  if (denied) return denied;

  const body = await req.json();
  const demande_id = body.demande_id as string | undefined;

  if (!demande_id) {
    return NextResponse.json({ erreur: "demande_id requis" }, { status: 400 });
  }

  const result = await n8nCalculerDevis(demande_id);

  if ("erreur" in result && result.erreur) {
    const status = result.erreur === "Demande introuvable" ? 404 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}

export async function GET() {
  return NextResponse.json({
    usage: "POST { demande_id } + header x-webhook-secret",
  });
}
