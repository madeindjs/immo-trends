import type { DvfRow, DvfRowDetail } from "../../types.ts";
import { formatMutationDate } from "./format-date.ts";
import { formatPropertyPrice } from "./format-price.ts";

export type DvfDetailFieldKey = keyof DvfRow;

export type DvfDetailField = {
  section: string;
  key: DvfDetailFieldKey;
  label: string;
};

export const DVF_DETAIL_FIELDS: DvfDetailField[] = [
  { section: "Mutation", key: "id_mutation", label: "Identifiant de mutation" },
  { section: "Mutation", key: "date_mutation", label: "Date de mutation" },
  { section: "Mutation", key: "numero_disposition", label: "Numéro de disposition" },
  { section: "Mutation", key: "nature_mutation", label: "Nature de la mutation" },
  { section: "Mutation", key: "valeur_fonciere", label: "Valeur foncière" },
  { section: "Adresse", key: "adresse_numero", label: "Numéro" },
  { section: "Adresse", key: "adresse_suffixe", label: "Suffixe" },
  { section: "Adresse", key: "adresse_nom_voie", label: "Voie" },
  { section: "Adresse", key: "adresse_code_voie", label: "Code voie" },
  { section: "Adresse", key: "code_postal", label: "Code postal" },
  { section: "Adresse", key: "code_commune", label: "Code commune" },
  { section: "Adresse", key: "nom_commune", label: "Commune" },
  { section: "Adresse", key: "code_departement", label: "Département" },
  {
    section: "Adresse",
    key: "ancien_code_commune",
    label: "Ancien code commune",
  },
  {
    section: "Adresse",
    key: "ancien_nom_commune",
    label: "Ancien nom de commune",
  },
  { section: "Parcelle", key: "id_parcelle", label: "Identifiant de parcelle" },
  {
    section: "Parcelle",
    key: "ancien_id_parcelle",
    label: "Ancien identifiant de parcelle",
  },
  { section: "Parcelle", key: "numero_volume", label: "Numéro de volume" },
  { section: "Local", key: "code_type_local", label: "Code type de local" },
  { section: "Local", key: "type_local", label: "Type de local" },
  { section: "Local", key: "surface_reelle_bati", label: "Surface bâtie" },
  {
    section: "Local",
    key: "nombre_pieces_principales",
    label: "Pièces principales",
  },
  { section: "Lots", key: "nombre_lots", label: "Nombre de lots" },
  { section: "Lots", key: "lot1_numero", label: "Lot 1" },
  { section: "Lots", key: "lot1_surface_carrez", label: "Surface Carrez lot 1" },
  { section: "Lots", key: "lot2_numero", label: "Lot 2" },
  { section: "Lots", key: "lot2_surface_carrez", label: "Surface Carrez lot 2" },
  { section: "Lots", key: "lot3_numero", label: "Lot 3" },
  { section: "Lots", key: "lot3_surface_carrez", label: "Surface Carrez lot 3" },
  { section: "Lots", key: "lot4_numero", label: "Lot 4" },
  { section: "Lots", key: "lot4_surface_carrez", label: "Surface Carrez lot 4" },
  { section: "Lots", key: "lot5_numero", label: "Lot 5" },
  { section: "Lots", key: "lot5_surface_carrez", label: "Surface Carrez lot 5" },
  {
    section: "Terrain",
    key: "code_nature_culture",
    label: "Code nature de culture",
  },
  { section: "Terrain", key: "nature_culture", label: "Nature de culture" },
  {
    section: "Terrain",
    key: "code_nature_culture_speciale",
    label: "Code nature de culture spéciale",
  },
  {
    section: "Terrain",
    key: "nature_culture_speciale",
    label: "Nature de culture spéciale",
  },
  { section: "Terrain", key: "surface_terrain", label: "Surface du terrain" },
  { section: "Coordonnées", key: "latitude", label: "Latitude" },
  { section: "Coordonnées", key: "longitude", label: "Longitude" },
];

const SURFACE_KEYS = new Set<DvfDetailFieldKey>([
  "surface_reelle_bati",
  "lot1_surface_carrez",
  "lot2_surface_carrez",
  "lot3_surface_carrez",
  "lot4_surface_carrez",
  "lot5_surface_carrez",
  "surface_terrain",
]);

const COORDINATE_KEYS = new Set<DvfDetailFieldKey>(["latitude", "longitude"]);

function isEmptyValue(value: unknown): boolean {
  return value == null || value === "";
}

export function formatDvfDetailValue(
  key: DvfDetailFieldKey,
  value: DvfRowDetail[DvfDetailFieldKey],
): string {
  if (isEmptyValue(value)) {
    return "—";
  }

  if (key === "valeur_fonciere") {
    return formatPropertyPrice(value as string);
  }

  if (key === "date_mutation") {
    return formatMutationDate(value as string);
  }

  if (SURFACE_KEYS.has(key) && typeof value === "number") {
    return `${value} m²`;
  }

  if (COORDINATE_KEYS.has(key) && typeof value === "number") {
    return value.toFixed(6);
  }

  return String(value);
}

export type DvfDetailSection = {
  title: string;
  fields: Array<{ key: DvfDetailFieldKey; label: string; value: string }>;
};

export function buildDvfDetailSections(
  row: DvfRowDetail,
): DvfDetailSection[] {
  const sections = new Map<string, DvfDetailSection["fields"]>();

  for (const field of DVF_DETAIL_FIELDS) {
    const value = formatDvfDetailValue(field.key, row[field.key]);
    const fields = sections.get(field.section) ?? [];
    fields.push({ key: field.key, label: field.label, value });
    sections.set(field.section, fields);
  }

  return [...sections.entries()].map(([title, fields]) => ({ title, fields }));
}

export function buildDvfDetailTitle(row: DvfRowDetail): string {
  const numero = row.adresse_numero
    ? `${row.adresse_numero}${row.adresse_suffixe ?? ""}`
    : "";
  const voie = row.adresse_nom_voie ?? "";
  const address = [numero, voie].filter(Boolean).join(" ");

  if (address) {
    return address;
  }

  return row.type_local || "Transaction DVF";
}

export function buildDvfDetailSubtitle(row: DvfRowDetail): string {
  return formatPropertyPrice(row.valeur_fonciere);
}
