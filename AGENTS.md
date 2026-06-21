# AGENTS.md

Guia para agentes de codificação (e humanos) trabalharem nesta codebase. Leia antes de propor mudanças.

## O que é o projeto

App **mobile-first** de tracking de powerlifting em **React 19 + TypeScript + Vite**, organizado como **monorepo** com npm workspaces. O frontend (`apps/web`) é hoje **client-side**, com estado global em React Context persistido em `localStorage`. Um backend (`apps/api`) e um banco de dados estão sendo introduzidos de forma incremental pelas issues da fase 2. UI em **português (pt-BR)**.

## Estrutura do monorepo

```
powerlifting-app/
├─ apps/
│  └─ web/          ← frontend React (Vite) — código em apps/web/src/
├─ packages/
│  └─ shared/       ← tipos de domínio compartilhados (@powerlifting/shared)
├─ package.json     ← raiz: npm workspaces + scripts que delegam
├─ Dockerfile       ← build do web a partir do workspace
└─ docker-compose.yml
```

- `apps/api/` será criado pela issue #7 (Fastify). Não existe enquanto essa issue não for concluída.
- Sem Turborepo/Nx: workspaces do npm são suficientes neste estágio.

## Comandos

Todos os comandos rodam da **raiz** e delegam para os workspaces:

```bash
npm install        # instalar dependências de todos os workspaces (Node 20+)
npm run dev        # dev server do apps/web com HMR
npm run build      # build do apps/web (tsc -b + vite build)
npm run preview    # servir o build de produção do apps/web
npm run lint       # ESLint do apps/web (flat config)
```

> Para rodar em um workspace específico: `npm run <script> -w @powerlifting/web`.
> Não há testes configurados. Não invente comandos de teste; valide com `npm run lint` e `npm run build`.

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
'dashboard' | 'workout' | 'templates' | 'analytics' | 'calculators' | 'settings'
```

Para **adicionar uma aba/página**:
1. Crie o componente em `apps/web/src/pages/`.
2. Adicione o valor ao tipo `Tab`.
3. Adicione o `case` em `renderActiveTab()`.
4. Adicione o botão na `bottom-nav` (com ícone do `lucide-react` e label em pt-BR).

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

### Estilo / design system "Chalk & Onyx"

- **CSS puro** em [apps/web/src/index.css](apps/web/src/index.css). Não introduza Tailwind, CSS-in-JS libs ou outros frameworks.
- Use as **CSS variables** existentes (cores, raios, transições). Não hardcode hex que já tenha token.
- Layout travado em `--max-width: 480px` (mobile-first). Componentes devem funcionar bem nessa largura.
- Estilos inline pontuais (objeto `styles`) são aceitáveis quando seguem o padrão já usado nos componentes.
- Ícones via `lucide-react`.

## Antes de finalizar

- [ ] `npm run lint` sem **novos** erros (se houver erros pré-existentes, trate em PR separado).
- [ ] `npm run build` passa (type-check incluso).
- [ ] Sem imports/variáveis não utilizados.
- [ ] Textos de UI em pt-BR.
- [ ] Nenhuma dependência nova desnecessária.

## Fluxo de trabalho (PRs e iterações)

A codebase evolui por **issues**, uma de cada vez. Para cada issue:

1. **Branch dedicado** a partir de `main` com o padrão `<type>/<issue-number>-<resumo>` (ex.: `feat/7-api-fastify`, `chore/6-monorepo-restructure`, `fix/99-correcao-calculo`). O número da issue no nome facilita rastreabilidade.
2. **Um PR por issue**, com escopo focado. Evite misturar mudanças não relacionadas.
3. **Vincule a issue** no corpo do PR com `Closes #N`.
4. Use o template em `.github/PULL_REQUEST_TEMPLATE.md`.
5. **Mantenha as docs em sincronia:** ao mudar estrutura, comandos ou caminhos, atualize no **mesmo PR** o `AGENTS.md`, o `.github/copilot-instructions.md` e os arquivos em `.github/{agents,prompts,skills}` afetados. Documentação desatualizada é tratada como bug.
6. Antes de finalizar, rode `npm run build` e `npm run lint` (sem novos erros) e marque o checklist do PR.

> Dependências entre issues importam: respeite a ordem lógica (ex.: monorepo → API → banco → auth → docker → sync) para evitar conflitos e retrabalho.

## Customizações de agente neste repo

- `.github/copilot-instructions.md` — instruções sempre ativas.
- `.github/prompts/` — prompts para tarefas comuns.
- `.github/agents/powerlifting-dev.agent.md` — agente especializado.
- `.github/skills/` — conhecimento de domínio (fórmulas, design system).
