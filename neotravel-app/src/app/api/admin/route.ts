import { NextResponse } from "next/server";
import {
  listDemandes,
  listDevis,
  listLogs,
  listRelances,
  getDashboardStats,
  getStoreBackend,
} from "@/lib/db/memory-store";
import { processRelancesDue } from "@/lib/email/relances";
import { isEmailConfigured, resolveEmailProvider } from "@/lib/email/config";

export async function GET() {
  const stats = await getDashboardStats();
  const demandes = await listDemandes();
  const devis = await listDevis();
  const relances = await listRelances();
  const logs = await listLogs(50);
  return NextResponse.json({
    stats,
    demandes,
    devis,
    relances,
    logs,
    storage: {
      backend: getStoreBackend(),
    },
    email: {
      configured: isEmailConfigured(),
      provider: resolveEmailProvider(),
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json();

  if (body.action === "process_relances") {
    const baseUrl = body.baseUrl ?? new URL(req.url).origin;
    const results = await processRelancesDue(baseUrl);
    return NextResponse.json({
      traitees: results.filter((r) => r.email_sent).length,
      results,
    });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
