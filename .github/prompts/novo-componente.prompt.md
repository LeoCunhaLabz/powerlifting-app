---
agent: agent
description: "Criar um componente React seguindo o design system ONYX."
---

# Novo componente

Crie o componente `${input:nomeComponente:Nome do componente (ex.: ProgressRing)}` em `apps/web/src/components/`.

Diretrizes (veja [AGENTS.md](../../AGENTS.md)):

1. `React.FC` com `interface` de props tipada. Textos visíveis em **pt-BR**.
2. **Estilo:** use as CSS variables de [apps/web/src/index.css](../../apps/web/src/index.css) (cores, `--radius-*`, `--transition-*`). Não hardcode hex que já tenha token. Sem Tailwind/CSS-in-JS libs.
3. Ícones via `lucide-react` (já é dependência).
4. Mobile-first: o componente deve renderizar bem dentro de `--max-width: 480px`.
5. Se precisar de dados/estado global, receba via props ou use o hook `useWorkout()` — **não** acesse `localStorage` diretamente.
6. Sem novas dependências.

Padrões de referência: [apps/web/src/components/PlateVisualizer.tsx](../../apps/web/src/components/PlateVisualizer.tsx) e [apps/web/src/components/RestTimer.tsx](../../apps/web/src/components/RestTimer.tsx).

Valide com `npm run lint` e `npm run build` (sem imports/variáveis não usados).
