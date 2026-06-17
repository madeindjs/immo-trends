# Pages

L'application Nuxt utilise le routage basé sur les fichiers (`pages/`).

## Structure

```
app/
├── app.vue                 # coquille NuxtLayout + NuxtPage
├── layouts/
│   └── default.vue         # layout par défaut avec SiteNavbar
├── pages/
│   ├── index.vue           # carte DVF plein écran (100vh)
│   └── about.vue           # page statique "À propos" (fr)
└── components/
    └── SiteNavbar.vue      # barre de navigation daisyUI responsive
```

## Layout par défaut

`app/layouts/default.vue` enveloppe les pages dans un conteneur
`h-screen flex flex-col overflow-hidden` :

- `<SiteNavbar />` en haut (`shrink-0`).
- `<slot />` en dessous avec `flex-1` (la page remplit l'espace restant).

Pour que la page reste en plein écran sans scrollbar, la page racine doit
utiliser `h-full` (et non `h-screen`), car la hauteur totale est déjà imposée
par le layout.

## Ajouter une page

1. Créer `app/pages/ma-page.vue`.
2. Utiliser le layout par défaut (navbar + plein écran) ou le désactiver avec
   `definePageMeta({ layout: false })` pour une page qui scrolle
   normalement (ex. `about.vue`).
3. Ajouter le lien dans `app/components/SiteNavbar.vue`.
4. Documenter ici si la page a un comportement particulier (carte, scroll,
   layout custom).

## Pages existantes

- `/` — carte DVF interactive, plein écran, sans scrollbar de page.
- `/about` — page statique en français, sans layout par défaut, scrollable.