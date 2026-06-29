import type { Devis, Demande } from "@/lib/types";
import { generateDevisHtml, generateDevisText } from "@/lib/pdf/generate-devis";
import { devisPdfFilename, generateDevisPdf } from "@/lib/pdf/generate-devis-pdf";
import { getAppBaseUrl } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import { logAction } from "@/lib/db/memory-store";
import { LABEL_CHAMP_MANQUANT } from "@/lib/email/champs-labels";

function salutation(demande: Demande): string {
  const nom = demande.societe ?? demande.nom;
  return nom ? `Bonjour ${nom},` : "Bonjour,";
}

function devisHtmlUrl(baseUrl: string, devisId: string): string {
  return `${baseUrl}/api/devis/${devisId}`;
}

function devisPdfUrl(baseUrl: string, devisId: string): string {
  return `${baseUrl}/api/devis/${devisId}/pdf`;
}

export async function sendDevisConfirmationEmail(
  demande: Demande,
  devis: Devis,
  baseUrl?: string,
): Promise<{ ok: boolean; simulated?: boolean; error?: string }> {
  if (!demande.email) {
    return { ok: false, error: "Pas d'email client" };
  }

  const appUrl = getAppBaseUrl(baseUrl);
  const lienHtml = devisHtmlUrl(appUrl, devis.id);
  const lienPdf = devisPdfUrl(appUrl, devis.id);
  const ref = devis.id.slice(0, 8).toUpperCase();
  const pdfFilename = devisPdfFilename(devis);

  let pdfBuffer: Buffer | undefined;
  try {
    pdfBuffer = await generateDevisPdf(demande, devis);
  } catch (err) {
    console.warn("[email] Génération PDF échouée, lien uniquement:", err);
  }

  const subject = `NeoTravel — Devis ${ref} : ${demande.ville_depart} → ${demande.ville_arrivee}`;
  const text = `${salutation(demande)}

Merci pour votre demande de transport en autocar.

Trajet : ${demande.ville_depart} → ${demande.ville_arrivee}
Date : ${demande.date_depart}
Passagers : ${demande.nb_passagers}
Distance estimée : ${demande.distance_km} km

Total TTC : ${devis.prix_ttc.toFixed(2)} € (HT : ${devis.prix_ht.toFixed(2)} €)

${pdfBuffer ? `Votre devis PDF est joint à cet email (${pdfFilename}).` : `Téléchargez votre devis PDF : ${lienPdf}`}
Consultez aussi la version en ligne : ${lienHtml}

Ce devis est valable 15 jours. Pour confirmer, répondez à cet email ou contactez NeoTravel.

— L'équipe NeoTravel`;

  const pdfCta = pdfBuffer
    ? `<p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#0f1d32">
        <strong>Votre devis PDF est joint à cet email.</strong>
      </p>`
    : `<p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:13px">
        <a href="${lienPdf}" style="display:inline-block;background:#0f1d32;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px;font-weight:600">
          Télécharger le devis PDF
        </a>
      </p>`;

  const html = generateDevisHtml(demande, devis).replace(
    "</body>",
    `<div style="margin-top:24px;font-family:Arial,sans-serif;font-size:13px;color:#5c574f">
      ${salutation(demande)}<br><br>
      Merci pour votre confiance.
      ${pdfCta}
      <p style="margin:12px 0 0">
        <a href="${lienHtml}" style="color:#6d28d9">Consulter la version web</a>
        · <a href="${lienPdf}" style="color:#6d28d9">Télécharger le PDF</a>
      </p>
    </div></body>`,
  );

  const result = await sendEmail({
    to: demande.email,
    subject,
    html,
    text: `${text}\n\n${generateDevisText(demande, devis)}`,
    attachments: pdfBuffer
      ? [{ filename: pdfFilename, content: pdfBuffer, contentType: "application/pdf" }]
      : undefined,
  });

  await logAction(
    result.ok ? "email_devis_envoye" : "email_devis_erreur",
    {
      to: demande.email,
      provider: result.provider,
      simulated: result.simulated ?? false,
      error: result.error,
      messageId: result.messageId,
    },
    demande.id,
  );

  return {
    ok: result.ok,
    simulated: result.simulated,
    error: result.error,
  };
}

export async function sendRelanceEmail(
  demande: Demande,
  devis: Devis,
  numero: 1 | 2,
  baseUrl?: string,
): Promise<{ ok: boolean; simulated?: boolean; error?: string }> {
  if (!demande.email) {
    return { ok: false, error: "Pas d'email client" };
  }

  const appUrl = getAppBaseUrl(baseUrl);
  const lien = devisPdfUrl(appUrl, devis.id);
  const ref = devis.id.slice(0, 8).toUpperCase();

  const subject =
    numero === 1
      ? `NeoTravel — Rappel devis ${ref} (${demande.ville_depart} → ${demande.ville_arrivee})`
      : `NeoTravel — Dernière relance devis ${ref}`;

  const corpsRelance =
    numero === 1
      ? `Nous n'avons pas encore reçu votre retour concernant le devis pour votre trajet ${demande.ville_depart} → ${demande.ville_arrivee} (${devis.prix_ttc.toFixed(2)} € TTC).`
      : `Dernière relance : votre devis NeoTravel (${devis.prix_ttc.toFixed(2)} € TTC) pour le ${demande.date_depart} est toujours disponible.`;

  const text = `${salutation(demande)}

${corpsRelance}

Consultez le devis : ${lien}

Répondez à cet email pour confirmer ou poser vos questions.

— NeoTravel`;

  const html = `<!DOCTYPE html>
<html lang="fr"><body style="font-family:Arial,sans-serif;max-width:560px;margin:32px auto;color:#1a1814">
  <p>${salutation(demande)}</p>
  <p>${corpsRelance}</p>
  <p><strong>Montant TTC : ${devis.prix_ttc.toFixed(2)} €</strong></p>
  <p><a href="${lien}" style="color:#0f1d32">Voir le devis en ligne</a></p>
  <p style="font-size:12px;color:#5c574f;margin-top:32px">NeoTravel — transport de groupe</p>
</body></html>`;

  const result = await sendEmail({
    to: demande.email,
    subject,
    html,
    text,
  });

  await logAction(
    result.ok ? "email_relance_envoyee" : "email_relance_erreur",
    {
      numero,
      to: demande.email,
      provider: result.provider,
      simulated: result.simulated ?? false,
      error: result.error,
    },
    demande.id,
  );

  return { ok: result.ok, simulated: result.simulated, error: result.error };
}

export function buildDevisFormUrl(demande: Demande, baseUrl?: string): string {
  const appUrl = getAppBaseUrl(baseUrl);
  const params = new URLSearchParams();
  if (demande.ville_depart) params.set("ville_depart", demande.ville_depart);
  if (demande.ville_arrivee) params.set("ville_arrivee", demande.ville_arrivee);
  if (demande.date_depart) params.set("date_depart", demande.date_depart);
  if (demande.nb_passagers) params.set("nb_passagers", String(demande.nb_passagers));
  if (demande.email) params.set("email", demande.email);
  if (demande.type_client === "particulier" || demande.type_client === "entreprise") {
    params.set("type_client", demande.type_client);
  }
  if (demande.nom) params.set("nom", demande.nom);
  const qs = params.toString();
  return qs ? `${appUrl}/devis?${qs}` : `${appUrl}/devis`;
}

export async function sendDemandeIncompleteEmail(
  demande: Demande,
  missing: string[],
  baseUrl?: string,
): Promise<{ ok: boolean; simulated?: boolean; error?: string }> {
  if (!demande.email) {
    return { ok: false, error: "Pas d'email client" };
  }

  const appUrl = getAppBaseUrl(baseUrl);
  const lienFormulaire = buildDevisFormUrl(demande, baseUrl);
  const champsLisibles = missing.map((k) => LABEL_CHAMP_MANQUANT[k] ?? k);
  const listeHtml = champsLisibles.map((c) => `<li>${c}</li>`).join("");
  const listeTexte = champsLisibles.map((c) => `• ${c}`).join("\n");

  const subject = "NeoTravel — Complétez votre demande de devis autocar";
  const text = `${salutation(demande)}

Merci pour votre intérêt pour NeoTravel. Votre demande de devis est presque complète.

Il nous manque encore :
${listeTexte}

Complétez votre demande en quelques clics :
${lienFormulaire}

Vous pouvez aussi répondre directement à cet email avec les informations manquantes.

— L'équipe NeoTravel`;

  const html = `<!DOCTYPE html>
<html lang="fr"><body style="font-family:Arial,sans-serif;max-width:560px;margin:32px auto;color:#1a1814">
  <p>${salutation(demande)}</p>
  <p>Merci pour votre intérêt pour NeoTravel. Votre demande de devis autocar est presque complète.</p>
  <p><strong>Informations encore nécessaires :</strong></p>
  <ul>${listeHtml}</ul>
  <p style="margin:24px 0">
    <a href="${lienFormulaire}" style="display:inline-block;background:#6d28d9;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;font-weight:600">
      Compléter ma demande
    </a>
  </p>
  <p style="font-size:13px;color:#5c574f">Ou répondez à cet email avec les détails manquants.</p>
  <p style="font-size:12px;color:#5c574f;margin-top:32px">NeoTravel — transport de groupe · ${appUrl}</p>
</body></html>`;

  const result = await sendEmail({
    to: demande.email,
    subject,
    html,
    text,
  });

  await logAction(
    result.ok ? "email_incomplet_envoye" : "email_incomplet_erreur",
    {
      to: demande.email,
      missing,
      provider: result.provider,
      simulated: result.simulated ?? false,
      error: result.error,
      lien_formulaire: lienFormulaire,
    },
    demande.id,
  );

  return {
    ok: result.ok,
    simulated: result.simulated,
    error: result.error,
  };
}

export async function sendRelanceIncompleteEmail(
  demande: Demande,
  missing: string[],
  numero: 1 | 2,
  baseUrl?: string,
): Promise<{ ok: boolean; simulated?: boolean; error?: string }> {
  if (!demande.email) {
    return { ok: false, error: "Pas d'email client" };
  }

  const appUrl = getAppBaseUrl(baseUrl);
  const lienFormulaire = buildDevisFormUrl(demande, baseUrl);
  const champsLisibles = missing.map((k) => LABEL_CHAMP_MANQUANT[k] ?? k);
  const listeHtml = champsLisibles.map((c) => `<li>${c}</li>`).join("");
  const listeTexte = champsLisibles.map((c) => `• ${c}`).join("\n");

  const subject =
    numero === 1
      ? "NeoTravel — Rappel : complétez votre demande de devis"
      : "NeoTravel — Dernière relance : votre demande est incomplète";

  const corpsRelance =
    numero === 1
      ? "Nous n'avons pas encore reçu toutes les informations nécessaires pour établir votre devis autocar."
      : "Dernière relance : sans ces informations, nous ne pourrons pas finaliser votre devis.";

  const text = `${salutation(demande)}

${corpsRelance}

Il nous manque encore :
${listeTexte}

Complétez votre demande en quelques clics :
${lienFormulaire}

Vous pouvez aussi répondre directement à cet email avec les informations manquantes.

— L'équipe NeoTravel`;

  const html = `<!DOCTYPE html>
<html lang="fr"><body style="font-family:Arial,sans-serif;max-width:560px;margin:32px auto;color:#1a1814">
  <p>${salutation(demande)}</p>
  <p>${corpsRelance}</p>
  <p><strong>Informations encore nécessaires :</strong></p>
  <ul>${listeHtml}</ul>
  <p style="margin:24px 0">
    <a href="${lienFormulaire}" style="display:inline-block;background:#6d28d9;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;font-weight:600">
      Compléter ma demande
    </a>
  </p>
  <p style="font-size:13px;color:#5c574f">Ou répondez à cet email avec les détails manquants.</p>
  <p style="font-size:12px;color:#5c574f;margin-top:32px">NeoTravel — transport de groupe · ${appUrl}</p>
</body></html>`;

  const result = await sendEmail({
    to: demande.email,
    subject,
    html,
    text,
  });

  await logAction(
    result.ok ? "email_relance_incomplet_envoyee" : "email_relance_incomplet_erreur",
    {
      numero,
      to: demande.email,
      missing,
      provider: result.provider,
      simulated: result.simulated ?? false,
      error: result.error,
      lien_formulaire: lienFormulaire,
    },
    demande.id,
  );

  return {
    ok: result.ok,
    simulated: result.simulated,
    error: result.error,
  };
}
