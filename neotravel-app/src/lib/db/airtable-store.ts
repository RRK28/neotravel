import { randomUUID } from "crypto";
import type { DashboardStats, Demande, Devis, LogEntry, Relance, StatutDemande } from "@/lib/types";
import { isStatutDemandeFinal } from "@/lib/types";
import { getAirtableConfig } from "@/lib/db/airtable-config";

interface AirtableRecord<T> {
  airtableId: string;
  entity: T;
}

interface AirtableListResponse {
  records: Array<{
    id: string;
    fields: Record<string, string>;
  }>;
  offset?: string;
}

function parseDataField<T>(raw: string | undefined, fallbackId: string): T {
  if (!raw) {
    throw new Error(`Champ data vide pour l'enregistrement ${fallbackId}`);
  }
  return JSON.parse(raw) as T;
}

async function airtableRequest<T>(
  table: string,
  path = "",
  init?: RequestInit,
): Promise<T> {
  const { apiKey, baseId } = getAirtableConfig();
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable ${res.status} (${table}): ${body}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

async function listAllFromTable<T extends { id: string }>(table: string): Promise<AirtableRecord<T>[]> {
  const results: AirtableRecord<T>[] = [];
  let offset: string | undefined;

  do {
    const query = new URLSearchParams({ pageSize: "100" });
    if (offset) query.set("offset", offset);

    const data = await airtableRequest<AirtableListResponse>(table, `?${query.toString()}`);
    for (const record of data.records) {
      const entityId = record.fields.id ?? record.id;
      results.push({
        airtableId: record.id,
        entity: parseDataField<T>(record.fields.data, entityId),
      });
    }
    offset = data.offset;
  } while (offset);

  return results;
}

async function findByEntityId<T extends { id: string }>(
  table: string,
  entityId: string,
): Promise<AirtableRecord<T> | null> {
  const formula = encodeURIComponent(`{id}='${entityId.replace(/'/g, "\\'")}'`);
  const data = await airtableRequest<AirtableListResponse>(
    table,
    `?filterByFormula=${formula}&maxRecords=1`,
  );
  const record = data.records[0];
  if (!record) return null;

  return {
    airtableId: record.id,
    entity: parseDataField<T>(record.fields.data, entityId),
  };
}

async function insertRecord<T extends { id: string }>(table: string, entity: T): Promise<T> {
  await airtableRequest(table, "", {
    method: "POST",
    body: JSON.stringify({
      fields: {
        id: entity.id,
        data: JSON.stringify(entity),
      },
    }),
  });
  return entity;
}

async function replaceRecord<T extends { id: string }>(
  table: string,
  airtableId: string,
  entity: T,
): Promise<T> {
  await airtableRequest(table, `/${airtableId}`, {
    method: "PATCH",
    body: JSON.stringify({
      fields: {
        id: entity.id,
        data: JSON.stringify(entity),
      },
    }),
  });
  return entity;
}

export async function resetStore(): Promise<void> {
  console.warn("[airtable-store] resetStore ignoré — supprimez les enregistrements manuellement dans Airtable");
}

export async function backdateRelancesForTest(): Promise<number> {
  const past = new Date(Date.now() - 60_000).toISOString();
  const { tables } = getAirtableConfig();
  const records = await listAllFromTable<Relance>(tables.relances);
  let count = 0;

  for (const { airtableId, entity } of records) {
    if (entity.statut === "en_attente") {
      const updated = { ...entity, date_prevue: past };
      await replaceRecord(tables.relances, airtableId, updated);
      count++;
    }
  }

  return count;
}

export async function logAction(
  action: string,
  metadata?: Record<string, unknown>,
  demandeId?: string,
  tokensUsed?: number,
): Promise<LogEntry> {
  const { tables } = getAirtableConfig();
  const entry: LogEntry = {
    id: randomUUID(),
    demande_id: demandeId,
    action,
    metadata,
    tokens_used: tokensUsed,
    created_at: new Date().toISOString(),
  };
  await insertRecord(tables.logs, entry);
  return entry;
}

export async function createDemande(partial: Partial<Demande>): Promise<Demande> {
  const now = new Date().toISOString();
  const demande: Demande = {
    id: randomUUID(),
    statut: "nouveau",
    score_completude: 0,
    created_at: now,
    updated_at: now,
    ...partial,
  };
  const { tables } = getAirtableConfig();
  await insertRecord(tables.demandes, demande);
  await logAction("demande_creee", { demande_id: demande.id }, demande.id);
  return demande;
}

export async function updateDemande(
  id: string,
  patch: Partial<Demande>,
): Promise<Demande | null> {
  const { tables } = getAirtableConfig();
  const found = await findByEntityId<Demande>(tables.demandes, id);
  if (!found) return null;

  const clean = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  ) as Partial<Demande>;

  const updated: Demande = {
    ...found.entity,
    ...clean,
    updated_at: new Date().toISOString(),
  };

  await replaceRecord(tables.demandes, found.airtableId, updated);
  if (clean.statut && isStatutDemandeFinal(clean.statut)) {
    await annulerRelancesDemande(id);
  }
  return updated;
}

export async function getDemande(id: string): Promise<Demande | null> {
  const { tables } = getAirtableConfig();
  const found = await findByEntityId<Demande>(tables.demandes, id);
  return found?.entity ?? null;
}

export async function listDemandes(): Promise<Demande[]> {
  const { tables } = getAirtableConfig();
  const records = await listAllFromTable<Demande>(tables.demandes);
  return records
    .map((r) => r.entity)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createDevis(devis: Omit<Devis, "id" | "created_at">): Promise<Devis> {
  const { tables } = getAirtableConfig();
  const record: Devis = {
    ...devis,
    id: randomUUID(),
    created_at: new Date().toISOString(),
  };
  await insertRecord(tables.devis, record);
  await logAction("devis_cree", { devis_id: record.id, prix_ttc: record.prix_ttc }, record.demande_id);
  return record;
}

export async function getDevis(id: string): Promise<Devis | null> {
  const { tables } = getAirtableConfig();
  const found = await findByEntityId<Devis>(tables.devis, id);
  return found?.entity ?? null;
}

export async function listDevis(): Promise<Devis[]> {
  const { tables } = getAirtableConfig();
  const records = await listAllFromTable<Devis>(tables.devis);
  return records
    .map((r) => r.entity)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createRelance(
  partial: Omit<Relance, "id" | "created_at">,
): Promise<Relance> {
  const { tables } = getAirtableConfig();
  const relance: Relance = {
    ...partial,
    id: randomUUID(),
    created_at: new Date().toISOString(),
  };
  await insertRecord(tables.relances, relance);
  await logAction("relance_planifiee", { relance_id: relance.id, numero: relance.numero }, relance.demande_id);
  return relance;
}

export async function listRelances(): Promise<Relance[]> {
  const { tables } = getAirtableConfig();
  const records = await listAllFromTable<Relance>(tables.relances);
  return records.map((r) => r.entity);
}

export async function listLogs(limit = 100): Promise<LogEntry[]> {
  const { tables } = getAirtableConfig();
  const records = await listAllFromTable<LogEntry>(tables.logs);
  return records
    .map((r) => r.entity)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export async function annulerRelancesDemande(demandeId: string): Promise<number> {
  const { tables } = getAirtableConfig();
  const records = await listAllFromTable<Relance>(tables.relances);
  let count = 0;

  for (const { airtableId, entity } of records) {
    if (entity.demande_id === demandeId && entity.statut === "en_attente") {
      const updated: Relance = { ...entity, statut: "annulee" };
      await replaceRecord(tables.relances, airtableId, updated);
      count++;
    }
  }

  if (count > 0) {
    await logAction("relances_annulees", { demande_id: demandeId, count }, demandeId);
  }
  return count;
}

export async function getRelancesDue(): Promise<Relance[]> {
  const relances = await listRelances();
  const now = new Date();
  return relances.filter(
    (r) => r.statut === "en_attente" && new Date(r.date_prevue) <= now,
  );
}

export async function processRelance(relanceId: string): Promise<Relance | null> {
  const { tables } = getAirtableConfig();
  const found = await findByEntityId<Relance>(tables.relances, relanceId);
  if (!found) return null;

  const relance: Relance = { ...found.entity, statut: "envoyee" };
  await replaceRecord(tables.relances, found.airtableId, relance);

  const demandeFound = await findByEntityId<Demande>(tables.demandes, relance.demande_id);
  if (demandeFound) {
    let statut: StatutDemande = relance.numero === 1 ? "relance_1" : "relance_2";
    if (relance.numero === 2) {
      statut = "cloture";
    }
    const demande: Demande = {
      ...demandeFound.entity,
      statut,
      updated_at: new Date().toISOString(),
    };
    await replaceRecord(tables.demandes, demandeFound.airtableId, demande);
  }

  await logAction("relance_envoyee", { relance_id: relanceId }, relance.demande_id);
  return relance;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [demandes, devis, relances] = await Promise.all([
    listDemandes(),
    listDevis(),
    listRelances(),
  ]);

  const envoyes = devis.filter((d) => d.statut === "envoye" || d.statut === "accepte" || d.statut === "refuse");
  const acceptes = devis.filter((d) => d.statut === "accepte");
  const refuses = devis.filter((d) => d.statut === "refuse");

  let totalDelai = 0;
  let countDelai = 0;
  for (const d of devis) {
    const demande = demandes.find((dm) => dm.id === d.demande_id);
    if (demande) {
      totalDelai +=
        (new Date(d.created_at).getTime() - new Date(demande.created_at).getTime()) / 3600000;
      countDelai++;
    }
  }

  return {
    leads_recus: demandes.length,
    devis_generes: devis.length,
    devis_envoyes: envoyes.length,
    devis_acceptes: acceptes.length,
    devis_refuses: refuses.length,
    relances_en_attente: relances.filter((r) => r.statut === "en_attente").length,
    demandes_urgentes: demandes.filter(
      (d) => d.urgence === "DD_PRIORITAIRE" || d.urgence === "DD_URGENT",
    ).length,
    cas_complexes: demandes.filter((d) => d.statut === "cas_complexe").length,
    delai_moyen_heures: countDelai ? Math.round(totalDelai / countDelai) : 0,
    taux_conversion: envoyes.length ? Math.round((acceptes.length / envoyes.length) * 100) : 0,
  };
}

export async function updateDemandeStatut(id: string, statut: StatutDemande): Promise<void> {
  await updateDemande(id, { statut });
}
