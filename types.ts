/**
 * DVF (Demande de Valeur Foncière) row interface.
 * For extended field descriptions, consult the [official notice](https://www.data.gouv.fr/fr/datasets/r/d573456c-76eb-4276-b91c-e6b9c89d6656).
 */
export interface DvfRow {
  /** Identifiant de mutation (non stable, sert à grouper les lignes) */
  id_mutation: string;
  /** Date de la mutation au format ISO-8601 (YYYY-MM-DD) */
  date_mutation: string;
  /** Numéro de disposition */
  numero_disposition: string;
  /** Nature de la mutation */
  nature_mutation: string;
  /** Valeur foncière (séparateur décimal = point) */
  valeur_fonciere: string;
  /** Numéro de l'adresse */
  adresse_numero: string;
  /** Suffixe du numéro de l'adresse (B, T, Q) */
  adresse_suffixe: string;
  /** Nom de la voie de l'adresse */
  adresse_nom_voie: string;
  /** Code FANTOIR de la voie (4 caractères) */
  adresse_code_voie: string;
  /** Code postal (5 caractères) */
  code_postal: string;
  /** Code commune INSEE (5 caractères) */
  code_commune: string;
  /** Nom de la commune (accentué) */
  nom_commune: string;
  /** Code département INSEE (2 ou 3 caractères) */
  code_departement: string;
  /** Ancien code commune INSEE (si différent lors de la mutation) */
  ancien_code_commune: string;
  /** Ancien nom de la commune (si différent lors de la mutation) */
  ancien_nom_commune: string;
  /** Identifiant de parcelle (14 caractères) */
  id_parcelle: string;
  /** Ancien identifiant de parcelle (si différent lors de la mutation) */
  ancien_id_parcelle: string;
  /** Numéro de volume */
  numero_volume: string;
  /** Numéro du lot 1 */
  lot1_numero: string;
  /** Surface Carrez du lot 1 */
  lot1_surface_carrez: number;
  /** Numéro du lot 2 */
  lot2_numero: string;
  /** Surface Carrez du lot 2 */
  lot2_surface_carrez: number;
  /** Numéro du lot 3 */
  lot3_numero: string;
  /** Surface Carrez du lot 3 */
  lot3_surface_carrez: number;
  /** Numéro du lot 4 */
  lot4_numero: string;
  /** Surface Carrez du lot 4 */
  lot4_surface_carrez: number;
  /** Numéro du lot 5 */
  lot5_numero: string;
  /** Surface Carrez du lot 5 */
  lot5_surface_carrez: number;
  /** Nombre de lots */
  nombre_lots: number;
  /** Code de type de local */
  code_type_local: string;
  /** Libellé du type de local */
  type_local: string;
  /** Surface réelle du bâti */
  surface_reelle_bati: number;
  /** Nombre de pièces principales */
  nombre_pieces_principales: number;
  /** Code de nature de culture */
  code_nature_culture: string;
  /** Libellé de nature de culture */
  nature_culture: string;
  /** Code de nature de culture spéciale */
  code_nature_culture_speciale: string;
  /** Libellé de nature de culture spéciale */
  nature_culture_speciale: string;
  /** Surface du terrain */
  surface_terrain: number;
  /** Longitude du centre de la parcelle concernée (WGS-84) */
  longitude: number;
  /** Latitude du centre de la parcelle concernée (WGS-84) */
  latitude: number;
}

/** Price-per-m² statistics for the current map bounding box. */
export type DvfMapStats = {
  medianPricePerSqm: number | null;
  minPricePerSqm: number | null;
  maxPricePerSqm: number | null;
};

/** How trend points are grouped in the map trends API. */
export type DvfTrendGroupBy = "month" | "quarter" | "year";

/** Price-per-m² trend point for the map trends API.
 *  `month` holds the period key: YYYY-MM, YYYY-Qn, or YYYY. */
export type DvfPriceTrendPoint = {
  month: string;
  medianPricePerSqm: number | null;
  count: number;
};

export type DvfTrendsResponse = {
  trends: DvfPriceTrendPoint[];
};

/** Full DVF row returned by the detail API (nullable fields from SQLite). */
export type DvfRowDetail = {
  rowid: number;
} & {
  [K in keyof DvfRow]: DvfRow[K] | null;
};

/** Lightweight DVF point returned by the map API. */
export type DvfMapPoint = {
  rowid: number;
  id_mutation: string;
  date_mutation: string;
  valeur_fonciere: string;
  type_local: string;
  surface_reelle_bati: number | null;
  surface_terrain: number | null;
  nombre_pieces_principales: number | null;
  code_postal: string;
  nom_commune: string;
  adresse_numero: string;
  adresse_suffixe: string;
  adresse_nom_voie: string;
  latitude: number;
  longitude: number;
};
