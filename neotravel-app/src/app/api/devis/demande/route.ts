import { NextResponse } from "next/server";
import { z } from "zod";
import { processWizardDemande } from "@/lib/demande-ingest";

const schema = z
  .object({
    type_trajet: z.enum(["aller_simple", "aller_retour"]),
    nb_passagers: z.number().int().min(1).max(200).optional(),
    passagers_incertain: z.boolean().optional(),
    ville_depart: z.string().min(2),
    ville_arrivee: z.string().min(2),
    date_depart: z.string().min(1).optional(),
    date_incertaine: z.boolean().optional(),
    date_retour: z.string().optional(),
    commentaire: z.string().optional(),
    type_client: z.enum(["particulier", "entreprise"]),
    nom: z.string().min(1),
    prenom: z.string().optional(),
    telephone: z.string().optional(),
    email: z.string().email(),
    societe: z.string().optional(),
    consent: z.literal(true, { message: "Le consentement est requis" }),
  })
  .superRefine((data, ctx) => {
    if (!data.date_incertaine && !data.date_depart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indiquez la date de départ ou cochez « Je ne suis pas sûr »",
        path: ["date_depart"],
      });
    }
    if (!data.passagers_incertain && (data.nb_passagers === undefined || data.nb_passagers < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indiquez le nombre de passagers ou cochez « Je ne suis pas sûr »",
        path: ["nb_passagers"],
      });
    }
    if (
      data.type_trajet === "aller_retour" &&
      !data.date_incertaine &&
      data.date_depart &&
      !data.date_retour
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indiquez la date de retour",
        path: ["date_retour"],
      });
    }
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const baseUrl = new URL(req.url).origin;
    const recap = await processWizardDemande(parsed.data, { baseUrl });

    return NextResponse.json({ ok: true, recap });
  } catch (e) {
    console.error("[api/devis/demande]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
