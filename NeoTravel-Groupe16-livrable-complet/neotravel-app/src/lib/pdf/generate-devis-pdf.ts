import PDFDocument from "pdfkit";
import type { Demande, Devis } from "@/lib/types";

const COLORS = {
  navy: "#0f1d32",
  gold: "#c9920a",
  purple: "#6d28d9",
  text: "#1a1814",
  muted: "#5c574f",
  border: "#e8e4dc",
  white: "#ffffff",
  headerMuted: "#a8b8cc",
  rowAlt: "#f7f5f0",
} as const;

const MARGIN = 50;

export function refCourteDevis(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function devisPdfFilename(devis: Devis): string {
  return `devis-neotravel-${refCourteDevis(devis.id)}.pdf`;
}

function formatDateFr(value?: string): string {
  if (!value) {
    return new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function drawLabelValue(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  labelWidth: number,
  valueWidth: number,
): number {
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(10).text(label, x, y, { width: labelWidth });
  doc.fillColor(COLORS.text).text(value, x + labelWidth, y, { width: valueWidth });
  return y + 16;
}

export async function generateDevisPdf(demande: Demande, devis: Devis): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 0, bottom: MARGIN, left: MARGIN, right: MARGIN },
      info: {
        Title: `Devis NeoTravel ${refCourteDevis(devis.id)}`,
        Author: "NeoTravel",
        Subject: "Proposition de transport en autocar",
      },
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - MARGIN * 2;
    const ref = refCourteDevis(devis.id);
    const dateDevis = formatDateFr(devis.created_at);

    doc.rect(0, 0, pageWidth, 110).fill(COLORS.navy);
    doc.rect(0, 110, pageWidth, 3).fill(COLORS.gold);

    doc
      .fillColor(COLORS.white)
      .font("Helvetica")
      .fontSize(9)
      .text("NEOTRAVEL · TRANSPORT DE GROUPE", MARGIN, 28, { characterSpacing: 1 });

    doc.font("Helvetica-Bold").fontSize(22).text("Proposition de transport", MARGIN, 48);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(COLORS.headerMuted)
      .text(`Réf. ${ref}`, MARGIN, 82);

    doc.text(`Date : ${dateDevis}`, pageWidth - MARGIN - 140, 82, { width: 140, align: "right" });

    let y = 130;

    doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(11).text("Client", MARGIN, y);
    y += 20;

    y = drawLabelValue(doc, "Nom", demande.nom ?? "—", MARGIN, y, 90, contentWidth - 90);
    y = drawLabelValue(doc, "Email", demande.email ?? "—", MARGIN, y, 90, contentWidth - 90);
    if (demande.societe) {
      y = drawLabelValue(doc, "Société", demande.societe, MARGIN, y, 90, contentWidth - 90);
    }

    y += 12;
    doc.fillColor(COLORS.purple).font("Helvetica-Bold").fontSize(11).text("Résumé du trajet", MARGIN, y);
    y += 20;

    y = drawLabelValue(
      doc,
      "Trajet",
      `${demande.ville_depart ?? "—"} → ${demande.ville_arrivee ?? "—"}`,
      MARGIN,
      y,
      140,
      contentWidth - 140,
    );
    y = drawLabelValue(doc, "Date de départ", demande.date_depart ?? "—", MARGIN, y, 140, contentWidth - 140);
    y = drawLabelValue(
      doc,
      "Passagers",
      demande.nb_passagers != null ? String(demande.nb_passagers) : "—",
      MARGIN,
      y,
      140,
      contentWidth - 140,
    );
    y = drawLabelValue(
      doc,
      "Distance estimée",
      demande.distance_km != null ? `${demande.distance_km} km` : "—",
      MARGIN,
      y,
      140,
      contentWidth - 140,
    );

    y += 20;
    const tableTop = y;

    doc.rect(MARGIN, tableTop, contentWidth, 26).fill(COLORS.navy);
    doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(9);
    doc.text("Désignation", MARGIN + 10, tableTop + 8);
    doc.text("Montant HT", MARGIN, tableTop + 8, { width: contentWidth - 10, align: "right" });

    y = tableTop + 26;

    devis.lignes.forEach((ligne, index) => {
      const rowHeight = 30;
      if (y + rowHeight > doc.page.height - 130) {
        doc.addPage();
        y = MARGIN;
      }

      if (index % 2 === 1) {
        doc.rect(MARGIN, y, contentWidth, rowHeight).fill(COLORS.rowAlt);
      }

      doc.fillColor(COLORS.text).font("Helvetica").fontSize(9);
      doc.text(ligne.libelle, MARGIN + 10, y + 10, { width: contentWidth - 110 });
      doc.text(`${ligne.montant.toFixed(2)} €`, MARGIN, y + 10, {
        width: contentWidth - 10,
        align: "right",
      });

      doc
        .moveTo(MARGIN, y + rowHeight)
        .lineTo(MARGIN + contentWidth, y + rowHeight)
        .strokeColor(COLORS.border)
        .lineWidth(0.5)
        .stroke();

      y += rowHeight;
    });

    y += 18;
    const totalsX = MARGIN + contentWidth - 210;

    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(10);
    doc.text("Total HT", totalsX, y, { width: 110, align: "right" });
    doc.fillColor(COLORS.text).text(`${devis.prix_ht.toFixed(2)} €`, totalsX + 120, y, {
      width: 90,
      align: "right",
    });

    y += 18;
    doc.fillColor(COLORS.muted).text("TVA (10 %)", totalsX, y, { width: 110, align: "right" });
    doc.fillColor(COLORS.text).text(`${devis.tva.toFixed(2)} €`, totalsX + 120, y, {
      width: 90,
      align: "right",
    });

    y += 26;
    doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(13);
    doc.text("Total TTC", totalsX, y, { width: 110, align: "right" });
    doc.fillColor(COLORS.gold).font("Helvetica-Bold").fontSize(16);
    doc.text(`${devis.prix_ttc.toFixed(2)} €`, totalsX + 120, y - 1, { width: 90, align: "right" });

    y += 44;
    doc
      .moveTo(MARGIN, y)
      .lineTo(MARGIN + contentWidth, y)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();

    y += 14;
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(8).lineGap(3);
    doc.text(
      "Devis sous réserve de disponibilité partenaire. Validité 15 jours à compter de la date d'émission.",
      MARGIN,
      y,
      { width: contentWidth, align: "center" },
    );

    y += 28;
    doc.text("NeoTravel — intermédiation autocar depuis 2010", MARGIN, y, {
      width: contentWidth,
      align: "center",
    });

    doc.end();
  });
}
