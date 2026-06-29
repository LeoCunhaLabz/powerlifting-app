---
name: finalizar-pr
description: >-
  Fecha o ciclo de um PR aberto: aplica o gate de review do GitHub Copilot (espera curta por
  comments), resolve os óbvios e pergunta nos duvidosos, revalida build/lint, faz rebase em main
  e — só após o "ok" do usuário — faz squash merge e apaga o branch. Use sempre que o usuário
  disser "finalizar PR", "resolver os comments e mergear", "fechar a issue #N", "pode mergear",
  "trata o review e sobe". Nunca mergeia sem aprovação explícita.
---

# Finalizar o PR (review + merge)

Fecha a **última etapa** do ciclo: trata os review comments, sincroniza com `main` e mergeia. Automatiza o que era feito à mão **depois** que o PR sobe.

Alvo: o argumento passado na invocação (`$ARGUMENTS`) — número do PR ou da issue. Vazio = PR do branch atual.

Fonte da verdade: [AGENTS.md](../../../AGENTS.md) e [copilot-instructions.md](../../../.github/copilot-instructions.md).

## Regras inegociáveis

- **Pausa obrigatória antes do merge.** Resolve comments, valida, rebaseia e resolve conflitos; então **apresenta um resumo e espera o "ok" do usuário** para o squash merge. **Nunca** mergeie sem aprovação explícita.
- **Comments do Copilot — resolver os óbvios, perguntar nos duvidosos:**
  - **Óbvio** (aplicar direto): bug claro, typo, edge case não tratado, violação evidente das convenções do projeto, sugestão de baixo risco e dentro do escopo.
  - **Duvidoso** (parar e perguntar): muda escopo/comportamento, é preferência/estilo discutível, exige decisão de design, ou conflita com `AGENTS.md`/escopo mínimo. **Não** aplique sozinho — liste e pergunte.
  - Comments que você **discordar** com fundamento (falso positivo, fere escopo mínimo): não aplique; explique o porquê no resumo e, se útil, responda na thread.
- **Escopo mínimo.** Só mexa no que o comment pede.
- **pt-BR** na UI; **TS strict**; estado via `useWorkout()`; tipos via `@powerlifting/shared`; cálculos em `powerlifting.ts`; CSS com as variables de `apps/web/src/index.css`.

## Passos

1. **Identificar o PR.**
   - Número → descubra se é PR ou issue (`gh pr view <N>` / `gh issue view <N>`). Se for issue, ache o PR com `Closes #N`: `gh pr list --search "<N> in:body" --state open`.
   - Vazio → use o PR do branch atual: `gh pr view --json number,headRefName,title,url`.
   - Confirme branch, número do PR e issue vinculada antes de prosseguir.

2. **Gate de review do Copilot (espera curta).** Depois que o PR está aberto/atualizado:
   1. **Espere ~3 minutos** e então busque os comments do Copilot:
      ```bash
      sleep 180
      gh pr view <N> --json reviews,comments,reviewThreads
      gh api repos/{owner}/{repo}/pulls/<N>/comments
      ```
      Filtre os autorados pelo bot de review do Copilot (login casando com `/copilot/i`, ex.: `copilot-pull-request-reviewer[bot]`).
   2. **Se houver comments do Copilot** → vá para o passo 3 (triagem).
   3. **Se não houver** → espere **+2 minutos** (`sleep 120`) e cheque de novo.
   4. **Se ainda assim não houver** → **pule o gate**, avise o usuário ("nenhum review do Copilot apareceu em ~5 min; seguindo sem ele") e vá para a validação/rebase.
   - Se o `gh` não estiver disponível/autenticado, pare e peça os comments (ou um print), avisando que seguiu só com o que recebeu.
   - Nota: a espera (`sleep`) ocupa a sessão. Se o ambiente bloquear `sleep` em primeiro plano, faça a checagem em ciclos curtos com o mecanismo de espera disponível, respeitando a mesma janela (~3 min → +2 min → pular).

3. **Triar cada comment** em **óbvio** vs **duvidoso**. Monte uma lista curta:
   - `✅ aplicar` — o que vou corrigir e onde.
   - `❓ perguntar` — o que precisa de decisão (com sua recomendação).
   - `🚫 não aplicar` — falso positivo / fora de escopo, com justificativa.

4. **Aplicar os óbvios** em commits coerentes. **Parar e perguntar** nos duvidosos antes de mexer neles.

5. **Validar — sem novos erros:** `npm run build` (type-check incluso) e `npm run lint`. Se tocou a API: `npm run test:api`.

6. **Empurrar as correções** para o branch do PR. Se útil, responda/resolva as threads tratadas para o PR ficar limpo.

7. **Sincronizar com `main`:** `git fetch origin` e **rebase** em `origin/main`. Resolva conflitos preservando a intenção das duas pontas (não descarte trabalho alheio). Rode `build` + `lint` de novo após resolver. Empurre com `git push --force-with-lease` (nunca `--force` puro).

8. **PAUSA — resumo para aprovação.** Apresente: comments aplicados/pendentes/recusados · resultado de `build`/`lint` · estado do rebase (limpo ou conflitos resolvidos) · o comando de merge que vai rodar. Pergunte: **"Posso fazer o squash merge?"**

9. **Após o "ok": squash merge + limpeza.**
   ```bash
   gh pr merge <N> --squash --delete-branch \
     --subject "<type>(escopo): <resumo> (#N)" \
     --body "Closes #<issue>"
   ```
   - O `Closes #N` fecha a issue. Ajuste labels se necessário (`gh issue edit <issue> --remove-label status:em-andamento`).
   - Volte para `main` e `git pull` para deixar o repo limpo.

## Saída esperada

Reporte enxuto: PR e issue tratados · comments aplicados/pendentes/recusados · `build`/`lint` ok · rebase limpo / conflitos resolvidos · confirmação do merge (ou o ponto exato em que está aguardando sua decisão).
