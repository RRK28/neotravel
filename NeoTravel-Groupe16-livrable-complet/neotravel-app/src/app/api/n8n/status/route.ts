import { NextResponse } from "next/server";
import { n8nStatus } from "@/lib/n8n/tool-handlers";

export async function GET() {
  const status = await n8nStatus();
  return NextResponse.json(status);
}
