---
description: "Orquestrador end-to-end de uma issue: planeja → executa → abre PR → finaliza (review do Copilot + rebase + squash merge). Encadeia /planejar-proxima-issue, /executar-issue e /finalizar-pr, parando só nos pontos de decisão (confirmar plano, comments duvidosos, aprovar merge). Use para 'resolver a issue #N do começo ao fim', 'pega a próxima issue e resolve', 'fluxo completo da issue'."
name: "Resolver a issue (end-to-end)"
argument-hint: "Número da issue, ou 'próxima' para pegar a mais prioritária aprovada"
agent: agent
---

# Resolver a issue (end-to-end)

Conduz **uma issue do começo ao fim**, encadeando as três etapas do fluxo num só comando, para você não ter que disparar cada prompt manualmente a cada issue. **Pausa apenas nos pontos de decisão**; o resto roda sozinho.

Alvo: `${input:issue:Número da issue, ou 'próxima' para pegar a mais prioritária aprovada}`.

Fonte da verdade: [AGENTS.md](../../AGENTS.md), [.github/copilot-instructions.md](../copilot-instructions.md) e o fluxo em [README.md](README.md).

## Pontos de pausa (onde eu PARO e pergunto)

1. **Confirmação do plano** — antes de escrever código.
2. **Comments duvidosos do Copilot** — qualquer coisa que mude escopo/comportamento ou exija decisão de design.
3. **Aprovação do merge** — sempre, antes do squash merge.

Fora desses três pontos (e de qualquer ambiguidade real que apareça), **siga sem pedir confirmação**.

## Pré-condição

A issue precisa estar **`status:aprovada`**. Se estiver em `status:triagem`/`status:bloqueada`, **pare e avise** — aprovar é decisão sua (ver [README.md](README.md#como-aprovar-uma-issue)).

## Etapas

### 0. Selecionar a issue

- Número informado → use-o.
- `próxima` (ou vazio) → pegue a **mais prioritária aprovada**:
  ```bash
  gh issue list --state open --label status:aprovada --search "sort:created-asc"
  ```
  Escolha o menor `p` (desempate por menor `esforco`), ignore `status:bloqueada`, e **confirme comigo qual issue** antes de planejar.

### 1. Planejar — segue [`/planejar-proxima-issue`](planejar-proxima-issue.prompt.md)

Leia a issue, desempacote o escopo e produza o plano técnico (arquivos, funções, tarefas verificáveis). **PAUSA 1:** leia o plano de volta e pergunte *"Posso implementar?"*. Só avance com o ok.

### 2. Executar — segue [`/executar-issue`](executar-issue.prompt.md)

- Branch `<type>/<N>-<resumo>` a partir de `main`; marque `status:em-andamento`.
- Implemente o plano em commits coerentes (use os atalhos `/nova-pagina`, `/novo-calculo`, `/novo-componente` e os agentes especializados quando couber).
- Valide `npm run build` + `npm run lint` (sem novos erros).
- Mantenha docs em sincronia se estrutura/comandos/caminhos mudarem.
- Abra o PR com [PULL_REQUEST_TEMPLATE.md](../PULL_REQUEST_TEMPLATE.md) e `Closes #N`. (Empurrar/abrir PR é local/reversível; pode seguir sem pausa.)

### 3. Finalizar — segue [`/finalizar-pr`](finalizar-pr.prompt.md)

- Busque os review comments do **Copilot**; **resolva os óbvios**, **PAUSA 2** nos duvidosos.
- Aplique o **gate de review do Copilot**: espera ativa por comments (checagens em ciclo por até 20 min após último push). Se não vier nada nesse período, pause e peça decisão explícita para seguir sem review do Copilot.
- Revalide `build` + `lint`; rebaseie em `origin/main` e resolva conflitos; `git push --force-with-lease`.
- **PAUSA 3:** mostre o resumo (comments aplicados/pendentes/recusados, build/lint, estado do rebase, comando de merge) e pergunte *"Posso fazer o squash merge?"*.
- Após o ok: `gh pr merge <N> --squash --delete-branch`, feche a issue via `Closes #N`, volte para `main` e `git pull`.

## Ao terminar

Reporte de forma enxuta: issue resolvida, PR mergeado, comments tratados, `build`/`lint` ok. Se sobraram pendências (comment recusado, follow-up), liste-as. Se eu pedi `próxima`, ofereça seguir para a próxima issue aprovada.
