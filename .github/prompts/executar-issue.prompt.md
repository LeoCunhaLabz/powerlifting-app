---
description: "Implemente o escopo previamente aprovado (gerado por `/planejar-proxima-issue`). Siga o plano, crie branch, commite, valide build/lint, e prepare um PR. Use para 'executar issue #N', 'implementar...', 'fazer a issue'"
name: "Executar a issue aprovada"
argument-hint: "Número da issue aprovada"
agent: agent
---

# Executar a issue aprovada

Implemente o **escopo previamente aprovado** (gerado por `/planejar-proxima-issue`). Este prompt é para execução **direta e econômica**: siga o plano, sem reabrir discussões de escopo.

Issue: `${input:issue:Número da issue aprovada}`.

Fonte da verdade das convenções: [AGENTS.md](../../AGENTS.md) e [.github/copilot-instructions.md](../copilot-instructions.md).

## Regras de execução

- **Siga o escopo aprovado.** Se aparecer uma decisão nova e ambígua que **não** estava no plano, **pare e pergunte** — não improvise mudanças de escopo.
- **Escopo mínimo:** só o que o plano pede. Sem refactors, features ou dependências extras.
- **pt-BR** na UI; **TypeScript strict** (sem imports/variáveis não usados).
- **Estado** só via `useWorkout()` (nunca `localStorage` direto); tipos via `@powerlifting/shared`; cálculos puros em `apps/web/src/utils/powerlifting.ts`; CSS puro com variables de [apps/web/src/index.css](../../apps/web/src/index.css).
- Use os **agentes especializados** quando couber.
- **Interface:** se a issue toca `apps/web` ou `apps/landing`, leia e siga [.claude/skills/design-onyx/SKILL.md](../../.claude/skills/design-onyx/SKILL.md) antes de editar a UI (decisões do ONYX que vencem qualquer skill de design de terceiros).

## Passos

1. **Branch dedicado** a partir de `main`: `<type>/<N>-<resumo>`. Confirme comigo antes se houver mudanças não commitadas.
2. **Implementar** conforme o plano, em commits coerentes.
3. **Revisão de design** (só se tocou interface): siga a §5 da `design-onyx`. Corrija o que for compatível com o ONYX; o resto vai para a seção **Design** do PR.
4. **Validar:** rode `npm run build` (type-check incluso), `npm run lint` e `npm run test` — **sem novos erros**.
5. **Manter docs em sincronia** no mesmo PR se a entrega mudar estrutura/comandos/caminhos: `AGENTS.md`, `.github/copilot-instructions.md`, `.github/{agents,prompts,skills}`. Se o design mudou, atualize o `DESIGN.md` da superfície.
6. **PR:** use `.github/PULL_REQUEST_TEMPLATE.md`, com `Closes #N`. **Só empurre após meu ok.**

Ao terminar, resuma o que mudou e o resultado de `build`/`lint`.
