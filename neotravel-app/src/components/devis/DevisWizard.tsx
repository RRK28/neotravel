"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { DEVIS_IMAGES } from "@/lib/devis-images";
import { estVilleConnue, labelVille } from "@/lib/villes";
import { VilleSelect } from "./VilleSelect";
import type { DevisFormData, DevisRecap } from "./types";
import { defaultFormData } from "./types";

const STEPS = [
  { id: 1, label: "Votre voyage", image: DEVIS_IMAGES.stepVoyage, hint: "Itinéraire et dates" },
  { id: 2, label: "Vos informations", image: DEVIS_IMAGES.stepInfos, hint: "Détails complémentaires" },
  { id: 3, label: "Vos coordonnées", image: DEVIS_IMAGES.stepCoordonnees, hint: "Contact et validation" },
] as const;

interface DevisWizardProps {
  initialData?: Partial<DevisFormData>;
  onClose?: () => void;
  embedded?: boolean;
}

export function DevisWizard({ initialData, onClose, embedded = false }: DevisWizardProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<DevisFormData>(() => ({
    ...defaultFormData(),
    ...initialData,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [recap, setRecap] = useState<DevisRecap | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = useCallback(<K extends keyof DevisFormData>(key: K, value: DevisFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  function validateStep(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.ville_depart.trim()) e.ville_depart = "Indiquez la ville de départ";
      else if (!estVilleConnue(form.ville_depart)) {
        e.ville_depart = "Sélectionnez une ville de la liste";
      }
      if (!form.ville_arrivee.trim()) e.ville_arrivee = "Indiquez la ville d'arrivée";
      else if (!estVilleConnue(form.ville_arrivee)) {
        e.ville_arrivee = "Sélectionnez une ville de la liste";
      }
      if (
        form.ville_depart.trim() &&
        form.ville_arrivee.trim() &&
        labelVille(form.ville_depart) === labelVille(form.ville_arrivee)
      ) {
        e.ville_arrivee = "La ville d'arrivée doit être différente du départ";
      }
      if (!form.date_depart) e.date_depart = "Indiquez la date de départ";
      if (form.type_trajet === "aller_retour" && !form.date_retour) {
        e.date_retour = "Indiquez la date de retour";
      }
      if (form.nb_passagers < 1) e.nb_passagers = "Minimum 1 passager";
    }
    if (s === 3) {
      if (!form.nom.trim()) e.nom = "Indiquez votre nom";
      if (!form.prenom.trim()) e.prenom = "Indiquez votre prénom";
      if (!form.email.trim()) e.email = "Indiquez votre email";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email invalide";
      if (form.type_client === "entreprise" && !form.societe.trim()) {
        e.societe = "Indiquez le nom de l'entreprise";
      }
      if (!form.consent) e.consent = "Vous devez accepter le traitement de vos données";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, 3));
  }

  function prev() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function submit() {
    if (!validateStep(3)) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/devis/demande", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type_trajet: form.type_trajet,
          nb_passagers: form.nb_passagers,
          ville_depart: labelVille(form.ville_depart),
          ville_arrivee: labelVille(form.ville_arrivee),
          date_depart: form.date_depart,
          date_retour: form.type_trajet === "aller_retour" ? form.date_retour : undefined,
          commentaire: form.commentaire || undefined,
          type_client: form.type_client,
          nom: form.nom,
          prenom: form.prenom,
          telephone: form.telephone || undefined,
          email: form.email,
          societe: form.type_client === "entreprise" ? form.societe : undefined,
          consent: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Erreur lors de l'envoi");
        return;
      }
      setRecap(data.recap);
    } catch {
      setSubmitError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  if (recap) {
    return (
      <div
        className={
          embedded ? "devis-confirmation" : "devis-wizard-card devis-confirmation mx-auto w-full max-w-2xl"
        }
      >
        <ConfirmationView recap={recap} onClose={onClose} />
      </div>
    );
  }

  if (embedded) {
    return (
      <>
        <div className="devis-wizard-header">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-800 sm:text-xl">Demande de devis</h2>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Fermer"
              >
                ✕
              </button>
            )}
          </div>
          <Stepper current={step} />
        </div>
        <div className="devis-wizard-body">
          <StepBanner step={step} />
          {step === 1 && <StepVoyage form={form} update={update} errors={errors} />}
          {step === 2 && <StepInfos form={form} update={update} />}
          {step === 3 && <StepCoordonnees form={form} update={update} errors={errors} />}
          {submitError && (
            <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>
          )}
        </div>
        <div className="devis-wizard-footer">
          {step > 1 ? (
            <button type="button" onClick={prev} className="devis-btn-secondary">
              Retour
            </button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <button type="button" onClick={next} className="devis-btn-primary">
              Continuer
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="devis-btn-primary disabled:opacity-60"
            >
              {submitting ? "Envoi en cours…" : "Envoyer ma demande"}
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <div className={embedded ? "" : "devis-wizard-card mx-auto max-w-2xl"}>
      <div className="devis-wizard-header">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800 sm:text-xl">Demande de devis</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Fermer"
            >
              ✕
            </button>
          )}
        </div>
        <Stepper current={step} />
      </div>

      <div className="devis-wizard-body">
        <StepBanner step={step} />
        {step === 1 && <StepVoyage form={form} update={update} errors={errors} />}
        {step === 2 && <StepInfos form={form} update={update} />}
        {step === 3 && <StepCoordonnees form={form} update={update} errors={errors} />}

        {submitError && (
          <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>
        )}
      </div>

      <div className="devis-wizard-footer">
        {step > 1 ? (
          <button type="button" onClick={prev} className="devis-btn-secondary">
            Retour
          </button>
        ) : (
          <span />
        )}
        {step < 3 ? (
          <button type="button" onClick={next} className="devis-btn-primary">
            Continuer
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="devis-btn-primary disabled:opacity-60"
          >
            {submitting ? "Envoi en cours…" : "Envoyer ma demande"}
          </button>
        )}
      </div>
    </div>
  );
}

function StepBanner({ step }: { step: number }) {
  const current = STEPS.find((s) => s.id === step);
  if (!current) return null;

  return (
    <div className="devis-step-banner mb-6">
      <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28">
        <Image
          src={current.image}
          alt=""
          fill
          className="object-cover"
          sizes="112px"
        />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-wizard)]">
          Étape {current.id} sur 3
        </p>
        <h3 className="mt-1 text-lg font-bold text-slate-800">{current.label}</h3>
        <p className="mt-0.5 text-sm text-slate-500">{current.hint}</p>
      </div>
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="mt-6 flex items-center justify-between gap-2">
      {STEPS.map((s, i) => {
        const done = current > s.id;
        const active = current === s.id;
        return (
          <li key={s.id} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              {i > 0 && (
                <div
                  className={`h-0.5 flex-1 ${done || active ? "bg-[var(--color-wizard)]" : "bg-slate-200"}`}
                />
              )}
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  done
                    ? "bg-[var(--color-wizard)] text-white"
                    : active
                      ? "bg-[var(--color-wizard)] text-white ring-4 ring-violet-100"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? "✓" : s.id}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${done ? "bg-[var(--color-wizard)]" : "bg-slate-200"}`}
                />
              )}
            </div>
            <span
              className={`hidden text-center text-xs sm:block ${active ? "font-semibold text-[var(--color-wizard)]" : "text-slate-500"}`}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function StepVoyage({
  form,
  update,
  errors,
}: {
  form: DevisFormData;
  update: <K extends keyof DevisFormData>(key: K, value: DevisFormData[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-5">
      <FieldGroup label="Type de trajet">
        <div className="flex flex-wrap gap-3">
          <ToggleOption
            active={form.type_trajet === "aller_simple"}
            onClick={() => update("type_trajet", "aller_simple")}
          >
            Aller simple
          </ToggleOption>
          <ToggleOption
            active={form.type_trajet === "aller_retour"}
            onClick={() => update("type_trajet", "aller_retour")}
          >
            Aller-retour
          </ToggleOption>
        </div>
      </FieldGroup>

      <FieldGroup label="Nombre de passagers" error={errors.nb_passagers}>
        <input
          type="number"
          min={1}
          max={200}
          value={form.nb_passagers}
          onChange={(e) => update("nb_passagers", parseInt(e.target.value, 10) || 1)}
          className="devis-input w-32"
        />
      </FieldGroup>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Ville de départ" error={errors.ville_depart}>
          <VilleSelect
            value={form.ville_depart}
            onChange={(v) => update("ville_depart", v)}
            placeholder="Ex. Paris"
          />
        </FieldGroup>
        <FieldGroup label="Ville d'arrivée" error={errors.ville_arrivee}>
          <VilleSelect
            value={form.ville_arrivee}
            onChange={(v) => update("ville_arrivee", v)}
            placeholder="Ex. Lyon"
          />
        </FieldGroup>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Date de départ" error={errors.date_depart}>
          <input
            type="date"
            value={form.date_depart}
            onChange={(e) => update("date_depart", e.target.value)}
            className="devis-input"
          />
        </FieldGroup>
        {form.type_trajet === "aller_retour" && (
          <FieldGroup label="Date de retour" error={errors.date_retour}>
            <input
              type="date"
              value={form.date_retour}
              onChange={(e) => update("date_retour", e.target.value)}
              className="devis-input"
            />
          </FieldGroup>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Choisissez une ville dans la liste (16 destinations disponibles en France et en Belgique).
      </p>
    </div>
  );
}

function StepInfos({
  form,
  update,
}: {
  form: DevisFormData;
  update: <K extends keyof DevisFormData>(key: K, value: DevisFormData[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <FieldGroup label="Décrivez votre voyage (optionnel)">
        <textarea
          rows={5}
          placeholder="Horaires souhaités, arrêts intermédiaires, bagages, type d'événement…"
          value={form.commentaire}
          onChange={(e) => update("commentaire", e.target.value)}
          className="devis-input resize-y"
        />
      </FieldGroup>

      <FieldGroup label="Photo ou document (optionnel)">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 transition hover:border-[var(--color-wizard)] hover:bg-violet-50/50">
          <span className="text-2xl text-slate-400">📎</span>
          <span className="mt-2 text-sm font-medium text-slate-600">
            {form.photoName || "Ajouter une photo ou un fichier"}
          </span>
          <span className="mt-1 text-xs text-slate-400">
            Aperçu uniquement — non envoyé au serveur
          </span>
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              update("photoName", file?.name ?? "");
            }}
          />
        </label>
      </FieldGroup>
    </div>
  );
}

function StepCoordonnees({
  form,
  update,
  errors,
}: {
  form: DevisFormData;
  update: <K extends keyof DevisFormData>(key: K, value: DevisFormData[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-5">
      <FieldGroup label="Vous êtes">
        <div className="flex flex-wrap gap-3">
          <ToggleOption
            active={form.type_client === "particulier"}
            onClick={() => update("type_client", "particulier")}
          >
            Particulier
          </ToggleOption>
          <ToggleOption
            active={form.type_client === "entreprise"}
            onClick={() => update("type_client", "entreprise")}
          >
            Entreprise
          </ToggleOption>
        </div>
      </FieldGroup>

      {form.type_client === "entreprise" && (
        <FieldGroup label="Nom de l'entreprise" error={errors.societe}>
          <input
            type="text"
            value={form.societe}
            onChange={(e) => update("societe", e.target.value)}
            className="devis-input"
          />
        </FieldGroup>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Prénom" error={errors.prenom}>
          <input
            type="text"
            value={form.prenom}
            onChange={(e) => update("prenom", e.target.value)}
            className="devis-input"
          />
        </FieldGroup>
        <FieldGroup label="Nom" error={errors.nom}>
          <input
            type="text"
            value={form.nom}
            onChange={(e) => update("nom", e.target.value)}
            className="devis-input"
          />
        </FieldGroup>
      </div>

      <FieldGroup label="Téléphone">
        <input
          type="tel"
          placeholder="06 12 34 56 78"
          value={form.telephone}
          onChange={(e) => update("telephone", e.target.value)}
          className="devis-input"
        />
      </FieldGroup>

      <FieldGroup label="Email" error={errors.email}>
        <input
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          className="devis-input"
        />
      </FieldGroup>

      <label className="flex items-start gap-3 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => update("consent", e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--color-wizard)] focus:ring-[var(--color-wizard)]"
        />
        <span>
          J&apos;accepte que mes données soient utilisées pour traiter ma demande de devis, conformément
          à la politique de confidentialité NeoTravel.
        </span>
      </label>
      {errors.consent && <p className="text-sm text-red-600">{errors.consent}</p>}
    </div>
  );
}

function ConfirmationView({ recap, onClose }: { recap: DevisRecap; onClose?: () => void }) {
  const trajetLabel =
    recap.type_trajet === "aller_retour" ? "Aller-retour" : "Aller simple";

  return (
    <>
      <div className="devis-confirmation-header">
        <div className="devis-confirmation-hero">
          <div className="relative h-36 w-full sm:h-40">
            <Image
              src={DEVIS_IMAGES.confirmation}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 672px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-brand)]/90 via-[var(--color-brand)]/40 to-transparent" />
            <div className="absolute bottom-12 left-0 right-0 flex flex-wrap items-center justify-center gap-2 px-4 text-white sm:bottom-14 sm:gap-3">
              <span className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold backdrop-blur-sm">
                {recap.ville_depart}
              </span>
              <span className="text-lg" aria-hidden>
                →
              </span>
              <span className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold backdrop-blur-sm">
                {recap.ville_arrivee}
              </span>
            </div>
          </div>
        </div>
        <div className="devis-confirmation-badge" aria-hidden>
          ✓
        </div>
      </div>

      <div className="devis-confirmation-body">
        <div>
          <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
            Votre demande a bien été prise en compte
          </h2>
          <p className="mt-2 text-slate-600">
            Merci ! Nous traitons votre demande de transport en autocar.
          </p>
        </div>

        <div className="devis-recap-card text-left">
          <h3 className="font-semibold text-slate-800">Récapitulatif de votre voyage</h3>
          <dl className="mt-4 space-y-2 text-sm">
            <RecapRow label="Trajet" value={`${recap.ville_depart} → ${recap.ville_arrivee}`} />
            <RecapRow label="Type" value={trajetLabel} />
            <RecapRow label="Passagers" value={String(recap.nb_passagers)} />
            <RecapRow label="Date" value={formatDate(recap.date_depart)} />
            {recap.distance_km != null && (
              <RecapRow
                label="Distance estimée"
                value={
                  recap.duree_heures != null
                    ? `${recap.distance_km} km (~${recap.duree_heures} h)`
                    : `${recap.distance_km} km`
                }
              />
            )}
            {recap.prix_ttc != null && (
              <RecapRow
                label="Devis TTC"
                value={`${recap.prix_ttc.toFixed(2)} €${recap.prix_ht != null ? ` (HT : ${recap.prix_ht.toFixed(2)} €)` : ""}`}
                highlight
              />
            )}
            {recap.cas_complexe && recap.motif && (
              <RecapRow label="Suivi" value={recap.motif} />
            )}
          </dl>
        </div>

        <div className="rounded-lg bg-violet-50 px-4 py-3 text-sm text-violet-800">
          {recap.email_sent && !recap.email_simulated && (
            <>Un email de confirmation avec votre devis vous a été envoyé.</>
          )}
          {recap.email_sent && recap.email_simulated && (
            <>Email simulé (configurez SMTP dans .env pour l&apos;envoi réel).</>
          )}
          {!recap.email_sent && !recap.cas_complexe && recap.email_error && (
            <>Email non envoyé : {recap.email_error}</>
          )}
          {recap.cas_complexe && (
            <>Un conseiller NeoTravel vous contactera sous 24 h.</>
          )}
        </div>

        {recap.devis_id && (
          <a
            href={`/api/devis/${recap.devis_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm font-semibold text-[var(--color-wizard)] hover:underline"
          >
            Consulter le devis en ligne →
          </a>
        )}

        {onClose && (
          <button type="button" onClick={onClose} className="devis-btn-primary">
            Fermer
          </button>
        )}
      </div>
    </>
  );
}

function RecapRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`text-right font-medium ${highlight ? "text-[var(--color-wizard)]" : "text-slate-800"}`}>
        {value}
      </dd>
    </div>
  );
}

function FieldGroup({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function ToggleOption({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "border-[var(--color-wizard)] bg-violet-50 text-[var(--color-wizard)]"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
      }`}
    >
      {children}
    </button>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
