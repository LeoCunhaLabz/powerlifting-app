# Instruções do Copilot — Powerlifting App

App de tracking de powerlifting em **React 19 + TypeScript + Vite**, **100% client-side** (sem backend), com estado em React Context persistido em `localStorage`. UI em **português (pt-BR)**.

Consulte [AGENTS.md](../AGENTS.md) para o guia completo.

## Regras essenciais

- **Escopo mínimo:** implemente apenas o solicitado; não refatore nem adicione features fora do pedido.
- **Sem novas dependências** sem necessidade clara. Stack atual: React, `lucide-react`, CSS puro.
- **Sem backend / sem rede:** persistência é `localStorage`, sempre via o hook `useWorkout()` (não acesse `localStorage` direto nos componentes).
- **TypeScript strict:** sem imports/variáveis não usados (`noUnusedLocals`/`noUnusedParameters` ativos).
- **UI em pt-BR.**

## Padrões

- **Navegação por abas** em [src/App.tsx](../src/App.tsx) (sem React Router). Nova página = componente em `src/pages/` + valor no tipo `Tab` + `case` em `renderActiveTab()` + botão na `bottom-nav`.
- **Estado** em [src/context/WorkoutContext.tsx](../src/context/WorkoutContext.tsx); tipos em [src/types/workout.ts](../src/types/workout.ts).
- **Cálculos puros** em [src/utils/powerlifting.ts](../src/utils/powerlifting.ts) (e1RM arredonda 0,1; pontuações 0,01; retornam `0` para entrada inválida).
- **Estilo:** CSS puro com as variables de [src/index.css](../src/index.css) (tema "Chalk & Onyx", `--max-width: 480px`). Sem Tailwind/CSS-in-JS. Ícones via `lucide-react`.

## Validação

Antes de concluir: `npm run lint` e `npm run build` devem passar. Não há framework de testes.
