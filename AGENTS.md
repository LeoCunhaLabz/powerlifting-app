# AGENTS.md

Guia para agentes de codificação (e humanos) trabalharem nesta codebase. Leia antes de propor mudanças.

## O que é o projeto

App **mobile-first** de tracking de powerlifting em **React 19 + TypeScript + Vite**, totalmente **client-side** (sem backend). Estado global em React Context, persistido em `localStorage`. UI em **português (pt-BR)**.

## Comandos

```bash
npm install        # instalar dependências (Node 20+)
npm run dev        # dev server com HMR
npm run build      # tsc -b (type-check) + vite build
npm run preview    # servir o build de produção
npm run lint       # ESLint (flat config)
```

> Não há testes configurados. Não invente comandos de teste; valide com `npm run lint` e `npm run build`.

## Princípios

- **Escopo mínimo.** Faça apenas o que foi pedido. Não refatore, não adicione features ou dependências sem necessidade clara.
- **Sem novas dependências** a menos que essencial. Preferir solução com a stack atual (React + lucide-react + CSS puro).
- **Sem backend.** Não introduza chamadas de rede, APIs ou bibliotecas de servidor. A persistência é `localStorage`.
- **pt-BR na UI.** Textos visíveis ao usuário em português.
- **TypeScript strict.** `noUnusedLocals` e `noUnusedParameters` estão ativos — não deixe imports/variáveis sem uso.

## Arquitetura e convenções

### Navegação por abas (não há router)

A raiz [src/App.tsx](src/App.tsx) controla a aba atual via `useState<Tab>` e renderiza a página em `renderActiveTab()`. Abas válidas:

```
'dashboard' | 'workout' | 'templates' | 'analytics' | 'calculators' | 'settings'
```

Para **adicionar uma aba/página**:
1. Crie o componente em `src/pages/`.
2. Adicione o valor ao tipo `Tab`.
3. Adicione o `case` em `renderActiveTab()`.
4. Adicione o botão na `bottom-nav` (com ícone do `lucide-react` e label em pt-BR).

### Estado global — `WorkoutContext`

- Toda leitura/escrita de estado passa por [src/context/WorkoutContext.tsx](src/context/WorkoutContext.tsx) via o hook `useWorkout()`.
- **Não** acesse `localStorage` diretamente nos componentes; use as funções do contexto.
- Persistência é feita por `useEffect` que sincroniza o estado com as chaves:
  - `powerlifting_app_state`, `powerlifting_active_workout`, `powerlifting_rest_timer_end`.
- Ao expor nova funcionalidade de estado: adicione a função ao `WorkoutContextType`, implemente no provider e mantenha a persistência consistente.

### Tipos de domínio

Definidos em [src/types/workout.ts](src/types/workout.ts): `SetState`, `ExerciseState`, `WorkoutSession`, `TemplateExercise`, `WorkoutTemplate`, `Settings`, `AppState`. Reutilize esses tipos; não duplique shapes.

- `SetState.type`: `'W'` (warmup), `'N'` (normal/working), `'D'` (drop set).
- Pesos sempre numéricos na unidade corrente (`Settings.units`: `'kg' | 'lbs'`).

### Cálculos puros

Funções de cálculo ficam em [src/utils/powerlifting.ts](src/utils/powerlifting.ts) e devem ser **puras** (sem estado, sem efeitos colaterais). Convenções:
- Arredondamento: e1RM para 0,1; pontuações (Wilks/DOTS/IPF GL) para 0,01.
- Retorne `0` para entradas inválidas/zeradas em vez de lançar erro.
- Mantenha as tabelas/constantes (ex.: `RPE_PERCENTAGES`, `DEFAULT_PLATES_KG/LBS`) co-localizadas no arquivo.

### Estilo / design system "Chalk & Onyx"

- **CSS puro** em [src/index.css](src/index.css). Não introduza Tailwind, CSS-in-JS libs ou outros frameworks.
- Use as **CSS variables** existentes (cores, raios, transições). Não hardcode hex que já tenha token.
- Layout travado em `--max-width: 480px` (mobile-first). Componentes devem funcionar bem nessa largura.
- Estilos inline pontuais (objeto `styles`) são aceitáveis quando seguem o padrão já usado nos componentes.
- Ícones via `lucide-react`.

## Antes de finalizar

- [ ] `npm run lint` sem **novos** erros (se houver erros pré-existentes, trate em PR separado).
- [ ] `npm run build` passa (type-check incluso).
- [ ] Sem imports/variáveis não utilizados.
- [ ] Textos de UI em pt-BR.
- [ ] Nenhuma dependência nova desnecessária.

## Customizações de agente neste repo

- `.github/copilot-instructions.md` — instruções sempre ativas.
- `.github/prompts/` — prompts para tarefas comuns.
- `.github/agents/powerlifting-dev.agent.md` — agente especializado.
- `.github/skills/` — conhecimento de domínio (fórmulas, design system).
