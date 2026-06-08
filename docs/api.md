# API

## `GET /api/dvf`

Returns DVF transaction points for the current map bounding box.

### Query parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `north` | yes | Northern latitude bound (WGS-84) |
| `south` | yes | Southern latitude bound (WGS-84) |
| `east` | yes | Eastern longitude bound (WGS-84) |
| `west` | yes | Western longitude bound (WGS-84) |
| `limit` | no | Maximum number of points to return. Default: `2000`. Max: `5000`. |
| `type_local` | no | Filter by property type. Repeat or comma-separate values, e.g. `Maison`, `Appartement` |
| `year` | no | Filter by mutation year (`YYYY`). Sets both `year_min` and `year_max` |
| `year_min` | no | Earliest mutation year (`YYYY`) |
| `year_max` | no | Latest mutation year (`YYYY`) |
| `surface_min` | no | Minimum built surface in m² (`surface_reelle_bati`) |
| `surface_max` | no | Maximum built surface in m² (`surface_reelle_bati`) |
| `price_per_sqm_min` | no | Minimum price per m² in € (`valeur_fonciere / surface_reelle_bati`) |
| `price_per_sqm_max` | no | Maximum price per m² in € (`valeur_fonciere / surface_reelle_bati`) |

### Response

```json
{
  "points": [
    {
      "id_mutation": "2021-1",
      "date_mutation": "2021-01-05",
      "valeur_fonciere": "185000",
      "type_local": "Maison",
      "surface_reelle_bati": 97,
      "code_postal": "01370",
      "nom_commune": "Val-Revermont",
      "adresse_numero": "5080",
      "adresse_suffixe": "",
      "adresse_nom_voie": "CHE DE VOGELAS",
      "latitude": 46.327101,
      "longitude": 5.386107
    }
  ],
  "truncated": false,
  "stats": {
    "medianPricePerSqm": 2150.5,
    "minPricePerSqm": 1200,
    "maxPricePerSqm": 3800
  }
}
```

`truncated` is `true` when the number of returned points equals the requested `limit`, meaning more transactions may exist in the bounding box.

`stats` contains price-per-m² statistics (`valeur_fonciere / surface_reelle_bati`) computed over **all** matching transactions in the bounding box (not only the returned `points`). Rows without a valid built surface or price are excluded. All three fields are `null` when no qualifying rows exist.

### Errors

| Status | Meaning |
|--------|---------|
| `400` | Missing or invalid query parameters |
| `503` | `dvf.sqlite3` is missing. Run `./init.sh` first. |

### Example

```sh
curl "http://localhost:3000/api/dvf?north=46.5&south=46.2&east=5.5&west=5.0&type_local=Maison&year=2021"
```

## `GET /api/dvf-trends`

Returns yearly price-per-m² trends for the current map bounding box.

### Query parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `north` | yes | Northern latitude bound (WGS-84) |
| `south` | yes | Southern latitude bound (WGS-84) |
| `east` | yes | Eastern longitude bound (WGS-84) |
| `west` | yes | Western longitude bound (WGS-84) |
| `type_local` | no | Filter by property type. Repeat or comma-separate values, e.g. `Maison`, `Appartement` |
| `year` | no | Filter by mutation year (`YYYY`). Sets both `year_min` and `year_max` |
| `year_min` | no | Earliest mutation year (`YYYY`) |
| `year_max` | no | Latest mutation year (`YYYY`) |
| `surface_min` | no | Minimum built surface in m² (`surface_reelle_bati`) |
| `surface_max` | no | Maximum built surface in m² (`surface_reelle_bati`) |
| `price_per_sqm_min` | no | Minimum price per m² in € (`valeur_fonciere / surface_reelle_bati`) |
| `price_per_sqm_max` | no | Maximum price per m² in € (`valeur_fonciere / surface_reelle_bati`) |

### Response

```json
{
  "trends": [
    {
      "year": 2020,
      "medianPricePerSqm": 3150,
      "count": 128
    },
    {
      "year": 2021,
      "medianPricePerSqm": 3280,
      "count": 142
    }
  ]
}
```

Each trend point aggregates all qualifying transactions for that year in the bounding box. Rows without a valid built surface or price are excluded. `medianPricePerSqm` is `null` when no qualifying prices exist for that year.

### Errors

| Status | Meaning |
|--------|---------|
| `400` | Missing or invalid query parameters |
| `503` | `dvf.sqlite3` is missing. Run `./init.sh` first. |

### Example

```sh
curl "http://localhost:3000/api/dvf-trends?north=46.5&south=46.2&east=5.5&west=5.0&type_local=Maison&year_min=2020&year_max=2022"
```
