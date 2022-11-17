/**
 * @typedef CSVRow
 * @property {string} id_mutation: '2018-946919',
 * @property {string} date_mutation: '2018-12-28',
 * @property {string} numero_disposition: '000001',
 * @property {string} nature_mutation: "Vente en l'état futur d'achèvement",
 * @property {string} valeur_fonciere: '281500',
 * @property {string} adresse_numero: '',
 * @property {string} adresse_suffixe: '',
 * @property {string} adresse_nom_voie: 'RUE HENRI LEBRUN',
 * @property {string} adresse_code_voie: '0560',
 * @property {string} code_postal: '69330',
 * @property {string} code_commune: '69282',
 * @property {string} nom_commune: 'Meyzieu',
 * @property {string} code_departement: '69',
 * @property {string} ancien_code_commune: '',
 * @property {string} ancien_nom_commune: '',
 * @property {string} id_parcelle: '69282000DK0232',
 * @property {string} ancien_id_parcelle: '',
 * @property {string} numero_volume: '',
 * @property {string} lot1_numero: '9',
 * @property {string} lot1_surface_carrez: '76',
 * @property {string} lot2_numero: '',
 * @property {string} lot2_surface_carrez: '',
 * @property {string} lot3_numero: '',
 * @property {string} lot3_surface_carrez: '',
 * @property {string} lot4_numero: '',
 * @property {string} lot4_surface_carrez: '',
 * @property {string} lot5_numero: '',
 * @property {string} lot5_surface_carrez: '',
 * @property {string} nombre_lots: '1',
 * @property {string} code_type_local: '2',
 * @property {string} type_local: 'Appartement',
 * @property {string} surface_reelle_bati: '76',
 * @property {string} nombre_pieces_principales: '4',
 * @property {string} code_nature_culture: '',
 * @property {string} nature_culture: '',
 * @property {string} code_nature_culture_speciale: '',
 * @property {string} nature_culture_speciale: '',
 * @property {string} surface_terrain: '',
 * @property {string} longitude: '4.999824',
 * @property {string} latitude: '45.768123'
 */

/**
 * @param {CSVRow} row
 * @return {number}
 */
function getSurface(row) {
  return [1, 2, 3, 4, 5].map((i) => Number(row[`lot${i}_surface_carrez`] || 0)).reduce((a, b) => a + b, 0);
}

module.exports = { getSurface };
