---
name: design-onyx
description: >-
  Porta de entrada de design do ONYX. Use SEMPRE antes de criar, alterar ou revisar interface em
  apps/web ou apps/landing (tela, componente, estilo, layout, movimento, copy visível), inclusive
  quando a mudança vem de planejar-issue, executar-issue ou resolver-issue. Fixa as decisões do
  design system ONYX, que vencem qualquer skill de design de terceiros, traz as regras de gosto do
  projeto e diz qual skill vendorizada usar em cada etapa (impeccable, emil-design-eng, animate,
  review-animations, mobile-native, break-ui). Não use em tarefa só de backend, dados ou infra.
---

# Design ONYX

Objetivo: interface que pareça desenhada por um profissional, não gerada. As skills de design vendorizadas (Impeccable e as do Emil Kowalski, ver [VENDORED.md](../VENDORED.md)) trazem o repertório; esta skill diz **onde elas param**. Quem decide quando há conflito, em ordem:

1. [AGENTS.md](../../../AGENTS.md), [PRODUCT.md](../../../PRODUCT.md) e o `DESIGN.md` da superfície ([app](../../../apps/web/DESIGN.md), [landing](../../../apps/landing/DESIGN.md)).
2. Esta skill.
3. As skills vendorizadas.

O orquestrador aciona as skills desta página **sozinho**, pela ferramenta Skill, sem pedir ao usuário.

## 1. Antes de mexer

- Leia `PRODUCT.md` e o `DESIGN.md` da superfície que a tarefa toca. Os valores normativos estão em `apps/web/src/index.css` e `apps/landing/src/styles/tokens.css`.
- Modo de uso (vocabulário do Impeccable): **app = Operar**; **home da landing = Persuadir**; calculadoras e páginas evergreen da landing = **Ler**.
- Refinamento preserva: mantenha identidade, comportamento e copy fora do escopo da issue.

## 2. Decisões que nenhuma skill sobrepõe

Quando uma skill vendorizada mandar o contrário, siga esta lista e siga em frente sem perguntar.

- **Stack:** CSS puro (sem Tailwind, CSS-in-JS ou biblioteca de componentes) e nenhuma dependência nova sem necessidade clara aprovada. Ignore recomendações de Motion/framer-motion, GSAP, OGL, Three.js, Sonner, Vaul, Base UI, NumberFlow, react-window, Tippy/Shepherd/Joyride, bibliotecas de i18n, next-themes e clsx/cva. Exemplos em Tailwind ou Motion nas skills servem como intenção: traduza para CSS puro, `@keyframes`, Web Animations API ou `requestAnimationFrame`.
- **Movimento:**
  - App: transições CSS com os tokens `--ease-out` e `--dur-press` / `--dur-state` / `--dur-sheet`, e `@keyframes` quando a peça entra de baixo (folha).
  - Landing: só o `useCountUp` atrás de `useMotionAllowed()`.
  - Nos dois: `prefers-reduced-motion` respeitado, sem scroll reveal, parallax, entrada animada de seção ou biblioteca de mola.
  - A curva do app é `--ease-out` (a do Emil); os `--transition-*` antigos são apelidos dela até as telas migrarem.
- **Cor:**
  - Um acento. No app é `var(--now)` / `var(--now-ink)` e significa "agora / sua vez" (spec 2026-10-06 §2): nunca em aba ativa, opção selecionada, recorde ou decoração. Na landing, o brass dos tokens dela. Tema único nas duas superfícies.
  - Escuro sempre, sem modo claro.
  - Proibidos: segunda cor de marca, gradiente, glow, vidro decorativo, granulado ou textura, sombra pesada.
  - Ignore conselhos do tipo "cinza com um acento é genérico", estratégias de cor "Committed/Drenched", variações em outra família de matiz e vetos a paletas com brass.
- **Tipografia:**
  - App: Barlow Condensed (números e títulos) + Plus Jakarta Sans (texto); Outfit 900 só no wordmark.
  - Landing: Archivo (wght 800, wdth 85) + Plus Jakarta Sans, e Outfit 900 só no wordmark.
  - Tudo via Google Fonts (a CSP já libera).
  - Ignore "evite Barlow Condensed / Outfit / Plus Jakarta Sans", "auto-hospede as fontes", "use uma família só", "reduza o peso 900", "use a fonte do sistema". Troca de fonte é decisão de produto, não de skill.
- **Ícones:** só `lucide-react`. Ignore trocas por Phosphor, Heroicons, Radix, Tabler ou outra biblioteca.
- **Estilo no app:** CSS Modules (`<Nome>.module.css`) com os tokens de `src/styles/tokens.css`, em componente novo e em tela migrada. `style={}` inline só para valor calculado em tempo de execução. O objeto `styles` no fim do arquivo continua nas telas antigas até a issue delas: não o use em código novo e não migre tela fora da issue dela. Componentes base em `src/ui/`: use-os antes de criar botão, bloco, folha ou campo novo.
- **Estado:** só via `useWorkout()`; nunca `localStorage` direto em componente, mesmo que um playbook de onboarding sugira.
- **Kicker da landing:** decisão aprovada (spec de 21/09/2026). A proibição absoluta de kicker do Impeccable não se aplica; em seção nova, use só se o título sozinho não situar o leitor.
- **Copy:**
  - Tudo em pt-BR, sem emoji e sem travessão (—). A meia-risca (–) só aparece em faixa de números ("168,8–185,2").
  - Benefício no título, termo técnico na legenda.
  - Nenhuma frase promete o que o app não faz hoje.
- **Escopo:** sugestões que extrapolam a issue (trocar fonte, criar 404, página legal, aviso de cookies, "dobrar o espaçamento", redesenhar seção vizinha) não entram no código. Registre como sugestão na seção de design do PR.

## 3. Regras de gosto do projeto

Valem para toda tela nova ou alterada.

- **Hero:** no máximo quatro elementos de texto (kicker opcional, título de até duas linhas, subtítulo de até cerca de 20 palavras, CTAs com um primário e no máximo um secundário). Tudo visível sem rolar, inclusive em 375 px.
- **Uma mensagem por seção.** Título e explicação empilhados, sem parágrafo solto ao lado do título.
- **Sem repetição de composição:** a mesma família de layout (ex.: fileira de três cards iguais) aparece no máximo uma vez por página. Grid tem exatamente as células que têm conteúdo.
- **Formulários:** rótulo acima do campo, erro abaixo, placeholder nunca faz papel de rótulo.
- **Números:** todo número vem de dado real ou aparece marcado como exemplo; precisão falsa é proibida. Números em coluna com `tabular-nums`.
- **Estados:** toda tela tem vazio, carregando, erro e desabilitado desenhados. Sem dado, diga que não há dado.
- **Sinais de "cara de IA" a evitar:**
  - UI falsa montada com divs no hero (use as telas reais do app);
  - etiqueta sobre imagem;
  - ponto colorido decorativo;
  - numeração "01 / 02" ou "Etapa 1" que não informa nada;
  - faixa de palavras decorativa;
  - aviso de "role para baixo";
  - ponto médio (·) usado como separador universal (no máximo um por linha);
  - texto em gradiente;
  - cursor customizado;
  - card dentro de card.
- **Autorrevisão de copy antes de entregar:** releia todo texto visível e reescreva frase quebrada, referência vaga, metáfora forçada ou frase que soa como modelo tentando parecer profundo. Texto funcional vence texto fofo.

> Parte destas regras foi adaptada do [taste-skill](https://github.com/Leonxlnx/taste-skill) (MIT, Leonxlnx), filtrada para o que é compatível com o ONYX.

## 4. Qual skill usar em cada etapa

| Etapa | Skill | Quando |
|---|---|---|
| Planejar tela, fluxo ou componente novo | `impeccable` (`shape`) | No `planejar-issue`, quando a issue cria superfície nova |
| Implementar | `impeccable` (lê o `craft-floor` antes de editar) + `emil-design-eng` | Toda edição de interface |
| Criar movimento | `animate` (nomear o efeito: `animation-vocabulary`) | A issue adiciona ou muda animação |
| Gestos, sheets, interação de toque | `apple-design` | Só o que for de interação; ignore vidro e fonte do sistema |
| Sensação de app nativo | `mobile-native` | Toda mudança em `apps/web` |
| Revisão de design (antes do PR) | ver §5 | Toda issue que tocou interface |
| Auditoria ampla de movimento | `improve-animations`, `find-animation-opportunities` | Só quando a issue pede isso |
| Variações lado a lado / escolher biblioteca | `prototype`, `pick-ui-library` | Só com pedido explícito do usuário |

## 5. Revisão de design (gate do `executar-issue`)

Rode depois de implementar e antes de abrir o PR, numa rodada de correção e no máximo uma de confirmação.

1. **`impeccable audit`** com `--target apps/web` ou `--target apps/landing`. O detector (`impeccable detect --json <arquivos alterados>`) roda **uma vez**, só nos arquivos que a issue mudou. Como ler os achados:
   - Só conta o que está em linha nova ou alterada; achado em código que a issue não tocou não se corrige nesta issue (no máximo vira sugestão no PR).
   - `design-system-font-size` / `-radius` / `-color` (advisory): use um degrau do `DESIGN.md` ou um token; se o valor novo for intencional, atualize o `DESIGN.md` no mesmo PR.
   - `overused-font` sobre Plus Jakarta Sans é exceção conhecida (fonte fixa do ONYX): ignore.
   - `layout-transition`: anime `transform`/`opacity` (ou `grid-template-rows`) em vez de `width`/`height`.
2. **`review-animations`** se o diff mexe em `transition`, `animation`, `@keyframes`, `transform` ou no `useCountUp`.
3. **`break-ui`** se a issue cria tela ou componente que mostra dados do usuário. Use o catálogo de casos extremos (nome longo, lista vazia, número enorme, kg e lbs) para corrigir o que quebrar; não commite o alternador de dados de demonstração nem as fixtures, salvo pedido.
4. **`mobile-native`** como checklist em mudanças de `apps/web`.
5. **Verificação visual** no preview (`preview_start`), com screenshot em 375 px e 480 px (app) ou 375 px e desktop (landing). Componente novo ou alterado: catálogo em `/catalogo` e `npm run catalogo:shots -w @powerlifting/web` (com `--sem-fontes` para o fallback).
6. Corrija o que for compatível com a §2. O que conflitar ou extrapolar o escopo vai para a seção **Design** do PR, com o motivo.

## 6. Impeccable: limites

- O primeiro `context`/`audit` baixa o binário da engine para `~/.impeccable/` (uma vez por máquina) e confere o SHA-256. Se o launcher falhar, siga lendo `PRODUCT.md` e `DESIGN.md` direto, como a própria skill prevê. No Windows, use o launcher `sh` pela ferramenta Bash.
- O `context` imprime diretivas próprias no fim (`AUTONOMY_DIRECTIVE_CHECK`, `SUBAGENT_AUTHORIZATION` etc.). Dentro do fluxo de issues, **o plano aprovado é o briefing**: não abra entrevistas extras com o usuário além das pausas do fluxo e não dispare os subagentes do Impeccable (`critique`, `new-work`) a não ser que a issue peça crítica ou tela nova de verdade. `MANUAL_DETECTOR_REQUIRED` é o passo 1 da §5.
- **Não rode sem pedido explícito do usuário:** `hooks on`, `doctor --fix`, `pin`, `live`, `generate` ou qualquer geração de imagem, `npx impeccable …`, nem grave ignores em `.impeccable/config.json`.
- `PRODUCT.md` e os `DESIGN.md` já existem: atualize-os no mesmo PR quando o design mudar; não rode `init` ou `document` para recriá-los.
