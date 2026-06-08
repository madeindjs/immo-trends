<template>
  <div class="page">
    <header>
      <h1>Immo trends</h1>
      <p>
        Analyse les données libres des
        <a
          href="https://www.data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres/"
          target="_blank"
          rel="noopener noreferrer"
        >
          demandes de valeurs foncières
        </a>
        pour visualiser l'évolution des prix par code postal.
      </p>
    </header>

    <section>
      <h2>Démarrage</h2>
      <ol>
        <li>Initialiser les données : <code>./init.sh</code></li>
        <li>
          Générer un graphique :
          <code>npm run draw -- 69001 69002 69003</code>
        </li>
        <li>Lancer l'interface web : <code>npm run dev</code></li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.page {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  line-height: 1.5;
  max-width: 42rem;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

h1 {
  margin-bottom: 0.5rem;
}

h2 {
  margin-top: 2rem;
  font-size: 1.125rem;
}

a {
  color: #2563eb;
}

code {
  font-family: ui-monospace, monospace;
  background: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}
</style>
