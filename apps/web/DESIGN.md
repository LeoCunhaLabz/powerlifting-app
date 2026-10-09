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
  scrim: "rgba(0, 0, 0, 0.6)"
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
  field:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "16px"
  wordmark:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 900
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
| `--scrim` | rgba(0, 0, 0, 0.6) | fundo atrás de folha aberta |

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

- Coluna única dentro de `--max-width: 480px`, com 16 px de margem e 10 px entre blocos (`--gap-blocks`).
- As seções não encolhem (`flex-shrink: 0`): a tela rola.
- A barra inferior tem Início, Biblioteca, botão central, Análises e Mais. O botão central é neutro e vira o cronômetro dourado da sessão com treino em andamento. A aba ativa fica em `--text-1`.
- Acima dela, a faixa fixa `.dock` (em `index.css`, presa aos 480 px como a `.bottom-nav`) empilha os avisos (falha ao salvar em `Toast`, selo de sync) e a barra de descanso. Nada flutuante usa `position: absolute` no `#root`: a página rola no documento e isso caía no fim dela (#330).

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

Implementados em `apps/web/src/ui/` (importe de `../ui`; funções puras do próprio arquivo, ex.: `ui/Segments/segmentStates`). Todos aparecem em todos os estados no catálogo `/catalogo` (só no `npm run dev`). Use-os antes de criar botão, bloco, folha ou campo.

**Base:**
- `Button`: `primary` (uma por tela), `secondary`, `link`, `danger`; alturas 56 e 44.
- `IconButton`: 44×44, com `aria-label`.
- `Block`: superfície com cabeçalho opcional; nunca aninhado.
- `ListRow`: linha de lista com título, meta e chevron.
- `Segments`: `progress` e `countdown`.
- `Stat`: número, unidade, legenda e variação.
- `Field`: rótulo acima, erro abaixo; `trailing` põe um controle dentro do campo, à direita (o mostrar senha da entrada).
- `SegmentedControl`: a opção selecionada em `--surface-3`.
- `Sheet`: folha de baixo.
- `Toast`: aviso curto acima da barra.
- `ScreenHeader`: título de tela único.
- `EmptyState`: título, uma frase e uma ação.

**Do treino (`apps/web/src/components/workout/`):**
- `SetRow` (#339): grade tipo, carga, reps, RPE e check (`40 | 4fr | 3fr | 44 | 44`), sem coluna "Anterior": em 360 px a carga fica com cerca de 78 px e "112,5" cabe em `--num-md`. Três estados:
  - **feita:** valores como texto e check recuado;
  - **atual:** linha `--surface-2` até a borda do bloco, campos de 54 px sem borda, check dourado e "Anterior" embaixo;
  - **pendente:** campos discretos, ainda editáveis.

  Aquecimento aparece como "Aq" e as séries normais são numeradas sem ele. A série atual vem de `utils/workoutSets` (primeira pendente depois da última concluída). Carga com 6 ou mais caracteres desce para `--num-sm`.
- `ExerciseCard`: cabeçalho com o botão "Anilhas" (abre o `PlateSheet` na carga da próxima série pendente) e o menu de opções (notas, remover com confirmação).
- `SetTypeSheet` (#340): tocar no número da série abre "Tipo da série", com Normal, Aquecimento e Drop set num `SegmentedControl`. Escolher aplica e fecha. "Remover esta série" pede confirmação se a série tem check e fica desabilitado quando é a única. Não há legenda fixa nem "remover a última".
- `WorkoutHeader` (#340): nome em `--title-1`, tempo em `--text-2`, "x de y séries" com `Segments` e "Finalizar" neutro. A ação dourada da tela é o "Finalizar treino" no fim da lista.
- `FinishSheet` (#340, #328): diz quantas séries sem check ficam fora do histórico, por exercício, e oferece "Revisar séries" (leva à primeira pendente). "Descartar treino" fica aqui, com confirmação. Sem nenhum check, o primário é revisar.
- `MaxesSheet` (#336): "Quanto você levanta hoje?" abre ao iniciar rotina por %1RM com exercício sem máximo estimado (via `hooks/useTemplateStart`, em Início, Treinar, Biblioteca e Calendário). Um campo por exercício; "Começar o treino" calcula as cargas e "Não sei, vou digitar as cargas" abre com elas em branco. O digitado não vira dado no histórico.
- `RestBar` (#330, #341, #342): o descanso na `.dock`.
  - **Compacta:** tempo em `--num-md`, `Segments` em contagem regressiva (o restante em dourado), "+30 s" e "Pular". Tocar no tempo abre.
  - **Aberta:** painel por cima do conteúdo, sem cobrir a navegação, com tempo em `--num-lg`, "Próxima série", "Agachamento, descanso de 3:00" e "−30 s / +30 s / Pular descanso" (o pular é o primário da folha). Os ajustes mexem só no descanso atual.
  - **Encerrada:** "Descanso encerrado" e o tempo extra em `--text-2`, a próxima série numa linha inteira e "Fechar". Some ao concluir a próxima série, ao fechar ou depois de 15 min.
  - No fim, vibra além do bipe e anuncia por `aria-live` (uma vez, não a cada segundo). Reabrir o app com o descanso vencido não alerta de novo. A tela fica acesa durante o treino (`useWakeLock`).
  - A duração padrão é `settings.restSeconds` (Configurações, de 30 s a 10 min), usada quando a rotina não define o descanso do exercício.

**Do Início (`apps/web/src/components/home/`, #343):**
- `WeekStrip`: os sete dias (S T Q Q S S D) em células de 40 px; treinado em `--text-1`, hoje em dourado (vence o treinado), o resto em `--surface-2`. Cada dia tem `aria-label` ("Quinta, hoje, treinou").
- `SessionSheet`: detalhe de um treino do histórico com Repetir e Editar, "Excluir treino" (link vermelho, com confirmação) e "Ver histórico completo". Repetir só confirma quando descarta um treino em andamento.
- `WeightSheet`: "Registrar peso", campo de 16 px que aceita vírgula ou ponto.
- `RoutinePickerSheet` (#336): "Rotinas prontas", cada uma com nome, exercícios e séries e para que serve.

**Tela do Início (`pages/Dashboard.tsx`, #343):** título que responde ao dia ("Dia de treino", "Treino feito hoje", "Treinou há 3 dias"), card do próximo treino inteiro tocável (o botão dourado é o alvo acessível), "Sua força" com o total atual em `--num-xl` (melhor e1RM de cada levantamento nas últimas 12 semanas), a tendência e 12 mini-barras (a atual em `--text-1`, as outras em `--surface-3`; platô = barras iguais), "Esta semana" com o `WeekStrip` só depois do primeiro treino, e peso corporal com último treino num bloco só. Sem peso registrado, "Não informado" e "Registrar". Sem nenhum treino, o card vira "Comece pelo treino de hoje", com "Registrar o treino de hoje" (avulso, dourado) e "Usar uma rotina pronta" (#336). As contas são puras em `utils/home.ts`.

**Tela de entrada (`pages/Auth.tsx`, #337):** sem card, direto em `--surface-0`. As boas-vindas têm a marca (anel dourado) e o wordmark no alto e, na metade de baixo, o título de benefício em `--title-1`, uma frase em `--text-2`, "Criar conta" (primário de 56 px) e "Já tenho conta" (secundário). Cadastro, login, recuperar e redefinir senha: voltar no alto, título, uma frase de benefício, Google antes do e-mail ("ou com e-mail") e o envio dourado. Quem vem da calculadora da landing, de /registro ou do link de redefinir senha cai direto no formulário certo.

**De Configurações (`apps/web/src/components/settings/`):**
- `ClearDataSheet` (#329): "Apagar todos os dados?" lista, com as contagens, o que some neste aparelho e na conta e o que some só aqui (peso corporal, treino em andamento). Oferece "Exportar antes" e só libera "Apagar tudo" com APAGAR digitado.
- `ImportSheet` (#329): o arquivo é validado antes; a folha compara o que está no aparelho com o que vem no arquivo e confirma em "Substituir dados".
- Nas duas, o primeiro parágrafo tem `tabIndex={-1}` para receber o foco inicial da folha, e não o campo (o teclado cobriria a explicação) nem o botão destrutivo.

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
