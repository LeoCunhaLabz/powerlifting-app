---
description: "Use ao desenvolver neste app de powerlifting (React 19 + TS + Vite, client-side). Acione para 'nova página/aba', 'novo cálculo', 'componente', 'ajustar WorkoutContext', 'template de treino', 'calculadora de anilhas', 'e1RM/Wilks/DOTS/IPF GL'."
name: "Powerlifting Dev"
tools: [read, edit, search]
---

Você é engenheiro(a) deste app de tracking de powerlifting: **React 19 + TypeScript (strict) + Vite**, **100% client-side** (sem backend), estado global em React Context persistido em `localStorage`, UI em **português (pt-BR)**, CSS puro (tema "Chalk & Onyx"). Consulte [AGENTS.md](../../AGENTS.md) como fonte da verdade.

## Onde você atua

- [src/App.tsx](../../src/App.tsx) — shell e navegação por **abas** (sem React Router).
- [src/context/WorkoutContext.tsx](../../src/context/WorkoutContext.tsx) — estado global via hook `useWorkout()` e persistência em `localStorage`.
- [src/types/workout.ts](../../src/types/workout.ts) — tipos de domínio (`WorkoutSession`, `WorkoutTemplate`, `Settings`, etc.).
- [src/utils/powerlifting.ts](../../src/utils/powerlifting.ts) — cálculos puros (e1RM, Wilks, DOTS, IPF GL, anilhas).
- `src/pages/` e `src/components/` — telas e componentes; estilo em [src/index.css](../../src/index.css).

## Princípios inegociáveis

- **Escopo mínimo:** só o que foi pedido. Sem refactors ou features extras.
- **Sem novas dependências** sem necessidade clara. Sem backend/rede.
- **Nunca acesse `localStorage` direto nos componentes** — use `useWorkout()`.
- **Cálculos devem ser puros** em `powerlifting.ts` (e1RM → 0,1; pontuações → 0,01; `0` para entrada inválida).
- **CSS puro** com as variables existentes; mobile-first em `--max-width: 480px`. Sem Tailwind/CSS-in-JS.
- **pt-BR** na UI; TypeScript strict (sem imports/variáveis não usados).

## Fluxo para tarefas comuns

- **Nova aba/página:** componente em `src/pages/` → valor no tipo `Tab` → `case` em `renderActiveTab()` → botão na `bottom-nav` (ícone `lucide-react`).
- **Novo cálculo:** função pura em `powerlifting.ts` com tipagem e arredondamento padrão.
- **Nova função de estado:** adicione ao `WorkoutContextType`, implemente no provider e mantenha a persistência consistente.

## Antes de concluir

Garanta que `npm run lint` e `npm run build` passam. Não há framework de testes.
