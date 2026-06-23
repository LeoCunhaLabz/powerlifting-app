# Instruções do Copilot — Powerlifting App

App de tracking de powerlifting em **React 19 + TypeScript + Vite**, organizado como **monorepo** (npm workspaces). O frontend (`apps/web`) é hoje **client-side** com estado em React Context persistido em `localStorage`; um backend (`apps/api`) está sendo introduzido de forma incremental pelas issues da fase 2. UI em **português (pt-BR)**.

Consulte [AGENTS.md](../AGENTS.md) para o guia completo.

## Estrutura do monorepo

- `apps/web/` — frontend React (código em `apps/web/src/`).
- `apps/api/` — backend Fastify + TypeScript (código em `apps/api/src/`). Stack: Fastify 5, Zod, `fastify-type-provider-zod`, `@fastify/cors`, `@fastify/jwt` + `@fastify/rate-limit` (auth), `bcryptjs` (hash de senha). Tooling: `tsx` (dev), `tsc` (build para `dist/`), módulo NodeNext.
- `packages/shared/` — tipos de domínio compartilhados, pacote `@powerlifting/shared`.
- Comandos raiz: `npm run dev/build/lint` (web), `npm run dev:api/build:api/lint:api/start:api` (api).
- `docker-compose.yml` — **stack local de dev** (web + api + postgres `postgres:16-alpine`, volume `postgres_data`). **Produção roda no Dokploy** com web, api e Postgres como recursos nativos/separados na rede `dokploy-network` (DB gerenciado pelo Dokploy); não faça deploy deste compose lá. Migrations são aplicadas automaticamente no boot via `runMigrations()` ([apps/api/src/db/index.ts](../apps/api/src/db/index.ts)). Variáveis de ambiente em [.env.example](../.env.example) (docker-compose) e [apps/api/.env.example](../apps/api/.env.example) (dev local).

## Regras essenciais

- **Escopo mínimo:** implemente apenas o solicitado; não refatore nem adicione features fora do pedido.
- **Sem novas dependências** sem necessidade clara. Stack do frontend: React, `lucide-react`, CSS puro.
- **Persistência atual do web é `localStorage`,** sempre via o hook `useWorkout()` (não acesse `localStorage` direto nos componentes).
- **TypeScript strict:** sem imports/variáveis não usados (`noUnusedLocals`/`noUnusedParameters` ativos).
- **UI em pt-BR.**

## Padrões

- **Navegação por abas** em [apps/web/src/App.tsx](../apps/web/src/App.tsx) (sem React Router). Nova página = componente em `apps/web/src/pages/` + valor no tipo `Tab` + `case` em `renderActiveTab()` + botão na `bottom-nav`.
- **Estado** em [apps/web/src/context/WorkoutContext.tsx](../apps/web/src/context/WorkoutContext.tsx); tipos de domínio em [packages/shared/src/workout.ts](../packages/shared/src/workout.ts), importados via `@powerlifting/shared`.
- **Cálculos puros** em [apps/web/src/utils/powerlifting.ts](../apps/web/src/utils/powerlifting.ts) (e1RM arredonda 0,1; pontuações 0,01; retornam `0` para entrada inválida).
- **Estilo:** CSS puro com as variables de [apps/web/src/index.css](../apps/web/src/index.css) (tema "Chalk & Onyx", `--max-width: 480px`). Sem Tailwind/CSS-in-JS. Ícones via `lucide-react`.

## Validação

Antes de concluir: `npm run build` (na raiz) deve passar. Rode `npm run lint` e não introduza novos erros (se houver erros pré-existentes, trate em PR separado). Não há framework de testes.

## Fluxo de trabalho (PRs e iterações)

- **Um PR por issue.** Crie um branch por issue a partir de `main` com o padrão `<type>/<issue-number>-<resumo>` (ex.: `feat/7-api-fastify`, `fix/99-correcao-calculo`) e abra um PR focado, vinculando a issue (`Closes #N`).
- Use o template em `.github/PULL_REQUEST_TEMPLATE.md` ao abrir o PR.
- **Mantenha as docs em sincronia:** ao mudar estrutura, comandos ou caminhos, atualize `AGENTS.md`, este arquivo, e os `.github/{agents,prompts,skills}` afetados no mesmo PR.
- Antes de finalizar: `npm run build` e `npm run lint` sem novos erros.
