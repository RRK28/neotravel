import type { Demande } from "@/lib/types";
import { isAirtableConfigured } from "@/lib/db/airtable-config";
import * as airtableStore from "@/lib/db/airtable-store";
import * as fileStore from "@/lib/db/file-store";

const backend = isAirtableConfigured() ? airtableStore : fileStore;

export const resetStore = backend.resetStore;
export const backdateRelancesForTest = backend.backdateRelancesForTest;
export const logAction = backend.logAction;
export const createDemande = backend.createDemande;
export const updateDemande = backend.updateDemande;
export const getDemande = backend.getDemande;
export const listDemandes = backend.listDemandes;
export const createDevis = backend.createDevis;
export const getDevis = backend.getDevis;
export const listDevis = backend.listDevis;
export const createRelance = backend.createRelance;
export const listRelances = backend.listRelances;
export const annulerRelancesDemande = backend.annulerRelancesDemande;
export const listLogs = backend.listLogs;
export const getRelancesDue = backend.getRelancesDue;
export const processRelance = backend.processRelance;
export const getDashboardStats = backend.getDashboardStats;
export const updateDemandeStatut = backend.updateDemandeStatut;

export function computeCompletude(d: Partial<Demande>): number {
  const fields = [
    d.type_client,
    d.email,
    d.ville_depart,
    d.ville_arrivee,
    d.date_depart,
    d.nb_passagers,
  ];
  const filled = fields.filter((f) => f !== undefined && f !== null && f !== "").length;
  return Math.round((filled / fields.length) * 100);
}

/** Champs que le client doit fournir (pas la distance — estimée par NeoTravel). */
export function champsManquantsClient(d: Partial<Demande>): string[] {
  const missing: string[] = [];
  if (!d.type_client) missing.push("type_client");
  if (!d.email) missing.push("email");
  if (!d.ville_depart) missing.push("ville_depart");
  if (!d.ville_arrivee) missing.push("ville_arrivee");
  if (!d.date_depart && !d.date_incertaine) missing.push("date_depart");
  if (!d.nb_passagers && !d.passagers_incertain) missing.push("nb_passagers");
  return missing;
}

export function champsManquants(d: Partial<Demande>): string[] {
  return champsManquantsClient(d);
}

export function getStoreBackend(): "airtable" | "file" {
  return isAirtableConfigured() ? "airtable" : "file";
}
