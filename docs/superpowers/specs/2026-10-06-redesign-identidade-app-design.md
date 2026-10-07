# App ONYX: nova identidade visual e design system

**Status:** design aprovado em 06/10/2026 (brainstorming com Leonardo em 05 e 06/10).
**Referência visual normativa:** a V3 ajustada, em HTML autocontido (abrir no navegador) na pasta [`2026-10-06-redesign-identidade-app/`](2026-10-06-redesign-identidade-app/):
- `inicio.html`
- `treino.html`
- `treino-celular.html`
- `descanso-aberto.html`

O canvas com todas as direções exploradas (A, B, C, V1, V2 e V3) é <https://claude.ai/artifact/Si2StBYERQJ5wqEBrY7dyp> (privado; a pasta do repo é a fonte durável).

**Escopo:** `apps/web`. A landing adota a identidade numa etapa própria, depois.

**Substitui:** em `apps/web/DESIGN.md`, as seções de cor, tipografia, temas e componentes. Na skill `design-onyx` §2, a regra do objeto `styles`, a dos três temas e a das fontes do app. No `AGENTS.md` e no `PRODUCT.md`, a menção aos temas de acento selecionáveis. Esses arquivos são atualizados na etapa 1 (ver §8).

## 1. Problema e decisão

O app ainda tem cara de "vibe-coded". A auditoria de UX de 05/10/2026 apontou dois grupos de causa.

**Sinais visuais:**
- gradientes;
- brass em tudo;
- caixa alta em todo rótulo;
- grades de cards iguais;
- trio de número grande;
- pílulas;
- haltere no lugar da marca.

**Falta de base:**
- cada tela recria botões, cards e modais inline;
- 14 tamanhos de fonte;
- nenhum `:active`;
- números com pouca credibilidade.

**Decisão: identidade "esportivo de elite"** (referências Whoop e Strava): números grandes e confiantes, cor com significado em vez de enfeite, cara de equipamento de atleta. Ficam só o nome ONYX e a marca, a anilha vista de frente. O resto podia ser repensado.

**Caminho: fundação primeiro.**
1. Tokens e componentes base.
2. O Treino ativo como primeira tela migrada.
3. As issues da auditoria refazem as demais telas sobre o sistema novo.

**Como chegamos na V3:**
- Três direções no Início e no Treino ativo: A. Placar, B. Plataforma e C. Telemetria. A C foi descartada como genérica.
- Da A ficaram os números grandes, o minimalismo e os elementos que fogem do óbvio. Da B ficaram as barrinhas segmentadas, sem o par verde e amarelo.
- A rodada 2 testou V1 (linhas) contra V2 (superfícies). A escolha foi a V2 com a tipografia grande da V1: a **V3**.

## 2. Princípios da identidade (normativos)

1. **Dourado significa "agora / sua vez".**
   - Usado na ação principal da tela, na série atual, no descanso correndo, no dia de hoje, na semana atual do bloco e no botão central da barra com treino em andamento.
   - Nunca usado em aba ativa, opção selecionada, recorde, ícone, decoração ou texto corrido.
   - No máximo uma ação principal dourada por tela.
   - Exceção: a marca (anilha) mantém o anel dourado. É marca, não sinal.
2. **Feito é branco nos indicadores.** Segmentos concluídos e dias treinados ficam em `--text-1`. O **controle** de uma série já feita recua (fundo `--surface-3`, check branco), para que o único ponto forte da linha seja a série atual.
3. **Recorde é ícone, não cor.** Usa o `Award` do lucide, na cor do texto ao redor.
4. **Segmentos são a assinatura.**
   - Aparecem no progresso de séries da sessão, no descanso (contagem regressiva: o restante em dourado, esvaziando), na semana, nas semanas do bloco e nas mini-barras do histórico do total.
   - Nada de barra de progresso lisa.
5. **Número de placar.** Carga, repetições, total, tempo e peso usam Barlow Condensed com `tabular-nums`, sempre maiores que o rótulo deles.
6. **Profundidade por tom.** Blocos em degraus de cinza quente, sem borda e sem sombra. Sombra só em folha flutuante.
7. **O botão central da barra é neutro.** Fica dourado, mostrando o cronômetro da sessão ("38:12", rótulo "Treinando"), só com treino em andamento. O haltere sai.
8. **Escuro sempre e tema único.** Os temas Brass, Onyx e Volt são removidos (ver §5).

## 3. Tokens

Os valores normativos passam a viver em `apps/web/src/styles/tokens.css`. Nomes em inglês, como o resto do código.

### Cor

| Token | Valor | Uso |
|---|---|---|
| `--surface-0` | `#0C0B0A` | fundo da tela |
| `--surface-1` | `#171614` | blocos |
| `--surface-2` | `#211F1C` | linha da série atual, descanso, botão secundário sobre a tela |
| `--surface-3` | `#2B2925` | check de série feita, botão sobre bloco |
| `--line` | `#26231F` | divisórias dentro de bloco |
| `--text-1` | `#F2EFE8` | texto principal; "feito" nos indicadores |
| `--text-2` | `#9C978E` | texto que informa (6:1 ou mais) |
| `--text-3` | `#87827B` | legenda pequena (4,5:1 sobre `--surface-1`) |
| `--text-off` | `#5F5B55` | só desabilitado ou pendente; nunca informação |
| `--now` | `#E3A83B` | ver §2.1 |
| `--now-ink` | `#1A1304` | texto e ícone sobre `--now` |
| `--danger` | `#E5544B` | só ação destrutiva |
| `--danger-ink` | `#1C0605` | texto sobre `--danger` (branco não passa no contraste) |

Saem o verde de sucesso, o amarelo de aviso, os gradientes, `--accent-white` e os blocos `[data-theme]`. Confirmação usa texto mais ícone, sem cor própria.

### Tipografia

- **Display:** Barlow Condensed 600/700, usada em números, títulos de tela e de bloco, nomes de exercício e no botão principal.
- **Texto:** Plus Jakarta Sans 400 a 700.
- **Wordmark:** Outfit 900 só no logotipo.
- Tudo via Google Fonts (a CSP do app já libera).

| Papel | Tamanhos (px) |
|---|---|
| Número | 84 (placar), 46 (cronômetro aberto), 30 (campo da série atual, cronômetro compacto), 22 (número de linha) |
| Título | 40 (título de tela, Início), 28 (bloco, exercício), 21 (linha de lista) |
| Texto | 15, 14, 13, 12, 11 (11 só no rótulo da barra) |

Os HTML da V3 têm alguns tamanhos fora da escala (42, 36, 24, 19); na implementação, cada um vai para o degrau mais próximo.

Nada abaixo de 11 px. Campos com 16 px ou mais. Todo número em `tabular-nums`. Rótulos em caixa normal (sem caixa alta).

### Espaço, forma e toque

- **Espaço:** 4, 8, 12, 16, 20, 24, 32. Margem da tela e padding de bloco: 16 (os HTML usam 18 no bloco; vale 16). Espaço entre blocos: 10.
- **Raios:** 1 (segmento), 3 (dia), 8 (campo, check), 10 (botão), 14 (bloco).
- **Segmentos:** altura 6 (semanas do bloco) ou 8 (séries, descanso), 3 px entre eles, raio 1. Muda só a cor, nunca a largura.
- **Alvo de toque:** 44 px; mínimo absoluto de 40.
- **Sombra:** só em folha flutuante, `0 -8px 24px rgba(0,0,0,.5)`.

### Movimento

- Curva `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`.
- Durações: 120 ms para o toque, 200 ms para troca de estado, 280 ms para folhas.
- Botão pressionado: `scale(0.97)`.
- Com `prefers-reduced-motion`, nada se move. Só cor e opacidade mudam.

## 4. Componentes

Todos nascem com os estados normal, pressionado e desabilitado desenhados, mais carregando, erro e vazio quando fizer sentido. Lógica não trivial fica em função pura testada.

### Base (`apps/web/src/ui/<Nome>/`)

| Componente | Contrato |
|---|---|
| `Button` | variantes `primary` (dourado, uma por tela), `secondary`, `link` e `danger`; alturas 56 e 44; estado carregando |
| `IconButton` | 44×44; `aria-label` obrigatório no tipo |
| `Block` | superfície `--surface-1`, raio 14; cabeçalho opcional (rótulo à esquerda, meta ou ação à direita); proibido aninhar |
| `ListRow` | título, meta, chevron ou ação; divisória `--line` |
| `Segments` | `total` e `filled`; modos `progress` (feitos + o atual) e `countdown` (restante em dourado); os estados vêm de função pura. Os dias da semana são o `WeekStrip` |
| `Stat` | número, unidade, legenda e variação, nos tamanhos da escala; usa o formatador pt-BR |
| `Field` | rótulo acima, erro abaixo; variante numérica grande (série atual) |
| `SegmentedControl` | 2 a 4 opções; a selecionada fica em `--surface-3` com `--text-1`, nunca em dourado |
| `Sheet` | folha de baixo com alça, título e ações; substitui os modais de confirmar, descartar e excluir |
| `Toast` | aviso curto acima da barra (sincronização, erro ao salvar) |
| `ScreenHeader` | estilo único de título de página |
| `EmptyState` | título, uma frase e uma ação |

### Do treino (`apps/web/src/components/workout/`, etapa 3)

- `SetRow`: estados feito, atual e pendente, mais aquecimento.
- `RestBar`: compacta (uma linha com tempo, segmentos, "+15 s" e "Pular"; tocar abre) e aberta (folha por cima do conteúdo).
- `WeekStrip`: os sete dias.

### Catálogo

`apps/web/src/dev/Catalogo.tsx`, aberto em `/catalogo` só no `npm run dev`. Ele mostra cada componente em todos os estados e é o lugar da revisão de design antes de qualquer tela migrar.

## 5. Arquitetura técnica

- **CSS Modules.** Componente e tela migrada usam `<Nome>.module.css` com tokens. O Vite já suporta, e os tipos vêm do `vite/client` já configurado em `tsconfig.app.json`.
  - `style={}` inline só para valor calculado em tempo de execução.
  - O objeto `styles: Record<string, React.CSSProperties>` fica proibido em código novo.
  - Variantes por classe combinada com template string (sem `clsx` ou `cva`).
- **Catálogo fora do build.** O `main.tsx` carrega `dev/Catalogo` por import dinâmico atrás de `import.meta.env.DEV && location.pathname === '/catalogo'`.
- **Convivência sem duas identidades.** Na etapa 1, os tokens antigos viram apelidos dos novos:
  - `--accent` → `--now`
  - `--accent-ink` → `--now-ink`
  - `--accent-soft` → `--surface-2`
  - `--accent-border` → `--line`
  - `--bg-primary` / `--bg-secondary` / `--bg-tertiary` → `--surface-0` / `-1` / `-2`
  - `--text-primary` / `--text-secondary` / `--text-muted` → `--text-1` / `-2` / `-3`
  - `--border-color` → `--line`
  - `--font-display` → Barlow Condensed
  - `--success` e `--warning` → neutros

  As telas não migradas ganham na hora a paleta e a fonte novas; só o layout continua o antigo. Os apelidos são apagados quando a última tela migrar.
- **Temas.** Saem os blocos `[data-theme]` do CSS, o efeito do `WorkoutContext` que aplica `data-theme` no `<html>` e o seletor de tema das Configurações. O campo `Settings.theme` continua em `@powerlifting/shared` e no schema da API, sem migração de banco.
- **Base global** (`index.css`):
  - fim do `transition: all` (transições com propriedades explícitas);
  - `button:active` com `scale(0.97)`;
  - `html { overscroll-behavior-y: none }`;
  - `touch-action: manipulation` e `user-select: none` nos controles;
  - bloco `prefers-reduced-motion`;
  - aba ativa da barra em `--text-1` (não dourado) e rótulo da barra com 11 px;
  - cor da barra do sistema (`theme-color` no `index.html` e no manifesto do PWA) igual a `--surface-0`.

  O título de página único vem do `ScreenHeader`, aplicado na etapa 2.
- **Fontes sem internet.** Regra de `runtimeCaching` (CacheFirst) no Workbox do `vite-plugin-pwa` para `fonts.googleapis.com` e `fonts.gstatic.com`. Hoje, sem sinal, o app cai na fonte do sistema. É só configuração, sem dependência nova.
- **Layout que rola.** As seções de uma tela não encolhem (`flex-shrink: 0`); a tela rola. No Treino ativo, a série atual precisa ficar visível acima do descanso compacto num celular de 844 px (ver `treino-celular.html`).
- **Sem dependência nova.** Nada de Testing Library, Storybook, `clsx` ou biblioteca de animação.

## 6. O que o mock define e o que as issues definem

Os HTML da V3 são normativos para a **linguagem visual**: tokens, aparência dos componentes e padrões de hierarquia (placar, tabela, segmentos, linha da série atual ampliada, descanso compacto). O **comportamento e o conteúdo** de cada tela são definidos pela issue dela. Divergências já conhecidas, a resolver em cada issue:

| Issue | O mock mostra | A issue pede | Como fica |
|---|---|---|---|
| #340 | "Finalizar" no topo; descartar no menu "⋯" | "Finalizar" neutro no topo **e** "Finalizar treino" primário no fim da lista; descartar dentro da folha de finalizar | vale a issue, com os componentes da V3 |
| #339 | campos da série atual com borda branca; check de 38 px | botão "Anilhas" no cabeçalho do exercício; check de 44 px; input sem borda interna | vale a issue; a série atual continua destacada pela linha `--surface-2` e pelo check dourado |
| #342 | folha com "−15 s / +15 s / Pular" | "−30s / +30s / Pular descanso", rótulo "Descanso do agachamento: 3:00", duração padrão salva em Configurações | vale a issue |
| #343 | blocos "Total estimado" e "Esta semana" separados | card "Sua força" (evolução + recordes), "Esta semana" numa linha, título que responde ao estado do dia, card do próximo treino inteiro tocável | vale a issue; o bloco "Total estimado" da V3 é a forma visual de "Sua força" |

## 7. Migração

1. **Etapa 0, já e em paralelo:** bugs de dado e lógica que não dependem do visual.
   - p0: #328 (finalizar descarta séries) e #329 (limpar dados).
   - p1 de dados: #331, #332, #333, #334 e #335.
2. **Etapa 1, fundação (issue nova).**
   - Inclui: `tokens.css`, apelidos, base global, remoção dos temas, fim dos gradientes nas telas, cache das fontes e atualização da documentação (§8).
   - Faz a parte de gradientes e botão central da **#351** e as partes globais da **#352** e da **#344**.
3. **Etapa 2, componentes base e catálogo (issue nova).**
   - Os componentes da §4 (base), o catálogo e o formatador de números pt-BR em `apps/web/src/utils` (puro, testado, espelhando o `format.ts` da landing), que é a fundação da **#345**.
   - Aplica o `ScreenHeader` nos títulos das telas antigas e fecha a **#352**.
4. **Etapa 3, Treino ativo.**
   - 3a, série e ações: **#339** e **#340** (mais a parte visual da #328, se ainda faltar).
   - 3b, descanso: **#330**, **#341** e **#342**, com o `RestBar`.
5. **Etapa 4, Início:** **#343**, mais a parte do Início da **#338**.
6. **Etapa 5, entrada e primeiro uso:** **#337** e **#336**.
7. **Etapa 6, demais telas.**
   - **#348** (Biblioteca e Mais), **#349** (Recordes), **#350** (Calendário), **#347** (Comparação) e **#346** (Análises, depois de #332 e #333).
   - Com elas fecham o resto da **#338** e as partes por tela da **#344**, da **#345** e da **#351** (um dourado por tela), que ficam abertas como lista de conferência até a última tela.
8. **Fechamento:** apagar os apelidos dos tokens antigos. A Play Store (#259) passa a depender também das duas issues novas.

Cada etapa segue o fluxo normal de issues (`resolver-issue`), com a revisão de design da `design-onyx` §5 usando o catálogo e estes HTML como referência.

## 8. Documentação atualizada na etapa 1

- `apps/web/DESIGN.md`: reescrito com tokens, princípios (§2) e componentes desta spec.
- `.claude/skills/design-onyx/SKILL.md` §2:
  - CSS Modules no lugar do objeto `styles`;
  - tema único;
  - fontes do app (Barlow Condensed e Plus Jakarta Sans, Outfit só no wordmark);
  - dourado = agora.
- `AGENTS.md`: seção "Estilo / design system ONYX" (temas, `--accent`, `styles` inline, fontes).
- `PRODUCT.md`: tirar "Temas de acento selecionáveis no app".
- `.github/copilot-instructions.md` e `.github/skills/design-system/SKILL.md`: as mesmas regras.

## 9. Verificação

- `npm run build`, `npm run lint` e `npm run test` em toda etapa.
- **Testes de lógica:** funções puras no Vitest (estados dos segmentos, formatador pt-BR).
- **Verificação visual:** captura do catálogo e das telas migradas pelo Playwright (já no repo) em 375 e 480 px, comparada com os HTML da V3. Também uma captura do Treino ativo em 390×844 provando que a série atual fica acima do descanso compacto.
- **Acessibilidade:** contraste AA no texto que informa, alvos de 44 px (40 no mínimo), `aria-label` em todo botão de ícone e `aria-current` na barra.

## 10. Fora de escopo

- Adoção pela landing (etapa própria, depois). Quando acontecer, a landing troca o display de Archivo para Barlow Condensed.
- Modo claro, novo ícone do app, ilustrações e qualquer feature nova.
- Movimento além dos tokens da §3.
