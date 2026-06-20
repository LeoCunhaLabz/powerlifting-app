---
mode: agent
description: "Adicionar uma nova função de cálculo pura em src/utils/powerlifting.ts."
---

# Novo cálculo de powerlifting

Implemente o cálculo: `${input:descricao:Descreva o cálculo (ex.: coeficiente Schwartz/Malone)}`.

Regras (veja [AGENTS.md](../../AGENTS.md)):

1. Implemente em [src/utils/powerlifting.ts](../../src/utils/powerlifting.ts) como uma **função pura** (sem estado, sem efeitos colaterais, sem rede).
2. Tipagem explícita de parâmetros e retorno (`number`). Reutilize tipos de [src/types/workout.ts](../../src/types/workout.ts) quando aplicável.
3. Convenções de arredondamento existentes: e1RM → 0,1; pontuações → 0,01 (`Math.round(x * 100) / 100`).
4. Retorne `0` para entradas inválidas/zeradas (não lance erro).
5. Co-localize constantes/tabelas necessárias no próprio arquivo, no estilo de `RPE_PERCENTAGES` e `DEFAULT_PLATES_KG`.
6. Adicione um comentário curto citando a fonte/fórmula.
7. Se for exibir o resultado, faça em uma página existente (provavelmente [src/pages/Calculators.tsx](../../src/pages/Calculators.tsx)) usando o design system.

Valide com `npm run lint` e `npm run build`. Não adicione dependências.
