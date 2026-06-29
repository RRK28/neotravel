import type { Devis, Demande } from "@/lib/types";

export function generateDevisHtml(demande: Demande, devis: Devis): string {
  const lignes = devis.lignes
    .map(
      (l) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #e8e4dc;font-size:14px">${l.libelle}</td><td style="padding:10px 0;border-bottom:1px solid #e8e4dc;text-align:right;font-size:14px">${l.montant.toFixed(2)} €</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Devis NeoTravel ${devis.id.slice(0, 8)}</title></head>
<body style="font-family:Georgia,'Times New Roman',serif;max-width:680px;margin:48px auto;color:#1a1814;background:#f7f5f0">
  <div style="background:#0f1d32;color:#fff;padding:32px 36px">
    <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.6">NeoTravel · Transport de groupe</p>
    <h1 style="margin:12px 0 0;font-size:28px;font-weight:400">Proposition de transport</h1>
    <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:13px;opacity:0.75">Réf. ${devis.id.slice(0, 8).toUpperCase()}</p>
  </div>
  <div style="background:#fff;border:1px solid #ddd8ce;border-top:none;padding:36px;font-family:Arial,sans-serif">
    <table style="width:100%;font-size:14px;margin-bottom:24px">
      <tr><td style="color:#5c574f;width:140px;padding:4px 0">Client</td><td>${demande.nom ?? "—"} ${demande.societe ? `(${demande.societe})` : ""}</td></tr>
      <tr><td style="color:#5c574f;padding:4px 0">Email</td><td>${demande.email ?? "—"}</td></tr>
      <tr><td style="color:#5c574f;padding:4px 0">Trajet</td><td>${demande.ville_depart ?? "?"} → ${demande.ville_arrivee ?? "?"}</td></tr>
      <tr><td style="color:#5c574f;padding:4px 0">Date</td><td>${demande.date_depart ?? "—"}</td></tr>
      <tr><td style="color:#5c574f;padding:4px 0">Passagers</td><td>${demande.nb_passagers ?? "?"}</td></tr>
      <tr><td style="color:#5c574f;padding:4px 0">Distance</td><td>${demande.distance_km ?? "?"} km</td></tr>
    </table>
    <table style="width:100%;border-collapse:collapse;border-top:2px solid #0f1d32">${lignes}</table>
    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e8e4dc;text-align:right;font-size:14px">
      <p style="margin:4px 0;color:#5c574f">Total HT : <strong style="color:#1a1814">${devis.prix_ht.toFixed(2)} €</strong></p>
      <p style="margin:4px 0;color:#5c574f">TVA : ${devis.tva.toFixed(2)} €</p>
      <p style="margin:12px 0 0;font-size:22px;font-family:Georgia,serif;color:#0f1d32">Total TTC : <strong>${devis.prix_ttc.toFixed(2)} €</strong></p>
    </div>
    <p style="margin-top:36px;font-size:11px;color:#5c574f;line-height:1.6">Devis sous réserve de disponibilité partenaire. Validité 15 jours. NeoTravel — intermédiation autocar depuis 2010.</p>
  </div>
</body></html>`;
}

export function generateDevisText(demande: Demande, devis: Devis): string {
  const lignes = devis.lignes.map((l) => `  - ${l.libelle}: ${l.montant.toFixed(2)} €`).join("\n");
  return `DEVIS NEOTRAVEL
Réf: ${devis.id}
Client: ${demande.nom ?? "—"} <${demande.email ?? "—"}>
Trajet: ${demande.ville_depart} → ${demande.ville_arrivee}
Date: ${demande.date_depart} | ${demande.nb_passagers} passagers

${lignes}

Total HT: ${devis.prix_ht.toFixed(2)} €
TVA: ${devis.tva.toFixed(2)} €
Total TTC: ${devis.prix_ttc.toFixed(2)} €`;
}
