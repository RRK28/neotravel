import { NextResponse } from "next/server";
import { getDevis, getDemande } from "@/lib/db/memory-store";
import { devisPdfFilename, generateDevisPdf } from "@/lib/pdf/generate-devis-pdf";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const devis = await getDevis(id);
  if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });

  const demande = await getDemande(devis.demande_id);
  if (!demande) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });

  const pdf = await generateDevisPdf(demande, devis);
  const filename = devisPdfFilename(devis);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
