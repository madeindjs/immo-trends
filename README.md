# Immo trends

Analyse les données libre des [demandes de valeurs foncières](https://www.data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres/) pour produire un graphique de l'évolution des prix par code postal

![example de graphique](example.png)

## Utilisation

Installez les dépendances

```sh
npm install
```

Télécharger les jeux de données :

```sh
./download-data.sh
```

Cela télécharge automatiquement les fichiers CSV dans le dossier `data`.

Importer les données dans la base SQLite :

```sh
npm run import-data
```

Cela crée un fichier `immo-trends.db` avec toutes les transactions pour les appartements.

Ensuite générez le graphique en spécifiant les code postaux

```sh
node draw.js 69001 69002 69003 69004 69005 69006 69007 69008 69009 69740
```

Les statistiques (médiane, moyenne, min, max) sont calculées à la volée par SQLite.

## Base de données

Le schéma de la base de données SQLite (`immo-trends.db`) :

```sql
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  zip_code TEXT NOT NULL,
  kind TEXT NOT NULL,
  surface INTEGER,
  price INTEGER,
  price_per_sqm REAL
)
```

## Nettoyage

Pour supprimer les données calculées et la base de données :

```sh
npm run clean
```

## TODO

- [x] automatiser le téléchargement des données
- [x] utiliser SQLite pour le stockage et les calculs
- [ ] réaliser des statistiques plus profondes
