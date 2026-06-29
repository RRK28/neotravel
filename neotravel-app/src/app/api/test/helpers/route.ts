import { NextResponse } from "next/server";
import { backdateRelancesForTest, resetStore } from "@/lib/db/memory-store";

const SECRET = process.env.E2E_SECRET ?? "e2e-neotravel";

function authorized(req: Request): boolean {
  if (process.env.NODE_ENV === "production" && !process.env.E2E_SECRET) return false;
  return req.headers.get("x-e2e-secret") === SECRET;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { action } = await req.json();

  if (action === "reset") {
    await resetStore();
    return NextResponse.json({ ok: true, action: "reset" });
  }

  if (action === "backdate_relances") {
    const count = await backdateRelancesForTest();
    return NextResponse.json({ ok: true, action: "backdate_relances", count });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
