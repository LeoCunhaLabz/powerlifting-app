---
description: "Implemente o escopo previamente aprovado (gerado por `/planejar-proxima-issue`). Siga o plano, crie branch, commite, valide build/lint, e prepare um PR. Use para 'executar issue #N', 'implementar...', 'fazer a issue'"
name: "Executar a issue aprovada"
argument-hint: "Número da issue aprovada"
agent: powerlifting-dev
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

## Passos

1. **Branch dedicado** a partir de `main`: `<type>/<N>-<resumo>`. Confirme comigo antes se houver mudanças não commitadas.
2. **Implementar** conforme o plano, em commits coerentes.
3. **Validar:** rode `npm run build` (type-check incluso) e `npm run lint` — **sem novos erros**. Não há testes.
4. **Manter docs em sincronia** no mesmo PR se a entrega mudar estrutura/comandos/caminhos: `AGENTS.md`, `.github/copilot-instructions.md`, `.github/{agents,prompts,skills}`.
5. **PR:** use `.github/PULL_REQUEST_TEMPLATE.md`, com `Closes #N`. **Só empurre após meu ok.**

Ao terminar, resuma o que mudou e o resultado de `build`/`lint`.
