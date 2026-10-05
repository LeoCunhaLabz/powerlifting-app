---
name: executar-issue
description: >-
  Implementa o escopo de uma issue já planejado/aprovado: cria o branch, commita em passos
  coerentes, valida build/lint/test e abre o PR com Closes #N. Use sempre que o usuário disser
  "executar issue #N", "implementar a issue", "fazer a issue", "pode codar", "mão na massa na #N"
  — ou seja, quando o plano já está definido e é hora de escrever o código. Execução direta e
  econômica; não reabre discussões de escopo.
---

# Executar a issue

Implemente o **escopo previamente combinado** (idealmente vindo de `planejar-issue`). Execução **direta e econômica**: siga o plano, sem reabrir discussões de escopo.

Issue: o argumento passado na invocação (`$ARGUMENTS`). Se vier vazio, pergunte qual issue executar.

Fonte da verdade das convenções: [AGENTS.md](../../../AGENTS.md) e [copilot-instructions.md](../../../.github/copilot-instructions.md).

## Regras de execução

- **Siga o escopo combinado.** Se surgir uma decisão nova e ambígua que **não** estava no plano, **pare e pergunte** — não improvise mudanças de escopo.
- **Escopo mínimo:** só o que o plano pede. Sem refactors, features ou dependências extras.
- **pt-BR** na UI; **TypeScript strict** (sem imports/variáveis não usados — `noUnusedLocals`/`noUnusedParameters` ativos).
- **Estado** só via `useWorkout()` (nunca `localStorage` direto); tipos via `@powerlifting/shared`; cálculos puros em `apps/web/src/utils/powerlifting.ts`; CSS puro com as variables de `apps/web/src/index.css` (design system ONYX, `--max-width: 480px`, ícones via `lucide-react`).
- **Interface:** se a issue toca `apps/web` ou `apps/landing`, invoque a skill `design-onyx` antes da primeira edição de UI (sem pedir ao usuário) e siga-a; ela diz quais skills de design usar e onde elas param.
- Para padrões de scaffolding, siga os guias existentes quando couber: [nova-pagina](../../../.github/prompts/nova-pagina.prompt.md), [novo-calculo](../../../.github/prompts/novo-calculo.prompt.md), [novo-componente](../../../.github/prompts/novo-componente.prompt.md).

## Passos

1. **Branch dedicado** a partir de `main`: `<type>/<N>-<resumo>` (ex.: `feat/7-api-fastify`, `fix/99-correcao-calculo`). Se houver mudanças não commitadas, confirme com o usuário antes. Marque a issue `status:em-andamento`:
   ```bash
   gh issue edit <N> --add-label status:em-andamento --remove-label status:aprovada
   ```
2. **Implementar** conforme o plano, em commits coerentes (um passo lógico por commit).
3. **Revisão de design** (só se tocou interface) — siga a §5 da skill `design-onyx`: `impeccable audit` na superfície alterada, `review-animations` se mexeu em movimento, `break-ui` se criou tela/componente com dados do usuário, `mobile-native` no app e screenshot no preview. Corrija o que for compatível com o ONYX numa rodada; o resto vai para a seção **Design** do PR.
4. **Validar — sem novos erros:**
   - `npm run build` (na raiz, type-check incluso)
   - `npm run lint`
   - Se a mudança tocar a API (`apps/api`): `npm run test:api`
   - Se tocar `apps/landing`, `powerlifting.ts` ou `strength.ts`: `npm run lint:landing`, `npm run check:landing`, `npm run test:landing`, `npm run build:landing`
5. **Manter docs em sincronia** no mesmo PR se a entrega mudar estrutura/comandos/caminhos: `AGENTS.md`, `.github/copilot-instructions.md`, `.github/{agents,prompts,skills}` e `.claude/skills` afetados. Se o design mudou (token, componente, regra visual), atualize também o `DESIGN.md` da superfície.
6. **Abrir o PR** com o template [PULL_REQUEST_TEMPLATE.md](../../../.github/PULL_REQUEST_TEMPLATE.md) e `Closes #N` no corpo. Empurrar e abrir PR é reversível — pode seguir sem pausa, salvo se o usuário pediu para revisar antes.

Ao terminar, resuma o que mudou, o resultado de `build`/`lint`(/`test:api`) e, se houve revisão de design, o que ela corrigiu e o que ficou registrado no PR. Se o objetivo é o fluxo completo, ofereça seguir para `finalizar-pr`.
