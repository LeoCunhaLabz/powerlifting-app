---
name: resolver-issue
description: >-
  Orquestrador end-to-end de uma issue: planeja → executa → abre PR → finaliza (gate de review
  do Copilot + rebase + squash merge), encadeando as skills planejar-issue, executar-issue e
  finalizar-pr. Para só nos 3 pontos de decisão (confirmar plano, comments duvidosos, aprovar
  merge); o resto roda sozinho. Use sempre que o usuário disser "resolver a issue #N do começo
  ao fim", "pega a próxima issue e resolve", "fluxo completo da issue", "toca a #N inteira",
  "resolve a issue ponta a ponta".
---

# Resolver a issue (end-to-end)

Conduz **uma issue do começo ao fim**, encadeando as três etapas num só comando, para o usuário não disparar cada skill manualmente. **Pausa apenas nos pontos de decisão**; o resto roda sozinho.

Alvo: o argumento passado na invocação (`$ARGUMENTS`) — número da issue, ou `próxima`/vazio para pegar a mais prioritária aprovada.

Fonte da verdade: [AGENTS.md](../../../AGENTS.md), [copilot-instructions.md](../../../.github/copilot-instructions.md) e o fluxo em [.github/prompts/README.md](../../../.github/prompts/README.md).

## Pontos de pausa (onde você PARA e pergunta)

1. **Confirmação do plano** — antes de escrever código.
2. **Comments duvidosos do Copilot** — qualquer coisa que mude escopo/comportamento ou exija decisão de design.
3. **Aprovação do merge** — sempre, antes do squash merge.

Fora desses três pontos (e de qualquer ambiguidade real que apareça), **siga sem pedir confirmação**.

## Pré-condição

A issue precisa estar **`status:aprovada`**. Se estiver em `status:triagem`/`status:bloqueada`, **pare e avise** — aprovar é decisão do usuário (ver [README.md](../../../.github/prompts/README.md)).

## Etapas

### 0. Selecionar a issue

- Número informado → use-o.
- `próxima`/vazio → pegue a **mais prioritária aprovada**:
  ```bash
  gh issue list --state open --label status:aprovada --search "sort:created-asc"
  ```
  Escolha o menor `p` (desempate por menor `esforco`), ignore `status:bloqueada`, e **confirme com o usuário qual issue** antes de planejar.

### 1. Planejar — invoque a skill `planejar-issue`

Leia a issue, desempacote o escopo e produza o plano técnico. **PAUSA 1:** leia o plano de volta e pergunte *"Posso implementar?"*. Só avance com o "ok".

### 2. Executar — invoque a skill `executar-issue`

Crie o branch `<type>/<N>-<resumo>` a partir de `main`, marque `status:em-andamento`, implemente o plano em commits coerentes, valide `npm run build` + `npm run lint` (+ `npm run test:api` se tocar a API), mantenha docs em sincronia e abra o PR com `Closes #N`. Empurrar/abrir PR é reversível — pode seguir sem pausa.

### 3. Finalizar — invoque a skill `finalizar-pr`

Aplique o **gate de review do Copilot** (espera curta: ~3 min → checa; se nada, +2 min → checa; se ainda nada, pula o gate e avisa). **Resolva os comments óbvios; PAUSA 2 nos duvidosos.** Revalide `build`/`lint`, rebaseie em `origin/main` e resolva conflitos, `git push --force-with-lease`. **PAUSA 3:** mostre o resumo (comments aplicados/pendentes/recusados, build/lint, estado do rebase, comando de merge) e pergunte *"Posso fazer o squash merge?"*. Após o "ok": `gh pr merge <N> --squash --delete-branch`, feche a issue via `Closes #N`, volte para `main` e `git pull`.

> Cada etapa tem sua própria skill com os detalhes completos — invoque-as via a ferramenta Skill (`planejar-issue`, `executar-issue`, `finalizar-pr`) e siga as instruções de cada uma. Esta skill é a casca que encadeia tudo e garante as 3 pausas.

## Ao terminar

Reporte de forma enxuta: issue resolvida, PR mergeado, comments tratados, `build`/`lint` ok. Se sobraram pendências (comment recusado, follow-up), liste-as. Se o usuário pediu `próxima`, ofereça seguir para a próxima issue aprovada.
