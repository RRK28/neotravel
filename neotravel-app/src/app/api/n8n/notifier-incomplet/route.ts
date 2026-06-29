import { NextResponse } from "next/server";
import { checkN8nAuth } from "@/lib/n8n/auth";
import { n8nNotifierIncomplet } from "@/lib/n8n/tool-handlers";

export async function POST(req: Request) {
  const denied = checkN8nAuth(req);
  if (denied) return denied;

  const body = (await req.json()) as { demande_id?: string };
  if (!body.demande_id) {
    return NextResponse.json({ erreur: "demande_id requis" }, { status: 400 });
  }

  const baseUrl = new URL(req.url).origin;
  const result = await n8nNotifierIncomplet(body.demande_id, baseUrl);

  if ("erreur" in result && result.erreur) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

export async function GET() {
  return NextResponse.json({
    usage: "POST { demande_id } + header x-webhook-secret — envoie l'email incomplet si nécessaire",
  });
}
