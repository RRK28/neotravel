import { updateDemande } from "@/lib/db/memory-store";
import type { Demande } from "@/lib/types";
import { sendDemandeIncompleteEmail } from "@/lib/email/notifications";
import { planifierRelancesIncomplet } from "@/lib/email/relances";

export { LABEL_CHAMP_MANQUANT } from "@/lib/email/champs-labels";

function missingFieldsKey(fields: string[]): string {
  return [...fields].sort().join(",");
}

/** Vrai si l'email incomplet n'a jamais été envoyé ou si la liste des champs manquants a changé. */
export function shouldNotifyIncomplete(demande: Demande, missing: string[]): boolean {
  if (!demande.email || missing.length === 0) return false;
  const prev = demande.email_incomplet_champs;
  if (!prev?.length) return true;
  return missingFieldsKey(missing) !== missingFieldsKey(prev);
}

export async function notifyDemandeIncompleteIfNeeded(
  demande: Demande,
  missing: string[],
  baseUrl?: string,
): Promise<{ sent: boolean; simulated?: boolean; error?: string }> {
  if (!shouldNotifyIncomplete(demande, missing)) {
    return { sent: false };
  }

  const mail = await sendDemandeIncompleteEmail(demande, missing, baseUrl);
  if (mail.ok) {
    await updateDemande(demande.id, {
      email_incomplet_champs: [...missing],
      email_incomplet_envoye_at: new Date().toISOString(),
    });
    if (demande.email) {
      await planifierRelancesIncomplet(demande.id, demande.email);
    }
  }

  return { sent: mail.ok, simulated: mail.simulated, error: mail.error };
}
