<template>
  <div class="about-page min-h-screen bg-base-100">
    <div class="navbar bg-base-100 shadow-sm">
      <div class="navbar-start">
        <NuxtLink to="/" class="btn btn-ghost text-xl">
          immo-trends
        </NuxtLink>
      </div>
      <div class="navbar-end">
        <NuxtLink to="/" class="btn btn-ghost">
          ← Retour à la carte
        </NuxtLink>
      </div>
    </div>

    <article class="prose max-w-3xl mx-auto p-6">
      <h1>À propos</h1>
      <p>
        <strong>immo-trends</strong> est une application web qui permet de
        visualiser les transactions immobilières françaises sur une carte et
        d'observer l'évolution des prix au mètre carré à différentes échelles
        (commune, code postal, zone visible).
      </p>
      <p>
        L'interface charge dynamiquement les transactions visibles dans la
        fenêtre courante de la carte et affiche des statistiques (min, médiane,
        max au m²) ainsi qu'un graphique d'évolution.
      </p>

      <h2>Source des données</h2>
      <p>
        Les transactions proviennent des
        <strong>Demandes de valeurs foncières (DVF)</strong>, publiées en open
        data par la
        <a
          href="https://www.data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres/"
          target="_blank"
          rel="noopener"
          class="link link-primary"
        >plateforme data.gouv.fr</a>
        sous la direction générale des Finances publiques (DGFiP).
      </p>
      <p>
        Le jeu de données utilisé est&nbsp;:
        <a
          href="https://www.data.gouv.fr/api/1/datasets/r/d7933994-2c66-4131-a4da-cf7cd18040a4"
          target="_blank"
          rel="noopener"
          class="link link-primary"
        >Demandes de valeurs foncières géolocalisées</a>.
        Les fichiers CSV sont téléchargés automatiquement par le script
        <code>init.sh</code>, puis importés dans une base SQLite locale
        (<code>dvf.sqlite3</code>) à partir du schéma défini dans
        <code>init.sql</code>.
      </p>
      <p>
        Les transactions reflètent les mutations enregistrées par les
        notaires&nbsp;: elles ne couvrent pas les ventes réalisées par les
        particuliers hors acte notarié et excluent les mutations à titre
        gratuit (donations, successions).
      </p>

      <h2>Licence</h2>
      <p>
        Les données DVF sont publiées sous
        <strong>Licence Ouverte 2.0</strong> d'Etalab. Le contenu de cette
        application est réutilisable selon les termes de cette licence.
      </p>
      <p>
        <a
          href="https://www.etalab.gouv.fr/licence-ouverte-open-licence"
          target="_blank"
          rel="noopener"
          class="link link-primary"
        >Voir le texte de la Licence Ouverte 2.0</a>
      </p>
    </article>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

useHead({
  title: "À propos · immo-trends",
  htmlAttrs: { lang: "fr" },
});
</script>