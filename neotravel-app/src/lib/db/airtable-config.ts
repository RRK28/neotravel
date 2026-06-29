export function isAirtableConfigured(): boolean {
  return Boolean(process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID);
}

export function getAirtableConfig() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    throw new Error("Airtable non configuré : AIRTABLE_API_KEY et AIRTABLE_BASE_ID requis");
  }
  return {
    apiKey,
    baseId,
    tables: {
      demandes: process.env.AIRTABLE_TABLE_DEMANDES ?? "Demandes",
      devis: process.env.AIRTABLE_TABLE_DEVIS ?? "Devis",
      relances: process.env.AIRTABLE_TABLE_RELANCES ?? "Relances",
      logs: process.env.AIRTABLE_TABLE_LOGS ?? "Logs",
    },
  };
}
