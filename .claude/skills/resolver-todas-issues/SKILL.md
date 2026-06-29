---
name: resolver-todas-issues
description: >-
  Processa em lote TODA a fila de issues status:aprovada, uma por vez, em ordem de prioridade,
  resolvendo cada uma ponta a ponta (planejar → executar → PR → gate Copilot → rebase). Roda de
  forma semi-autônoma: a ÚNICA pausa por issue é aprovar o squash merge. Use sempre que o usuário
  disser "resolver todas as issues", "limpar a fila de issues", "resolver o backlog aprovado",
  "tocar todas as issues aprovadas", "resolver tudo em sequência" — quando ele quer processar
  várias issues sem disparar o fluxo de cada uma na mão.
---

# Resolver todas as issues (lote semi-autônomo)

Processa **toda a fila `status:aprovada`** em sequência, resolvendo cada issue ponta a ponta com a skill `resolver-issue`, mas **operando em lote**: o objetivo é juntar o trabalho repetitivo e te incomodar o mínimo possível. **A única pausa por issue é a aprovação do merge.**

Argumentos (`$ARGUMENTS`), todos opcionais e combináveis:
- **Limite** — um número (ex.: `5`) processa só as N mais prioritárias. Vazio = todas as aprovadas.
- **`--auto-merge`** — desliga a pausa de merge: mergeia cada issue sozinho, sem pedir "ok". É o modo **totalmente autônomo** (mais rápido, mais arriscado). Sem essa flag, vale o padrão semi-autônomo (pausa por merge). Ex.: `5 --auto-merge`.

Fonte da verdade: [AGENTS.md](../../../AGENTS.md), [copilot-instructions.md](../../../.github/copilot-instructions.md) e [.github/prompts/README.md](../../../.github/prompts/README.md).

## Como o lote difere de resolver uma issue

A skill [`resolver-issue`](../resolver-issue/SKILL.md) tem 3 pausas (plano · comments duvidosos · merge). Em lote, para não parar toda hora:

- **Plano — NÃO pausa.** Planeje internamente (escopo, arquivos, tarefas) e siga direto para a execução. Registre o plano no resumo da issue, mas não peça confirmação.
- **Comments duvidosos do Copilot — NÃO pausa no meio.** Não aplique comments duvidosos sozinho; **liste-os** e leve-os para o resumo da pausa de merge daquela issue, onde o usuário decide tudo de uma vez.
- **Merge — PAUSA (única).** Sempre apresente o resumo da issue e espere o "ok" antes do `gh pr merge --squash`. **Nunca** mergeie sem aprovação — **exceto** se `--auto-merge` foi passado, caso em que você apresenta o mesmo resumo (para o registro) mas mergeia direto, sem esperar o "ok".

## Resiliência (não trave o lote)

- Se uma issue **falhar** (build/lint quebrado que você não resolve, conflito de rebase ambíguo, ambiguidade de escopo real, `gh` indisponível): **não trave o lote inteiro.** Pare aquela issue num estado seguro (branch/PR como estiver), registre o motivo, e **siga para a próxima**.
- Se o usuário **recusar um merge** ou pedir mudanças: deixe o PR aberto, anote, e siga para a próxima issue.
- Issues `status:bloqueada` (`Depende de: #M`) ficam **fora da fila** até a dependência fechar.

## Passos

### 0. Montar a fila

```bash
gh issue list --state open --label status:aprovada --search "sort:created-asc"
```
Ordene por menor `p` (desempate por menor `esforco`), remova as `status:bloqueada`. Se veio um limite em `$ARGUMENTS`, corte a fila nas N primeiras. **Mostre a fila ao usuário** (ordem e quantidade) antes de começar — é a única confirmação inicial.

### 1. Para cada issue da fila, em ordem

Resolva-a seguindo a skill `resolver-issue`, mas com as regras de lote acima:

1. **Planejar** (sem pausa) — invoque/siga `planejar-issue`, registre o plano, siga direto.
2. **Executar** (sem pausa) — invoque/siga `executar-issue`: branch `<type>/<N>-<resumo>` a partir de `main`, `status:em-andamento`, commits coerentes, `npm run build` + `npm run lint` (+ `npm run test:api` se tocar a API), docs em sincronia, PR com `Closes #N`.
3. **Finalizar** — invoque/siga `finalizar-pr`: gate do Copilot (espera curta ~3 min → +2 min → pula e avisa), aplique os comments **óbvios**, junte os **duvidosos** para o resumo, revalide `build`/`lint`, rebaseie em `origin/main`, resolva conflitos, `git push --force-with-lease`.
4. **PAUSA (merge)** — apresente o resumo da issue: comments aplicados / duvidosos a decidir / recusados · `build`/`lint` · estado do rebase · comando de merge. Pergunte: **"Posso mergear a #N?"** (Com `--auto-merge`: apresente o mesmo resumo e siga direto, sem perguntar.)
5. Após o "ok" (ou direto, se `--auto-merge`): `gh pr merge <N> --squash --delete-branch` (`Closes #N` fecha a issue), volte para `main` e `git pull` **antes de começar a próxima issue** (cada uma parte de uma `main` atualizada).

> Importante: sempre `git checkout main && git pull` entre uma issue e a próxima, para que branches subsequentes não nasçam de uma `main` desatualizada.

## Ao terminar o lote

Apresente um **placar final**, uma linha por issue:

```
#123  ✅ mergeada            feat/123-... 
#124  ⏸️  PR aberto (merge recusado)   fix/124-...
#125  ⚠️  pulada — conflito de rebase   <motivo>
#126  ✅ mergeada            chore/126-...
```

Some o total (mergeadas / pendentes / puladas) e liste os follow-ups que ficaram (comments recusados, issues puladas e o porquê).
