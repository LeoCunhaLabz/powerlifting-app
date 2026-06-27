---
agent: agent
description: "Criar uma nova página/aba seguindo o padrão de navegação do App.tsx (sem React Router)."
---

# Nova página (aba)

Crie uma nova aba/página chamada `${input:nomePagina:Nome da página (ex.: Nutrição)}`.

Siga exatamente o padrão da codebase (veja [AGENTS.md](../../AGENTS.md)):

1. Crie o componente em `apps/web/src/pages/` como um `React.FC`, com textos em **pt-BR**.
2. Em [apps/web/src/App.tsx](../../apps/web/src/App.tsx):
   - Adicione o novo valor ao tipo `Tab`.
   - Importe o componente.
   - Adicione o `case` correspondente em `renderActiveTab()`.
   - Adicione um botão na `bottom-nav` com um ícone do `lucide-react` e label curto em pt-BR.
3. Para ler/escrever estado, use o hook `useWorkout()` — **não** acesse `localStorage` diretamente.
4. Estilize com as CSS variables de [apps/web/src/index.css](../../apps/web/src/index.css) (design system ONYX); respeite `--max-width: 480px`. Sem novas dependências.

Ao final, garanta que `npm run lint` e `npm run build` passam (sem imports/variáveis não usados).
