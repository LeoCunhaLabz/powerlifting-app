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
