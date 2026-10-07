# Fundação da nova identidade do app: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** colocar no app a identidade V3 (tokens, base global, tema único) e os componentes base com catálogo, para que as issues de tela (#339 em diante) sejam refeitas sobre o sistema novo.

**Architecture:** são duas issues novas, cada uma com o próprio branch e PR (etapas 1 e 2 da spec, §7).
- **Etapa 1:** cria `src/styles/tokens.css` e transforma os tokens antigos de `index.css` em apelidos dos novos. Assim o app inteiro troca de paleta e de fonte sem mexer nas telas. Também remove os temas, os gradientes e o botão central dourado fixo.
- **Etapa 2:** cria os componentes em `src/ui/` com CSS Modules, a lógica em funções puras testadas no Vitest e um catálogo `/catalogo` que só existe no `npm run dev`.

**Tech Stack:** React 19, TypeScript strict, Vite 8 (CSS Modules nativo), Vitest 4 (ambiente `node`, só arquivos `.ts`), `vite-plugin-pwa` (Workbox), `lucide-react` e Playwright (já instalado) para capturas.

**Spec:** [docs/superpowers/specs/2026-10-06-redesign-identidade-app-design.md](../specs/2026-10-06-redesign-identidade-app-design.md). A referência visual são os HTML em `docs/superpowers/specs/2026-10-06-redesign-identidade-app/`.

**Fora deste plano:** a etapa 0 (bugs de dado: #328, #329, #331 a #335) e as etapas 3 a 6 (telas). Elas seguem o fluxo normal (`resolver-issue`) usando a spec, e cada issue tem o próprio plano.

## Global Constraints

- **Stack:** CSS puro mais CSS Modules. Zero dependência nova: nada de Testing Library, Storybook, `clsx`, `cva` ou biblioteca de animação.
- **Ícones:** só `lucide-react`.
- **Copy:** UI em pt-BR, sem emoji e sem travessão (—) em texto visível. A meia-risca (–) só aparece em faixa de números.
- **TypeScript strict:** `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (import de tipo com `import type`) e `erasableSyntaxOnly` (sem `enum`).
- **Tokens:** valores copiados da spec §3, sem arredondar: `--surface-0 #0c0b0a`, `--surface-1 #171614`, `--surface-2 #211f1c`, `--surface-3 #2b2925`, `--line #26231f`, `--text-1 #f2efe8`, `--text-2 #9c978e`, `--text-3 #87827b`, `--text-off #5f5b55`, `--now #e3a83b`, `--now-ink #1a1304`, `--danger #e5544b`, `--danger-ink #1c0605`.
- **Dourado (`--now`):** só na ação principal (uma por tela), na série atual, no descanso correndo, no dia de hoje, na semana atual do bloco, no botão central com treino em andamento e no foco de teclado. Nunca em aba ativa, opção selecionada, recorde, ícone ou decoração.
- **Tipografia:**
  - números e títulos em Barlow Condensed (`--font-num`);
  - texto em Plus Jakarta Sans (`--font-text`);
  - Outfit 900 só no wordmark;
  - nada abaixo de 11 px, campos com 16 px ou mais, todo número em `tabular-nums`.
- **Toque e movimento:**
  - alvo de toque de 44 px (mínimo absoluto de 40);
  - botão pressionado com `scale(0.97)`;
  - com `prefers-reduced-motion`, nada se move.
- **Estado:** só via `useWorkout()`. Nunca `localStorage` em componente.
- **Skills vendorizadas:** não editar os arquivos em `.claude/skills/` de terceiros (Impeccable, Emil). A `design-onyx` é do projeto e pode ser editada.
- **Fluxo:**
  - branch `feat/<N>-<resumo>` e um PR por issue, com `Closes #N` e o template `.github/PULL_REQUEST_TEMPLATE.md`;
  - revisão de design da `design-onyx` §5 na seção **Design** do PR;
  - `npm run build`, `npm run lint` e `npm run test` passando antes do PR;
  - commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Primeira abertura sem internet:** as fontes ainda não estão no cache, então números e títulos caem em `Arial Narrow` ou na fonte do sistema. Nada pode estourar a largura nem ficar ilegível. Teste: captura do catálogo com `--sem-fontes` (Task 10 e Task 17).
2. **Treino com mais de 1 hora:** o cronômetro vira `1:02:33` e precisa caber no botão central sem cortar. Teste: `formatElapsed` com 3753 s (Task 5), e o botão cresce com `min-width` e `padding`.
3. **Descanso estendido além do padrão (+15 s), zerado ou com total inválido:** os segmentos são cortados no intervalo, sem erro e sem segmento a mais. Teste: `countdownFilled` e `segmentStates` (Task 11).
4. **Números grandes, lbs e valor ausente:** `1.102,5`, `18.400`, `-0,0` virando `0,0`, e `NaN` virando "sem dado". Teste: `format.test.ts` (Task 9) e exemplos no catálogo (Task 14).
5. **Tema antigo salvo** (`onyx` ou `volt`) nos dados locais, no servidor e em backups: o app abre dourado e a importação continua válida. Teste: `validateAppState.test.ts` (Task 3).

---

## Parte A: preparação

### Task 1: issues novas, dependências e branch da etapa 1

**Files:** nenhum arquivo do repo. Só GitHub e git.

**Interfaces:**
- Produces: os números das issues `A` (fundação) e `B` (componentes), usados nos nomes de branch e nos PRs.

> O estado do shell não persiste entre comandos. Anote os números impressos e, nas tasks seguintes, comece cada comando que cite `$A`, `$B` ou `$T` com `A=<número>; B=<número>; T=/tmp/onyx-plano; mkdir -p "$T"`.

- [ ] **Step 1: Criar a issue A (fundação)**

```bash
T=/tmp/onyx-plano; mkdir -p "$T"
cat > "$T/issue-a.md" <<'EOF'
## Problema
O app ainda tem cara de "vibe-coded": tokens sem escala (14 tamanhos de fonte), gradientes, brass em todo canto, três temas de acento que quebram a regra de cor e nenhuma resposta ao toque. A nova identidade (V3) foi aprovada na spec `docs/superpowers/specs/2026-10-06-redesign-identidade-app-design.md`.

## Sugestão
Etapa 1 da spec (§7):
- `apps/web/src/styles/tokens.css` com os tokens da §3, e os nomes antigos de `index.css` virando apelidos dos novos, para o app inteiro trocar de paleta e fonte sem mexer nas telas;
- Barlow Condensed e Plus Jakarta Sans, com Outfit 900 só no wordmark;
- remoção do seletor de tema;
- fim dos gradientes;
- botão central da barra neutro, dourado só com treino em andamento e mostrando o cronômetro;
- base global de toque e movimento;
- cache das fontes no service worker;
- documentação da §8.

## Critérios de aceite
- [ ] `tokens.css` com os valores da spec §3; tokens antigos são apelidos em `index.css`.
- [ ] Seletor de tema removido; `settings.theme` continua aceito nos dados e em backups.
- [ ] Nenhum gradiente decorativo no app (a legenda do heatmap de Análises fica para a #346).
- [ ] Botão central neutro; dourado com cronômetro só com treino em andamento; `aria-current` na barra.
- [ ] Sem `transition: all`; toque com `scale(0.97)`; `overscroll-behavior`; `prefers-reduced-motion`; aba ativa em `--text-1`; rótulo da barra com 11 px.
- [ ] Fontes do Google em cache no service worker; `theme-color` igual a `--surface-0`.
- [ ] Docs da spec §8 atualizadas.
- [ ] Revisão de design da `design-onyx` §5 registrada no PR.

## Notas
- Plano: `docs/superpowers/plans/2026-10-07-fundacao-identidade-app.md`, parte B.
- Faz as partes globais da #344, da #351 e da #352.
- Vem antes da issue de componentes base e das issues de tela (#339 em diante).
EOF
A=$(gh issue create --title "feat: fundação da nova identidade do app (tokens, base global, tema único)" --label enhancement --label ux --label p1 --label status:aprovada --label esforco:m --body-file "$T/issue-a.md" | grep -o '[0-9]*$'); echo "A=$A"
```

Expected: imprime `A=<número>`. Anote o número; os próximos passos usam `$A`.

- [ ] **Step 2: Criar a issue B (componentes)**

```bash
T=/tmp/onyx-plano; A=<número da issue A>
cat > "$T/issue-b.md" <<EOF
## Problema
Cada tela recria botões, blocos, modais e campos inline, com tamanhos e estados diferentes. Sem uma base, as issues de tela da auditoria iam repetir o problema.

## Sugestão
Etapa 2 da spec \`docs/superpowers/specs/2026-10-06-redesign-identidade-app-design.md\` (§4 e §7):
- componentes em \`apps/web/src/ui/\` com CSS Modules: Button, IconButton, Block, ListRow, Segments, Stat, Field, SegmentedControl, Sheet, Toast, ScreenHeader e EmptyState;
- lógica em funções puras testadas;
- formatador de números pt-BR;
- catálogo em \`/catalogo\`, só no \`npm run dev\`, com script de captura em 375 e 480 px;
- \`ScreenHeader\` nos títulos das telas antigas.

## Critérios de aceite
- [ ] Os 12 componentes com os estados normal, pressionado e desabilitado (mais carregando, erro e vazio onde couber).
- [ ] \`segmentStates\`, \`countdownFilled\`, \`cx\` e o formatador pt-BR testados no Vitest.
- [ ] \`/catalogo\` só existe em dev: o build de produção não contém o catálogo.
- [ ] Títulos de página com estilo único (\`ScreenHeader\`) em todas as telas fora de Início, Treino e Entrada (essas vêm nas próprias issues).
- [ ] Revisão de design da \`design-onyx\` §5 registrada no PR, com capturas do catálogo.

## Notas
- Plano: \`docs/superpowers/plans/2026-10-07-fundacao-identidade-app.md\`, parte C.
- Depende da #$A. Fecha a #352. Faz a base da #345 (formatador).
EOF
B=$(gh issue create --title "feat: componentes base do app (src/ui) e catálogo de desenvolvimento" --label enhancement --label ux --label p1 --label status:aprovada --label esforco:g --body-file "$T/issue-b.md" | grep -o '[0-9]*$'); echo "B=$B"
```

Expected: imprime `B=<número>`.

- [ ] **Step 3: Registrar as dependências e as absorções**

```bash
gh issue comment 259 --body "Depende também de #$A e #$B (fundação da nova identidade, spec docs/superpowers/specs/2026-10-06-redesign-identidade-app-design.md)."
gh issue comment 351 --body "A #$A faz os gradientes e o botão central. A parte 'um dourado por tela' fecha à medida que cada tela migra para o sistema novo (spec 2026-10-06 §7)."
gh issue comment 352 --body "A #$A faz a parte global (toque, overscroll, movimento reduzido, sem transition: all). O título de página único vem com o ScreenHeader na #$B, que fecha esta issue."
gh issue comment 344 --body "A #$A corrige o contraste do --text-muted (apelido de --text-3) e os rótulos da barra. Alvos e campos por tela fecham com a migração de cada tela."
gh issue comment 345 --body "O formatador pt-BR nasce na #$B. Os textos e números por tela fecham com a migração de cada tela."
for n in 339 340 342 343; do gh issue comment $n --body "Implementar sobre o sistema novo (spec docs/superpowers/specs/2026-10-06-redesign-identidade-app-design.md). Ver a §6: onde o mock e esta issue divergem, vale esta issue."; done
```

Expected: cada comando imprime a URL do comentário.

- [ ] **Step 4: Criar o branch da etapa 1**

O branch atual já tem a spec, o plano e o `launch.json`, e esses commits entram no PR da etapa 1.

```bash
git switch -c feat/$A-fundacao-identidade
git log --oneline -3
```

Expected: o topo do log mostra o commit da spec e o deste plano.

---

## Parte B: etapa 1, a fundação (issue A)

### Task 2: tokens, apelidos e base global

**Files:**
- Create: `apps/web/src/styles/tokens.css`
- Modify: `apps/web/src/index.css`, em quatro lugares: as linhas 1 a 71 (import de fontes, `:root` e os três blocos de tema), as regras de `body`, `button` e `h1, h2…`, a `.bottom-nav` com a `.nav-item`, e o fim do arquivo.

**Interfaces:**
- Produces: todos os tokens da spec §3 (nomes exatos abaixo), usados por todas as tasks seguintes. Os nomes antigos continuam funcionando como apelidos.

- [ ] **Step 1: Criar `apps/web/src/styles/tokens.css`**

```css
/*
 * ONYX: tokens da identidade do app.
 * Spec: docs/superpowers/specs/2026-10-06-redesign-identidade-app-design.md §3. Valores normativos.
 * Código novo usa só estes nomes; os nomes antigos são apelidos em index.css.
 */
:root {
  /* Superfícies em degraus de cinza quente: profundidade por tom, sem borda nem sombra */
  --surface-0: #0c0b0a;
  --surface-1: #171614;
  --surface-2: #211f1c;
  --surface-3: #2b2925;
  --line: #26231f;

  /* Texto: 1 principal e "feito"; 2 informa; 3 legenda; off só desabilitado ou pendente */
  --text-1: #f2efe8;
  --text-2: #9c978e;
  --text-3: #87827b;
  --text-off: #5f5b55;

  /* Dourado = agora / sua vez (nunca enfeite). Vermelho só em ação destrutiva. */
  --now: #e3a83b;
  --now-ink: #1a1304;
  --danger: #e5544b;
  --danger-ink: #1c0605;

  /* Tipografia */
  --font-num: 'Barlow Condensed', 'Arial Narrow', sans-serif;
  --font-text: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  --font-wordmark: 'Outfit', system-ui, sans-serif;

  --num-xl: 84px;
  --num-lg: 46px;
  --num-md: 30px;
  --num-sm: 22px;
  --title-1: 40px;
  --title-2: 28px;
  --title-3: 21px;
  --fs-body: 15px;
  --fs-sm: 14px;
  --fs-xs: 13px;
  --fs-caption: 12px;
  --fs-label: 11px;

  /* Espaço (escala de 4) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  /* Forma */
  --radius-seg: 1px;
  --radius-day: 3px;
  --radius-field: 8px;
  --radius-button: 10px;
  --radius-block: 14px;
  --seg-h-sm: 6px;
  --seg-h: 8px;
  --seg-gap: 3px;
  --tap: 44px;
  --tap-min: 40px;
  --shadow-sheet: 0 -8px 24px rgba(0, 0, 0, 0.5);

  /* Movimento */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --dur-press: 120ms;
  --dur-state: 200ms;
  --dur-sheet: 280ms;
}
```

- [ ] **Step 2: Trocar o topo de `index.css` (linhas 1 a 71) pelos apelidos**

Substitua tudo, do `@import url(...)` da linha 1 até o fim do bloco `:root[data-theme='volt'] { … }`, por:

```css
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Outfit:wght@900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
@import './styles/tokens.css';

/*
 * Apelidos dos tokens antigos → tokens novos (spec 2026-10-06 §5).
 * As telas ainda não migradas leem estes nomes e já ganham a identidade nova.
 * Código novo não usa estes nomes. Apagar quando a última tela migrar.
 */
:root {
  --bg-primary: var(--surface-0);
  --bg-secondary: var(--surface-1);
  --bg-tertiary: var(--surface-2);

  --text-primary: var(--text-1);
  --text-secondary: var(--text-2);
  --text-muted: var(--text-3);

  --border-color: var(--line);
  --border-focus: #4a4640;

  --accent: var(--now);
  --accent-ink: var(--now-ink);
  --accent-soft: var(--surface-2);
  --accent-border: var(--line);
  --accent-white: var(--now);
  --accent-gray: var(--surface-3);
  --accent-dark: var(--surface-1);

  --success: var(--text-1);
  --error: var(--danger);
  --warning: var(--text-2);

  --font-sans: var(--font-text);
  --font-display: var(--font-num);

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 14px;

  --transition-fast: var(--dur-press) var(--ease-out);
  --transition-normal: var(--dur-state) var(--ease-out);

  /* Layout */
  --max-width: 480px; /* shell mobile travado, centralizado no desktop */
  --template-desc-min-height: clamp(88px, 16vh, 120px);
}
```

Confira que nenhum `[data-theme` sobrou:

Run: `grep -n "data-theme" apps/web/src/index.css`
Expected: nenhuma linha.

- [ ] **Step 3: Base global de toque e títulos**

Em `index.css`, logo antes da regra `body {`, inclua:

```css
html {
  overscroll-behavior-y: none; /* puxar para baixo não recarrega o app (Android/TWA) */
}
```

Na regra `h1, h2, h3, h4, h5, h6`, troque `letter-spacing: -0.02em;` por `letter-spacing: -0.01em;`. A Barlow Condensed já é estreita, e -0,02 em aperta demais.

Substitua a regra `button { … }` inteira por:

```css
button {
  font-family: var(--font-sans);
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: none;
  color: inherit;
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
  transition:
    background-color var(--dur-state) var(--ease-out),
    border-color var(--dur-state) var(--ease-out),
    color var(--dur-state) var(--ease-out),
    opacity var(--dur-state) var(--ease-out),
    transform var(--dur-press) var(--ease-out);
}

button:active:not(:disabled) {
  transform: scale(0.97);
}
```

- [ ] **Step 4: Barra inferior sem dourado na aba ativa**

Na `.bottom-nav`, troque `background-color: rgba(10, 10, 10, 0.95);` por `background-color: rgba(12, 11, 10, 0.95);`.

Na `.nav-item`, troque `color: var(--text-secondary);` por `color: var(--text-3);` e `font-size: 10px;` por `font-size: var(--fs-label);`.

Na `.nav-item.active`, troque `color: var(--accent);` por `color: var(--text-1);`.

- [ ] **Step 5: Movimento reduzido no fim de `index.css`**

Acrescente no fim do arquivo:

```css
/* Movimento reduzido: nada se move, só cor e opacidade mudam */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  button:active:not(:disabled) {
    transform: none;
  }
}
```

- [ ] **Step 6: Build e testes**

Run: `npm run build && npm run test && npm run lint`
Expected: build sem erro (o `@import './styles/tokens.css'` resolvido pelo Vite), testes passando e lint sem erro novo.

- [ ] **Step 7: Conferência visual rápida**

Run: `npm run dev`, depois abra `http://localhost:5173/` (a tela de entrada, que não exige API).
Expected: fundo `#0c0b0a`, títulos em Barlow Condensed, nenhum resto de cinza frio do tema antigo.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/styles/tokens.css apps/web/src/index.css
git commit -m "feat(web): tokens da nova identidade e apelidos dos tokens antigos (#$A)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: tema único

**Files:**
- Modify: `apps/web/src/context/WorkoutContext.tsx:846-849`
- Modify: `apps/web/src/pages/Settings.tsx`: imports (linhas 4 a 6), `THEMES` (linhas 9 a 13), a seção "Aparência" (linhas 130 a 162) e os estilos `themeGrid` a `themeDesc` (linhas 492 a 546)
- Test: `apps/web/src/utils/validateAppState.test.ts`

**Interfaces:**
- Consumes: nada das tasks anteriores.
- Produces: o app não escreve mais `data-theme`. `Settings.theme` e `ThemeName` continuam em `@powerlifting/shared` e no schema da API, sem mudança.

- [ ] **Step 1: Teste que fixa a compatibilidade com backups antigos**

Em `validateAppState.test.ts`, logo depois do teste `it('rejeita theme inválido ("blue")', …)`, inclua:

```ts
  it('aceita backup antigo com tema "volt" ou "onyx" (seletor removido, campo mantido)', () => {
    expect(isValidImportedState({ ...validState, settings: { ...validSettings, theme: 'volt' } })).toBe(true);
    expect(isValidImportedState({ ...validState, settings: { ...validSettings, theme: 'onyx' } })).toBe(true);
  });
```

- [ ] **Step 2: Rodar o teste**

Run: `npm run test -w @powerlifting/web -- validateAppState`
Expected: PASS. É um teste de proteção: o comportamento já existe e precisa continuar depois desta task.

- [ ] **Step 3: Remover o efeito que aplica o tema**

Em `WorkoutContext.tsx`, apague estas quatro linhas:

```tsx
  // Aplica o tema de acento no documento (lido pelo CSS via [data-theme])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
  }, [state.settings.theme]);
```

- [ ] **Step 4: Remover o seletor das Configurações**

Em `Settings.tsx`:
- no import do `lucide-react`, remova `Check` (ele só existe no seletor);
- apague a linha `import type { ThemeName } from '@powerlifting/shared';`;
- apague a constante `THEMES` inteira (linhas 9 a 13);
- apague o bloco JSX que começa em `{/* Aparência / Tema */}` e termina no `</div>` que fecha a seção, imediatamente antes de `{/* Preferências do Atleta */}`;
- apague do objeto `styles` as entradas `themeGrid`, `themeCard`, `themeCheck`, `themeSwatchWrap`, `themeSwatch`, `themeName` e `themeDesc`.

Confira que não sobrou nada:

Run: `grep -rn "data-theme\|THEMES\|themeGrid\|ThemeName" apps/web/src`
Expected: nenhuma linha.

- [ ] **Step 5: Build, lint e testes**

Run: `npm run build && npm run lint && npm run test`
Expected: tudo passa, sem import sobrando.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/context/WorkoutContext.tsx apps/web/src/pages/Settings.tsx apps/web/src/utils/validateAppState.test.ts
git commit -m "feat(web): tema único, remove o seletor Brass/Onyx/Volt (#$A)

O campo settings.theme continua nos dados e em backups por compatibilidade.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 4: fim dos gradientes e wordmark na fonte da marca

**Files:**
- Modify: `apps/web/src/pages/Dashboard.tsx:468`
- Modify: `apps/web/src/pages/Workout.tsx:511`
- Modify: `apps/web/src/pages/More.tsx:137`
- Modify: `apps/web/src/pages/ComparisonEstimated.tsx:394-396`
- Modify: `apps/web/src/pages/Auth.tsx`, no estilo `wordmark`

**Interfaces:**
- Consumes: o token `--font-wordmark` (Task 2).

- [ ] **Step 1: Trocar os gradientes por superfície chapada**

- `Dashboard.tsx`, estilo `hero`: troque `background: 'linear-gradient(135deg, var(--accent-soft), transparent)'` por `background: 'var(--bg-secondary)'`.
- `Workout.tsx`, estilo `nextProgramCard`: a mesma troca.
- `More.tsx`, estilo `summary`: troque `background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))'` por `background: 'var(--bg-secondary)'`.
- `ComparisonEstimated.tsx`, estilo `progressFill`: substitua

```ts
    // Tom mais claro do accent via color-mix (o hex fixo #e6c27a era do tema brass e
    // quebrava onyx/volt).
    background: 'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 72%, var(--text-primary)))',
```

por

```ts
    background: 'var(--text-primary)',
```

- [ ] **Step 2: Wordmark em Outfit**

Em `Auth.tsx`, no estilo `wordmark`, troque `fontFamily: 'var(--font-display)',` por `fontFamily: 'var(--font-wordmark)',`. Depois da Task 2, o `--font-display` virou Barlow Condensed, e o wordmark precisa continuar em Outfit 900.

- [ ] **Step 3: Conferir**

Run: `grep -rn "gradient" apps/web/src`
Expected: só `Analytics.tsx` (`heatGradient`, a legenda de intensidade do heatmap, que é funcional e vai ser refeita na #346).

Run: `npm run build && npm run lint`
Expected: passa.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/Dashboard.tsx apps/web/src/pages/Workout.tsx apps/web/src/pages/More.tsx apps/web/src/pages/ComparisonEstimated.tsx apps/web/src/pages/Auth.tsx
git commit -m "fix(web): remove gradientes decorativos e mantém o wordmark em Outfit (#$A)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 5: botão central neutro com cronômetro da sessão

**Files:**
- Create: `apps/web/src/utils/elapsed.ts`
- Test: `apps/web/src/utils/elapsed.test.ts`
- Create: `apps/web/src/components/SessionClock.tsx`
- Modify: `apps/web/src/pages/Workout.tsx:9-28` (o `WorkoutTimer` passa a usar o `SessionClock`)
- Modify: `apps/web/src/App.tsx`: import do `lucide-react`, botões da barra (linhas 155 a 210) e estilos `fab` a `fabLabel` (linhas 261 a 304)

**Interfaces:**
- Produces:
  - `formatElapsed(startIso: string, nowMs: number): string`, em `utils/elapsed.ts`;
  - componente `SessionClock` (export default e nomeado), com props `{ startIso: string }`.

- [ ] **Step 1: Teste do formatador de tempo**

`apps/web/src/utils/elapsed.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatElapsed } from './elapsed';

const START = '2026-10-08T10:00:00.000Z';
const at = (seconds: number) => new Date(START).getTime() + seconds * 1000;

describe('formatElapsed', () => {
  it('mostra mm:ss abaixo de 1 hora', () => {
    expect(formatElapsed(START, at(0))).toBe('00:00');
    expect(formatElapsed(START, at(2292))).toBe('38:12');
  });

  it('mostra h:mm:ss a partir de 1 hora', () => {
    expect(formatElapsed(START, at(3753))).toBe('1:02:33');
  });

  it('não fica negativo quando o relógio do aparelho volta', () => {
    expect(formatElapsed(START, at(-30))).toBe('00:00');
  });

  it('data inválida vira 00:00', () => {
    expect(formatElapsed('não é data', at(10))).toBe('00:00');
    expect(formatElapsed(START, NaN)).toBe('00:00');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test -w @powerlifting/web -- elapsed`
Expected: FAIL, porque o módulo `./elapsed` ainda não existe.

- [ ] **Step 3: Implementar `apps/web/src/utils/elapsed.ts`**

```ts
/**
 * Tempo decorrido entre `startIso` e `nowMs`, como "mm:ss" ou "h:mm:ss".
 * Data inválida ou no futuro vira "00:00". Pura, testada em elapsed.test.ts.
 */
export function formatElapsed(startIso: string, nowMs: number): string {
  const start = new Date(startIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(nowMs)) return '00:00';
  const diff = Math.max(0, Math.floor((nowMs - start) / 1000));
  const h = Math.floor(diff / 3600);
  const mm = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
  const ss = String(diff % 60).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test -w @powerlifting/web -- elapsed`
Expected: PASS (4 testes).

- [ ] **Step 5: Criar `apps/web/src/components/SessionClock.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { formatElapsed } from '../utils/elapsed';

/** Tempo da sessão, atualizado a cada segundo. Só este span re-renderiza (#267). */
export const SessionClock: React.FC<{ startIso: string }> = ({ startIso }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  return <span>{formatElapsed(startIso, now)}</span>;
};

export default SessionClock;
```

- [ ] **Step 6: O `WorkoutTimer` do Treino passa a usar o `SessionClock`**

Em `Workout.tsx`, substitua o componente inteiro (das linhas `// Componente folha do cronômetro…` até o `};` que fecha o `WorkoutTimer`) por:

```tsx
// Componente folha do cronômetro: o tick de 1s re-renderiza só o SessionClock,
// não a lista inteira do treino (#267).
const WorkoutTimer: React.FC<{ startIso: string }> = ({ startIso }) => (
  <span style={styles.timer}><Clock size={14} /> <SessionClock startIso={startIso} /></span>
);
```

E acrescente aos imports: `import SessionClock from '../components/SessionClock';`.

- [ ] **Step 7: Botão central e `aria-current` na barra (`App.tsx`)**

No import do `lucide-react`, remova `Dumbbell`. Acrescente `import SessionClock from './components/SessionClock';`.

Nos quatro botões `nav-item`, acrescente `aria-current`:
- Início: `aria-current={currentTab === 'dashboard' ? 'page' : undefined}`
- Biblioteca: `aria-current={currentTab === 'templates' ? 'page' : undefined}`
- Análises: `aria-current={currentTab === 'analytics' ? 'page' : undefined}`
- Mais: `aria-current={moreActive ? 'page' : undefined}`

Substitua o bloco do botão central (de `{/* FAB central — iniciar / continuar treino */}` até o `</button>` dele) por:

```tsx
        {/* Botão central: neutro; dourado (= agora) só com treino em andamento, mostrando o tempo da sessão */}
        <button
          onClick={() => setCurrentTab('workout')}
          style={styles.fab}
          aria-label={activeWorkout ? 'Treino em andamento' : 'Treinar'}
          aria-current={currentTab === 'workout' ? 'page' : undefined}
        >
          <span style={{ ...styles.fabCircle, ...(activeWorkout ? styles.fabCircleLive : {}) }}>
            {activeWorkout
              ? <SessionClock startIso={activeWorkout.date} />
              : <Plus size={22} strokeWidth={2.5} />}
          </span>
          <span style={styles.fabLabel}>{activeWorkout ? 'Treinando' : 'Treinar'}</span>
        </button>
```

No objeto `styles`, substitua as entradas `fab`, `fabCircle`, `fabActiveDot` e `fabLabel` por:

```ts
  fab: {
    position: 'absolute',
    left: '50%',
    top: '8px',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    padding: 0,
  },
  fabCircle: {
    minWidth: '56px',
    height: '36px',
    padding: '0 8px',
    borderRadius: 'var(--radius-button)',
    backgroundColor: 'var(--surface-3)',
    color: 'var(--text-1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-num)',
    fontWeight: 700,
    fontSize: 'var(--title-3)',
    fontVariantNumeric: 'tabular-nums',
  },
  fabCircleLive: {
    backgroundColor: 'var(--now)',
    color: 'var(--now-ink)',
  },
  fabLabel: {
    fontSize: 'var(--fs-label)',
    fontWeight: 600,
    color: 'var(--text-1)',
  },
```

O `min-width` com `padding` deixa o botão crescer com `1:02:33` (Review Focus 2).

- [ ] **Step 8: Build, lint e testes**

Run: `npm run build && npm run lint && npm run test`
Expected: passa, sem `Dumbbell` ou `fabActiveDot` sobrando (`grep -n "Dumbbell\|fabActiveDot" apps/web/src/App.tsx` sem resultado).

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/utils/elapsed.ts apps/web/src/utils/elapsed.test.ts apps/web/src/components/SessionClock.tsx apps/web/src/pages/Workout.tsx apps/web/src/App.tsx
git commit -m "feat(web): botão central neutro, dourado com o tempo da sessão durante o treino (#$A)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 6: fontes no cache do PWA e cor da barra do sistema

**Files:**
- Modify: `apps/web/vite.config.ts` (manifesto e `workbox`)
- Modify: `apps/web/index.html:6`

- [ ] **Step 1: Cor do sistema igual a `--surface-0`**

Em `vite.config.ts`, no `manifest`, troque `theme_color: '#060606'` e `background_color: '#060606'` por `'#0c0b0a'`. Em `index.html`, troque `<meta name="theme-color" content="#060606" />` por `<meta name="theme-color" content="#0c0b0a" />`.

- [ ] **Step 2: Cache das fontes do Google**

No objeto `workbox` de `vite.config.ts`, depois de `navigateFallback: '/index.html',`, inclua:

```ts
        // Barlow Condensed é parte da identidade: sem cache, sem sinal o app cai na fonte do sistema.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
```

- [ ] **Step 3: Conferir o service worker gerado**

Run: `npm run build && grep -o "google-fonts-[a-z]*" apps/web/dist/sw.js | sort -u`
Expected: `google-fonts-css` e `google-fonts-files`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/vite.config.ts apps/web/index.html
git commit -m "feat(web): fontes do Google em cache no service worker e cor do sistema da nova identidade (#$A)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 7: documentação da identidade (spec §8)

**Files:**
- Rewrite: `apps/web/DESIGN.md`
- Modify: `.claude/skills/design-onyx/SKILL.md` §2
- Modify: `AGENTS.md`, seção "Estilo / design system ONYX"
- Modify: `PRODUCT.md:38`
- Modify: `.github/copilot-instructions.md`, bullet **Estilo**
- Rewrite: `.github/skills/design-system/SKILL.md`
- Modify: `README.md`, linhas 18, 32 e 231 a 247

- [ ] **Step 1: Reescrever `apps/web/DESIGN.md`**

```markdown
---
name: ONYX (app)
description: Diário de treino de powerlifting, escuro, mobile-first. Dourado só para o que é agora.
colors:
  surface-0: "#0c0b0a"
  surface-1: "#171614"
  surface-2: "#211f1c"
  surface-3: "#2b2925"
  line: "#26231f"
  text-1: "#f2efe8"
  text-2: "#9c978e"
  text-3: "#87827b"
  text-off: "#5f5b55"
  now: "#e3a83b"
  now-ink: "#1a1304"
  danger: "#e5544b"
  danger-ink: "#1c0605"
typography:
  number-xl:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "84px"
    fontWeight: 700
  number-lg:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "46px"
    fontWeight: 700
  number-md:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "30px"
    fontWeight: 700
  number-sm:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "22px"
    fontWeight: 700
  title-1:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "40px"
    fontWeight: 700
  title-2:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "28px"
    fontWeight: 700
  title-3:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "21px"
    fontWeight: 600
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "14px"
  small:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "13px"
  caption:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "12px"
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
rounded:
  segment: "1px"
  day: "3px"
  field: "8px"
  button: "10px"
  block: "14px"
spacing:
  page: "16px"
  block: "16px"
  between-blocks: "10px"
components:
  button-primary:
    backgroundColor: "{colors.now}"
    textColor: "{colors.now-ink}"
    rounded: "{rounded.button}"
    height: "56px"
  block:
    backgroundColor: "{colors.surface-1}"
    rounded: "{rounded.block}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface-0}"
    textColor: "{colors.text-1}"
    rounded: "{rounded.field}"
    padding: "0 12px"
---

# Design System: ONYX (app)

> Valores normativos: `apps/web/src/styles/tokens.css` (tokens) e `apps/web/src/index.css` (base global e apelidos dos tokens antigos). Decisões e referência visual: [spec de 06/10/2026](../../docs/superpowers/specs/2026-10-06-redesign-identidade-app-design.md) e os HTML da V3 na pasta dela. Se este arquivo divergir do CSS, o CSS vence e este arquivo deve ser corrigido. Vale para `apps/web`; a landing tem o próprio `apps/landing/DESIGN.md`.

## Overview

**Creative North Star: "O placar do treino"**

Esportivo de elite: números grandes e confiantes, cor que significa alguma coisa, cara de equipamento de atleta. O app some atrás da carga, das repetições e do tempo. Quem usa está entre séries, com o celular numa mão.

**Key Characteristics:**
- Escuro sempre e tema único (não há seletor de cor).
- Dourado só para o que é agora.
- Números em Barlow Condensed, sempre maiores que o rótulo.
- Barrinhas segmentadas como assinatura.
- Profundidade por tom: blocos em degraus de cinza quente, sem borda e sem sombra.

## Princípios

1. **Dourado = agora / sua vez.**
   - Usado em: ação principal da tela (no máximo uma), série atual, descanso correndo, dia de hoje, semana atual do bloco, botão central da barra com treino em andamento e foco de teclado.
   - Nunca em: aba ativa, opção selecionada, recorde, ícone, decoração ou texto corrido.
   - Exceção: a marca (anilha) mantém o anel dourado, porque é marca e não sinal.
2. **Feito é branco** nos indicadores (segmentos concluídos, dias treinados). O controle de uma série já feita recua: fundo `--surface-3` e check branco.
3. **Recorde é ícone** (`Award` do lucide), na cor do texto ao redor.
4. **Segmentos, nunca barra lisa,** no progresso de séries, no descanso (o restante em dourado, esvaziando), nas semanas do bloco e no histórico curto.
5. **Número de placar:** Barlow Condensed com `tabular-nums`.
6. **Sem dado, sem número:** valor ausente aparece como "sem dado", nunca como 0 inventado.

## Colors

| Token | Valor | Uso |
|---|---|---|
| `--surface-0` | #0c0b0a | fundo da tela |
| `--surface-1` | #171614 | blocos |
| `--surface-2` | #211f1c | linha da série atual, descanso, botão secundário sobre a tela |
| `--surface-3` | #2b2925 | check de série feita, botão sobre bloco, opção selecionada |
| `--line` | #26231f | divisórias dentro de bloco |
| `--text-1` | #f2efe8 | texto principal; "feito" nos indicadores |
| `--text-2` | #9c978e | texto que informa |
| `--text-3` | #87827b | legenda pequena |
| `--text-off` | #5f5b55 | só desabilitado ou pendente |
| `--now` / `--now-ink` | #e3a83b / #1a1304 | ver Princípio 1 |
| `--danger` / `--danger-ink` | #e5544b / #1c0605 | só ação destrutiva |

**A Regra das Anilhas.** As cores das anilhas no `PlateVisualizer` seguem o padrão IPF e são a única paleta extra permitida, só ali.

## Typography

- **Barlow Condensed** (`--font-num`, 600/700) em números, títulos de tela e de bloco, nomes de exercício e botão principal grande.
- **Plus Jakarta Sans** (`--font-text`) em todo o resto.
- **Outfit 900** (`--font-wordmark`) só no wordmark.

| Papel | Tokens |
|---|---|
| Número | `--num-xl` 84 (placar), `--num-lg` 46 (cronômetro aberto), `--num-md` 30 (campo da série atual), `--num-sm` 22 (número de linha) |
| Título | `--title-1` 40 (título de tela), `--title-2` 28 (bloco, exercício), `--title-3` 21 (linha de lista) |
| Texto | `--fs-body` 15, `--fs-sm` 14, `--fs-xs` 13, `--fs-caption` 12, `--fs-label` 11 (só rótulo da barra) |

Nada abaixo de 11 px. Campos com 16 px ou mais. Todo número em `tabular-nums`. Rótulos em caixa normal, sem caixa alta.

## Layout

- Coluna única dentro de `--max-width: 480px`, com 16 px de margem e 10 px entre blocos.
- As seções não encolhem (`flex-shrink: 0`): a tela rola.
- A barra inferior tem Início, Biblioteca, botão central, Análises e Mais. O botão central é neutro e vira o cronômetro dourado da sessão com treino em andamento. A aba ativa fica em `--text-1`.

## Elevation & Depth

- Plano: degraus `--surface-0` a `--surface-3`, sem borda nos blocos.
- Sombra só em folha flutuante (`--shadow-sheet`).
- A barra inferior usa fundo translúcido com `backdrop-filter` por função (o conteúdo rola por baixo), não como efeito.

## Shapes

- **Raios:** `--radius-seg` 1, `--radius-day` 3, `--radius-field` 8, `--radius-button` 10, `--radius-block` 14.
- **Segmentos:** altura `--seg-h-sm` 6 ou `--seg-h` 8, com `--seg-gap` 3.
- **Toque:** alvo `--tap` 44 (mínimo `--tap-min` 40).

## Motion

- Curva `--ease-out`.
- Durações: `--dur-press` 120 ms (toque), `--dur-state` 200 ms (troca de estado), `--dur-sheet` 280 ms (folha).
- Botão pressionado encolhe para `scale(0.97)`. Segmento muda só de cor.
- Com `prefers-reduced-motion`, nada se move.
- Os `--transition-*` antigos são apelidos dessas durações.

## Estilo no código

- **Componente novo e tela migrada usam CSS Modules** (`<Nome>.module.css`) com os tokens. `style={}` inline só para valor calculado em tempo de execução.
- O objeto `styles` no fim do arquivo continua nas telas antigas até a issue de cada uma. Não o use em código novo.
- **Código novo usa os nomes novos dos tokens.** Os antigos (`--accent`, `--bg-*`, `--text-primary|secondary|muted`, `--border-color`, `--font-display`…) são apelidos em `index.css` e somem no fim da migração.

## Components

Contratos da spec §4.

**Base:**
- `Button`: `primary` (uma por tela), `secondary`, `link`, `danger`; alturas 56 e 44.
- `IconButton`: 44×44, com `aria-label`.
- `Block`: superfície com cabeçalho opcional; nunca aninhado.
- `ListRow`: linha de lista com título, meta e chevron.
- `Segments`: `progress` e `countdown`.
- `Stat`: número, unidade, legenda e variação.
- `Field`: rótulo acima, erro abaixo.
- `SegmentedControl`: a opção selecionada em `--surface-3`.
- `Sheet`: folha de baixo.
- `Toast`: aviso curto acima da barra.
- `ScreenHeader`: título de tela único.
- `EmptyState`: título, uma frase e uma ação.

**Do treino:** `SetRow`, `RestBar` (compacta e aberta) e `WeekStrip`.

## Do's and Don'ts

### Do:
- **Do** usar os tokens de `tokens.css`; se faltar um valor, criar um token novo no mesmo padrão de nome.
- **Do** desenhar os estados vazio, carregando, erro e desabilitado de toda tela.
- **Do** testar em 375 px e 480 px, e o Treino ativo também em 390×844.
- **Do** manter alvos de toque com 44 px.

### Don't:
- **Don't** usar dourado fora do Princípio 1, nem reintroduzir temas ou `data-theme`.
- **Don't** usar gradiente, glow, vidro decorativo, textura ou sombra em bloco.
- **Don't** adicionar Tailwind, CSS-in-JS, biblioteca de componentes ou de animação.
- **Don't** criar modo claro nem segunda cor de destaque.
- **Don't** escrever texto de interface fora do pt-BR nem usar travessão.
```

- [ ] **Step 2: `design-onyx` §2**

Em `.claude/skills/design-onyx/SKILL.md`:

Troque

```
  - App: transições CSS com `--transition-fast` / `--transition-normal` e `@keyframes` (como o `slideUp` do descanso).
```

por

```
  - App: transições CSS com os tokens `--ease-out` e `--dur-press` / `--dur-state` / `--dur-sheet`, e `@keyframes` quando a peça entra de baixo (folha).
```

Troque

```
  - Uma curva de easing melhor (as do Emil) é bem-vinda como token novo `--ease-*`, aplicada onde a issue mexe. Trocar os `--transition-*` globais é decisão à parte.
```

por

```
  - A curva do app é `--ease-out` (a do Emil); os `--transition-*` antigos são apelidos dela até as telas migrarem.
```

Troque

```
  - Um acento, sempre via `var(--accent)` / `var(--accent-ink)`. O app tem três temas; a landing é Brass fixa.
```

por

```
  - Um acento. No app é `var(--now)` / `var(--now-ink)` e significa "agora / sua vez" (spec 2026-10-06 §2): nunca em aba ativa, opção selecionada, recorde ou decoração. Na landing, o brass dos tokens dela. Tema único nas duas superfícies.
```

Troque `  - App: Outfit + Plus Jakarta Sans.` por `  - App: Barlow Condensed (números e títulos) + Plus Jakarta Sans (texto); Outfit 900 só no wordmark.`

Na linha `  - Ignore "evite Outfit / Plus Jakarta Sans", …`, troque `"evite Outfit / Plus Jakarta Sans"` por `"evite Barlow Condensed / Outfit / Plus Jakarta Sans"`.

Troque

```
- **Estilo no app:** o objeto `styles: Record<string, React.CSSProperties>` no fim do arquivo é o padrão; não migre para classes.
```

por

```
- **Estilo no app:** CSS Modules (`<Nome>.module.css`) com os tokens de `src/styles/tokens.css`, em componente novo e em tela migrada. `style={}` inline só para valor calculado em tempo de execução. O objeto `styles` no fim do arquivo continua nas telas antigas até a issue delas: não o use em código novo e não migre tela fora da issue dela.
```

- [ ] **Step 3: `AGENTS.md`**

Substitua a seção inteira `### Estilo / design system ONYX` (do cabeçalho até a linha anterior a `### Skills de design (frontend)`) por:

```markdown
### Estilo / design system ONYX

Identidade e regras: [spec de 06/10/2026](docs/superpowers/specs/2026-10-06-redesign-identidade-app-design.md) (referência visual: os HTML da V3 na pasta dela) e [apps/web/DESIGN.md](apps/web/DESIGN.md).

- **CSS puro.** Tokens em [apps/web/src/styles/tokens.css](apps/web/src/styles/tokens.css); base global em [apps/web/src/index.css](apps/web/src/index.css). Não introduza Tailwind, CSS-in-JS libs ou outros frameworks.
- **CSS Modules em código novo.** Componente novo e tela migrada usam `<Nome>.module.css` com os tokens; `style={}` inline só para valor calculado em tempo de execução. O objeto `styles` no fim do arquivo continua nas telas antigas até a issue de cada uma; não o use em código novo.
- **Tokens novos em código novo:** `--surface-0..3`, `--line`, `--text-1..3`, `--text-off`, `--now`/`--now-ink`, `--danger`/`--danger-ink`, escalas `--num-*`, `--title-*`, `--fs-*`, `--space-*`, raios `--radius-*`, movimento `--ease-out` e `--dur-*`. Os nomes antigos (`--accent`, `--bg-*`, `--text-primary|secondary|muted`, `--border-color`, `--font-display`…) são apelidos dos novos em `index.css` enquanto houver tela não migrada.
- **Dourado = agora.** `--now` marca só a ação principal (uma por tela), a série atual, o descanso correndo, o dia de hoje e o botão central da barra com treino em andamento. Aba ativa e opção selecionada ficam em `--text-1`/`--surface-3`; recorde é ícone. Nunca hardcode hex que tenha token.
- **Tema único.** O seletor Brass/Onyx/Volt foi removido; `Settings.theme` continua no tipo e no schema da API só por compatibilidade (backups antigos seguem válidos). Não reintroduza `data-theme`.
- **Fontes:** Barlow Condensed (`--font-num`, números e títulos) + Plus Jakarta Sans (`--font-text`) + Outfit 900 só no wordmark (`--font-wordmark`), via Google Fonts, com cache no service worker (Workbox `runtimeCaching`) para funcionar sem sinal.
```

Depois, copie para o fim dessa nova seção, sem alterar, o bullet `- **Marca ONYX.** …` e as linhas `- Layout travado em --max-width…`, `- Estilos inline pontuais…` (troque esta por `- Estilos inline pontuais só para valor calculado em tempo de execução.`) e `- Ícones via lucide-react.` da seção antiga.

- [ ] **Step 4: `PRODUCT.md`, `copilot-instructions` e `README.md`**

- `PRODUCT.md:38`: troque `- Unidades em kg ou lbs. Temas de acento selecionáveis no app (Brass padrão, Onyx, Volt).` por `- Unidades em kg ou lbs. Tema único (dourado), sem seletor de cor.`
- `.github/copilot-instructions.md`: troque o bullet que começa em `- **Estilo:** CSS puro com as variables de` por:

```
- **Estilo:** CSS puro com os tokens de [apps/web/src/styles/tokens.css](../apps/web/src/styles/tokens.css) (design system ONYX, `--max-width: 480px`); código novo usa CSS Modules, e o dourado `--now` só marca o que é agora (spec [2026-10-06](../docs/superpowers/specs/2026-10-06-redesign-identidade-app-design.md)). Sem Tailwind/CSS-in-JS. Ícones via `lucide-react`.
```

- `README.md:18`: troque `**tema de acento (Onyx · Brass · Volt)**, unidades (kg/lbs)` por `unidades (kg/lbs)`.
- `README.md:32`: troque `CSS puro (\`apps/web/src/index.css\`), design system **ONYX** com temas de acento (Onyx · Brass · Volt)` por `CSS puro + CSS Modules, design system **ONYX** (tokens em \`apps/web/src/styles/tokens.css\`)`.
- `README.md`: substitua da linha `- Fontes: **Outfit** (títulos e números)…` até o parágrafo que termina em `não hardcode \`#ffffff\`/\`#000000\`.` (fim da seção "Tema de acento") por:

```markdown
- Fontes: **Barlow Condensed** (números e títulos) e **Plus Jakarta Sans** (corpo), via Google Fonts; Outfit 900 só no wordmark.
- Tokens em [apps/web/src/styles/tokens.css](apps/web/src/styles/tokens.css); regras e referência visual na [spec de 06/10/2026](docs/superpowers/specs/2026-10-06-redesign-identidade-app-design.md) e em [apps/web/DESIGN.md](apps/web/DESIGN.md).

### Cor

Tema único. O dourado (`--now`) significa "agora / sua vez": ação principal, série atual, descanso correndo, dia de hoje. O que já foi feito fica branco; recorde é ícone. Não há seletor de tema.
```

- [ ] **Step 5: Reescrever `.github/skills/design-system/SKILL.md`**

```markdown
---
name: design-system
description: "Design system ONYX deste app de powerlifting: tokens (cor, tipografia, espaço, forma, movimento) em apps/web/src/styles/tokens.css, CSS Modules e a regra 'dourado = agora'. Use ao estilizar páginas/componentes ou criar UI nova."
---

# Design System: ONYX

Escuro, mobile-first (480 px), tema único. **CSS puro**: não use Tailwind nem CSS-in-JS. Ícones via `lucide-react`.

Fontes de verdade:
- valores em [apps/web/src/styles/tokens.css](../../../apps/web/src/styles/tokens.css);
- regras completas em [apps/web/DESIGN.md](../../../apps/web/DESIGN.md);
- decisões na [spec de 06/10/2026](../../../docs/superpowers/specs/2026-10-06-redesign-identidade-app-design.md);
- o que vence skills de terceiros em [.claude/skills/design-onyx/SKILL.md](../../../.claude/skills/design-onyx/SKILL.md).

## Regras

- **Dourado = agora** (`--now` / `--now-ink`): ação principal (uma por tela), série atual, descanso correndo, dia de hoje, botão central com treino em andamento. Nunca em aba ativa, opção selecionada, recorde ou decoração.
- **Feito é branco** (`--text-1`) nos indicadores; **recorde é ícone**; **segmentos** em vez de barra de progresso lisa.
- **Superfícies** `--surface-0..3` em cinza quente, sem borda e sem sombra; `--line` para divisórias.
- **Texto** `--text-1` (principal), `--text-2` (informa), `--text-3` (legenda), `--text-off` (só desabilitado).
- **Fontes:** Barlow Condensed (`--font-num`) para números e títulos, com `tabular-nums`; Plus Jakarta Sans (`--font-text`) no resto; Outfit 900 só no wordmark.
- **Escalas:** `--num-*`, `--title-*`, `--fs-*`, `--space-*`, `--radius-*`, `--dur-*` e `--ease-out`. Nada abaixo de 11 px; campos com 16 px; toque com 44 px.

## Convenções de código

- Componente novo e tela migrada: **CSS Modules** (`<Nome>.module.css`) com os tokens. `style={}` inline só para valor calculado em tempo de execução.
- Telas antigas ainda usam o objeto `styles` no fim do arquivo e os nomes antigos de token (`--accent`, `--bg-*`…), que são apelidos dos novos em `index.css`. Não use nenhum dos dois em código novo.
- Precisa de um valor sem token? Crie o token em `tokens.css` (mesmo padrão de nome) e atualize o `DESIGN.md`.
- Textos em **pt-BR**.

## Cores de anilhas: `PlateVisualizer`

- **kg (padrão IPF):** 25 vermelho, 20 azul, 15 amarelo, 10 verde, 5 branco, 2,5 preto, 1,25 prata.
- **lbs (convenção deste app; não existe padrão IPF para lbs):** 55 vermelho, 45 azul, 35 amarelo, 25 verde, 10 preto, 5 branco.
```

- [ ] **Step 6: Conferir que nenhuma doc ainda vende os temas**

Run: `grep -rn "Onyx · Brass\|Brass padrão, Onyx\|data-theme\|três temas" AGENTS.md README.md PRODUCT.md apps/web/DESIGN.md .github .claude/skills/design-onyx`
Expected: nenhuma linha.

- [ ] **Step 7: Commit**

```bash
git add apps/web/DESIGN.md .claude/skills/design-onyx/SKILL.md AGENTS.md PRODUCT.md .github/copilot-instructions.md .github/skills/design-system/SKILL.md README.md
git commit -m "docs: nova identidade do app em DESIGN.md, design-onyx, AGENTS e README (#$A)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 8: verificação, revisão de design e PR da etapa 1

**Files:** nenhum novo. Só o PR.

- [ ] **Step 1: Checks completos**

Run: `npm run build && npm run lint && npm run test && npm run test:api`
Expected: tudo passa. O `test:api` confirma que o schema com `theme` não mudou.

- [ ] **Step 2: Capturas das telas antigas com a identidade nova**

Com o ambiente local descrito no AGENTS e na memória do projeto:
1. Postgres embutido: `node C:/Users/leona/.onyx-dev/pg.mjs` em background.
2. Configurações `api-dev` e `web-dev` do `.claude/launch.json`.
3. Captura: `node C:/Users/leona/.onyx-dev/capture.cjs <repo> <saida>`.

Confira nas capturas:
- Início, Treino e Configurações já com o fundo quente e a Barlow Condensed;
- a barra com a aba ativa branca e o botão central neutro;
- sem gradiente.

Sem esse ambiente, capture ao menos a tela de entrada com o Playwright em 375 px e 480 px.

- [ ] **Step 3: Revisão de design (`design-onyx` §5)**

Rode a revisão de design da `.claude/skills/design-onyx/SKILL.md` §5 nos arquivos alterados: `impeccable detect` uma vez, `mobile-native` como checklist e `review-animations`, porque o diff mexe em `transition` e `transform`. Corrija o que for compatível com a §2 e anote o resto para a seção **Design** do PR.

- [ ] **Step 4: Push e PR**

```bash
git push -u origin feat/$A-fundacao-identidade
gh pr create --base main --title "feat: fundação da nova identidade do app (#$A)" --body-file "$T/pr-a.md"
```

O `$T/pr-a.md` segue o `.github/PULL_REQUEST_TEMPLATE.md`, com estas seções:
- **Resumo:** tokens, apelidos, tema único, gradientes, botão central, base global, cache de fontes e docs.
- **Issue relacionada:** `Closes #$A`.
- **Tipo:** `feat`.
- **Como testar:** `npm run dev`, a tela de entrada, e com login, Início, Treino e Configurações.
- **Design:** o resultado do Step 3, com as capturas.
- **Notas adicionais:**
  - o PR inclui a spec e o plano da identidade;
  - as #344, #351 e #352 continuam abertas como lista de conferência por tela;
  - os commits da spec trazem `.claude/launch.json` com `api-dev` e `web-dev`.

Expected: URL do PR. Depois, siga a skill `finalizar-pr` (gate do Copilot e merge só com o ok do Leonardo).

---

## Parte C: etapa 2, os componentes (issue B)

### Task 9: branch, `cx` e formatador pt-BR

**Files:**
- Create: `apps/web/src/ui/cx.ts`, `apps/web/src/ui/cx.test.ts`
- Create: `apps/web/src/utils/format.ts`, `apps/web/src/utils/format.test.ts`

**Interfaces:**
- Produces:
  - `cx(...parts: Array<string | false | null | undefined>): string`;
  - `EMPTY_VALUE = 'sem dado'`;
  - `formatNumber(value: number, decimals: number): string`;
  - `formatCompact(value: number, maxDecimals = 2): string`;
  - `parseDecimal(input: string): number`.

- [ ] **Step 1: Branch**

Se o PR da etapa 1 já foi mergeado: `git switch main && git pull && git switch -c feat/$B-componentes-base`. Se ainda não foi, parta do branch da etapa 1 (`git switch feat/$A-fundacao-identidade && git switch -c feat/$B-componentes-base`) e abra o PR com base nele, rebaseando em `main` depois do merge.

- [ ] **Step 2: Testes de `cx` e do formatador**

`apps/web/src/ui/cx.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { cx } from './cx';

describe('cx', () => {
  it('junta as classes com espaço', () => {
    expect(cx('a', 'b')).toBe('a b');
  });

  it('ignora false, null, undefined e string vazia', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('devolve string vazia sem classes', () => {
    expect(cx()).toBe('');
  });
});
```

`apps/web/src/utils/format.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { EMPTY_VALUE, formatCompact, formatNumber, parseDecimal } from './format';

describe('formatNumber', () => {
  it('usa vírgula decimal e casas fixas', () => {
    expect(formatNumber(522.5, 1)).toBe('522,5');
    expect(formatNumber(125, 1)).toBe('125,0');
    expect(formatNumber(5, 0)).toBe('5');
  });

  it('usa ponto de milhar pt-BR', () => {
    expect(formatNumber(1102.5, 1)).toBe('1.102,5');
    expect(formatNumber(18400, 0)).toBe('18.400');
  });

  it('nunca mostra zero negativo', () => {
    expect(formatNumber(-0, 1)).toBe('0,0');
    expect(formatNumber(-0.04, 1)).toBe('0,0');
  });

  it('mantém o sinal de valores negativos de verdade', () => {
    expect(formatNumber(-0.6, 1)).toBe('-0,6');
  });

  it('devolve "sem dado" para valores não finitos', () => {
    expect(formatNumber(NaN, 1)).toBe(EMPTY_VALUE);
    expect(formatNumber(Infinity, 1)).toBe('sem dado');
  });
});

describe('formatCompact', () => {
  it('remove zeros à direita', () => {
    expect(formatCompact(142.5)).toBe('142,5');
    expect(formatCompact(100)).toBe('100');
    expect(formatCompact(1.25)).toBe('1,25');
  });

  it('respeita o máximo de casas', () => {
    expect(formatCompact(83.456, 1)).toBe('83,5');
  });

  it('devolve "sem dado" para NaN', () => {
    expect(formatCompact(NaN)).toBe('sem dado');
  });
});

describe('parseDecimal', () => {
  it('aceita vírgula e ponto como separador decimal', () => {
    expect(parseDecimal('82,5')).toBe(82.5);
    expect(parseDecimal('82.5')).toBe(82.5);
    expect(parseDecimal(' 512,5 ')).toBe(512.5);
  });

  it('devolve NaN para texto vazio ou inválido', () => {
    expect(parseDecimal('')).toBeNaN();
    expect(parseDecimal('abc')).toBeNaN();
    expect(parseDecimal('1,2,3')).toBeNaN();
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm run test -w @powerlifting/web -- cx format`
Expected: FAIL, porque os módulos ainda não existem.

- [ ] **Step 4: Implementar**

`apps/web/src/ui/cx.ts`:

```ts
/** Junta classes CSS ignorando valores falsos: cx('a', cond && 'b') → 'a b'. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
```

`apps/web/src/utils/format.ts`:

```ts
/**
 * Formatação numérica pt-BR do app (vírgula decimal, ponto de milhar).
 * Espelha apps/landing/src/lib/format.ts; no app o valor vazio é "sem dado",
 * sem travessão (#345). Funções puras, testadas em format.test.ts.
 */

export const EMPTY_VALUE = 'sem dado';

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(min: number, max: number): Intl.NumberFormat {
  const key = `${min}:${max}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: min, maximumFractionDigits: max });
    formatters.set(key, f);
  }
  return f;
}

/** Zera valores que arredondariam para "-0" (ex.: -0,04 com 1 casa). */
function dropNegativeZero(value: number, decimals: number): number {
  return Math.abs(value) < 0.5 * 10 ** -decimals ? 0 : value;
}

/** Casas decimais fixas: formatNumber(125, 1) → "125,0". Não finito → "sem dado". */
export function formatNumber(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return EMPTY_VALUE;
  return getFormatter(decimals, decimals).format(dropNegativeZero(value, decimals));
}

/** Até `maxDecimals` casas, sem zeros à direita: 142.5 → "142,5", 100 → "100". */
export function formatCompact(value: number, maxDecimals = 2): string {
  if (!Number.isFinite(value)) return EMPTY_VALUE;
  return getFormatter(0, maxDecimals).format(dropNegativeZero(value, maxDecimals));
}

/**
 * Converte a digitação do usuário em número. Aceita vírgula ou ponto como
 * separador decimal e ignora espaços. Devolve NaN para texto inválido ou vazio.
 */
export function parseDecimal(input: string): number {
  const cleaned = input.trim().replace(/\s+/g, '').replace(',', '.');
  if (cleaned === '' || cleaned === '.' || cleaned === '-') return NaN;
  if (!/^-?\d*\.?\d*$/.test(cleaned)) return NaN;
  return Number(cleaned);
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm run test -w @powerlifting/web -- cx format`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/ui/cx.ts apps/web/src/ui/cx.test.ts apps/web/src/utils/format.ts apps/web/src/utils/format.test.ts
git commit -m "feat(web): cx e formatador de números pt-BR (#$B)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 10: catálogo `/catalogo` (só em dev) e script de capturas

**Files:**
- Create: `apps/web/src/dev/Catalogo.tsx`, `apps/web/src/dev/Catalogo.module.css`
- Modify: `apps/web/src/main.tsx`
- Create: `apps/web/scripts/catalogo-shots.mjs`
- Modify: `apps/web/package.json` (script `catalogo:shots`)

**Interfaces:**
- Produces:
  - página `Catalogo` (export default) com a função local `Section({ title, children })`;
  - o marcador `{/* fim das seções */}`, onde as próximas tasks inserem seções;
  - as classes `styles.row`, `styles.narrow`, `styles.swatches`, `styles.swatch`, `styles.chip`, `styles.typeSample` e `styles.typeName`.

- [ ] **Step 1: `apps/web/src/dev/Catalogo.module.css`**

```css
.page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  min-height: 100dvh;
  padding: var(--space-4) var(--space-4) var(--space-8);
  background: var(--surface-0);
}

.pageTitle {
  margin: 0;
  font-family: var(--font-num);
  font-size: var(--title-1);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.01em;
}

.intro {
  margin: 0;
  font-size: var(--fs-sm);
  color: var(--text-2);
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.sectionTitle {
  margin: 0;
  font-family: var(--font-text);
  font-size: var(--fs-xs);
  font-weight: 600;
  letter-spacing: 0;
  color: var(--text-2);
}

.items {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.narrow {
  width: 100px;
}

.swatches {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

.swatch {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--fs-caption);
  color: var(--text-2);
}

.chip {
  flex: none;
  width: 28px;
  height: 28px;
  border: 1px solid var(--line);
  border-radius: var(--radius-field);
}

.typeSample {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.typeName {
  flex: none;
  width: 80px;
  font-size: var(--fs-caption);
  color: var(--text-3);
}
```

- [ ] **Step 2: `apps/web/src/dev/Catalogo.tsx` com a seção de tokens**

```tsx
import type { ReactNode } from 'react';
import styles from './Catalogo.module.css';

const COLORS = [
  '--surface-0', '--surface-1', '--surface-2', '--surface-3', '--line',
  '--text-1', '--text-2', '--text-3', '--text-off',
  '--now', '--now-ink', '--danger', '--danger-ink',
] as const;
const NUMBERS = [['--num-xl', '522,5'], ['--num-lg', '1:48'], ['--num-md', '150'], ['--num-sm', '182,5']] as const;
const TITLES = ['--title-1', '--title-2', '--title-3'] as const;
const TEXTS = ['--fs-body', '--fs-sm', '--fs-xs', '--fs-caption', '--fs-label'] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.items}>{children}</div>
    </section>
  );
}

/** Catálogo dos componentes base em todos os estados. Só existe no `npm run dev` (ver main.tsx). */
export default function Catalogo() {
  return (
    <main className={styles.page}>
      <h1 className={styles.pageTitle}>Catálogo ONYX</h1>
      <p className={styles.intro}>Tokens e componentes base em todos os estados. Só existe no npm run dev.</p>

      <Section title="Cores">
        <div className={styles.swatches}>
          {COLORS.map((c) => (
            <span key={c} className={styles.swatch}>
              <span className={styles.chip} style={{ background: `var(${c})` }} />
              {c}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Números (Barlow Condensed)">
        {NUMBERS.map(([token, sample]) => (
          <div key={token} className={styles.typeSample}>
            <span className={styles.typeName}>{token}</span>
            <span style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: `var(${token})`, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{sample}</span>
          </div>
        ))}
      </Section>

      <Section title="Títulos e texto">
        {TITLES.map((t) => (
          <div key={t} className={styles.typeSample}>
            <span className={styles.typeName}>{t}</span>
            <span style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: `var(${t})`, lineHeight: 1.1 }}>Agachamento pesado</span>
          </div>
        ))}
        {TEXTS.map((t) => (
          <div key={t} className={styles.typeSample}>
            <span className={styles.typeName}>{t}</span>
            <span style={{ fontSize: `var(${t})` }}>Bloco de força, semana 3 de 4</span>
          </div>
        ))}
      </Section>

      {/* fim das seções */}
    </main>
  );
}
```

- [ ] **Step 3: `main.tsx` abre o catálogo só em dev**

Substitua o conteúdo de `apps/web/src/main.tsx` por:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { captureHandoffFromUrl } from './utils/strengthHandoff'

const root = createRoot(document.getElementById('root')!)

// Catálogo de componentes (/catalogo): só no npm run dev. O Vite troca
// import.meta.env.DEV por false no build e o import some do bundle.
if (import.meta.env.DEV && window.location.pathname === '/catalogo') {
  void import('./dev/Catalogo').then(({ default: Catalogo }) => {
    root.render(
      <StrictMode>
        <Catalogo />
      </StrictMode>,
    )
  })
} else {
  // Handoff da calculadora de força da landing (#318): lê /registro#forca= antes de
  // qualquer tela e limpa a URL.
  const { openRegister } = captureHandoffFromUrl(window.location)

  root.render(
    <StrictMode>
      <App openRegister={openRegister} />
    </StrictMode>,
  )
}
```

- [ ] **Step 4: Script de capturas `apps/web/scripts/catalogo-shots.mjs`**

```js
// Captura o catálogo (/catalogo) em 375 e 480 px para a revisão de design.
// Uso, com `npm run dev` rodando:
//   npm run catalogo:shots -w @powerlifting/web -- [pasta-de-saida] [--sem-fontes]
// --sem-fontes bloqueia o Google Fonts para ver o fallback (primeira abertura sem internet).
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const semFontes = args.includes('--sem-fontes');
const out = args.find((a) => !a.startsWith('--')) ?? join(tmpdir(), 'onyx-catalogo');
const url = process.env.CATALOGO_URL ?? 'http://localhost:5173/catalogo';

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const width of [375, 480]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  if (semFontes) await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  const name = `catalogo-${width}${semFontes ? '-sem-fontes' : ''}.png`;
  await page.screenshot({ path: join(out, name), fullPage: true });
  await page.close();
}
await browser.close();
console.log(`Capturas salvas em ${out}`);
```

Em `apps/web/package.json`, nos `scripts`, depois de `"og-image"`, acrescente `"catalogo:shots": "node scripts/catalogo-shots.mjs",`.

- [ ] **Step 5: Conferir dev e produção**

Run: `npm run dev`. Em outro terminal: `npm run catalogo:shots -w @powerlifting/web`.
Expected: `Capturas salvas em …` e as duas imagens com as cores e a escala tipográfica.

Run: `npm run build && grep -rl "Catálogo ONYX" apps/web/dist || echo "fora do bundle"`
Expected: `fora do bundle`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/dev apps/web/src/main.tsx apps/web/scripts/catalogo-shots.mjs apps/web/package.json
git commit -m "feat(web): catálogo de componentes em /catalogo (só em dev) e script de capturas (#$B)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 11: `Segments` (lógica e componente)

**Files:**
- Create: `apps/web/src/ui/Segments/segmentStates.ts`, `apps/web/src/ui/Segments/segmentStates.test.ts`
- Create: `apps/web/src/ui/Segments/Segments.tsx`, `apps/web/src/ui/Segments/Segments.module.css`
- Create: `apps/web/src/ui/index.ts`
- Modify: `apps/web/src/dev/Catalogo.tsx`

**Interfaces:**
- Consumes: `cx` (Task 9).
- Produces:
  - `type SegmentState = 'done' | 'current' | 'pending'`;
  - `type SegmentsMode = 'progress' | 'countdown'`;
  - `MAX_SEGMENTS = 60`;
  - `segmentStates({ total, filled, mode, withCurrent? }): SegmentState[]`;
  - `countdownFilled(remainingSec: number, totalSec: number, segments: number): number`;
  - componente `Segments` com props `{ total: number; filled: number; mode?: SegmentsMode; withCurrent?: boolean; size?: 'sm' | 'md'; label: string; className?: string }`;
  - barril `ui/index.ts`, que exporta só componentes e tipos. Funções puras são importadas do próprio arquivo, para não quebrar a regra `react-refresh/only-export-components`.

- [ ] **Step 1: Testes de `segmentStates` e `countdownFilled`**

`apps/web/src/ui/Segments/segmentStates.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { MAX_SEGMENTS, countdownFilled, segmentStates } from './segmentStates';

describe('segmentStates', () => {
  it('progress: feitos, o atual e os pendentes', () => {
    expect(segmentStates({ total: 5, filled: 2, mode: 'progress' })).toEqual(['done', 'done', 'current', 'pending', 'pending']);
  });

  it('progress sem atual', () => {
    expect(segmentStates({ total: 4, filled: 2, mode: 'progress', withCurrent: false })).toEqual(['done', 'done', 'pending', 'pending']);
  });

  it('progress completo não tem atual', () => {
    expect(segmentStates({ total: 3, filled: 3, mode: 'progress' })).toEqual(['done', 'done', 'done']);
  });

  it('countdown: o restante fica aceso como atual', () => {
    expect(segmentStates({ total: 4, filled: 3, mode: 'countdown' })).toEqual(['current', 'current', 'current', 'pending']);
  });

  it('corta filled fora do intervalo', () => {
    expect(segmentStates({ total: 3, filled: 9, mode: 'progress' })).toEqual(['done', 'done', 'done']);
    expect(segmentStates({ total: 3, filled: -2, mode: 'progress' })).toEqual(['current', 'pending', 'pending']);
  });

  it('total inválido não desenha nada', () => {
    expect(segmentStates({ total: 0, filled: 0, mode: 'progress' })).toEqual([]);
    expect(segmentStates({ total: NaN, filled: 1, mode: 'progress' })).toEqual([]);
    expect(segmentStates({ total: -4, filled: 1, mode: 'countdown' })).toEqual([]);
  });

  it('40 séries desenham 40 segmentos', () => {
    expect(segmentStates({ total: 40, filled: 10, mode: 'progress' })).toHaveLength(40);
  });

  it('acima de MAX_SEGMENTS escala proporcionalmente', () => {
    const s = segmentStates({ total: 120, filled: 60, mode: 'progress' });
    expect(s).toHaveLength(MAX_SEGMENTS);
    expect(s.filter((x) => x === 'done')).toHaveLength(30);
    expect(s[30]).toBe('current');
  });
});

describe('countdownFilled', () => {
  it('arredonda para cima: 108 de 180 s em 18 segmentos acende 11', () => {
    expect(countdownFilled(108, 180, 18)).toBe(11);
  });

  it('tempo acabado apaga tudo', () => {
    expect(countdownFilled(0, 180, 18)).toBe(0);
    expect(countdownFilled(-5, 180, 18)).toBe(0);
  });

  it('restante acima do total (+15 s) acende todos', () => {
    expect(countdownFilled(195, 180, 18)).toBe(18);
  });

  it('total ou segmentos inválidos apagam tudo', () => {
    expect(countdownFilled(30, 0, 18)).toBe(0);
    expect(countdownFilled(30, 180, 0)).toBe(0);
    expect(countdownFilled(NaN, 180, 18)).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test -w @powerlifting/web -- segmentStates`
Expected: FAIL, porque o módulo ainda não existe.

- [ ] **Step 3: Implementar `segmentStates.ts`**

```ts
export type SegmentState = 'done' | 'current' | 'pending';
export type SegmentsMode = 'progress' | 'countdown';

export interface SegmentsInput {
  total: number;
  filled: number;
  mode: SegmentsMode;
  withCurrent?: boolean;
}

/** Maior quantidade de segmentos desenhada; acima disso, os estados são escalados. */
export const MAX_SEGMENTS = 60;

/**
 * Estado de cada segmento da barra.
 * - progress: os `filled` primeiros são 'done'; o seguinte é 'current' (se `withCurrent`); o resto, 'pending'.
 * - countdown: os `filled` primeiros (tempo restante) são 'current'; o resto, 'pending'.
 * `total` é truncado e limitado a [0, ∞); `filled`, a [0, total]. Acima de MAX_SEGMENTS,
 * desenha MAX_SEGMENTS segmentos com `filled` escalado na mesma proporção.
 */
export function segmentStates({ total, filled, mode, withCurrent = true }: SegmentsInput): SegmentState[] {
  const rawTotal = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  const rawFilled = Number.isFinite(filled) ? Math.min(rawTotal, Math.max(0, Math.floor(filled))) : 0;
  const count = Math.min(MAX_SEGMENTS, rawTotal);
  const lit = rawTotal > MAX_SEGMENTS ? Math.floor((rawFilled * MAX_SEGMENTS) / rawTotal) : rawFilled;

  return Array.from({ length: count }, (_, i): SegmentState => {
    if (i < lit) return mode === 'countdown' ? 'current' : 'done';
    if (mode === 'progress' && withCurrent && i === lit) return 'current';
    return 'pending';
  });
}

/**
 * Quantos segmentos ficam acesos numa contagem regressiva. Arredonda para cima,
 * para o último segmento só apagar quando o tempo acabar. Restante acima do total
 * (ex.: +15 s além do padrão) acende todos; entradas inválidas apagam todos.
 */
export function countdownFilled(remainingSec: number, totalSec: number, segments: number): number {
  if (!(totalSec > 0) || !(segments > 0) || !Number.isFinite(remainingSec)) return 0;
  const ratio = Math.min(1, Math.max(0, remainingSec / totalSec));
  return Math.ceil(ratio * segments);
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test -w @powerlifting/web -- segmentStates`
Expected: PASS (12 testes).

- [ ] **Step 5: Componente `Segments`**

`apps/web/src/ui/Segments/Segments.module.css`:

```css
.segments {
  display: grid;
  gap: var(--seg-gap);
  width: 100%;
}

.sm {
  height: var(--seg-h-sm);
}

.md {
  height: var(--seg-h);
}

.segment {
  border-radius: var(--radius-seg);
  transition: background-color var(--dur-state) var(--ease-out);
}

.done {
  background: var(--text-1);
}

.current {
  background: var(--now);
}

.pending {
  background: var(--surface-3);
}
```

`apps/web/src/ui/Segments/Segments.tsx`:

```tsx
import { cx } from '../cx';
import { segmentStates, type SegmentsMode } from './segmentStates';
import styles from './Segments.module.css';

export interface SegmentsProps {
  total: number;
  filled: number;
  mode?: SegmentsMode;
  withCurrent?: boolean;
  size?: 'sm' | 'md';
  /** Descrição para leitor de tela, ex.: "5 de 17 séries concluídas". */
  label: string;
  className?: string;
}

/** Barra segmentada, a assinatura da identidade: progresso (feitos + atual) ou contagem regressiva. */
export function Segments({ total, filled, mode = 'progress', withCurrent = true, size = 'md', label, className }: SegmentsProps) {
  const states = segmentStates({ total, filled, mode, withCurrent });
  return (
    <div
      role="img"
      aria-label={label}
      className={cx(styles.segments, styles[size], className)}
      style={{ gridTemplateColumns: `repeat(${states.length}, minmax(0, 1fr))` }}
    >
      {states.map((state, i) => (
        <span key={i} className={cx(styles.segment, styles[state])} />
      ))}
    </div>
  );
}
```

`apps/web/src/ui/index.ts`:

```ts
// Componentes base do app (spec 2026-10-06 §4). Só componentes e tipos: funções puras
// são importadas do próprio arquivo (ex.: './Segments/segmentStates').
export { Segments } from './Segments/Segments';
export type { SegmentsProps } from './Segments/Segments';
```

- [ ] **Step 6: Seção no catálogo**

Em `Catalogo.tsx`, acrescente aos imports:

```tsx
import { Segments } from '../ui';
import { countdownFilled } from '../ui/Segments/segmentStates';
```

E imediatamente antes de `{/* fim das seções */}`:

```tsx
      <Section title="Segments">
        <Segments total={17} filled={5} label="5 de 17 séries concluídas" />
        <Segments total={18} filled={countdownFilled(108, 180, 18)} mode="countdown" label="1:48 de descanso restantes" />
        <div className={styles.narrow}>
          <Segments total={4} filled={2} size="sm" label="Semana 3 de 4 do bloco" />
        </div>
        <Segments total={40} filled={12} label="12 de 40 séries concluídas" />
        <Segments total={0} filled={0} label="Sem séries" />
      </Section>
```

- [ ] **Step 7: Build, lint e capturas**

Run: `npm run build && npm run lint && npm run test`
Expected: passa.

Run: com `npm run dev` rodando, `npm run catalogo:shots -w @powerlifting/web`
Expected: na seção Segments, 5 brancos, 1 dourado e 11 escuros; 11 dourados e 7 escuros; o bloco estreito de 4 segmentos; 40 segmentos finos e visíveis; e a linha "Sem séries" vazia, sem erro.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/ui/Segments apps/web/src/ui/index.ts apps/web/src/dev/Catalogo.tsx
git commit -m "feat(web): Segments, a barra segmentada da identidade (#$B)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 12: `Button` e `IconButton`

**Files:**
- Create: `apps/web/src/ui/Button/Button.tsx`, `apps/web/src/ui/Button/Button.module.css`
- Create: `apps/web/src/ui/IconButton/IconButton.tsx`, `apps/web/src/ui/IconButton/IconButton.module.css`
- Modify: `apps/web/src/ui/index.ts`, `apps/web/src/dev/Catalogo.tsx`

**Interfaces:**
- Consumes: `cx`.
- Produces:
  - `Button` com props `ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'link' | 'danger'; size?: 'lg' | 'md'; loading?: boolean; icon?: ReactNode; block?: boolean }`, com `type` padrão `'button'`;
  - `IconButton` com props `Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> & { 'aria-label': string; icon: ReactNode; variant?: 'filled' | 'plain' }`.

- [ ] **Step 1: `Button.module.css`**

```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 0;
  border-radius: var(--radius-button);
  font-family: var(--font-text);
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
  transition:
    transform var(--dur-press) var(--ease-out),
    background-color var(--dur-state) var(--ease-out),
    opacity var(--dur-state) var(--ease-out);
}

.button:active:not(:disabled) {
  transform: scale(0.97);
}

.button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.lg {
  height: 56px;
  padding: 0 var(--space-6);
  font-family: var(--font-num);
  font-size: var(--title-3);
}

.md {
  height: var(--tap);
  padding: 0 var(--space-4);
  font-size: var(--fs-sm);
}

.block {
  width: 100%;
}

.primary {
  background: var(--now);
  color: var(--now-ink);
}

.secondary {
  background: var(--surface-3);
  color: var(--text-1);
}

.danger {
  background: var(--danger);
  color: var(--danger-ink);
}

.link {
  background: transparent;
  color: var(--text-1);
  padding: 0 var(--space-2);
}

.loading,
.loading:disabled {
  opacity: 0.7;
  cursor: progress;
}

.icon {
  display: inline-flex;
}

@media (prefers-reduced-motion: reduce) {
  .button {
    transition: none;
  }

  .button:active:not(:disabled) {
    transform: none;
  }
}
```

- [ ] **Step 2: `Button.tsx`**

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'link' | 'danger';
export type ButtonSize = 'lg' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `primary` é dourado (= agora): no máximo um por tela. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  /** Largura total. */
  block?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  block = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, styles[size], styles[variant], block && styles.block, loading && styles.loading, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}
```

- [ ] **Step 3: `IconButton.module.css` e `IconButton.tsx`**

```css
.iconButton {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--tap);
  height: var(--tap);
  border: 0;
  border-radius: var(--radius-button);
  cursor: pointer;
  touch-action: manipulation;
  transition:
    transform var(--dur-press) var(--ease-out),
    background-color var(--dur-state) var(--ease-out);
}

.iconButton:active:not(:disabled) {
  transform: scale(0.97);
}

.iconButton:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.filled {
  background: var(--surface-3);
  color: var(--text-1);
}

.plain {
  background: transparent;
  color: var(--text-2);
}

.glyph {
  display: inline-flex;
}

@media (prefers-reduced-motion: reduce) {
  .iconButton {
    transition: none;
  }

  .iconButton:active:not(:disabled) {
    transform: none;
  }
}
```

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import styles from './IconButton.module.css';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  /** Obrigatório: botão só de ícone precisa de nome para leitor de tela. */
  'aria-label': string;
  icon: ReactNode;
  variant?: 'filled' | 'plain';
}

export function IconButton({ icon, variant = 'filled', className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button type={type} className={cx(styles.iconButton, styles[variant], className)} {...rest}>
      <span className={styles.glyph} aria-hidden="true">{icon}</span>
    </button>
  );
}
```

- [ ] **Step 4: Barril e catálogo**

Em `ui/index.ts`, acrescente:

```ts
export { Button } from './Button/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button/Button';
export { IconButton } from './IconButton/IconButton';
export type { IconButtonProps } from './IconButton/IconButton';
```

Em `Catalogo.tsx`:
- troque `import { Segments } from '../ui';` por `import { Button, IconButton, Segments } from '../ui';`;
- acrescente `import { MoreHorizontal, Play, Plus } from 'lucide-react';`;
- antes de `{/* fim das seções */}`, inclua:

```tsx
      <Section title="Button">
        <Button variant="primary" size="lg" block icon={<Play size={18} fill="currentColor" />}>Começar treino</Button>
        <Button variant="link">Treino avulso</Button>
        <div className={styles.row}>
          <Button variant="secondary">Registrar</Button>
          <Button variant="secondary" disabled>Desabilitado</Button>
          <Button variant="secondary" loading>Salvando</Button>
        </div>
        <div className={styles.row}>
          <Button variant="primary">Concluir série</Button>
          <Button variant="danger">Descartar treino</Button>
        </div>
      </Section>

      <Section title="IconButton">
        <div className={styles.row}>
          <IconButton aria-label="Registrar peso" icon={<Plus size={20} />} />
          <IconButton aria-label="Mais opções" variant="plain" icon={<MoreHorizontal size={20} />} />
          <IconButton aria-label="Desabilitado" disabled icon={<Plus size={20} />} />
        </div>
      </Section>
```

Nesta seção aparece mais de um botão primário porque o catálogo mostra estados. Em tela, a regra continua sendo um por tela.

- [ ] **Step 5: Build, lint e capturas**

Run: `npm run build && npm run lint && npm run test`, depois `npm run catalogo:shots -w @powerlifting/web`.
Expected:
- primário dourado com texto escuro, secundário cinza, link sem fundo e "Descartar treino" vermelho com texto escuro;
- desabilitado com 40% de opacidade;
- "Salvando" com 70%;
- nenhum botão abaixo de 44 px de altura.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/ui/Button apps/web/src/ui/IconButton apps/web/src/ui/index.ts apps/web/src/dev/Catalogo.tsx
git commit -m "feat(web): Button e IconButton (#$B)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 13: `Block` e `ListRow`

**Files:**
- Create: `apps/web/src/ui/Block/Block.tsx`, `apps/web/src/ui/Block/Block.module.css`
- Create: `apps/web/src/ui/ListRow/ListRow.tsx`, `apps/web/src/ui/ListRow/ListRow.module.css`
- Modify: `apps/web/src/ui/index.ts`, `apps/web/src/dev/Catalogo.tsx`

**Interfaces:**
- Produces:
  - `Block` com props `HTMLAttributes<HTMLElement> & { label?: ReactNode; aside?: ReactNode }`; em dev, avisa no console quando é aninhado;
  - `ListRow` com props `{ title: ReactNode; meta?: ReactNode; trailing?: ReactNode; onClick?: () => void; className?: string }`; com `onClick` vira `<button>` com chevron, sem ele vira `<div>`.

- [ ] **Step 1: `Block`**

`Block.module.css`:

```css
.block {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-block);
  background: var(--surface-1);
}

.header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
}

.label {
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--text-2);
}

.aside {
  font-size: var(--fs-caption);
  color: var(--text-2);
  text-align: right;
}
```

`Block.tsx`:

```tsx
import { createContext, useContext, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Block.module.css';

const InsideBlock = createContext(false);

export interface BlockProps extends HTMLAttributes<HTMLElement> {
  /** Rótulo do cabeçalho, à esquerda. */
  label?: ReactNode;
  /** Meta ou ação à direita do cabeçalho. */
  aside?: ReactNode;
}

/** Bloco de superfície. Nunca dentro de outro Block: use ListRow ou divisória. */
export function Block({ label, aside, className, children, ...rest }: BlockProps) {
  const nested = useContext(InsideBlock);
  if (nested && import.meta.env.DEV) {
    console.error('ONYX: Block dentro de Block. Use ListRow ou uma divisória no lugar.');
  }
  return (
    <InsideBlock.Provider value={true}>
      <section className={cx(styles.block, className)} {...rest}>
        {(label || aside) && (
          <header className={styles.header}>
            {label && <span className={styles.label}>{label}</span>}
            {aside && <span className={styles.aside}>{aside}</span>}
          </header>
        )}
        {children}
      </section>
    </InsideBlock.Provider>
  );
}
```

- [ ] **Step 2: `ListRow`**

`ListRow.module.css`:

```css
.row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: 52px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-1);
  text-align: left;
}

.row + .row {
  border-top: 1px solid var(--line);
}

.interactive {
  cursor: pointer;
  touch-action: manipulation;
  transition: opacity var(--dur-state) var(--ease-out);
}

.row.interactive:active:not(:disabled) {
  transform: none;
  opacity: 0.7;
}

.title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-family: var(--font-num);
  font-size: var(--title-3);
  font-weight: 600;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  font-size: var(--fs-xs);
  color: var(--text-2);
  white-space: nowrap;
}

.chevron {
  flex: none;
  color: var(--text-3);
}
```

`ListRow.tsx`:

```tsx
import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cx } from '../cx';
import styles from './ListRow.module.css';

export interface ListRowProps {
  title: ReactNode;
  meta?: ReactNode;
  /** Substitui o chevron padrão das linhas tocáveis. */
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
}

/** Linha de lista com divisória entre linhas vizinhas. Com onClick vira botão com chevron. */
export function ListRow({ title, meta, trailing, onClick, className }: ListRowProps) {
  const content = (
    <>
      <span className={styles.title}>{title}</span>
      {meta && <span className={styles.meta}>{meta}</span>}
      {trailing ?? (onClick ? <ChevronRight size={18} className={styles.chevron} aria-hidden="true" /> : null)}
    </>
  );
  if (onClick) {
    return (
      <button type="button" className={cx(styles.row, styles.interactive, className)} onClick={onClick}>
        {content}
      </button>
    );
  }
  return <div className={cx(styles.row, className)}>{content}</div>;
}
```

- [ ] **Step 3: Barril e catálogo**

Em `ui/index.ts`, acrescente:

```ts
export { Block } from './Block/Block';
export type { BlockProps } from './Block/Block';
export { ListRow } from './ListRow/ListRow';
export type { ListRowProps } from './ListRow/ListRow';
```

Em `Catalogo.tsx`, acrescente `Block` e `ListRow` ao import de `'../ui'` e, antes de `{/* fim das seções */}`:

```tsx
      <Section title="Block e ListRow">
        <Block label="Depois" aside="3 exercícios">
          <div>
            <ListRow title="Supino pausado" meta="4 séries, 102,5 kg" onClick={() => undefined} />
            <ListRow title="Stiff" meta="3 séries, 120 kg" onClick={() => undefined} />
            <ListRow title="Remada curvada com nome bem longo para testar o corte" meta="3 séries, 80 kg" onClick={() => undefined} />
          </div>
        </Block>
        <Block>
          <ListRow title="Linha sem toque" meta="só informação" />
        </Block>
      </Section>
```

Os `ListRow` ficam dentro de uma `<div>` própria para que a regra `.row + .row` só desenhe divisória entre linhas vizinhas, e não entre o cabeçalho do bloco e a primeira linha.

- [ ] **Step 4: Build, lint e capturas**

Run: `npm run build && npm run lint && npm run test` e `npm run catalogo:shots -w @powerlifting/web`.
Expected: blocos em `#171614` sem borda, divisórias só entre linhas, o nome longo cortado com reticências e o chevron alinhado à direita.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/ui/Block apps/web/src/ui/ListRow apps/web/src/ui/index.ts apps/web/src/dev/Catalogo.tsx
git commit -m "feat(web): Block e ListRow (#$B)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 14: `Stat`, `Field` e `SegmentedControl`

**Files:**
- Create: `apps/web/src/ui/Stat/Stat.tsx` e `.module.css`
- Create: `apps/web/src/ui/Field/Field.tsx` e `.module.css`
- Create: `apps/web/src/ui/SegmentedControl/SegmentedControl.tsx` e `.module.css`
- Modify: `apps/web/src/ui/index.ts`, `apps/web/src/dev/Catalogo.tsx`

**Interfaces:**
- Consumes: `formatNumber`, `formatCompact` e `EMPTY_VALUE` (Task 9).
- Produces:
  - `Stat` com props `{ value: number; decimals?: number; unit?: string; size?: 'xl' | 'lg' | 'md' | 'sm'; label?: ReactNode; delta?: ReactNode; className?: string }`. Com `NaN`, mostra "sem dado".
  - `Field` com props `Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & { label: string; error?: string; hint?: string; variant?: 'default' | 'set'; hideLabel?: boolean }`.
  - `SegmentedControl<T extends string>` com props `{ options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void; label: string }`.

- [ ] **Step 1: `Stat`**

`Stat.module.css`:

```css
.stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.label {
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--text-2);
}

.figure {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.value {
  font-family: var(--font-num);
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
  color: var(--text-1);
}

.unit {
  font-family: var(--font-num);
  font-weight: 600;
  color: var(--text-2);
}

.empty {
  padding: var(--space-2) 0;
  font-size: var(--fs-sm);
  color: var(--text-2);
}

.delta {
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--text-1);
}

.xl .value { font-size: var(--num-xl); }
.xl .unit { font-size: var(--num-sm); }
.lg .value { font-size: var(--num-lg); }
.lg .unit { font-size: var(--title-3); }
.md .value { font-size: var(--num-md); }
.md .unit { font-size: var(--fs-body); }
.sm .value { font-size: var(--num-sm); }
.sm .unit { font-size: var(--fs-xs); }
```

`Stat.tsx`:

```tsx
import type { ReactNode } from 'react';
import { cx } from '../cx';
import { EMPTY_VALUE, formatCompact, formatNumber } from '../../utils/format';
import styles from './Stat.module.css';

export type StatSize = 'xl' | 'lg' | 'md' | 'sm';

export interface StatProps {
  /** Passe NaN quando não houver dado: o Stat mostra "sem dado" em vez de inventar número. */
  value: number;
  /** Casas fixas (ex.: 1 para e1RM). Sem isso, até 2 casas sem zero à direita. */
  decimals?: number;
  unit?: string;
  size?: StatSize;
  label?: ReactNode;
  delta?: ReactNode;
  className?: string;
}

/** Número de placar: valor, unidade, legenda e variação. */
export function Stat({ value, decimals, unit, size = 'md', label, delta, className }: StatProps) {
  const hasValue = Number.isFinite(value);
  const text = decimals === undefined ? formatCompact(value) : formatNumber(value, decimals);
  return (
    <div className={cx(styles.stat, styles[size], className)}>
      {label && <span className={styles.label}>{label}</span>}
      {hasValue ? (
        <span className={styles.figure}>
          <span className={styles.value}>{text}</span>
          {unit && <span className={styles.unit}>{unit}</span>}
        </span>
      ) : (
        <span className={styles.empty}>{EMPTY_VALUE}</span>
      )}
      {delta && <span className={styles.delta}>{delta}</span>}
    </div>
  );
}
```

- [ ] **Step 2: `Field`**

`Field.module.css`:

```css
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.label {
  font-size: var(--fs-caption);
  font-weight: 600;
  color: var(--text-2);
}

.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.input {
  width: 100%;
  height: 48px;
  padding: 0 var(--space-3);
  border: 1px solid var(--surface-3);
  border-radius: var(--radius-field);
  background: var(--surface-0);
  color: var(--text-1);
  font-family: var(--font-text);
  font-size: 16px;
  transition: border-color var(--dur-state) var(--ease-out);
}

.input::placeholder {
  color: var(--text-3);
}

.input:focus {
  border-color: var(--now);
  box-shadow: none;
  outline: none;
}

.set {
  height: 54px;
  padding: 0;
  border: 1.5px solid var(--text-1);
  text-align: center;
  font-family: var(--font-num);
  font-size: var(--num-md);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.invalid {
  border-color: var(--danger);
}

.message {
  font-size: var(--fs-caption);
  color: var(--text-2);
}

.error {
  color: var(--danger);
}
```

`Field.tsx`:

```tsx
import { useId, type InputHTMLAttributes } from 'react';
import { cx } from '../cx';
import styles from './Field.module.css';

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Rótulo sempre presente (placeholder nunca faz papel de rótulo). */
  label: string;
  error?: string;
  hint?: string;
  /** `set` = campo numérico grande da série atual. */
  variant?: 'default' | 'set';
  /** Esconde o rótulo visualmente, mantendo para leitor de tela (ex.: colunas da tabela de séries). */
  hideLabel?: boolean;
}

/** Campo com rótulo acima e erro abaixo. */
export function Field({ label, error, hint, variant = 'default', hideLabel = false, id, className, ...rest }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-msg`;
  const message = error ?? hint;
  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={inputId} className={cx(styles.label, hideLabel && styles.srOnly)}>{label}</label>
      <input
        id={inputId}
        className={cx(styles.input, variant === 'set' && styles.set, error && styles.invalid)}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...rest}
      />
      {message && <span id={messageId} className={cx(styles.message, error && styles.error)}>{message}</span>}
    </div>
  );
}
```

- [ ] **Step 3: `SegmentedControl`**

`SegmentedControl.module.css`:

```css
.group {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 2px;
  padding: 2px;
  border-radius: var(--radius-button);
  background: var(--surface-0);
}

.option {
  height: var(--tap-min);
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-field);
  background: transparent;
  color: var(--text-2);
  font-family: var(--font-text);
  font-size: var(--fs-xs);
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color var(--dur-state) var(--ease-out),
    color var(--dur-state) var(--ease-out);
}

.selected {
  background: var(--surface-3);
  color: var(--text-1);
}
```

`SegmentedControl.tsx`:

```tsx
import { cx } from '../cx';
import styles from './SegmentedControl.module.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Nome do grupo para leitor de tela. */
  label: string;
}

/** Escolha entre 2 a 4 opções. A selecionada fica em cinza claro, nunca em dourado. */
export function SegmentedControl<T extends string>({ options, value, onChange, label }: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={label} className={styles.group}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            className={cx(styles.option, selected && styles.selected)}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Barril e catálogo**

Em `ui/index.ts`, acrescente:

```ts
export { Stat } from './Stat/Stat';
export type { StatProps, StatSize } from './Stat/Stat';
export { Field } from './Field/Field';
export type { FieldProps } from './Field/Field';
export { SegmentedControl } from './SegmentedControl/SegmentedControl';
export type { SegmentedControlProps, SegmentedOption } from './SegmentedControl/SegmentedControl';
```

Em `Catalogo.tsx`:
- troque `import type { ReactNode } from 'react';` por `import { useState, type ReactNode } from 'react';`;
- acrescente `Stat`, `Field` e `SegmentedControl` ao import de `'../ui'`;
- antes do `return` de `Catalogo`, inclua `const [metric, setMetric] = useState<'e1rm' | 'rel'>('e1rm');`;
- antes de `{/* fim das seções */}`, inclua:

```tsx
      <Section title="Stat">
        <Stat size="xl" value={522.5} decimals={1} unit="kg" label="Total estimado" delta="+7,5 kg nas últimas 4 semanas" />
        <Stat size="xl" value={1102.5} decimals={1} unit="lbs" label="Total em lbs (número grande)" />
        <div className={styles.row}>
          <Stat size="md" value={83.4} unit="kg" label="Peso corporal" />
          <Stat size="sm" value={NaN} unit="kg" label="Sem registro" />
        </div>
      </Section>

      <Section title="Field">
        <Field label="Peso de hoje (kg)" inputMode="decimal" placeholder="83,4" />
        <Field label="E-mail" defaultValue="nome@" error="Digite um e-mail completo." />
        <Field label="Observação" hint="Opcional. Aparece no histórico." />
        <div className={styles.row}>
          <Field label="Peso em kg" hideLabel variant="set" defaultValue="150" inputMode="decimal" />
          <Field label="Repetições" hideLabel variant="set" defaultValue="4" inputMode="numeric" />
        </div>
      </Section>

      <Section title="SegmentedControl">
        <SegmentedControl
          label="Métrica da evolução"
          value={metric}
          onChange={setMetric}
          options={[{ value: 'e1rm', label: 'e1RM' }, { value: 'rel', label: 'Força relativa' }]}
        />
      </Section>
```

- [ ] **Step 5: Build, lint e capturas (com e sem fontes)**

Run: `npm run build && npm run lint && npm run test`. Com `npm run dev` rodando: `npm run catalogo:shots -w @powerlifting/web` e `npm run catalogo:shots -w @powerlifting/web -- --sem-fontes`.
Expected:
- "522,5" e "1.102,5" sem estourar 375 px, e "sem dado" no lugar do número ausente;
- o campo com erro com borda e mensagem vermelhas;
- a opção selecionada em cinza claro, sem dourado;
- na captura `-sem-fontes`, nada estoura com a fonte de fallback (Review Focus 1).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/ui/Stat apps/web/src/ui/Field apps/web/src/ui/SegmentedControl apps/web/src/ui/index.ts apps/web/src/dev/Catalogo.tsx
git commit -m "feat(web): Stat, Field e SegmentedControl (#$B)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 15: `Sheet`, `Toast`, `ScreenHeader` e `EmptyState`

**Files:**
- Create: `apps/web/src/ui/Sheet/Sheet.tsx` e `.module.css`
- Create: `apps/web/src/ui/Toast/Toast.tsx` e `.module.css`
- Create: `apps/web/src/ui/ScreenHeader/ScreenHeader.tsx` e `.module.css`
- Create: `apps/web/src/ui/EmptyState/EmptyState.tsx` e `.module.css`
- Modify: `apps/web/src/ui/index.ts`, `apps/web/src/dev/Catalogo.tsx`

**Interfaces:**
- Produces:
  - `Sheet` com props `{ open: boolean; onClose: () => void; title: string; children: ReactNode; actions?: ReactNode }`; usa o `<dialog>` nativo com `showModal()`, e fecha com Esc ou com toque fora;
  - `Toast` com props `{ message: ReactNode; icon?: ReactNode; tone?: 'neutral' | 'danger'; action?: ReactNode }`;
  - `ScreenHeader` com props `{ title: string; meta?: ReactNode; actions?: ReactNode }`;
  - `EmptyState` com props `{ title: string; description: string; action?: ReactNode; icon?: ReactNode }`.

- [ ] **Step 1: `Sheet`**

`Sheet.module.css`:

```css
.sheet {
  width: 100%;
  max-width: var(--max-width);
  max-height: 85dvh;
  margin: auto auto 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-block) var(--radius-block) 0 0;
  background: var(--surface-1);
  color: var(--text-1);
  box-shadow: var(--shadow-sheet);
}

.sheet[open] {
  animation: sheet-in var(--dur-sheet) var(--ease-out);
}

.sheet::backdrop {
  background: rgba(0, 0, 0, 0.6);
}

.inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-height: 85dvh;
  overflow-y: auto;
  padding: var(--space-3) var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
}

.handle {
  align-self: center;
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: var(--surface-3);
}

.title {
  margin: 0;
  font-family: var(--font-num);
  font-size: var(--title-2);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.01em;
}

.body {
  font-size: var(--fs-sm);
  color: var(--text-2);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

@keyframes sheet-in {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .sheet[open] {
    animation: none;
  }
}
```

`Sheet.tsx`:

```tsx
import { useEffect, useId, useRef, type ReactNode } from 'react';
import styles from './Sheet.module.css';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Botões no rodapé; a ação principal primeiro. */
  actions?: ReactNode;
}

/**
 * Folha que sobe de baixo, sobre o <dialog> nativo: foco preso, Esc fecha, toque fora fecha.
 * Substitui os modais de confirmar, descartar e excluir.
 */
export function Sheet({ open, onClose, title, children, actions }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // O .inner cobre a folha inteira: um clique que chega no próprio <dialog> veio do fundo.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.inner}>
        <div className={styles.handle} aria-hidden="true" />
        <h2 id={titleId} className={styles.title}>{title}</h2>
        <div className={styles.body}>{children}</div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </dialog>
  );
}
```

- [ ] **Step 2: `Toast`**

`Toast.module.css`:

```css
.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: var(--tap);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-button);
  background: var(--surface-3);
  color: var(--text-1);
  font-size: var(--fs-xs);
  font-weight: 600;
}

.danger {
  border-color: var(--danger);
}

.icon {
  flex: none;
  display: inline-flex;
  color: var(--text-2);
}

.danger .icon {
  color: var(--danger);
}

.message {
  flex: 1;
  min-width: 0;
  line-height: 1.35;
}
```

`Toast.tsx`:

```tsx
import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Toast.module.css';

export interface ToastProps {
  message: ReactNode;
  icon?: ReactNode;
  tone?: 'neutral' | 'danger';
  /** Ex.: um IconButton para dispensar. */
  action?: ReactNode;
}

/** Aviso curto. A posição (acima da barra) é de quem usa. */
export function Toast({ message, icon, tone = 'neutral', action }: ToastProps) {
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cx(styles.toast, tone === 'danger' && styles.danger)}>
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      <span className={styles.message}>{message}</span>
      {action}
    </div>
  );
}
```

- [ ] **Step 3: `ScreenHeader` e `EmptyState`**

`ScreenHeader.module.css`:

```css
.header {
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.texts {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.title {
  margin: 0;
  font-family: var(--font-num);
  font-size: var(--title-1);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.01em;
  color: var(--text-1);
}

.meta {
  margin: 0;
  font-size: var(--fs-sm);
  line-height: 1.45;
  color: var(--text-2);
}

.actions {
  flex: none;
  display: flex;
  gap: var(--space-2);
}
```

`ScreenHeader.tsx`:

```tsx
import type { ReactNode } from 'react';
import styles from './ScreenHeader.module.css';

export interface ScreenHeaderProps {
  title: string;
  /** Uma frase de apoio abaixo do título. */
  meta?: ReactNode;
  /** Ações à direita (ex.: botão "Nova rotina"). */
  actions?: ReactNode;
}

/** Título de tela: o único estilo de h1 do app (#352). */
export function ScreenHeader({ title, meta, actions }: ScreenHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.texts}>
        <h1 className={styles.title}>{title}</h1>
        {meta && <p className={styles.meta}>{meta}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
```

`EmptyState.module.css`:

```css
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-8) var(--space-4);
  text-align: center;
}

.icon {
  display: inline-flex;
  margin-bottom: var(--space-2);
  color: var(--text-3);
}

.title {
  margin: 0;
  font-family: var(--font-num);
  font-size: var(--title-2);
  font-weight: 700;
  line-height: 1.1;
}

.description {
  max-width: 280px;
  margin: 0;
  font-size: var(--fs-sm);
  color: var(--text-2);
}

.action {
  margin-top: var(--space-3);
}
```

`EmptyState.tsx`:

```tsx
import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  title: string;
  /** Uma frase: o que falta e o que fazer. */
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}

/** Estado vazio: diz que não há dado em vez de inventar número (#338). */
export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Barril e catálogo**

Em `ui/index.ts`, acrescente:

```ts
export { Sheet } from './Sheet/Sheet';
export type { SheetProps } from './Sheet/Sheet';
export { Toast } from './Toast/Toast';
export type { ToastProps } from './Toast/Toast';
export { ScreenHeader } from './ScreenHeader/ScreenHeader';
export type { ScreenHeaderProps } from './ScreenHeader/ScreenHeader';
export { EmptyState } from './EmptyState/EmptyState';
export type { EmptyStateProps } from './EmptyState/EmptyState';
```

Em `Catalogo.tsx`:
- acrescente `Sheet`, `Toast`, `ScreenHeader` e `EmptyState` ao import de `'../ui'`;
- acrescente `AlertTriangle`, `ClipboardList`, `CloudCheck` e `X` ao import do `lucide-react`;
- inclua `const [sheetOpen, setSheetOpen] = useState(false);` ao lado do `metric`;
- antes de `{/* fim das seções */}`, inclua:

```tsx
      <Section title="ScreenHeader">
        <ScreenHeader title="Biblioteca" actions={<Button variant="secondary" icon={<Plus size={16} />}>Nova rotina</Button>} />
        <ScreenHeader title="Exercícios" meta="Crie exercícios reutilizáveis. Eles aparecem na busca ao montar rotinas e durante o treino." />
      </Section>

      <Section title="Sheet">
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>Abrir folha de finalizar</Button>
        <Sheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Finalizar treino?"
          actions={
            <>
              <Button variant="primary" size="lg" block onClick={() => setSheetOpen(false)}>Finalizar treino</Button>
              <Button variant="danger" block onClick={() => setSheetOpen(false)}>Descartar treino</Button>
              <Button variant="link" block onClick={() => setSheetOpen(false)}>Voltar</Button>
            </>
          }
        >
          5 de 17 séries concluídas. As séries sem check não entram no histórico.
        </Sheet>
      </Section>

      <Section title="Toast">
        <Toast icon={<CloudCheck size={16} />} message="Sincronizado" />
        <Toast
          tone="danger"
          icon={<AlertTriangle size={16} />}
          message="Não foi possível salvar no aparelho. Libere espaço e tente de novo."
          action={<IconButton aria-label="Dispensar aviso" variant="plain" icon={<X size={16} />} />}
        />
      </Section>

      <Section title="EmptyState">
        <EmptyState
          icon={<ClipboardList size={32} />}
          title="Nenhuma rotina ainda"
          description="Crie uma rotina ou comece por um treino avulso."
          action={<Button variant="primary">Criar rotina</Button>}
        />
      </Section>
```

- [ ] **Step 5: Build, lint, capturas e teste manual da folha**

Run: `npm run build && npm run lint && npm run test` e `npm run catalogo:shots -w @powerlifting/web`.

Manual, no `npm run dev` em `/catalogo`:
1. "Abrir folha" sobe a folha.
2. Esc fecha.
3. Toque fora fecha.
4. O foco fica preso dentro da folha.
5. Com movimento reduzido no sistema, a folha aparece sem deslizar.

Expected: tudo isso, sem erro no console.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/ui/Sheet apps/web/src/ui/Toast apps/web/src/ui/ScreenHeader apps/web/src/ui/EmptyState apps/web/src/ui/index.ts apps/web/src/dev/Catalogo.tsx
git commit -m "feat(web): Sheet, Toast, ScreenHeader e EmptyState (#$B)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 16: `ScreenHeader` nos títulos das telas antigas

**Files:**
- Modify: `apps/web/src/pages/Analytics.tsx`, `Calculators.tsx`, `Calendar.tsx`, `ComparisonEstimated.tsx`, `CustomExercises.tsx`, `History.tsx`, `More.tsx`, `PRs.tsx`, `Settings.tsx` e `Templates.tsx`

**Interfaces:**
- Consumes: `ScreenHeader` (Task 15).
- Fora desta task: Início (`Dashboard`), Treino (`Workout`) e Entrada (`Auth`). Os títulos deles mudam nas próprias issues (#343, #339/#340 e #337).

- [ ] **Step 1: Trocar cada `h1`**

Em cada arquivo, acrescente `import { ScreenHeader } from '../ui';` e faça a troca:

| Arquivo | Trocar | Por |
|---|---|---|
| `Analytics.tsx` | `<h1 style={styles.pageTitle}>ANÁLISES</h1>` | `<ScreenHeader title="Análises" />` |
| `Calculators.tsx` | `<h1 style={styles.pageTitle}>CALCULADORAS</h1>` | `<ScreenHeader title="Calculadoras" />` |
| `Calendar.tsx` (2 vezes) | `<h1 style={styles.pageTitle}>CALENDÁRIO</h1>` | `<ScreenHeader title="Calendário" />` |
| `ComparisonEstimated.tsx` | `<h1 style={styles.pageTitle}>COMPARAÇÃO ESTIMADA</h1>` | `<ScreenHeader title="Comparação estimada" />` |
| `History.tsx` | `<h1 style={styles.title}>HISTÓRICO</h1>` | `<ScreenHeader title="Histórico" />` |
| `More.tsx` | `<h1 style={styles.pageTitle}>MAIS</h1>` | `<ScreenHeader title="Mais" />` |
| `PRs.tsx` | `<h1 style={styles.title}>RECORDES</h1>` | `<ScreenHeader title="Recordes" />` |
| `Settings.tsx` | `<h1 style={styles.pageTitle}>CONFIGURAÇÕES</h1>` | `<ScreenHeader title="Configurações" />` |

Em `CustomExercises.tsx`, troque

```tsx
      <h1 style={styles.title}>EXERCÍCIOS</h1>
      <p style={styles.subtitle}>
        Crie exercícios reutilizáveis. Eles aparecem na busca ao montar rotinas e durante o treino.
      </p>
```

por

```tsx
      <ScreenHeader
        title="Exercícios"
        meta="Crie exercícios reutilizáveis. Eles aparecem na busca ao montar rotinas e durante o treino."
      />
```

Em `Templates.tsx`, troque

```tsx
      <div style={styles.headerRow}>
        <h1 style={styles.pageTitle}>BIBLIOTECA</h1>
        {mainView === 'rotinas' && <button onClick={() => setIsCreating(true)} style={styles.newBtn}><Plus size={16} /> Nova rotina</button>}
        {mainView === 'programas' && <button onClick={() => setIsProgramForm(true)} style={styles.newBtn}><Plus size={16} /> Novo programa</button>}
      </div>
```

por

```tsx
      <ScreenHeader
        title="Biblioteca"
        actions={
          <>
            {mainView === 'rotinas' && <button onClick={() => setIsCreating(true)} style={styles.newBtn}><Plus size={16} /> Nova rotina</button>}
            {mainView === 'programas' && <button onClick={() => setIsProgramForm(true)} style={styles.newBtn}><Plus size={16} /> Novo programa</button>}
          </>
        }
      />
```

- [ ] **Step 2: Remover os estilos de título que ficaram sem uso**

Em cada arquivo, para cada chave que estilizava o título (`pageTitle`, `title`, `subtitle` em CustomExercises, `headerRow` em Templates), rode o grep e apague a entrada do objeto `styles` se não houver outro uso:

Run: `grep -n "styles\.pageTitle\|styles\.title\b\|styles\.subtitle\|styles\.headerRow" apps/web/src/pages/{Analytics,Calculators,Calendar,ComparisonEstimated,CustomExercises,History,More,PRs,Settings,Templates}.tsx`
Expected: depois das remoções, nenhuma linha. Se aparecer um uso que não é o título, mantenha a entrada.

- [ ] **Step 3: Conferir**

Run: `grep -rn "<h1" apps/web/src/pages`
Expected: só `Auth.tsx`, `Dashboard.tsx` e `Workout.tsx` (fora do escopo, nas próprias issues).

Run: `npm run build && npm run lint && npm run test`
Expected: passa.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages
git commit -m "feat(web): título de tela único com ScreenHeader nas telas antigas (#$B)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 17: documentação, verificação e PR da etapa 2

**Files:**
- Modify: `apps/web/DESIGN.md` (seção Components)
- Modify: `.claude/skills/design-onyx/SKILL.md` (§2 **Estilo no app** e §5 passo 5)
- Modify: `AGENTS.md` (seção "Estilo / design system ONYX")

- [ ] **Step 1: Docs**

Em `apps/web/DESIGN.md`, na seção `## Components`, troque a linha `Contratos da spec §4.` por:

```
Implementados em `apps/web/src/ui/` (importe de `../ui`; funções puras do próprio arquivo, ex.: `ui/Segments/segmentStates`). Todos aparecem em todos os estados no catálogo `/catalogo` (só no `npm run dev`). Use-os antes de criar botão, bloco, folha ou campo.
```

Em `.claude/skills/design-onyx/SKILL.md`, no fim do bullet **Estilo no app** (§2), acrescente ` Componentes base em \`src/ui/\`: use-os antes de criar botão, bloco, folha ou campo novo.`. No §5, no passo 5 (**Verificação visual**), acrescente ` Componente novo ou alterado: catálogo em \`/catalogo\` e \`npm run catalogo:shots -w @powerlifting/web\` (com \`--sem-fontes\` para o fallback).`

Em `AGENTS.md`, na seção "Estilo / design system ONYX", acrescente depois do bullet **CSS Modules em código novo**:

```
- **Componentes base** em [apps/web/src/ui/](apps/web/src/ui/) (Button, IconButton, Block, ListRow, Segments, Stat, Field, SegmentedControl, Sheet, Toast, ScreenHeader, EmptyState). Catálogo em `/catalogo` (só no `npm run dev`); capturas em 375/480 px com `npm run catalogo:shots -w @powerlifting/web` (com `npm run dev` rodando).
```

- [ ] **Step 2: Checks completos**

Run: `npm run build && npm run lint && npm run test`
Expected: passa.

Run: `grep -rl "Catálogo ONYX" apps/web/dist || echo "fora do bundle"`
Expected: `fora do bundle`.

- [ ] **Step 3: Revisão de design (`design-onyx` §5)**

1. `impeccable detect --json` uma vez, nos arquivos de `apps/web/src/ui/` e `apps/web/src/dev/`.
2. `review-animations`, porque há `transition`, `transform` e `@keyframes`.
3. `break-ui` no catálogo: nome longo, número enorme, kg e lbs, vazio.
4. `mobile-native` como checklist.
5. Capturas com e sem fontes em 375 e 480 px.

Corrija o que for compatível com a §2 e anote o resto para a seção **Design** do PR.

- [ ] **Step 4: Commit das docs, push e PR**

```bash
git add apps/web/DESIGN.md .claude/skills/design-onyx/SKILL.md AGENTS.md
git commit -m "docs: componentes base e catálogo no DESIGN.md, design-onyx e AGENTS (#$B)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin feat/$B-componentes-base
gh pr create --base main --title "feat: componentes base do app e catálogo de desenvolvimento (#$B)" --body-file "$T/pr-b.md"
```

O `$T/pr-b.md` segue o template, com estas seções:
- **Issue relacionada:** `Closes #$B` e `Closes #352`.
- **Como testar:** `npm run dev`, abrir `/catalogo`, abrir e fechar a folha, e as telas antigas com o título novo.
- **Design:** o resultado do Step 3, com as capturas.
- **Notas adicionais:** se o PR da etapa 1 ainda não tiver sido mergeado, avise que este PR está empilhado sobre ele.

Expected: URL do PR. Depois, siga a skill `finalizar-pr`.

---

## Depois deste plano

A etapa 3 começa pela #339 e pela #340 (série e ações do Treino), e depois a #330, a #341 e a #342 (descanso). Cada uma é planejada com `planejar-issue` usando a spec, os componentes desta etapa e os HTML da V3, e cria `SetRow`, `RestBar` e `WeekStrip` em `apps/web/src/components/workout/`.
