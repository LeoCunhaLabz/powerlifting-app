# AGENTS.md

Guia para agentes de codificação (e humanos) trabalharem nesta codebase. Leia antes de propor mudanças.

## O que é o projeto

App **mobile-first** de tracking de powerlifting em **React 19 + TypeScript + Vite**, organizado como **monorepo** com npm workspaces. O frontend (`apps/web`) é hoje **client-side**, com estado global em React Context persistido em `localStorage`. Um backend (`apps/api`) e um banco de dados estão sendo introduzidos de forma incremental pelas issues da fase 2. UI em **português (pt-BR)**.

## Estrutura do monorepo

```
powerlifting-app/
├─ apps/
│  ├─ web/          ← frontend React (Vite) — código em apps/web/src/
│  └─ api/          ← backend Fastify + TypeScript — código em apps/api/src/
├─ packages/
│  └─ shared/       ← tipos de domínio compartilhados (@powerlifting/shared)
├─ package.json     ← raiz: npm workspaces + scripts que delegam
├─ .env.example     ← variáveis de ambiente do docker-compose (raiz)
├─ Dockerfile       ← build do web a partir do workspace
└─ docker-compose.yml  ← stack local (web + api + postgres); produção usa Dokploy
```

- Sem Turborepo/Nx: workspaces do npm são suficientes neste estágio.

## Comandos

Todos os comandos rodam da **raiz** e delegam para os workspaces:

```bash
npm install         # instalar dependências de todos os workspaces (Node 20+)
npm run dev         # dev server do apps/web com HMR
npm run build       # build do apps/web (tsc -b + vite build)
npm run preview     # servir o build de produção do apps/web
npm run lint        # ESLint do apps/web (flat config)
npm run test        # testes do apps/web (Vitest)
npm run dev:api     # dev server do apps/api com hot-reload (tsx watch)
npm run build:api   # compila apps/api (tsc → dist/)
npm run start:api   # inicia o servidor compilado do apps/api
npm run lint:api    # ESLint do apps/api (flat config)
npm run test:api    # testes do apps/api (Node test runner via tsx)
```

> Para rodar em um workspace específico: `npm run <script> -w @powerlifting/web` ou `-w @powerlifting/api`.
> Há testes no web e na API. Em mudanças de backend, rode também `npm run test:api`.

### Variáveis de ambiente da API

O `apps/api` valida o ambiente em [apps/api/src/env.ts](apps/api/src/env.ts) (Zod) — veja [apps/api/.env.example](apps/api/.env.example) (dev local) ou [.env.example](.env.example) (docker-compose). Além de `PORT`/`HOST`/`CORS_ORIGIN`/`DATABASE_URL`, a autenticação exige:

- `JWT_SECRET` — segredo HS256 (mín. 32 caracteres), **obrigatório**.
- `JWT_EXPIRES_IN` — expiração do access token (default `15m`).
- `REFRESH_TOKEN_EXPIRES_IN` — expiração do refresh token (default `7d`).
- `GOOGLE_CLIENT_ID` — Client ID do projeto no Google Cloud Console; **opcional** — se omitido, o endpoint `POST /auth/google` retorna 503 e o botão Google não aparece no frontend (`VITE_GOOGLE_CLIENT_ID` também deve ser definido no web).

Rotas de auth em [apps/api/src/routes/auth.ts](apps/api/src/routes/auth.ts): `POST /auth/register|login|refresh|logout` e `GET /auth/me` (protegida via decorator `authenticate`). Refresh tokens são rotacionados a cada `/auth/refresh` e armazenados como hash sha256 na tabela `sessions`; senhas usam `bcryptjs`. Nunca exponha `password_hash` em responses ou logs.

### Banco de dados e migrations

Em **produção** o app roda no **Dokploy**: web, api e PostgreSQL são recursos **nativos e separados** do Dokploy, na rede `dokploy-network`. O banco é um recurso **gerenciado pelo Dokploy** (`postgres:16`, com painel/backups próprios) — a API conecta nele via `DATABASE_URL` apontando para o hostname do serviço de banco do Dokploy (ex.: `...@powerliftingapp-powerliftingdb-...:5432/powerlifting`). O roteamento/TLS é feito pelo Traefik.

O `docker-compose.yml` da raiz é **apenas para desenvolvimento/teste local** — sobe um stack autocontido com **web + api + postgres** (`postgres:16-alpine`, volume nomeado `postgres_data`), em que a API depende do healthcheck do postgres (`service_healthy`). **Não** faça deploy desse compose no Dokploy (criaria um segundo Postgres paralelo ao gerenciado).

Migrations são aplicadas **automaticamente no boot** da API via `runMigrations()` em [apps/api/src/db/index.ts](apps/api/src/db/index.ts) (usa `drizzle-orm/postgres-js/migrator`, não a CLI `drizzle-kit`; é idempotente e pula migrations já aplicadas). Como o `src/index.ts` chama `runMigrations()` incondicionalmente, normalmente **não é preciso migrar manualmente**; o comando `npm run db:migrate -w @powerlifting/api` é **opcional** (ex.: aplicar migrations sem subir a API). Para gerar novas migrations: `npm run db:generate -w @powerlifting/api`.

## Princípios

- **Escopo mínimo.** Faça apenas o que foi pedido. Não refatore, não adicione features ou dependências sem necessidade clara.
- **Sem novas dependências** a menos que essencial. Preferir solução com a stack atual (React + lucide-react + CSS puro) no `apps/web`.
- **Frontend client-side por enquanto.** O `apps/web` persiste em `localStorage`; não adicione chamadas de rede no web até a camada de sincronização (issue #11). O backend vive em `apps/api` (em construção pela fase 2) e é desenvolvido isoladamente.
- **pt-BR na UI.** Textos visíveis ao usuário em português.
- **TypeScript strict.** `noUnusedLocals` e `noUnusedParameters` estão ativos — não deixe imports/variáveis sem uso.

## Arquitetura e convenções

### Navegação por abas (não há router)

A raiz [apps/web/src/App.tsx](apps/web/src/App.tsx) controla a aba atual via `useState<Tab>` e renderiza a página em `renderActiveTab()`. Abas válidas:

```
'dashboard' | 'workout' | 'templates' | 'analytics' | 'calculators' | 'settings' | 'more'
```

Para **adicionar uma aba/página**:
1. Crie o componente em `apps/web/src/pages/`.
2. Adicione o valor ao tipo `Tab`.
3. Adicione o `case` em `renderActiveTab()`.
4. Adicione o botão na `bottom-nav` (com ícone do `lucide-react` e label em pt-BR).

> **Navegação de 5 slots com FAB central.** A `bottom-nav` tem **4 botões + um FAB central**: Início · Rotinas · **[+ Treinar]** · Análises · **Mais**. O slot central é um FAB flutuante (`Plus`) que abre o Treino e exibe um ponto quando há treino ativo. Páginas secundárias (Calculadoras, Configurações) **não** entram na barra — vivem no hub [apps/web/src/pages/More.tsx](apps/web/src/pages/More.tsx), que recebe `onNavigate(tab)` e lista atalhos; o `App.tsx` exibe um "voltar" quando uma aba-filha do "Mais" (`calculators`/`settings`) está ativa. Para uma nova página secundária, registre-a em `More.tsx` (tipo `MoreTab`) em vez da `bottom-nav`.

### Estado global — `WorkoutContext`

- Toda leitura/escrita de estado passa por [apps/web/src/context/WorkoutContext.tsx](apps/web/src/context/WorkoutContext.tsx) via o hook `useWorkout()`.
- **Não** acesse `localStorage` diretamente nos componentes; use as funções do contexto.
- Persistência é feita por `useEffect` que sincroniza o estado com as chaves:
  - `powerlifting_app_state`, `powerlifting_active_workout`, `powerlifting_rest_timer_end`.
- Ao expor nova funcionalidade de estado: adicione a função ao `WorkoutContextType`, implemente no provider e mantenha a persistência consistente.

### Tipos de domínio

Definidos em [packages/shared/src/workout.ts](packages/shared/src/workout.ts) e exportados pelo pacote `@powerlifting/shared`: `SetState`, `ExerciseState`, `WorkoutSession`, `TemplateExercise`, `WorkoutTemplate`, `Settings`, `AppState`. Importe via `@powerlifting/shared` (não por caminho relativo) e não duplique shapes.

- `SetState.type`: `'W'` (warmup), `'N'` (normal/working), `'D'` (drop set).
- Pesos sempre numéricos na unidade corrente (`Settings.units`: `'kg' | 'lbs'`).

### Cálculos puros

Funções de cálculo ficam em [apps/web/src/utils/powerlifting.ts](apps/web/src/utils/powerlifting.ts) e devem ser **puras** (sem estado, sem efeitos colaterais). Convenções:
- Arredondamento: e1RM para 0,1; pontuações (Wilks/DOTS/IPF GL) para 0,01.
- Retorne `0` para entradas inválidas/zeradas em vez de lançar erro.
- Mantenha as tabelas/constantes (ex.: `RPE_PERCENTAGES`, `DEFAULT_PLATES_KG/LBS`) co-localizadas no arquivo.

### Estilo / design system ONYX

- **CSS puro** em [apps/web/src/index.css](apps/web/src/index.css). Não introduza Tailwind, CSS-in-JS libs ou outros frameworks.
- Use as **CSS variables** existentes (cores, raios, transições). Não hardcode hex que já tenha token.
- **Tema de acento (ONYX).** A cor de destaque é uma **única** variável `--accent` (+ `--accent-soft`, `--accent-border`, `--accent-ink`), trocada por `:root[data-theme="onyx|brass|volt"]`; padrão **Brass** (`#e3a83b`). O `WorkoutContext` aplica `data-theme` no `<html>` a partir de `settings.theme`. Para qualquer destaque (botão primário, aba ativa, badge, foco) use `var(--accent)` / `var(--accent-ink)` — **nunca** `#ffffff`/`#000000`. O alias legado `--accent-white` aponta para `var(--accent)`.
- **Marca ONYX.** Wordmark Outfit 900 + a marca (anilha de frente — anel dourado). Assets do PWA em `apps/web/public/`; `favicon.svg` é a fonte vetorial — para refazer os PNGs (`pwa-*`, maskable, apple-touch) parta dela via `@vite-pwa/assets-generator` (`pwa-assets.config.ts`).
- Layout travado em `--max-width: 480px` (mobile-first). Componentes devem funcionar bem nessa largura.
- Estilos inline pontuais (objeto `styles`) são aceitáveis quando seguem o padrão já usado nos componentes.
- Ícones via `lucide-react`.

## Antes de finalizar

- [ ] `npm run lint` sem **novos** erros (se houver erros pré-existentes, trate em PR separado).
- [ ] `npm run build` passa (type-check incluso).
- [ ] `npm run test` passa (Vitest — funções puras em `apps/web/src/utils/`).
- [ ] `npm run test:api` passa (Node test runner para rotas/utilitários da API).
- [ ] Sem imports/variáveis não utilizados.
- [ ] Textos de UI em pt-BR.
- [ ] Nenhuma dependência nova desnecessária.

## Fluxo de trabalho (PRs e iterações)

> **Fluxo completo de issues** (ciclo de vida, qual prompt usar em cada etapa, sistema de labels de prioridade/status/esforço e **como aprovar uma issue**): [.github/prompts/README.md](.github/prompts/README.md).

A codebase evolui por **issues**, uma de cada vez. Para cada issue:

1. **Branch dedicado** a partir de `main` com o padrão `<type>/<issue-number>-<resumo>` (ex.: `feat/7-api-fastify`, `chore/6-monorepo-restructure`, `fix/99-correcao-calculo`). O número da issue no nome facilita rastreabilidade.
2. **Um PR por issue**, com escopo focado. Evite misturar mudanças não relacionadas.
3. **Vincule a issue** no corpo do PR com `Closes #N`.
4. Use o template em `.github/PULL_REQUEST_TEMPLATE.md`.
5. **Mantenha as docs em sincronia:** ao mudar estrutura, comandos ou caminhos, atualize no **mesmo PR** o `AGENTS.md`, o `.github/copilot-instructions.md` e os arquivos em `.github/{agents,prompts,skills}` afetados. Documentação desatualizada é tratada como bug. Para informações de produção/VPS, consulte [docs/deploy-vps.md](docs/deploy-vps.md).
6. Antes de finalizar, rode `npm run build` e `npm run lint` (sem novos erros) e marque o checklist do PR.

> Dependências entre issues importam: respeite a ordem lógica (ex.: monorepo → API → banco → auth → docker → sync) para evitar conflitos e retrabalho.

## Customizações de agente neste repo

- `.github/copilot-instructions.md` — instruções sempre ativas.
- `.github/prompts/` — prompts para tarefas comuns; veja [.github/prompts/README.md](.github/prompts/README.md) para o fluxo de issues (gerar → planejar → executar), labels e aprovação.
- `.github/agents/powerlifting-dev.agent.md` — agente especializado.
- `.github/skills/` — conhecimento de domínio (fórmulas, design system).
