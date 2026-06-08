Typescript guideline

- Always use ESM import
- maximize the usage of standard Node library (and use `node:*` resolver)
- use only `erasableSyntaxOnly` to keep compatibility with node
- use the node version from `.nvmrc`
- use `node:test` for testing

Nuxt (frontend)

- Nuxt 4 app lives in `app/` (see [Nuxt installation](https://nuxt.com/docs/4.x/getting-started/installation))
- Configuration: `nuxt.config.ts`
- TypeScript for the Nuxt app: `tsconfig.json` (project references to `.nuxt/`)
- CLI scripts live in `scripts/` (e.g. `scripts/draw.ts`) and keep using `jsconfig.json` at the repository root
- Dev server: `npm run dev` (http://localhost:3000)
- Build: `npm run build`, preview: `npm run preview`

Doc

- place documentation in `docs/` and reference a link in `README.md`

Git

- Use conventional commit (<https://www.conventionalcommits.org/en/v1.0.0/>)
