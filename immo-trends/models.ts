export enum DvfType {
  "Maison" = "Maison",
  "Dépendance" = "Dépendance",
  "Appartement" = "Appartement",
  "Unknown" = "",
}
export interface YearStat {
  count: Record<DvfType, number>;
  pricePerM2Median: Record<DvfType, number>;
  towns: string[];
  firstMutationDate: string;
  lastMutationDate: string;
}

export interface CSVRow {
  id_mutation: string;
  date_mutation: "2018-12-28";
  numero_disposition: "000001";
  nature_mutation: "Vente en l'état futur d'achèvement";
  valeur_fonciere: "281500";
  adresse_numero: "";
  adresse_suffixe: "";
  adresse_nom_voie: "RUE HENRI LEBRUN";
  adresse_code_voie: "0560";
  code_postal: "69330";
  code_commune: "69282";
  nom_commune: "Meyzieu";
  code_departement: "69";
  ancien_code_commune: "";
  ancien_nom_commune: "";
  id_parcelle: "69282000DK0232";
  ancien_id_parcelle: "";
  numero_volume: "";
  lot1_numero: "9";
  lot1_surface_carrez: "76";
  lot2_numero: "";
  lot2_surface_carrez: "";
  lot3_numero: "";
  lot3_surface_carrez: "";
  lot4_numero: "";
  lot4_surface_carrez: "";
  lot5_numero: "";
  lot5_surface_carrez: "";
  nombre_lots: "1";
  code_type_local: "2";
  type_local: "Appartement";
  surface_reelle_bati: "76";
  nombre_pieces_principales: "4";
  code_nature_culture: "";
  nature_culture: "";
  code_nature_culture_speciale: "";
  nature_culture_speciale: "";
  surface_terrain: "";
  longitude: "4.999824";
  latitude: "45.768123";
}
