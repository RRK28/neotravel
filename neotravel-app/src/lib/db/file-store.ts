import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { DashboardStats, Demande, Devis, LogEntry, Relance, StatutDemande } from "@/lib/types";

const DATA_DIR =
  process.env.VERCEL === "1"
    ? path.join("/tmp", "neotravel-data")
    : path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

interface Store {
  demandes: Demande[];
  devis: Devis[];
  relances: Relance[];
  logs: LogEntry[];
}

const emptyStore = (): Store => ({
  demandes: [],
  devis: [],
  relances: [],
  logs: [],
});

async function ensureStore(): Promise<Store> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    return JSON.parse(raw) as Store;
  } catch {
    const store = emptyStore();
    await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2));
    return store;
  }
}

async function save(store: Store): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2));
}

export async function resetStore(): Promise<void> {
  await save(emptyStore());
}

export async function backdateRelancesForTest(): Promise<number> {
  const store = await ensureStore();
  const past = new Date(Date.now() - 60_000).toISOString();
  let count = 0;
  for (const r of store.relances) {
    if (r.statut === "en_attente") {
      r.date_prevue = past;
      count++;
    }
  }
  await save(store);
  return count;
}

export async function logAction(
  action: string,
  metadata?: Record<string, unknown>,
  demandeId?: string,
  tokensUsed?: number,
): Promise<LogEntry> {
  const store = await ensureStore();
  const entry: LogEntry = {
    id: randomUUID(),
    demande_id: demandeId,
    action,
    metadata,
    tokens_used: tokensUsed,
    created_at: new Date().toISOString(),
  };
  store.logs.push(entry);
  await save(store);
  return entry;
}

export async function createDemande(partial: Partial<Demande>): Promise<Demande> {
  const store = await ensureStore();
  const now = new Date().toISOString();
  const demande: Demande = {
    id: randomUUID(),
    statut: "nouveau",
    score_completude: 0,
    created_at: now,
    updated_at: now,
    ...partial,
  };
  store.demandes.push(demande);
  await save(store);
  await logAction("demande_creee", { demande_id: demande.id }, demande.id);
  return demande;
}

export async function updateDemande(
  id: string,
  patch: Partial<Demande>,
): Promise<Demande | null> {
  const store = await ensureStore();
  const idx = store.demandes.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  const clean = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  ) as Partial<Demande>;
  store.demandes[idx] = {
    ...store.demandes[idx],
    ...clean,
    updated_at: new Date().toISOString(),
  };
  await save(store);
  return store.demandes[idx];
}

export async function getDemande(id: string): Promise<Demande | null> {
  const store = await ensureStore();
  return store.demandes.find((d) => d.id === id) ?? null;
}

export async function listDemandes(): Promise<Demande[]> {
  const store = await ensureStore();
  return [...store.demandes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function createDevis(devis: Omit<Devis, "id" | "created_at">): Promise<Devis> {
  const store = await ensureStore();
  const record: Devis = {
    ...devis,
    id: randomUUID(),
    created_at: new Date().toISOString(),
  };
  store.devis.push(record);
  await save(store);
  await logAction("devis_cree", { devis_id: record.id, prix_ttc: record.prix_ttc }, record.demande_id);
  return record;
}

export async function getDevis(id: string): Promise<Devis | null> {
  const store = await ensureStore();
  return store.devis.find((d) => d.id === id) ?? null;
}

export async function listDevis(): Promise<Devis[]> {
  const store = await ensureStore();
  return [...store.devis].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function createRelance(
  partial: Omit<Relance, "id" | "created_at">,
): Promise<Relance> {
  const store = await ensureStore();
  const relance: Relance = {
    ...partial,
    id: randomUUID(),
    created_at: new Date().toISOString(),
  };
  store.relances.push(relance);
  await save(store);
  await logAction("relance_planifiee", { relance_id: relance.id, numero: relance.numero }, relance.demande_id);
  return relance;
}

export async function listRelances(): Promise<Relance[]> {
  const store = await ensureStore();
  return store.relances;
}

export async function listLogs(limit = 100): Promise<LogEntry[]> {
  const store = await ensureStore();
  return [...store.logs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export async function getRelancesDue(): Promise<Relance[]> {
  const store = await ensureStore();
  const now = new Date();
  return store.relances.filter(
    (r) => r.statut === "en_attente" && new Date(r.date_prevue) <= now,
  );
}

export async function processRelance(relanceId: string): Promise<Relance | null> {
  const store = await ensureStore();
  const relance = store.relances.find((r) => r.id === relanceId);
  if (!relance) return null;

  relance.statut = "envoyee";
  const demande = store.demandes.find((d) => d.id === relance.demande_id);
  if (demande) {
    demande.statut = relance.numero === 1 ? "relance_1" : "relance_2";
    demande.updated_at = new Date().toISOString();

    if (relance.numero === 2) {
      demande.statut = "cloture";
    }
  }

  await save(store);
  await logAction("relance_envoyee", { relance_id: relanceId }, relance.demande_id);
  return relance;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const store = await ensureStore();
  const { demandes, devis, relances } = store;

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
