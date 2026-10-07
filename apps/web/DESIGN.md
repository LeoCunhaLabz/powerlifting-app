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
  chart-bench: "#7b8aa6"
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

### Dados (gráficos)
- Séries por levantamento em Análises: agachamento `--accent` (dourado), supino `--chart-bench` (#7b8aa6, aço apagado), terra `--text-primary`. A escala de RPE (≤5 a 10, de azul a vermelho) é a outra paleta de dados e vive em `Analytics.tsx`. A #346 revê as séries à luz do Princípio 1.

**A Regra das Anilhas.** As cores das anilhas no `PlateVisualizer` seguem o padrão IPF; junto com as séries de gráfico, são a única paleta extra permitida, cada uma só no seu lugar.

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
