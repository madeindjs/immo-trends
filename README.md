# Immo trends

Analyse les données libre des [demandes de valeurs foncières](https://www.data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres/) pour produire un graphique de l'évolution des prix par code postal

![example de graphique](example.png)

## Utilisation

Installez les dépendances

```sh
npm install
```

Initialiser les données et la base SQLite :

```sh
./init.sh
```

Cela télécharge automatiquement les fichiers CSV, les décompresse dans le dossier `data` et importe les données dans `dvf.sqlite3`.

Ensuite générez le graphique en spécifiant les codes postaux (le schéma de la base est défini dans `init.sql`) :

```sh
node draw.js 69001 69002 69003 69004 69005 69006 69007 69008 69009 69740
```

Les statistiques (médiane, moyenne, min, max) sont calculées à la volée par SQLite.

## Base de données

Le schéma de la base de données SQLite (`dvf.sqlite3`) est défini dans le fichier `init.sql`.

## Nettoyage

Pour supprimer les données calculées et la base de données :

```sh
npm run clean
```

## TODO

- [x] automatiser le téléchargement des données
- [x] utiliser SQLite pour le stockage et les calculs
- [ ] réaliser des statistiques plus profondes
